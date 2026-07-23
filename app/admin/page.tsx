'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Clique = { origem: string }

type Perfil = {
  id: string
  nome: string
  email: string
  link_site: string 
  titulo_ebook: string
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
}

export default function AdminPage() {
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
  const [qtdEnvioDesejada, setQtdEnvioDesejada] = useState(50)
  const [tamanhoLote, setTamanhoLote] = useState(2) 
  const [intervaloLote, setIntervaloLote] = useState(1) 
  const [enviandoMassa, setEnviandoMassa] = useState(false)

  useEffect(() => {
    carregarPerfis()
    carregarFila()
    
    const intervalo = setInterval(() => {
      carregarFila()
    }, 15000)
    return () => clearInterval(intervalo)
  }, [])

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

  // --- FUNÇÕES DE GERENCIAMENTO DE CLIENTES ---
  const mudarStatus = async (id: string, novoStatus: string) => {
    await supabase.from('profiles').update({ status: novoStatus }).eq('id', id)
    mostrarNotificacao(`Status alterado para ${novoStatus.toUpperCase()}`, 'sucesso')
    carregarPerfis()
  }

  const mudarPosicaoFixa = async (id: string, posicao: string) => {
    const valorParaSalvar = posicao === 'nenhuma' ? null : Number(posicao);
    const { error } = await supabase.from('profiles').update({ posicao_fixa: valorParaSalvar }).eq('id', id)
    
    if (error) {
      mostrarNotificacao('Erro ao alterar posição VIP.', 'erro')
    } else {
      mostrarNotificacao('Posição VIP atualizada com sucesso!', 'sucesso')
      carregarPerfis()
    }
  }

  // NOVA FUNÇÃO: Alterar o texto do plano (livre ou pelas sugestões)
  const mudarPlano = async (id: string, novoPlano: string) => {
    const { error } = await supabase.from('profiles').update({ plano_selecionado: novoPlano }).eq('id', id)
    if (error) {
      mostrarNotificacao('Erro ao alterar plano.', 'erro')
    } else {
      mostrarNotificacao('Plano atualizado com sucesso!', 'sucesso')
      carregarPerfis()
    }
  }

  // NOVA FUNÇÃO: Definir a data exata de vencimento
  const mudarDataExpiracao = async (id: string, novaData: string) => {
    const { error } = await supabase.from('profiles').update({ data_expiracao: novaData || null }).eq('id', id)
    if (error) {
      mostrarNotificacao('Erro ao alterar vencimento.', 'erro')
    } else {
      mostrarNotificacao('Data de vencimento salva!', 'sucesso')
      carregarPerfis()
    }
  }

  const excluirPerfil = async (id: string) => {
    if (confirm('Tem certeza que deseja EXCLUIR este cliente definitivamente?')) {
      await supabase.from('profiles').delete().eq('id', id)
      mostrarNotificacao('Cliente excluído com sucesso.', 'sucesso')
      carregarPerfis()
    }
  }

  const dispararLembretePendente = async (perfil: Perfil) => {
    if (confirm(`Deseja enviar um lembrete de ativação de plano para ${perfil.nome}?`)) {
      
      fetch('/api/enviar-lembrete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: perfil.email, 
          nome: perfil.nome, 
          titulo: perfil.titulo_ebook || '', 
          plano: perfil.plano_selecionado || '' 
        })
      }).catch(err => console.error('Erro silencioso API:', err))

      const novoEnvio = {
        perfil_id: perfil.id,
        email: perfil.email,
        nome: perfil.nome,
        assunto: `Finalize seu cadastro, ${perfil.nome.split(' ')[0]}!`,
        mensagem: 'Notamos que seu anúncio ainda está aguardando ativação. Escolha um plano agora mesmo para publicar sua oferta e começar a receber cliques!',
        texto_botao: 'Ativar Anúncio Agora',
        url_botao: `${window.location.origin}/planos`, 
        base_url: window.location.origin,
        status: 'pendente',
        clicou: false,
        agendado_para: new Date().toISOString()
      }
      await supabase.from('fila_envios').insert([novoEnvio])
      
      mostrarNotificacao('Lembrete enviado e rastreio adicionado à Fila!', 'sucesso')
      carregarFila()
    }
  }

  const dispararLembreteInativo = async (perfil: Perfil) => {
    if (confirm(`Deseja enviar um e-mail de renovação de plano para ${perfil.nome}?`)) {
      const novoEnvio = {
        perfil_id: perfil.id,
        email: perfil.email,
        nome: perfil.nome,
        assunto: `⚠️ Seu acesso expirou, ${perfil.nome.split(' ')[0]}!`,
        mensagem: 'Notamos que o seu plano expirou e seu anúncio foi pausado. Não perca suas vendas! Clique no botão abaixo para escolher um novo plano e reativar seu acesso imediatamente.',
        texto_botao: 'Ver Planos e Renovar',
        url_botao: `${window.location.origin}/planos`, 
        base_url: window.location.origin,
        status: 'pendente',
        clicou: false,
        agendado_para: new Date().toISOString()
      }
      await supabase.from('fila_envios').insert([novoEnvio])
      mostrarNotificacao('Lembrete de renovação enviado para a Fila!', 'sucesso')
      setAbaAtiva('fila')
      setAbaFila('pendente')
      carregarFila()
    }
  }

  // --- FUNÇÕES DA FILA E HISTÓRICO ---
  const removerDaFila = async (id: string) => {
    await supabase.from('fila_envios').delete().eq('id', id)
    mostrarNotificacao('Deletado com sucesso.', 'sucesso')
    carregarFila()
  }

  const limparHistoricoEnviados = async () => {
    if (confirm('Tem certeza que deseja apagar TODO o histórico de e-mails enviados?')) {
      await supabase.from('fila_envios').delete().eq('status', 'enviado')
      mostrarNotificacao('Histórico limpo com sucesso.', 'sucesso')
      carregarFila()
    }
  }

  const esvaziarFila = async () => {
    if (confirm('ATENÇÃO: Cancelar TODOS os envios PENDENTES?')) {
      await supabase.from('fila_envios').delete().eq('status', 'pendente')
      carregarFila(); 
      mostrarNotificacao('Fila de pendentes esvaziada.', 'sucesso');
    }
  }

  const reenviarParaNaoClicadores = async () => {
    const naoClicaram = fila.filter(item => item.status === 'enviado' && !item.clicou)
    
    if (naoClicaram.length === 0) {
      return mostrarNotificacao('Todos os clientes desta lista já clicaram!', 'sucesso')
    }

    if (confirm(`Agendar o reenvio para os ${naoClicaram.length} clientes que ignoraram o e-mail?\nO sistema fará envios graduais (2 por minuto).`)) {
      setEnviandoMassa(true)
      
      const registrosFila = []
      let tempoAgendado = new Date() 
      const limitePorLote = 2        
      const espacoMinutos = 1        

      for (let i = 0; i < naoClicaram.length; i += limitePorLote) {
        const lote = naoClicaram.slice(i, i + limitePorLote)

        for (const item of lote) {
          registrosFila.push({
            perfil_id: item.perfil_id,
            email: item.email,
            nome: item.nome,
            assunto: `[Lembrete] ${item.assunto}`,
            mensagem: item.mensagem || 'Notamos que você não abriu nosso último e-mail. Aqui está o link novamente!',
            texto_botao: item.texto_botao || 'Acessar Agora',
            url_botao: item.url_botao || window.location.origin,
            base_url: item.base_url || window.location.origin,
            status: 'pendente',
            clicou: false,
            agendado_para: tempoAgendado.toISOString() 
          })
        }
        tempoAgendado = new Date(tempoAgendado.getTime() + (espacoMinutos * 60000))
      }

      await supabase.from('fila_envios').insert(registrosFila)
      mostrarNotificacao(`${registrosFila.length} e-mails agendados na fila de pendentes!`, 'sucesso')
      setAbaFila('pendente')
      carregarFila()
      setEnviandoMassa(false)
    }
  }

  // --- FUNÇÕES DE CAMPANHAS EM MASSA ---
  const dispararCampanhaMassa = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selecionados.length === 0) return mostrarNotificacao('Selecione pelo menos um cliente.', 'erro')
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
            perfil_id: cliente.id,
            email: cliente.email,
            nome: cliente.nome,
            assunto: assuntoCampanha,
            mensagem: textoCampanha,
            texto_botao: textoBotao,           
            url_botao: urlBotao,               
            base_url: window.location.origin,  
            status: 'pendente',
            clicou: false, 
            agendado_para: tempoAgendado.toISOString() 
          })
        }
        tempoAgendado = new Date(tempoAgendado.getTime() + (intervaloLote * 60000))
      }

      await supabase.from('fila_envios').insert(registrosFila)
      mostrarNotificacao(`Sucesso! ${listaFinalIds.length} e-mails agendados.`, 'sucesso')
      setSelecionados([]); setAssuntoCampanha(''); setTextoCampanha(''); setTextoBotao(''); setUrlBotao('')
      carregarFila() 
    } catch (error) {
      mostrarNotificacao('Erro ao enfileirar a campanha.', 'erro')
    }
    setEnviandoMassa(false)
  }

  const toggleSelecao = (id: string) => setSelecionados(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id])
  const selecionarMassa = (qtd: number) => setSelecionados(perfis.filter(p => p.email).slice(0, qtd).map(p => p.id))
  const selecionarTodos = () => setSelecionados(perfis.filter(p => p.email).map(p => p.id))

  const perfisFiltrados = perfis.filter(p => p.status === abaAtiva)
  const filaFiltrada = fila.filter(item => item.status === abaFila)

  return (
    <div className="min-h-screen bg-slate-50 p-8 relative">
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

        {/* --- MENU DE NAVEGAÇÃO SUPERIOR --- */}
        <div className="flex flex-wrap gap-3 mb-8 border-b border-slate-200 pb-4">
          <button onClick={() => setAbaAtiva('pendente')} className={`px-5 py-2 rounded-lg font-bold text-sm ${abaAtiva === 'pendente' ? 'bg-amber-100 text-amber-800' : 'bg-white text-slate-600 border'}`}>Pendentes</button>
          <button onClick={() => setAbaAtiva('ativo')} className={`px-5 py-2 rounded-lg font-bold text-sm ${abaAtiva === 'ativo' ? 'bg-emerald-100 text-emerald-800' : 'bg-white text-slate-600 border'}`}>Ativos</button>
          <button onClick={() => setAbaAtiva('inativo')} className={`px-5 py-2 rounded-lg font-bold text-sm ${abaAtiva === 'inativo' ? 'bg-red-100 text-red-800' : 'bg-white text-slate-600 border'}`}>Inativos</button>
          
          <button onClick={() => setAbaAtiva('fila')} className={`px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 ml-auto ${abaAtiva === 'fila' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-700 border border-indigo-200'}`}>
            ⏳ Fila ({fila.filter(f => f.status === 'pendente').length})
          </button>
          <button onClick={() => setAbaAtiva('campanhas')} className={`px-5 py-2 rounded-lg font-bold text-sm ${abaAtiva === 'campanhas' ? 'bg-blue-600 text-white' : 'bg-white text-slate-800 border'}`}>📧 Disparos</button>
        </div>

        {/* --- 1. LISTA DE CLIENTES (Pendentes / Ativos / Inativos) --- */}
        {['pendente', 'ativo', 'inativo'].includes(abaAtiva) && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {perfisFiltrados.length === 0 ? (
              <div className="p-12 text-center text-slate-500 font-bold text-lg">
                Nenhum cliente com status "{abaAtiva}" no momento.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {perfisFiltrados.map(perfil => (
                  <div key={perfil.id} className="p-5 flex flex-col md:flex-row justify-between gap-4 items-center hover:bg-slate-50 transition-colors">
                    <div>
                      <h3 className="font-bold text-slate-900">{perfil.nome}</h3>
                      <p className="text-sm text-slate-600">{perfil.email} | Site: {perfil.link_site || 'Não informado'}</p>
                      
                      {/* --- CONTROLES DE PLANO E VIP DO ADMIN --- */}
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        
                        {/* HÍBRIDO: DIGITAÇÃO LIVRE E SUGESTÕES DE PLANO */}
                        <div className="flex items-center gap-2 bg-indigo-50 px-2 py-1.5 rounded-md border border-indigo-100">
                          <label className="text-[10px] uppercase font-bold text-indigo-700 tracking-wide">Plano:</label>
                          <input
                            type="text"
                            list="sugestoes-planos"
                            value={perfil.plano_selecionado || ''}
                            onChange={(e) => mudarPlano(perfil.id, e.target.value)}
                            placeholder="Ex: 5 meses"
                            className="text-xs font-bold bg-white text-slate-700 border border-indigo-200 rounded p-1 outline-none w-28 cursor-text hover:border-indigo-400"
                          />
                          <datalist id="sugestoes-planos">
                            <option value="1_mes">1 Mês</option>
                            <option value="3_meses">3 Meses</option>
                            <option value="6_meses">6 Meses</option>
                            <option value="12_meses">12 Meses</option>
                            <option value="vitalicio">Vitalício</option>
                          </datalist>
                        </div>

                        {/* CALENDÁRIO: DATA EXATA DE VENCIMENTO */}
                        <div className="flex items-center gap-2 bg-rose-50 px-2 py-1.5 rounded-md border border-rose-100">
                          <label className="text-[10px] uppercase font-bold text-rose-700 tracking-wide">Vence em:</label>
                          <input 
                            type="date"
                            value={perfil.data_expiracao ? perfil.data_expiracao.split('T')[0] : ''}
                            onChange={(e) => mudarDataExpiracao(perfil.id, e.target.value)}
                            className="text-xs font-bold bg-white text-slate-700 border border-rose-200 rounded p-1 outline-none cursor-pointer hover:border-rose-400"
                          />
                        </div>
                        
                        {/* POSIÇÃO VIP */}
                        <div className="flex items-center gap-2 bg-amber-50 px-2 py-1.5 rounded-md border border-amber-100">
                          <label className="text-[10px] uppercase font-bold text-amber-700 tracking-wide">Posição VIP:</label>
                          <select 
                            value={perfil.posicao_fixa || 'nenhuma'}
                            onChange={(e) => mudarPosicaoFixa(perfil.id, e.target.value)}
                            className="text-xs font-bold bg-white text-slate-700 border border-amber-200 rounded p-1 outline-none cursor-pointer hover:border-amber-400"
                          >
                            <option value="nenhuma">Padrão</option>
                            {[...Array(12)].map((_, i) => (
                              <option key={i+1} value={i+1}>Top {i+1}</option>
                            ))}
                          </select>
                        </div>

                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
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

        {/* --- 2. ABA FILA DE ESPERA E ENVIADOS --- */}
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
                    <button onClick={reenviarParaNaoClicadores} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700 shadow-sm transition-all">
                      🔄 Reenviar (Não Clicou)
                    </button>
                    <button onClick={limparHistoricoEnviados} className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-bold hover:bg-red-100 transition-all">
                      🧹 Limpar Tudo
                    </button>
                  </>
                )}
              </div>
            </div>

            {filaFiltrada.length === 0 ? (
              <div className="p-12 text-center">
                <span className="text-4xl mb-4 block">{abaFila === 'pendente' ? '⏳' : abaFila === 'enviado' ? '✅' : '🛡️'}</span>
                <p className="text-slate-500 font-bold text-lg">Nenhum e-mail {abaFila} no momento.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filaFiltrada.map(item => (
                  <div key={item.id} className="p-5 flex flex-col md:flex-row justify-between gap-4 items-center hover:bg-slate-50 transition-colors">
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-slate-900">{item.nome} <span className="text-sm font-normal text-slate-500">({item.email})</span></p>
                        
                        {abaFila === 'enviado' && (
                          item.clicou ? (
                            <span className="text-[10px] uppercase bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md font-bold tracking-wide border border-emerald-200">🎯 Clicou</span>
                          ) : (
                            <span className="text-[10px] uppercase bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-bold tracking-wide border border-slate-200">🙈 Ignorou</span>
                          )
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mt-1">Assunto: <span className="italic">{item.assunto}</span></p>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                            {abaFila === 'pendente' ? 'Agendado' : abaFila === 'enviado' ? 'Disparado' : 'Falha'}
                        </p>
                        <p className={`text-sm font-bold px-3 py-1 rounded-md mt-1 ${abaFila === 'pendente' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'}`}>
                          {new Date(item.agendado_para).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      
                      <button onClick={() => removerDaFila(item.id)} className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-bold border border-red-200 transition-colors">
                        🗑️ {abaFila === 'pendente' ? 'Cancelar' : 'Excluir'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- 3. ABA CAMPANHAS EM MASSA --- */}
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
                     <div className="flex-1"><p className="font-bold text-slate-900">{p.nome}</p></div>
                   </label>
                 ))}
               </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit sticky top-6">
               <h3 className="font-bold text-xl text-slate-900 mb-6">Configurar Lote</h3>
               <form onSubmit={dispararCampanhaMassa} className="space-y-4">
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
                 <button type="submit" disabled={enviandoMassa || selecionados.length === 0} className="w-full mt-4 bg-blue-600 text-white font-bold p-4 rounded-lg hover:bg-blue-700 transition-all">
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