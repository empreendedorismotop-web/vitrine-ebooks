import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export const metadata: Metadata = {
  title: 'Política de Privacidade | Conversas que Curam',
  description:
    'Política de Privacidade e Proteção de Dados para clientes da plataforma Conversas que Curam.',
}

type Section = {
  title: string
  paragraphs?: string[]
  bullets?: string[]
}

const sections: Section[] = [
  {
    title: '1. Coleta de Dados Pessoais',
    paragraphs: [
      '1.1. Coletamos apenas as informações estritamente necessárias para o funcionamento da plataforma e para facilitar o contato entre você e os terapeutas independentes ou produtores de conteúdo.',
      '1.2. Os dados coletados podem incluir, mas não se limitam a: nome completo, endereço de e-mail e número de WhatsApp.',
    ],
  },
  {
    title: '2. Uso das Informações',
    paragraphs: [
      '2.1. Seus dados são utilizados exclusivamente para permitir a criação do seu perfil, a exibição dos seus anúncios na vitrine e o contato direto por parte dos clientes interessados.',
      '2.2. Não utilizamos seus dados para envios de spam e não vendemos suas informações para empresas de terceiros sob nenhuma hipótese.',
    ],
  },
  {
    title: '3. Compartilhamento de Dados',
    paragraphs: [
      '3.1. A plataforma atua apenas como uma vitrine tecnológica. Ao clicar para contatar um terapeuta ou adquirir um material, você entende que estará interagindo diretamente com o profissional, momento em que a troca de dados será regida pela relação entre vocês.',
      '3.2. Podemos compartilhar dados com autoridades competentes caso haja requisição judicial ou necessidade de defesa em processos legais.',
    ],
  },
  {
    title: '4. Proteção e Segurança',
    paragraphs: [
      '4.1. Empregamos medidas técnicas e organizacionais padrão da indústria para proteger seus dados pessoais contra acessos não autorizados, perdas ou alterações.',
      '4.2. Nosso banco de dados utiliza protocolos de segurança modernos (como a tecnologia do Supabase) para garantir a integridade das suas informações.',
    ],
  },
  {
    title: '5. Seus Direitos (LGPD)',
    paragraphs: [
      '5.1. Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem o direito de:',
    ],
    bullets: [
      'Confirmar a existência de tratamento de dados;',
      'Acessar os seus dados armazenados;',
      'Corrigir dados incompletos, inexatos ou desatualizados;',
      'Solicitar a exclusão definitiva dos seus dados e do seu perfil da plataforma a qualquer momento.',
    ],
  },
  {
    title: '6. Retenção e Exclusão',
    paragraphs: [
      '6.1. Manteremos seus dados enquanto sua conta estiver ativa ou enquanto for necessário para fornecer nossos serviços.',
      '6.2. Caso deseje encerrar sua conta, você pode excluir seu perfil diretamente pelo painel de controle ou solicitar a exclusão através dos nossos canais de atendimento.',
    ],
  },
]

export default function PoliticasPage() {
  return (
    <>
      <SiteHeader />
      <main className="pt-28 md:pt-32">
        <section className="mx-auto max-w-3xl px-4 pb-8 text-center md:px-6">
          <span className="inline-flex items-center rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground">
            Documento oficial
          </span>
          <h1 className="mt-4 text-balance font-serif text-3xl font-bold text-foreground md:text-4xl">
            Política de Privacidade e Proteção de Dados
          </h1>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            A transparência e o respeito à sua privacidade são fundamentais para nós.
            Leia abaixo como tratamos e protegemos as suas informações.
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
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}