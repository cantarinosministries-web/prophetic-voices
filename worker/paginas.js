// Monta as páginas públicas da revista a partir do banco, dentro dos modelos gerados pelo Astro.

const DOM = 'https://thepropheticvoices.com.br';
const AREA_EN = { 'Antigo Testamento': 'Old Testament', 'Novo Testamento': 'New Testament', 'Teologia bíblica': 'Biblical theology', 'História': 'History' };

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function paraPublico(a) {
  let kw = [];
  try { kw = JSON.parse(a.palavras_chave || '[]'); } catch (e) {}
  return {
    slug: a.slug, titulo: a.titulo, tituloOriginal: a.titulo_original || '', autor: a.autor, afiliacao: a.afiliacao || '',
    tradutor: a.tipo === 'traducao' ? a.tradutor || '' : '', periodico: a.periodico || '', volume: a.volume || '', numero: a.numero || '',
    ano: a.ano || '', paginasOriginal: a.paginas_original || '', editoraOriginal: a.editora_original || '',
    area: a.area, areaEn: AREA_EN[a.area] || a.area, tema: a.tema || '', temaEn: a.tema_en || a.tema || '',
    resumo: a.resumo || '', resumoEn: a.resumo_en || a.resumo || '', palavrasChave: kw,
    url: `/artigos/${a.slug}.html`, pdf: a.pdf_url || '', capa: a.capa_url || '/media/symbol-creme.png',
  };
}

async function modelo(env, req, caminho) {
  let url = new URL(caminho, req.url);
  for (let i = 0; i < 3; i++) {
    const r = await env.ASSETS.fetch(new Request(url.toString(), { method: 'GET' }));
    if (r.status >= 300 && r.status < 400 && r.headers.get('Location')) { url = new URL(r.headers.get('Location'), url); continue; }
    if (!r.ok) throw new Error('modelo não encontrado: ' + caminho);
    return r.text();
  }
  throw new Error('redirecionamentos demais: ' + caminho);
}

function preencher(t, { titulo, descricao, head = '', main = '', scripts = '' }) {
  return t
    .replace(/__PV_TITLE__/g, esc(titulo))
    .replace(/__PV_DESC__/g, esc(descricao))
    .replace(/<pv-slot data-k="?head"?><\/pv-slot>/, head)
    .replace(/<pv-slot data-k="?main"?><\/pv-slot>/, main)
    .replace(/<pv-slot data-k="?scripts"?><\/pv-slot>/, scripts);
}

const ogTags = (t, d, u) =>
  `<link rel="canonical" href="${u}"><meta property="og:type" content="article"><meta property="og:title" content="${esc(t)}"><meta property="og:description" content="${esc(d)}"><meta property="og:url" content="${u}">`;

