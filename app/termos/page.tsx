import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export const metadata: Metadata = {
  title: 'Termos de Uso | Vitrine de E-books & Cursos',
  description:
    'Termo de Uso e Isenção de Responsabilidade para clientes da plataforma Vitrine de E-books & Cursos.',
}

type Section = {
  title: string
  paragraphs?: string[]
  bullets?: string[]
}

const sections: Section[] = [
  {
    title: '1. Da Natureza da Plataforma',
    paragraphs: [
      '1.1. A VITRINE DE E-BOOKS & CURSOS é uma plataforma digital destinada exclusivamente a conectar usuários interessados a produtores e professores independentes cadastrados.',
      '1.2. A PLATAFORMA não presta serviços terapêuticos, psicológicos, médicos, psiquiátricos ou de qualquer natureza clínica.',
      '1.3. A PLATAFORMA atua apenas como intermediadora tecnológica e espaço de divulgação profissional, não participando da execução dos serviços realizados pelos cadastrados.',
    ],
  },
  {
    title: '2. Da Responsabilidade dos Produtores',
    paragraphs: [
      '2.1. Todos os serviços e materiais oferecidos na plataforma são de responsabilidade direta dos produtores cadastrados, que atuam de forma autônoma e independente.',
      '2.2. Cada produtor é integralmente responsável por:',
    ],
    bullets: [
      'Suas qualificações e formações;',
      'Informações divulgadas em seu perfil;',
      'Métodos e técnicas utilizadas;',
      'Orientações fornecidas aos clientes;',
      'Qualidade dos produtos e serviços prestados;',
      'Resultados decorrentes dos materiais e cursos.',
    ],
  },
  {
    title: '3. Da Ausência de Vínculo',
    paragraphs: [
      '3.1. Os produtores cadastrados não são empregados, representantes, sócios, franqueados ou prepostos da PLATAFORMA.',
      '3.2. A existência de um perfil profissional na plataforma não significa endosso, certificação, validação ou garantia da qualidade dos serviços ou e-books oferecidos.',
      '3.3. O usuário reconhece que a responsabilidade pela escolha do material ou curso é exclusivamente sua.',
    ],
  },
  {
    title: '4. Da Isenção de Responsabilidade',
    paragraphs: [
      '4.1. A PLATAFORMA não garante resultados emocionais, comportamentais, financeiros, profissionais, familiares, espirituais ou de qualquer outra natureza.',
      '4.2. A PLATAFORMA não poderá ser responsabilizada por:',
    ],
    bullets: [
      'a) condutas, ações ou omissões dos produtores;',
      'b) informações, orientações ou recomendações fornecidas nos materiais;',
      'c) expectativas não atendidas ou ausência de resultados;',
      'd) danos materiais, morais, emocionais, psicológicos ou financeiros decorrentes do uso dos produtos;',
      'e) cancelamentos, atrasos ou interrupções de acesso aos materiais;',
      'f) conflitos surgidos entre clientes e produtores.',
    ],
  },
  {
    title: '5. Limitação dos Serviços Oferecidos',
    paragraphs: [
      '5.1. Os materiais e cursos divulgados possuem caráter informativo, educacional ou de desenvolvimento pessoal, conforme descrito por cada profissional.',
      '5.2. O conteúdo oferecido não substitui atendimento médico, psicológico, psiquiátrico ou qualquer tratamento de saúde realizado por profissionais legalmente habilitados.',
      '5.3. Em situações relacionadas à saúde física ou mental, o usuário deverá buscar profissionais da área competente.',
    ],
  },
  {
    title: '6. Da Livre Escolha e do Consentimento',
    paragraphs: [
      '6.1. O usuário declara que adquire os materiais e cursos de forma livre, consciente e voluntária.',
      '6.2. O usuário compreende que os resultados de qualquer processo de aprendizado ou desenvolvimento variam de pessoa para pessoa e dependem de fatores individuais.',
      '6.3. O usuário reconhece que não existe garantia de cura, transformação, prosperidade financeira, resolução de problemas pessoais ou obtenção de resultado específico.',
    ],
  },
  {
    title: '7. Proteção de Dados',
    paragraphs: [
      '7.1. A PLATAFORMA compromete-se a tratar os dados pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD).',
      '7.2. Os dados compartilhados diretamente com os produtores durante a aquisição ou contato são de responsabilidade do profissional e do usuário envolvidos na relação comercial.',
    ],
  },
  {
    title: '8. Aceite dos Termos',
    paragraphs: [
      '8.1. Ao realizar cadastro, adquirir um produto ou utilizar qualquer funcionalidade da plataforma, o usuário declara que:',
    ],
    bullets: [
      'Leu integralmente este Termo;',
      'Compreendeu seu conteúdo;',
      'Concorda com todas as cláusulas;',
      'Reconhece a inexistência de vínculo entre a PLATAFORMA e os produtores;',
      'Reconhece que toda responsabilidade pelos produtos é exclusiva dos profissionais contratados.',
    ],
  },
  {
    title: '9. Disposições Finais',
    paragraphs: [
      '9.1. A utilização da plataforma implica aceitação plena deste Termo de Uso.',
      '9.2. A PLATAFORMA poderá alterar este documento a qualquer momento, sendo as alterações disponibilizadas em seus canais oficiais.',
      '9.3. Caso o usuário não concorde com qualquer disposição deste Termo, deverá interromper imediatamente a utilização da plataforma.',
    ],
  },
]

