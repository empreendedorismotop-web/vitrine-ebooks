import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: Request) {
  try {
    const { email, whatsapp, segmento } = await req.json()

    if (!email || !whatsapp || !segmento) {
      return NextResponse.json({ error: 'Preencha todos os campos' }, { status: 400 })
    }

    // 1. Salvar ou atualizar o lead no Supabase
    const { error: dbError } = await supabase
      .from('leads')
      .upsert({ email, whatsapp, segmento, updated_at: new Date() }, { onConflict: 'email' })

    if (dbError) throw new Error('Erro ao salvar no banco de dados')

    // 2. Buscar configurações ATIVAS no banco (Textos e Provedor)
    const { data: configSistema } = await supabase.from('configuracoes').select('*').eq('id', 1).single()
    const { data: configPopup } = await supabase.from('popup_configs').select('*').eq('segmento', segmento).single()

    // Seleciona o Transportador correto com base na sua escolha no Admin
    const provedorAtivo = configSistema?.provedor_ativo || 'gmail'
    let transporter;
    let emailRemetente = '';

    if (provedorAtivo === 'externo') {
      transporter = nodemailer.createTransport({
        host: configSistema.smtp_host,
        port: Number(configSistema.smtp_port),
        secure: Number(configSistema.smtp_port) === 465,
        auth: { user: configSistema.smtp_user, pass: configSistema.smtp_pass }
      })
      emailRemetente = configSistema.smtp_remetente
    } else {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: configSistema.gmail_email, pass: configSistema.gmail_senha }
      })
      emailRemetente = configSistema.gmail_email
    }

    // 3. Montar o texto
    let assunto = configPopup?.email_assunto || 'Seu Material Chegou!'
    let ebookLink = configPopup?.ebook_link || 'https://vitrine-ebooks.vercel.app'
    let textoBotao = configPopup?.email_botao_texto || 'Baixar Material'
    let corpoEmail = configPopup?.email_corpo || '<p>Aqui está o seu material:</p><p>[BOTAO]</p>'

    const botaoHtml = `<a href="${ebookLink}" target="_blank" style="background:#ea580c;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold;font-family:sans-serif;">${textoBotao}</a>`
    
    // Insere o Botão e o Link de Descadastro
    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://vitrine-ebooks.vercel.app').replace(/\/$/, '')
    const linkDescadastro = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(email)}`
    
    let mensagemHtml = corpoEmail.replace('[BOTAO]', botaoHtml)
    mensagemHtml += `<br><br><hr style="border:none; border-top:1px solid #e2e8f0; margin:30px 0;"><p style="font-size:12px; color:#94a3b8; font-family:sans-serif;">Caso não queira mais receber nossos avisos e e-books gratuitos, você pode <a href="${linkDescadastro}" style="color:#64748b;">se descadastrar clicando aqui</a>.</p>`

    // 4. Enviar o e-mail
    await transporter.sendMail({
      from: `"Vitrine de E-books" <${emailRemetente}>`,
      to: email,
      subject: assunto,
      html: mensagemHtml,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro no processo de captura:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}