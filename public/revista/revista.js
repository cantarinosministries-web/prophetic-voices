/* The Prophetic Voices — revista: textos PT/EN, citação e busca do acervo (dados em window.PV_ARTIGOS, injetados pelo Worker) */
(function () {
  var T = {
    pt: {
      nav_home: 'Início', nav_about: 'Quem Somos', nav_school: 'Escola de Profetas', nav_articles: 'Artigos', nav_courses: 'Cursos', nav_store: 'Loja',
      hero_eyebrow: 'Revista The Prophetic Voices', hero_sub: 'estudos em profetismo bíblico',
      hero_lede: 'Artigos produzidos ou traduzidos pela equipe do Prophetic Voices, com rigor acadêmico e sensibilidade ao Espírito. Um acervo que cresce até se tornar periódico, aberto no futuro a pesquisadores de todo o Brasil.',
      st_art: 'artigos', st_aut: 'autores', st_per: 'periódicos', scroll: 'ACERVO ↓',
      search_ph: 'Buscar por título, autor, tema ou passagem…', search_lbl: 'Buscar no acervo', clear: 'LIMPAR',
      f_author: 'Autor', f_area: 'Área', f_all: 'Todos', f_all_a: 'Todas', sort: 'Ordenar', s_recent: 'Mais antigo primeiro', s_new: 'Mais recente primeiro', s_title: 'Título (A–Z)', s_author: 'Autor (A–Z)',
      count_1: '1 artigo', count_n: '{n} artigos', count_of: ' de {t}',
      read: 'Ler artigo', trad: 'Tradução', empty_h: 'Nenhum artigo encontrado', empty_p: 'Tente outro termo ou limpe os filtros.',
      authors_e: 'Índice', authors_h: 'Autores do acervo', n_art_1: '1 artigo', n_art_n: '{n} artigos',
      // página do artigo
      read_on: 'Ler online', dl: 'Baixar PDF', cite: 'Copiar citação', copied: 'Citação copiada ✓', abs_h: 'Resumo',
      abs_note: 'Resumo editorial da The Prophetic Voices; o artigo original não tem resumo.', kw_h: 'Palavras-chave',
      reader_h: 'Leitura', open: 'Abrir em tela cheia ↗', fb1: 'Se o documento não aparecer no seu aparelho,', fb2: 'abra o PDF aqui',
      m_author: 'Autor', m_orig: 'Título original', m_journal: 'Periódico', m_year: 'Ano', m_pages: 'Páginas (original)', m_pub: 'Editora original',
      m_trans: 'Tradução', m_lang: 'Idioma', m_lang_v: 'Português', m_date: 'Publicado na revista', m_views: 'Acessos', m_dls: 'Downloads do PDF', m_stable: 'Original', cite_h: 'Como citar', rel_h: 'Leia também',
      rights: 'Original em domínio público. Tradução para o português © 2026 Gabriel Cantarino / The Prophetic Voices.',
      more_by: 'Outros artigos do autor', foot: 'Preparando uma geração para serem Vozes Proféticas no tempo do fim.'
    },
    en: {
      nav_home: 'Home', nav_about: 'About', nav_school: 'School of Prophets', nav_articles: 'Articles', nav_courses: 'Courses', nav_store: 'Store',
      hero_eyebrow: 'The Prophetic Voices Journal', hero_sub: 'studies in biblical prophetism',
      hero_lede: 'Articles written or translated by the Prophetic Voices team, with academic rigor and sensitivity to the Spirit. A growing collection on its way to becoming a journal, open in the future to researchers across Brazil.',
      st_art: 'articles', st_aut: 'authors', st_per: 'journals', scroll: 'COLLECTION ↓',
      search_ph: 'Search by title, author, topic or passage…', search_lbl: 'Search the collection', clear: 'CLEAR',
      f_author: 'Author', f_area: 'Field', f_all: 'All', f_all_a: 'All', sort: 'Sort', s_recent: 'Oldest first', s_new: 'Newest first', s_title: 'Title (A–Z)', s_author: 'Author (A–Z)',
      count_1: '1 article', count_n: '{n} articles', count_of: ' of {t}',
      read: 'Read article', trad: 'Translation', empty_h: 'No articles found', empty_p: 'Try another term or clear the filters.',
      authors_e: 'Index', authors_h: 'Authors in the collection', n_art_1: '1 article', n_art_n: '{n} articles',
      read_on: 'Read online', dl: 'Download PDF', cite: 'Copy citation', copied: 'Citation copied ✓', abs_h: 'Abstract',
      abs_note: 'Editorial abstract by The Prophetic Voices; the original article has no abstract.', kw_h: 'Keywords',
      reader_h: 'Reader', open: 'Open full screen ↗', fb1: 'If the document does not appear on your device,', fb2: 'open the PDF here',
      m_author: 'Author', m_orig: 'Original title', m_journal: 'Journal', m_year: 'Year', m_pages: 'Pages (original)', m_pub: 'Original publisher',
      m_trans: 'Translation', m_lang: 'Language', m_lang_v: 'Portuguese', m_date: 'Published in the journal', m_views: 'Page views', m_dls: 'PDF downloads', m_stable: 'Original', cite_h: 'How to cite', rel_h: 'Read also',
      rights: 'Original in the public domain. Portuguese translation © 2026 Gabriel Cantarino / The Prophetic Voices.',
      more_by: 'More by this author', foot: 'Preparing a generation to be Prophetic Voices in the end times.'
    }
  };
  var lang = 'pt';
  try { lang = localStorage.getItem('pv-lang') || 'pt'; } catch (e) {}
  if (!T[lang]) lang = 'pt';
  function t(k) { return T[lang][k] || T.pt[k] || k; }
  window.PV_T = t;
  window.PV_APPLY = function () { applyLang(); };

  function applyLang() {
    document.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR';
    // só mexe nos textos da revista; o resto da página (menu, comunidade, rodapé) é do i18n do site
    var tem = function (k) { return k in T.pt; };
    document.querySelectorAll('[data-i18n]').forEach(function (el) { var k = el.getAttribute('data-i18n'); if (tem(k)) el.textContent = t(k); });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) { var k = el.getAttribute('data-i18n-ph'); if (tem(k)) el.placeholder = t(k); });
    document.querySelectorAll('[data-pt]').forEach(function (el) { el.textContent = lang === 'en' ? el.getAttribute('data-en') : el.getAttribute('data-pt'); });
    window.dispatchEvent(new Event('pv:artlang'));
  }
  // o idioma é trocado pelo cabeçalho do site (i18n.js), que avisa com o evento pv:lang
  window.addEventListener('pv:lang', function (e) { var l = (e && e.detail) || (function () { try { return localStorage.getItem('pv-lang'); } catch (x) { return null; } })(); if (T[l]) { lang = l; applyLang(); } });

  // citação (página do artigo)
  var citeBtn = document.getElementById('citeBtn');
  if (citeBtn) citeBtn.addEventListener('click', function () {
    var txt = document.getElementById('citeText').innerText;
    var done = function () { var s = citeBtn.querySelector('span'); s.textContent = t('copied'); setTimeout(function () { s.textContent = t('cite'); }, 2000); };
    if (navigator.clipboard) navigator.clipboard.writeText(txt).then(done, done); else done();
  });

  // ---------- busca do acervo ----------
  var list = document.getElementById('lista');
  if (!list || !window.PV_ARTIGOS) { applyLang(); return; }
  var A = window.PV_ARTIGOS;
  var norm = function (s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[ʾʿ'’`]/g, '').toLowerCase(); };
  A.forEach(function (a) {
    a._hay = norm([a.titulo, a.tituloOriginal, a.autor, a.tradutor, a.periodico, a.ano, a.area, a.areaEn, a.tema, a.palavrasChave.join(' '), a.resumo, a.editoraOriginal].join(' '));
  });
  var params = new URLSearchParams(location.search);
  var state = { q: params.get('q') || '', autor: params.get('autor') || '', area: params.get('area') || '', ordem: params.get('ordem') || 'ano' };
  var input = document.getElementById('q'), box = document.querySelector('.search');
  var autores = []; A.forEach(function (a) { if (autores.indexOf(a.autor) < 0) autores.push(a.autor); });
  autores.sort(function (x, y) { return x.split(' ').pop().localeCompare(y.split(' ').pop()); });
  var areas = []; A.forEach(function (a) { if (areas.indexOf(a.area) < 0) areas.push(a.area); });

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function hl(text, terms) {
    var out = esc(text); if (!terms.length) return out;
    var n = norm(text), marks = [];
    terms.forEach(function (tm) { var i = n.indexOf(tm); while (tm && i >= 0) { marks.push([i, i + tm.length]); i = n.indexOf(tm, i + tm.length); } });
    if (!marks.length) return out;
    marks.sort(function (a, b) { return a[0] - b[0]; });
    var res = '', last = 0;
    marks.forEach(function (m) { if (m[0] < last) return; res += esc(text.slice(last, m[0])) + '<mark>' + esc(text.slice(m[0], m[1])) + '</mark>'; last = m[1]; });
    return res + esc(text.slice(last));
  }

  function chips() {
    var ca = document.getElementById('f-autor'), cr = document.getElementById('f-area');
    if (ca) ca.innerHTML = '<button class="chip" data-v="">' + t('f_all') + '</button>' + autores.map(function (n) { return '<button class="chip" data-v="' + esc(n) + '">' + esc(n) + '</button>'; }).join('');
    cr.innerHTML = '<button class="chip" data-v="">' + t('f_all_a') + '</button>' + areas.map(function (n) { var a = A.filter(function (x) { return x.area === n; })[0]; return '<button class="chip" data-v="' + esc(n) + '">' + esc(lang === 'en' ? a.areaEn : n) + '</button>'; }).join('');
    if (ca) ca.querySelectorAll('.chip').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === state.autor); b.onclick = function () { state.autor = b.dataset.v; render(); }; });
    cr.querySelectorAll('.chip').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === state.area); b.onclick = function () { state.area = b.dataset.v; render(); }; });
  }

  function render() {
    var terms = norm(state.q).split(/\s+/).filter(Boolean);
    var r = A.filter(function (a) {
      if (state.autor && a.autor !== state.autor) return false;
      if (state.area && a.area !== state.area) return false;
      return terms.every(function (tm) { return a._hay.indexOf(tm) >= 0; });
    });
    var o = state.ordem;
    r.sort(function (x, y) {
      if (o === 'novo') return y.ano - x.ano;
      if (o === 'titulo') return x.titulo.localeCompare(y.titulo, 'pt');
      if (o === 'autor') return x.autor.split(' ').pop().localeCompare(y.autor.split(' ').pop());
      return x.ano - y.ano;
    });
    list.innerHTML = r.map(function (a, i) {
      return '<article class="art-item" style="animation-delay:' + (i * 70) + 'ms">' +
        '<a href="' + a.url + '" class="art-thumb" tabindex="-1" aria-hidden="true"><img src="' + a.capa + '" alt="" width="150" height="212" loading="lazy"></a>' +
        '<div class="art-info"><span class="m">' + esc(a.periodico) + ' · ' + a.ano + ' · ' + esc(lang === 'en' ? a.areaEn : a.area) + '</span>' +
        '<h2><a href="' + a.url + '">' + hl(a.titulo, terms) + '</a></h2>' +
        '<p class="orig">' + hl(a.tituloOriginal, terms) + '</p>' +
        '<p class="by"><a href="?autor=' + encodeURIComponent(a.autor) + '" data-autor="' + esc(a.autor) + '">' + hl(a.autor, terms) + '</a>' + (a.tradutor ? ' <span>· ' + t('trad') + ': ' + esc(a.tradutor) + '</span>' : '') + '</p>' +
        '<p class="abs">' + esc(lang === 'en' ? a.resumoEn : a.resumo) + '</p>' +
        '<div class="kw">' + a.palavrasChave.slice(0, 5).map(function (k) { return '<button data-k="' + esc(k) + '">' + hl(k, terms) + '</button>'; }).join('') + '</div>' +
        '<div class="links"><a href="' + a.url + '" class="btn btn-creme sm">' + t('read') + '</a><a href="' + a.pdf + '" download class="btn btn-ghost sm">PDF ↓</a></div></div></article>';
    }).join('');
    list.querySelectorAll('[data-autor]').forEach(function (el) { el.onclick = function (e) { e.preventDefault(); state.autor = el.dataset.autor; render(); }; });
    list.querySelectorAll('[data-k]').forEach(function (el) { el.onclick = function () { state.q = el.dataset.k; input.value = state.q; render(); }; });
    var c = r.length === 1 ? t('count_1') : t('count_n').replace('{n}', r.length);
    if (r.length !== A.length) c += t('count_of').replace('{t}', A.length);
    document.getElementById('count').textContent = c;
    document.getElementById('empty').style.display = r.length ? 'none' : 'block';
    box.classList.toggle('has', !!state.q);
    chips();
    var p = new URLSearchParams();
    if (state.q) p.set('q', state.q); if (state.autor) p.set('autor', state.autor); if (state.area) p.set('area', state.area); if (state.ordem !== 'ano') p.set('ordem', state.ordem);
    var qs = p.toString();
    try { history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash); } catch (e) {}
  }

  function authorsIndex() {
    var g = document.getElementById('autores'); if (!g) return;
    g.innerHTML = autores.map(function (n) {
      var its = A.filter(function (a) { return a.autor === n; }), a0 = its[0];
      return '<a class="author-card" href="?autor=' + encodeURIComponent(n) + '" data-autor="' + esc(n) + '"><b>' + esc(n) + '</b><span>' + esc(a0.afiliacao) + '</span><i>' + (its.length === 1 ? t('n_art_1') : t('n_art_n').replace('{n}', its.length)) + '</i></a>';
    }).join('');
    g.querySelectorAll('[data-autor]').forEach(function (el) { el.onclick = function (e) { e.preventDefault(); state.autor = el.dataset.autor; render(); document.getElementById('acervo').scrollIntoView({ behavior: 'smooth' }); }; });
  }

  input.value = state.q;
  var tm; input.addEventListener('input', function () { clearTimeout(tm); tm = setTimeout(function () { state.q = input.value; render(); }, 120); });
  document.querySelector('.search .clear').onclick = function () { state.q = ''; state.autor = ''; state.area = ''; input.value = ''; render(); input.focus(); };
  var sel = document.getElementById('ordem'); sel.value = state.ordem; sel.onchange = function () { state.ordem = sel.value; render(); };
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && document.activeElement !== input) { e.preventDefault(); input.focus(); }
    if (e.key === 'Escape' && document.activeElement === input) { input.value = ''; state.q = ''; render(); }
  });
  window.addEventListener('pv:artlang', function () { render(); authorsIndex(); });
  window.PV_SET = function (o) { state.q = o.q || ''; state.autor = o.autor || ''; state.area = o.area || ''; input.value = state.q; render(); };
  document.getElementById('st-art').textContent = A.length;
  document.getElementById('st-aut').textContent = autores.length;
  var pers = []; A.forEach(function (a) { if (pers.indexOf(a.periodico) < 0) pers.push(a.periodico); });
  document.getElementById('st-per').textContent = pers.length;
  applyLang();
})();
