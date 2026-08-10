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

    // 2. Definir o conteúdo do e-mail conforme o segmento
    let assunto = ''
    let mensagemHtml = ''

    if (segmento === 'leitor') {
      assunto = '📚 Seu E-book Grátis de Leitor chegou!'
      mensagemHtml = `
        <h2>Olá! Que bom ter você por aqui.</h2>
        <p>Conforme prometido, aqui está o link para baixar o seu e-book exclusivo:</p>
        <p><a href="https://vitrine-ebooks.vercel.app" style="background:#ea580c;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;">Baixar E-book de Leitores</a></p>
        <p>Bom proveito da leitura!</p>
      `
    } else {
      assunto = '🚀 Seu Guia de Anúncios e Vendas chegou!'
      mensagemHtml = `
        <h2>Olá, futuro parceiro!</h2>
        <p>Aqui está o seu material estratégico para destacar suas obras em nossa vitrine:</p>
        <p><a href="https://vitrine-ebooks.vercel.app" style="background:#ea580c;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;">Baixar Guia para Anunciantes</a></p>
        <p>Bons negócios e ótimas vendas!</p>
      `
    }

    // 3. Enviar o e-mail via SMTP configurado
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