import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import nodemailer from 'nodemailer'

export async function GET(request: Request) {
  // SEGURANÇA: Validação estrita do Token
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Não autorizado: Token Cron Inválido', { status: 401 })
  }

  try {
    const hoje = new Date()

    // =========================================================================
    // TAREFA 1: PAUSAR INADIMPLENTES (Atraso maior que 3 dias)
    // =========================================================================
    const dataLimitePausa = new Date()
    dataLimitePausa.setDate(hoje.getDate() - 3) 
    const dataLimiteIso = dataLimitePausa.toISOString()

    const { data: clientesPausar, error: erroBuscaPausa } = await supabase
      .from('profiles')
      .select('id, nome')
      .eq('status', 'ativo')
      .lt('data_expiracao', dataLimiteIso)

    if (erroBuscaPausa) throw erroBuscaPausa;

    let totalPausados = 0
    if (clientesPausar && clientesPausar.length > 0) {
      const idsPausar = clientesPausar.map(c => c.id)
      
      const { error: erroPausa } = await supabase
        .from('profiles')
        .update({ status: 'inativo' })
        .in('id', idsPausar)

      if (!erroPausa) totalPausados = idsPausar.length
    }

    // =========================================================================
    // TAREFA 2: AVISO DE VENCIMENTO HOJE (Com Trava de Segurança)
    // =========================================================================
    const inicioHoje = new Date(hoje.setHours(0, 0, 0, 0)).toISOString()
    const fimHoje = new Date(hoje.setHours(23, 59, 59, 999)).toISOString()

    const { data: clientesVencendo, error: erroVencimento } = await supabase
      .from('profiles')
      .select('id, nome, email, titulo_ebook')
      .eq('status', 'ativo')
      .gte('data_expiracao', inicioHoje)
      .lte('data_expiracao', fimHoje)
      .eq('aviso_vencimento_enviado', false)

    if (erroVencimento) throw erroVencimento;

    let totalAvisados = 0
    if (clientesVencendo && clientesVencendo.length > 0) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_EMAIL,
          pass: process.env.GMAIL_SENHA
        }
      })

      for (const cliente of clientesVencendo) {
        if (!cliente.email) continue;

        const htmlMensagem = `
          <div style="font-family: sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
              <div style="background-color: #fef3c7; padding: 20px; text-align: center; border-bottom: 1px solid #fde68a;">
                  <h2 style="color: #92400e; margin: 0;">Aviso de Vencimento ⚠️</h2>
              </div>
              <div style="padding: 30px;">
                  <p style="font-size: 16px;">Olá, <strong>${cliente.nome}</strong>!</p>
                  <p style="font-size: 15px; line-height: 1.6; color: #475569;">
                      Sua assinatura para o destaque do material <strong>"${cliente.titulo_ebook || 'seu e-book'}"</strong> na nossa Vitrine Digital vence hoje.
                  </p>
                  <p style="font-size: 15px; line-height: 1.6; color: #475569;">
                      Para manter seu material ativo recebendo cliques e vendas sem interrupções, realize a renovação do seu plano. Caso o plano não seja renovado, o anúncio será pausado automaticamente em 3 dias.
                  </p>
                  <div style="text-align: center; margin-top: 30px;">
                      <a href="https://wa.me/5561982096982?text=Ol%C3%A1!%20Gostaria%20de%20renovar%20meu%20plano%20na%20Vitrine." style="display: inline-block; background-color: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                          Renovar Meu Plano Agora
                      </a>
                  </div>
              </div>
          </div>
        `
        try {
          await transporter.sendMail({
            from: `"Equipe Vitrine" <${process.env.GMAIL_EMAIL}>`,
            to: cliente.email,
            subject: 'Sua assinatura na Vitrine vence hoje!',
            html: htmlMensagem
          })

          await supabase
            .from('profiles')
            .update({ aviso_vencimento_enviado: true })
            .eq('id', cliente.id)

          totalAvisados++
        } catch (mailError) {
          console.error(`Falha ao enviar aviso para ${cliente.email}:`, mailError)
        }
      }
    }

    // =========================================================================
    // TAREFA 3: RESETAR ETIQUETA DE QUEM JÁ RENOVOU (Automação de Limpeza)
    // =========================================================================
    
    // Busca todos que têm data de expiração no futuro, mas estão marcados como TRUE
    const { error: erroReset } = await supabase
      .from('profiles')
      .update({ aviso_vencimento_enviado: false })
      .gt('data_expiracao', fimHoje)
      .eq('aviso_vencimento_enviado', true)

    if (erroReset) {
      console.error('Erro ao resetar avisos antigos:', erroReset)
    }

    return NextResponse.json({ 
      sucesso: true, 
      relatorio: {
        clientes_pausados: totalPausados, 
        avisos_enviados: totalAvisados,
        data_execucao: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('Erro crítico no Cron de Assinaturas:', error)
    return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 })
  }
}