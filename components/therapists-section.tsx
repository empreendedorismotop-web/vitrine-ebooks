'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { TherapistCard } from './therapist-card'
import { Loader2, RefreshCw } from 'lucide-react'

const ITEMS_POR_CARREGAMENTO = 40 
const HORAS_CACHE_GRADE = 24 

export function TherapistsSection({ searchQuery, origem = "Grade Principal" }: { searchQuery: string, origem?: string }) {
  const [todosEbooks, setTodosEbooks] = useState<any[]>([])
  const [ebooksVisiveis, setEbooksVisiveis] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [carregandoMais, setCarregandoMais] = useState(false)
  const [paginaExibida, setPaginaExibida] = useState(1)

  useEffect(() => {
    localStorage.removeItem('@vitrine-grade-cache')
    localStorage.removeItem('@vitrine-grade-time')
    carregarEbooks()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() !== '') {
        buscarEbooks(searchQuery)
    } else if (todosEbooks.length > 0) {
        aplicarFiltroEEmbaralhamento(todosEbooks)
    }
  }, [searchQuery])

  const carregarEbooks = async () => {
    setLoading(true)
    if (searchQuery.trim() !== '') {
        await buscarEbooks(searchQuery)
        return
    }
    await buscarEbooks('')
  }

  const buscarEbooks = async (termoDeBusca: string) => {
    setLoading(true)
    
    // Removido 'views_count' que não existe na tabela
    let query = supabase
      .from('profiles')
      .select('id, nome, titulo_ebook, imagem_url, favoritos_count, status, data_expiracao')
      .eq('status', 'ativo')

    if (termoDeBusca) {
        query = query.or(`titulo_ebook.ilike.%${termoDeBusca}%,nome.ilike.%${termoDeBusca}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Erro retornado pelo Supabase:', error)
      setLoading(false)
      return
    }

    const listaBruta = data || []

    const hoje = new Date().getTime() 
    const filtradosAtivos = listaBruta.filter((t: any) => {
      if (!t.data_expiracao) return true 
      const dataVencimento = new Date(t.data_expiracao).getTime()
      if (isNaN(dataVencimento)) return true 
      return dataVencimento >= hoje 
    })

    if (!termoDeBusca) {
        const embaralhado = [...filtradosAtivos].sort(() => Math.random() - 0.5)
        setTodosEbooks(embaralhado)
        aplicarFiltroEEmbaralhamento(embaralhado, false)
        
        if (embaralhado.length > 0) {
            localStorage.setItem('@vitrine-grade-cache', JSON.stringify(embaralhado))
            localStorage.setItem('@vitrine-grade-time', new Date().getTime().toString())
        }
    } else {
        setEbooksVisiveis(filtradosAtivos)
        setPaginaExibida(1)
    }
    
    setLoading(false)
  }

  const aplicarFiltroEEmbaralhamento = (listaCompleta: any[], forcarEmbaralhamento = true) => {
    let listaParaProcessar = [...listaCompleta]

    if (forcarEmbaralhamento && searchQuery.trim() === '') {
      listaParaProcessar = listaParaProcessar.sort(() => Math.random() - 0.5)
    }

    setEbooksVisiveis(listaParaProcessar)
    setPaginaExibida(1)
  }

  const ebooksNaTela = ebooksVisiveis.slice(0, paginaExibida * ITEMS_POR_CARREGAMENTO)
  const temMaisEbooks = ebooksVisiveis.length > ebooksNaTela.length

  const carregarMaisEbooks = () => {
    setCarregandoMais(true)
    setTimeout(() => {
      setPaginaExibida(prev => prev + 1)
      setCarregandoMais(false)
    }, 600)
  }

  const embaralharDeNovo = () => {
    setLoading(true)
    setTimeout(() => {
      aplicarFiltroEEmbaralhamento(todosEbooks, true)
      setLoading(false)
    }, 500)
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 text-emerald-600 gap-3">
      <Loader2 className="size-8 animate-spin" />
      <p className="font-bold">Carregando acervo do Supabase...</p>
    </div>
  )

  return (
    <section className="mx-auto max-w-[1400px] px-4 py-8 md:py-12">
      
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-slate-900">
            {searchQuery ? 'Resultados da Busca' : 'Descubra Novos E-books'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {searchQuery ? `Encontramos ${ebooksVisiveis.length} títulos para você.` : `Total de e-books carregados: ${ebooksVisiveis.length}`}
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
          {ebooksNaTela.map((ebook) => (
            <div key={ebook.id} className="w-full">
              <TherapistCard therapist={ebook} origem={origem} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-slate-500 font-medium text-lg">Nenhum e-book encontrado ou o status não é 'ativo'.</p>
        </div>
      )}

      {temMaisEbooks && (
        <div className="mt-12 flex justify-center w-full pb-8">
          <button 
            onClick={carregarMaisEbooks}
            disabled={carregandoMais}
            className="w-full sm:w-auto px-12 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-bold rounded-2xl shadow-[0_8px_30px_rgb(5,150,105,0.4)] transition-all hover:-translate-y-1 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-3"
          >
            {carregandoMais ? (
              <><Loader2 className="size-6 animate-spin" /> Carregando E-books...</>
            ) : (
              'Ver Mais E-books'
            )}
          </button>
        </div>
      )}

    </section>
  )
}