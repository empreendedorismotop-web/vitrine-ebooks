export type Therapist = {
  id: string
  name: string
  specialty: string
  bio: string
  image: string
  whatsapp: string // apenas dígitos, com DDI
  instagram?: string
  website?: string
  founder?: boolean
}

export const therapists: Therapist[] = [
  {
    id: 'luciane-souza',
    name: 'Luciane Souza',
    specialty: '',
    bio: 'Psicanalista, Master terapeuta TRG (Terapia de Reprocessamento Generativo), terapeuta EFT e especializada em Cura da Criança Interior. Mentora de terapeutas, escritora e apresentadora do Podcast Conversas que Curam.',
    image: '/therapists/luciane.jpg',
    whatsapp: '5535998185710',
    instagram: '@luciane_souzaterapeutatrg',
    website: 'https://sites.google.com/view/metodo-origem',
    founder: true,
  },
  {
    id: 'rachel',
    name: 'Rachel',
    specialty: '',
    bio: 'Master terapeuta TRG (Terapia de Reprocessamento Generativo), terapeuta EFT e especializada em Cura da Criança Interior. Mentora de terapeutas, escritora e apresentadora do Podcast Conversas que Curam.',
    image: '/therapists/rachel.jpg',
    whatsapp: '5543988438134',
    instagram: '@rachelterapeutaemocional',
    website: 'https://sites.google.com/view/metodo-origem',
    founder: true,
  },
  {
    id: 'mariana-alves',
    name: 'Mariana Alves',
    specialty: 'Terapeuta Holística',
    bio: 'Especialista em terapias integrativas e mindfulness, dedicada a acolher pessoas em processos de autoconhecimento e equilíbrio emocional com um olhar sensível e humano.',
    image: '/therapists/terapeuta-1.png',
    whatsapp: '5511999990001',
    instagram: '@mariana.terapias',
  },
  {
    id: 'carlos-mendes',
    name: 'Carlos Mendes',
    specialty: 'Terapeuta Integrativo',
    bio: 'Atua com desenvolvimento pessoal e inteligência emocional, ajudando clientes a reencontrarem clareza, propósito e leveza no dia a dia através de escuta ativa e técnicas comprovadas.',
    image: '/therapists/terapeuta-2.png',
    whatsapp: '5521999990002',
    instagram: '@carlos.integrativo',
  },
  {
    id: 'juliana-freitas',
    name: 'Juliana Freitas',
    specialty: 'Terapeuta EFT',
    bio: 'Focada em técnicas de liberação emocional e cura da criança interior, cria um espaço seguro e acolhedor para transformação profunda e reconexão consigo mesma.',
    image: '/therapists/terapeuta-3.png',
    whatsapp: '5531999990003',
    instagram: '@ju.freitas.eft',
  },
  {
    id: 'roberto-lima',
    name: 'Roberto Lima',
    specialty: 'Terapeuta TRG',
    bio: 'Com anos de experiência em reprocessamento generativo, acompanha pessoas na superação de bloqueios emocionais e na construção de uma vida mais plena e consciente.',
    image: '/therapists/terapeuta-4.png',
    whatsapp: '5541999990004',
    instagram: '@roberto.trg',
  },
]

export const founders = therapists.filter((t) => t.founder)

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function matchesTherapistSearch(therapist: Therapist, query: string) {
  const normalizedQuery = normalizeText(query.trim())

  if (!normalizedQuery) {
    return true
  }

  const searchableText = normalizeText(
    [therapist.name, therapist.specialty, therapist.bio, therapist.id].join(' '),
  )

  return searchableText.includes(normalizedQuery)
}
