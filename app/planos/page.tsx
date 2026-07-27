'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// --- DEFINICAO DOS PLANOS ---
const PLANOS_PADRAO = [
  { id: 'padrao_1_mes', nome: '1 Mes', valor: 'R$ 19,90', detalhe: 'Plano inicial na vitrine' },
  { id: 'padrao_2_meses', nome: '2 Meses', valor: 'R$ 37,90', detalhe: 'R$ 18,95 / mes' },
  { id: 'padrao_3_meses', nome: '3 Meses', valor: 'R$ 54,90', detalhe: 'R$ 18,30 / mes' },
  { id: 'padrao_6_meses', nome: '6 Meses', valor: 'R$ 99,90', detalhe: 'R$ 16,65 / mes', destaque: true },
  { id: 'padrao_12_meses', nome: '12 Meses', valor: 'R$ 179,90', detalhe: 'R$ 14,99 / mes - Maior desconto' }
]

const PLANOS_VIP = [
  { id: 'vip_1_mes', nome: '1 Mes VIP', valor: 'R$ 49,90', detalhe: 'Carrossel + Vitrine' },
  { id: 'vip_3_meses', nome: '3 Meses VIP', valor: 'R$ 129,90', detalhe: 'R$ 43,30 / mes' },
  { id: 'vip_6_meses', nome: '6 Meses VIP', valor: 'R$ 239,90', detalhe: 'R$ 39,98 / mes', destaque: true },
  { id: 'vip_12_meses', nome: '12 Meses VIP', valor: 'R$ 399,90', detalhe: 'R$ 33,32 / mes - Dominancia Total' }
]

