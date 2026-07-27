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

// Valores ajustados para testar uma melhor taxa de conversao
const PLANOS_VIP = [
  { id: 'vip_1_mes', nome: '1 Mes VIP', valor: 'R$ 39,90', detalhe: 'Carrossel + Vitrine' },
  { id: 'vip_3_meses', nome: '3 Meses VIP', valor: 'R$ 99,90', detalhe: 'R$ 33,30 / mes' },
  { id: 'vip_6_meses', nome: '6 Meses VIP', valor: 'R$ 179,90', detalhe: 'R$ 29,98 / mes', destaque: true },
  { id: 'vip_12_meses', nome: '12 Meses VIP', valor: 'R$ 299,90', detalhe: 'R$ 24,99 / mes - Dominancia Total' }
]

export default function PlanosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [anuncioId, setAnuncioId] = useState<string | null>(null)
  const [tituloOferta, setTituloOferta] = useState('')
  
  // Controle Unificado de Selecao
  const [planoSelecionado, setPlanoSelecionado] = useState('padrao_6_meses')

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

    // Identifica o plano escolhido buscando nas duas listas
    const planoEscolhido = PLANOS_PADRAO.find(p => p.id === planoSelecionado) || PLANOS_VIP.find(p => p.id === planoSelecionado)
    const isVip = PLANOS_VIP.some(p => p.id === planoSelecionado)

    // Atualiza no banco
    await supabase
      .from('profiles')
      .update({ plano_selecionado: planoSelecionado })
      .eq('id', anuncioId)
    
    // Texto Dinamico para o WhatsApp
    const SEU_NUMERO_WHATSAPP = "5561982096982"
    const tipoTexto = isVip ? "👑 PLANO VIP PREMIUM" : "📦 PLANO PADRAO"
    const textoWhats = `Ola! Acabei de cadastrar minha oferta "${tituloOferta}".\n\nEscolhi o *${tipoTexto}* de *${planoEscolhido?.nome}* no valor de *${planoEscolhido?.valor}*.\n\nComo faco o pagamento para ativar meu anuncio?`
    
    window.location.href = `https://wa.me/${SEU_NUMERO_WHATSAPP}?text=${encodeURIComponent(textoWhats)}`
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 flex justify-center items-start">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* CABECALHO GLOBAL */}
        <div className="p-10 text-center bg-slate-900">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">Escolha sua Estrategia</h1>
          <p className="text-slate-300 text-lg">
            Compare os planos abaixo e selecione a melhor visibilidade para o seu produto.
          </p>
        </div>

        {/* CONTAINER DOS PLANOS (Lado a Lado no Desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:divide-x divide-y md:divide-y-0 divide-slate-100">
          
          {/* COLUNA: PLANO PADRAO */}
          <div className="p-6 md:p-8 bg-white">
            <div className="mb-6 text-center">
               <span className="inline-block text-4xl mb-3">🏪</span>
               <h2 className="text-2xl font-bold text-emerald-800">Anuncio Padrao</h2>
               <p className="text-sm text-slate-500 mt-2">
                 Seu e-book exibido na grade principal da vitrine, organizado por ordem de chegada.
               </p>
            </div>
            
            <div className="space-y-4">
              {PLANOS_PADRAO.map((p) => (
                <label 
                  key={p.id} 
                  className={`relative flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                    planoSelecionado === p.id 
                      ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="plano_selecionado" 
                      value={p.id} 
                      checked={planoSelecionado === p.id} 
                      onChange={(e) => setPlanoSelecionado(e.target.value)} 
                      className="size-5 border-slate-300 text-emerald-600 focus:ring-emerald-600"
                    />
                    <div>
                      <span className="block font-bold text-slate-900">{p.nome}</span>
                      <span className="block text-xs text-slate-500">{p.detalhe}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block font-black text-xl text-emerald-700">
                      {p.valor}
                    </span>
                  </div>
                  {p.destaque && (
                    <span className="absolute -top-3 right-4 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase shadow-sm bg-slate-800">
                      Mais Popular
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* COLUNA: PLANO VIP */}
          <div className="p-6 md:p-8 bg-amber-50/30">
            <div className="mb-6 text-center">
               <span className="inline-block text-4xl mb-3">👑</span>
               <h2 className="text-2xl font-bold text-amber-700">Destaque VIP Premium</h2>
               <p className="text-sm text-slate-600 mt-2">
                 Seu anuncio fixado no topo da pagina dentro do <strong className="text-amber-800">Carrossel de Destaques</strong>.
               </p>
            </div>
            
            <div className="space-y-4">
              {PLANOS_VIP.map((p) => (
                <label 
                  key={p.id} 
                  className={`relative flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                    planoSelecionado === p.id 
                      ? 'border-amber-500 bg-amber-100 ring-2 ring-amber-500 shadow-sm' 
                      : 'border-amber-200 bg-white hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="plano_selecionado" 
                      value={p.id} 
                      checked={planoSelecionado === p.id} 
                      onChange={(e) => setPlanoSelecionado(e.target.value)} 
                      className="size-5 border-amber-300 text-amber-600 focus:ring-amber-600"
                    />
                    <div>
                      <span className="block font-bold text-slate-900">{p.nome}</span>
                      <span className="block text-xs text-slate-500">{p.detalhe}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block font-black text-xl text-amber-700">
                      {p.valor}
                    </span>
                  </div>
                  {p.destaque && (
                    <span className="absolute -top-3 right-4 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase shadow-sm bg-amber-600">
                      Recomendado
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>

        </div>

        {/* RODAPE E BOTAO DE FINALIZAR */}
        <div className="p-8 border-t border-slate-200 bg-slate-50">
          <div className="max-w-lg mx-auto">
            <button 
              onClick={handleFinalizar}
              disabled={loading || !anuncioId} 
              className={`w-full text-white py-4 px-6 rounded-xl disabled:opacity-50 transition-all font-bold text-xl shadow-lg flex items-center justify-center gap-2 ${
                PLANOS_VIP.some(p => p.id === planoSelecionado) 
                  ? 'bg-amber-600 hover:bg-amber-700 hover:-translate-y-1' 
                  : 'bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-1'
              }`}
            >
              {loading ? 'Processando...' : 'Finalizar e Ativar Plano Escolhido'}
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