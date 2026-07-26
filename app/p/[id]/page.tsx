import { supabase } from '@/lib/supabase'
import { Metadata, ResolvingMetadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

// 1. ISSO É O QUE GERA A IMAGEM NO WHATSAPP (Open Graph)
export async function generateMetadata({ params }: { params: { id: string } }, parent: ResolvingMetadata): Promise<Metadata> {
  const { data: anuncio } = await supabase.from('profiles').select('*').eq('id', params.id).single()
  
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

// 2. O VISUAL DA PÁGINA QUANDO ALGUÉM CLICA NO LINK
export default async function PaginaDoProduto({ params }: { params: { id: string } }) {
  const { data: anuncio } = await supabase.from('profiles').select('*').eq('id', params.id).single()

  if (!anuncio) {
    redirect('/') // Se o ID não existir, manda pra home
  }

  // Verifica se o anúncio está ativo (opcional, se quiser bloquear inativos)
  const estaAtivo = anuncio.status === 'ativo'

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Lado da Imagem */}
        <div className="md:w-1/2 bg-slate-100 p-8 flex items-center justify-center">
          {anuncio.imagem_url ? (
            <img src={anuncio.imagem_url} alt={anuncio.titulo_ebook} className="max-h-[400px] object-contain drop-shadow-lg rounded-md" />
          ) : (
            <div className="text-slate-400 text-center font-bold">Sem imagem</div>
          )}
        </div>

        {/* Lado do Conteúdo */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          
          <div className="mb-6">
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
              Destaque Vitrine
            </span>
          </div>

          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-4 leading-tight">
            {anuncio.titulo_ebook}
          </h1>
          
          <p className="text-sm text-slate-500 font-bold mb-6 uppercase tracking-wide">
            Por: {anuncio.nome || 'Autor Independente'}
          </p>

          <div className="text-slate-600 mb-8 whitespace-pre-wrap leading-relaxed">
            {anuncio.descricao}
          </div>

          {!estaAtivo ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl text-center font-bold border border-red-200">
              ⚠️ Este anúncio está pausado temporariamente.
            </div>
          ) : (
            <div className="mt-auto space-y-3">
              <a 
                href={anuncio.link_site} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 rounded-xl shadow-lg transition-transform transform hover:scale-[1.02]"
              >
                Acessar Material Completo
              </a>
              <p className="text-xs text-center text-slate-400 font-bold">Você será redirecionado para a página oficial do produtor.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}