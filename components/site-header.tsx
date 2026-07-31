'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen } from 'lucide-react'

export function SiteHeader() {
  const pathname = usePathname()

  // Oculta o menu do topo nestas páginas para não distrair o usuário
  if (pathname === '/login' || pathname === '/cadastro' || pathname === '/completar-perfil') {
    return null
  }

  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight shrink-0">
          <BookOpen className="size-6 text-primary" />
          {/* Nome completo no PC, nome curtinho no celular para caber tudo */}
          <span className="text-sky-800 hidden md:inline-block">Vitrine</span>
          <span className="text-slate-800 hidden md:inline-block">E-books &amp; Cursos</span>
          <span className="text-slate-800 md:hidden">Vitrine</span>
        </Link>

        {/* NAVEGAÇÃO E BOTÕES */}
        <nav className="flex items-center gap-4 md:gap-6">
          <Link 
            href="/planos" 
            className="text-sm font-bold text-slate-600 hover:text-primary transition-colors"
          >
            Planos
          </Link>
          
          <Link 
            href="/login" 
            className="text-sm font-bold text-slate-600 hover:text-primary transition-colors"
          >
            Login
          </Link>
          
          {/* Call to Action - Destacado */}
          <Link
            href="/cadastro"
            className="inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold px-4 md:px-6 py-2 md:py-2.5 rounded-lg transition-colors shadow-md"
          >
            <span className="hidden md:inline">Anunciar E-book / Curso</span>
            <span className="md:hidden">Anunciar</span>
          </Link>
        </nav>
        
      </div>
    </header>
  )
}