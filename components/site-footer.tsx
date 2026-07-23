import { BookOpen } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-sidebar mt-12">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="flex flex-col items-center text-center gap-6">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
              <BookOpen className="size-5" aria-hidden="true" />
            </span>
            <span className="font-serif text-xl font-bold text-foreground tracking-tight">
              Vitrine E-books &amp; Cursos
            </span>
          </div>

          <p className="max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
            A plataforma de visibilidade para autores e educadores independentes que querem destacar e vender e-books e cursos com mais alcance.
          </p>
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-2 border-t border-border pt-6 text-xs text-muted-foreground">
          <p>
            © Vitrine E-books &amp; Cursos. Todos os direitos reservados.
          </p>
          <p className="text-muted-foreground/70">
            Plataforma de publicidade independente — as vendas acontecem diretamente na página do autor.
          </p>
        </div>
      </div>
    </footer>
  )
}