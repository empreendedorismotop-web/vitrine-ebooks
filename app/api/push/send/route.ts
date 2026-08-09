import { NextResponse } from 'next/server'
import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:seuemail@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { subscriptions, payload } = body

    if (!subscriptions || !payload) {
      return NextResponse.json({ error: 'Faltam dados' }, { status: 400 })
    }

    // Dispara o Push para o lote recebido
    const promises = subscriptions.map((sub: any) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      ).catch(err => {
        // Se der erro (ex: cliente desinstalou o navegador), apenas ignora e segue o baile
        console.error('Erro ao enviar para endpoint expirado:', err)
        return { error: err }
      })
    )

    await Promise.all(promises)

    return NextResponse.json({ success: true, enviados: subscriptions.length })
  } catch (error: any) {
    console.error('Erro no disparo:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}