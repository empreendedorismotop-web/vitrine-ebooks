'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const PLANOS = [
  { id: '1_mes', nome: '1 Mês', valor: 'R$ 19,90', detalhe: 'Plano inicial' },
  { id: '2_meses', nome: '2 Meses', valor: 'R$ 37,90', detalhe: 'R$ 18,95 / mês' },
  { id: '3_meses', nome: '3 Meses', valor: 'R$ 54,90', detalhe: 'R$ 18,30 / mês' },
  { id: '6_meses', nome: '6 Meses', valor: 'R$ 99,90', detalhe: 'R$ 16,65 / mês', destaque: true },
  { id: '12_meses', nome: '12 Meses', valor: 'R$ 179,90', detalhe: 'R$ 14,99 / mês - Maior desconto' }
]

export default function PlanosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [anuncioId, setAnuncioId] = useState<string | null>(null) // Armazena o ID exato do anúncio
  const [tituloOferta, setTituloOferta] = useState('')
  const [planoSelecionado, setPlanoSelecionado] = useState('6_meses')

  useEffect(() => {
    const carregarDados = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || !session.user.email) {
        router.push('/login')
        return
      }

      // Busca O ÚLTIMO anúncio criado por este e-mail
      const { data, error } = await supabase
        .from('profiles')
        .select('id, titulo_ebook')
        .eq('email', session.user.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        setAnuncioId(data.id)
        setTituloOferta(data.titulo_ebook || 'Meu Anúncio')
      } else if (error) {
        console.error("Erro ao buscar anúncio:", error)
      }
    }
    carregarDados()
  }, [router])

  const handleFinalizar = async () => {
    setLoading(true)

    // Se não encontrou o anúncio, não deixa prosseguir
    if (!anuncioId) {
      alert("Erro: Não foi possível localizar seu anúncio recente. Tente novamente.")
      setLoading(false)
      return
    }

    // Atualiza o plano escolhido no banco de dados para ESTE anúncio específico
    await supabase
      .from('profiles')
      .update({ plano_selecionado: planoSelecionado })
      .eq('id', anuncioId)

    const planoNome = PLANOS.find(p => p.id === planoSelecionado)?.nome
    
    // Dispara para o WhatsApp
    const SEU_NUMERO_WHATSAPP = "5561982096982"
    const textoWhats = `Olá! Acabei de cadastrar minha oferta "${tituloOferta}" e escolhi o plano de ${planoNome}. Como faço o pagamento para ativar meu anúncio?`
    
    window.location.href = `https://wa.me/${SEU_NUMERO_WHATSAPP}?text=${encodeURIComponent(textoWhats)}`
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 flex justify-center items-start">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        
        <div className="bg-emerald-700 p-8 text-center">
          <h1 className="text-3xl font-serif font-bold text-white">Escolha seu Plano</h1>
          <p className="text-emerald-100 mt-2">Selecione o tempo de exibição e ative seu anúncio na vitrine.</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid gap-4">
            {PLANOS.map((p) => (
              <label 
                key={p.id} 
                className={`relative flex cursor-pointer items-center justify-between rounded-xl border p-5 transition-all ${
                  planoSelecionado === p.id 
                    ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600 shadow-sm' 
                    : 'border-slate-200 bg-white hover:border-emerald-600/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <input 
                    type="radio" 
                    name="plano" 
                    value={p.id} 
                    checked={planoSelecionado === p.id} 
                    onChange={(e) => setPlanoSelecionado(e.target.value)} 
                    className="size-5 text-emerald-600 focus:ring-emerald-600 border-slate-300"
                  />
                  <div>
                    <span className="block font-bold text-slate-900 text-lg">{p.nome}</span>
                    <span className="block text-sm text-slate-500">{p.detalhe}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block font-black text-2xl text-emerald-700">{p.valor}</span>
                </div>
                {p.destaque && (
                  <span className="absolute -top-3 right-6 rounded-full bg-blue-900 px-3 py-1 text-xs font-bold tracking-wider text-white uppercase shadow-md">
                    Recomendado
                  </span>
                )}
              </label>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button 
              onClick={handleFinalizar}
              disabled={loading || !anuncioId} 
              className="w-full bg-emerald-600 text-white p-4 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors font-bold text-xl shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? 'Processando...' : 'Finalizar Pagamento'}
            </button>
            <p className="text-sm text-center text-slate-500 mt-4">
              Ao clicar em finalizar, você será direcionado ao nosso atendimento seguro pelo WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}