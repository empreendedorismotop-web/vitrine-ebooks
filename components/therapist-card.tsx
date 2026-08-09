'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useMemo, useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type TherapistCardProps = {
  therapist: {
    id: string
    nome: string
    titulo_ebook: string
    imagem_url: string 
    descricao: string
    link_site: string
    cliques?: number
    favoritos_count?: number // 👈 Adicionamos a contagem para o Card renderizar
  }
  origem?: string 
}

export function TherapistCard({ therapist, origem = 'Vitrine Principal (Grade)' }: TherapistCardProps) {
  const router = useRouter()
  
  // ESTADOS AUTÔNOMOS DO FAVORITO
  const [isFavorito, setIsFavorito] = useState(false)
  const [favCount, setFavCount] = useState(therapist.favoritos_count || 0)

  // Lê a memória do navegador assim que o cartão renderiza
  useEffect(() => {
    const favs = JSON.parse(localStorage.getItem('@vitrine-favoritos') || '[]')
    if (favs.includes(therapist.id)) {
      setIsFavorito(true)
    }
    setFavCount(therapist.favoritos_count || 0)
  }, [therapist.id, therapist.favoritos_count])

  // Lógica de Favoritar / Desfavoritar
  const handleToggleFavorito = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation() // 👈 Impede que o clique no coração abra a página do ebook sem querer

    let currentFavs = JSON.parse(localStorage.getItem('@vitrine-favoritos') || '[]')
    const currentlyFavorited = currentFavs.includes(therapist.id)
    
    let newCount = favCount

    if (currentlyFavorited) {
      currentFavs = currentFavs.filter((id: string) => id !== therapist.id)
      newCount = Math.max(0, newCount - 1)
      setIsFavorito(false)
    } else {
      currentFavs.push(therapist.id)
      newCount += 1
      setIsFavorito(true)
    }

    setFavCount(newCount)
    localStorage.setItem('@vitrine-favoritos', JSON.stringify(currentFavs))

    // Atualiza o banco do Admin silenciosamente
    await supabase.from('profiles').update({ favoritos_count: newCount }).eq('id', therapist.id)
  }

  // Força o navegador a buscar a imagem mais recente
  const imageSrc = useMemo(() => {
    if (!therapist.imagem_url) return '/placeholder-cover.png'
    return `${therapist.imagem_url}?v=${new Date().getTime()}`
  }, [therapist.imagem_url])
  
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
        
        {/* CABEÇALHO DO CARTÃO: Autor + Coração Embutido Elegante */}
        <div className="flex items-start justify-between gap-3 mb-2">
            <span className="text-[11px] font-bold tracking-widest uppercase text-stone-400 block break-words mt-1">
              Por {therapist.nome || 'Autor Independente'}
            </span>
            
            <button 
              onClick={handleToggleFavorito}
              className="flex items-center gap-1.5 bg-slate-50 hover:bg-red-50 border border-slate-100 hover:border-red-100 px-2 py-1 rounded-md transition-colors group/fav z-10 shrink-0"
              title={isFavorito ? "Remover dos favoritos" : "Salvar nos favoritos"}
            >
              <Heart className={`size-4 transition-colors duration-300 ${isFavorito ? 'fill-red-500 text-red-500' : 'text-slate-400 group-hover/fav:text-red-400'}`} />
              {favCount > 0 && (
                <span className={`text-[10px] font-bold ${isFavorito ? 'text-red-500' : 'text-slate-500 group-hover/fav:text-red-500'}`}>
                  {favCount}
                </span>
              )}
            </button>
        </div>
        
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
              router.push(`/ebook/${therapist.id}?origem=${origem}`);
            }}
          >
            Mais Detalhes
          </Button>
        </div>
      </div>
    </div>
  )
}