'use client'

import { useState, useEffect } from 'react'
import { Heart, X, Trash2, ExternalLink, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'

export function MenuFavoritos() {
  const [aberto, setAberto] = useState(false)
  const [quantidade, setQuantidade] = useState(0)
  const [ebooks, setEbooks] = useState<any[]>([])
  const [carregando, setCarregando] = useState(false)

  // 1. Mantém a bolinha com a quantidade sempre atualizada
  useEffect(() => {
    const atualizarContagem = () => {
      const favs = JSON.parse(localStorage.getItem('@vitrine-favoritos') || '[]')
      setQuantidade(favs.length)
    }
    
    atualizarContagem() // Checa ao carregar
    
    // Fica "ouvindo" se outro componente atualizou os favoritos
    window.addEventListener('favoritosAtualizados', atualizarContagem)
    return () => window.removeEventListener('favoritosAtualizados', atualizarContagem)
  }, [])

  // 2. Quando o usuário abre o menu, busca as infos reais lá no Supabase
  useEffect(() => {
    if (aberto) {
      buscarFavoritosNoBanco()
    }
  }, [aberto])

  const buscarFavoritosNoBanco = async () => {
    setCarregando(true)
    const favsIds = JSON.parse(localStorage.getItem('@vitrine-favoritos') || '[]')
    
    if (favsIds.length === 0) {
      setEbooks([])
      setCarregando(false)
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, titulo_ebook, nome, imagem_url, favoritos_count')
      .in('id', favsIds)

    if (data) setEbooks(data)
    setCarregando(false)
  }

  // 3. Permite que ele remova o favorito por dentro do próprio menu!
  const removerFavorito = async (ebookId: string, countAtual: number) => {
    // Atualiza localmente
    const favsIds = JSON.parse(localStorage.getItem('@vitrine-favoritos') || '[]')
    const novaLista = favsIds.filter((id: string) => id !== ebookId)
    localStorage.setItem('@vitrine-favoritos', JSON.stringify(novaLista))
    
    // Atualiza a interface
    setEbooks(prev => prev.filter(e => e.id !== ebookId))
    setQuantidade(novaLista.length)
    window.dispatchEvent(new Event('favoritosAtualizados')) // Avisa o resto do site

    // Tira 1 da contagem no Supabase
    const novoCount = Math.max(0, (countAtual || 0) - 1)
    await supabase.from('profiles').update({ favoritos_count: novoCount }).eq('id', ebookId)
  }

  return (
    <>
      {/* BOTÃO QUE FICA NO CABEÇALHO */}
      <button 
        onClick={() => setAberto(true)}
        className="relative flex items-center justify-center p-2 text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
        title="Meus E-books Favoritos"
      >
        <Heart className="size-6" />
        {quantidade > 0 && (
          <span className="absolute top-0 right-0 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
            {quantidade}
          </span>
        )}
      </button>

      {/* OVERLAY ESCURO E O MENU LATERAL (DRAWER) */}
      {aberto && (
        <div className="fixed inset-0 z-[999] flex justify-end">
          {/* Fundo clicável para fechar */}
          <div 
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
            onClick={() => setAberto(false)}
          ></div>
          
          {/* Painel que desliza */}
          <div className="relative z-10 w-full max-w-sm bg-white shadow-2xl h-full flex flex-col animate-[slideInRight_0.3s_ease-out]">
            
            {/* Topo do Menu */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <h2 className="text-xl font-serif font-bold text-slate-900 flex items-center gap-2">
                <Heart className="size-5 fill-red-500 text-red-500" /> 
                Meus Favoritos
              </h2>
              <button onClick={() => setAberto(false)} className="p-2 text-slate-400 hover:text-slate-800 bg-white rounded-full shadow-sm hover:shadow">
                <X className="size-5" />
              </button>
            </div>

            {/* Lista de E-books */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              {carregando ? (
                <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-3">
                  <Loader2 className="size-8 animate-spin text-red-400" />
                  <p className="font-bold text-sm">Buscando sua estante...</p>
                </div>
              ) : ebooks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-60 text-center">
                  <Heart className="size-16 text-slate-200 mb-4" />
                  <h3 className="font-bold text-slate-700">Nenhum favorito salvo</h3>
                  <p className="text-sm text-slate-500 mt-2">Clique no coração dos e-books para salvá-los aqui e ler depois.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ebooks.map((ebook) => (
                    <div key={ebook.id} className="flex gap-4 p-3 border border-slate-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow group">
                      <div className="relative h-24 w-16 shrink-0 bg-slate-100 rounded-md overflow-hidden border border-slate-200">
                        <Image src={ebook.imagem_url || '/placeholder-book.png'} alt={ebook.titulo_ebook} fill className="object-cover" />
                      </div>
                      
                      <div className="flex flex-col flex-1 py-1 min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm line-clamp-2 leading-tight mb-1">{ebook.titulo_ebook}</h4>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Por {ebook.nome}</p>
                        
                        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                          <Link 
                            href={`/ebook/${ebook.id}?origem=Menu de Favoritos`}
                            onClick={() => setAberto(false)} // Fecha o menu ao clicar
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                          >
                            Ler Detalhes <ExternalLink className="size-3" />
                          </Link>
                          
                          <button 
                            onClick={() => removerFavorito(ebook.id, ebook.favoritos_count)}
                            className="text-slate-300 hover:text-red-500 transition-colors p-1"
                            title="Remover"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rodapé do Menu */}
            {ebooks.length > 0 && (
              <div className="p-5 border-t border-slate-100 bg-slate-50 text-center">
                <p className="text-xs text-slate-500 font-medium">Os favoritos ficam salvos neste navegador.</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Keyframe para a animação do menu */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}} />
    </>
  )
}