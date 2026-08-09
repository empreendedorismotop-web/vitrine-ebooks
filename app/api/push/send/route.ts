import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

// Configuração do Web Push
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:josevg10@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

// Configuração do Supabase para fazer a faxina
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

    const endpointsInvalidos: string[] = [] // 👈 A "Lixeira" para onde vão os contatos bloqueados

    const promises = subscriptions.map((sub: any) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      ).catch(err => {
        // Erro 410 (Gone) ou 404 (Not Found) significa que o usuário bloqueou/removeu a permissão no navegador
        if (err.statusCode === 410 || err.statusCode === 404) {
          endpointsInvalidos.push(sub.endpoint)
        } else {
          console.error('Erro de Push:', err)
        }
        return { error: err }
      })
    )

    await Promise.all(promises)

    // 🧹 Limpeza Automática do Banco de Dados
    if (endpointsInvalidos.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', endpointsInvalidos)
        
      console.log(`Limpamos ${endpointsInvalidos.length} contatos inativos.`)
    }

    return NextResponse.json({ 
      success: true, 
      enviados: subscriptions.length - endpointsInvalidos.length,
      removidos: endpointsInvalidos.length
    })
  } catch (error: any) {
    console.error('Erro no disparo:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}