'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function ExitPopup({ tipoSegmento }) {
  const [config, setConfig] = useState(null)
  const [visivel, setVisivel] = useState(false)
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [enviado, setEnviado] = useState(false)

  useEffect(() => {
    // 1. Busca a configuração do popup no Supabase
    async function carregarConfig() {
      const { data } = await supabase
        .from('popup_configs')
        .select('*')
        .eq('segmento', tipoSegmento)
        .single()
      
      if (data) setConfig(data)
    }
    carregarConfig()

    // 2. Lógica de exibição (Timer + Exit Intent)
    const jaFechou = sessionStorage.getItem('popup_fechado')
    if (jaFechou) return

    const timer = setTimeout(() => setVisivel(true), 5000)

    const handleMouseLeave = (e) => {
      if (e.clientY <= 0) {
        setVisivel(true)
        document.removeEventListener('mouseleave', handleMouseLeave)
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)
    
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [tipoSegmento])

  const fecharPopup = () => {
    setVisivel(false)
    sessionStorage.setItem('popup_fechado', 'true')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const res = await fetch('/api/leads/capturar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, whatsapp, segmento: tipoSegmento })
    })

    if (res.ok) {
      setEnviado(true)
      setTimeout(fecharPopup, 4000)
    }
  }

  // Só mostra se estiver visível E a config tiver sido carregada
  if (!visivel || !config) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 relative shadow-2xl">
        <button 
          onClick={fecharPopup}
          className="absolute top-3 right-3 text-gray-400 hover:text-black font-bold text-lg"
        >
          ✕
        </button>

        {!enviado ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Imagem dinâmica da capa */}
            {config.imagem_url && (
              <img src={config.imagem_url} alt="Capa E-book" className="w-full rounded-lg mb-2 shadow-sm" />
            )}
            
            <h3 className="text-xl font-bold text-gray-900">
              {config.titulo}
            </h3>
            <p className="text-sm text-gray-600">
              {config.subtitulo}
            </p>
            
            <input 
              type="email" 
              required
              placeholder="Seu melhor e-mail" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />

            <input 
              type="text" 
              required
              placeholder="Seu WhatsApp (com DDD)" 
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />

            <button 
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded-lg transition"
            >
              {config.botao_texto}
            </button>
          </form>
        ) : (
          <div className="text-center py-6 space-y-2">
            <h4 className="text-2xl font-bold text-green-600">Tudo pronto! 🎉</h4>
            <p className="text-sm text-gray-600">O material foi enviado para o seu e-mail.</p>
          </div>
        )}
      </div>
    </div>
  )
}