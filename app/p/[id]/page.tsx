import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

// =====================================================================
// 1. CLIENTE SUPABASE SEGURO PARA O SERVIDOR (Evita o Erro 500)
// =====================================================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseServer = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false // Isso desativa o localStorage e impede a página de quebrar
  }
});

// =====================================================================
// 2. ISSO É O QUE GERA A IMAGEM NO WHATSAPP (Open Graph)
// =====================================================================
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const id = params.id;
  
  // Identifica se é UUID gigante (tem hífen) ou Link Curto (não tem hífen)
  const isUuid = id.includes('-');
  const colunaBusca = isUuid ? 'id' : 'link_curto';
  
  const { data: anuncio } = await supabaseServer
    .from('profiles')
    .select('*')
    .eq(colunaBusca, id)
    .single();
  
  if (!anuncio) return { title: 'Anúncio não encontrado' }

  return {
    title: anuncio.titulo_ebook || 'Conheça este material!',
    description: anuncio.descricao || 'Clique para saber mais detalhes sobre este e-book/curso.',
    openGraph: {
      title: anuncio.titulo_ebook,
      description: anuncio.descricao,
      images: anuncio.imagem_url ? [anuncio.imagem_url] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: anuncio.titulo_ebook,
      description: anuncio.descricao,
      images: anuncio.imagem_url ? [anuncio.imagem_url] : [],
    }
  }
}

// =====================================================================
// 3. O VISUAL DA PÁGINA QUANDO ALGUÉM CLICA NO LINK
// =====================================================================
export default async function PaginaDoProduto({ params }: { params: { id: string } }) {
  const id = params.id;
  const isUuid = id.includes('-');
  const colunaBusca = isUuid ? 'id' : 'link_curto';

  const { data: anuncio, error } = await supabaseServer
    .from('profiles')
    .select('*')
    .eq(colunaBusca, id)
    .single();

  if (error || !anuncio) {
    console.error("Erro ao carregar o anúncio:", error);
    redirect('/'); // Se não achar ou der erro, manda pra home silenciosamente
  }

  const estaAtivo = anuncio.status === 'ativo';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col md:flex-row border border-slate-100">
        
        {/* Lado da Imagem */}
        <div className="md:w-1/2 bg-slate-50 p-8 flex items-center justify-center border-r border-slate-100 relative">
          <div className="absolute top-4 left-4">
            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-blue-200 shadow-sm">
              Vitrine Oficial
            </span>
          </div>
          {anuncio.imagem_url ? (
            <img src={anuncio.imagem_url} alt={anuncio.titulo_ebook} className="max-h-[450px] object-contain drop-shadow-2xl rounded" />
          ) : (
            <div className="text-slate-400 text-center font-bold">Sem imagem disponível</div>
          )}
        </div>

        {/* Lado do Conteúdo */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          
          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2 leading-tight">
            {anuncio.titulo_ebook}
          </h1>
          
          <p className="text-xs text-slate-400 font-bold mb-6 uppercase tracking-wider">
            Autor(a): <span className="text-slate-600">{anuncio.nome || 'Autor Independente'}</span>
          </p>

          <div className="text-slate-600 mb-10 whitespace-pre-wrap leading-relaxed text-sm">
            {anuncio.descricao}
          </div>

          {!estaAtivo ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl text-center font-bold border border-red-200 mt-auto">
              ⚠️ Este material está temporariamente indisponível.
            </div>
          ) : (
            <div className="mt-auto space-y-3">
              <a 
                href={anuncio.link_site} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg py-4 rounded-xl shadow-[0_5px_15px_rgba(5,150,105,0.3)] transition-all transform hover:scale-[1.02]"
              >
                Garantir Meu Acesso
              </a>
              <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-wider">
                Você será direcionado ao site seguro do produtor
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}