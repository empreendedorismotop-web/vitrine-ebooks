import { Metadata } from 'next'
import { redirect } from 'next/navigation'
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
// FUNÇÃO BLINDADA: Pega o código independente do nome da pasta
// =====================================================================
async function obterCodigo(paramsRecebidos: any): Promise<string> {
  if (!paramsRecebidos) return '';
  
  // Aguarda os parâmetros (Prevenção contra o novo padrão do Next.js 15)
  const params = await Promise.resolve(paramsRecebidos);
  
  // Puxa o 'id', o 'slug' ou simplesmente o primeiro valor que vier na URL
  const valor = params?.id || params?.slug || Object.values(params)[0];
  
  // Se for um array (rotas do tipo [...slug]), pega o primeiro item
  return Array.isArray(valor) ? valor[0] : (valor || '');
}

// =====================================================================
// 2. GERA AS TAGS DA IMAGEM PARA O WHATSAPP/FACEBOOK LER
// =====================================================================
export async function generateMetadata({ params }: { params: any }): Promise<Metadata> {
  const codigoParams = await obterCodigo(params);
  
  if (!codigoParams) return { title: 'Vitrine Oficial' };

  const isUuid = codigoParams.includes('-');
  const colunaBusca = isUuid ? 'id' : 'link_curto';
  
  const { data: anuncio } = await supabaseServer
    .from('profiles')
    .select('*')
    .eq(colunaBusca, codigoParams)
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
export default async function RedirecionadorCurto({ params }: { params: any }) {
  const codigoParams = await obterCodigo(params);

  // Se por acaso ainda falhar, agora ele mostra na tela exatamente o que deu erro para podermos arrumar
  if (!codigoParams) {
    return (
      <div style={{textAlign: 'center', padding: '50px', fontFamily: 'sans-serif'}}>
        <h2>Link inválido ou não detectado.</h2>
      </div>
    );
  }

  const isUuid = codigoParams.includes('-');
  const colunaBusca = isUuid ? 'id' : 'link_curto';

  const { data: anuncio, error } = await supabaseServer
    .from('profiles')
    .select('id, status') 
    .eq(colunaBusca, codigoParams)
    .single();

  // 🔴 SE NÃO ACHAR O ANÚNCIO (ERRO OU DELETADO)
  if (error || !anuncio) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif', color: '#333' }}>
         <h2>⚠️ Ops! Anúncio não encontrado</h2>
         <p>Não foi possível localizar o código <b>{codigoParams}</b>.</p>
      </div>
    );
  }

  // 🟡 TRAVA DE SEGURANÇA (O STATUS DEVE SER ATIVO)
  if (anuncio.status !== 'ativo') {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', maxWidth: '400px' }}>
           <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px' }}>⏳</span>
           <h2 style={{ color: '#0f172a', marginBottom: '10px' }}>Anúncio Pendente ou Inativo</h2>
           <p style={{ color: '#64748b', fontSize: '15px' }}>
             Este anúncio ainda não foi ativado na plataforma. Assim que você ativá-lo, este link levará automaticamente para a página do produto.
           </p>
        </div>
      </div>
    );
  }

  // 🟢 REDIRECIONAMENTO DIRETO PARA A ROTA OFICIAL (/ebook/ID-GIGANTE)
  redirect(`/ebook/${anuncio.id}`);
}