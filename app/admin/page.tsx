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
  ultimo_whats_enviado?: string 
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
  const [isClient, setIsClient] = useState(false) 

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

  const [filtroWhats, setFiltroWhats] = useState<'todos' | 'nao_enviados' | 'enviados'>('todos')
  const [filtroEmailMassa, setFiltroEmailMassa] = useState<'todos' | 'nao_enviados' | 'enviados'>('todos')
  
  const [textoWhatsCampanha, setTextoWhatsCampanha] = useState('')

  const [modalLimpezaAberto, setModalLimpezaAberto] = useState(false)
  const [diasInatividade, setDiasInatividade] = useState(90)
  const [perfilEditando, setPerfilEditando] = useState<Perfil | null>(null)
  const [uploading, setUploading] = useState(false) 

  const [modalImportacaoAberto, setModalImportacaoAberto] = useState(false)
  const [textoImportacao, setTextoImportacao] = useState('')
  const [nomeListaImportacao, setNomeListaImportacao] = useState('')
  const [importando, setImportando] = useState(false)
  
  const [filtroListaAtual, setFiltroListaAtual] = useState('todos')

  const [configEmail, setConfigEmail] = useState({
    gmail_email: '', gmail_senha: '', smtp_host: '', smtp_port: '', smtp_user: '', smtp_pass: ''
  })
  const [salvandoConfig, setSalvandoConfig] = useState(false)

  useEffect(() => {
    setIsClient(true)
    try {
      const abaSalva = localStorage.getItem('vitrine_aba_ativa')
      if (abaSalva) setAbaAtiva(abaSalva)
      const filaSalva = localStorage.getItem('vitrine_aba_fila')
      if (filaSalva) setAbaFila(filaSalva)
    } catch (e) { console.warn("localStorage indisponível") }
    verificarSeguranca()
  }, [])

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('vitrine_aba_ativa', abaAtiva)
      localStorage.setItem('vitrine_aba_fila', abaFila)
    }
  }, [abaAtiva, abaFila, isClient])

  const verificarSeguranca = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email !== EMAIL_ADMIN) { router.push('/login'); return }
    setAutorizado(true)
    carregarPerfis()
    carregarFila()
    carregarConfiguracoes()
    const intervalo = setInterval(() => { carregarFila() }, 15000)
    return () => clearInterval(intervalo)
  }

  const carregarConfiguracoes = async () => {
    const { data } = await supabase.from('configuracoes').select('*').eq('id', 1).single()
    if (data) setConfigEmail(data)
  }

  const salvarConfiguracoesEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvandoConfig(true)
    const { error } = await supabase.from('configuracoes').upsert({ id: 1, ...configEmail })
    if (error) mostrarNotificacao('Erro ao salvar as configurações.', 'erro')
    else mostrarNotificacao('Configurações de disparo salvas!', 'sucesso')
    setSalvandoConfig(false)
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

  const processarImportacao = async () => {
    if (!textoImportacao.trim()) return mostrarNotificacao('Cole a lista de e-mails ou números.', 'erro')
    setImportando(true)
    const linhas = textoImportacao.split('\n').map(l => l.trim()).filter(l => l !== '')
    const novosLeads = []
    const nomeDaListaFinal = nomeListaImportacao.trim() !== '' ? `Lista: ${nomeListaImportacao.trim()}` : 'Lista Importada Padrão'

    for (const linha of linhas) {
      const isEmail = linha.includes('@')
      novosLeads.push({
        id: crypto.randomUUID(), nome: 'Lead Importado',
        email: isEmail ? linha : `sem-email-${crypto.randomUUID().substring(0,6)}@importado.com`,
        telefone: isEmail ? null : linha, titulo_ebook: nomeDaListaFinal, link_site: 'https://vitrine-ebooks.vercel.app',
        plano_selecionado: 'Importado', status: 'inativo' 
      })
    }

    if (novosLeads.length === 0) { setImportando(false); return mostrarNotificacao('Nenhum dado válido encontrado.', 'erro') }
    const { error } = await supabase.from('profiles').insert(novosLeads)
    if (error) { mostrarNotificacao('Erro ao importar contatos.', 'erro'); console.error(error) } 
    else {
      mostrarNotificacao(`${novosLeads.length} contatos importados para a ${nomeDaListaFinal}!`, 'sucesso')
      setModalImportacaoAberto(false); setTextoImportacao(''); setNomeListaImportacao(''); carregarPerfis()
    }
    setImportando(false)
  }

  const excluirLeadsImportados = async () => {
      let leadsParaExcluir = perfis.filter(p => p.plano_selecionado === 'Importado')
      if (filtroListaAtual !== 'todos' && filtroListaAtual !== 'vitrine') {
         leadsParaExcluir = leadsParaExcluir.filter(p => p.titulo_ebook === filtroListaAtual)
      }
      if (leadsParaExcluir.length === 0) return mostrarNotificacao('Nenhum lead importado encontrado.', 'sucesso')

      const msg = filtroListaAtual === 'todos' 
        ? `🚨 Tem certeza que deseja apagar TODOS os ${leadsParaExcluir.length} leads importados?`
        : `🚨 Tem certeza que deseja apagar APENAS a lista "${filtroListaAtual}"?`

      if (confirm(msg)) {
          const idsParaExcluir = leadsParaExcluir.map(p => p.id)
          const { error } = await supabase.from('profiles').delete().in('id', idsParaExcluir)
          if (error) mostrarNotificacao('Erro ao apagar leads importados.', 'erro')
          else {
              mostrarNotificacao(`${idsParaExcluir.length} leads apagados com sucesso!`, 'sucesso')
              setSelecionados([]) 
              if (filtroListaAtual !== 'todos') setFiltroListaAtual('todos')
              carregarPerfis()
          }
      }
  }

  const formatarLinkWhatsApp = (numero?: string) => {
    if (!numero) return '#'
    const apenasNumeros = numero.replace(/\D/g, '')
    return apenasNumeros.startsWith('55') ? `https://wa.me/${apenasNumeros}` : `https://wa.me/55${apenasNumeros}`
  }

  const formatarLinkWhatsAppCampanha = (numero?: string, mensagem?: string) => {
    const base = formatarLinkWhatsApp(numero)
    if (base === '#') return base;
    if (mensagem && mensagem.trim() !== '') return `${base}?text=${encodeURIComponent(mensagem)}`
    return base
  }

  const marcarWhatsAppEnviado = async (id: string) => {
    const agora = new Date().toISOString()
    const { error } = await supabase.from('profiles').update({ ultimo_whats_enviado: agora }).eq('id', id)
    if (!error) carregarPerfis()
  }

  const resetarEnviosWhatsApp = async () => {
    if (confirm('Zerar o histórico do WhatsApp para esta lista?')) {
      const idsParaLimpar = clientesWhatsAppFiltrados.filter(p => p.ultimo_whats_enviado != null).map(p => p.id)
      if (idsParaLimpar.length === 0) return mostrarNotificacao('Nenhum histórico para limpar.', 'sucesso')
      const { error } = await supabase.from('profiles').update({ ultimo_whats_enviado: null }).in('id', idsParaLimpar)
      if (error) mostrarNotificacao('Erro ao zerar lista.', 'erro')
      else { mostrarNotificacao('Histórico zerado!', 'sucesso'); carregarPerfis() }
    }
  }

  // ==========================================
  // NOVO: RESETAR HISTÓRICO DE E-MAILS
  // ==========================================
  const resetarEnviosEmail = async () => {
    if (confirm('Zerar o histórico de E-MAIL para esta lista? Eles voltarão para "Falta Enviar".')) {
      const idsParaLimpar = clientesComEmailParaMassa.filter(p => p.ultimo_email_enviado != null).map(p => p.id)
      if (idsParaLimpar.length === 0) return mostrarNotificacao('Nenhum histórico para limpar.', 'sucesso')
      
      const { error } = await supabase.from('profiles').update({ ultimo_email_enviado: null }).in('id', idsParaLimpar)
      if (error) mostrarNotificacao('Erro ao zerar lista.', 'erro')
      else { 
        mostrarNotificacao('Histórico de e-mail zerado!', 'sucesso'); 
        setSelecionados([]); 
        carregarPerfis(); 
      }
    }
  }

  const baixarCSV = () => {
    const cabecalho = ['Nome', 'Email', 'Telefone', 'Status', 'Plano', 'Vencimento', 'Cliques', 'Posição VIP', 'Data de Cadastro', 'Lista']
    const linhas = perfis.map(p => [
        `"${p.nome || ''}"`, `"${p.email || ''}"`, `"${p.telefone || ''}"`, `"${p.status || ''}"`, `"${p.plano_selecionado || ''}"`,
        `"${p.data_expiracao ? p.data_expiracao.split('T')[0] : ''}"`, `"${p.cliques?.length || 0}"`,
        `"${p.posicao_fixa || 'Nenhuma'}"`, `"${p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : ''}"`, `"${p.plano_selecionado === 'Importado' ? p.titulo_ebook : 'Orgânico'}"`
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

  const executarLimpezaFrios = async () => {
    const dataLimite = new Date(); dataLimite.setDate(dataLimite.getDate() - diasInatividade)
    const contatosFrios = perfis.filter(p => p.status === 'inativo' && (!p.cliques || p.cliques.length === 0) && (p.created_at ? new Date(p.created_at) : new Date()) < dataLimite)
    
    const idsParaExcluir = contatosFrios.map(p => p.id)
    if (idsParaExcluir.length === 0) { setModalLimpezaAberto(false); return mostrarNotificacao('Nenhum contato inativo antigo encontrado.', 'sucesso') }
    const { error } = await supabase.from('profiles').delete().in('id', idsParaExcluir)
    if (error) mostrarNotificacao('Erro ao limpar contatos.', 'erro')
    else { mostrarNotificacao(`${idsParaExcluir.length} contatos frios excluídos!`, 'sucesso'); setModalLimpezaAberto(false); carregarPerfis() }
  }

  const handleUploadCapaAdmin = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true); const file = e.target.files?.[0]
      if (!file || !perfilEditando) { setUploading(false); return }
      const extensao = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${extensao}`
      const { error: uploadError } = await supabase.storage.from('imagens').upload(fileName, file)
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('imagens').getPublicUrl(fileName)
      setPerfilEditando(prev => prev ? { ...prev, imagem_url: data.publicUrl } : null)
    } catch (error: any) { mostrarNotificacao('Erro ao enviar imagem.', 'erro') } finally { setUploading(false) }
  }

  const salvarEdicaoAnuncio = async (e: React.FormEvent) => {
    e.preventDefault(); if (!perfilEditando) return;
    if (!perfilEditando.imagem_url) { mostrarNotificacao('A imagem da capa é obrigatória!', 'erro'); return; }
    const { error } = await supabase.from('profiles').update({
      nome: perfilEditando.nome, telefone: perfilEditando.telefone, titulo_ebook: perfilEditando.titulo_ebook,
      descricao: perfilEditando.descricao, link_site: perfilEditando.link_site, imagem_url: perfilEditando.imagem_url
    }).eq('id', perfilEditando.id);
    if (error) mostrarNotificacao('Erro ao salvar edições.', 'erro');
    else { mostrarNotificacao('Anúncio atualizado!', 'sucesso'); setPerfilEditando(null); carregarPerfis(); }
  }

  const mudarStatus = async (id: string, novoStatus: string) => { await supabase.from('profiles').update({ status: novoStatus }).eq('id', id); carregarPerfis() }
  const mudarPosicaoFixa = async (id: string, posicao: string) => { await supabase.from('profiles').update({ posicao_fixa: posicao === 'nenhuma' ? null : Number(posicao) }).eq('id', id); carregarPerfis() }
  const mudarPlano = async (id: string, novoPlano: string) => { await supabase.from('profiles').update({ plano_selecionado: novoPlano }).eq('id', id); carregarPerfis() }
  const mudarDataExpiracao = async (id: string, novaData: string) => { await supabase.from('profiles').update({ data_expiracao: novaData || null }).eq('id', id); carregarPerfis() }
  const excluirPerfil = async (id: string) => { if (confirm('EXCLUIR este cliente?')) { await supabase.from('profiles').delete().eq('id', id); carregarPerfis() } }

  const removerDaFila = async (id: string) => { await supabase.from('fila_envios').delete().eq('id', id); carregarFila() }
  const limparHistoricoEnviados = async () => { if (confirm('Apagar TODO o histórico?')) { await supabase.from('fila_envios').delete().eq('status', 'enviado'); carregarFila() } }
  const esvaziarFila = async () => { if (confirm('Cancelar PENDENTES?')) { await supabase.from('fila_envios').delete().eq('status', 'pendente'); carregarFila(); } }

  // ==========================================
  // DISPARO DE E-MAIL EM MASSA (AGORA MARCA COMO ENVIADO)
  // ==========================================
  const dispararCampanhaMassa = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selecionados.length === 0) return mostrarNotificacao('Selecione um cliente.', 'erro')
    setEnviandoMassa(true)
    
    const listaFinalIds = selecionados.slice(0, qtdEnvioDesejada)
    const clientesParaEnviar = clientesComEmailParaMassa.filter(p => listaFinalIds.includes(p.id))
    
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
      
      // 1. Salva na fila de disparos
      await supabase.from('fila_envios').insert(registrosFila)
      
      // 2. ATUALIZA TODOS OS PERFIS COM ESSE E-MAIL PARA "JÁ ENVIADO"
      const emailsEnviados = clientesParaEnviar.map(p => p.email)
      await supabase.from('profiles').update({ ultimo_email_enviado: new Date().toISOString() }).in('email', emailsEnviados)
      
      mostrarNotificacao(`Sucesso! ${listaFinalIds.length} agendados.`, 'sucesso')
      setSelecionados([]); setAssuntoCampanha(''); setTextoCampanha(''); setTextoBotao(''); setUrlBotao('')
      carregarFila() 
      carregarPerfis() // Recarrega para atualizar a interface
    } catch (error) { mostrarNotificacao('Erro.', 'erro') }
    setEnviandoMassa(false)
  }

  // ==========================================
  // FILTROS E DEDUPLICAÇÃO
  // ==========================================
  const listasImportadasDisponiveis = Array.from(new Set(perfis.filter(p => p.plano_selecionado === 'Importado').map(p => p.titulo_ebook)))

  const aplicarFiltroLista = (p: Perfil) => {
    if (filtroListaAtual === 'todos') return true;
    if (filtroListaAtual === 'vitrine') return p.plano_selecionado !== 'Importado';
    return p.titulo_ebook === filtroListaAtual && p.plano_selecionado === 'Importado';
  }

  // 1. Apenas contatos com E-mail VÁLIDO e respeitando o filtro
  const emailsValidosFiltrados = perfis.filter(p => p.email && !p.email.includes('@importado.com')).filter(aplicarFiltroLista)

  // 2. DEDUPLICAÇÃO ABSOLUTA: Agrupa pelo e-mail (Tira os repitidos da lista)
  const clientesUnicosEmail = Array.from(new Map(emailsValidosFiltrados.map(p => [p.email.toLowerCase(), p])).values())

  // 3. APLICA O FILTRO DE "FALTA ENVIAR" / "JÁ ENVIADO"
  const clientesComEmailParaMassa = clientesUnicosEmail.filter(p => {
    if (filtroEmailMassa === 'todos') return true
    if (filtroEmailMassa === 'enviados') return p.ultimo_email_enviado != null
    if (filtroEmailMassa === 'nao_enviados') return p.ultimo_email_enviado == null
    return true
  })

  // Para o WhatsApp (Sem deduplicação de e-mail, focado no telefone)
  const clientesComWhatsapp = perfis.filter(p => p.telefone && p.telefone.trim() !== '').filter(aplicarFiltroLista)
  const clientesWhatsAppFiltrados = clientesComWhatsapp.filter(p => {
    if (filtroWhats === 'todos') return true
    if (filtroWhats === 'enviados') return p.ultimo_whats_enviado != null
    if (filtroWhats === 'nao_enviados') return p.ultimo_whats_enviado == null
    return true
  })

  const toggleSelecao = (id: string) => setSelecionados(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id])
  const selecionarMassa = (qtd: number) => setSelecionados(clientesComEmailParaMassa.slice(0, qtd).map(p => p.id))
  const selecionarTodos = () => setSelecionados(clientesComEmailParaMassa.map(p => p.id))

  const perfisFiltrados = perfis.filter(p => p.status === abaAtiva)
  const filaFiltrada = fila.filter(item => item.status === abaFila)

  if (!autorizado) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-500">Verificando Credenciais...</div>
  if (!isClient) return null; 

  return (
    <div className="min-h-screen bg-slate-50 p-8 relative">
      
      {/* ... [OS MODAIS DE IMPORTAÇÃO, EDIÇÃO E LIMPEZA CONTINUAM OS MESMOS] ... */}
      
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
             <button onClick={() => setModalImportacaoAberto(true)} className="px-4 py-2 bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 rounded-lg text-sm hover:bg-emerald-100 shadow-sm">📥 Importar Leads</button>
             <button onClick={() => setModalLimpezaAberto(true)} className="px-4 py-2 bg-rose-50 text-rose-600 font-bold border border-rose-200 rounded-lg text-sm hover:bg-rose-100 shadow-sm">🧹 Limpar Frios</button>
             <button onClick={excluirLeadsImportados} className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg text-sm hover:bg-red-700 shadow-sm ml-2">🗑️ Apagar Importados</button>
             <button onClick={() => setAbaAtiva('config')} className={`px-4 py-2 ml-2 rounded-lg font-bold text-sm border shadow-sm ${abaAtiva === 'config' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}>⚙️ Configurações</button>
          </div>
          
          <button onClick={() => setAbaAtiva('fila')} className={`px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 ml-auto ${abaAtiva === 'fila' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-700 border border-indigo-200'}`}>
            ⏳ Fila ({fila.filter(f => f.status === 'pendente').length})
          </button>
          <button onClick={() => setAbaAtiva('campanhas')} className={`px-5 py-2 rounded-lg font-bold text-sm ${abaAtiva === 'campanhas' ? 'bg-blue-600 text-white' : 'bg-white text-slate-800 border'}`}>📧 E-mail Massa</button>
          <button onClick={() => setAbaAtiva('whatsapp')} className={`px-5 py-2 rounded-lg font-bold text-sm ${abaAtiva === 'whatsapp' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-700 border border-emerald-200'}`}>💬 WhatsApp Direto</button>
        </div>

        {/* ... [AS ABAS DE PENDENTE, ATIVO, INATIVO E FILA CONTINUAM AS MESMAS] ... */}

        {/* 📧 ABA DE E-MAIL EM MASSA ATUALIZADA */}
        {abaAtiva === 'campanhas' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
               
               <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                 
                 <div className="flex items-center gap-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Filtrar Lista:</label>
                   <select 
                     value={filtroListaAtual} 
                     onChange={(e) => { setFiltroListaAtual(e.target.value); setSelecionados([]) }} 
                     className="text-sm font-bold bg-white text-slate-700 border border-slate-300 rounded p-1.5 outline-none"
                   >
                     <option value="todos">Todos os Contatos Válidos</option>
                     <option value="vitrine">Apenas Clientes da Vitrine</option>
                     {listasImportadasDisponiveis.map(lista => (
                       <option key={lista} value={lista}>{lista}</option>
                     ))}
                   </select>
                 </div>

                 {/* NOVOS BOTÕES DE FILTRO DE E-MAIL (IGUAL AO WHATSAPP) */}
                 <div className="flex flex-wrap gap-2 items-center">
                   <button onClick={() => setFiltroEmailMassa('todos')} className={`px-3 py-1 rounded text-xs font-bold ${filtroEmailMassa === 'todos' ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 border border-blue-200'}`}>Todos ({clientesUnicosEmail.length})</button>
                   <button onClick={() => setFiltroEmailMassa('nao_enviados')} className={`px-3 py-1 rounded text-xs font-bold ${filtroEmailMassa === 'nao_enviados' ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 border border-blue-200'}`}>Falta Enviar</button>
                   <button onClick={() => setFiltroEmailMassa('enviados')} className={`px-3 py-1 rounded text-xs font-bold ${filtroEmailMassa === 'enviados' ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 border border-blue-200'}`}>Já Enviados</button>
                   <span className="text-slate-300 mx-1">|</span>
                   <button onClick={resetarEnviosEmail} className="px-3 py-1 rounded text-xs font-bold bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 shadow-sm transition-colors">
                     🔄 Resetar
                   </button>
                 </div>

               </div>

               <div className="p-4 border-b border-slate-200 flex flex-wrap gap-2 bg-white items-center justify-between">
                 <div className="flex gap-2">
                   <button onClick={() => selecionarMassa(50)} type="button" className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md">Selecionar 50</button>
                   <button onClick={selecionarTodos} type="button" className="px-3 py-1.5 text-xs font-bold bg-slate-800 text-white hover:bg-slate-700 rounded-md">Selecionar Todos</button>
                   <button onClick={() => setSelecionados([])} type="button" className="px-3 py-1.5 text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 rounded-md">Limpar</button>
                 </div>
                 <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold shadow-sm">{selecionados.length} / {clientesComEmailParaMassa.length} marcados</span>
               </div>

               <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                 {clientesComEmailParaMassa.map((p) => (
                   <label key={p.id} className={`p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 ${selecionados.includes(p.id) ? 'bg-blue-50/50' : ''}`}>
                     <input type="checkbox" checked={selecionados.includes(p.id)} onChange={() => toggleSelecao(p.id)} className="size-5 text-blue-600 rounded" />
                     <div className="flex-1">
                       <p className="font-bold text-slate-900 flex items-center gap-2">
                         {p.nome} 
                         <span className="font-normal text-sm text-slate-500">({p.email})</span>
                       </p>
                       <p className="text-xs text-slate-400 mt-1">
                         {p.ultimo_email_enviado 
                           ? `✅ Já enviado em: ${new Date(p.ultimo_email_enviado).toLocaleDateString('pt-BR')}` 
                           : '⏳ Aguardando Envio'}
                       </p>
                     </div>
                   </label>
                 ))}
                 
                 {clientesComEmailParaMassa.length === 0 && (
                   <div className="p-8 text-center text-slate-500 font-bold">Nenhum e-mail válido encontrado para este filtro.</div>
                 )}
               </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit sticky top-6">
               <h3 className="font-bold text-xl text-slate-900 mb-6">Configurar Lote de E-mails</h3>
               <form onSubmit={dispararCampanhaMassa} className="space-y-4">
                 <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg mb-4">
                    <label className="block text-xs uppercase tracking-wide font-bold text-slate-700 mb-3">Motor de Envio</label>
                    <div className="flex flex-col gap-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="radio" name="provedor" value="gmail" checked={provedor === 'gmail'} onChange={(e) => setProvedor(e.target.value)} className="size-4 text-blue-600" />
                        <span className="text-sm font-bold text-slate-800">🟢 Usar Gmail (Padrão)</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="radio" name="provedor" value="externo" checked={provedor === 'externo'} onChange={(e) => setProvedor(e.target.value)} className="size-4 text-blue-600" />
                        <span className="text-sm font-bold text-slate-800">🟣 Usar SMTP Externo (Lotes)</span>
                      </label>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-3 mb-4">
                   <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                     <label className="block text-xs font-bold text-slate-700 mb-1">Max. Seleção</label>
                     <input type="number" min="1" required value={qtdEnvioDesejada} onChange={e => setQtdEnvioDesejada(Number(e.target.value))} className="w-full p-2 border border-slate-200 rounded-md outline-none text-sm" />
                   </div>
                   <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                     <label className="block text-xs font-bold text-blue-900 mb-1">Por Lote</label>
                     <input type="number" min="1" required value={tamanhoLote} onChange={e => setTamanhoLote(Number(e.target.value))} className="w-full p-2 border border-blue-200 rounded-md outline-none text-sm bg-white" />
                   </div>
                 </div>
                 <div><label className="block text-sm font-bold mb-1">Assunto *</label><input type="text" required value={assuntoCampanha} onChange={e => setAssuntoCampanha(e.target.value)} className="w-full p-3 border rounded-lg outline-none" /></div>
                 <div><label className="block text-sm font-bold mb-1">Mensagem *</label><textarea required value={textoCampanha} onChange={e => setTextoCampanha(e.target.value)} rows={4} className="w-full p-3 border rounded-lg outline-none" /></div>
                 <div className="grid grid-cols-2 gap-3">
                   <div><label className="block text-xs font-bold mb-1">Texto do Botão *</label><input type="text" required value={textoBotao} onChange={e => setTextoBotao(e.target.value)} className="w-full p-2 border rounded-lg outline-none text-sm" /></div>
                   <div><label className="block text-xs font-bold mb-1">Link de Destino *</label><input type="url" required value={urlBotao} onChange={e => setUrlBotao(e.target.value)} className="w-full p-2 border rounded-lg outline-none text-sm" /></div>
                 </div>
                 <button type="submit" disabled={enviandoMassa || selecionados.length === 0} className="w-full mt-4 bg-blue-600 text-white font-bold p-4 rounded-lg hover:bg-blue-700 shadow-md">
                   {enviandoMassa ? 'Aguarde...' : `Agendar Envios de E-mail`}
                 </button>
               </form>
            </div>
          </div>
        )}

        {/* ... [A ABA DE WHATSAPP DIRETO E CONFIGURAÇÕES CONTINUAM AS MESMAS] ... */}

      </div>
    </div>
  )
}