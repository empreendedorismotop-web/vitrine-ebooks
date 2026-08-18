'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { TherapistCard } from './therapist-card'
import { Loader2, RefreshCw } from 'lucide-react'

// Mostra 40 por vez
const ITEMS_POR_CARREGAMENTO = 40 
// Cache diário (24 horas) para não gastar o banco
const HORAS_CACHE_GRADE = 24 

export function TherapistsSection({ searchQuery, origem = "Grade Principal" }: { searchQuery: string, origem?: string }) {
  const [todosEbooks, setTodosEbooks] = useState<any[]>([])
  const [ebooksVisiveis, setEbooksVisiveis] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [carregandoMais, setCarregandoMais] = useState(false)
  const [paginaExibida, setPaginaExibida] = useState(1)

  useEffect(() => {
    carregarEbooks()
  }, [])

  // Quando você digita algo na busca lá em cima, ele reseta para mostrar os resultados do banco
  useEffect(() => {
    if (searchQuery.trim() !== '') {
        // Se tem busca, fazemos uma busca forçada e limpa ignorando o cache!
        buscarEbooks(searchQuery)
    } else if (todosEbooks.length > 0) {
        // Se apagou a busca, volta a mostrar o que estava em cache
        aplicarFiltroEEmbaralhamento(todosEbooks)
    }
  }, [searchQuery])

  // Função central para decidir se baixa do Supabase ou usa o Cache do Navegador
  const carregarEbooks = async () => {
    setLoading(true)
    
    // Ignora cache se tiver algo digitado na busca
    if (searchQuery.trim() !== '') {
        await buscarEbooks(searchQuery)
        return
    }

    const CACHE_KEY = '@vitrine-grade-cache'
    const TIME_KEY = '@vitrine-grade-time'
    
    const tempoSalvo = localStorage.getItem(TIME_KEY)
    const dadosSalvos = localStorage.getItem(CACHE_KEY)
    
    const agora = new Date().getTime()
    const tempoExpirado = !tempoSalvo || (agora - parseInt(tempoSalvo)) > (HORAS_CACHE_GRADE * 60 * 60 * 1000)

    if (dadosSalvos && !tempoExpirado) {
        // Usa os dados salvos sem gastar O BANCO DE DADOS
        const cachedData = JSON.parse(dadosSalvos)
        setTodosEbooks(cachedData)
        aplicarFiltroEEmbaralhamento(cachedData, false) // false = não embaralha de novo, usa como está salvo
        setLoading(false)
    } else {
        // O Cache expirou, vamos fazer o download (apenas colunas necessárias!)
        await buscarEbooks('')
    }
  }

  const buscarEbooks = async (termoDeBusca: string) => {
    setLoading(true)
    
    // OTIMIZAÇÃO CRÍTICA: Select apenas das colunas que o TherapistCard realmente usa
    // Isso evita baixar MBs de HTMLs ou descrições salvas no banco
    let query = supabase
      .from('profiles')
      .select('id, nome, titulo_ebook, imagem_url, favoritos_count, views_count, status, data_expiracao')
      .eq('status', 'ativo')

    // Se o usuário digitou algo, filtramos direto no banco (muito mais leve)
    if (termoDeBusca) {
        query = query.or(`titulo_ebook.ilike.%${termoDeBusca}%,nome.ilike.%${termoDeBusca}%`)
    }

    const { data, error } = await query

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

    if (!termoDeBusca) {
        // Se NÃO é uma busca, embaralha e salva no cache
        const embaralhado = filtradosAtivos.sort(() => Math.random() - 0.5)
        setTodosEbooks(embaralhado)
        aplicarFiltroEEmbaralhamento(embaralhado, false)
        
        localStorage.setItem('@vitrine-grade-cache', JSON.stringify(embaralhado))
        localStorage.setItem('@vitrine-grade-time', new Date().getTime().toString())
    } else {
        // Se é busca, só mostra na tela, não salva no cache
        setEbooksVisiveis(filtradosAtivos)
        setPaginaExibida(1)
    }
    
    setLoading(false)
  }

  const aplicarFiltroEEmbaralhamento = (listaCompleta: any[], forcarEmbaralhamento = true) => {
    let listaParaProcessar = [...listaCompleta]

    if (forcarEmbaralhamento && searchQuery.trim() === '') {
      listaParaProcessar = listaParaProcessar.sort(() => Math.random() - 0.5)
      // Atualiza o cache com a nova ordem sorteada
      localStorage.setItem('@vitrine-grade-cache', JSON.stringify(listaParaProcessar))
      localStorage.setItem('@vitrine-grade-time', new Date().getTime().toString())
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

  // Botão manual para sortear tudo de novo e salvar o novo sorteio no cache
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

      {/* Botão de Carregar Mais Moderno e Destacado */}
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