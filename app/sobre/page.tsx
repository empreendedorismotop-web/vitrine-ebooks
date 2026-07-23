'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Metadata } from 'next'
import { AtSign, Globe } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { founders } from '@/lib/therapists'

export default function SobrePage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [selectedUrl, setSelectedUrl] = useState('')

  return (
    <>
      <SiteHeader />
      <main className="pt-28 md:pt-32">
        <section className="mx-auto max-w-4xl px-4 pb-12 text-center md:px-6">
          <span className="inline-flex items-center rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground">
            Sobre a plataforma
          </span>
          <h1 className="mt-4 text-balance font-serif text-4xl font-bold text-foreground md:text-5xl">
            Sua vitrine para ebooks e cursos
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
            A Vitrine E-books &amp; Cursos nasceu para ajudar autores e educadores independentes a mostrar seus conteúdos com mais clareza, alcance e oportunidade de venda.
          </p>
        </section>

        <section className="mx-auto flex max-w-5xl flex-col gap-12 px-4 pb-20 md:px-6">
          {founders.map((founder, index) => {
            const whatsappUrl = `https://wa.me/${founder.whatsapp}`
            const instagramLimpo = founder.instagram?.replace(/^@/, '')
            const instagramUrl = instagramLimpo ? `https://www.instagram.com/${instagramLimpo}` : '#'

            return (
              <article
                key={founder.id}
                className={`grid items-center gap-8 rounded-3xl border border-border bg-card p-6 shadow-sm md:grid-cols-5 md:p-8 ${
                  index % 2 === 1 ? 'md:[&>div:first-child]:order-2' : ''
                }`}
              >
                <div className="md:col-span-2">
                  <div className="relative mx-auto aspect-[4/5] w-full max-w-xs overflow-hidden rounded-2xl border border-border shadow-md">
                    <Image
                      src={founder.image || '/placeholder.svg'}
                      alt={`Foto de ${founder.name}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 40vw"
                      className="object-cover"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4 md:col-span-3">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-foreground md:text-3xl">
                      {founder.name}
                    </h2>
                    <p className="mt-1 font-medium text-primary">Criador(a) · {founder.specialty || 'Conteúdo Digital'}</p>
                  </div>

                  <p className="text-pretty leading-relaxed text-muted-foreground">
                    {founder.bio}
                  </p>

                  <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    {founder.instagram && (
                      <a
                        href={instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-fit items-center gap-2 transition-colors hover:text-primary hover:underline"
                      >
                        <AtSign className="size-4 text-primary" aria-hidden="true" />
                        {founder.instagram}
                      </a>
                    )}
                    
                    {founder.website && (
                      <a
                        href={founder.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-fit items-center gap-2 font-medium text-primary transition-colors hover:underline"
                      >
                        <Globe className="size-4" aria-hidden="true" />
                        Visitar site
                      </a>
                    )}
                  </div>

                  <Button
                    onClick={() => {
                      setSelectedUrl(whatsappUrl);
                      setIsModalOpen(true);
                    }}
                    className="w-full sm:w-fit mt-2"
                  >
                    <i className="fab fa-whatsapp text-lg mr-2" aria-hidden="true" />
                    Falar no WhatsApp
                  </Button>
                </div>
              </article>
            )
          })}
        </section>

        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
              <h3 className="text-xl font-bold mb-4 text-primary">Aviso Importante</h3>
              <p className="text-stone-600 mb-6 text-sm leading-relaxed">
                Ao entrar em contato, você concorda com nossos <a href="/termos" target="_blank" className="text-primary font-semibold underline">termos de uso</a>.
              </p>
              <label className="flex items-start gap-3 mb-6 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="mt-1 w-5 h-5 accent-[#006d5b]"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <span className="text-sm text-stone-700">Estou ciente e concordo.</span>
              </label>
              <a 
                href={selectedUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (!agreed) e.preventDefault();
                  else setIsModalOpen(false);
                }}
                className={`flex justify-center w-full py-3 rounded-lg font-medium ${agreed ? "bg-[#006d5b] text-white" : "bg-stone-200 text-stone-400 pointer-events-none"}`}
              >
                Continuar
              </a>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  )
}