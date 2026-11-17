// Textos do site em português e inglês.
// Elementos com data-i18n recebem texto; data-i18n-html recebem HTML;
// data-i18n-ph trocam o placeholder. Blocos montados por script
// escutam o evento "pv:lang" e se redesenham.

export const T = {
  pt: {
    nav_home: 'Home', nav_about: 'Quem Somos', nav_school: 'Escola de Profetas', nav_articles: 'Artigos', nav_courses: 'Cursos', nav_store: 'Loja',
    scroll: 'ROLE',
    about_eyebrow: 'Quem somos',
    about_p1: 'O Prophetic Voices, fundado por <b>Gabriel e Priscila Cantarino</b>, é um ministério que existe para ser uma plataforma de formação profética a serviço da Igreja e da sociedade no tempo do fim.',
    about_p2: 'Nosso sonho é ver pessoas capacitadas pelo Espírito nos dons extraordinários e sobrenaturais, e serem forjadas por uma teologia bíblica, acadêmica e viva, que as capacita a edificar comunidades que vivem o profético de maneira sobrenatural, saudável e relevante para a sociedade.',
    about_p3: 'Cremos que todos os santos, crentes em Cristo Jesus, movidos pelo Espírito Santo, são chamados a ser vozes proféticas onde quer que estejam: na igreja local, no campo missionário, no mercado de trabalho, na família ou nas nações.',
    lead_in: 'É assim que estamos',
    manifesto: 'preparando uma geração para serem |Vozes| |Proféticas| no tempo do fim.',
    verse: 'Eis que ponho na tua boca as minhas palavras.', verse_ref: 'JR 1.9',
    lex_eyebrow: 'Léxico profético', lex_h1: 'Quatro palavras,', lex_h2: 'um ofício.', lex_sub: 'Antes de qualquer método, a linguagem. Toque em cada termo hebraico.',
    lex: [
      { gl: 'o porta-voz', body: 'Aquele que fala em nome de outro. Em Êx 7.1, Arão é o nāḇîʾ de Moisés: a boca que transmite uma palavra que não nasceu nela. O profeta não é fonte; é mensageiro credenciado.', ref: 'ÊX 7.1 · DT 18.18 · JR 1.9' },
      { gl: 'o vidente', body: 'Termo antigo para quem “vê” o que está oculto. 1Sm 9.9 registra a transição: o que hoje se chama profeta, antes se chamava vidente. A percepção precede a proclamação.', ref: '1SM 9.9 · 1SM 9.11, 19' },
      { gl: 'o visionário', body: 'Ligado a ḥāzôn, a visão. Gade é chamado o ḥōzeh de Davi: o profeta junto ao trono, que recebe revelação para orientar o governo. Visão a serviço da aliança.', ref: '2SM 24.11 · AM 7.12 · IS 1.1' },
      { gl: 'o homem de Deus', body: 'Título que não descreve uma função, mas uma pertença. Moisés, Samuel, Elias e Eliseu são chamados assim: a vida inteira do profeta é credencial. Em 1Rs 17.24, a viúva reconhece Elias como ʾîš hāʾĕlōhîm porque a palavra do Senhor em sua boca é verdade.', ref: 'DT 33.1 · 1RS 17.24 · 2RS 4.9' },
    ],
    portals_eyebrow: 'Explore', portals_h: 'Por onde começar',
    p_school_t: 'Escola de Profetas', p_school_d: 'Formação profética em dois semestres. Turma 2027 com 50 vagas.',
    p_art_t: 'Artigos', p_art_d: 'Estudos em profetismo bíblico, em formato de revista.',
    p_course_t: 'Cursos', p_course_d: 'Cursos digitais para formação no seu tempo.',
    p_store_t: 'Loja', p_store_d: 'Livros, materiais e vestuário.',
    p_go: 'ACESSAR', p_go_ext: 'INSCRIÇÕES',
    comm_eyebrow: 'Comunidade', comm_h1: 'Viva o profético', comm_h2: 'em comunidade.', comm_p: 'Entre na comunidade The Prophetic Voices no WhatsApp e acompanhe pelo Instagram.',
    g1: 'WhatsApp · Grupo 1', g2: 'WhatsApp · Grupo 2',
    news_h1: 'Receba os novos artigos', news_h2: 'da revista.', news_ph: 'seu@email.com', news_btn: 'Inscrever',
    f_nav: 'NAVEGAR', f_contact: 'CONTATO', f_agenda: 'Agenda', f_comm: 'COMUNIDADE',
    sign: 'Vozes proféticas<br>no tempo do fim.', replay: '↺ REVER ABERTURA', legal: 'TERMOS · PRIVACIDADE',
    soon: 'EM BREVE',
    art_trad: 'Tradução', art_read: 'Ler online', art_dl: 'Baixar PDF', art_cite: 'Copiar citação', art_copied: 'Citação copiada ✓',
    art_abs_h: 'Resumo', art_abs_note: 'Resumo editorial da The Prophetic Voices; o artigo original não tem resumo.',
    art_reader_h: 'Leitura', art_open: 'Abrir em tela cheia ↗', art_reader_fb: 'Se o documento não aparecer no seu aparelho,', art_reader_fb2: 'abra o PDF aqui',
    m_author: 'Autor', m_orig_title: 'Título original', m_journal: 'Periódico', m_year: 'Ano', m_pages: 'Páginas (original)', m_pub: 'Editora original',
    m_trans: 'Tradução', m_lang: 'Idioma', m_lang_v: 'Português', m_date: 'Publicado na revista', m_stable: 'Original', art_cite_h: 'Como citar',
    list_vol: 'VOL. 1 · TRADUÇÕES', list_read: 'Ler artigo', list_pdf: 'PDF',

    art_eyebrow: 'Revista The Prophetic Voices', art_h1: 'Artigos', art_lede: 'Estudos em profetismo bíblico: artigos produzidos e traduzidos pela equipe, com rigor acadêmico e sensibilidade ao Espírito. A revista abrirá, no futuro, para submissões de pesquisadores.',
    course_eyebrow: 'Formação digital', course_h1: 'Cursos', course_lede: 'Cursos digitais para quem quer se formar no profético no próprio ritmo, com acesso pela Hotmart.',
    store_eyebrow: 'Loja The Prophetic Voices', store_h1: 'Loja', store_lede: 'Livros, materiais e vestuário. Frete calculado pelo CEP; pagamento por PIX ou cartão via Mercado Pago.',
    add: 'Adicionar', added: 'No carrinho ✓', price: '[PREÇO]',
    prods: [['LIVRO', 'Igreja do Fim · Gabriel Cantarino'], ['CAMISETA', 'Anti-False Prophet Club']],
  },
  en: {
    nav_home: 'Home', nav_about: 'About Us', nav_school: 'School of Prophets', nav_articles: 'Articles', nav_courses: 'Courses', nav_store: 'Store',
    scroll: 'SCROLL',
    about_eyebrow: 'About us',
    about_p1: 'Prophetic Voices, founded by <b>Gabriel and Priscila Cantarino</b>, is a ministry that exists to be a platform for prophetic formation in service of the Church and society in the end times.',
    about_p2: 'Our dream is to see people empowered by the Spirit in the extraordinary and supernatural gifts, and forged by a biblical, academic and living theology that equips them to build communities that live the prophetic in a supernatural, healthy way, relevant to society.',
    about_p3: 'We believe that all the saints, believers in Christ Jesus, moved by the Holy Spirit, are called to be prophetic voices wherever they are: in the local church, on the mission field, in the marketplace, in the family, or among the nations.',
    lead_in: 'This is how we are',
    manifesto: 'preparing a generation to be |Prophetic| |Voices| in the end times.',
    verse: 'Behold, I have put my words in your mouth.', verse_ref: 'JER 1:9',
    lex_eyebrow: 'Prophetic lexicon', lex_h1: 'Four words,', lex_h2: 'one office.', lex_sub: 'Before any method, the language. Tap each Hebrew term.',
    lex: [
      { gl: 'the spokesman', body: 'One who speaks on behalf of another. In Ex 7:1, Aaron is Moses’ nāḇîʾ: the mouth that carries a word that did not originate in him. The prophet is not the source; he is an accredited messenger.', ref: 'EX 7:1 · DEUT 18:18 · JER 1:9' },
      { gl: 'the seer', body: 'An older term for one who “sees” what is hidden. 1 Sam 9:9 records the shift: the one now called a prophet was formerly called a seer. Perception precedes proclamation.', ref: '1 SAM 9:9 · 1 SAM 9:11, 19' },
      { gl: 'the visionary', body: 'Tied to ḥāzôn, vision. Gad is called David’s ḥōzeh: the prophet beside the throne, receiving revelation to guide its rule. Vision in service of the covenant.', ref: '2 SAM 24:11 · AMOS 7:12 · ISA 1:1' },
      { gl: 'the man of God', body: 'A title that names not a function but a belonging. Moses, Samuel, Elijah and Elisha are called this: the prophet’s whole life is his credential. In 1 Kgs 17:24 the widow recognizes Elijah as ʾîš hāʾĕlōhîm because the word of the Lord in his mouth is truth.', ref: 'DEUT 33:1 · 1 KGS 17:24 · 2 KGS 4:9' },
    ],
    portals_eyebrow: 'Explore', portals_h: 'Where to begin',
    p_school_t: 'School of Prophets', p_school_d: 'Prophetic formation over two semesters. Class of 2027, 50 spots.',
    p_art_t: 'Articles', p_art_d: 'Studies in biblical prophetism, in journal format.',
    p_course_t: 'Courses', p_course_d: 'Online courses for formation at your own pace.',
    p_store_t: 'Store', p_store_d: 'Books, materials and apparel.',
    p_go: 'ENTER', p_go_ext: 'APPLY',
    comm_eyebrow: 'Community', comm_h1: 'Live the prophetic', comm_h2: 'in community.', comm_p: 'Join The Prophetic Voices community on WhatsApp and follow along on Instagram.',
    g1: 'WhatsApp · Group 1', g2: 'WhatsApp · Group 2',
    news_h1: 'Get the new articles', news_h2: 'from the journal.', news_ph: 'your@email.com', news_btn: 'Subscribe',
    f_nav: 'EXPLORE', f_contact: 'CONTACT', f_agenda: 'Bookings', f_comm: 'COMMUNITY',
    sign: 'Prophetic voices<br>in the end times.', replay: '↺ REPLAY INTRO', legal: 'TERMS · PRIVACY',
    soon: 'COMING SOON',
    art_trad: 'Translation', art_read: 'Read online', art_dl: 'Download PDF', art_cite: 'Copy citation', art_copied: 'Citation copied ✓',
    art_abs_h: 'Abstract', art_abs_note: 'Editorial abstract by The Prophetic Voices; the original article has no abstract.',
    art_reader_h: 'Reader', art_open: 'Open full screen ↗', art_reader_fb: 'If the document does not appear on your device,', art_reader_fb2: 'open the PDF here',
    m_author: 'Author', m_orig_title: 'Original title', m_journal: 'Journal', m_year: 'Year', m_pages: 'Pages (original)', m_pub: 'Original publisher',
    m_trans: 'Translation', m_lang: 'Language', m_lang_v: 'Portuguese', m_date: 'Published in the journal', m_stable: 'Original', art_cite_h: 'How to cite',
    list_vol: 'VOL. 1 · TRANSLATIONS', list_read: 'Read article', list_pdf: 'PDF',

    art_eyebrow: 'The Prophetic Voices Journal', art_h1: 'Articles', art_lede: 'Studies in biblical prophetism: articles written and translated by our team, with academic rigor and sensitivity to the Spirit. The journal will later open to submissions from researchers.',
    course_eyebrow: 'Online formation', course_h1: 'Courses', course_lede: 'Online courses for those who want to be formed in the prophetic at their own pace, with access through Hotmart.',
    store_eyebrow: 'The Prophetic Voices Store', store_h1: 'Store', store_lede: 'Books, materials and apparel. Shipping calculated by ZIP code; payment by PIX or card via Mercado Pago.',
    add: 'Add', added: 'In cart ✓', price: '[PRICE]',
    prods: [['BOOK', 'Igreja do Fim (The End-Time Church) · Gabriel Cantarino'], ['T-SHIRT', 'Anti-False Prophet Club']],
  },
};

function getLang() {
  try { return localStorage.getItem('pv-lang') || 'pt'; } catch (e) { return 'pt'; }
}

export function currentLang() { return window.__pvLang || getLang(); }
export function t() { return T[currentLang()]; }

export function setLang(l) {
  window.__pvLang = l;
  try { localStorage.setItem('pv-lang', l); } catch (e) {}
  document.documentElement.lang = l === 'pt' ? 'pt-BR' : 'en';
  const d = T[l];
  document.querySelectorAll('[data-i18n]').forEach((el) => { const k = el.getAttribute('data-i18n'); if (d[k] != null) el.textContent = d[k]; });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => { const k = el.getAttribute('data-i18n-html'); if (d[k] != null) el.innerHTML = d[k]; });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => { const k = el.getAttribute('data-i18n-ph'); if (d[k] != null) el.placeholder = d[k]; });
  document.querySelectorAll('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === l)));
  window.dispatchEvent(new CustomEvent('pv:lang', { detail: l }));
}

export function initLang() {
  document.querySelectorAll('.lang button').forEach((b) => { b.onclick = () => setLang(b.getAttribute('data-lang')); });
  setLang(getLang());
}
