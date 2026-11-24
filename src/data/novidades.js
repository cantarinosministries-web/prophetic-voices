// Novidades do ministério. A mais recente vem primeiro.
// Campos: tipo, quando (texto livre), titulo, texto (pt/en) e botões opcionais.
export const LINKS = {
  instagram: 'https://www.instagram.com/thepropheticvoices/',
  grupo1: 'https://chat.whatsapp.com/KU6aVf2D7h5L2ZXfK08SOa',
};

export const novidades = [
  {
    id: 'spirit-immersion',
    destaque: true,
    tipo: { pt: 'Evento', en: 'Event' },
    quando: { pt: 'Preparação em dezembro · 100 dias de 1º/01 a 10/04/2027', en: 'Preparation in December · 100 days, Jan 1 – Apr 10, 2027' },
    titulo: { pt: 'Spirit Immersion 2027: 31 + 100 dias', en: 'Spirit Immersion 2027: 31 + 100 days' },
    texto: {
      pt: 'Oração em línguas: 31 dias de preparação em dezembro (15, 30, 45 minutos e 1 hora por dia) e, depois, 100 dias de 1 hora por dia. As inscrições estão abertas: entre com a sua conta e acompanhe tudo no site, com a contagem dos dias, o check diário, o diário de oração e os devocionais.',
      en: 'Praying in tongues: 31 days of preparation in December (15, 30, 45 minutes and 1 hour a day), then 100 days of 1 hour a day. Enrollment is open: sign in with your account and follow everything on the site, with the day counter, daily check-in, prayer journal and devotionals.',
    },
    botoes: [
      { pt: 'Conhecer e participar', en: 'Learn more and join', url: '/spirit-immersion.html' },
    ],
  },
  {
    id: 'cursos-hotmart',
    tipo: { pt: 'Cursos', en: 'Courses' },
    quando: { pt: 'Disponível', en: 'Available' },
    titulo: { pt: 'Cursos de Intercessão, Sacerdócio e Dons do Espírito', en: 'Courses on Intercession, Priesthood and the Gifts of the Spirit' },
    texto: {
      pt: 'Três cursos digitais de Gabriel Cantarino para estudar no seu ritmo, com acesso pela Hotmart.',
      en: 'Three online courses by Gabriel Cantarino to study at your own pace, with access through Hotmart.',
    },
    botoes: [{ pt: 'Ver os cursos', en: 'See the courses', url: '/cursos.html' }],
  },
  {
    id: 'revista',
    tipo: { pt: 'Revista', en: 'Journal' },
    quando: { pt: 'Novembro de 2026', en: 'November 2026' },
    titulo: { pt: 'Revista The Prophetic Voices: primeiros artigos', en: 'The Prophetic Voices Journal: first articles' },
    texto: {
      pt: 'O primeiro volume da revista reúne traduções de estudos clássicos sobre profetismo bíblico, de Price, Walker, Bernard e Jastrow, para ler online ou baixar em PDF.',
      en: 'The journal’s first volume brings translations of classic studies on biblical prophetism by Price, Walker, Bernard and Jastrow, to read online or download as PDF.',
    },
    botoes: [{ pt: 'Ler os artigos', en: 'Read the articles', url: '/artigos.html' }],
  },
];
