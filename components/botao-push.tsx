'use client'

import { useState, useEffect } from 'react'
import { Bell, BellRing, Loader2 } from 'lucide-react'

// Função padrão do Google para converter a sua Chave Pública (VAPID)
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

export function BotaoPush() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Registra o Robô Invisível (Service Worker) assim que a página carrega
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        setRegistration(reg)
        reg.pushManager.getSubscription().then(sub => {
          if (sub) setIsSubscribed(true)
          setLoading(false)
        })
      }).catch(err => {
        console.error('Erro ao registrar o Service Worker: ', err)
        setLoading(false)
      })
    } else {
       setLoading(false)
    }
  }, [])

  const assinarNotificacoes = async () => {
    setLoading(true)
    try {
      // 2. Pede permissão ao usuário
      const result = await Notification.requestPermission()
      
      if (result === 'granted' && registration) {
        // 3. Pega a sua chave de segurança do arquivo .env.local
        const applicationServerKey = urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
        
        // 4. Cria a assinatura no navegador do usuário
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey
        })

        // 5. Envia para a nossa Rota de API salvar no Supabase
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub)
        })

        setIsSubscribed(true)
        alert("🎉 Maravilha! Notificações ativadas com sucesso!")
      } else {
         alert("Você bloqueou as notificações no seu navegador.")
      }
    } catch (error) {
      console.error(error)
      alert("Erro ao tentar assinar. Verifique sua conexão.")
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <button disabled className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-400 rounded-lg text-sm font-bold">
         <Loader2 className="size-4 animate-spin" /> Carregando...
      </button>
    )
  }

  if (isSubscribed) {
    return (
      <button disabled className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-bold border border-emerald-200 transition-colors shadow-sm cursor-default">
         <BellRing className="size-4" /> Alertas Ativados
      </button>
    )
  }

  return (
    <button onClick={assinarNotificacoes} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-sm font-bold transition-colors shadow-md">
       <Bell className="size-4" /> Ativar Alertas
    </button>
  )
}