'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function RastreadorVisita({ id, origem }: { id: string, origem: string }) {
  useEffect(() => {
    if (!origem) return

    // Trava de segurança para não duplicar o clique se o usuário apertar F5
    const chaveSessao = `clique_${id}_${origem}`
    
    if (!sessionStorage.getItem(chaveSessao)) {
      const registrarClique = async () => {
        await supabase.from('cliques').insert([
          { perfil_id: id, origem: origem }
        ])
        sessionStorage.setItem(chaveSessao, 'true')
      }
      
      registrarClique()
    }
  }, [id, origem])

  return null // O componente não aparece na tela, apenas roda no fundo
}