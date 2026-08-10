'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Lock, Download, Star, ChevronRight, BookOpen, Heart, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function BibliotecaGratis() {
  const [acessoLiberado, setAcessoLiberado] = useState(false)
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [carregando, setCarregando] = useState(false)
  
  const [ebooksG, setEbooksG] = useState<any[]>([])
  const [ebooksPagos, setEbooksPagos] = useState<any[]>([])

  // Estados para o "Carregar Mais" da vitrine Premium
  const [paginaPremium, setPaginaPremium] = useState(1)
  const [carregandoMaisPremium, setCarregandoMaisPremium] = useState(false)

  useEffect(() => {
    const destravado = localStorage.getItem('acesso_biblioteca')
    if (destravado === 'true') {
      setAcessoLiberado(true)
    }

    async function buscarEbooks() {
      // Busca os Gratuitos
      const { data: gratis } = await supabase.from('ebooks_gratis').select('*').order('created_at', { ascending: false })
      if (gratis) setEbooksG(gratis)

      // Busca TODOS os Pagos Ativos (Sem Limite)
      const { data: pagos } = await supabase.from('profiles').select('*').eq('status', 'ativo')
      if (pagos) setEbooksPagos(pagos.sort(() => Math.random() - 0.5)) 
    }
    buscarEbooks()
  }, [])

  const destravarAcesso = async (e: React.FormEvent) => {
    e.preventDefault()
    setCarregando(true)

    const res = await fetch('/api/leads/capturar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, whatsapp, segmento: 'leitor' })
    })

    if (res.ok) {
      localStorage.setItem('acesso_biblioteca', 'true')
      setAcessoLiberado(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      alert('Ocorreu um erro. Tente novamente.')
    }
    setCarregando(false)
  }

  // Lógica de Paginação dos Premium
  const ITEMS_POR_PAGINA = 12
  const premiumNaTela = ebooksPagos.slice(0, paginaPremium * ITEMS_POR_PAGINA)
  const temMaisPremium = ebooksPagos.length > premiumNaTela.length

  const carregarMaisPremium = () => {
    setCarregandoMaisPremium(true)
    setTimeout(() => {
      setPaginaPremium(prev => prev + 1)
      setCarregandoMaisPremium(false)
    }, 500)
  }

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-slate-50 py-12 relative overflow-hidden">
        
        <div className="max-w-4xl mx-auto text-center px-4 mb-12">
          <span className="bg-orange-100 text-orange-800 text-sm font-bold px-4 py-1.5 rounded-full inline-block mb-4">
            Acesso Exclusivo
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-4">
            Biblioteca de E-books Grátis
          </h1>
          <p className="text-slate-600 text-lg">
            Acesse nosso acervo de materiais gratuitos e impulsione seu conhecimento hoje mesmo.
          </p>
        </div>

        {!acessoLiberado ? (
          <div className="max-w-md mx-auto px-4 relative z-10">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-200 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-amber-500"></div>
              
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Lock className="size-10 text-slate-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Área Restrita</h2>
              <p className="text-slate-500 text-sm mb-6">
                Informe seus dados abaixo para destravar a biblioteca inteira permanentemente. É 100% grátis!
              </p>

              <form onSubmit={destravarAcesso} className="space-y-4">
                <input type="email" required placeholder="Seu melhor e-mail" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-shadow text-center" />
                <input type="text" required placeholder="Seu WhatsApp (com DDD)" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-shadow text-center" />
                
                <button type="submit" disabled={carregando} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg transition-transform hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0 mt-4 flex justify-center items-center gap-2">
                  {carregando ? 'Liberando...' : <><BookOpen className="size-5" /> Liberar Meu Acesso Agora</>}
                </button>
              </form>
            </div>
            
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 opacity-20 blur-sm pointer-events-none select-none grayscale">
               {[1,2,3,4].map(i => (
                 <div key={i} className="aspect-[3/4] bg-slate-300 rounded-xl shadow-lg"></div>
               ))}
            </div>
          </div>
        ) : (
          
          <div className="max-w-7xl mx-auto px-4">
            
            {/* GRID GRÁTIS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6 mb-20">
              {ebooksG.map(ebook => (
                <div key={ebook.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col group hover:shadow-xl hover:-translate-y-1 transition-all">
                  <div className="aspect-[3/4] bg-slate-100 p-2 sm:p-4 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded uppercase tracking-wider shadow-sm z-10">
                      GRÁTIS
                    </div>
                    <img src={ebook.imagem_url} alt={ebook.titulo} className="w-full h-full object-cover rounded shadow-md group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-3 sm:p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm mb-3 line-clamp-2">{ebook.titulo}</h3>
                    <a href={ebook.link_download} target="_blank" rel="noopener noreferrer" className="mt-auto block w-full text-center bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5">
                      <Download className="size-3 sm:size-4" /> Baixar
                    </a>
                  </div>
                </div>
              ))}
              {ebooksG.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500 font-bold text-sm">Novos e-books gratuitos chegarão em breve!</div>
              )}
            </div>

            {/* RECOMENDAÇÕES PREMIUM */}
            {ebooksPagos.length > 0 && (
              <div className="pt-16 border-t border-slate-200 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-50 px-6">
                  <Star className="size-8 text-amber-400 fill-amber-400" />
                </div>
                
                <div className="text-center mb-10">
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mb-2">Recomendações Premium</h2>
                  <p className="text-xs sm:text-base text-slate-500">Gostou dos e-books grátis? Dê o próximo passo com nossos materiais avançados.</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                  {premiumNaTela.map(perfil => (
                    <Link href={`/ebook/${perfil.id}?origem=Biblioteca Gratis (Premium)`} key={perfil.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col group hover:shadow-lg transition-all relative">
                      <div className="h-32 sm:h-48 bg-gradient-to-br from-slate-100 to-slate-200 p-2 sm:p-4 flex justify-center items-center relative">
                        <img src={perfil.imagem_url || '/placeholder-book.png'} alt={perfil.titulo_ebook} className="h-full w-auto object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="p-3 sm:p-5 flex flex-col flex-1">
                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase mb-1 line-clamp-1">Por {perfil.nome}</p>
                        <h3 className="font-serif font-bold text-sm sm:text-base text-slate-900 line-clamp-2 mb-2 sm:mb-3">{perfil.titulo_ebook}</h3>
                        <div className="mt-auto flex items-center justify-between">
                          <span className="text-emerald-600 font-bold text-xs sm:text-sm flex items-center gap-1">Ver Oferta <ChevronRight className="size-3 sm:size-4" /></span>
                          {perfil.favoritos_count > 0 && (
                            <span className="flex items-center gap-1 text-[10px] sm:text-xs text-red-500 font-bold"><Heart className="size-3 fill-red-500" /> {perfil.favoritos_count}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* BOTÃO CARREGAR MAIS */}
                {temMaisPremium && (
                  <div className="mt-12 flex justify-center w-full pb-8">
                    <button 
                      onClick={carregarMaisPremium}
                      disabled={carregandoMaisPremium}
                      className="w-full sm:w-auto px-12 py-4 bg-slate-900 hover:bg-slate-800 text-white text-lg font-bold rounded-2xl shadow-[0_8px_30px_rgb(15,23,42,0.3)] transition-all hover:-translate-y-1 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-3"
                    >
                      {carregandoMaisPremium ? (
                        <><Loader2 className="size-6 animate-spin" /> Carregando...</>
                      ) : (
                        'Ver Mais Recomendações'
                      )}
                    </button>
                  </div>
                )}

              </div>
            )}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  )
}