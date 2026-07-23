import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const perfil_id = searchParams.get('id')
  
  // CORREÇÃO: Agora ele aceita tanto 'destino' (novo padrão da fila) quanto 'url' (seu padrão antigo)
  const urlFinal = searchParams.get('destino') || searchParams.get('url')
  const campanha = searchParams.get('campanha') || 'Email'

  // 1. REGISTRO NO PERFIL (Seu código original mantido)
  if (perfil_id) {
    await supabase.from('cliques').insert([
      { perfil_id, origem: `E-mail: ${campanha}` }
    ])
  }

  // 2. NOVO REGISTRO INTELIGENTE (Para o painel da Fila)
  // Se o clique vier da automação, ele avisa a tabela fila_envios para acender a etiqueta "🎯 Clicou"
  if (campanha && campanha.startsWith('fila_')) {
    const idDaFila = campanha.replace('fila_', '')
    await supabase.from('fila_envios').update({ clicou: true }).eq('id', idDaFila)
  }

  // 3. REDIRECIONAMENTO CORRETO
  // Agora ele vai redirecionar para o link exato que você cadastrou no painel
  return NextResponse.redirect(urlFinal || 'https://wa.me/5561982096982')
}