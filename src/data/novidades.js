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
    quando: { pt: 'Em breve', en: 'Coming soon' },
    titulo: { pt: 'Spirit Immersion', en: 'Spirit Immersion' },
    texto: {
      pt: 'O Spirit Immersion vai acontecer novamente. Em breve divulgaremos data, local e inscrições. Entre na nossa comunidade no WhatsApp e acompanhe o Instagram para receber as informações em primeira mão.',
      en: 'Spirit Immersion is coming back. We will soon announce the date, venue and registration. Join our WhatsApp community and follow us on Instagram to be the first to know.',
    },
    botoes: [
      { pt: 'Quero ser avisado', en: 'Notify me', url: LINKS.grupo1 },
      { pt: 'Acompanhar no Instagram', en: 'Follow on Instagram', url: LINKS.instagram },
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
