'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { TherapistCard } from './therapist-card'

const ITEMS_POR_PAGINA = 15 // Ajustado para fechar 3 linhas completas de 5 colunas

export function TherapistsSection({ searchQuery }: { searchQuery: string }) {
  const [ebooks, setEbooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [paginaAtual, setPaginaAtual] = useState(1)

  useEffect(() => {
    carregarEbooks()
  }, [])

  const carregarEbooks = async () => {
    // Busca e ordena os e-books mais recentes primeiro
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('status', 'ativo')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar:', error)
      setLoading(false)
      return
    }

    // A MÁGICA ACONTECE AQUI: Oculta automaticamente quem passou do prazo
    const hoje = new Date().getTime() 
    
    const filtrados = data.filter((t: any) => {
      if (!t.data_expiracao) return true 
      
      const dataVencimento = new Date(t.data_expiracao).getTime()
      return dataVencimento >= hoje 
    })

    setEbooks(filtrados)
    setLoading(false)
  }

  if (loading) return <p className="text-center py-20 text-primary animate-pulse font-medium">Carregando vitrine...</p>

  // Filtra buscando tanto pelo Nome do Autor quanto pelo Título do E-book
  const ebooksExibidos = ebooks.filter((t) => {
    const termoBusca = searchQuery.toLowerCase();
    const nomeAutor = t.nome?.toLowerCase() || '';
    const tituloEbook = t.titulo_ebook?.toLowerCase() || '';
    
    return nomeAutor.includes(termoBusca) || tituloEbook.includes(termoBusca);
  })

  // Lógica de Paginação
  const totalPaginas = Math.ceil(ebooksExibidos.length / ITEMS_POR_PAGINA)
  const inicioIndex = (paginaAtual - 1) * ITEMS_POR_PAGINA
  const ebooksPaginados = ebooksExibidos.slice(inicioIndex, inicioIndex + ITEMS_POR_PAGINA)

  return (
    <section className="mx-auto max-w-[1400px] px-4 py-12">
      {ebooksExibidos.length > 0 ? (
        <>
          {/* Grid responsivo: 2 no Mobile, 3 no Tablet, 4 no Laptop, 5 no Desktop largo */}
          <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {ebooksPaginados.map((ebook) => (
              <TherapistCard key={ebook.id} therapist={ebook} />
            ))}
          </div>

          {/* Botões de Paginação */}
          {totalPaginas > 1 && (
            <div className="mt-12 flex justify-center gap-2">
              <button 
                onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))}
                disabled={paginaAtual === 1}
                className="px-4 py-2 rounded-lg border border-border text-foreground disabled:opacity-50 hover:bg-muted transition"
              >
                Anterior
              </button>
              
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => setPaginaAtual(num)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    paginaAtual === num 
                    ? 'bg-primary text-primary-foreground' 
                    : 'border border-border text-foreground hover:bg-muted'
                  }`}
                >
                  {num}
                </button>
              ))}

              <button 
                onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))}
                disabled={paginaAtual === totalPaginas}
                className="px-4 py-2 rounded-lg border border-border text-foreground disabled:opacity-50 hover:bg-muted transition"
              >
                Próxima
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="text-center text-muted-foreground py-10">Nenhum e-book encontrado para esta busca.</p>
      )}
    </section>
  )
}