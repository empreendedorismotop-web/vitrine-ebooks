import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

// =====================================================================
// 1. CONEXÃO SEGURA PARA O SERVIDOR DA VERCEL (Evita o Erro 500)
// =====================================================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseServer = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false // Desativa o localStorage no servidor para não quebrar a página
  }
});

// =====================================================================
// 2. GERA AS TAGS DA IMAGEM PARA O WHATSAPP LER
// =====================================================================
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const id = params.id;
  if (!id) return { title: 'Vitrine Oficial' };

  // Identifica se o link na barra é o código de 6 letras ou o ID original
  const isUuid = id.includes('-');
  const colunaBusca = isUuid ? 'id' : 'link_curto';
  
  const { data: anuncio } = await supabaseServer
    .from('profiles')
    .select('*')
    .eq(colunaBusca, id)
    .single();
  
  if (!anuncio) return { title: 'Anúncio não encontrado' }

  return {
    title: anuncio.titulo_ebook || 'Vitrine de E-books',
    description: anuncio.descricao || 'Clique para acessar este material na Vitrine Oficial.',
    openGraph: {
      title: anuncio.titulo_ebook,
      description: anuncio.descricao,
      images: anuncio.imagem_url ? [anuncio.imagem_url] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      images: anuncio.imagem_url ? [anuncio.imagem_url] : [],
    }
  }
}

// =====================================================================
// 3. A "PONTE" INVISÍVEL QUE REDIRECIONA PARA A SUA ROTA /ebook/[ID]
// =====================================================================
export default async function RedirecionadorCurto({ params }: { params: { id: string } }) {
  const id = params.id;

  if (!id) {
    redirect('/');
  }

  const isUuid = id.includes('-');
  const colunaBusca = isUuid ? 'id' : 'link_curto';

  // Puxamos apenas as informações necessárias para validar a trava de segurança
  const { data: anuncio, error } = await supabaseServer
    .from('profiles')
    .select('id, status') 
    .eq(colunaBusca, id)
    .single();

  // ⚠️ TRAVA DE SEGURANÇA E REDIRECIONAMENTO DE FALHA
  // Se o link for inválido, der erro, ou se o status NÃO FOR "ativo", bloqueia e manda pra home.
  if (error || !anuncio || anuncio.status !== 'ativo') {
    redirect('/'); 
  }

  // 🟢 REDIRECIONAMENTO PARA A ROTA OFICIAL (/ebook/ID-GIGANTE)
  // Como precisamos que o WhatsApp consiga parar aqui e ler a imagem, 
  // nós imprimimos um código que redireciona o cliente instantaneamente pelo navegador.
  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', fontFamily: 'sans-serif', color: '#64748b' }}>
      
      {/* Comandos de redirecionamento automático */}
      <meta httpEquiv="refresh" content={`0;url=/ebook/${anuncio.id}`} />
      <script dangerouslySetInnerHTML={{ __html: `window.location.replace("/ebook/${anuncio.id}");` }} />
      
      {/* Mensagem visual rápida caso a internet do cliente seja lenta */}
      <div style={{ textAlign: 'center' }}>
         <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: '#059669', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }}></div>
         <p style={{ fontWeight: 'bold' }}>Direcionando para a Vitrine Oficial...</p>
         <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }` }} />
      </div>

    </div>
  )
}