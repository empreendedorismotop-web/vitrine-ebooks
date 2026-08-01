export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: Request) {
  // 1. Pega os parâmetros que vieram escondidos na URL do e-mail
  const { searchParams } = new URL(request.url)
  const filaId = searchParams.get('f_id')
  const destinoUrl = searchParams.get('url')

  // 2. Trava de segurança: se por algum motivo não tiver URL de destino, manda para a Home
  if (!destinoUrl) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 3. Se temos a identidade do e-mail, marcamos o "🎯 Clicou" silenciosamente no banco
  if (filaId) {
    try {
      await supabase
        .from('fila_envios')
        .update({ clicou: true })
        .eq('id', filaId)
    } catch (error) {
      console.error('Erro silencioso ao registrar o clique:', error)
      // Ocultamos o erro para garantir que o cliente seja redirecionado de qualquer forma
    }
  }

  // 4. A mágica final: joga o cliente para a página do E-book como se nada tivesse acontecido!
  return NextResponse.redirect(destinoUrl)
}