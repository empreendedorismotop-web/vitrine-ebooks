'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch('/api/recuperar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email,
          origin: window.location.origin // O pulo do gato: enviamos o link real do site
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || 'Falha de comunicação com o servidor. Tente novamente.')
      }

      setMessage('Pronto! O link de recuperação foi enviado para o seu e-mail de forma segura.')
      setEmail('')
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SiteHeader />
      
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 pt-20">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          
          <h1 className="font-serif text-2xl font-bold text-slate-900 mb-6 text-center">
            Recuperar Senha
          </h1>

          <p className="mb-6 text-sm leading-relaxed text-slate-600 text-center text-pretty">
            Digite o e-mail associado à sua conta na vitrine. Enviaremos um link seguro via e-mail para você cadastrar uma nova senha.
          </p>

          <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
            
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 leading-relaxed">
                <span className="font-bold block mb-1">Detalhe do Erro:</span>
                {error}
              </div>
            )}
            
            {message && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 leading-relaxed">
                {message}
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-700">
                Seu E-mail
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 p-3.5 outline-none transition-all focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                placeholder="exemplo@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="mt-2 w-full rounded-xl bg-slate-900 px-4 py-3.5 font-bold text-white transition-all hover:bg-slate-800 hover:shadow-md disabled:opacity-70 disabled:hover:shadow-none"
            >
              {loading ? 'Disparando e-mail...' : 'Enviar Link de Recuperação'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-600">
            Lembrou a senha?{' '}
            <Link href="/login" className="font-bold text-slate-900 hover:underline transition-all">
              Voltar para o Login
            </Link>
          </div>
          
        </div>
      </main>

      <SiteFooter />
    </>
  )
}