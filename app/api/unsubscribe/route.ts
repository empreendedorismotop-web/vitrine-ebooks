import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')

    if (!email) {
      return new NextResponse('E-mail não fornecido.', { status: 400 })
    }

    // Remove do banco de leads dos popups
    await supabase.from('leads').delete().eq('email', email)
    
    // Opcional: Remove também da lista de clientes cadastrados/importados
    await supabase.from('profiles').delete().eq('email', email)

    const htmlSucesso = `
      <html>
        <body style="font-family: sans-serif; text-align: center; padding: 50px; background-color: #f8fafc;">
          <div style="background: white; max-width: 500px; margin: 0 auto; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h1 style="color: #0f172a; margin-bottom: 10px;">Você foi descadastrado</h1>
            <p style="color: #64748b; line-height: 1.6;">O seu e-mail (<strong>${email}</strong>) foi removido com sucesso da nossa lista. Você não receberá mais os nossos avisos.</p>
            <br>
            <a href="https://vitrine-ebooks.vercel.app" style="color: #ea580c; text-decoration: none; font-weight: bold;">Voltar para o site</a>
          </div>
        </body>
      </html>
    `

    return new NextResponse(htmlSucesso, {
      headers: { 'Content-Type': 'text/html' }
    })
  } catch (error) {
    return new NextResponse('Ocorreu um erro ao processar o descadastro.', { status: 500 })
  }
}