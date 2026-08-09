'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { ShieldCheck, ChevronRight, ChevronLeft, Crown, Star, Heart } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { Hero } from '@/components/hero'
import { TherapistsSection } from '@/components/therapists-section'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [vips, setVips] = useState<any[]>([])
  const [ativos, setAtivos] = useState<any[]>([]) 
  const [favoritos, setFavoritos] = useState<string[]>([])
  
  const carouselRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Carrega os favoritos salvos no navegador do usuário
    const favoritosSalvos = localStorage.getItem('@vitrine-favoritos')
    if (favoritosSalvos) {
      setFavoritos(JSON.parse(favoritosSalvos))
    }

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
        // Embaralha a ordem aleatoriamente
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
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -344, behavior: 'smooth' })
    }
  }

  const rolarDireita = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 344, behavior: 'smooth' })
    }
  }

  // Lógica Híbrida de Favoritos (Local + Supabase)
  const toggleFavorito = async (ebook: any) => {
    const isFavorito = favoritos.includes(ebook.id)
    let novaListaFavoritos = []
    let novoCount = (ebook.favoritos_count || 0)

    if (isFavorito) {
      // Remove dos favoritos
      novaListaFavoritos = favoritos.filter(id => id !== ebook.id)
      novoCount = Math.max(0, novoCount - 1)
    } else {
      // Adiciona aos favoritos
      novaListaFavoritos = [...favoritos, ebook.id]
      novoCount += 1
    }

    // 1. Atualiza a interface instantaneamente (Local)
    setFavoritos(novaListaFavoritos)
    localStorage.setItem('@vitrine-favoritos', JSON.stringify(novaListaFavoritos))
    
    // 👇 O AVISO INVISÍVEL: Atualiza a bolinha vermelha do cabeçalho na mesma hora!
    window.dispatchEvent(new Event('favoritosAtualizados'))

    // Atualiza o estado da array de VIPs visualmente
    setVips(prevVips => prevVips.map(v => v.id === ebook.id ? { ...v, favoritos_count: novoCount } : v))

    // 2. Atualiza o banco de dados silenciosamente
    await supabase
      .from('profiles')
      .update({ favoritos_count: novoCount })
      .eq('id', ebook.id)
  }

  return (
    <>
      <SiteHeader />
      <main className="overflow-hidden bg-slate-50 relative z-10">
        
        <div className="-mt-8 md:-mt-12">
            <Hero query={searchQuery} onQueryChange={setSearchQuery} />
        </div>
        
        <section className="w-full flex justify-center px-4 -mt-8 md:-mt-12 mb-10 relative z-20">
            <Link 
              href="/cadastro" 
              className="flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full shadow-[0_8px_30px_rgb(5,150,105,0.3)] transition-transform hover:-translate-y-1"
            >
                Quero Anunciar Meu E-book
                <ChevronRight className="size-5" />
            </Link>
        </section>

        {ativos.length > 0 && (
          <div className="w-full bg-slate-100 text-slate-800 overflow-hidden relative flex items-center py-3 mb-10 border-y border-slate-200 shadow-sm">
            
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
                animation: letreiro ${ativos.length * 6}s linear infinite;
                padding-right: 50px;
              }
              .animacao-letreiro:hover {
                animation-play-state: paused;
              }
            `}</style>

            <div className="animacao-letreiro gap-24 px-4">
              {ativos.map((ebook) => (
                <Link 
                  key={ebook.id} 
                  href={`/ebook/${ebook.id}?origem=Vitrine Principal (Letreiro)`} 
                  className="text-sm font-bold hover:text-emerald-600 transition-colors flex items-center gap-2"
                >
                  <span className="text-emerald-500 text-lg leading-none">✦</span> 
                  {ebook.titulo_ebook} 
                  <span className="text-slate-500 font-normal ml-1">por {ebook.nome}</span>
                </Link>
              ))}
              
              {ativos.map((ebook) => (
                <Link 
                  key={`${ebook.id}-clone`} 
                  href={`/ebook/${ebook.id}?origem=Vitrine Principal (Letreiro)`} 
                  className="text-sm font-bold hover:text-emerald-600 transition-colors flex items-center gap-2"
                >
                  <span className="text-emerald-500 text-lg leading-none">✦</span> 
                  {ebook.titulo_ebook} 
                  <span className="text-slate-500 font-normal ml-1">por {ebook.nome}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {vips.length > 0 && (
            <section className="max-w-7xl mx-auto px-4 md:px-6 mb-12">
               <div className="flex items-center gap-3 mb-6 border-b border-slate-200 pb-4">
                  <div className="bg-amber-100 p-2 rounded-lg">
                    <Crown className="size-6 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-slate-900">Destaques Premium</h2>
                    <p className="text-sm text-slate-500">Recomendações exclusivas da vitrine</p>
                  </div>
               </div>
               
               <div className="relative group">
                 <button 
                    onClick={rolarEsquerda}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -ml-5 z-20 bg-white border border-amber-200 text-amber-600 p-3 rounded-full shadow-lg hover:bg-amber-50 transition-all opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center"
                    aria-label="Anterior"
                 >
                    <ChevronLeft className="size-6" />
                 </button>

                 <div 
                    ref={carouselRef}
                    className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden relative z-10"
                 >
                    {vips.map(vip => (
                        <div key={vip.id} className="snap-start shrink-0 w-[280px] md:w-[320px] bg-white rounded-2xl shadow-sm border border-amber-200 overflow-hidden flex flex-col relative transition-all hover:shadow-md hover:border-amber-300">
                           
                           {/* Botão de Favorito no Canto Superior Esquerdo */}
                           <button 
                             onClick={(e) => { e.preventDefault(); toggleFavorito(vip); }}
                             className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm p-2 rounded-full z-20 shadow-sm hover:scale-110 transition-transform group/fav"
                             title="Salvar nos favoritos"
                           >
                             <Heart 
                               className={`size-5 transition-colors duration-300 ${favoritos.includes(vip.id) ? 'fill-red-500 text-red-500' : 'text-slate-400 group-hover/fav:text-red-400'}`} 
                             />
                           </button>

                           <div className="absolute top-3 right-3 bg-amber-400 text-amber-950 text-[10px] font-bold px-2 py-1 rounded-md z-10 shadow-sm flex items-center gap-1">
                              <Star className="size-3 fill-amber-950" /> DESTAQUE
                           </div>
                           
                           <div className="h-[280px] bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-6">
                             <img 
                                src={vip.imagem_url || '/placeholder-book.png'} 
                                alt={vip.titulo_ebook} 
                                className="h-full w-auto object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500" 
                             />
                           </div>
                           
                           <div className="p-5 flex flex-col flex-1 border-t border-slate-100">
                              <div className="flex justify-between items-center mb-2">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider line-clamp-1">POR {vip.nome}</p>
                                {vip.favoritos_count > 0 && (
                                  <span className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                                    <Heart className="size-3 fill-red-500" /> {vip.favoritos_count}
                                  </span>
                                )}
                              </div>
                              <h3 className="font-serif font-bold text-lg text-slate-900 mb-4 line-clamp-2">{vip.titulo_ebook}</h3>
                              
                              <div className="mt-auto">
                                 <Link href={`/ebook/${vip.id}?origem=Vitrine Principal (Carrossel VIP)`} className="block w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl text-sm transition-colors shadow-sm">
                                    Mais Detalhes
                                 </Link>
                              </div>
                           </div>
                        </div>
                    ))}
                 </div>

                 <button 
                    onClick={rolarDireita}
                    className="absolute right-0 top-1/2 -translate-y-1/2 -mr-5 z-20 bg-white border border-amber-200 text-amber-600 p-3 rounded-full shadow-lg hover:bg-amber-50 transition-all opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center"
                    aria-label="Proximo"
                 >
                    <ChevronRight className="size-6" />
                 </button>
               </div>
            </section>
        )}

        {/* GRADE ORIGINAL DOS PRODUTOS */}
        <TherapistsSection searchQuery={searchQuery} />

        <section className="bg-secondary/10 py-12 md:py-16 w-full overflow-hidden">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 px-4 text-center md:px-6">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
              <ShieldCheck className="size-6" aria-hidden="true" />
            </span>
            
            <h2 className="text-balance font-serif text-2xl font-bold text-foreground md:text-3xl break-words w-full">
              Divulgação simples, profissional e direta
            </h2>
            
            <p className="text-pretty leading-relaxed text-muted-foreground break-words w-full max-w-[100vw]">
              A Vitrine E-books &amp; Cursos funciona como uma plataforma de exposição para autores e professores independentes que desejam destacar e vender seus produtos com mais visibilidade. Conheça as regras antes de publicar sua oferta.
            </p>
            
            <Button variant="outline" nativeButton={false} render={<Link href="/termos" />}>
              Ler Termos de Uso da Plataforma
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}