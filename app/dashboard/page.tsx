'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Clique = { origem: string }

type MeuAnuncio = {
  id: string
  nome: string
  email: string
  link_site: string
  descricao: string
  titulo_ebook: string
  plano_selecionado: string
  status: string
  imagem_url?: string
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
      
    if (data) setAnuncios(data)
    setCarregando(false)
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
    
    // Atualizar um anúncio existente
    if (telaAtiva === 'editar' && anuncioEmEdicao.id) {
      const { error } = await supabase.from('profiles').update({
          titulo_ebook: anuncioEmEdicao.titulo_ebook,
          link_site: anuncioEmEdicao.link_site,
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
    
    // Cadastrar um NOVO anúncio
    else if (telaAtiva === 'novo') {
      const { error } = await supabase.from('profiles').insert([{
          id: crypto.randomUUID(), 
          nome: anuncioEmEdicao.nome || 'Autor',
          email: usuarioLogado,
          link_site: anuncioEmEdicao.link_site,
          descricao: anuncioEmEdicao.descricao,
          titulo_ebook: anuncioEmEdicao.titulo_ebook,
          imagem_url: anuncioEmEdicao.imagem_url,
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

  // Verifica se existe algum anúncio travado como pendente
  const temAnuncioPendente = anuncios.some(a => a.status?.toLowerCase() === 'pendente')

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Cabeçalho do Painel */}
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

        {/* ALERTA DE RESGATE DE CARRINHO (Só aparece se tiver anúncio pendente) */}
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

        {/* Lista de Anúncios */}
        {telaAtiva === 'lista' && anuncios.map(anuncio => (
            <div key={anuncio.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="font-bold text-xl text-slate-900 mb-1 flex items-center flex-wrap gap-2">
                    {anuncio.titulo_ebook || 'Produto sem título'}
                    
                    {/* ETIQUETA DE STATUS VISUAL */}
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md tracking-wide border ${
                      anuncio.status?.toLowerCase() === 'ativo' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      anuncio.status?.toLowerCase() === 'pendente' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {anuncio.status || 'Pendente'}
                    </span>
                  </h2>
                  <p className="text-sm text-slate-500">Site/Link: {anuncio.link_site || 'Não cadastrado'}</p>
                </div>
                
                <button 
                  onClick={() => { setAnuncioEmEdicao(anuncio); setTelaAtiva('editar') }} 
                  className="bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 px-4 py-2 rounded-lg text-sm font-bold transition-colors shrink-0"
                >
                  ✏️ Editar Oferta
                </button>
            </div>
        ))}

        {/* Formulário de Edição e Criação */}
        {(telaAtiva === 'editar' || telaAtiva === 'novo') && (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-2xl mx-auto">
                <h2 className="text-2xl font-serif font-bold text-slate-900 mb-6">
                  {telaAtiva === 'editar' ? 'Editar Anúncio' : 'Cadastrar Nova Oferta'}
                </h2>
                
                <form onSubmit={salvarEdicao} className="space-y-5">
                    
                    {telaAtiva === 'novo' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-1">Seu Nome / Autor</label>
                        <input type="text" required value={anuncioEmEdicao.nome || ''} onChange={e => setAnuncioEmEdicao({...anuncioEmEdicao, nome: e.target.value})} className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-emerald-600 transition-all" placeholder="Como você assina a obra" />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-1">Título do E-book ou Curso</label>
                      <input type="text" required value={anuncioEmEdicao.titulo_ebook || ''} onChange={e => setAnuncioEmEdicao({...anuncioEmEdicao, titulo_ebook: e.target.value})} className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-emerald-600 transition-all" placeholder="Digite o título" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-1">Link do Site / Checkout</label>
                      <input type="url" required value={anuncioEmEdicao.link_site || ''} onChange={e => setAnuncioEmEdicao({...anuncioEmEdicao, link_site: e.target.value})} className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-emerald-600 transition-all" placeholder="https://..." />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-1">Descrição</label>
                      <textarea required value={anuncioEmEdicao.descricao || ''} onChange={e => setAnuncioEmEdicao({...anuncioEmEdicao, descricao: e.target.value})} className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-emerald-600 transition-all" placeholder="Descrição do material" rows={4} />
                    </div>
                    
                    <div className="border border-slate-200 bg-slate-50 p-5 rounded-xl">
                        <label className="block text-sm font-medium text-slate-900 mb-2">Capa do Material</label>
                        
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleUploadCapa} 
                          disabled={uploading}
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