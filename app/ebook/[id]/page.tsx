import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Metadata } from 'next'

type Props = {
  params: Promise<{ id: string }> | { id: string }
}

// 1. MOTOR DE SEO E LINK PREVIEW
export async function generateMetadata(props: Props): Promise<Metadata> {
  // O await aqui resolve o problema de sincronia nas versões novas do Next.js
  const params = await props.params;
  
  const { data: produto } = await supabase
    .from('profiles') 
    .select('*')
    .eq('id', params.id)
    .single()

  if (!produto) {
    return { title: 'Produto não encontrado | Vitrine Digital' }
  }

  const descricaoCurta = produto.descricao ? produto.descricao.substring(0, 150) + '...' : 'Confira este material incrível na Vitrine Digital.'

  return {
    title: `${produto.titulo_ebook} | Vitrine Digital`,
    description: descricaoCurta,
    openGraph: {
      title: produto.titulo_ebook,
      description: descricaoCurta,
      images: [produto.imagem_url || '/placeholder-book.png'],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: produto.titulo_ebook,
      description: descricaoCurta,
      images: [produto.imagem_url || '/placeholder-book.png'],
    }
  }
}

// 2. COMPONENTE DE SERVIDOR
export default async function ProdutoPage(props: Props) {
  const params = await props.params;

  const { data: produto, error } = await supabase
    .from('profiles') 
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !produto) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col gap-6 p-6 text-center">
        <h2 className="text-3xl font-bold text-slate-800">Material não encontrado.</h2>
        
        {/* CAIXA DE DIAGNÓSTICO (Visível para te ajudar a corrigir o banco) */}
        <div className="bg-red-50 p-6 rounded-2xl border border-red-200 text-red-900 text-sm max-w-lg shadow-sm text-left">
          <p className="font-bold text-base mb-3 text-red-700">🔍 Radar de Erro (Painel Técnico):</p>
          <p><strong>ID Buscado:</strong> {params.id}</p>
          <p className="mt-2"><strong>Aviso do Supabase:</strong> {error?.message || 'Nenhum dado retornado da tabela profiles.'}</p>
          
          <div className="mt-4 p-4 bg-white rounded-lg border border-red-100 text-xs text-slate-600">
            <strong>Como resolver?</strong> Se o aviso acima for <em>"JSON object requested, multiple (or no) rows returned"</em>, significa que o seu Supabase está bloqueando visitantes de lerem os anúncios (RLS Ativado). 
            Você precisará ir no painel do Supabase {'>'} Authentication {'>'} Policies e criar uma política permitindo leitura pública ("Enable read access for all users") na tabela profiles.
          </div>
        </div>

        <Link href="/" className="text-emerald-600 font-bold hover:underline mt-4">← Voltar para o início</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 py-6 text-center">
        <h1 className="text-2xl font-serif font-bold text-slate-900">Vitrine Digital</h1>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 overflow-hidden">
        <Link href="/" className="text-sm font-bold text-slate-500 hover:text-slate-900 mb-8 inline-block transition-colors">
          ← VOLTAR PARA A VITRINE
        </Link>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden w-full">
          <div className="flex flex-col md:flex-row gap-10 p-8 md:p-12 border-b border-slate-100 bg-gradient-to-b from-white to-slate-50/50">
            <div className="w-full md:w-[40%] flex-shrink-0 flex justify-center items-start">
              <img 
                src={produto.imagem_url || '/placeholder-book.png'} 
                alt={produto.titulo_ebook} 
                className="w-full max-w-[320px] h-auto object-contain drop-shadow-2xl rounded-md" 
              />
            </div>
            <div className="w-full md:w-[60%] min-w-0 flex flex-col justify-center">
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-3 break-words">
                POR {produto.nome}
              </p>
              <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 mb-8 leading-tight break-words">
                {produto.titulo_ebook}
              </h1>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-auto w-full">
                <a 
                  href={produto.link_site || '#'} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="block w-full py-4 px-6 bg-slate-900 hover:bg-slate-800 text-white text-center font-bold rounded-xl transition-all shadow-md text-lg break-words"
                >
                  Acessar Material Completo
                </a>
                <p className="text-center text-xs font-bold text-emerald-600 mt-4 flex items-center justify-center gap-1">
                  🔒 Checkout Seguro e Criptografado
                </p>
              </div>
            </div>
          </div>
          <div className="p-8 md:p-12 bg-white w-full">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">
              Sobre este material
            </h2>
            <div className="prose prose-slate max-w-none w-full text-slate-700 leading-relaxed whitespace-pre-wrap space-y-4 text-base md:text-lg mb-12 break-words">
              {produto.descricao}
            </div>
            <div className="mt-10 pt-10 border-t border-slate-100 flex flex-col items-center w-full">
                <h3 className="text-xl font-bold text-slate-900 mb-6 text-center">Pronto para começar?</h3>
                <a href={produto.link_site || '#'} target="_blank" rel="noreferrer" className="block w-full max-w-md py-4 px-6 bg-slate-900 hover:bg-slate-800 text-white text-center font-bold rounded-xl transition-all shadow-md text-lg break-words">
                  Acessar Material Completo Agora
                </a>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-slate-900 text-slate-400 py-12 mt-12 w-full">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-3 gap-8 mb-10">
          <div>
            <h3 className="text-white font-bold mb-4 text-lg">Vitrine Digital</h3>
            <p className="text-sm leading-relaxed text-slate-500">
              A maior vitrine de infoprodutos e cursos. Descubra materiais incríveis criados por especialistas de diversas áreas.
            </p>
          </div>
          <div>
            <h3 className="text-white font-bold mb-4 text-lg">Transparência</h3>
            <p className="text-sm leading-relaxed text-slate-500">
              <strong>Aviso Legal:</strong> Esta plataforma atua exclusivamente como um portal de publicidade e vitrine de anúncios digitais. 
              Nós não realizamos intermediações financeiras, não processamos pagamentos e não somos os criadores dos produtos aqui expostos.
            </p>
          </div>
          <div>
            <h3 className="text-white font-bold mb-4 text-lg">Segurança</h3>
            <p className="text-sm leading-relaxed text-slate-500">
              Ao clicar no botão de acesso, você será redirecionado para a página oficial do criador do conteúdo ou para plataformas de checkout seguras externas.
            </p>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-8 text-center text-xs text-slate-600 flex flex-col md:flex-row justify-center items-center gap-4">
          <p>© {new Date().getFullYear()} Vitrine Digital. Todos os direitos reservados.</p>
          <div className="flex gap-4 justify-center">
            <Link href="/termos" className="hover:text-white transition-colors">Termos de Uso</Link>
            <Link href="/privacidade" className="hover:text-white transition-colors">Política de Privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}