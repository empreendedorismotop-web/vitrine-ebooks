import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id') // ID do perfil
    const destino = searchParams.get('url')
    const campanha = searchParams.get('campanha') || 'Email Automático'

    // Se faltar algum dado, joga direto para a vitrine por segurança
    if (!id || !destino) {
      return NextResponse.redirect('https://vitrine-ebooks.vercel.app')
    }

    // 1. ANOTA O CLIQUE GERAL DO CLIENTE (Histórico)
    await supabase.from('cliques').insert([{
      perfil_id: id,
      origem: campanha
    }])

    // 2. ATUALIZA A FILA DE ENVIOS (Muda de 'Ignorou' para 'Clicou')
    // Ele busca o último e-mail enviado para esta pessoa e marca como clicado
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

    // 3. Redireciona o cliente para o link de destino (Site ou Whats)
    return NextResponse.redirect(destino)

  } catch (error) {
    console.error('Erro silencioso ao rastrear:', error)
    // Fallback: Mesmo se der erro no banco, o cliente NUNCA fica travado
    const { searchParams } = new URL(request.url)
    const destinoSeguro = searchParams.get('url') || 'https://vitrine-ebooks.vercel.app'
    return NextResponse.redirect(destinoSeguro)
  }
}