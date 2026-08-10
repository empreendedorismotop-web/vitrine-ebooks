import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

const publicKey = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '').trim()
const privateKey = (process.env.VAPID_PRIVATE_KEY || '').trim()
const subject = (process.env.VAPID_SUBJECT || 'mailto:josevg10@gmail.com').trim()

webpush.setVapidDetails(subject, publicKey, privateKey)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { subscriptions, payload } = body

    if (!subscriptions || !payload) {
      return NextResponse.json({ error: 'Faltam dados' }, { status: 400 })
    }

    const errosDetalhados: any[] = []
    const endpointsInvalidos: string[] = []

    const promises = subscriptions.map((sub: any) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      ).catch(err => {
        // Captura o erro exato que o Google está enviando
        console.error('❌ Erro real do Google:', err)
        errosDetalhados.push({
          endpoint: sub.endpoint.substring(0, 30) + '...',
          statusCode: err.statusCode,
          body: err.body || err.message
        })

        if (err.statusCode === 410 || err.statusCode === 404) {
          endpointsInvalidos.push(sub.endpoint)
        }
        return { error: err }
      })
    )

    await Promise.all(promises)

    // Se houver erros reais do Google, vamos exibi-los no painel agora!
    if (errosDetalhados.length > 0) {
      return NextResponse.json({ 
        success: false, 
        mensagem: "O Google rejeitou o envio!",
        erros: errosDetalhados 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      enviados: subscriptions.length 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}