export default function PlanosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [anuncioId, setAnuncioId] = useState<string | null>(null)
  const [tituloOferta, setTituloOferta] = useState('')
  
  // Controle de Abas e Selecao
  const [tipoPlano, setTipoPlano] = useState<'padrao' | 'vip'>('padrao')
  const [planoPadraoSelecionado, setPlanoPadraoSelecionado] = useState('padrao_6_meses')
  const [planoVipSelecionado, setPlanoVipSelecionado] = useState('vip_6_meses')

  useEffect(() => {
    const carregarDados = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || !session.user.email) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, titulo_ebook')
        .eq('email', session.user.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        setAnuncioId(data.id)
        setTituloOferta(data.titulo_ebook || 'Meu Anuncio')
      } else if (error) {
        console.error("Erro ao buscar anuncio:", error)
      }
    }
    carregarDados()
  }, [router])

  const handleFinalizar = async () => {
    setLoading(true)

    if (!anuncioId) {
      alert("Erro: Nao foi possivel localizar seu anuncio recente. Tente novamente.")
      setLoading(false)
      return
    }

    // Identifica o plano final escolhido com base na aba ativa
    const planoFinalId = tipoPlano === 'padrao' ? planoPadraoSelecionado : planoVipSelecionado
    const listaCorreta = tipoPlano === 'padrao' ? PLANOS_PADRAO : PLANOS_VIP
    const planoEscolhido = listaCorreta.find(p => p.id === planoFinalId)

    // Atualiza no banco
    await supabase
      .from('profiles')
      .update({ plano_selecionado: planoFinalId })
      .eq('id', anuncioId)
    
    // Texto Dinamico para o WhatsApp
    const SEU_NUMERO_WHATSAPP = "5561982096982"
    const tipoTexto = tipoPlano === 'vip' ? "👑 PLANO VIP PREMIUM" : "📦 PLANO PADRAO"
    const textoWhats = `Ola! Acabei de cadastrar minha oferta "${tituloOferta}".\n\nEscolhi o *${tipoTexto}* de *${planoEscolhido?.nome}* no valor de *${planoEscolhido?.valor}*.\n\nComo faco o pagamento para ativar meu anuncio?`
    
    window.location.href = `https://wa.me/${SEU_NUMERO_WHATSAPP}?text=${encodeURIComponent(textoWhats)}`
  }

  // Define qual lista de planos renderizar
  const planosExibidos = tipoPlano === 'padrao' ? PLANOS_PADRAO : PLANOS_VIP
  const valorSelecionadoAtual = tipoPlano === 'padrao' ? planoPadraoSelecionado : planoVipSelecionado
  const setValorSelecionadoAtual = tipoPlano === 'padrao' ? setPlanoPadraoSelecionado : setPlanoVipSelecionado

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 flex justify-center items-start">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* CABECALHO */}
        <div className={`p-8 text-center transition-colors duration-500 ${tipoPlano === 'vip' ? 'bg-amber-600' : 'bg-emerald-700'}`}>
          <h1 className="text-3xl font-serif font-bold text-white">Escolha seu Plano</h1>
          <p className={tipoPlano === 'vip' ? 'text-amber-100' : 'text-emerald-100'}>
            Selecione a melhor estrategia de visibilidade para o seu produto.
          </p>
        </div>

        {/* TABS (ABAS) */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => setTipoPlano('padrao')}
            className={`flex-1 py-4 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all ${
              tipoPlano === 'padrao' 
                ? 'bg-white text-emerald-700 border-b-2 border-emerald-700' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="text-xl">🏪</span>
            Anuncio Padrao
          </button>
          <button
            onClick={() => setTipoPlano('vip')}
            className={`flex-1 py-4 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all ${
              tipoPlano === 'vip' 
                ? 'bg-white text-amber-600 border-b-2 border-amber-600' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="text-xl">👑</span>
            Destaque VIP Premium
          </button>
        </div>

        {/* INFORMATIVO DO TIPO DE PLANO */}
        <div className="px-8 pt-6 pb-2">
           {tipoPlano === 'padrao' ? (
             <p className="text-sm text-slate-600 text-center">
               O Plano Padrao exibe seu e-book na grade principal da nossa vitrine, organizado por ordem de chegada.
             </p>
           ) : (
             <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-center">
                <p className="text-sm font-bold text-amber-800 flex items-center justify-center gap-1 mb-1">
                  👑 Vantagem Exclusiva
                </p>
                <p className="text-xs text-amber-700">
                  O Plano VIP fixa seu anuncio no topo da pagina dentro do <strong>Carrossel de Destaques</strong>, alem de tambem aparecer na grade principal.
                </p>
             </div>
           )}
        </div>

        {/* LISTA DE PLANOS */}
        <div className="p-8 pt-4 space-y-6">
          <div className="grid gap-4">
            {planosExibidos.map((p) => (
              <label 
                key={p.id} 
                className={`relative flex cursor-pointer items-center justify-between rounded-xl border p-5 transition-all ${
                  valorSelecionadoAtual === p.id 
                    ? tipoPlano === 'vip' 
                        ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-500 shadow-sm' 
                        : 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <input 
                    type="radio" 
                    name={`plano_${tipoPlano}`} 
                    value={p.id} 
                    checked={valorSelecionadoAtual === p.id} 
                    onChange={(e) => setValorSelecionadoAtual(e.target.value)} 
                    className={`size-5 border-slate-300 ${tipoPlano === 'vip' ? 'text-amber-600 focus:ring-amber-600' : 'text-emerald-600 focus:ring-emerald-600'}`}
                  />
                  <div>
                    <span className="block font-bold text-slate-900 text-lg">{p.nome}</span>
                    <span className="block text-sm text-slate-500">{p.detalhe}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`block font-black text-2xl ${tipoPlano === 'vip' ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {p.valor}
                  </span>
                </div>
                {p.destaque && (
                  <span className={`absolute -top-3 right-6 rounded-full px-3 py-1 text-xs font-bold tracking-wider text-white uppercase shadow-md ${tipoPlano === 'vip' ? 'bg-amber-600' : 'bg-blue-900'}`}>
                    Recomendado
                  </span>
                )}
              </label>
            ))}
          </div>

          {/* BOTAO DE FINALIZAR */}
          <div className="pt-4 border-t border-slate-100">
            <button 
              onClick={handleFinalizar}
              disabled={loading || !anuncioId} 
              className={`w-full text-white p-4 rounded-xl disabled:opacity-50 transition-colors font-bold text-xl shadow-lg flex items-center justify-center gap-2 ${
                tipoPlano === 'vip' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {loading ? 'Processando...' : 'Finalizar e Ativar Plano'}
            </button>
            <p className="text-sm text-center text-slate-500 mt-4">
              Ao clicar, voce sera direcionado ao nosso atendimento seguro pelo WhatsApp para concluir a ativacao.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}