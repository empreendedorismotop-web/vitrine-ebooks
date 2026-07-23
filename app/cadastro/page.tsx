'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function CadastroPage() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const router = useRouter()

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMensagem('')

    // 1. Tenta criar a conta
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: senha,
    })

    if (authError) {
      setMensagem(`Erro: ${authError.message}`)
      setLoading(false)
      return
    }

    // 2. Se a sessão não foi criada automaticamente, força o login
    if (!authData.session) {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      })
      
      if (loginError) {
        setMensagem('Este e-mail já está cadastrado ou a senha está incorreta.')
        setLoading(false)
        return
      }
    }

    // Pega o ID do usuário
    const userId = authData.user?.id || (await supabase.auth.getUser()).data.user?.id

    if (userId) {
      // 3. Salva os dados do perfil com o STATUS PENDENTE obrigatório
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([{ 
          id: userId, 
          nome, 
          email, 
          whatsapp,
          status: 'pendente' 
        }])

      if (profileError) {
        setMensagem('Conta criada, mas houve um erro ao salvar o perfil.')
        setLoading(false)
      } else {
        
        // 4. Gatilho do E-mail Automático (Motor via Gmail)
        fetch('/api/enviar-lembrete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email, 
            nome, 
            titulo: '', 
            plano: '' 
          })
        }).catch(err => console.error('Erro silencioso ao enviar e-mail:', err))

        // REDIRECIONAMENTO ESTRATÉGICO: Manda para o Painel para ele ter o trabalho de cadastrar a capa e o título primeiro!
        router.push('/dashboard')
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border-t-4 border-emerald-600">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-slate-900">Anuncie seu E-book ou Curso</h1>
          <p className="text-sm text-slate-600 mt-2">Crie sua conta de autor ou produtor para começar a divulgar sua oferta.</p>
        </div>

        {mensagem && (
          <div className="mb-6 p-3 text-center rounded-lg bg-red-100 text-red-700 text-sm font-medium">
            {mensagem}
          </div>
        )}

        <form onSubmit={handleCadastro} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">Nome do Autor / Produtor</label>
            <input 
              type="text" 
              required 
              value={nome} 
              onChange={(e) => setNome(e.target.value)} 
              className="block w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition-all" 
              placeholder="Como você assina sua obra"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">WhatsApp</label>
            <input 
              type="text" 
              required 
              value={whatsapp} 
              onChange={(e) => setWhatsapp(e.target.value)} 
              className="block w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition-all" 
              placeholder="(00) 00000-0000"
            />
          </div>
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
            <label className="block text-sm font-medium text-slate-900 mb-1">Senha</label>
            <input 
              type="password" 
              required 
              value={senha} 
              onChange={(e) => setSenha(e.target.value)} 
              className="block w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition-all" 
              placeholder="Crie uma senha segura"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-emerald-600 text-white p-3.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors font-bold text-lg mt-4 shadow-md"
          >
            {loading ? 'Criando Conta...' : 'Criar Conta e Cadastrar E-book'}
          </button>
        </form>

      </div>
    </div>
  )
}