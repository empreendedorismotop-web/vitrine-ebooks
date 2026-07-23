import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    // Agora recebemos a baseUrlOrigem enviada pelo navegador!
    const { assunto, mensagem, clientes, textoBotao, urlBotao, baseUrlOrigem } = await request.json()

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_SENHA
      }
    })

    // Se o navegador enviou a URL real, usamos ela. Se não, tenta o ambiente.
    const baseUrl = baseUrlOrigem || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    for (const cliente of clientes) {
      const linkDestino = urlBotao || 'https://wa.me/5561982096982'
      const textoBotaoSeguro = textoBotao || 'Acessar Minha Oferta'
      
      // O link mágico agora será montado com perfeição
      const linkRastreado = `${baseUrl}/api/track?id=${cliente.id}&url=${encodeURIComponent(linkDestino)}&campanha=${encodeURIComponent(assunto)}`

      const htmlMensagem = `
        <div style="font-family: sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-bottom: 1px solid #e2e8f0;">
                <h2 style="color: #1e3a8a; margin: 0;">Vitrine E-books & Cursos</h2>
            </div>
            <div style="padding: 30px;">
                <p style="font-size: 16px;">Olá, <strong>${cliente.nome}</strong>!</p>
                <p style="font-size: 15px; line-height: 1.6; color: #475569;">
                    ${mensagem.replace(/\n/g, '<br>')}
                </p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${linkRastreado}" style="display: inline-block; background-color: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                        ${textoBotaoSeguro}
                    </a>
                </div>
            </div>
        </div>
      `

      await transporter.sendMail({
        from: `"Equipe Vitrine" <${process.env.GMAIL_EMAIL}>`,
        to: cliente.email,
        subject: assunto,
        html: htmlMensagem
      })

      const hoje = new Date().toISOString()
      await supabase.from('profiles').update({ ultimo_email_enviado: hoje }).eq('id', cliente.id)
    }

    return NextResponse.json({ success: true, enviados: clientes.length })
  } catch (error) {
    console.error('Erro no envio do lote:', error)
    return NextResponse.json({ error: 'Falha ao processar lote.' }, { status: 500 })
  }
}