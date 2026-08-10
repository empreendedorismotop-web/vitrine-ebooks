import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(req: Request) {
  try {
    // Defina aqui o tempo de inatividade (Exemplo: 3 meses atrás)
    const mesesInativo = 3 
    const limiteData = new Date()
    limiteData.setMonth(limiteData.getMonth() - mesesInativo)

    // Remove do Supabase quem tem o last_active mais antigo que o limite
    const { error, count } = await supabase
      .from('push_subscriptions')
      .delete({ count: 'exact' })
      .lt('last_active', limiteData.toISOString())

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      mensagem: `Faxina concluída! Foram removidos os assinantes inativos há mais de ${mesesInativo} meses.` 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}