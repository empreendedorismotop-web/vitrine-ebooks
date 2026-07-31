'use client'

import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { RefreshCw, Megaphone, Target, Mail, MessageCircle, Camera, MousePointerClick, ArrowRight } from 'lucide-react'

export default function ComoFuncionaPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-slate-50 py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          
          {/* Cabeçalho da Página */}
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-900">
              Como a Plataforma Trabalha por Você
            </h1>
            <div className="h-6"></div> {/* Espaçamento exato de uma linha */}
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Entenda a dinâmica do nosso ecossistema criado exclusivamente para acelerar as vendas de autores e produtores de conteúdo independente.
            </p>
          </div>

          <div className="space-y-12">
            
            {/* Tópico 1: Dinâmica da Plataforma */}
            <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-4 mb-2">
                <div className="bg-sky-100 p-3 rounded-xl">
                  <Target className="size-8 text-sky-700" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  O Sistema de Exposição Inteligente
                </h2>
              </div>
              <div className="h-6"></div> {/* Espaçamento exato de uma linha */}
              <p className="text-slate-600 leading-relaxed text-lg">
                A Vitrine E-books & Cursos foi projetada para resolver o maior problema dos criadores digitais: a falta de tráfego. Nossa plataforma não é apenas um catálogo estático, mas sim um motor ativo de visitas. Ao cadastrar o seu produto, nós direcionamos compradores em potencial diretamente para a sua página de vendas ou checkout, sem intermediários.
              </p>
            </div>

            {/* Tópico 2: Rotação Justa */}
            <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-4 mb-2">
                <div className="bg-amber-100 p-3 rounded-xl">
                  <RefreshCw className="size-8 text-amber-700" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Algoritmo de Rotação Justa
                </h2>
              </div>
              <div className="h-6"></div> {/* Espaçamento exato de uma linha */}
              <p className="text-slate-600 leading-relaxed text-lg">
                Chega de ficar esquecido no fundo das pesquisas. Nosso sistema possui um algoritmo inteligente de rotatividade contínua. Isso garante que todos os anúncios ativos, independentemente da data de cadastro, ocupem posições de destaque e passem pela primeira página da vitrine de forma justa e igualitária. Todo mundo tem a chance de brilhar.
              </p>
            </div>

            {/* Tópico 3: Marketing Multicanal */}
            <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-4 mb-2">
                <div className="bg-emerald-100 p-3 rounded-xl">
                  <Megaphone className="size-8 text-emerald-700" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Divulgação Constante e Multicanal
                </h2>
              </div>
              <div className="h-6"></div> {/* Espaçamento exato de uma linha */}
              <p className="text-slate-600 leading-relaxed text-lg mb-8">
                Nós investimos pesado para trazer visitantes para a plataforma todos os dias. O seu e-book será impulsionado por um ecossistema de marketing completo, composto por 4 frentes de divulgação maciça:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 p-4 rounded-xl">
                  <Mail className="size-6 text-slate-700 shrink-0" />
                  <div>
                    <h3 className="font-bold text-slate-900">E-mail Marketing</h3>
                    <p className="text-sm text-slate-500">Disparos em massa para nossa base de leads engajados.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 p-4 rounded-xl">
                  <MessageCircle className="size-6 text-emerald-600 shrink-0" />
                  <div>
                    <h3 className="font-bold text-slate-900">Grupos de WhatsApp</h3>
                    <p className="text-sm text-slate-500">Divulgação direta no celular de potenciais compradores.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 p-4 rounded-xl">
                  <Camera className="size-6 text-pink-600 shrink-0" />
                  <div>
                    <h3 className="font-bold text-slate-900">Redes Sociais</h3>
                    <p className="text-sm text-slate-500">Presença forte e exposição constante no Instagram.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 p-4 rounded-xl">
                  <MousePointerClick className="size-6 text-blue-600 shrink-0" />
                  <div>
                    <h3 className="font-bold text-slate-900">Tráfego Pago</h3>
                    <p className="text-sm text-slate-500">Anúncios rodando diariamente para atrair público novo.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Chamada de Ação Final */}
          <div className="mt-16 text-center">
            <Link 
              href="/cadastro" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-full shadow-lg transition-transform hover:-translate-y-1 text-lg"
            >
              Quero Anunciar Agora
              <ArrowRight className="size-5" />
            </Link>
          </div>

        </div>
      </main>
      <SiteFooter />
    </>
  )
}