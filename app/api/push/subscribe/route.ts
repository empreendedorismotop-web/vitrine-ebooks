import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: Request) {
  try {
    const subscription = await req.json()

    // Extrai os campos de segurança que o navegador gerou
    const { endpoint, keys } = subscription
    if (!endpoint || !keys) {
      return NextResponse.json({ error: 'Inscrição Inválida' }, { status: 400 })
    }

    // Salva na tabela do Supabase (com proteção para não duplicar o mesmo navegador)
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          endpoint: endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
        { onConflict: 'endpoint' }
      )

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro na Inscrição Push:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}