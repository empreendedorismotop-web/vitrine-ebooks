'use client'

import { useState, useEffect } from 'react'
import { BellRing, Loader2, Gift } from 'lucide-react'

// Função padrão do Google para converter a chave VAPID
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function BannerPush() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        setRegistration(reg)
        reg.pushManager.getSubscription().then(sub => {
          if (sub) setIsSubscribed(true)
          setLoading(false)
        })
      }).catch(err => {
        console.error('Erro ao registrar SW: ', err)
        setLoading(false)
      })
    } else {
       setLoading(false)
    }
  }, [])

  const assinarNotificacoes = async () => {
    setLoading(true)
    try {
      const result = await Notification.requestPermission()
      if (result === 'granted' && registration) {
        const applicationServerKey = urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey
        })
        
        // Envia para nossa API gravar no Supabase
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub)
        })
        
        setIsSubscribed(true)
        alert("🎉 Inscrição confirmada! Fique de olho nas notificações para receber seus bônus.")
      } else {
         alert("Você bloqueou as notificações. Altere no cadeado ao lado da URL (barra de endereços) para permitir.")
      }
    } catch (error) {
      console.error(error)
      alert("Erro ao tentar assinar. Verifique sua conexão.")
    }
    setLoading(false)
  }

  // 💡 O Pulo do Gato: Se a pessoa já se inscreveu, não mostramos o banner!
  if (isSubscribed) return null;

  return (
    <div className="w-full max-w-[1200px] mx-auto my-12 px-4">
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl shadow-xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
         
         {/* Efeito de brilho no fundo */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

         <div className="flex-1 text-center md:text-left relative z-10">
           <div className="inline-flex items-center gap-2 bg-orange-600/50 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-orange-400/50">
              <Gift className="size-4" /> Presente Exclusivo
           </div>
           <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-3 leading-tight">
              Quero receber novidades e e-books grátis!
           </h2>
           <p className="text-orange-50 md:text-lg">
              Ative as notificações no seu navegador para baixar nossos materiais exclusivos.
           </p>
         </div>

         <div className="shrink-0 relative z-10 w-full md:w-auto">
           <button 
             onClick={assinarNotificacoes}
             disabled={loading}
             className="w-full md:w-auto bg-white text-orange-600 hover:bg-slate-20 font-bold text-lg px-8 py-4 rounded-xl shadow-lg transition-transform hover:-translate-y-1 flex items-center justify-center gap-3 disabled:opacity-80"
           >
             {loading ? <Loader2 className="size-5 animate-spin" /> : <BellRing className="size-5" />}
             {loading ? 'Preparando...' : 'Sim, Quero Receber!'}
           </button>
           <p className="text-orange-100 text-[11px] text-center mt-3 font-medium">Você pode cancelar quando quiser.</p>
         </div>
      </div>
    </div>
  )
}