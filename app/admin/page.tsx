'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Clique = { origem: string }

type Perfil = {
  id: string
  nome: string
  email: string
  telefone?: string 
  link_site: string 
  titulo_ebook: string
  descricao?: string 
  plano_selecionado: string
  status: string
  data_expiracao?: string
  created_at?: string
  ultimo_email_enviado?: string
  imagem_url?: string
  cliques?: Clique[]
  posicao_fixa?: number | null 
}

type FilaItem = {
  id: string
  perfil_id?: string
  nome: string
  email: string
  assunto: string
  mensagem?: string
  texto_botao?: string
  url_botao?: string
  base_url?: string
  agendado_para: string
  status: string
  clicou?: boolean
  provedor?: string 
}

export default function AdminPage() {
  const router = useRouter()
  const [autorizado, setAutorizado] = useState(false) 

  // ⚠️ SEU E-MAIL DEFINIDO AQUI ⚠️
  const EMAIL_ADMIN = 'josevg10@gmail.com' 

  const [perfis, setPerfis] = useState<Perfil[]>([])
  const [fila, setFila] = useState<FilaItem[]>([]) 
  const [abaAtiva, setAbaAtiva] = useState('pendente')
  const [abaFila, setAbaFila] = useState('pendente') 
  const [notificacao, setNotificacao] = useState({ mostrar: false, msg: '', tipo: '' })
  const [selecionados, setSelecionados] = useState<string[]>([])
  
  const [assuntoCampanha, setAssuntoCampanha] = useState('')
  const [textoCampanha, setTextoCampanha] = useState('')
  const [textoBotao, setTextoBotao] = useState('')
  const [urlBotao, setUrlBotao] = useState('')
  const [provedor, setProvedor] = useState('gmail') 
  const [qtdEnvioDesejada, setQtdEnvioDesejada] = useState(50)
  const [tamanhoLote, setTamanhoLote] = useState(2) 
  const [intervaloLote, setIntervaloLote] = useState(1) 
  const [enviandoMassa, setEnviandoMassa] = useState(false)

  const [modalLimpezaAberto, setModalLimpezaAberto] = useState(false)
  const [diasInatividade, setDiasInatividade] = useState(90)
  const [perfilEditando, setPerfilEditando] = useState<Perfil | null>(null)
  const [uploading, setUploading] = useState(false) 

  useEffect(() => {
    verificarSeguranca()
  }, [])

  const verificarSeguranca = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user || user.email !== EMAIL_ADMIN) {
      router.push('/login')
      return
    }
    
    setAutorizado(true)
    carregarPerfis()
    carregarFila()
    
    const intervalo = setInterval(() => { carregarFila() }, 15000)
    return () => clearInterval(intervalo)
  }

  const carregarPerfis = async () => {
    const { data } = await supabase.from('profiles').select('*, cliques(origem)').order('created_at', { ascending: false })
    if (data) setPerfis(data)
  }

  const carregarFila = async () => {
    const { data } = await supabase.from('fila_envios').select('*').order('agendado_para', { ascending: true })
    if (data) setFila(data)
  }

  const mostrarNotificacao = (msg: string, tipo: 'sucesso' | 'erro') => {
    setNotificacao({ mostrar: true, msg, tipo })
    setTimeout(() => setNotificacao({ mostrar: false, msg: '', tipo: '' }), 6000)
  }

  const formatarLinkWhatsApp = (numero?: string) => {
    if (!numero) return '#'
    const apenasNumeros = numero.replace(/\D/g, '')
    return apenasNumeros.startsWith('55') ? `https://wa.me/${apenasNumeros}` : `https://wa.me/55${apenasNumeros}`
  }

  const baixarCSV = () => {
    const cabecalho = ['Nome', 'Email', 'Telefone', 'Status', 'Plano', 'Vencimento', 'Cliques', 'Posição VIP', 'Data de Cadastro']
    const linhas = perfis.map(p => [
        `"${p.nome || ''}"`, `"${p.email || ''}"`, `"${p.telefone || ''}"`, `"${p.status || ''}"`, `"${p.plano_selecionado || ''}"`,
        `"${p.data_expiracao ? p.data_expiracao.split('T')[0] : ''}"`, `"${p.cliques?.length || 0}"`,
        `"${p.posicao_fixa || 'Nenhuma'}"`, `"${p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : ''}"`
    ])
    const conteudo = [cabecalho, ...linhas].map(e => e.join(',')).join('\n')
    const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', 'contatos_vitrine.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const dataLimite = new Date()
  dataLimite.setDate(dataLimite.getDate() - diasInatividade)

  const contatosFrios = perfis.filter(p => {
    if (p.status !== 'inativo') return false
    const clicouAlgumaVez = p.cliques && p.cliques.length > 0
    if (clicouAlgumaVez) return false
    const dataCadastro = p.created_at ? new Date(p.created_at) : new Date()
    return dataCadastro < dataLimite
  })

  const executarLimpezaFrios = async () => {
    const idsParaExcluir = contatosFrios.map(p => p.id)
    if (idsParaExcluir.length === 0) {
      setModalLimpezaAberto(false)
      return mostrarNotificacao('Nenhum contato inativo antigo encontrado.', 'sucesso')
    }
    const { error } = await supabase.from('profiles').delete().in('id', idsParaExcluir)
    if (error) {
      mostrarNotificacao('Erro ao limpar contatos.', 'erro')
    } else {
      mostrarNotificacao(`${idsParaExcluir.length} contatos frios excluídos com sucesso!`, 'sucesso')
      setModalLimpezaAberto(false)
      carregarPerfis()
    }
  }

  const handleUploadCapaAdmin = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      const file = e.target.files?.[0]
      if (!file || !perfilEditando) { setUploading(false); return }

      const extensao = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${extensao}`
      
      const { error: uploadError } = await supabase.storage.from('imagens').upload(fileName, file)
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('imagens').getPublicUrl(fileName)
      setPerfilEditando(prev => prev ? { ...prev, imagem_url: data.publicUrl } : null)
    } catch (error: any) {
      mostrarNotificacao('Erro ao enviar imagem.', 'erro')
    } finally {
      setUploading(false)
    }
  }

  const salvarEdicaoAnuncio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perfilEditando) return;

    const { error } = await supabase.from('profiles').update({
      nome: perfilEditando.nome,
      titulo_ebook: perfilEditando.titulo_ebook,
      descricao: perfilEditando.descricao, 
      link_site: perfilEditando.link_site,
      imagem_url: perfilEditando.imagem_url
    }).eq('id', perfilEditando.id);

    if (error) {
      mostrarNotificacao('Erro ao salvar.', 'erro');
    } else {
      mostrarNotificacao('Anúncio atualizado com sucesso!', 'sucesso');
      setPerfilEditando(null); 
      carregarPerfis(); 
    }
  }

  const mudarStatus = async (id: string, novoStatus: string) => {
    await supabase.from('profiles').update({ status: novoStatus }).eq('id', id)
    mostrarNotificacao(`Status alterado para ${novoStatus.toUpperCase()}`, 'sucesso')
    carregarPerfis()
  }

  const mudarPosicaoFixa = async (id: string, posicao: string) => {
    const valorParaSalvar = posicao === 'nenhuma' ? null : Number(posicao);
    const { error } = await supabase.from('profiles').update({ posicao_fixa: valorParaSalvar }).eq('id', id)
    if (error) mostrarNotificacao('Erro ao alterar VIP.', 'erro')
    else { mostrarNotificacao('Posição VIP atualizada!', 'sucesso'); carregarPerfis() }
  }

  const mudarPlano = async (id: string, novoPlano: string) => {
    const { error } = await supabase.from('profiles').update({ plano_selecionado: novoPlano }).eq('id', id)
    if (error) mostrarNotificacao('Erro ao alterar plano.', 'erro')
    else { mostrarNotificacao('Plano atualizado!', 'sucesso'); carregarPerfis() }
  }

  const mudarDataExpiracao = async (id: string, novaData: string) => {
    const { error } = await supabase.from('profiles').update({ data_expiracao: novaData || null }).eq('id', id)
    if (error) mostrarNotificacao('Erro ao alterar vencimento.', 'erro')
    else { mostrarNotificacao('Data de vencimento salva!', 'sucesso'); carregarPerfis() }
  }

  const excluirPerfil = async (id: string) => {
    if (confirm('EXCLUIR este cliente definitivamente?')) {
      await supabase.from('profiles').delete().eq('id', id)
      mostrarNotificacao('Cliente excluído.', 'sucesso')
      carregarPerfis()
    }
  }

  const dispararLembretePendente = async (perfil: Perfil) => {
    if (confirm(`Enviar lembrete de ativação para ${perfil.nome}?`)) {
      fetch('/api/enviar-lembrete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: perfil.email, nome: perfil.nome, titulo: perfil.titulo_ebook || '', plano: perfil.plano_selecionado || '' })
      }).catch(err => console.error(err))

      const novoEnvio = {
        perfil_id: perfil.id, email: perfil.email, nome: perfil.nome, assunto: `Finalize seu cadastro!`,
        mensagem: 'Notamos que seu anúncio aguarda ativação. Escolha um plano para publicar sua oferta!', texto_botao: 'Ativar Agora', 
        url_botao: `${window.location.origin}/planos`, base_url: window.location.origin, status: 'pendente', clicou: false, provedor: 'gmail', agendado_para: new Date().toISOString()
      }
      await supabase.from('fila_envios').insert([novoEnvio])
      mostrarNotificacao('Lembrete na Fila!', 'sucesso')
      carregarFila()
    }
  }

  const dispararLembreteInativo = async (perfil: Perfil) => {
    if (confirm(`Enviar renovação para ${perfil.nome}?`)) {
      const novoEnvio = {
        perfil_id: perfil.id, email: perfil.email, nome: perfil.nome, assunto: `⚠️ Seu acesso expirou!`,
        mensagem: 'Seu plano expirou e seu anúncio foi pausado. Clique para renovar.', texto_botao: 'Renovar', 
        url_botao: `${window.location.origin}/planos`, base_url: window.location.origin, status: 'pendente', clicou: false, provedor: 'gmail', agendado_para: new Date().toISOString()
      }
      await supabase.from('fila_envios').insert([novoEnvio])
      mostrarNotificacao('Renovação na Fila!', 'sucesso')
      setAbaAtiva('fila'); setAbaFila('pendente'); carregarFila()
    }
  }

  const removerDaFila = async (id: string) => { await supabase.from('fila_envios').delete().eq('id', id); carregarFila() }
  const limparHistoricoEnviados = async () => { if (confirm('Apagar TODO o histórico?')) { await supabase.from('fila_envios').delete().eq('status', 'enviado'); carregarFila() } }
  const esvaziarFila = async () => { if (confirm('Cancelar PENDENTES?')) { await supabase.from('fila_envios').delete().eq('status', 'pendente'); carregarFila(); } }

  const reenviarParaNaoClicadores = async () => {
    const naoClicaram = fila.filter(item => item.status === 'enviado' && !item.clicou)
    if (naoClicaram.length === 0) return mostrarNotificacao('Todos já clicaram!', 'sucesso')

    if (confirm(`Reenviar para ${naoClicaram.length} clientes que ignoraram?`)) {
      setEnviandoMassa(true)
      const registrosFila = []
      let tempoAgendado = new Date() 
      for (let i = 0; i < naoClicaram.length; i += 2) {
        const lote = naoClicaram.slice(i, i + 2)
        for (const item of lote) {
          registrosFila.push({
            perfil_id: item.perfil_id, email: item.email, nome: item.nome, assunto: `[Lembrete] ${item.assunto}`,
            mensagem: item.mensagem || 'Você não abriu nosso último e-mail. Aqui está!', texto_botao: item.texto_botao || 'Acessar Agora', 
            url_botao: item.url_botao || window.location.origin, base_url: item.base_url || window.location.origin,
            status: 'pendente', clicou: false, provedor: provedor, agendado_para: tempoAgendado.toISOString() 
          })
        }
        tempoAgendado = new Date(tempoAgendado.getTime() + 60000)
      }
      await supabase.from('fila_envios').insert(registrosFila)
      mostrarNotificacao(`${registrosFila.length} e-mails agendados!`, 'sucesso')
      setAbaFila('pendente'); carregarFila(); setEnviandoMassa(false)
    }
  }

  const dispararCampanhaMassa = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selecionados.length === 0) return mostrarNotificacao('Selecione um cliente.', 'erro')
    setEnviandoMassa(true)
    
    const listaFinalIds = selecionados.slice(0, qtdEnvioDesejada)
    const clientesParaEnviar = perfis.filter(p => listaFinalIds.includes(p.id))
    const lotes = []
    for (let i = 0; i < clientesParaEnviar.length; i += tamanhoLote) lotes.push(clientesParaEnviar.slice(i, i + tamanhoLote))

    try {
      const registrosFila = []
      let tempoAgendado = new Date()
      for (let i = 0; i < lotes.length; i++) {
        for (const cliente of lotes[i]) {
          registrosFila.push({
            perfil_id: cliente.id, email: cliente.email, nome: cliente.nome, assunto: assuntoCampanha, mensagem: textoCampanha, texto_botao: textoBotao, url_botao: urlBotao,               
            base_url: window.location.origin, status: 'pendente', clicou: false, provedor: provedor, agendado_para: tempoAgendado.toISOString() 
          })
        }
        tempoAgendado = new Date(tempoAgendado.getTime() + (intervaloLote * 60000))
      }
      await supabase.from('fila_envios').insert(registrosFila)
      mostrarNotificacao(`Sucesso! ${listaFinalIds.length} agendados.`, 'sucesso')
      setSelecionados([]); setAssuntoCampanha(''); setTextoCampanha(''); setTextoBotao(''); setUrlBotao('')
      carregarFila() 
    } catch (error) { mostrarNotificacao('Erro.', 'erro') }
    setEnviandoMassa(false)
  }

  const toggleSelecao = (id: string) => setSelecionados(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id])
  const selecionarMassa = (qtd: number) => setSelecionados(perfis.filter(p => p.email).slice(0, qtd).map(p => p.id))
  const selecionarTodos = () => setSelecionados(perfis.filter(p => p.email).map(p => p.id))

  const perfisFiltrados = perfis.filter(p => p.status === abaAtiva)
  const filaFiltrada = fila.filter(item => item.status === abaFila)

  if (!autorizado) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-500">Verificando Credenciais...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 relative">
      
      {perfilEditando && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 bg-purple-50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-purple-900">✏️ Editar Anúncio (Admin)</h2>
                <p className="text-purple-700 text-xs mt-1">Alterando dados de: <strong>{perfilEditando.email}</strong></p>
              </div>
              <button onClick={() => setPerfilEditando(null)} className="text-purple-400 hover:text-purple-700 text-2xl font-bold">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form onSubmit={salvarEdicaoAnuncio} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Nome / Autor</label>
                    <input type="text" value={perfilEditando.nome || ''} onChange={e => setPerfilEditando({...perfilEditando, nome: e.target.value})} className="w-full p-2.5 border border-slate-300 bg-slate-50 rounded-lg outline-none text-sm focus:border-purple-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Título do Material</label>
                    <input type="text" value={perfilEditando.titulo_ebook || ''} onChange={e => setPerfilEditando({...perfilEditando, titulo_ebook: e.target.value})} className="w-full p-2.5 border border-slate-300 bg-slate-50 rounded-lg outline-none text-sm focus:border-purple-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Link de Destino</label>
                  <input type="url" value={perfilEditando.link_site || ''} onChange={e => setPerfilEditando({...perfilEditando, link_site: e.target.value})} className="w-full p-2.5 border border-slate-300 bg-slate-50 rounded-lg outline-none text-sm focus:border-purple-500" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
                  <textarea rows={4} value={perfilEditando.descricao || ''} onChange={e => setPerfilEditando({...perfilEditando, descricao: e.target.value})} className="w-full p-2.5 border border-slate-300 bg-slate-50 rounded-lg outline-none text-sm focus:border-purple-500" placeholder="Texto que aparece na vitrine..." />
                </div>
                
                <div className="border border-slate-200 bg-slate-50 p-5 rounded-xl">
                    <label className="block text-sm font-bold text-slate-900 mb-2">Capa do Material</label>
                    <input 
                      type="file" accept="image/*" onChange={handleUploadCapaAdmin} disabled={uploading}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 transition-colors cursor-pointer mb-2" 
                    />
                    {uploading && <p className="text-sm font-bold text-purple-600 animate-pulse mt-2">Enviando imagem...</p>}
                    {perfilEditando.imagem_url && !uploading && (
                      <div className="mt-4 flex flex-col items-start bg-white p-4 rounded-lg border border-slate-200">
                        <span className="text-xs font-bold text-slate-400 mb-2 uppercase">Capa Atual</span>
                        <img src={perfilEditando.imagem_url} alt="Capa" className="h-32 object-contain rounded shadow-sm" />
                      </div>
                    )}
                </div>
                
                <div className="pt-4 flex gap-3 justify-end border-t border-slate-100 mt-6">
                  <button type="button" onClick={() => setPerfilEditando(null)} className="px-5 py-2 rounded-lg font-bold text-slate-600 bg-slate-100 hover:bg-slate-200">Cancelar</button>
                  <button type="submit" disabled={uploading} className="px-5 py-2 rounded-lg font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md disabled:opacity-50">
                    {uploading ? 'Aguarde...' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {modalLimpezaAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-2xl font-bold text-slate-900">Limpeza de Contatos Frios</h2>
              <p className="text-slate-500 text-sm mt-1">Exclua leads que esfriaram para proteger o domínio e as suas campanhas.</p>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                <span className="text-xl">🛡️</span>
                <div>
                  <p className="font-bold text-emerald-800 text-sm mb-1">Trava de Segurança Ativada</p>
                  <p className="text-xs text-emerald-700">Fique tranquilo! Clientes com anúncios <strong>Ativos</strong> ou <strong>Pendentes</strong> estão blindados. O sistema buscará apenas os contatos que já estão na sua aba de <strong>Inativos</strong>.</p>
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">Selecione o Período de Inatividade Absoluta:</label>
                <select value={diasInatividade} onChange={(e) => setDiasInatividade(Number(e.target.value))} className="w-full p-3 border border-slate-200 rounded-lg outline-none font-bold text-slate-800 bg-white">
                  <option value={30}>Há mais de 30 dias (1 Mês)</option>
                  <option value={60}>Há mais de 60 dias (2 Meses)</option>
                  <option value={90}>Há mais de 90 dias (3 Meses - Recomendado)</option>
                  <option value={120}>Há mais de 120 dias (4 Meses)</option>
                </select>
              </div>
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                <p className="font-bold text-rose-800 mb-3 text-sm">
                  {contatosFrios.length === 0 
                    ? `Nenhum contato INATIVO e SEM CLIQUES cadastrado há mais de ${diasInatividade} dias foi encontrado.` 
                    : `⚠️ ${contatosFrios.length} contato(s) inativo(s) se encaixa(m) nessa regra e será(ão) excluído(s):`}
                </p>
                {contatosFrios.length > 0 && (
                  <div className="max-h-[200px] overflow-y-auto divide-y divide-rose-200/50 pr-2">
                    {contatosFrios.map(p => (
                      <div key={p.id} className="py-2 flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-700">{p.nome}</span>
                        <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded-md">{p.email}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setModalLimpezaAberto(false)} className="px-6 py-2.5 rounded-lg font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100">Cancelar</button>
              <button onClick={executarLimpezaFrios} disabled={contatosFrios.length === 0} className={`px-6 py-2.5 rounded-lg font-bold text-white ${contatosFrios.length === 0 ? 'bg-rose-300 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700 shadow-md'}`}>Confirmar e Excluir</button>
            </div>
          </div>
        </div>
      )}

      {notificacao.mostrar && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl font-bold text-white transition-all transform translate-y-0 ${notificacao.tipo === 'sucesso' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {notificacao.msg}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <h1 className="text-3xl font-serif font-bold text-slate-900">Painel de Controle e Automação</h1>
            <Link href="/dashboard" className="px-4 py-2 bg-indigo-100 text-indigo-700 font-bold rounded-lg text-sm hover:bg-indigo-200">
              👤 Acessar Meu Painel de Cliente
            </Link>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-8 border-b border-slate-200 pb-4">
          <button onClick={() => setAbaAtiva('pendente')} className={`px-5 py-2 rounded-lg font-bold text-sm ${abaAtiva === 'pendente' ? 'bg-amber-100 text-amber-800' : 'bg-white text-slate-600 border'}`}>Pendentes</button>
          <button onClick={() => setAbaAtiva('ativo')} className={`px-5 py-2 rounded-lg font-bold text-sm ${abaAtiva === 'ativo' ? 'bg-emerald-100 text-emerald-800' : 'bg-white text-slate-600 border'}`}>Ativos</button>
          <button onClick={() => setAbaAtiva('inativo')} className={`px-5 py-2 rounded-lg font-bold text-sm ${abaAtiva === 'inativo' ? 'bg-red-100 text-red-800' : 'bg-white text-slate-600 border'}`}>Inativos</button>
          
          <div className="flex items-center gap-2 ml-4 pl-4 border-l border-slate-300">
             <button onClick={baixarCSV} className="px-4 py-2 bg-slate-800 text-white font-bold rounded-lg text-sm hover:bg-slate-700 shadow-sm">📊 Baixar CSV</button>
             <button onClick={() => setModalLimpezaAberto(true)} className="px-4 py-2 bg-rose-50 text-rose-600 font-bold border border-rose-200 rounded-lg text-sm hover:bg-rose-100 shadow-sm">🧹 Limpar Frios</button>
          </div>
          
          <button onClick={() => setAbaAtiva('fila')} className={`px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 ml-auto ${abaAtiva === 'fila' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-700 border border-indigo-200'}`}>
            ⏳ Fila ({fila.filter(f => f.status === 'pendente').length})
          </button>
          <button onClick={() => setAbaAtiva('campanhas')} className={`px-5 py-2 rounded-lg font-bold text-sm ${abaAtiva === 'campanhas' ? 'bg-blue-600 text-white' : 'bg-white text-slate-800 border'}`}>📧 Disparos</button>
        </div>

        {['pendente', 'ativo', 'inativo'].includes(abaAtiva) && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {perfisFiltrados.length === 0 ? (
              <div className="p-12 text-center text-slate-500 font-bold text-lg">Nenhum cliente com status "{abaAtiva}" no momento.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {perfisFiltrados.map(perfil => (
                  <div key={perfil.id} className="p-5 flex flex-col md:flex-row justify-between gap-4 items-center hover:bg-slate-50 transition-colors">
                    <div>
                      <h3 className="font-bold text-slate-900">{perfil.nome}</h3>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-slate-600">{perfil.email}</p>
                        {perfil.telefone && (
                          <a href={formatarLinkWhatsApp(perfil.telefone)} target="_blank" rel="noopener noreferrer" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors flex items-center gap-1">
                            💬 Whats
                          </a>
                        )}
                        <span className="text-slate-300">|</span>
                        <p className="text-sm text-slate-600">Site: {perfil.link_site || 'Não informado'}</p>
                      </div>

                      {/* --- O VISUAL DOS CLIQUES VOLTOU AQUI --- */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-sm">
                          🖱️ {perfil.cliques?.length || 0} Cliques
                        </span>
                        {perfil.cliques && perfil.cliques.length > 0 && (
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200 max-w-[200px] truncate">
                            Última origem: <strong>{perfil.cliques[0].origem}</strong>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-4">
                        <div className="flex items-center gap-2 bg-indigo-50 px-2 py-1.5 rounded-md border border-indigo-100">
                          <label className="text-[10px] uppercase font-bold text-indigo-700 tracking-wide">Plano:</label>
                          <input type="text" list="sugestoes-planos" value={perfil.plano_selecionado || ''} onChange={(e) => mudarPlano(perfil.id, e.target.value)} placeholder="Ex: 5 meses" className="text-xs font-bold bg-white text-slate-700 border border-indigo-200 rounded p-1 outline-none w-28" />
                          <datalist id="sugestoes-planos">
                            <option value="1_mes">1 Mês</option><option value="3_meses">3 Meses</option><option value="6_meses">6 Meses</option><option value="12_meses">12 Meses</option><option value="vitalicio">Vitalício</option>
                          </datalist>
                        </div>

                        <div className="flex items-center gap-2 bg-rose-50 px-2 py-1.5 rounded-md border border-rose-100">
                          <label className="text-[10px] uppercase font-bold text-rose-700 tracking-wide">Vence em:</label>
                          <input type="date" value={perfil.data_expiracao ? perfil.data_expiracao.split('T')[0] : ''} onChange={(e) => mudarDataExpiracao(perfil.id, e.target.value)} className="text-xs font-bold bg-white text-slate-700 border border-rose-200 rounded p-1 outline-none" />
                        </div>
                        
                        <div className="flex items-center gap-2 bg-amber-50 px-2 py-1.5 rounded-md border border-amber-100">
                          <label className="text-[10px] uppercase font-bold text-amber-700 tracking-wide">Posição VIP:</label>
                          <select value={perfil.posicao_fixa || 'nenhuma'} onChange={(e) => mudarPosicaoFixa(perfil.id, e.target.value)} className="text-xs font-bold bg-white text-slate-700 border border-amber-200 rounded p-1 outline-none">
                            <option value="nenhuma">Padrão</option>
                            {[...Array(12)].map((_, i) => (<option key={i+1} value={i+1}>Top {i+1}</option>))}
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button onClick={() => setPerfilEditando(perfil)} className="px-4 py-2 bg-purple-100 text-purple-700 font-bold rounded-lg text-sm hover:bg-purple-200">✏️ Editar</button>
                      {abaAtiva === 'pendente' && (
                        <>
                           <button onClick={() => dispararLembretePendente(perfil)} className="px-4 py-2 bg-blue-100 text-blue-700 font-bold rounded-lg text-sm hover:bg-blue-200">📩 Lembrete</button>
                           <button onClick={() => mudarStatus(perfil.id, 'ativo')} className="px-4 py-2 bg-emerald-100 text-emerald-700 font-bold rounded-lg text-sm hover:bg-emerald-200">✅ Aprovar</button>
                        </>
                      )}
                      {abaAtiva === 'ativo' && (
                         <button onClick={() => mudarStatus(perfil.id, 'inativo')} className="px-4 py-2 bg-amber-100 text-amber-700 font-bold rounded-lg text-sm hover:bg-amber-200">⏸️ Pausar</button>
                      )}
                      {abaAtiva === 'inativo' && (
                         <>
                           <button onClick={() => dispararLembreteInativo(perfil)} className="px-4 py-2 bg-blue-100 text-blue-700 font-bold rounded-lg text-sm hover:bg-blue-200">🔔 Lembrete</button>
                           <button onClick={() => mudarStatus(perfil.id, 'ativo')} className="px-4 py-2 bg-emerald-100 text-emerald-700 font-bold rounded-lg text-sm hover:bg-emerald-200">▶️ Reativar</button>
                         </>
                      )}
                      <button onClick={() => excluirPerfil(perfil.id)} className="px-4 py-2 bg-red-50 text-red-600 font-bold rounded-lg text-sm border border-red-200 hover:bg-red-100">🗑️ Excluir</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {abaAtiva === 'fila' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-slate-50 gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Servidor de Envios</h2>
                <p className="text-sm text-slate-500 mt-1">Acompanhe cliques, status e limpe o histórico.</p>
              </div>
              <div className="flex bg-slate-200/50 p-1 rounded-lg">
                  <button onClick={() => setAbaFila('pendente')} className={`px-4 py-1.5 rounded-md text-sm font-bold ${abaFila === 'pendente' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Pendentes</button>
                  <button onClick={() => setAbaFila('enviado')} className={`px-4 py-1.5 rounded-md text-sm font-bold ${abaFila === 'enviado' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Enviados</button>
                  <button onClick={() => setAbaFila('erro')} className={`px-4 py-1.5 rounded-md text-sm font-bold ${abaFila === 'erro' ? 'bg-white text-red-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Com Erro</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {abaFila === 'pendente' && filaFiltrada.length > 0 && (
                  <button onClick={esvaziarFila} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 shadow-sm">🛑 Cancelar Pendentes</button>
                )}
                {abaFila === 'enviado' && filaFiltrada.length > 0 && (
                  <>
                    <button onClick={reenviarParaNaoClicadores} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700 shadow-sm">🔄 Reenviar (Não Clicou)</button>
                    <button onClick={limparHistoricoEnviados} className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-bold hover:bg-red-100">🧹 Limpar Tudo</button>
                  </>
                )}
              </div>
            </div>

            {filaFiltrada.length === 0 ? (
              <div className="p-12 text-center"><span className="text-4xl mb-4 block">{abaFila === 'pendente' ? '⏳' : abaFila === 'enviado' ? '✅' : '🛡️'}</span><p className="text-slate-500 font-bold text-lg">Nenhum e-mail {abaFila} no momento.</p></div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filaFiltrada.map(item => (
                  <div key={item.id} className="p-5 flex flex-col md:flex-row justify-between gap-4 items-center hover:bg-slate-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-slate-900">{item.nome} <span className="text-sm font-normal text-slate-500">({item.email})</span></p>
                        {abaFila === 'enviado' && (item.clicou ? <span className="text-[10px] uppercase bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md font-bold">🎯 Clicou</span> : <span className="text-[10px] uppercase bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-bold">🙈 Ignorou</span>)}
                        {item.provedor && <span className="text-[10px] uppercase bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-bold">{item.provedor}</span>}
                      </div>
                      <p className="text-sm text-slate-600 mt-1">Assunto: <span className="italic">{item.assunto}</span></p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500 font-bold uppercase">{abaFila === 'pendente' ? 'Agendado' : abaFila === 'enviado' ? 'Disparado' : 'Falha'}</p>
                        <p className={`text-sm font-bold px-3 py-1 rounded-md mt-1 ${abaFila === 'pendente' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'}`}>{new Date(item.agendado_para).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <button onClick={() => removerDaFila(item.id)} className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-bold border border-red-200">🗑️ {abaFila === 'pendente' ? 'Cancelar' : 'Excluir'}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {abaAtiva === 'campanhas' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                 <span className="font-bold text-slate-700">Selecione (Total: {perfis.length})</span>
                 <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">{selecionados.length} marcados</span>
               </div>
               <div className="p-4 border-b border-slate-200 flex flex-wrap gap-2 bg-white">
                 <button onClick={() => selecionarMassa(50)} type="button" className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md">Selecionar 50</button>
                 <button onClick={selecionarTodos} type="button" className="px-3 py-1.5 text-xs font-bold bg-slate-800 text-white hover:bg-slate-700 rounded-md">Selecionar Todos</button>
                 <button onClick={() => setSelecionados([])} type="button" className="px-3 py-1.5 text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 rounded-md ml-auto">Limpar</button>
               </div>
               <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                 {perfis.map((p) => (
                   <label key={p.id} className={`p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 ${selecionados.includes(p.id) ? 'bg-blue-50/50' : ''}`}>
                     <input type="checkbox" checked={selecionados.includes(p.id)} onChange={() => toggleSelecao(p.id)} className="size-5 text-blue-600 rounded" />
                     <div className="flex-1">
                       <p className="font-bold text-slate-900 flex items-center gap-2">
                         {p.nome} 
                         <span className="font-normal text-sm text-slate-500">({p.email})</span>
                         {p.telefone && (
                           <a href={formatarLinkWhatsApp(p.telefone)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors">
                             💬 Whats
                           </a>
                         )}
                       </p>
                     </div>
                   </label>
                 ))}
               </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit sticky top-6">
               <h3 className="font-bold text-xl text-slate-900 mb-6">Configurar Lote</h3>
               <form onSubmit={dispararCampanhaMassa} className="space-y-4">
                 <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg mb-4">
                    <label className="block text-xs uppercase tracking-wide font-bold text-slate-700 mb-3">Motor de Envio</label>
                    <div className="flex flex-col gap-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="radio" name="provedor" value="gmail" checked={provedor === 'gmail'} onChange={(e) => setProvedor(e.target.value)} className="size-4 text-indigo-600" />
                        <span className="text-sm font-bold text-slate-800">🟢 Usar Gmail (Padrão)</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="radio" name="provedor" value="externo" checked={provedor === 'externo'} onChange={(e) => setProvedor(e.target.value)} className="size-4 text-indigo-600" />
                        <span className="text-sm font-bold text-slate-800">🟣 Usar SMTP Externo (Lotes)</span>
                      </label>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-3 mb-4">
                   <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                     <label className="block text-xs font-bold text-slate-700 mb-1">Max. Seleção</label>
                     <input type="number" min="1" required value={qtdEnvioDesejada} onChange={e => setQtdEnvioDesejada(Number(e.target.value))} className="w-full p-2 border border-slate-200 rounded-md outline-none text-sm" />
                   </div>
                   <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                     <label className="block text-xs font-bold text-indigo-900 mb-1">Por Lote</label>
                     <input type="number" min="1" required value={tamanhoLote} onChange={e => setTamanhoLote(Number(e.target.value))} className="w-full p-2 border border-indigo-200 rounded-md outline-none text-sm bg-white" />
                   </div>
                 </div>
                 <div><label className="block text-sm font-bold mb-1">Assunto</label><input type="text" required value={assuntoCampanha} onChange={e => setAssuntoCampanha(e.target.value)} className="w-full p-3 border rounded-lg outline-none" /></div>
                 <div><label className="block text-sm font-bold mb-1">Mensagem</label><textarea required value={textoCampanha} onChange={e => setTextoCampanha(e.target.value)} rows={4} className="w-full p-3 border rounded-lg outline-none" /></div>
                 <div className="grid grid-cols-2 gap-3">
                   <div><label className="block text-xs font-bold mb-1">Texto do Botão</label><input type="text" required value={textoBotao} onChange={e => setTextoBotao(e.target.value)} className="w-full p-2 border rounded-lg outline-none text-sm" /></div>
                   <div><label className="block text-xs font-bold mb-1">Link de Destino</label><input type="url" required value={urlBotao} onChange={e => setUrlBotao(e.target.value)} className="w-full p-2 border rounded-lg outline-none text-sm" /></div>
                 </div>
                 <button type="submit" disabled={enviandoMassa || selecionados.length === 0} className="w-full mt-4 bg-blue-600 text-white font-bold p-4 rounded-lg hover:bg-blue-700 shadow-md">
                   {enviandoMassa ? 'Aguarde...' : `Enviar Lotes`}
                 </button>
               </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}