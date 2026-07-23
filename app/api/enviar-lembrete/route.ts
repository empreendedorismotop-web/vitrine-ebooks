import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: Request) {
  try {
    const { email, nome, titulo, plano } = await request.json()

    // Trava de segurança: Se o título ou plano estiverem vazios (null), usa um texto alternativo
    const tituloSeguro = titulo ? titulo : 'seu infoproduto'
    const planoSeguro = plano ? `plano ${plano}` : 'plano selecionado'
    const nomeSeguro = nome ? nome : 'Produtor'

    // Configura a conexão com o seu Gmail
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
      subject: `Ative seu anúncio: ${tituloSeguro}`,
      html: `
        <div style="font-family: sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
            <h2 style="color: #1e3a8a;">Olá, ${nomeSeguro}!</h2>
            <p>Vimos que você cadastrou <strong>"${tituloSeguro}"</strong> no <strong>${planoSeguro}</strong>, mas ainda não ativou seu anúncio na vitrine.</p>
            <p>Para colocar sua oferta no ar agora mesmo e começar a receber cliques, finalize o pagamento e nos envie o comprovante clicando no botão abaixo:</p>
            <div style="text-align: center; margin-top: 20px;">
              <a href="https://wa.me/5561982096982" style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  Finalizar Ativação via WhatsApp
              </a>
            </div>
            <p style="margin-top: 30px; font-size: 12px; color: #64748b;">Se você já ativou, desconsidere este e-mail.</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao enviar lembrete:', error)
    return NextResponse.json({ error: 'Falha ao enviar email' }, { status: 500 })
  }
}