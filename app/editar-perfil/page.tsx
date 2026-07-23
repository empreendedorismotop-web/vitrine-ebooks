'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { MousePointerClick, PauseCircle, PlayCircle, AlertCircle } from 'lucide-react'

type Clique = {
  origem: string
}

export default function EditarPerfilPage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [nome, setNome] = useState('')
  const [linkSite, setLinkSite] = useState('')
  
  // Campos do E-book
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [linkVenda, setLinkVenda] = useState('')
  const [fotoUrl, setFotoUrl] = useState('')
  const [imagemFile, setImagemFile] = useState<File | null>(null)
  
  // Controle de Status e Cliques
  const [status, setStatus] = useState('')
  const [dataExpiracao, setDataExpiracao] = useState('')
  const [cliques, setCliques] = useState<Clique[]>([])
  
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState({ texto: '', tipo: '' })

  useEffect(() => {
    carregarPerfil()
  }, [])

  const carregarPerfil = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      // Busca os dados do perfil e os cliques cruzados
      const { data, error } = await supabase
        .from('profiles')
        .select('*, cliques(origem)')
        .eq('id', session.user.id)
        .single()

      if (error) throw error

      if (data) {
        setUserId(session.user.id)
        setNome(data.nome || '')
        setLinkSite(data.link_site || '') // Puxa o link do site no lugar do WhatsApp
        setTitulo(data.titulo_ebook || '')
        setDescricao(data.descricao || '')
        setLinkVenda(data.link_venda || '')
        setFotoUrl(data.foto_url || '')
        setStatus(data.status || 'pendente')
        setDataExpiracao(data.data_expiracao || '')
        setCliques(data.cliques || [])
      }
    } catch (error: any) {
      setMensagem({ texto: `Erro ao carregar: ${error.message}`, tipo: 'erro' })
    } finally {
      setLoading(false)
    }
  }

  const handleAtualizarPerfil = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    setMensagem({ texto: '', tipo: '' })

    let fotoUrlFinal = fotoUrl // Mantém a URL antiga por padrão

    try {
      // Se o usuário selecionou uma imagem nova, faz o upload para o Supabase
      if (imagemFile) {
        const extensao = imagemFile.name.split('.').pop()
        const nomeArquivo = `${userId}-${Date.now()}.${extensao}`
        
        const { error: uploadError } = await supabase.storage
          .from('imagens')
          .upload(nomeArquivo, imagemFile)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('imagens')
          .getPublicUrl(nomeArquivo)

        fotoUrlFinal = urlData.publicUrl
        setFotoUrl(fotoUrlFinal) // Atualiza na tela
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          nome,
          link_site: linkSite,
          titulo_ebook: titulo,
          descricao,
          link_venda: linkVenda,
          foto_url: fotoUrlFinal
        })
        .eq('id', userId)

      if (error) throw error

      setMensagem({ texto: 'Alterações salvas com sucesso!', tipo: 'sucesso' })
      setImagemFile(null) // Limpa o arquivo selecionado após salvar
    } catch (error: any) {
      setMensagem({ texto: `Erro ao salvar: ${error.message}`, tipo: 'erro' })
    } finally {
      setSalvando(false)
    }
  }

  const alternarStatus = async () => {
    if (status === 'pendente') {
      setMensagem({ texto: 'Seu anúncio está aguardando confirmação de pagamento para ser ativado.', tipo: 'erro' })
      return
    }

    const novoStatus = status === 'ativo' ? 'inativo' : 'ativo'
    const { error } = await supabase.from('profiles').update({ status: novoStatus }).eq('id', userId)

    if (!error) {
      setStatus(novoStatus)
      setMensagem({ texto: `Anúncio ${novoStatus === 'ativo' ? 'reativado' : 'pausado'} com sucesso!`, tipo: 'sucesso' })
    }
  }

  const renderizarResumoCliques = () => {
    if (cliques.length === 0) return <p className="text-sm text-slate-500">Nenhum clique registrado ainda.</p>
    
    const contagem: Record<string, number> = {}
    cliques.forEach(c => {
      const origemLimpa = c.origem || 'Direto/Desconhecido'
      contagem[origemLimpa] = (contagem[origemLimpa] || 0) + 1
    })

    return (
      <div className="text-sm">
        <ul className="space-y-2 mt-3">
          {Object.entries(contagem).map(([origem, qtd]) => (
            <li key={origem} className="flex justify-between items-center border-b border-slate-100 pb-2 last:border-0">
              <span className="text-slate-600 truncate pr-4">{origem}</span>
              <span className="font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-md">{qtd}x</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-emerald-600 animate-pulse font-bold text-lg">Carregando painel...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto max-w-4xl grid md:grid-cols-3 gap-6">
        
        {/* COLUNA ESQUERDA: Status e Estatísticas */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Status do Anúncio</h3>
            
            <div className="flex items-center gap-3 mb-4">
              <span className="relative flex h-3 w-3">
                {status === 'ativo' && (
                  <><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></>
                )}
                {status === 'inativo' && <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-400"></span>}
                {status === 'pendente' && <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400"></span>}
              </span>
              <span className="font-medium text-slate-700 capitalize">{status}</span>
            </div>

            {dataExpiracao && (
              <p className="text-xs text-slate-500 mb-4">
                Expira em: <strong className="text-slate-700">{new Date(dataExpiracao).toLocaleDateString('pt-BR')}</strong>
              </p>
            )}

            <button 
              onClick={alternarStatus}
              disabled={status === 'pendente'}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                status === 'ativo' ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50'
              }`}
            >
              {status === 'ativo' ? <><PauseCircle className="size-4" /> Pausar Anúncio</> : <><PlayCircle className="size-4" /> Reativar Anúncio</>}
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
              <h3 className="font-bold text-slate-900">Meus Cliques</h3>
              <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md text-sm font-bold">
                <MousePointerClick className="size-4" />
                {cliques.length}
              </div>
            </div>
            {renderizarResumoCliques()}
          </div>
        </div>

        {/* COLUNA DIREITA: Formulário de Edição */}
        <div className="md:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-2xl font-serif font-bold text-slate-900 mb-6">Editar Detalhes da Oferta</h2>

          {mensagem.texto && (
            <div className={`mb-6 p-4 rounded-lg text-sm font-medium flex items-center gap-2 ${mensagem.tipo === 'erro' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
              <AlertCircle className="size-4" />
              {mensagem.texto}
            </div>
          )}

          <form onSubmit={handleAtualizarPerfil} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">Nome do Autor / Produtor</label>
              <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} className="block w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:ring-2 focus:ring-emerald-600 outline-none transition-all" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">Link do Site</label>
              <input type="url" required value={linkSite} onChange={(e) => setLinkSite(e.target.value)} className="block w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:ring-2 focus:ring-emerald-600 outline-none transition-all" placeholder="https://seusite.com.br" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">Título do E-book ou Curso</label>
              <input type="text" required value={titulo} onChange={(e) => setTitulo(e.target.value)} className="block w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:ring-2 focus:ring-emerald-600 outline-none transition-all" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">Link da Página de Vendas (Checkout)</label>
              <input type="url" required value={linkVenda} onChange={(e) => setLinkVenda(e.target.value)} className="block w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:ring-2 focus:ring-emerald-600 outline-none transition-all" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Capa do Material (Imagem)</label>
              
              {fotoUrl && !imagemFile && (
                <div className="mb-4">
                  <p className="text-xs text-slate-500 mb-2">Capa atual salva no sistema:</p>
                  <img src={fotoUrl} alt="Capa atual" className="h-32 object-contain rounded-lg border border-slate-200" />
                </div>
              )}
              
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setImagemFile(e.target.files ? e.target.files[0] : null)} 
                className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2.5 file:px-4
                  file:rounded-xl file:border-0
                  file:text-sm file:font-bold
                  file:bg-emerald-50 file:text-emerald-700
                  hover:file:bg-emerald-100 transition-all cursor-pointer border border-slate-200 rounded-xl bg-slate-50 p-2" 
              />
              <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">
                Selecione um arquivo apenas se desejar trocar a capa atual. Recomendamos imagens reais e fotografias de alta qualidade. Por favor, evite enviar ilustrações, desenhos ou gráficos no formato cartoon/sci-fi.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">Descrição</label>
              <textarea rows={5} required value={descricao} onChange={(e) => setDescricao(e.target.value)} className="block w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:ring-2 focus:ring-emerald-600 outline-none resize-y transition-all" />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button type="submit" disabled={salvando} className="w-full bg-emerald-600 text-white p-4 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors font-bold text-lg shadow-md">
                {salvando ? 'Salvando Alterações e Imagem...' : 'Atualizar Dados na Vitrine'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}