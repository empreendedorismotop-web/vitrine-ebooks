'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Clique = { origem: string }

type MeuAnuncio = {
  id: string
  nome: string
  email: string
  telefone?: string 
  link_site: string
  descricao: string
  titulo_ebook: string
  plano_selecionado: string
  status: string
  imagem_url?: string
  link_curto?: string 
  cliques?: Clique[]
}

export default function ClienteDashboard() {
  const router = useRouter()
  const [anuncios, setAnuncios] = useState<MeuAnuncio[]>([])
  const [usuarioLogado, setUsuarioLogado] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [uploading, setUploading] = useState(false)
  
  const [telaAtiva, setTelaAtiva] = useState<'lista' | 'editar' | 'novo'>('lista')
  const [anuncioEmEdicao, setAnuncioEmEdicao] = useState<Partial<MeuAnuncio>>({})
  
  const [linkCopiadoId, setLinkCopiadoId] = useState<string | null>(null)

  useEffect(() => {
    verificarSessao()
  }, [])

  const verificarSessao = async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      router.push('/login')
      return
    }
    setUsuarioLogado(user.email || null)
    buscarMeusAnuncios(user.email!)
  }

  const buscarMeusAnuncios = async (email: string) => {
    setCarregando(true)
    const { data } = await supabase
      .from('profiles')
      .select('*, cliques(origem)')
      .eq('email', email)
      .order('created_at', { ascending: false })
      
    if (data) {
      // AUTO-ENCURTADOR: Garante que anúncios velhos ganhem link curto na hora
      const anunciosProcessados = await Promise.all(
        data.map(async (anuncio) => {
          if (!anuncio.link_curto || anuncio.link_curto.trim() === '') {
            const novoCodigoCurto = Math.random().toString(36).substring(2, 8)
            await supabase.from('profiles').update({ link_curto: novoCodigoCurto }).eq('id', anuncio.id)
            return { ...anuncio, link_curto: novoCodigoCurto }
          }
          return anuncio
        })
      )
      setAnuncios(anunciosProcessados)
    }
    setCarregando(false)
  }

  // ==========================================
  // FUNÇÃO DE EXCLUIR ANÚNCIO
  // ==========================================
  const excluirAnuncio = async (id: string) => {
    if (confirm('🚨 Tem certeza que deseja excluir esta oferta permanentemente? Essa ação não pode ser desfeita.')) {
      const { error } = await supabase.from('profiles').delete().eq('id', id)
      if (error) {
        alert('Erro ao excluir anúncio: ' + error.message)
      } else {
        alert('✅ Anúncio excluído com sucesso!')
        if (usuarioLogado) buscarMeusAnuncios(usuarioLogado)
      }
    }
  }

  const copiarLinkDeDivulgacao = (anuncio: MeuAnuncio) => {
    const codigoParaLink = anuncio.link_curto || anuncio.id
    const urlEncurtada = `${window.location.origin}/p/${codigoParaLink}`
    
    navigator.clipboard.writeText(urlEncurtada).then(() => {
      setLinkCopiadoId(anuncio.id)
      setTimeout(() => setLinkCopiadoId(null), 3000) 
    })
  }

  const handleUploadCapa = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      const file = e.target.files?.[0]
      if (!file) { setUploading(false); return }

      const extensao = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${extensao}`
      
      const { error: uploadError } = await supabase.storage
        .from('imagens')
        .upload(fileName, file)
      
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('imagens').getPublicUrl(fileName)
      
      setAnuncioEmEdicao(prev => ({ ...prev, imagem_url: data.publicUrl }))
    } catch (error: any) {
      alert('Erro ao enviar imagem: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const salvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!anuncioEmEdicao.imagem_url) {
      alert('⚠️ Atenção: O upload da Capa do Material é obrigatório antes de salvar!')
      return
    }
    
    if (telaAtiva === 'editar' && anuncioEmEdicao.id) {
      const { error } = await supabase.from('profiles').update({
          titulo_ebook: anuncioEmEdicao.titulo_ebook,
          link_site: anuncioEmEdicao.link_site,
          telefone: anuncioEmEdicao.telefone,
          descricao: anuncioEmEdicao.descricao, 
          imagem_url: anuncioEmEdicao.imagem_url
        }).eq('id', anuncioEmEdicao.id)
        
      if (error) { 
        alert(`Erro detalhado do Supabase:\n\n${error.message}`)
        return 
      }
      
      alert('Anúncio atualizado com sucesso!')
      setTelaAtiva('lista')
      if (usuarioLogado) buscarMeusAnuncios(usuarioLogado)
    } 
    
    else if (telaAtiva === 'novo') {
      const codigoCurtoGerado = Math.random().toString(36).substring(2, 8)

      const { error } = await supabase.from('profiles').insert([{
          id: crypto.randomUUID(), 
          nome: anuncioEmEdicao.nome || 'Autor',
          email: usuarioLogado,
          telefone: anuncioEmEdicao.telefone,
          link_site: anuncioEmEdicao.link_site,
          descricao: anuncioEmEdicao.descricao,
          titulo_ebook: anuncioEmEdicao.titulo_ebook,
          imagem_url: anuncioEmEdicao.imagem_url,
          link_curto: codigoCurtoGerado, 
          plano_selecionado: 'Pendente',
          status: 'pendente' 
        }])
        
      if (error) { 
        alert(`Erro detalhado do Supabase:\n\n${error.message}`)
        return 
      }
        
      alert('Informações salvas! Redirecionando para a escolha do plano...')
      router.push('/planos')
    }
  }

  if (carregando) return <div className="p-8 text-center mt-20 font-bold text-slate-500">Carregando seu painel...</div>

  const temAnuncioPendente = anuncios.some(a => a.status?.toLowerCase() === 'pendente')

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-serif font-bold text-slate-900">Meu Painel</h1>
              <p className="text-slate-500 text-sm mt-1">{usuarioLogado}</p>
            </div>
            <div className="flex gap-3">
              {telaAtiva !== 'lista' && (
                <button onClick={() => setTelaAtiva('lista')} className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold px-4 py-2 rounded-lg transition-colors">
                  Voltar
                </button>
              )}
              {telaAtiva === 'lista' && (
                <button onClick={() => { setAnuncioEmEdicao({ email: usuarioLogado || '' }); setTelaAtiva('novo') }} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg transition-colors shadow-sm">
                  + Novo Anúncio
                </button>
              )}
            </div>
        </div>

        {telaAtiva === 'lista' && temAnuncioPendente && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-2xl shadow-sm mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-amber-900 font-bold text-lg flex items-center gap-2">
                ⚠️ Seu anúncio está quase pronto!
              </h3>
              <p className="text-amber-700 text-sm mt-1">
                Falta apenas escolher um plano para ativá-lo na vitrine. Não perca a chance de receber cliques hoje mesmo!
              </p>
            </div>
            <button
              onClick={() => router.push('/planos')}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.4)] animate-pulse transition-all shrink-0"
            >
              Escolher Plano e Ativar
            </button>
          </div>
        )}

        {telaAtiva === 'lista' && anuncios.map(anuncio => (
            <div key={anuncio.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-4 flex flex-col hover:shadow-md transition-shadow">
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="font-bold text-xl text-slate-900 mb-1 flex items-center flex-wrap gap-2">
                      {anuncio.titulo_ebook || 'Produto sem título'}
                      
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md tracking-wide border ${
                        anuncio.status?.toLowerCase() === 'ativo' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                        anuncio.status?.toLowerCase() === 'pendente' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {anuncio.status || 'Pendente'}
                      </span>
                    </h2>
                    <p className="text-sm text-slate-500">Site/Link: <a href={anuncio.link_site} target="_blank" className="text-blue-500 hover:underline">{anuncio.link_site || 'Não cadastrado'}</a></p>
                    
                    {anuncio.link_curto && (
                      <p className="text-sm font-mono text-emerald-600 mt-2 bg-emerald-50 inline-block px-2 py-1 rounded">
                        Link Curto: /p/{anuncio.link_curto}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                    <button 
                      onClick={() => copiarLinkDeDivulgacao(anuncio)} 
                      className={`px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center gap-2 flex-1 md:flex-none justify-center ${linkCopiadoId === anuncio.id ? 'bg-emerald-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'}`}
                    >
                      {linkCopiadoId === anuncio.id ? '✅ Link Copiado!' : '🔗 Copiar Link de Divulgação'}
                    </button>

                    <button 
                      onClick={() => { setAnuncioEmEdicao(anuncio); setTelaAtiva('editar') }} 
                      className="bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 px-4 py-2 rounded-lg text-sm font-bold transition-colors shrink-0 flex-1 md:flex-none"
                    >
                      ✏️ Editar
                    </button>

                    {/* BOTÃO EXCLUIR */}
                    <button 
                      onClick={() => excluirAnuncio(anuncio.id)} 
                      className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-4 py-2 rounded-lg text-sm font-bold transition-colors shrink-0 flex-1 md:flex-none"
                    >
                      🗑️ Excluir
                    </button>
                  </div>
                </div>

                {/* ESTATÍSTICAS DE CLIQUES E ORIGENS */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4">
                  <div className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm">
                    🖱️ {anuncio.cliques?.length || 0} Cliques Totais
                  </div>
                  
                  {anuncio.cliques && anuncio.cliques.length > 0 && (
                    <div className="flex gap-2 flex-wrap items-center">
                      <span className="text-xs text-slate-500 font-bold uppercase">Origem dos cliques:</span>
                      {Array.from(new Set(anuncio.cliques.map(c => c.origem))).map(origem => (
                        <span key={origem} className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold border border-slate-200 shadow-sm capitalize">
                          {origem}: {anuncio.cliques!.filter(c => c.origem === origem).length}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

            </div>
        ))}

        {(telaAtiva === 'editar' || telaAtiva === 'novo') && (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-2xl mx-auto">
                <h2 className="text-2xl font-serif font-bold text-slate-900 mb-6">
                  {telaAtiva === 'editar' ? 'Editar Anúncio' : 'Cadastrar Nova Oferta'}
                </h2>
                
                <form onSubmit={salvarEdicao} className="space-y-5">
                    
                    {telaAtiva === 'novo' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-1">Seu Nome / Autor *</label>
                        <input type="text" required value={anuncioEmEdicao.nome || ''} onChange={e => setAnuncioEmEdicao({...anuncioEmEdicao, nome: e.target.value})} className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-emerald-600 transition-all" placeholder="Como você assina a obra" />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-1">Título do E-book ou Curso *</label>
                        <input type="text" required value={anuncioEmEdicao.titulo_ebook || ''} onChange={e => setAnuncioEmEdicao({...anuncioEmEdicao, titulo_ebook: e.target.value})} className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-emerald-600 transition-all" placeholder="Digite o título" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-1">WhatsApp / Telefone *</label>
                        <input type="text" required value={anuncioEmEdicao.telefone || ''} onChange={e => setAnuncioEmEdicao({...anuncioEmEdicao, telefone: e.target.value})} className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-emerald-600 transition-all" placeholder="Ex: 61982..." />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-1">Link do Site / Checkout *</label>
                      <input type="url" required value={anuncioEmEdicao.link_site || ''} onChange={e => setAnuncioEmEdicao({...anuncioEmEdicao, link_site: e.target.value})} className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-emerald-600 transition-all" placeholder="https://..." />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-1">Descrição do Material *</label>
                      <textarea required value={anuncioEmEdicao.descricao || ''} onChange={e => setAnuncioEmEdicao({...anuncioEmEdicao, descricao: e.target.value})} className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-emerald-600 transition-all" placeholder="Texto que aparece na vitrine..." rows={4} />
                    </div>
                    
                    <div className="border border-slate-200 bg-slate-50 p-5 rounded-xl">
                        <label className="block text-sm font-medium text-slate-900 mb-2">
                          Capa do Material * <span className="text-xs text-slate-500 font-normal">(Recomendado: 1000x1500px na vertical)</span>
                        </label>
                        
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleUploadCapa} 
                          disabled={uploading}
                          required={!anuncioEmEdicao.imagem_url} 
                          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 transition-colors cursor-pointer mb-2" 
                        />
                        
                        {uploading && <p className="text-sm font-bold text-blue-600 animate-pulse mt-2">Enviando imagem para o servidor...</p>}

                        {anuncioEmEdicao.imagem_url && !uploading && (
                          <div className="mt-4 flex flex-col items-center bg-white p-4 rounded-lg border border-slate-200">
                            <span className="text-xs font-bold text-slate-400 mb-2 uppercase">Capa Atual</span>
                            <img src={anuncioEmEdicao.imagem_url} alt="Capa" className="h-40 object-contain rounded shadow-sm" />
                          </div>
                        )}
                    </div>
                    
                    <button type="submit" disabled={uploading} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white w-full py-4 rounded-xl font-bold text-lg shadow-md transition-colors mt-4">
                      {uploading ? 'Aguarde o upload...' : telaAtiva === 'novo' ? 'Avançar para Planos' : 'Salvar Alterações'}
                    </button>
                </form>
            </div>
        )}
      </div>
    </div>
  )
}