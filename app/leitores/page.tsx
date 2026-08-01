'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { ShieldCheck, ChevronRight, ChevronLeft, Crown, Star } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { HeroLeitor } from '@/components/hero-leitor'
import { TherapistsSection } from '@/components/therapists-section'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

export default function LeitoresPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [vips, setVips] = useState<any[]>([])
  const [ativos, setAtivos] = useState<any[]>([]) 
  
  const carouselRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const carregarDados = async () => {
      // 1. Busca APENAS os VIPs para o Carrossel
      const { data: dataVips } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'ativo')
        .not('posicao_fixa', 'is', null)
        .order('posicao_fixa', { ascending: true })
      
      if (dataVips) setVips(dataVips)

      // 2. Busca TODOS os e-books ativos para o Letreiro Suave
      const { data: dataAtivos } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'ativo')
      
      if (dataAtivos) {
        // LÓGICA INTELIGENTE: Embaralha a ordem aleatoriamente
        const listaEmbaralhada = dataAtivos.sort(() => Math.random() - 0.5)
        setAtivos(listaEmbaralhada)
      }
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
    if (carouselRef.current) carouselRef.current.scrollBy({ left: -344, behavior: 'smooth' })
  }

  const rolarDireita = () => {
    if (carouselRef.current) carouselRef.current.scrollBy({ left: 344, behavior: 'smooth' })
  }

  return (
    <>
      <SiteHeader />
      <main className="overflow-hidden bg-slate-50 relative z-10">
        
        <div className="-mt-8 md:-mt-12">
            <HeroLeitor query={searchQuery} onQueryChange={setSearchQuery} />
        </div>

        {/* --- FAIXA JORNALÍSTICA (LETREIRO SUAVE) --- */}
        {ativos.length > 0 && (
          <div className="w-full bg-slate-100 text-slate-800 overflow-hidden relative flex items-center py-3 mb-10 border-y border-slate-200 shadow-sm mt-8">
            <div className="absolute left-0 z-10 w-16 h-full bg-gradient-to-r from-slate-100 to-transparent pointer-events-none"></div>
            <div className="absolute right-0 z-10 w-16 h-full bg-gradient-to-l from-slate-100 to-transparent pointer-events-none"></div>
            
            <style>{`
              @keyframes letreiro {
                0% { transform: translateX(100vw); }
                100% { transform: translateX(-100%); }
              }
              .animacao-letreiro {
                display: inline-flex;
                white-space: nowrap;
                animation: letreiro 40s linear infinite;
                padding-right: 50px;
              }
              .animacao-letreiro:hover {
                animation-play-state: paused;
              }
            `}</style>

            <div className="animacao-letreiro gap-24 px-4">
              {ativos.map((ebook) => (
                <Link key={ebook.id} href={`/ebook/${ebook.id}?origem=Página de Leitores (Letreiro)`} className="text-sm font-bold hover:text-indigo-600 transition-colors flex items-center gap-2">
                  <span className="text-indigo-500 text-lg leading-none">✦</span> 
                  {ebook.titulo_ebook} 
                  <span className="text-slate-500 font-normal ml-1">por {ebook.nome}</span>
                </Link>
              ))}
              {ativos.map((ebook) => (
                <Link key={`${ebook.id}-clone`} href={`/ebook/${ebook.id}?origem=Página de Leitores (Letreiro)`} className="text-sm font-bold hover:text-indigo-600 transition-colors flex items-center gap-2">
                  <span className="text-indigo-500 text-lg leading-none">✦</span> 
                  {ebook.titulo_ebook} 
                  <span className="text-slate-500 font-normal ml-1">por {ebook.nome}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CARROSSEL DE DESTAQUES VIP */}
        {vips.length > 0 && (
            <section className="max-w-7xl mx-auto px-4 md:px-6 mb-12">
               <div className="flex items-center gap-3 mb-6 border-b border-slate-200 pb-4">
                  <div className="bg-amber-100 p-2 rounded-lg">
                    <Crown className="size-6 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-slate-900">Destaques da Vitrine</h2>
                    <p className="text-sm text-slate-500">Obras altamente recomendadas pela plataforma</p>
                  </div>
               </div>
               
               <div className="relative group">
                 <button onClick={rolarEsquerda} className="absolute left-0 top-1/2 -translate-y-1/2 -ml-5 z-20 bg-white border border-amber-200 text-amber-600 p-3 rounded-full shadow-lg hover:bg-amber-50 transition-all opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center" aria-label="Anterior">
                    <ChevronLeft className="size-6" />
                 </button>

                 <div ref={carouselRef} className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden relative z-10">
                    {vips.map(vip => (
                        <div key={vip.id} className="snap-start shrink-0 w-[280px] md:w-[320px] bg-white rounded-2xl shadow-sm border border-amber-200 overflow-hidden flex flex-col relative transition-all hover:shadow-md hover:border-amber-300">
                           
                           <div className="absolute top-3 right-3 bg-amber-400 text-amber-950 text-[10px] font-bold px-2 py-1 rounded-md z-10 shadow-sm flex items-center gap-1">
                              <Star className="size-3 fill-amber-950" /> DESTAQUE
                           </div>
                           
                           <div className="h-[280px] bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-6">
                             <img src={vip.imagem_url || '/placeholder-book.png'} alt={vip.titulo_ebook} className="h-full w-auto object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500" />
                           </div>
                           
                           <div className="p-5 flex flex-col flex-1 border-t border-slate-100">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 line-clamp-1">POR {vip.nome}</p>
                              <h3 className="font-serif font-bold text-lg text-slate-900 mb-4 line-clamp-2">{vip.titulo_ebook}</h3>
                              
                              <div className="mt-auto">
                                 <Link href={`/ebook/${vip.id}?origem=Página de Leitores (Carrossel VIP)`} className="block w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl text-sm transition-colors shadow-sm">
                                    Mais Detalhes
                                 </Link>
                              </div>
                           </div>
                        </div>
                    ))}
                 </div>

                 <button onClick={rolarDireita} className="absolute right-0 top-1/2 -translate-y-1/2 -mr-5 z-20 bg-white border border-amber-200 text-amber-600 p-3 rounded-full shadow-lg hover:bg-amber-50 transition-all opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center" aria-label="Proximo">
                    <ChevronRight className="size-6" />
                 </button>
               </div>
            </section>
        )}

        {/* GRADE INTELIGENTE DOS PRODUTOS (Com a Origem Injetada!) */}
        <TherapistsSection searchQuery={searchQuery} origem="Página de Leitores (Grade)" />

        <section className="bg-indigo-50/50 py-12 md:py-16 w-full overflow-hidden border-t border-indigo-100 mt-12">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 px-4 text-center md:px-6">
            <span className="flex size-12 items-center justify-center rounded-full bg-indigo-600 text-white shrink-0 shadow-sm">
              <ShieldCheck className="size-6" aria-hidden="true" />
            </span>
            
            <h2 className="text-balance font-serif text-2xl font-bold text-slate-900 md:text-3xl break-words w-full">
              Conteúdos selecionados com segurança
            </h2>
            
            <p className="text-pretty leading-relaxed text-slate-600 break-words w-full max-w-[100vw]">
              A Vitrine E-books &amp; Cursos conecta você diretamente aos autores e produtores de conteúdo, garantindo que você tenha acesso aos melhores materiais de desenvolvimento pessoal sem intermediários.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}