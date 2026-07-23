'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useMemo } from 'react'

type TherapistCardProps = {
  therapist: {
    id: string
    nome: string
    titulo_ebook: string
    imagem_url: string 
    descricao: string
    link_site: string // Corrigido para bater exatamente com a coluna do banco de dados
    cliques?: number
  }
}

export function TherapistCard({ therapist }: TherapistCardProps) {
  const router = useRouter()

  // O "Cache Buster": força o navegador a buscar a imagem mais recente
  const imageSrc = useMemo(() => {
    if (!therapist.imagem_url) return '/placeholder-cover.png'
    return `${therapist.imagem_url}?v=${new Date().getTime()}`
  }, [therapist.imagem_url])
  
  const handleRegistrarClique = async () => {
    try {
      let origem = 'Vitrine (Página Inicial)'
      
      const urlParams = new URLSearchParams(window.location.search)
      const utmSource = urlParams.get('utm_source')

      if (utmSource) {
        origem = `Anúncio Vitrine: ${utmSource}`
      } 
      else if (document.referrer) {
        const referrerUrl = new URL(document.referrer)
        if (referrerUrl.hostname !== window.location.hostname) {
          origem = `Vitrine via ${referrerUrl.hostname}`
        }
      }

      await supabase.from('cliques').insert([
        { perfil_id: therapist.id, origem: origem }
      ])
    } catch (error) {
      console.error('Erro silencioso ao rastrear clique:', error)
    }
  }

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:shadow-xl hover:-translate-y-1">
      
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-100">
        <Image
          src={imageSrc}
          alt={`Capa realista e profissional do e-book ${therapist.titulo_ebook}`}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <span className="text-[11px] font-bold tracking-widest uppercase text-stone-400 mb-2 block break-words">
          Por {therapist.nome || 'Autor Independente'}
        </span>
        
        <h3 className="mb-3 line-clamp-2 min-h-[3.5rem] font-serif font-bold text-xl leading-tight text-slate-900 break-words">
          {therapist.titulo_ebook || 'Título do E-book'}
        </h3>
        
        <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-slate-600 break-words">
          {therapist.descricao || 'Acesse para ver todos os detalhes deste material.'}
        </p>

        <div className="mt-auto pt-5 border-t border-slate-100 flex items-center justify-between gap-4">
          <Button 
            className="w-full bg-slate-900 text-white hover:bg-slate-800 transition-colors font-bold shadow-md hover:shadow-lg rounded-lg py-5"
            onClick={() => {
              handleRegistrarClique();
              router.push(`/ebook/${therapist.id}`);
            }}
          >
            Mais Detalhes
          </Button>
        </div>
      </div>
    </div>
  )
}