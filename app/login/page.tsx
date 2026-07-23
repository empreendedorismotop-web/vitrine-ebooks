'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMensagem('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

    if (error) {
      setMensagem('Erro ao entrar: E-mail ou senha incorretos.')
      setLoading(false)
      return
    }

    if (data.user?.email === 'josevg10@gmail.com') {
      router.push('/admin')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border-t-4 border-emerald-600">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-slate-900">Acesso à Plataforma</h1>
          <p className="text-sm text-slate-600 mt-2">Entre para gerenciar seu anúncio e planos.</p>
        </div>

        {mensagem && (
          <div className="mb-6 p-3 text-center rounded-lg bg-red-100 text-red-700 text-sm font-medium">
            {mensagem}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">E-mail</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="block w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition-all" 
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-slate-900">Senha</label>
              {/* O NOVO LINK DE ESQUECI A SENHA VEM AQUI */}
              <Link href="/recuperar-senha" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                Esqueceu a senha?
              </Link>
            </div>
            <input 
              type="password" 
              required 
              value={senha} 
              onChange={(e) => setSenha(e.target.value)} 
              className="block w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition-all" 
              placeholder="Sua senha"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-emerald-600 text-white p-3.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors font-bold text-lg mt-4 shadow-md"
          >
            {loading ? 'Entrando...' : 'Entrar na Conta'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500">
          Ainda não tem conta?{' '}
          <Link href="/cadastro" className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
            Cadastre-se aqui
          </Link>
        </div>

      </div>
    </div>
  )
}