export default function TermosPage() {
  return (
    <>
      <SiteHeader />
      <main className="pt-28 md:pt-32">
        <section className="mx-auto max-w-3xl px-4 pb-8 text-center md:px-6">
          <span className="inline-flex items-center rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground">
            Documento oficial
          </span>
          <h1 className="mt-4 text-balance font-serif text-3xl font-bold text-foreground md:text-4xl">
            Termo de Uso e Isenção de Responsabilidade
          </h1>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            Ao acessar, cadastrar-se ou utilizar os serviços disponibilizados pela
            VITRINE DE E-BOOKS & CURSOS, o usuário declara que leu, compreendeu
            e concorda integralmente com os termos e condições abaixo.
          </p>
        </section>

        <section className="mx-auto max-w-3xl px-4 pb-16 md:px-6">
          <div className="flex flex-col gap-8">
            {sections.map((section) => (
              <div
                key={section.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8"
              >
                <h2 className="font-serif text-xl font-bold text-foreground md:text-2xl mb-6">
                  {section.title}
                </h2>
                
                {section.paragraphs?.map((p, i) => (
                  <p key={i} className="mb-3 text-pretty leading-relaxed text-muted-foreground">
                    {p}
                  </p>
                ))}
                
                {section.bullets && (
                  <ul className="mt-4 flex flex-col gap-2">
                    {section.bullets.map((b, i) => (
                      <li
                        key={i}
                        className="flex gap-2 leading-relaxed text-muted-foreground"
                      >
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            <div className="rounded-2xl border border-primary/30 bg-secondary/50 p-6 shadow-sm md:p-8">
              <h2 className="font-serif text-xl font-bold text-foreground md:text-2xl mb-6">
                Cláusula de Aceite
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">
                (recomendada para o cadastro)
              </p>
              <div className="mt-4 flex flex-col gap-4">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-4">
                  <input
                    type="checkbox"
                    className="mt-1 size-5 shrink-0 accent-[var(--primary)]"
                  />
                  <span className="text-sm leading-relaxed text-foreground">
                    Declaro que li e concordo com os Termos de Uso da Plataforma,
                    compreendendo que a plataforma atua apenas como intermediadora
                    tecnológica entre clientes e produtores independentes, não sendo
                    responsável pelos materiais, orientações, resultados ou
                    condutas dos profissionais cadastrados.
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-4">
                  <input
                    type="checkbox"
                    className="mt-1 size-5 shrink-0 accent-[var(--primary)]"
                  />
                  <span className="text-sm leading-relaxed text-foreground">
                    Declaro estar ciente de que os produtos contratados não
                    substituem atendimento médico, psicológico ou psiquiátrico
                    quando necessário.
                  </span>
                </label>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}