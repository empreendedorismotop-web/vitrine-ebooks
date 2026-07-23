import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import nodemailer from 'nodemailer'

export async function GET(request: Request) {
  // 0. SEGURANÇA DUPLA
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET

  if (secret) {
    const isAuthorized = (authHeader === `Bearer ${secret}`) || (key === secret)
    if (!isAuthorized) {
      return new NextResponse('Não autorizado', { status: 401 })
    }
  }

  try {
    // 1. HORÁRIO ATUAL EXATO (Sem subtrair horas, pois o banco já entende UTC)
    const limiteHorario = new Date();

    // 2. BUSCA NA FILA
    const { data: fila, error: erroFila } = await supabase
      .from('fila_envios')
      .select('*')
      .eq('status', 'pendente')
      .lte('agendado_para', limiteHorario.toISOString())
      .limit(15); 

    if (erroFila) throw erroFila;
    
    if (!fila || fila.length === 0) {
      return NextResponse.json({ sucesso: true, mensagem: 'Fila vazia. Nenhum e-mail pendente no momento exato.' })
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_SENHA
      }
    });

    let emailsEnviados = 0;
    const idsParaAtualizarSucesso: string[] = [];
    const idsParaAtualizarErro: string[] = [];

    // 3. PROCESSAMENTO E DISPARO
    for (const item of fila) {
      try {
        const destinatario = item.email || item.email_destino; 
        const assuntoEmail = item.assunto || 'Atualização da Vitrine';
        const nomeCliente = item.nome || 'Cliente';
        const textoCru = item.mensagem || '';

        if (!destinatario) {
          idsParaAtualizarErro.push(item.id); 
          continue; 
        }

        // ==========================================
        // CORREÇÃO DO BOTÃO: INTELIGENTE E SEGURO
        // ==========================================
        let htmlBotao = '';
        
        // Só constrói o bloco do botão se realmente existir um link salvo no banco
        if (item.url_botao && item.url_botao.trim() !== '') {
          
          // Usando o link direto para evitar bloqueios do Gmail por causa de localhost
          const linkSeguro = item.url_botao;
          
          htmlBotao = `
            <div style="text-align: center; margin-top: 30px;">
                <a href="${linkSeguro}" target="_blank" style="display: inline-block; background-color: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                    ${item.texto_botao || 'Acessar Minha Oferta'}
                </a>
            </div>
          `;
        }

        const htmlMensagem = `
          <div style="font-family: sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
              <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-bottom: 1px solid #e2e8f0;">
                  <h2 style="color: #1e3a8a; margin: 0; font-size: 20px;">Vitrine E-books & Cursos</h2>
              </div>
              <div style="padding: 30px;">
                  <p style="font-size: 16px; margin-bottom: 20px;">Olá, <strong>${nomeCliente}</strong>!</p>
                  
                  <div style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 30px;">
                      ${textoCru}
                  </div>
                  
                  <!-- O BOTÃO SÓ VAI APARECER AQUI SE TIVER LINK -->
                  ${htmlBotao}
                  
              </div>
          </div>
        `;

        await transporter.sendMail({
          from: `"Equipe Vitrine" <${process.env.GMAIL_EMAIL}>`,
          to: destinatario,
          subject: assuntoEmail,
          html: htmlMensagem
        });
        
        emailsEnviados++;
        idsParaAtualizarSucesso.push(item.id);
      } catch (err) {
        console.error(`Erro ao disparar item ${item.id}:`, err);
        idsParaAtualizarErro.push(item.id);
      }
    }

    // 4. ATUALIZAÇÃO DE STATUS NO BANCO
    if (idsParaAtualizarSucesso.length > 0) {
      await supabase
        .from('fila_envios')
        .update({ status: 'enviado' })
        .in('id', idsParaAtualizarSucesso);
    }

    if (idsParaAtualizarErro.length > 0) {
      await supabase
        .from('fila_envios')
        .update({ status: 'erro' })
        .in('id', idsParaAtualizarErro);
    }

    return NextResponse.json({ 
      sucesso: true, 
      relatorio: {
        disparados_e_atualizados: emailsEnviados
      }
    })

  } catch (error: any) {
    return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 })
  }
}