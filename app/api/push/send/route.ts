import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

// 1. Limpeza rigorosa das chaves para evitar o erro P-256 (cortando espaços invisíveis)
const publicKey = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '').trim()
const privateKey = (process.env.VAPID_PRIVATE_KEY || '').trim()
const subject = (process.env.VAPID_SUBJECT || 'mailto:josevg10@gmail.com').trim()

// Trava de segurança para inspecionar nos logs da Vercel
if (!publicKey || !privateKey) {
  console.error('🚨 ERRO CRÍTICO: As chaves VAPID não foram carregadas pela Vercel!')
} else {
  // Configuração do Web Push
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey)
    console.log('✅ Web Push configurado com a chave pública:', publicKey.substring(0, 15) + '...')
  } catch (configError) {
    console.error('🚨 Erro ao configurar chaves no web-push:', configError)
  }
}

// Configuração do Supabase
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

    // Trava caso as chaves estejam ausentes
    if (!publicKey || !privateKey) {
      return NextResponse.json({ error: 'Chaves de servidor ausentes' }, { status: 500 })
    }

    const endpointsInvalidos: string[] = [] // 👈 A "Lixeira" para onde vão os contatos bloqueados

    const promises = subscriptions.map((sub: any) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      ).catch(err => {
        // Erro 410 (Gone) ou 404 (Not Found) significa que o usuário bloqueou/removeu a permissão
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
      const { error: deleteError } = await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', endpointsInvalidos)
        
      if (deleteError) {
        console.error('Erro ao limpar contatos do Supabase:', deleteError)
      } else {
        console.log(`🧹 Limpamos ${endpointsInvalidos.length} contatos inativos.`)
      }
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