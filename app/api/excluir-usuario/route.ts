import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Conectamos com a chave de Administrador para ter acesso ao Cofre
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
)

export async function DELETE(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      throw new Error('O ID do usuário é obrigatório.')
    }

    // Este é o comando poderoso que apaga o e-mail e a senha do Supabase de vez
    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Usuário excluído definitivamente!' })

  } catch (error: any) {
    console.error('Erro ao excluir usuário no Supabase:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}