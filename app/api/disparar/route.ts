export const dynamic = 'force-dynamic' // 👈 A CHAVE PARA DESTRAVAR O CACHE DO VERCEL

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    const { data: config, error: configError } = await supabase.from('configuracoes').select('*').eq('id', 1).single()

    if (configError || !config) {
      return NextResponse.json({ error: 'Configurações de SMTP não encontradas no banco.' }, { status: 400 })
    }

    const { data: fila, error: filaError } = await supabase.from('fila_envios').select('*').eq('status', 'pendente').limit(5)

    if (filaError || !fila || fila.length === 0) {
      return NextResponse.json({ message: 'Fila limpa. Nenhum e-mail pendente.' }, { status: 200 })
    }

    let enviados = 0
    let laudoMedico = null; 

    for (const item of fila) {
      try {
        let transporter;
        let remetente;

        if (item.provedor === 'externo') {
          transporter = nodemailer.createTransport({
            host: config.smtp_host,
            port: Number(config.smtp_port),
            secure: Number(config.smtp_port) === 465,
            auth: {
              user: config.smtp_user, 
              pass: config.smtp_pass,
            },
            tls: { rejectUnauthorized: false }
          })
          
          // Agora o Vercel é obrigado a ler isso atualizado do banco!
          remetente = config.smtp_remetente || config.smtp_user 
          
        } else {
          transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: config.gmail_email,
              pass: config.gmail_senha,
            },
          })
          remetente = config.gmail_email
        }

        await transporter.sendMail({
          from: `"Vitrine E-books" <${remetente}>`,
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

        await supabase.from('fila_envios').update({ status: 'enviado' }).eq('id', item.id)
        enviados++
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (err: any) {
        console.error(`Falha ao enviar para ${item.email}:`, err)
        await supabase.from('fila_envios').update({ status: 'erro' }).eq('id', item.id)
        
        laudoMedico = {
            motivo: err.message,
            codigo_de_erro: err.code,
            comando_rejeitado: err.command
        }
        break; 
      }
    }

    if (laudoMedico) {
        return NextResponse.json({ 
            sucesso: false, 
            alerta: "O SERVIDOR EXTERNO BLOQUEOU O ENVIO. VEJA O MOTIVO ABAIXO:", 
            LAUDO_MEDICO: laudoMedico 
        }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: `${enviados} e-mails processados.` }, { status: 200 })

  } catch (error) {
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}