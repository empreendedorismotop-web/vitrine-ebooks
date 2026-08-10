'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { TherapistCard } from './therapist-card'
import { Loader2, RefreshCw } from 'lucide-react'

// Mostra 40 por vez
const ITEMS_POR_CARREGAMENTO = 40 

export function TherapistsSection({ searchQuery, origem = "Grade Principal" }: { searchQuery: string, origem?: string }) {
  const [todosEbooks, setTodosEbooks] = useState<any[]>([])
  const [ebooksVisiveis, setEbooksVisiveis] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [carregandoMais, setCarregandoMais] = useState(false)
  const [paginaExibida, setPaginaExibida] = useState(1)

  useEffect(() => {
    carregarEbooks()
  }, [])

  // Quando você digita algo na busca lá em cima, ele reseta para mostrar os resultados
  useEffect(() => {
    if (todosEbooks.length > 0) {
      aplicarFiltroEEmbaralhamento(todosEbooks)
    }
  }, [searchQuery])

  const carregarEbooks = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('status', 'ativo')

    if (error) {
      console.error('Erro ao buscar:', error)
      setLoading(false)
      return
    }

    // Filtra e-books expirados
    const hoje = new Date().getTime() 
    const filtradosAtivos = data.filter((t: any) => {
      if (!t.data_expiracao) return true 
      const dataVencimento = new Date(t.data_expiracao).getTime()
      return dataVencimento >= hoje 
    })

    setTodosEbooks(filtradosAtivos)
    aplicarFiltroEEmbaralhamento(filtradosAtivos)
    setLoading(false)
  }

  const aplicarFiltroEEmbaralhamento = (listaCompleta: any[]) => {
    let listaParaProcessar = listaCompleta

    // Se a pessoa digitou algo na busca, ele NÃO embaralha, ele busca de verdade.
    if (searchQuery.trim() !== '') {
      const termoBusca = searchQuery.toLowerCase()
      listaParaProcessar = listaCompleta.filter((t) => {
        const nomeAutor = t.nome?.toLowerCase() || ''
        const tituloEbook = t.titulo_ebook?.toLowerCase() || ''
        return nomeAutor.includes(termoBusca) || tituloEbook.includes(termoBusca)
      })
    } else {
      // O MOTOR MÁGICO: Se não tem busca, embaralha a ordem para dar chance a todos!
      listaParaProcessar = [...listaCompleta].sort(() => Math.random() - 0.5)
    }

    setEbooksVisiveis(listaParaProcessar)
    setPaginaExibida(1) // Reseta pra primeira "página"
  }

  // Puxa a quantidade certa baseado em quantas vezes você apertou "Carregar Mais"
  const ebooksNaTela = ebooksVisiveis.slice(0, paginaExibida * ITEMS_POR_CARREGAMENTO)
  const temMaisEbooks = ebooksVisiveis.length > ebooksNaTela.length

  const carregarMaisEbooks = () => {
    setCarregandoMais(true)
    setTimeout(() => { // Pequeno delay pra dar aquele efeito bonito de carregamento
      setPaginaExibida(prev => prev + 1)
      setCarregandoMais(false)
    }, 600)
  }

  const embaralharDeNovo = () => {
    setLoading(true)
    setTimeout(() => {
      aplicarFiltroEEmbaralhamento(todosEbooks)
      setLoading(false)
    }, 500)
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 text-emerald-600 gap-3">
      <Loader2 className="size-8 animate-spin" />
      <p className="font-bold">Embaralhando as melhores opções para você...</p>
    </div>
  )

  return (
    <section className="mx-auto max-w-[1400px] px-4 py-8 md:py-12">
      
      {/* Cabeçalho da Seção de Descobertas */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-slate-900">
            {searchQuery ? 'Resultados da Busca' : 'Descubra Novos E-books'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {searchQuery ? `Encontramos ${ebooksVisiveis.length} títulos para você.` : 'Seleção especial sorteada do nosso acervo.'}
          </p>
        </div>

        {!searchQuery && (
          <button 
            onClick={embaralharDeNovo}
            className="flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-lg transition-colors border border-emerald-100 shadow-sm"
          >
            <RefreshCw className="size-4" /> Ver outras opções
          </button>
        )}
      </div>

      {ebooksVisiveis.length > 0 ? (
        
        /* ⚠️ A NOVA GRADE (GRID): 2 Colunas Mobile, 3 Tablet, 4/5 Computador ⚠️ */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
          {ebooksNaTela.map((ebook) => (
            <div key={ebook.id} className="w-full">
              {/* O Cartão Inteligente agora resolve tudo sozinho (Favoritos, Cliques, Redirecionamento) */}
              <TherapistCard therapist={ebook} origem={origem} />
            </div>
          ))}
        </div>

      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-slate-500 font-medium text-lg">Nenhum e-book encontrado para esta busca.</p>
        </div>
      )}

      {/* Botão de Carregar Mais Moderno */}
      {temMaisEbooks && (
        <div className="mt-8 flex justify-center">
          <button 
            onClick={carregarMaisEbooks}
            disabled={carregandoMais}
            className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md disabled:opacity-70 transition-all flex items-center gap-2"
          >
            {carregandoMais ? (
              <><Loader2 className="size-5 animate-spin" /> Processando...</>
            ) : (
              'Carregar Mais E-books'
            )}
          </button>
        </div>
      )}

    </section>
  )
}