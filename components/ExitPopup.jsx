'use client'
import { useState, useEffect } from 'react'

export default function ExitPopup({ tipoSegmento }) {
  const [visivel, setVisivel] = useState(false)
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [enviado, setEnviado] = useState(false)

  useEffect(() => {
    const jaFechou = sessionStorage.getItem('popup_fechado')
    if (jaFechou) return

    const handleMouseLeave = (e) => {
      if (e.clientY <= 0) {
        setVisivel(true)
        document.removeEventListener('mouseleave', handleMouseLeave)
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)
    return () => document.removeEventListener('mouseleave', handleMouseLeave)
  }, [])

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

  if (!visivel) return null

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
            <h3 className="text-xl font-bold text-gray-900">
              {tipoSegmento === 'leitor' ? '📚 Leve seu E-book Grátis!' : '🚀 Guia Exclusivo para Anunciantes'}
            </h3>
            <p className="text-sm text-gray-600">
              {tipoSegmento === 'leitor' 
                ? 'Preencha seus dados para receber o e-book selecionado no seu e-mail.' 
                : 'Insira seus dados para receber o manual de estratégias de anúncios.'}
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
              Receber E-book Agora!
            </button>
          </form>
        ) : (
          <div className="text-center py-6 space-y-2">
            <h4 className="text-2xl font-bold text-green-600">Tudo pronto! 🎉</h4>
            <p className="text-sm text-gray-600">O e-book foi enviado para o seu e-mail.</p>
          </div>
        )}
      </div>
    </div>
  )
}