// ---------------------------------------------------------------- lista
export async function paginaLista(env, req, artigos, bloqueado = false) {
  const t = await modelo(env, req, '/artigos.html');
  const pub = artigos.map(paraPublico);
  const autores = new Set(pub.map((a) => a.autor)).size;
  const pers = new Set(pub.map((a) => a.periodico).filter(Boolean)).size;
  const ld = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Artigos — The Prophetic Voices',
    hasPart: pub.map((a) => ({ '@type': 'ScholarlyArticle', headline: a.titulo, author: { '@type': 'Person', name: a.autor }, url: DOM + a.url })) };
  const noscript = pub.map((a) => `<li><a href="${a.url}">${esc(a.titulo)}</a> — ${esc(a.autor)} (${esc(a.ano)})</li>`).join('');
  const main = `
<section class="mag-hero">
  <div class="wrap">
    <div>
      <div class="eyebrow" data-i18n="hero_eyebrow">Revista The Prophetic Voices</div>
      <h1>Artigos<em data-i18n="hero_sub">estudos em profetismo bíblico</em></h1>
      <p class="lede" data-i18n="hero_lede">Artigos produzidos ou traduzidos pela equipe do Prophetic Voices, com rigor acadêmico e sensibilidade ao Espírito. Um acervo que cresce até se tornar periódico, aberto no futuro a pesquisadores de todo o Brasil.</p>
      <div class="stats">
        <div><b id="st-art">${pub.length}</b><span data-i18n="st_art">artigos</span></div>
        <div><b id="st-aut">${autores}</b><span data-i18n="st_aut">autores</span></div>
        <div><b id="st-per">${pers}</b><span data-i18n="st_per">periódicos</span></div>
      </div>
    </div>
  </div>
  <a href="#acervo" class="scroll-cue" data-i18n="scroll">ACERVO ↓</a>
</section>
<section class="finder" id="acervo" aria-label="Busca">
  <div class="wrap">
    <label class="search"><span class="sr" data-i18n="search_lbl">Buscar no acervo</span>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input id="q" type="search" autocomplete="off" placeholder="Buscar por título, autor, tema ou passagem…" data-i18n-ph="search_ph">
      <kbd>/</kbd><button type="button" class="clear" data-i18n="clear">LIMPAR</button>
    </label>
    <div class="filters">
      <div class="fgroup"><span class="flabel" data-i18n="f_area">Área</span><span id="f-area" style="display:contents"></span></div>
      <label class="sort"><span class="eyebrow" style="color:#8C7D6E" data-i18n="sort">Ordenar</span>
        <select id="ordem"><option value="ano" data-i18n="s_recent">Mais antigo primeiro</option><option value="novo" data-i18n="s_new">Mais recente primeiro</option><option value="titulo" data-i18n="s_title">Título (A–Z)</option><option value="autor" data-i18n="s_author">Autor (A–Z)</option></select>
      </label>
    </div>
  </div>
</section>
<section class="results">
  <div class="wrap">
    <div class="count" id="count" aria-live="polite"></div>
    <div class="art-list" id="lista"><noscript><ul>${noscript}</ul></noscript></div>
    <div class="empty" id="empty"><h3 data-i18n="empty_h">Nenhum artigo encontrado</h3><p data-i18n="empty_p">Tente outro termo ou limpe os filtros.</p></div>
    <div class="authors">
      <div class="eyebrow" data-i18n="authors_e">Índice</div>
      <h2 data-i18n="authors_h">Autores do acervo</h2>
      <div class="author-grid" id="autores"></div>
    </div>
  </div>
</section>`;
  const dados = JSON.stringify(pub).replace(/</g, '\\u003c');
  return preencher(t, {
    titulo: 'Artigos — The Prophetic Voices',
    descricao: 'Revista The Prophetic Voices: artigos e traduções em profetismo bíblico. Busque por título, autor ou tema.',
    head: ogTags('Artigos — The Prophetic Voices', 'Revista The Prophetic Voices: artigos e traduções em profetismo bíblico.', DOM + '/artigos.html') +
      `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`,
    main,
    scripts: `<script>window.PV_ARTIGOS=${dados};${bloqueado ? 'window.PV_CADASTRO=true;' : ''}</script><script src="/revista/revista.js"></script>`,
  });
}

