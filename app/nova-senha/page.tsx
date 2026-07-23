'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function NovaSenhaPage() {
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const router = useRouter()

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMensagem('')
    setErro('')

    // A função updateUser troca a senha do usuário que acabou de clicar no link de recuperação
    const { error } = await supabase.auth.updateUser({
      password: senha
    })

    if (error) {
      setErro('Ocorreu um erro ao atualizar a senha. O link pode ter expirado.')
      setLoading(false)
      return
    }

    setMensagem('Sua senha foi atualizada com sucesso!')
    setLoading(false)
    
    // Manda para o dashboard após um breve momento
    setTimeout(() => {
      router.push('/dashboard')
    }, 2000)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border-t-4 border-emerald-600">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-slate-900">Nova Senha</h1>
          <p className="text-sm text-slate-600 mt-2">Crie uma nova senha de acesso para sua conta.</p>
        </div>

        {erro && (
          <div className="mb-6 p-3 text-center rounded-lg bg-red-100 text-red-700 text-sm font-medium">
            {erro}
          </div>
        )}

        {mensagem && (
          <div className="mb-6 p-3 text-center rounded-lg bg-emerald-100 text-emerald-700 text-sm font-medium">
            {mensagem}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">Digite a nova senha</label>
            <input 
              type="password" 
              required 
              value={senha} 
              onChange={(e) => setSenha(e.target.value)} 
              className="block w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:ring-2 focus:ring-emerald-600 outline-none transition-all" 
              placeholder="Mínimo de 6 caracteres"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading || senha.length < 6} 
            className="w-full bg-emerald-600 text-white p-3.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors font-bold text-lg mt-4 shadow-md"
          >
            {loading ? 'Salvando...' : 'Atualizar Senha e Entrar'}
          </button>
        </form>

      </div>
    </div>
  )
}