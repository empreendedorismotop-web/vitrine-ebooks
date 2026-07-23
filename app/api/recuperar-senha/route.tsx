import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { email, origin } = await request.json()

    // 1. Usa a URL real que o navegador enviou no clique (100% à prova de falhas)
    const baseUrl = origin || 'http://localhost:3000'

    // 2. Conecta no Supabase como Administrador
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Gera o link apontando para a página correta usando a URL exata do navegador
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${baseUrl}/nova-senha`
      }
    })

    if (error) throw error

    // Captura o link seguro
    const linkRecuperacao = data.properties.action_link

    // 3. Prepara o envio pelo seu Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_SENHA
      }
    })

    await transporter.sendMail({
      from: `"Equipe Vitrine" <${process.env.GMAIL_EMAIL}>`,
      to: email,
      subject: 'Recuperação de Senha - Vitrine Digital',
      html: `
        <div style="font-family: sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
            <h2 style="color: #1e3a8a;">Recuperação de Senha</h2>
            <p>Recebemos um pedido para redefinir sua senha na Vitrine Digital.</p>
            <p>Clique no botão abaixo para criar uma nova senha com segurança:</p>
            <div style="text-align: center; margin-top: 30px; margin-bottom: 30px;">
              <a href="${linkRecuperacao}" style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  Criar Nova Senha
              </a>
            </div>
            <p style="font-size: 12px; color: #64748b;">Se você não solicitou esta alteração, ignore este e-mail. Nenhuma mudança foi feita na sua conta.</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DETALHE DO ERRO NO SERVIDOR:', error)
    return NextResponse.json({ error: error.message || 'Falha ao processar solicitação' }, { status: 500 })
  }
}