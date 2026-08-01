'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export function RastreadorVisita({ id, origem }: { id: string, origem: string }) {
  // Trava leve apenas para evitar duplicidade do ambiente de teste do React
  const rastreado = useRef(false)

  useEffect(() => {
    if (!origem || rastreado.current) return
    rastreado.current = true

    const registrarClique = async () => {
      const { error } = await supabase.from('cliques').insert([
        { perfil_id: id, origem: origem }
      ])
      
      if (error) {
        console.error("🚨 Supabase bloqueou o clique:", error.message)
      } else {
        console.log("✅ Clique registrado com sucesso! Origem:", origem)
      }
    }
    
    registrarClique()
  }, [id, origem])

  return null
}