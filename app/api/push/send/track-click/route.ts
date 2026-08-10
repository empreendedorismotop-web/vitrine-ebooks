import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: Request) {
  try {
    const { endpoint } = await req.json()

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint ausente' }, { status: 400 })
    }

    // Atualiza a data da última atividade (clique) do usuário
    const { error } = await supabase
      .from('push_subscriptions')
      .update({ last_active: new Date().toISOString() })
      .eq('endpoint', endpoint)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao registrar clique:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}