import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    // 1. O motor acorda e busca as senhas na nova tabela 'configuracoes'
    const { data: config, error: configError } = await supabase
      .from('configuracoes')
      .select('*')
      .eq('id', 1)
      .single()

    if (configError || !config) {
      return NextResponse.json({ error: 'Configurações de SMTP não encontradas no banco.' }, { status: 400 })
    }

    // 2. Puxa um pequeno lote de e-mails da fila (5 por vez para não sobrecarregar)
    const { data: fila, error: filaError } = await supabase
      .from('fila_envios')
      .select('*')
      .eq('status', 'pendente')
      .limit(5)

    if (filaError || !fila || fila.length === 0) {
      return NextResponse.json({ message: 'Fila limpa. Nenhum e-mail pendente.' }, { status: 200 })
    }

    let enviados = 0

    // 3. O Loop de Disparo
    for (const item of fila) {
      try {
        let transporter;
        let remetente;

        // VERIFICAÇÃO DE ROTA: Gmail ou SMTP Externo?
        if (item.provedor === 'externo') {
          transporter = nodemailer.createTransport({
            host: config.smtp_host,
            port: Number(config.smtp_port),
            secure: Number(config.smtp_port) === 465, // True apenas se for porta 465
            auth: {
              user: config.smtp_user,
              pass: config.smtp_pass,
            },
            // BLINDAGEM TLS ATIVADA: Ignora bloqueios de certificado do servidor
            tls: {
              rejectUnauthorized: false 
            }
          })
          remetente = config.smtp_user
        } else {
          // Rota Padrão: Gmail
          transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: config.gmail_email,
              pass: config.gmail_senha,
            },
          })
          remetente = config.gmail_email
        }

        // 4. Montagem e Envio Real
        await transporter.sendMail({
          from: `"Sistema Automático" <${remetente}>`,
          to: item.email,
          subject: item.assunto,
          html: `
            <div style="font-family: sans-serif; color: #333; max-w: 600px; margin: 0 auto;">
              <p>${item.mensagem}</p>
              ${item.url_botao ? `
                <br>
                <a href="${item.url_botao}" style="display: inline-block; padding: 14px 28px; background-color: #059669; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  ${item.texto_botao || 'Acessar Material'}
                </a>
              ` : ''}
            </div>
          `,
        })

        // 5. Sucesso! Muda o status na fila
        await supabase.from('fila_envios').update({ status: 'enviado' }).eq('id', item.id)
        enviados++

        // Pausa de 1 segundo entre envios para o servidor não bloquear por spam
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (err) {
        console.error(`Falha ao enviar para ${item.email}:`, err)
        // Se a senha estiver errada ou a porta bloqueada, marca o erro
        await supabase.from('fila_envios').update({ status: 'erro' }).eq('id', item.id)
      }
    }

    return NextResponse.json({ success: true, message: `${enviados} e-mails processados.` }, { status: 200 })

  } catch (error) {
    console.error('Erro catastrófico no motor:', error)
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}