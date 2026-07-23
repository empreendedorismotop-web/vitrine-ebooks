'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen } from 'lucide-react'

export function SiteHeader() {
  const pathname = usePathname()

  if (pathname === '/login' || pathname === '/cadastro' || pathname === '/completar-perfil') {
    return null
  }

  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <BookOpen className="size-6 text-primary" />
          <span className="text-sky-800">Vitrine</span>
          <span className="text-slate-800">E-books &amp; Cursos</span>
        </Link>

        <div className="flex items-center">
          <Link
            href="/cadastro"
            className="inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold px-6 py-2.5 rounded-lg transition-colors shadow-md"
          >
            Anunciar E-book / Curso
          </Link>
        </div>
      </div>
    </header>
  )
}