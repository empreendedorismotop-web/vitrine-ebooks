import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id') // ID do perfil
    const destino = searchParams.get('url')
    const campanha = searchParams.get('campanha') || 'Email Automático'

    if (!id || !destino) {
      return NextResponse.redirect('https://vitrine-ebooks.vercel.app')
    }

    // 1. Anota o clique geral do cliente
    await supabase.from('cliques').insert([{
      perfil_id: id,
      origem: campanha
    }])

    // 2. Procura o último e-mail disparado para essa pessoa e marca como LIDO/CLICADO
    const { data: filaData } = await supabase
      .from('fila_envios')
      .select('id')
      .eq('perfil_id', id)
      .eq('status', 'enviado')
      .order('agendado_para', { ascending: false })
      .limit(1)

    if (filaData && filaData.length > 0) {
      await supabase.from('fila_envios').update({ clicou: true }).eq('id', filaData[0].id)
    }

    return NextResponse.redirect(destino)

  } catch (error) {
    const { searchParams } = new URL(request.url)
    const destinoSeguro = searchParams.get('url') || 'https://vitrine-ebooks.vercel.app'
    return NextResponse.redirect(destinoSeguro)
  }
}