import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'

// =====================================================================
// 1. CONEXÃO SEGURA PARA O SERVIDOR DA VERCEL
// =====================================================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseServer = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// =====================================================================
// 2. GERA AS TAGS DA IMAGEM PARA O WHATSAPP/FACEBOOK LER
// =====================================================================
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const id = params.id;
  if (!id) return { title: 'Vitrine Oficial' };

  // Identifica se o link na barra é o código de 6 letras ou o ID gigante
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
// 3. A "PONTE" QUE REDIRECIONA PARA A SUA ROTA /ebook/[ID]
// =====================================================================
export default async function RedirecionadorCurto({ params }: { params: { id: string } }) {
  const id = params.id;

  if (!id) {
    return <div style={{textAlign: 'center', padding: '50px'}}>Link em branco.</div>;
  }

  const isUuid = id.includes('-');
  const colunaBusca = isUuid ? 'id' : 'link_curto';

  const { data: anuncio, error } = await supabaseServer
    .from('profiles')
    .select('id, status') 
    .eq(colunaBusca, id)
    .single();

  // 🔴 AGORA MOSTRA O ERRO NA TELA EM VEZ DE TE JOGAR PRA HOME
  if (error || !anuncio) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif', color: '#333' }}>
         <h2>⚠️ Ops! Anúncio não encontrado</h2>
         <p>Não foi possível localizar o código <b>{id}</b>.</p>
         {error && <p style={{color: 'red', fontSize: '12px', marginTop: '20px'}}>{error.message}</p>}
      </div>
    );
  }

  // 🟢 REDIRECIONAMENTO DIRETO PARA A ROTA OFICIAL (/ebook/ID-GIGANTE)
  // Sem travas de status aqui. Apenas joga o cliente para a página real do e-book.
  const urlDestino = `/ebook/${anuncio.id}`;

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', fontFamily: 'sans-serif', color: '#64748b' }}>
      
      {/* Comandos de redirecionamento automático */}
      <meta httpEquiv="refresh" content={`0;url=${urlDestino}`} />
      <script dangerouslySetInnerHTML={{ __html: `window.location.replace("${urlDestino}");` }} />
      
      {/* Feedback visual rápido para o cliente */}
      <div style={{ textAlign: 'center' }}>
         <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: '#059669', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }}></div>
         <p style={{ fontWeight: 'bold' }}>Direcionando para o anúncio...</p>
         <p style={{ fontSize: '12px', marginTop: '15px' }}>
           <a href={urlDestino} style={{ color: '#059669', textDecoration: 'underline' }}>
             Clique aqui se não for redirecionado automaticamente
           </a>
         </p>
         <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }` }} />
      </div>

    </div>
  )
}