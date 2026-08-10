import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_EMAIL || process.env.SMTP_USER,
    pass: process.env.GMAIL_SENHA || process.env.SMTP_PASS,
  },
})

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

    if (dbError) {
      console.error('Erro no Supabase:', dbError)
      throw new Error('Erro ao salvar no banco de dados')
    }

    // 2. Buscar dinamicamente as configurações do popup/e-mail no banco
    const { data: config } = await supabase
      .from('popup_configs')
      .select('*')
      .eq('segmento', segmento)
      .single()

    // Valores padrão de segurança caso a tabela não tenha registros
    let assunto = config?.email_assunto || (segmento === 'leitor' ? '📚 Seu E-book Grátis chegou!' : '🚀 Seu Guia de Anúncios chegou!')
    let ebookLink = config?.ebook_link || 'https://vitrine-ebooks.vercel.app'
    let textoBotao = config?.email_botao_texto || 'Baixar Material'
    let corpoEmail = config?.email_corpo || '<p>Olá! Aqui está o seu material exclusivo:</p><p>[BOTAO]</p>'

    // 3. Montar o botão HTML customizado com o link e o texto configurados no admin
    const botaoHtml = `
      <a href="${ebookLink}" target="_blank" style="background:#ea580c;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold;font-family:sans-serif;">
        ${textoBotao}
      </a>
    `

    // Substitui a tag [BOTAO] pelo botão real no texto do e-mail
    const mensagemHtml = corpoEmail.replace('[BOTAO]', botaoHtml)

    // 4. Enviar o e-mail via SMTP configurado
    await transporter.sendMail({
      from: `"Vitrine de E-books" <${process.env.GMAIL_EMAIL || process.env.SMTP_USER}>`,
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