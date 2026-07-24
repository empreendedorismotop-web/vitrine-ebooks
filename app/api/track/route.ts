import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const perfil_id = searchParams.get('id')
    
    // Aceita tanto 'destino' quanto 'url'
    const urlFinal = searchParams.get('destino') || searchParams.get('url')
    const campanha = searchParams.get('campanha') || 'Email'

    // 1. REGISTRO NO BANCO DE DADOS
    if (perfil_id) {
      // Registra o clique no histórico
      await supabase.from('cliques').insert([
        { perfil_id, origem: `E-mail: ${campanha}` }
      ])
      
      // Atualiza o perfil do cliente para avisar o painel que ele está ativo (não ignorou)
      await supabase.from('profiles').update({ 
        ultimo_clique: new Date().toISOString() 
      }).eq('id', perfil_id)
    }

    // 2. REGISTRO INTELIGENTE (Fila de Envios)
    if (campanha && campanha.startsWith('fila_')) {
      const idDaFila = campanha.replace('fila_', '')
      await supabase.from('fila_envios').update({ clicou: true }).eq('id', idDaFila)
    }

    // 3. REDIRECIONAMENTO CORRETO E SEGURO
    if (urlFinal) {
      return NextResponse.redirect(urlFinal)
    }
    
    // Fallback padrão se não houver URL
    return NextResponse.redirect('https://wa.me/5561982096982')

  } catch (error) {
    // SE DER ERRO NO RASTREIO, SALVA A VENDA: O cliente é redirecionado de qualquer forma!
    console.error('Erro silencioso ao rastrear:', error)
    
    const { searchParams } = new URL(request.url)
    const urlSeguranca = searchParams.get('destino') || searchParams.get('url') || 'https://wa.me/5561982096982'
    
    return NextResponse.redirect(urlSeguranca)
  }
}