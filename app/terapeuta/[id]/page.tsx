'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, AtSign, Compass, Globe, HeartHandshake, ShieldCheck, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

const platformValues = [
  {
    title: 'Sigilo e Segurança',
    description: 'Ambiente confidencial e protegido para você compartilhar sua história com tranquilidade.',
  },
  {
    title: 'Escuta Ativa e sem Julgamentos',
    description: 'Um espaço seguro de acolhimento total, focado exclusivamente no seu bem-estar emocional.',
  },
  {
    title: 'Profissionalismo Verificado',
    description: 'Atendimento pautado na ética, qualidade técnica e empatia durante todo o processo.',
  },
  {
    title: 'Acolhimento Humanizado',
    description: 'Respeito absoluto ao seu tempo, à sua dor e ao seu processo individual de cura e autoconhecimento.',
  },
]

export default function TherapistProfilePage({ params }: any) {
  const [id, setId] = useState<string>('')
  const [therapist, setTherapist] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Estados para controlar o modal de segurança do WhatsApp
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [agreed, setAgreed] = useState(false)

  // Esta função força a tela a rolar para o topo imediatamente
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    Promise.resolve(params).then((p) => {
      if (p?.id) setId(p.id)
    })
  }, [params])

  useEffect(() => {
    if (id) carregarPerfil()
  }, [id])

  const carregarPerfil = async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()

    if (error || !data) {
      setLoading(false)
      return
    }
    setTherapist(data)
    setLoading(false)
  }

  if (loading) {
    return (
      <>
        <SiteHeader />
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <p className="text-lg font-medium text-primary animate-pulse">Carregando oferta...</p>
        </div>
      </>
    )
  }

  if (!therapist) {
    return (
      <>
        <SiteHeader />
        <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-800">Oferta não encontrada</h1>
          <Link href="/" className="mt-6 text-primary hover:underline font-medium flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar para a lista
          </Link>
        </main>
      </>
    )
  }

  const nome = therapist.nome || therapist.name || 'Especialista'
  const telefone = therapist.telefone || therapist.whatsapp || ''
  const foto = therapist.foto_url || therapist.foto_perfil || therapist.foto || therapist.image || '/placeholder.svg'
  const especialidade = therapist.especialidade || therapist.specialty || 'Atendimento Terapêutico'
  const descricao = therapist.descricao || therapist.sobre || therapist.bio || 'Profissional parceiro da plataforma.'
  const instagram = therapist.instagram || ''
  const site = therapist.site || therapist.website || ''

  const numeroLimpo = telefone.replace(/\D/g, '')
  const whatsappUrl = numeroLimpo ? `https://wa.me/${numeroLimpo}?text=${encodeURIComponent(`Olá ${nome}, encontrei seu perfil na plataforma Conversas que Curam e gostaria de saber mais sobre seus atendimentos.`)}` : '#'
  
  const instagramLimpo = instagram.replace(/^@/, '')
  const instagramUrl = instagramLimpo ? `https://www.instagram.com/${instagramLimpo}` : null

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-gray-50/50 pb-20 pt-28 md:pt-32">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#006d5b] hover:text-[#004f42] transition-colors">
              <ArrowLeft className="w-4 h-4" /> Voltar para a lista
            </Link>
          </div>

          <div className="flex flex-col gap-8 rounded-3xl border border-gray-100 bg-white p-6 shadow-lg sm:p-10 lg:flex-row lg:items-start lg:gap-12">
            <div className="w-full shrink-0 lg:w-80">
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 shadow-inner">
                <Image src={foto} alt={`Foto de ${nome}`} fill sizes="(max-width: 1024px) 100vw, 320px" className="object-cover object-top" />
              </div>
            </div>

            <div className="flex flex-1 flex-col">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Oferta Verificada
              </span>
              <h1 className="mt-4 font-serif text-3xl font-bold text-gray-900 sm:text-4xl">{nome}</h1>
              <p className="mt-2 text-lg font-medium text-[#006d5b]">{especialidade}</p>
              <div className="mt-6 prose prose-stone max-w-none text-gray-600 leading-relaxed">
                <p>{descricao}</p>
              </div>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap">
                {numeroLimpo && (
                  <a 
                    href={agreed ? whatsappUrl : "#"} 
                    target={agreed ? "_blank" : "_self"}
                    rel="noopener noreferrer" 
                    onClick={(e) => {
                      if (!agreed) {
                        e.preventDefault();
                        setIsModalOpen(true);
                      } else {
                        setIsModalOpen(false);
                      }
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#006d5b] px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#005445] sm:w-auto cursor-pointer"
                  >
                    <i className="fab fa-whatsapp text-xl" aria-hidden="true" />
                    Falar no WhatsApp
                  </a>
                )}
                {instagramUrl && (
                  <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-3.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-[#006d5b] sm:w-auto">
                    <AtSign className="h-4 w-4" /> @{instagramLimpo}
                  </a>
                )}
                {site && (
                  <a href={site} target="_blank" rel="noopener noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-3.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-[#006d5b] sm:w-auto">
                    <Globe className="h-4 w-4" /> Visitar site
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <Compass className="h-6 w-6 text-[#006d5b]" />
                <h2 className="font-serif text-2xl font-bold text-gray-900">O que esperar da experiência</h2>
              </div>
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                {platformValues.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-gray-50 bg-gray-50/50 p-5">
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-3xl bg-[#006d5b] p-8 text-white shadow-md">
              <div className="flex items-center gap-3">
                <HeartHandshake className="h-6 w-6 text-teal-100" />
                <h2 className="font-serif text-2xl font-bold">Nosso Compromisso</h2>
              </div>
              <p className="mt-6 text-base leading-relaxed text-teal-50">
                Acreditamos que toda apresentação de conteúdo precisa ser clara, acolhedora e persuasiva para conectar o público certo à sua oferta.
              </p>
              <ul className="mt-8 space-y-4">
                <li className="flex gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                  <ShieldCheck className="h-6 w-6 shrink-0 text-teal-100" />
                  <div>
                    <p className="font-semibold text-white">Contato Direto e Seguro</p>
                    <p className="mt-1 text-sm text-teal-100/90">Você fala diretamente com o profissional escolhido, sem intermediários.</p>
                  </div>
                </li>
              </ul>
            </section>
          </div>
        </div>

        {/* Modal de Termos de Uso (Renderizado no final do main) */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200">
              
              {/* Botão de fechar (X) */}
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 transition-colors"
                aria-label="Fechar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>

              <h3 className="text-xl font-serif font-bold mb-4 text-[#006d5b]">Aviso Importante</h3>
              
              <p className="text-stone-600 mb-6 text-sm leading-relaxed">
                A <strong>Vitrine E-books &amp; Cursos</strong> atua como plataforma de divulgação para autores e educadores independentes. Não intermediamos a entrega do conteúdo nem substituímos a relação de compra entre o criador e o público. Conheça nossos <a href="/termos" target="_blank" className="text-primary font-semibold underline hover:text-[#004f42]">termos</a> antes de publicar ou comprar.
              </p>

              <label className="flex items-start gap-3 mb-6 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="mt-1 w-5 h-5 cursor-pointer accent-[#006d5b] rounded border-stone-300"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <span className="text-sm text-stone-700 group-hover:text-stone-900 transition-colors">
                  Estou ciente e concordo com as condições descritas acima.
                </span>
              </label>

              <a 
                href={agreed ? whatsappUrl : "#"} 
                target={agreed ? "_blank" : "_self"}
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (!agreed) {
                    e.preventDefault();
                  } else {
                    setIsModalOpen(false);
                  }
                }}
                className={`flex items-center justify-center w-full py-3 rounded-lg text-sm sm:text-base font-medium transition-all duration-300 ${
                  agreed 
                    ? "bg-[#006d5b] text-white hover:bg-[#005445] shadow-md hover:shadow-lg" 
                    : "bg-stone-200 text-stone-400 cursor-not-allowed"
                }`}
              >
                <i className="fab fa-whatsapp text-lg mr-2" aria-hidden="true" />
                Continuar para o WhatsApp
              </a>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  )
}