// ---------------------------------------------------------------- artigo
export async function paginaArtigo(env, req, a, relacionados, previa, numeros, comentarios = false, bloqueado = false) {
  const t = await modelo(env, req, '/artigos/modelo.html');
  const p = paraPublico(a);
  const trad = a.tipo === 'traducao' && a.tradutor;
  const mes = a.mes ? `${a.mes} ` : '';
  const fonte = a.periodico ? `${esc(a.periodico)}${a.volume ? `, vol. ${esc(a.volume)}` : ''}${a.numero ? `, nº ${esc(a.numero)}` : ''}${a.ano ? ` (${esc(mes)}${esc(a.ano)})` : ''}${a.paginas_original ? `, pp. ${esc(a.paginas_original)}` : ''}` : '';
  const citAutor = a.autor_citacao || a.autor;
  const citacao = trad
    ? `${citAutor} ${a.titulo}. Tradução de ${a.tradutor}. The Prophetic Voices, ${(a.publicado_em || '').slice(0, 4) || '2026'}.${a.periodico ? ` Original: ${a.periodico}${a.volume ? `, v. ${a.volume}` : ''}${a.numero ? `, n. ${a.numero}` : ''}${a.paginas_original ? `, p. ${a.paginas_original}` : ''}, ${mes}${a.ano}.` : ''}`
    : `${citAutor} ${a.titulo}. Revista The Prophetic Voices, ${(a.publicado_em || '').slice(0, 4) || a.ano || '2026'}.`;
  const autorLink = `/artigos.html?autor=${encodeURIComponent(a.autor)}#acervo`;
  const kw = p.palavrasChave.map((k) => `<a href="/artigos.html?q=${encodeURIComponent(k)}#acervo">${esc(k)}</a>`).join('');
  const rel = relacionados.slice(0, 4).map((b) => `<a href="/artigos/${b.slug}.html">${esc(b.titulo)}<small>${esc(b.autor)} · ${esc(b.ano || '')}</small></a>`).join('');
  const pub = a.publicado_em ? new Date(a.publicado_em.replace(' ', 'T') + 'Z') : null;
  const dataPt = pub ? pub.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Fortaleza' }) : '—';
  const dataEn = pub ? pub.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Fortaleza' }) : '—';
  const pdf = a.pdf_url;
  const urlPag = `${DOM}/artigos/${a.slug}.html`;
  const pg = (a.paginas_original || '').split(/[–-]/);
  const meta = [
    ['citation_title', a.titulo], ['citation_author', a.autor], ['citation_publication_date', a.ano],
    ['citation_online_date', (a.publicado_em || '').slice(0, 10).replace(/-/g, '/')], ['citation_journal_title', 'Revista The Prophetic Voices'],
    ['citation_publisher', 'The Prophetic Voices'], ['citation_language', 'pt'], ['citation_pdf_url', pdf ? DOM + pdf : ''],
    ['citation_abstract_html_url', urlPag], ['citation_keywords', p.palavrasChave.join('; ')],
    ['citation_firstpage', pg[0] || ''], ['citation_lastpage', pg[1] || ''], ['DC.contributor', trad ? a.tradutor : ''],
  ].filter((m) => m[1]).map((m) => `<meta name="${m[0]}" content="${esc(m[1])}">`).join('');
  const ld = { '@context': 'https://schema.org', '@type': 'ScholarlyArticle', headline: a.titulo, alternativeHeadline: a.titulo_original || undefined,
    author: { '@type': 'Person', name: a.autor, affiliation: a.afiliacao || undefined }, translator: trad ? { '@type': 'Person', name: a.tradutor } : undefined,
    inLanguage: 'pt-BR', abstract: a.resumo, keywords: p.palavrasChave, datePublished: (a.publicado_em || '').slice(0, 10), url: urlPag,
    publisher: { '@type': 'Organization', name: 'The Prophetic Voices' },
    isBasedOn: a.periodico ? { '@type': 'ScholarlyArticle', name: a.titulo_original || a.titulo, datePublished: a.ano, isPartOf: { '@type': 'Periodical', name: a.periodico }, sameAs: a.url_original || undefined } : undefined,
    encoding: pdf ? { '@type': 'MediaObject', contentUrl: DOM + pdf, encodingFormat: 'application/pdf' } : undefined };
  const faixa = previa ? `<div style="position:sticky;top:76px;z-index:30;background:var(--cobre);color:#000;text-align:center;font:500 13px var(--sans);padding:10px">PRÉVIA · este artigo está como “${esc(a.status)}” e não aparece para o público · <a href="/admin.html#artigo/${a.id}" style="text-decoration:underline">voltar ao painel</a></div>` : '';
  const linhas = [
    ['m_author', 'Autor', `<a href="${autorLink}">${esc(a.autor)}</a>`],
    a.titulo_original && ['m_orig', 'Título original', `<i>${esc(a.titulo_original)}</i>`],
    a.periodico && ['m_journal', 'Periódico', `${esc(a.periodico)}${a.volume ? `, vol. ${esc(a.volume)}` : ''}${a.numero ? `, nº ${esc(a.numero)}` : ''}`],
    a.ano && ['m_year', 'Ano', esc(a.ano)],
    a.paginas_original && ['m_pages', 'Páginas (original)', esc(a.paginas_original)],
    a.editora_original && ['m_pub', 'Editora original', esc(a.editora_original)],
    trad && ['m_trans', 'Tradução', esc(a.tradutor)],
    ['m_lang', 'Idioma', '<span data-i18n="m_lang_v">Português</span>'],
    ['m_date', 'Publicado na revista', `<span data-pt="${esc(dataPt)}" data-en="${esc(dataEn)}">${esc(dataPt)}</span>`],
    numeros && numeros.acessos + numeros.downloads > 0 && ['m_views', 'Acessos', `<span data-pt="${numeros.acessos.toLocaleString('pt-BR')}" data-en="${numeros.acessos.toLocaleString('en-US')}">${numeros.acessos.toLocaleString('pt-BR')}</span>`],
    numeros && numeros.acessos + numeros.downloads > 0 && ['m_dls', 'Downloads do PDF', `<span data-pt="${numeros.downloads.toLocaleString('pt-BR')}" data-en="${numeros.downloads.toLocaleString('en-US')}">${numeros.downloads.toLocaleString('pt-BR')}</span>`],
    a.url_original && ['m_stable', 'Original', `<a href="${esc(a.url_original)}" target="_blank" rel="noopener">${esc(a.url_original.replace(/^https?:\/\/(www\.)?/, '').replace('jstor.org/stable/', 'JSTOR '))} ↗</a>`],
  ].filter(Boolean).map((l) => `<dt data-i18n="${l[0]}">${l[1]}</dt><dd>${l[2]}</dd>`).join('');
  const main = `${faixa}
<article>
  <div class="art-head"><div class="wrap">
    <div class="crumbs"><a href="/artigos.html" data-i18n="nav_articles">Artigos</a><span aria-hidden="true">/</span><a href="${autorLink}">${esc(a.autor)}</a>${a.periodico ? `<span aria-hidden="true">/</span><span>${esc(a.periodico)} · ${esc(a.ano)}</span>` : ''}</div>
    <div class="eyebrow" style="margin-top:28px" data-pt="${esc(a.area + (a.tema ? ' · ' + a.tema : ''))}" data-en="${esc(p.areaEn + (p.temaEn ? ' · ' + p.temaEn : ''))}">${esc(a.area)}${a.tema ? ' · ' + esc(a.tema) : ''}</div>
    <h1 class="art-title">${esc(a.titulo)}</h1>
    ${a.titulo_original ? `<p class="art-orig">${esc(a.titulo_original)}</p>` : ''}
    <p class="art-author"><a href="${autorLink}">${esc(a.autor)}</a>${a.afiliacao ? ` <span>· ${esc(a.afiliacao)}</span>` : ''}</p>
    ${fonte || trad ? `<p class="art-src">${fonte}${fonte && trad ? ' · ' : ''}${trad ? `<span data-i18n="m_trans">Tradução</span>: ${esc(a.tradutor)}` : ''}</p>` : ''}
    <div class="art-actions">
      ${pdf ? `<a href="#leitor" class="btn btn-creme"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H2z"/><path d="M22 5h-7a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h8z"/></svg><span data-i18n="read_on">Ler online</span></a>
      <a href="${bloqueado ? '#leitor' : esc(pdf)}"${bloqueado ? ' data-cadastro' : ' download'} class="btn btn-ghost"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3v12m0 0-5-5m5 5 5-5"/><path d="M4 19h16"/></svg><span data-i18n="dl">Baixar PDF</span>${a.pdf_paginas ? ` <small style="opacity:.7">(${a.pdf_paginas} p.)</small>` : ''}</a>` : ''}
      <button type="button" class="btn btn-ghost" id="citeBtn"><span data-i18n="cite">Copiar citação</span></button>
    </div>
  </div></div>
  <div class="wrap art-body">
    <div class="art-main">
      <section class="art-block">
        <h2 data-i18n="abs_h">Resumo</h2>
        <p data-pt="${esc(a.resumo)}" data-en="${esc(p.resumoEn)}">${esc(a.resumo)}</p>
        ${a.resumo_editorial ? '<p class="art-note" data-i18n="abs_note">Resumo editorial da The Prophetic Voices; o artigo original não tem resumo.</p>' : ''}
        <div class="kw2" aria-label="Palavras-chave">${kw}</div>
      </section>
      ${pdf && bloqueado ? `<section class="art-block" id="leitor">
        <div class="gate" id="gate" data-volta="/artigos/${esc(a.slug)}.html#leitor">
          <div class="gate-ico" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H2z"/><path d="M22 5h-7a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h8z"/></svg></div>
          <h2 data-pt="Leitura e download gratuitos" data-en="Free reading and download">Leitura e download gratuitos</h2>
          <p class="gate-lede" data-pt="Para ler este artigo na íntegra ou baixar o PDF, faça seu login ou cadastro abaixo. A leitura, o download e o cadastro são totalmente gratuitos." data-en="To read this article in full or download the PDF, sign in or create your account below. Reading, downloading and signing up are completely free.">Para ler este artigo na íntegra ou baixar o PDF, faça seu login ou cadastro abaixo. A leitura, o download e o cadastro são totalmente gratuitos.</p>
          <div class="gate-botoes" id="gateBotoes"><a class="btn btn-creme" href="/entrar.html?motivo=leitura&amp;volta=${encodeURIComponent('/artigos/' + a.slug + '.html#leitor')}" data-pt="Entrar ou criar conta" data-en="Sign in or create an account">Entrar ou criar conta</a></div>
          <p class="gate-nota"><span data-pt="Use a conta que preferir. Guardamos apenas seu nome e e-mail; o e-mail nunca aparece no site." data-en="Use whichever account you prefer. We only keep your name and e-mail; your e-mail never appears on the site.">Use a conta que preferir. Guardamos apenas seu nome e e-mail; o e-mail nunca aparece no site.</span> <a href="/privacidade.html" data-pt="Política de Privacidade" data-en="Privacy Policy">Política de Privacidade</a></p>
        </div>
      </section>` : ''}
      ${pdf && !bloqueado ? `<section class="art-block" id="leitor">
        <div class="reader-bar"><h2 data-i18n="reader_h">Leitura</h2><a href="${esc(pdf)}" target="_blank" rel="noopener" class="reader-open" data-i18n="open">Abrir em tela cheia ↗</a></div>
        <div class="reader"><iframe src="${esc(pdf)}#view=FitH" title="${esc(a.titulo)} — PDF" loading="lazy"></iframe></div>
        <p class="art-note"><span data-i18n="fb1">Se o documento não aparecer no seu aparelho,</span> <a href="${esc(pdf)}" target="_blank" rel="noopener" data-i18n="fb2">abra o PDF aqui</a>.</p>
      </section>` : ''}
      ${comentarios ? `<section class="art-block coments" id="comentarios" data-slug="${esc(a.slug)}" aria-labelledby="com-h">
        <h2 id="com-h" data-i18n="com_h">Comentários</h2>
        <p class="art-note" data-i18n="com_note">Os comentários passam pela equipe editorial antes de aparecer.</p>
        <div class="com-lista" id="comLista" aria-live="polite"></div>
        <div class="com-form" id="comForm"></div>
      </section>` : ''}
    </div>
    <aside class="art-side" aria-label="Informações do artigo">
      <div class="meta-card">
        <img src="${esc(p.capa)}" alt="Primeira página do artigo" width="300" height="424" loading="lazy">
        <dl>${linhas}</dl>
        ${a.direitos ? `<p class="rights">${esc(a.direitos)}</p>` : ''}
      </div>
      <div class="meta-card cite"><h3 data-i18n="cite_h">Como citar</h3><p id="citeText">${esc(citacao)}</p></div>
      ${rel ? `<div class="meta-card related"><h3 data-i18n="rel_h">Leia também</h3>${rel}</div>` : ''}
    </aside>
  </div>
</article>`;
  return preencher(t, {
    titulo: `${a.titulo} — ${a.autor} | The Prophetic Voices`,
    descricao: (a.resumo || '').slice(0, 280),
    head: (previa ? '<meta name="robots" content="noindex">' : '') + ogTags(a.titulo, (a.resumo || '').slice(0, 280), urlPag) + meta +
      `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`,
    main,
    scripts: '<script src="/revista/revista.js"></script>' + (comentarios ? '<script src="/conta/botoes.js"></script><script src="/revista/comentarios.js"></script>' : '') + (bloqueado ? '<script src="/revista/cadastro.js"></script>' : ''),
  });
}
