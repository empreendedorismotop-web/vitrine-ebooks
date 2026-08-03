'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { ChevronRight, ChevronLeft, Crown, Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function EmbedPage() {
  const [vips, setVips] = useState<any[]>([])
  const carouselRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const carregarDados = async () => {
      const { data: dataVips } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'ativo')
        .not('posicao_fixa', 'is', null)
        .order('posicao_fixa', { ascending: true })
      
      if (dataVips) setVips(dataVips)
    }
    carregarDados()
  }, [])

  // Motor de Autoplay do Carrossel VIP
  useEffect(() => {
    if (vips.length <= 1) return 

    const interval = setInterval(() => {
      if (carouselRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current
        
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' })
        } else {
          carouselRef.current.scrollBy({ left: 344, behavior: 'smooth' })
        }
      }
    }, 3500) 

    return () => clearInterval(interval)
  }, [vips])

  const rolarEsquerda = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -344, behavior: 'smooth' })
    }
  }

  const rolarDireita = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 344, behavior: 'smooth' })
    }
  }

  // Se não houver VIPs, a tela fica invisível para não quebrar o site parceiro
  if (vips.length === 0) return null 

  return (
    <div className="w-full bg-transparent font-sans px-2 py-4">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-200 pb-4">
        <div className="bg-amber-100 p-2 rounded-lg">
          <Crown className="size-5 md:size-6 text-amber-600" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-900">Destaques Premium</h2>
          <p className="text-xs md:text-sm text-slate-500">Recomendações exclusivas</p>
        </div>
      </div>
      
      <div className="relative group">
        <button 
          onClick={rolarEsquerda}
          className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 z-20 bg-white border border-amber-200 text-amber-600 p-2 md:p-3 rounded-full shadow-lg hover:bg-amber-50 transition-all opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center"
          aria-label="Anterior"
        >
          <ChevronLeft className="size-5 md:size-6" />
        </button>

        <div 
          ref={carouselRef}
          className="flex gap-4 md:gap-6 overflow-x-auto pb-4 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden relative z-10"
        >
          {vips.map(vip => (
            <div key={vip.id} className="snap-start shrink-0 w-[260px] md:w-[300px] bg-white rounded-2xl shadow-sm border border-amber-200 overflow-hidden flex flex-col relative transition-all hover:shadow-md hover:border-amber-300">
                
                <div className="absolute top-3 right-3 bg-amber-400 text-amber-950 text-[10px] font-bold px-2 py-1 rounded-md z-10 shadow-sm flex items-center gap-1">
                  <Star className="size-3 fill-amber-950" /> DESTAQUE
                </div>
                
                <div className="h-[220px] md:h-[260px] bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
                  <img 
                    src={vip.imagem_url || '/placeholder-book.png'} 
                    alt={vip.titulo_ebook} 
                    className="h-full w-auto object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500" 
                  />
                </div>
                
                <div className="p-4 flex flex-col flex-1 border-t border-slate-100">
                  <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 line-clamp-1">POR {vip.nome}</p>
                  <h3 className="font-serif font-bold text-base md:text-lg text-slate-900 mb-3 line-clamp-2">{vip.titulo_ebook}</h3>
                  
                  <div className="mt-auto">
                    {/* 👇 O SEGREDO ESTÁ AQUI: target="_blank" ABRE EM UMA NOVA GUIA 👇 */}
                    <Link 
                      href={`/ebook/${vip.id}?origem=Parceiro (Widget Externo)`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs md:text-sm transition-colors shadow-sm"
                    >
                      Mais Detalhes
                    </Link>
                  </div>
                </div>
            </div>
          ))}
        </div>

        <button 
          onClick={rolarDireita}
          className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 z-20 bg-white border border-amber-200 text-amber-600 p-2 md:p-3 rounded-full shadow-lg hover:bg-amber-50 transition-all opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center"
          aria-label="Proximo"
        >
          <ChevronRight className="size-5 md:size-6" />
        </button>
      </div>
    </div>
  )
}