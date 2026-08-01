'use client'

import { Search, BookHeart } from 'lucide-react'
import { Button } from '@/components/ui/button'

type HeroLeitorProps = {
  query: string
  onQueryChange: (value: string) => void
}

export function HeroLeitor({ query, onQueryChange }: HeroLeitorProps) {
  return (
    <section className="relative overflow-hidden pt-28 pb-12 md:pt-36 md:pb-16 bg-slate-50">
      {/* Elemento sutil de fundo em azul suave para dar profundidade */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-transparent to-transparent -z-10" />

      <div className="mx-auto max-w-4xl px-4 text-center">
        
        {/* Tag Superior */}
        <span className="mx-auto inline-flex items-center gap-2 rounded-full bg-indigo-100 border border-indigo-200 px-4 py-1.5 text-sm font-bold text-indigo-800 mb-6 shadow-sm">
          <BookHeart className="size-4" aria-hidden="true" />
          Leituras que Transformam
        </span>

        {/* Headline Focada no Leitor */}
        <h1 className="text-balance font-serif text-4xl font-bold leading-tight text-slate-900 md:text-5xl lg:text-6xl tracking-tight mb-6">
          Encontre o conhecimento ideal para o seu <br className="hidden md:inline" />
          <span className="text-indigo-600">desenvolvimento pessoal</span>
        </h1>

        {/* Subheadline Focada na Promessa */}
        <p className="mx-auto max-w-2xl text-pretty text-lg leading-relaxed text-slate-600 mb-10">
          Explore nossa vitrine de e-books e cursos voltados para saúde emocional, inteligência mental e autoconhecimento. Dê o próximo passo na sua jornada.
        </p>

        {/* Barra de Busca */}
        <form
          className="mx-auto flex w-full max-w-2xl flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg sm:flex-row"
          role="search"
          onSubmit={(e) => e.preventDefault()}
        >
          <label htmlFor="busca" className="sr-only">
            Buscar por tema, título ou autor
          </label>
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-slate-50 px-3 border border-slate-200">
            <Search className="size-5 shrink-0 text-slate-400" aria-hidden="true" />
            <input
              id="busca"
              type="text"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Busque por tema (ex: ansiedade), título ou autor..."
              className="h-12 w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>
          <Button type="submit" size="lg" className="h-12 px-8 font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md border-none">
            Buscar Leitura
          </Button>
        </form>

      </div>
    </section>
  )
}