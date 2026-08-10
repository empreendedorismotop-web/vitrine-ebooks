'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'

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
  favoritos_count?: number 
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

  const [leadsExit, setLeadsExit] = useState<any[]>([])
  const [filtroSegmentoLead, setFiltroSegmentoLead] = useState('todos')

  const [popupLeitor, setPopupLeitor] = useState({
    titulo: '', subtitulo: '', botao_texto: '', imagem_url: '', ebook_link: '', email_assunto: '', email_corpo: '', email_botao_texto: ''
  })
  const [popupAutor, setPopupAutor] = useState({
    titulo: '', subtitulo: '', botao_texto: '', imagem_url: '', ebook_link: '', email_assunto: '', email_corpo: '', email_botao_texto: ''
  })
  const [salvandoPopup, setSalvandoPopup] = useState(false)

  const [biblioteca, setBiblioteca] = useState<any[]>([])
  const [novoEbookGratis, setNovoEbookGratis] = useState({ titulo: '', imagem_url: '', link_download: '' })
  const [uploadingGratis, setUploadingGratis] = useState(false)

  const EMAIL_ADMIN = 'josevg10@gmail.com' 

  const [perfis, setPerfis] = useState<Perfil[]>([])
  const [fila, setFila] = useState<FilaItem[]>([]) 
  const [inscritosPush, setInscritosPush] = useState<any[]>([]) 
  
  const [abaAtiva, setAbaAtiva] = useState('pendente')
  const [abaFila, setAbaFila] = useState('pendente') 
  
  const [notificacao, setNotificacao] = useState({ mostrar: false, msg: '', tipo: '' })
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [clientesExpandidos, setClientesExpandidos] = useState<string[]>([]) 
  
  const [assuntoCampanha, setAssuntoCampanha] = useState('')
  const [textoCampanha, setTextoCampanha] = useState('')
  const [textoBotao, setTextoBotao] = useState('')
  const [urlBotao, setUrlBotao] = useState('')
  const [provedor, setProvedor] = useState('gmail') 
  const [qtdEnvioDesejada, setQtdEnvioDesejada] = useState(50)
  const [tamanhoLote, setTamanhoLote] = useState(2) 
  const [intervaloLote, setIntervaloLote] = useState(1) 
  const [enviandoMassa, setEnviandoMassa] = useState(false)

  const [pushTitulo, setPushTitulo] = useState('Novidade na Vitrine!')
  const [pushMensagem, setPushMensagem] = useState('')
  const [pushUrl, setPushUrl] = useState('https://vitrine-ebooks.vercel.app')
  const [enviandoPush, setEnviandoPush] = useState(false)
  const [progressoPush, setProgressoPush] = useState({ enviados: 0, total: 0 })

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

  // ⚠️ ADICIONADO: provedor_ativo no state ⚠️
  const [configEmail, setConfigEmail] = useState({
    gmail_email: '', gmail_senha: '', smtp_host: '', smtp_port: '', smtp_user: '', smtp_pass: '', smtp_remetente: '', provedor_ativo: 'gmail'
  })
  const [salvandoConfig, setSalvandoConfig] = useState(false)

  useEffect(() => {
    setIsClient(true)
    try {
      const abaSalva = localStorage.getItem('vitrine_aba_ativa')
      if (abaSalva) setAbaAtiva(abaSalva)
      
      const filaSalva = localStorage.getItem('vitrine_aba_fila')
      if (filaSalva) setAbaFila(filaSalva)
      
      const provedorSalvo = localStorage.getItem('vitrine_provedor_email')
      if (provedorSalvo) setProvedor(provedorSalvo)

    } catch (e) { console.warn("localStorage indisponível") }
    verificarSeguranca()
  }, [])

  const carregarLeadsExit = async () => {
    const { data } = await supabase.from('leads').select('*').order('updated_at', { ascending: false })
    if (data) setLeadsExit(data)
  }

  const carregarPopups = async () => {
    try {
      const { data, error } = await supabase.from('popup_configs').select('*')
      if (error) throw error
      if (data) {
        const leitor = data.find((d: any) => d.segmento === 'leitor')
        const autor = data.find((d: any) => d.segmento === 'autor')
        if (leitor) setPopupLeitor({ ...popupLeitor, ...leitor })
        if (autor) setPopupAutor({ ...popupAutor, ...autor })
      }
    } catch (e) {
      console.warn('Tabela popup_configs ainda não existe ou ocorreu um erro.')
    }
  }

  const carregarBiblioteca = async () => {
    try {
      const { data } = await supabase.from('ebooks_gratis').select('*').order('created_at', { ascending: false })
      if (data) setBiblioteca(data)
    } catch (e) {
      console.warn('Tabela ebooks_gratis ainda não existe.')
    }
  }

  const salvarPopup = async (segmento: string, dados: any) => {
    setSalvandoPopup(true)
    try {
      const { error } = await supabase.from('popup_configs').upsert({ segmento, ...dados })
      if (error) throw error
      mostrarNotificacao(`Popup de ${segmento} salvo com sucesso!`, 'sucesso')
    } catch (error) {
      mostrarNotificacao(`Erro ao salvar popup. Crie a tabela primeiro!`, 'erro')
    }
    setSalvandoPopup(false)
  }

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('vitrine_aba_ativa', abaAtiva)
      localStorage.setItem('vitrine_aba_fila', abaFila)
      localStorage.setItem('vitrine_provedor_email', provedor)
    }
  }, [abaAtiva, abaFila, provedor, isClient])

  const verificarSeguranca = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email !== EMAIL_ADMIN) { router.push('/login'); return }
    setAutorizado(true)
    carregarPerfis()
    carregarFila()
    carregarConfiguracoes()
    carregarInscritosPush() 
    carregarLeadsExit()
    carregarPopups() 
    carregarBiblioteca()
    const intervalo = setInterval(() => { carregarFila() }, 15000)
    return () => clearInterval(intervalo)
  }

  const carregarInscritosPush = async () => {
    const { data } = await supabase.from('push_subscriptions').select('*')
    if (data) setInscritosPush(data)
  }

  const dispararPushEmMassa = async (e: React.FormEvent) => {
    e.preventDefault()
    if (inscritosPush.length === 0) return mostrarNotificacao('Ninguém inscrito ainda.', 'erro')
    
    setEnviandoPush(true)
    setProgressoPush({ enviados: 0, total: inscritosPush.length })
    
    const maxPorLote = 50 
    let totalEnviadosAgora = 0

    for (let i = 0; i < inscritosPush.length; i += maxPorLote) {
      const lote = inscritosPush.slice(i, i + maxPorLote)
      
      try {
        await fetch('/api/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscriptions: lote,
            payload: { title: pushTitulo, body: pushMensagem, url: pushUrl }
          })
        })
        
        totalEnviadosAgora += lote.length
        setProgressoPush({ enviados: totalEnviadosAgora, total: inscritosPush.length })
        
        if (i + maxPorLote < inscritosPush.length) {
          await new Promise(resolve => setTimeout(resolve, 1500))
        }
      } catch (error) { console.error('Erro no lote do Push:', error) }
    }
    
    mostrarNotificacao(`Sucesso! Notificações enviadas para ${totalEnviadosAgora} aparelhos.`, 'sucesso')
    setEnviandoPush(false)
    setPushMensagem('')
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
        plano_selecionado: 'Importado', status: 'inativo', favoritos_count: 0
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
    if (id.startsWith('lead_')) {
      const emailReal = id.replace('lead_', '')
      await supabase.from('leads').update({ ultimo_whats_enviado: agora }).eq('email', emailReal)
      carregarLeadsExit()
    } else {
      await supabase.from('profiles').update({ ultimo_whats_enviado: agora }).eq('id', id)
      carregarPerfis()
    }
  }

  const resetarEnviosWhatsApp = async () => {
    if (confirm('Zerar o histórico do WhatsApp para esta lista?')) {
      const clientesParaLimpar = clientesWhatsAppFiltrados.filter(p => p.ultimo_whats_enviado != null)
      if (clientesParaLimpar.length === 0) return mostrarNotificacao('Nenhum histórico para limpar.', 'sucesso')
      
      const idsProfiles = clientesParaLimpar.filter(p => !p.id.startsWith('lead_')).map(p => p.id)
      const emailsLeads = clientesParaLimpar.filter(p => p.id.startsWith('lead_')).map(p => p.email)

      if (idsProfiles.length > 0) await supabase.from('profiles').update({ ultimo_whats_enviado: null }).in('id', idsProfiles)
      if (emailsLeads.length > 0) await supabase.from('leads').update({ ultimo_whats_enviado: null }).in('email', emailsLeads)
      
      mostrarNotificacao('Histórico zerado!', 'sucesso')
      carregarPerfis(); carregarLeadsExit()
    }
  }

  const resetarEnviosEmail = async () => {
    if (confirm('Zerar o histórico de E-MAIL para esta lista? Eles voltarão para "Falta Enviar".')) {
      const clientesParaLimpar = clientesComEmailParaMassa.filter(p => p.ultimo_email_enviado != null)
      if (clientesParaLimpar.length === 0) return mostrarNotificacao('Nenhum histórico para limpar.', 'sucesso')
      
      const idsProfiles = clientesParaLimpar.filter(p => !p.id.startsWith('lead_')).map(p => p.id)
      const emailsLeads = clientesParaLimpar.filter(p => p.id.startsWith('lead_')).map(p => p.email)

      if (idsProfiles.length > 0) await supabase.from('profiles').update({ ultimo_email_enviado: null }).in('id', idsProfiles)
      if (emailsLeads.length > 0) await supabase.from('leads').update({ ultimo_email_enviado: null }).in('email', emailsLeads)
      
      mostrarNotificacao('Histórico de e-mail zerado!', 'sucesso')
      setSelecionados([]); carregarPerfis(); carregarLeadsExit()
    }
  }

  const baixarCSV = () => {
    const cabecalho = ['Nome', 'Email', 'Telefone', 'Status', 'Plano', 'Vencimento', 'Cliques', 'Favoritos', 'Posição VIP', 'Data de Cadastro', 'Lista']
    const linhas = perfis.map(p => [
        `"${p.nome || ''}"`, `"${p.email || ''}"`, `"${p.telefone || ''}"`, `"${p.status || ''}"`, `"${p.plano_selecionado || ''}"`,
        `"${p.data_expiracao ? p.data_expiracao.split('T')[0] : ''}"`, `"${p.cliques?.length || 0}"`, `"${p.favoritos_count || 0}"`,
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
  const excluirPerfil = async (id: string) => { if (confirm('EXCLUIR este cliente e seu anúncio?')) { await supabase.from('profiles').delete().eq('id', id); carregarPerfis() } }

  const dispararLembretePendente = async (perfil: Perfil) => {
    if (confirm(`Enviar lembrete de ativação para ${perfil.nome}?`)) {
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
    const clientesParaEnviar = clientesComEmailParaMassa.filter(p => listaFinalIds.includes(p.id))
    
    const lotes = []
    for (let i = 0; i < clientesParaEnviar.length; i += tamanhoLote) lotes.push(clientesParaEnviar.slice(i, i + tamanhoLote))

    try {
      const registrosFila = []
      let tempoAgendado = new Date()
      for (let i = 0; i < lotes.length; i++) {
        for (const cliente of lotes[i]) {
          registrosFila.push({
            perfil_id: cliente.id.startsWith('lead_') ? null : cliente.id, 
            email: cliente.email, 
            nome: cliente.nome, 
            assunto: assuntoCampanha, 
            mensagem: textoCampanha, 
            texto_botao: textoBotao, 
            url_botao: urlBotao,                
            base_url: window.location.origin, 
            status: 'pendente', 
            clicou: false, 
            provedor: provedor, 
            agendado_para: tempoAgendado.toISOString() 
          })
        }
        tempoAgendado = new Date(tempoAgendado.getTime() + (intervaloLote * 60000))
      }
      
      await supabase.from('fila_envios').insert(registrosFila)
      
      const emailsProfiles = clientesParaEnviar.filter(p => !p.id.startsWith('lead_')).map(p => p.email)
      const emailsLeads = clientesParaEnviar.filter(p => p.id.startsWith('lead_')).map(p => p.email)

      if (emailsProfiles.length > 0) await supabase.from('profiles').update({ ultimo_email_enviado: new Date().toISOString() }).in('email', emailsProfiles)
      if (emailsLeads.length > 0) await supabase.from('leads').update({ ultimo_email_enviado: new Date().toISOString() }).in('email', emailsLeads)
      
      mostrarNotificacao(`Sucesso! ${listaFinalIds.length} agendados.`, 'sucesso')
      setSelecionados([]); setAssuntoCampanha(''); setTextoCampanha(''); setTextoBotao(''); setUrlBotao('')
      carregarFila(); carregarPerfis(); carregarLeadsExit()
    } catch (error) { mostrarNotificacao('Erro.', 'erro') }
    setEnviandoMassa(false)
  }

  const leadsConvertidos = leadsExit.map(l => ({
    id: `lead_${l.email}`,
    nome: l.segmento === 'leitor' ? 'Lead Popup (Leitor)' : 'Lead Popup (Autor)',
    email: l.email,
    telefone: l.whatsapp,
    link_site: '',
    titulo_ebook: l.segmento === 'leitor' ? 'Popups: Leitores' : 'Popups: Autores',
    plano_selecionado: 'Importado', 
    status: 'inativo',
    ultimo_email_enviado: l.ultimo_email_enviado,
    ultimo_whats_enviado: l.ultimo_whats_enviado,
  } as Perfil))

  const todosOsContatos = [...perfis, ...leadsConvertidos]

  const perfisFiltrados = perfis.filter(p => p.status === abaAtiva)
  const perfisAgrupadosPorCliente = perfisFiltrados.reduce((acc, perfil) => {
      const emailChave = perfil.email || `sem-email-${perfil.id}`
      if (!acc[emailChave]) {
          acc[emailChave] = { nome: perfil.nome, email: perfil.email, telefone: perfil.telefone, anuncios: [] }
      }
      acc[emailChave].anuncios.push(perfil)
      return acc
  }, {} as Record<string, { nome: string, email: string, telefone?: string, anuncios: Perfil[] }>)
  
  const listaClientesAgrupados = Object.values(perfisAgrupadosPorCliente)

  const toggleExpandirCliente = (email: string) => {
      setClientesExpandidos(prev => prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email])
  }

  const listasImportadasDisponiveis = Array.from(new Set(todosOsContatos.filter(p => p.plano_selecionado === 'Importado').map(p => p.titulo_ebook)))

  const aplicarFiltroLista = (p: Perfil) => {
    if (filtroListaAtual === 'todos') return true;
    if (filtroListaAtual === 'vitrine') return p.plano_selecionado !== 'Importado';
    return p.titulo_ebook === filtroListaAtual && p.plano_selecionado === 'Importado';
  }

  const emailsValidosFiltrados = todosOsContatos.filter(p => p.email && !p.email.includes('@importado.com')).filter(aplicarFiltroLista)
  const clientesUnicosEmail = Array.from(new Map(emailsValidosFiltrados.map(p => [p.email.toLowerCase(), p])).values())
  const clientesComEmailParaMassa = clientesUnicosEmail.filter(p => {
    if (filtroEmailMassa === 'todos') return true
    if (filtroEmailMassa === 'enviados') return p.ultimo_email_enviado != null
    if (filtroEmailMassa === 'nao_enviados') return p.ultimo_email_enviado == null
    return true
  })

  const clientesComWhatsappRaw = todosOsContatos.filter(p => p.telefone && p.telefone.trim() !== '').filter(aplicarFiltroLista)
  const clientesUnicosWhats = Array.from(new Map(clientesComWhatsappRaw.map(p => [p.telefone!.replace(/\D/g, ''), p])).values())
  const clientesWhatsAppFiltrados = clientesUnicosWhats.filter(p => {
    if (filtroWhats === 'todos') return true
    if (filtroWhats === 'enviados') return p.ultimo_whats_enviado != null
    if (filtroWhats === 'nao_enviados') return p.ultimo_whats_enviado == null
    return true
  })

  const toggleSelecao = (id: string) => setSelecionados(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id])
  const selecionarMassa = (qtd: number) => setSelecionados(clientesComEmailParaMassa.slice(0, qtd).map(p => p.id))
  const selecionarTodos = () => setSelecionados(clientesComEmailParaMassa.map(p => p.id))

  const filaFiltrada = fila.filter(item => item.status === abaFila)

  if (!autorizado) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-500">Verificando Credenciais...</div>
  if (!isClient) return null; 

  return (
    <div className="min-h-screen bg-slate-50 p-8 relative">
      
      {modalImportacaoAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 bg-emerald-50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-emerald-900">📥 Importar Lista de Leads</h2>
                <p className="text-emerald-700 text-xs mt-1">Cadastre e-mails ou números em massa.</p>
              </div>
              <button onClick={() => setModalImportacaoAberto(false)} className="text-emerald-400 hover:text-emerald-700 text-2xl font-bold">&times;</button>
            </div>
            
            <div className="p-6">
              
              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-700 mb-1">Nome da Lista (Opcional)</label>
                <input 
                  type="text" 
                  value={nomeListaImportacao} 
                  onChange={e => setNomeListaImportacao(e.target.value)} 
                  className="w-full p-2.5 border border-slate-300 bg-slate-50 rounded-lg outline-none text-sm focus:border-emerald-500" 
                  placeholder="Ex: Leads Ebook Agosto" 
                />
              </div>

              <p className="text-sm text-slate-600 mb-2 font-bold">Cole os dados (1 por linha):</p>
              <textarea 
                rows={8} 
                className="w-full p-4 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-sm font-mono"
                placeholder="exemplo@gmail.com&#10;5511999999999&#10;outro@email.com&#10;..."
                value={textoImportacao}
                onChange={(e) => setTextoImportacao(e.target.value)}
              />
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setModalImportacaoAberto(false)} className="px-5 py-2 rounded-lg font-bold text-slate-600 bg-slate-100 hover:bg-slate-200">Cancelar</button>
              <button onClick={processarImportacao} disabled={importando || !textoImportacao.trim()} className="px-5 py-2 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md disabled:opacity-50 flex items-center gap-2">
                {importando ? '⏳ Importando...' : '📥 Iniciar Importação'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                    <label className="block text-sm font-bold text-slate-700 mb-1">Nome / Autor *</label>
                    <input type="text" value={perfilEditando.nome || ''} onChange={e => setPerfilEditando({...perfilEditando, nome: e.target.value})} className="w-full p-2.5 border border-slate-300 bg-slate-50 rounded-lg outline-none text-sm focus:border-purple-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">WhatsApp / Telefone *</label>
                    <input type="text" value={perfilEditando.telefone || ''} onChange={e => setPerfilEditando({...perfilEditando, telefone: e.target.value})} className="w-full p-2.5 border border-slate-300 bg-slate-50 rounded-lg outline-none text-sm focus:border-purple-500" placeholder="Ex: 61982..." required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Título do Material *</label>
                    <input type="text" value={perfilEditando.titulo_ebook || ''} onChange={e => setPerfilEditando({...perfilEditando, titulo_ebook: e.target.value})} className="w-full p-2.5 border border-slate-300 bg-slate-50 rounded-lg outline-none text-sm focus:border-purple-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Link de Destino *</label>
                    <input type="url" value={perfilEditando.link_site || ''} onChange={e => setPerfilEditando({...perfilEditando, link_site: e.target.value})} className="w-full p-2.5 border border-slate-300 bg-slate-50 rounded-lg outline-none text-sm focus:border-purple-500" required />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Descrição *</label>
                  <textarea rows={4} value={perfilEditando.descricao || ''} onChange={e => setPerfilEditando({...perfilEditando, descricao: e.target.value})} className="w-full p-2.5 border border-slate-300 bg-slate-50 rounded-lg outline-none text-sm focus:border-purple-500" placeholder="Texto que aparece na vitrine..." required />
                </div>
                
                <div className="border border-slate-200 bg-slate-50 p-5 rounded-xl">
                    <label className="block text-sm font-bold text-slate-900 mb-2">Capa do Material *</label>
                    
                    <input 
                      type="file" accept="image/*" onChange={handleUploadCapaAdmin} disabled={uploading}
                      required={!perfilEditando.imagem_url} 
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
                  {perfis.filter(p => p.status === 'inativo' && (!p.cliques || p.cliques.length === 0) && (p.created_at ? new Date(p.created_at) : new Date()) < (new Date(new Date().setDate(new Date().getDate() - diasInatividade)))).length === 0 
                    ? `Nenhum contato INATIVO e SEM CLIQUES cadastrado há mais de ${diasInatividade} dias foi encontrado.` 
                    : `⚠️ ${perfis.filter(p => p.status === 'inativo' && (!p.cliques || p.cliques.length === 0) && (p.created_at ? new Date(p.created_at) : new Date()) < (new Date(new Date().setDate(new Date().getDate() - diasInatividade)))).length} contato(s) inativo(s) se encaixa(m) nessa regra e será(ão) excluído(s):`}
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setModalLimpezaAberto(false)} className="px-6 py-2.5 rounded-lg font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100">Cancelar</button>
              <button onClick={executarLimpezaFrios} className="px-6 py-2.5 rounded-lg font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md">Confirmar e Excluir</button>
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

          {/* BOTÃO DE NOTIFICAÇÕES PUSH */}
          <button onClick={() => setAbaAtiva('push')} className={`px-5 py-2 rounded-lg font-bold text-sm ${abaAtiva === 'push' ? 'bg-orange-600 text-white' : 'bg-white text-orange-700 border border-orange-200'}`}>🔔 Notificações Push</button>

          {/* BOTÃO DA ABA DE LEADS DO POPUP */}
          <button onClick={() => setAbaAtiva('leads')} className={`px-5 py-2 rounded-lg font-bold text-sm ${abaAtiva === 'leads' ? 'bg-purple-600 text-white' : 'bg-white text-purple-700 border border-purple-200'}`}>
            🎁 Leads E-books ({leadsExit.length})
          </button>

          {/* BOTÃO DA ABA DE CONFIGURAR POPUPS */}
          <button onClick={() => setAbaAtiva('popups')} className={`px-5 py-2 rounded-lg font-bold text-sm ${abaAtiva === 'popups' ? 'bg-pink-600 text-white' : 'bg-white text-pink-700 border border-pink-200'}`}>
            🧲 Textos do Popup
          </button>

          {/* BOTÃO DA BIBLIOTECA GRÁTIS */}
          <button onClick={() => setAbaAtiva('biblioteca')} className={`px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 ${abaAtiva === 'biblioteca' ? 'bg-orange-600 text-white' : 'bg-white text-orange-700 border border-orange-200'}`}>
            📚 Biblioteca Grátis
          </button>
        </div>

        {/* 📚 ABA DE BIBLIOTECA GRÁTIS */}
        {abaAtiva === 'biblioteca' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit sticky top-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Adicionar Novo E-book Grátis</h2>
              <form onSubmit={async (e) => {
                e.preventDefault()
                if (!novoEbookGratis.imagem_url) return mostrarNotificacao('Adicione uma capa!', 'erro')
                const { error } = await supabase.from('ebooks_gratis').insert([novoEbookGratis])
                if (!error) {
                  mostrarNotificacao('E-book Grátis Adicionado!', 'sucesso')
                  setNovoEbookGratis({ titulo: '', imagem_url: '', link_download: '' })
                  carregarBiblioteca()
                } else mostrarNotificacao('Erro ao adicionar.', 'erro')
              }} className="space-y-4">
                
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors">
                   {novoEbookGratis.imagem_url ? (
                     <img src={novoEbookGratis.imagem_url} className="h-32 mx-auto rounded shadow-sm mb-3" alt="Capa" />
                   ) : (
                     <div className="h-32 flex items-center justify-center text-slate-400 mb-3"><BookOpen className="size-8" /></div>
                   )}
                   <input type="file" accept="image/*" disabled={uploadingGratis} onChange={async (e) => {
                      try {
                        setUploadingGratis(true)
                        const file = e.target.files?.[0]
                        if (!file) return
                        const ext = file.name.split('.').pop()
                        const fileName = `gratis-${Date.now()}.${ext}`
                        const { error } = await supabase.storage.from('imagens').upload(fileName, file)
                        if (error) throw error
                        const { data } = supabase.storage.from('imagens').getPublicUrl(fileName)
                        setNovoEbookGratis({...novoEbookGratis, imagem_url: data.publicUrl})
                      } catch(e) { mostrarNotificacao('Erro no upload', 'erro') } finally { setUploadingGratis(false) }
                   }} className="text-xs w-full file:bg-orange-100 file:text-orange-700 file:border-0 file:rounded file:px-2 file:py-1 cursor-pointer" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Título do E-book</label>
                  <input required value={novoEbookGratis.titulo} onChange={e => setNovoEbookGratis({...novoEbookGratis, titulo: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm outline-none focus:border-orange-500" placeholder="Ex: Guia de Marketing" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Link de Download Externo (Drive/Mega)</label>
                  <input required type="url" value={novoEbookGratis.link_download} onChange={e => setNovoEbookGratis({...novoEbookGratis, link_download: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm outline-none focus:border-orange-500" placeholder="https://..." />
                </div>
                
                <button type="submit" disabled={uploadingGratis} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50">
                  {uploadingGratis ? 'Carregando...' : '+ Adicionar à Biblioteca'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900">E-books na Biblioteca ({biblioteca.length})</h2>
              </div>
              <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto">
                {biblioteca.map(ebook => (
                  <div key={ebook.id} className="border border-slate-200 rounded-xl p-3 flex flex-col bg-white hover:border-orange-300 transition-colors">
                    <img src={ebook.imagem_url} className="w-full aspect-[3/4] object-cover rounded shadow-sm mb-3" alt="Capa" />
                    <h3 className="font-bold text-xs text-slate-800 line-clamp-2 mb-2 flex-1">{ebook.titulo}</h3>
                    <button onClick={async () => {
                      if(confirm('Remover este e-book da biblioteca grátis?')) {
                        await supabase.from('ebooks_gratis').delete().eq('id', ebook.id)
                        carregarBiblioteca()
                      }
                    }} className="w-full bg-red-50 text-red-600 text-xs font-bold py-1.5 rounded hover:bg-red-100 transition-colors">Remover</button>
                  </div>
                ))}
                {biblioteca.length === 0 && <div className="col-span-full text-center py-8 text-slate-400 font-bold">Nenhum e-book gratuito cadastrado.</div>}
              </div>
            </div>
          </div>
        )}

        {/* ⚠️ NOVA ABA: CONFIGURAR TEXTOS DOS POPUPS ⚠️ */}
        {abaAtiva === 'popups' && (
          <div className="grid lg:grid-cols-2 gap-8">
            
            {/* POPUP DE LEITORES (VITRINE) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-blue-50">
                <h2 className="text-xl font-bold text-blue-900">📚 Popup de Leitores (Vitrine)</h2>
                <p className="text-sm text-blue-700 mt-1">Configure o que aparece para os visitantes comuns do site.</p>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); salvarPopup('leitor', popupLeitor) }} className="p-6 space-y-4">
                <div><label className="block text-xs font-bold text-slate-700 mb-1">Título do Popup</label><input required value={popupLeitor.titulo} onChange={e => setPopupLeitor({...popupLeitor, titulo: e.target.value})} className="w-full p-2 border rounded outline-none text-sm" placeholder="Ex: Leve seu E-book Grátis!" /></div>
                <div><label className="block text-xs font-bold text-slate-700 mb-1">Subtítulo do Popup</label><input required value={popupLeitor.subtitulo} onChange={e => setPopupLeitor({...popupLeitor, subtitulo: e.target.value})} className="w-full p-2 border rounded outline-none text-sm" placeholder="Preencha para receber..." /></div>
                <div><label className="block text-xs font-bold text-slate-700 mb-1">Texto do Botão</label><input required value={popupLeitor.botao_texto} onChange={e => setPopupLeitor({...popupLeitor, botao_texto: e.target.value})} className="w-full p-2 border rounded outline-none text-sm" placeholder="Quero meu E-book" /></div>
                <div><label className="block text-xs font-bold text-slate-700 mb-1">URL da Imagem de Capa</label><input value={popupLeitor.imagem_url} onChange={e => setPopupLeitor({...popupLeitor, imagem_url: e.target.value})} className="w-full p-2 border rounded outline-none text-sm" placeholder="https://..." /></div>
                <div><label className="block text-xs font-bold text-slate-700 mb-1">Link do E-book a entregar (PDF)</label><input required value={popupLeitor.ebook_link} onChange={e => setPopupLeitor({...popupLeitor, ebook_link: e.target.value})} className="w-full p-2 border rounded outline-none text-sm" placeholder="https://..." /></div>
                
                <div className="pt-4 border-t border-slate-100">
                  <p className="font-bold text-sm text-slate-900 mb-3">E-mail de Entrega</p>
                  <div><label className="block text-xs font-bold text-slate-700 mb-1">Assunto do E-mail</label><input required value={popupLeitor.email_assunto} onChange={e => setPopupLeitor({...popupLeitor, email_assunto: e.target.value})} className="w-full p-2 border rounded outline-none text-sm" placeholder="Seu E-book chegou!" /></div>
                  <div className="mt-3"><label className="block text-xs font-bold text-slate-700 mb-1">Texto do Botão no E-mail</label><input required value={popupLeitor.email_botao_texto || ''} onChange={e => setPopupLeitor({...popupLeitor, email_botao_texto: e.target.value})} className="w-full p-2 border rounded outline-none text-sm" placeholder="Ex: Baixar Meu E-book Agora" /></div>
                  <div className="mt-3"><label className="block text-xs font-bold text-slate-700 mb-1">Corpo do E-mail (O botão será inserido onde você digitar <strong className="text-pink-600">[BOTAO]</strong>)</label><textarea required rows={4} value={popupLeitor.email_corpo} onChange={e => setPopupLeitor({...popupLeitor, email_corpo: e.target.value})} className="w-full p-2 border rounded outline-none text-sm" placeholder="Olá! Aqui está: [BOTAO]" /></div>
                </div>

                <button type="submit" disabled={salvandoPopup} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition disabled:opacity-50">
                  {salvandoPopup ? 'Salvando...' : 'Salvar Popup Leitores'}
                </button>
              </form>
            </div>

            {/* POPUP DE AUTORES (CADASTRO) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-emerald-50">
                <h2 className="text-xl font-bold text-emerald-900">🚀 Popup de Anunciantes</h2>
                <p className="text-sm text-emerald-700 mt-1">Configure a isca para quem acessa a página de publicar e-book.</p>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); salvarPopup('autor', popupAutor) }} className="p-6 space-y-4">
                <div><label className="block text-xs font-bold text-slate-700 mb-1">Título do Popup</label><input required value={popupAutor.titulo} onChange={e => setPopupAutor({...popupAutor, titulo: e.target.value})} className="w-full p-2 border rounded outline-none text-sm" placeholder="Ex: Guia para Vender Mais!" /></div>
                <div><label className="block text-xs font-bold text-slate-700 mb-1">Subtítulo do Popup</label><input required value={popupAutor.subtitulo} onChange={e => setPopupAutor({...popupAutor, subtitulo: e.target.value})} className="w-full p-2 border rounded outline-none text-sm" placeholder="Preencha para receber..." /></div>
                <div><label className="block text-xs font-bold text-slate-700 mb-1">Texto do Botão</label><input required value={popupAutor.botao_texto} onChange={e => setPopupAutor({...popupAutor, botao_texto: e.target.value})} className="w-full p-2 border rounded outline-none text-sm" placeholder="Receber Manual" /></div>
                <div><label className="block text-xs font-bold text-slate-700 mb-1">URL da Imagem de Capa</label><input value={popupAutor.imagem_url} onChange={e => setPopupAutor({...popupAutor, imagem_url: e.target.value})} className="w-full p-2 border rounded outline-none text-sm" placeholder="https://..." /></div>
                <div><label className="block text-xs font-bold text-slate-700 mb-1">Link do E-book a entregar (PDF)</label><input required value={popupAutor.ebook_link} onChange={e => setPopupAutor({...popupAutor, ebook_link: e.target.value})} className="w-full p-2 border rounded outline-none text-sm" placeholder="https://..." /></div>
                
                <div className="pt-4 border-t border-slate-100">
                  <p className="font-bold text-sm text-slate-900 mb-3">E-mail de Entrega</p>
                  <div><label className="block text-xs font-bold text-slate-700 mb-1">Assunto do E-mail</label><input required value={popupAutor.email_assunto} onChange={e => setPopupAutor({...popupAutor, email_assunto: e.target.value})} className="w-full p-2 border rounded outline-none text-sm" placeholder="Seu material chegou!" /></div>
                  <div className="mt-3"><label className="block text-xs font-bold text-slate-700 mb-1">Texto do Botão no E-mail</label><input required value={popupAutor.email_botao_texto || ''} onChange={e => setPopupAutor({...popupAutor, email_botao_texto: e.target.value})} className="w-full p-2 border rounded outline-none text-sm" placeholder="Ex: Baixar Meu Manual" /></div>
                  <div className="mt-3"><label className="block text-xs font-bold text-slate-700 mb-1">Corpo do E-mail (O botão será inserido onde você digitar <strong className="text-pink-600">[BOTAO]</strong>)</label><textarea required rows={4} value={popupAutor.email_corpo} onChange={e => setPopupAutor({...popupAutor, email_corpo: e.target.value})} className="w-full p-2 border rounded outline-none text-sm" placeholder="Olá! Aqui está o manual: [BOTAO]" /></div>
                </div>

                <button type="submit" disabled={salvandoPopup} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg transition disabled:opacity-50">
                  {salvandoPopup ? 'Salvando...' : 'Salvar Popup Anunciantes'}
                </button>
              </form>
            </div>

          </div>
        )}

        {/* 🎁 ABA DE LEADS CAPTURADOS PELO POPUP */}
        {abaAtiva === 'leads' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Leads Capturados (E-books Grátis)</h2>
                <p className="text-sm text-slate-500 mt-1">Gerencie quem baixou os materiais e entre em contato via WhatsApp.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setFiltroSegmentoLead('todos')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${filtroSegmentoLead === 'todos' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  Todos ({leadsExit.length})
                </button>
                <button onClick={() => setFiltroSegmentoLead('leitor')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${filtroSegmentoLead === 'leitor' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  Leitores
                </button>
                <button onClick={() => setFiltroSegmentoLead('autor')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${filtroSegmentoLead === 'autor' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  Autores / Anunciantes
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase">E-mail</th>
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase">WhatsApp</th>
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase">Segmento</th>
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase">Data</th>
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leadsExit
                    .filter(l => filtroSegmentoLead === 'todos' || l.segmento === filtroSegmentoLead)
                    .map((lead) => (
                      <tr key={lead.email} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-800">{lead.email}</td>
                        <td className="p-3 text-slate-600">{lead.whatsapp}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${lead.segmento === 'leitor' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                            {lead.segmento}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 text-xs">
                          {lead.updated_at ? new Date(lead.updated_at).toLocaleDateString('pt-BR') : 'N/A'}
                        </td>
                        <td className="p-3 text-right">
                          <a 
                            href={`https://wa.me/55${lead.whatsapp.replace(/\D/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors"
                          >
                            💬 Conversar
                          </a>
                        </td>
                      </tr>
                    ))}
                  {leadsExit.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">
                        Nenhum lead capturado ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 🔔 ABA DE NOTIFICAÇÕES PUSH */}
        {abaAtiva === 'push' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Disparo de Notificações</h2>
                <p className="text-sm text-slate-500 mt-1">Envie alertas diretos para o celular e computador dos assinantes.</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
                📱 {inscritosPush.length} Dispositivos Inscritos
              </div>
            </div>

            <form onSubmit={dispararPushEmMassa} className="space-y-4 max-w-3xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Título da Notificação *</label>
                  <input type="text" required value={pushTitulo} onChange={e => setPushTitulo(e.target.value)} className="w-full p-3 border border-slate-200 bg-slate-50 rounded-lg outline-none focus:border-orange-500" placeholder="Ex: Novo E-book na Vitrine!" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Link de Destino *</label>
                  <input type="url" required value={pushUrl} onChange={e => setPushUrl(e.target.value)} className="w-full p-3 border border-slate-200 bg-slate-50 rounded-lg outline-none focus:border-orange-500" placeholder="https://..." />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Mensagem *</label>
                <textarea required rows={3} value={pushMensagem} onChange={e => setPushMensagem(e.target.value)} className="w-full p-3 border border-slate-200 bg-slate-50 rounded-lg outline-none focus:border-orange-500" placeholder="O que você quer contar para os assinantes?" />
              </div>

              <div className="pt-4">
                {enviandoPush ? (
                  <div className="w-full bg-slate-100 rounded-lg p-4 border border-slate-200">
                    <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                      <span>Enviando em lotes (Proteção Anti-Travamento)...</span>
                      <span>{progressoPush.enviados} de {progressoPush.total}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5">
                      <div className="bg-orange-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${(progressoPush.enviados / progressoPush.total) * 100}%` }}></div>
                    </div>
                  </div>
                ) : (
                  <button type="submit" disabled={inscritosPush.length === 0} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold p-4 rounded-xl shadow-md transition-colors disabled:opacity-50">
                    🚀 Disparar Notificação para {inscritosPush.length} Aparelhos
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* 📋 ABAS PENDENTE / ATIVO / INATIVO */}
        {['pendente', 'ativo', 'inativo'].includes(abaAtiva) && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {listaClientesAgrupados.length === 0 ? (
              <div className="p-12 text-center text-slate-500 font-bold text-lg">Nenhum cliente com status "{abaAtiva}" no momento.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {listaClientesAgrupados.map(cliente => (
                  <div key={cliente.email} className="bg-white group transition-colors">
                    
                    <div 
                      onClick={() => toggleExpandirCliente(cliente.email)}
                      className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                    >
                       <div>
                            <h3 className="font-bold text-slate-900 flex items-center gap-3 text-lg">
                                👤 {cliente.nome}
                                <span className="bg-indigo-100 text-indigo-800 text-xs px-2.5 py-1 rounded-full font-bold shadow-sm">
                                    {cliente.anuncios.length} anúncio(s)
                                </span>
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">
                                {cliente.email} {cliente.telefone ? ` • ${cliente.telefone}` : ''}
                            </p>
                       </div>
                       <div className="bg-slate-100 text-slate-600 p-2 rounded-full">
                            {clientesExpandidos.includes(cliente.email) ? '🔼' : '🔽'}
                       </div>
                    </div>

                    {clientesExpandidos.includes(cliente.email) && (
                      <div className="bg-slate-50 border-t border-slate-100 p-5 space-y-4">
                        {cliente.anuncios.map(perfil => (
                           <div key={perfil.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row justify-between gap-4 items-center">
                             
                             <div className="flex-1 min-w-0 w-full">
                               <div className="flex items-center gap-3 mb-1">
                                 <h4 className="font-bold text-slate-900 text-lg truncate">📖 {perfil.titulo_ebook}</h4>
                                 {perfil.favoritos_count ? (
                                    <span className="bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                                      ❤️ {perfil.favoritos_count}
                                    </span>
                                 ) : null}
                               </div>
                               
                               <div className="flex flex-wrap items-center gap-2 mb-3 mt-1">
                                 {perfil.telefone && (
                                   <a href={formatarLinkWhatsApp(perfil.telefone)} target="_blank" rel="noopener noreferrer" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors flex items-center gap-1 shrink-0">
                                      💬 Whats
                                   </a>
                                 )}
                                 <p className="text-sm text-blue-600 hover:underline truncate max-w-xs md:max-w-md" title={perfil.link_site}>
                                   🔗 {perfil.link_site || 'Link não informado'}
                                 </p>
                               </div>

                               <div className="flex flex-wrap items-center gap-2 mb-4">
                                 <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-sm shrink-0">
                                   🖱️ {perfil.cliques?.length || 0} Cliques
                                 </span>
                                 {perfil.cliques && perfil.cliques.length > 0 && (
                                   <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200 max-w-[200px] truncate shrink-0">
                                     Última origem: <strong>{perfil.cliques[0].origem}</strong>
                                   </span>
                                 )}
                               </div>

                               <div className="flex flex-wrap items-center gap-2">
                                 <div className="flex items-center gap-2 bg-indigo-50 px-2 py-1.5 rounded-md border border-indigo-100 shrink-0">
                                   <label className="text-[10px] uppercase font-bold text-indigo-700 tracking-wide">Plano:</label>
                                   <input type="text" list={`planos-${perfil.id}`} value={perfil.plano_selecionado || ''} onChange={(e) => mudarPlano(perfil.id, e.target.value)} placeholder="Ex: 5 meses" className="text-xs font-bold bg-white text-slate-700 border border-indigo-200 rounded p-1 outline-none w-28" />
                                   <datalist id={`planos-${perfil.id}`}>
                                     <option value="1_mes">1 Mês</option><option value="3_meses">3 Meses</option><option value="6_meses">6 Meses</option><option value="12_meses">12 Meses</option><option value="vitalicio">Vitalício</option>
                                   </datalist>
                                 </div>

                                 <div className="flex items-center gap-2 bg-rose-50 px-2 py-1.5 rounded-md border border-rose-100 shrink-0">
                                   <label className="text-[10px] uppercase font-bold text-rose-700 tracking-wide">Vence em:</label>
                                   <input type="date" value={perfil.data_expiracao ? perfil.data_expiracao.split('T')[0] : ''} onChange={(e) => mudarDataExpiracao(perfil.id, e.target.value)} className="text-xs font-bold bg-white text-slate-700 border border-rose-200 rounded p-1 outline-none" />
                                 </div>
                                 
                                 <div className="flex items-center gap-2 bg-amber-50 px-2 py-1.5 rounded-md border border-amber-100 shrink-0">
                                   <label className="text-[10px] uppercase font-bold text-amber-700 tracking-wide">Posição VIP:</label>
                                   <select value={perfil.posicao_fixa || 'nenhuma'} onChange={(e) => mudarPosicaoFixa(perfil.id, e.target.value)} className="text-xs font-bold bg-white text-slate-700 border border-amber-200 rounded p-1 outline-none">
                                     <option value="nenhuma">Padrão</option>
                                     {[...Array(50)].map((_, i) => (<option key={i+1} value={i+1}>Top {i+1}</option>))}
                                   </select>
                                 </div>
                               </div>
                             </div>
                             
                             <div className="flex flex-wrap gap-2 shrink-0">
                               <button onClick={() => setPerfilEditando(perfil)} className="px-4 py-2 bg-purple-100 text-purple-700 font-bold rounded-lg text-sm hover:bg-purple-200 shrink-0 shadow-sm">✏️ Editar</button>
                               
                               {abaAtiva === 'pendente' && (
                                 <>
                                    <button onClick={() => dispararLembretePendente(perfil)} className="px-4 py-2 bg-blue-100 text-blue-700 font-bold rounded-lg text-sm hover:bg-blue-200 shrink-0 shadow-sm">📩 Lembrete</button>
                                    <button onClick={() => mudarStatus(perfil.id, 'ativo')} className="px-4 py-2 bg-emerald-100 text-emerald-700 font-bold rounded-lg text-sm hover:bg-emerald-200 shrink-0 shadow-sm">✅ Aprovar</button>
                                 </>
                               )}
                               
                               {abaAtiva === 'ativo' && (
                                  <button onClick={() => mudarStatus(perfil.id, 'inativo')} className="px-4 py-2 bg-amber-100 text-amber-700 font-bold rounded-lg text-sm hover:bg-amber-200 shrink-0 shadow-sm">⏸️ Pausar</button>
                               )}
                               
                               {abaAtiva === 'inativo' && (
                                  <>
                                    <button onClick={() => dispararLembreteInativo(perfil)} className="px-4 py-2 bg-blue-100 text-blue-700 font-bold rounded-lg text-sm hover:bg-blue-200 shrink-0 shadow-sm">🔔 Lembrete</button>
                                    <button onClick={() => mudarStatus(perfil.id, 'ativo')} className="px-4 py-2 bg-emerald-100 text-emerald-700 font-bold rounded-lg text-sm hover:bg-emerald-200 shrink-0 shadow-sm">▶️ Reativar</button>
                                  </>
                               )}
                               
                               <button onClick={() => excluirPerfil(perfil.id)} className="px-4 py-2 bg-red-50 text-red-600 font-bold rounded-lg text-sm border border-red-200 hover:bg-red-100 shrink-0 shadow-sm">🗑️ Excluir</button>
                             </div>
                           </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ⏳ ABA DE FILA */}
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

        {/* 📧 ABA DE E-MAIL EM MASSA */}
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
                     <optgroup label="Leads da Popup">
                       <option value="Popups: Leitores">Popups: Leitores</option>
                       <option value="Popups: Autores">Popups: Autores</option>
                     </optgroup>
                     <optgroup label="Listas Importadas">
                       {listasImportadasDisponiveis.filter(l => !l.startsWith('Popups:')).map(lista => (
                         <option key={lista} value={lista}>{lista}</option>
                       ))}
                     </optgroup>
                   </select>
                 </div>

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
                         {p.id.startsWith('lead_') && <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded uppercase font-bold">Popup</span>}
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

        {/* 💬 ABA DE WHATSAPP DIRETO */}
        {abaAtiva === 'whatsapp' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
               
               <div className="p-4 bg-emerald-50 border-b border-emerald-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                 
                 <div className="flex items-center gap-2">
                   <label className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Filtrar:</label>
                   <select 
                     value={filtroListaAtual} 
                     onChange={(e) => setFiltroListaAtual(e.target.value)} 
                     className="text-sm font-bold bg-white text-emerald-900 border border-emerald-300 rounded p-1.5 outline-none"
                   >
                     <option value="todos">Todos os Contatos c/ Whats</option>
                     <option value="vitrine">Apenas Clientes da Vitrine</option>
                     <optgroup label="Leads da Popup">
                       <option value="Popups: Leitores">Popups: Leitores</option>
                       <option value="Popups: Autores">Popups: Autores</option>
                     </optgroup>
                     <optgroup label="Listas Importadas">
                       {listasImportadasDisponiveis.filter(l => !l.startsWith('Popups:')).map(lista => (
                         <option key={lista} value={lista}>{lista}</option>
                       ))}
                     </optgroup>
                   </select>
                 </div>
                 
                 <div className="flex flex-wrap gap-2 items-center">
                   <button onClick={() => setFiltroWhats('todos')} className={`px-3 py-1 rounded text-xs font-bold ${filtroWhats === 'todos' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-700 border border-emerald-200'}`}>Todos ({clientesWhatsAppFiltrados.length})</button>
                   <button onClick={() => setFiltroWhats('nao_enviados')} className={`px-3 py-1 rounded text-xs font-bold ${filtroWhats === 'nao_enviados' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-700 border border-emerald-200'}`}>Falta Enviar</button>
                   <button onClick={() => setFiltroWhats('enviados')} className={`px-3 py-1 rounded text-xs font-bold ${filtroWhats === 'enviados' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-700 border border-emerald-200'}`}>Já Enviados</button>
                   <span className="text-emerald-300 mx-1">|</span>
                   <button onClick={resetarEnviosWhatsApp} className="px-3 py-1 rounded text-xs font-bold bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 shadow-sm transition-colors">
                     🔄 Resetar
                   </button>
                 </div>
               </div>
               
               <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                 {clientesWhatsAppFiltrados.map((p) => (
                   <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                     <div className="flex-1">
                       <p className="font-bold text-slate-900 flex items-center gap-2">
                         {p.nome} 
                         <span className="text-xs text-slate-500 font-normal">({p.telefone})</span>
                         {p.id.startsWith('lead_') && <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded uppercase font-bold">Popup</span>}
                       </p>
                       <p className="text-xs text-slate-400 mt-1">
                         {p.ultimo_whats_enviado 
                           ? `Último envio: ${new Date(p.ultimo_whats_enviado).toLocaleDateString('pt-BR')} às ${new Date(p.ultimo_whats_enviado).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` 
                           : 'Nenhum envio registrado'}
                       </p>
                     </div>
                     <div className="flex items-center gap-3">
                       <a 
                         href={formatarLinkWhatsAppCampanha(p.telefone, textoWhatsCampanha)} 
                         target="_blank" 
                         rel="noopener noreferrer" 
                         onClick={() => marcarWhatsAppEnviado(p.id)}
                         className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-2"
                       >
                         💬 Abrir Conversa
                       </a>
                     </div>
                   </div>
                 ))}
                 
                 {clientesWhatsAppFiltrados.length === 0 && (
                   <div className="p-8 text-center text-slate-500 font-bold">Nenhum cliente encontrado para este filtro.</div>
                 )}
               </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit sticky top-6">
               <h3 className="font-bold text-xl text-slate-900 mb-2">Mensagem do Disparo</h3>
               <p className="text-sm text-slate-500 mb-6">Deixe em branco ou digite um texto para enviar para a lista selecionada.</p>
               
               <div className="space-y-4">
                 <div>
                   <textarea 
                     value={textoWhatsCampanha} 
                     onChange={e => setTextoWhatsCampanha(e.target.value)} 
                     rows={8} 
                     className="w-full p-3 border border-slate-200 bg-slate-50 rounded-lg outline-none focus:border-emerald-500 transition-colors" 
                     placeholder="Digite a mensagem ou cole o seu link..." 
                   />
                 </div>
                 
                 <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                   <p className="text-xs text-emerald-800 font-bold mb-2">💡 Dica de Disparo:</p>
                   <ul className="text-xs text-emerald-700 space-y-1 list-disc pl-4">
                     <li>Selecione a sua lista no filtro do topo.</li>
                     <li>Filtre por "Falta Enviar".</li>
                     <li>Ao clicar em "Abrir Conversa", o status atualiza e a pessoa some da lista "Falta Enviar" para você não mandar duplicado.</li>
                   </ul>
                 </div>
               </div>
            </div>
          </div>
        )}

        {/* ⚙️ ABA DE CONFIGURAÇÕES */}
        {abaAtiva === 'config' && (
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900">Configurações de Disparo (API)</h2>
              <p className="text-sm text-slate-500 mt-1">Gerencie os servidores de e-mail que o sistema utiliza sem precisar acessar o código.</p>
            </div>
            
            <form onSubmit={salvarConfiguracoesEmail} className="p-6 space-y-8">

              {/* ⚠️ AQUI ESTÁ A CENTRAL DE COMANDO ⚠️ */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Servidor Padrão do Sistema</h3>
                <div className="bg-slate-100 p-4 rounded-xl mb-8 border border-slate-200">
                  <label className="block text-sm font-bold text-slate-900 mb-2">Qual servidor deve enviar as mensagens automáticas?</label>
                  <select 
                    value={configEmail.provedor_ativo || 'gmail'} 
                    onChange={e => setConfigEmail({...configEmail, provedor_ativo: e.target.value})} 
                    className="w-full p-3 border border-slate-300 bg-white rounded-lg font-bold outline-none focus:border-slate-500"
                  >
                    <option value="gmail">🟢 Usar Gmail</option>
                    <option value="externo">🟣 Usar SMTP Externo</option>
                  </select>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Servidor Gmail</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">E-mail do Gmail</label>
                    <input 
                      type="email" 
                      value={configEmail.gmail_email || ''} 
                      onChange={e => setConfigEmail({...configEmail, gmail_email: e.target.value})} 
                      className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-slate-500" 
                      placeholder="seuemail@gmail.com" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Senha de Aplicativo</label>
                    <input 
                      type="password" 
                      value={configEmail.gmail_senha || ''} 
                      onChange={e => setConfigEmail({...configEmail, gmail_senha: e.target.value})} 
                      className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-slate-500" 
                      placeholder="••••••••••••" 
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">SMTP Externo</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Servidor (Host)</label>
                    <input 
                      type="text" 
                      value={configEmail.smtp_host || ''} 
                      onChange={e => setConfigEmail({...configEmail, smtp_host: e.target.value})} 
                      className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-slate-500" 
                      placeholder="ex: smtp.hostinger.com" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Porta</label>
                    <input 
                      type="text" 
                      value={configEmail.smtp_port || ''} 
                      onChange={e => setConfigEmail({...configEmail, smtp_port: e.target.value})} 
                      className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-slate-500" 
                      placeholder="ex: 465" 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Credencial (Usuário)</label>
                    <input 
                      type="text" 
                      value={configEmail.smtp_user || ''} 
                      onChange={e => setConfigEmail({...configEmail, smtp_user: e.target.value})} 
                      className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-slate-500" 
                      placeholder="Usuário de Login" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Senha do Servidor</label>
                    <input 
                      type="password" 
                      value={configEmail.smtp_pass || ''} 
                      onChange={e => setConfigEmail({...configEmail, smtp_pass: e.target.value})} 
                      className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-slate-500" 
                      placeholder="••••••••••••" 
                    />
                  </div>
                </div>

                <div className="mt-4 p-4 bg-purple-50 border border-purple-100 rounded-xl">
                  <label className="block text-sm font-bold text-purple-900 mb-1">E-mail do Remetente (O que aparece para o lead)</label>
                  <p className="text-xs text-purple-700 mb-3">Este e-mail DEVE estar verificado e autorizado lá dentro do painel smtp.</p>
                  <input 
                    type="email" 
                    value={configEmail.smtp_remetente || ''} 
                    onChange={e => setConfigEmail({...configEmail, smtp_remetente: e.target.value})} 
                    className="w-full p-3 border border-purple-200 rounded-lg outline-none focus:border-purple-500" 
                    placeholder="ex: suporte@marketingdigitaltop.com.br" 
                  />
                </div>

              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button type="submit" disabled={salvandoConfig} className="px-6 py-3 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700 shadow-md disabled:opacity-50">
                  {salvandoConfig ? 'Salvando...' : '💾 Salvar Configurações'}
                </button>
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  )
}