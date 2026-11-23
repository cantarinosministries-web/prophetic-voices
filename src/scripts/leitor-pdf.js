// The Prophetic Voices — leitor de PDF próprio da página do artigo (pdf.js).
// - mostra as páginas com texto selecionável;
// - "Guardar citação": o trecho selecionado vai para a Biblioteca do leitor, com a página;
// - "Continuar lendo": com o histórico ligado pelo próprio leitor, lembra a página em que ele parou.
// O pdf.js só é baixado quando a página tem o leitor (#pdfLeitor). Se algo falhar, volta ao visualizador do navegador.

const TXT = {
  pt: {
    carregando: 'Carregando o artigo…', pag: 'Página', de: 'de', ant: 'Página anterior', prox: 'Próxima página', menos: 'Diminuir', mais: 'Aumentar',
    cheia: 'Tela cheia', sair_cheia: 'Sair da tela cheia', guardar: 'Guardar citação', guardada: 'Citação guardada na sua biblioteca.', ver_bib: 'Ver na biblioteca',
    entrar_cit: 'Entre na sua conta para guardar citações na sua biblioteca.', entrar: 'Entrar', copiar: 'Copiar com referência', copiado: 'Trecho copiado com a referência.',
    parou: 'Você parou na página {p}.', continuar: 'Continuar de onde parei', fechar: 'Fechar',
    hist_p: 'Quer que o site lembre a página em que você parou, neste e nos outros artigos? Só você vê isso, na sua Biblioteca, e pode desligar ou apagar quando quiser.',
    hist_sim: 'Sim, lembrar', hist_nao: 'Agora não', hist_ok: 'Pronto: vamos lembrar onde você parou.', saiba: 'Como funciona'
  },
  en: {
    carregando: 'Loading the article…', pag: 'Page', de: 'of', ant: 'Previous page', prox: 'Next page', menos: 'Zoom out', mais: 'Zoom in',
    cheia: 'Full screen', sair_cheia: 'Exit full screen', guardar: 'Save quotation', guardada: 'Quotation saved to your library.', ver_bib: 'See in library',
    entrar_cit: 'Sign in to save quotations to your library.', entrar: 'Sign in', copiar: 'Copy with reference', copiado: 'Excerpt copied with its reference.',
    parou: 'You stopped on page {p}.', continuar: 'Continue where I stopped', fechar: 'Close',
    hist_p: 'Would you like the site to remember the page where you stopped, in this and other articles? Only you see it, in your Library, and you can turn it off or erase it anytime.',
    hist_sim: 'Yes, remember', hist_nao: 'Not now', hist_ok: 'Done: we will remember where you stopped.', saiba: 'How it works'
  }
};
const lingua = () => { try { return localStorage.getItem('pv-lang') === 'en' ? 'en' : 'pt'; } catch (e) { return 'pt'; } };
const t = (k) => (TXT[lingua()] || TXT.pt)[k] || TXT.pt[k] || k;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const api = (caminho, metodo, corpo) => fetch('/api' + caminho, {
  method: metodo || 'GET', credentials: 'same-origin',
  headers: corpo ? { 'X-PV': '1', 'Content-Type': 'application/json' } : { 'X-PV': '1' },
  body: corpo ? JSON.stringify(corpo) : undefined, keepalive: metodo === 'POST',
}).then((r) => r.json().catch(() => ({})).then((d) => { if (!r.ok) throw new Error(d.erro || 'Não foi possível concluir.'); return d; }));

function reserva(el, pdf, titulo) {
  el.classList.remove('pv-pdf');
  el.innerHTML = `<iframe src="${esc(pdf)}#view=FitH" title="${esc(titulo)} — PDF" loading="lazy"></iframe>`;
}

async function iniciar(el) {
  const pdfUrl = el.dataset.pdf, slug = el.dataset.slug, titulo = el.dataset.titulo || '';
  el.classList.add('pv-pdf');
  el.innerHTML = `
    <div class="pv-bar" role="toolbar">
      <div class="pv-nav">
        <button type="button" class="pv-b" data-a="ant" aria-label="${t('ant')}">‹</button>
        <label class="pv-pg"><span class="sr">${t('pag')}</span><input type="text" inputmode="numeric" value="1" aria-label="${t('pag')}"> <span>${t('de')} <b class="pv-tot">…</b></span></label>
        <button type="button" class="pv-b" data-a="prox" aria-label="${t('prox')}">›</button>
      </div>
      <div class="pv-nav">
        <button type="button" class="pv-b" data-a="menos" aria-label="${t('menos')}">−</button>
        <span class="pv-zoom">100%</span>
        <button type="button" class="pv-b" data-a="mais" aria-label="${t('mais')}">+</button>
        <button type="button" class="pv-b pv-cheia" data-a="cheia" aria-label="${t('cheia')}" title="${t('cheia')}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>
      </div>
    </div>
    <div class="pv-aviso" hidden></div>
    <div class="pv-rolo" tabindex="0"><p class="pv-carregando">${t('carregando')}</p></div>
    <div class="pv-sel" hidden></div>`;
  const rolo = el.querySelector('.pv-rolo'), aviso = el.querySelector('.pv-aviso'), sel = el.querySelector('.pv-sel');
  const inPag = el.querySelector('.pv-pg input'), totEl = el.querySelector('.pv-tot'), zoomEl = el.querySelector('.pv-zoom');

  let pdfjs, doc;
  try {
    pdfjs = await import('pdfjs-dist');
    const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    // X-PV-Leitor: a leitura na própria página não conta como download nas estatísticas
    doc = await pdfjs.getDocument({ url: pdfUrl, httpHeaders: { 'X-PV-Leitor': '1' }, isEvalSupported: false }).promise;
  } catch (e) {
    console.error('leitor de PDF', e);
    reserva(el, pdfUrl, titulo);
    return;
  }

  const total = doc.numPages;
  totEl.textContent = total;
  const p1 = await doc.getPage(1);
  const base = p1.getViewport({ scale: 1 });
  let zoom = 1, escala = 1, atual = 1;
  const paginas = [];
  rolo.innerHTML = '';
  for (let i = 1; i <= total; i++) {
    const d = document.createElement('div');
    d.className = 'pv-pag';
    d.dataset.n = i;
    d.innerHTML = `<span class="pv-num">${i}</span>`;
    rolo.appendChild(d);
    paginas.push({ el: d, feita: 0 });
  }

  const larguraUtil = () => Math.max(260, rolo.clientWidth - (window.innerWidth < 600 ? 16 : 48));
  function medir() {
    escala = (larguraUtil() / base.width) * zoom;
    paginas.forEach((p) => {
      p.el.style.width = Math.floor(base.width * escala) + 'px';
      p.el.style.height = Math.floor(base.height * escala) + 'px';
      p.el.style.setProperty('--scale-factor', escala);
    });
    zoomEl.textContent = Math.round(zoom * 100) + '%';
  }

  let geracao = 0;
  async function desenhar(p, n) {
    const minha = geracao;
    if (p.feita === minha + 1) return;
    p.feita = minha + 1;
    const page = await doc.getPage(n);
    if (minha !== geracao) return;
    const vp = page.getViewport({ scale: escala });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(vp.width * dpr);
    canvas.height = Math.floor(vp.height * dpr);
    canvas.style.width = Math.floor(vp.width) + 'px';
    canvas.style.height = Math.floor(vp.height) + 'px';
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport: vp, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null }).promise;
    if (minha !== geracao) return;
    const camada = document.createElement('div');
    camada.className = 'textLayer';
    p.el.querySelectorAll('canvas,.textLayer').forEach((x) => x.remove());
    p.el.appendChild(canvas);
    p.el.appendChild(camada);
    try {
      await new pdfjs.TextLayer({ textContentSource: page.streamTextContent(), container: camada, viewport: vp }).render();
    } catch (e) { /* sem camada de texto: a página continua legível */ }
  }

  const obs = new IntersectionObserver((ents) => {
    ents.forEach((en) => { if (en.isIntersecting) { const n = +en.target.dataset.n; desenhar(paginas[n - 1], n); } });
  }, { root: rolo, rootMargin: '800px 0px' });
  medir();
  paginas.forEach((p) => obs.observe(p.el));

  function refazer() {
    geracao++;
    paginas.forEach((p) => { p.feita = 0; p.el.querySelectorAll('canvas,.textLayer').forEach((x) => x.remove()); });
    const alvo = atual;
    medir();
    irPara(alvo, false);
    paginas.forEach((p) => { obs.unobserve(p.el); obs.observe(p.el); });
  }

  function irPara(n, suave = true) {
    n = Math.max(1, Math.min(total, n | 0));
    rolo.scrollTo({ top: paginas[n - 1].el.offsetTop - 8, behavior: suave ? 'smooth' : 'auto' });
  }

  // página atual = a que ocupa o terço de cima da área visível
  let tRolo;
  rolo.addEventListener('scroll', () => {
    clearTimeout(tRolo);
    tRolo = setTimeout(() => {
      const ref = rolo.scrollTop + rolo.clientHeight * 0.33;
      let n = 1;
      for (const p of paginas) { if (p.el.offsetTop <= ref) n = +p.el.dataset.n; else break; }
      if (n !== atual) { atual = n; inPag.value = n; guardarProgresso(); }
    }, 120);
  }, { passive: true });

  el.querySelector('.pv-bar').addEventListener('click', (e) => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const a = b.dataset.a;
    if (a === 'ant') irPara(atual - 1);
    if (a === 'prox') irPara(atual + 1);
    if (a === 'menos' && zoom > 0.5) { zoom = Math.round((zoom - 0.25) * 100) / 100; refazer(); }
    if (a === 'mais' && zoom < 3) { zoom = Math.round((zoom + 0.25) * 100) / 100; refazer(); }
    if (a === 'cheia') {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (el.requestFullscreen) el.requestFullscreen().catch(() => window.open(pdfUrl, '_blank', 'noopener'));
      else window.open(pdfUrl, '_blank', 'noopener');
    }
  });
  inPag.addEventListener('change', () => irPara(parseInt(inPag.value, 10) || 1));
  inPag.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); irPara(parseInt(inPag.value, 10) || 1); } });
  rolo.addEventListener('keydown', (e) => {
    if (e.target !== rolo) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); irPara(atual + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); irPara(atual - 1); }
  });
  document.addEventListener('fullscreenchange', () => { el.classList.toggle('pv-full', document.fullscreenElement === el); setTimeout(refazer, 80); });
  let larg = rolo.clientWidth, tRes;
  window.addEventListener('resize', () => { clearTimeout(tRes); tRes = setTimeout(() => { if (Math.abs(rolo.clientWidth - larg) > 30) { larg = rolo.clientWidth; refazer(); } }, 250); });

  // ---------- estado do leitor (salvo, histórico, onde parou) ----------
  const estado = await (window.PV_ESTADO || Promise.resolve({ logado: false, provedores: [] })).catch(() => ({ logado: false, provedores: [] }));

  function mostrarAviso(html, ligar) {
    aviso.innerHTML = html + `<button type="button" class="pv-x" aria-label="${t('fechar')}">×</button>`;
    aviso.hidden = false;
    aviso.querySelector('.pv-x').onclick = () => { aviso.hidden = true; };
    if (ligar) ligar(aviso);
  }

  let tProg;
  function guardarProgresso() {
    if (!estado.logado || estado.historico !== 1) return;
    clearTimeout(tProg);
    tProg = setTimeout(() => { api('/conta/progresso/' + encodeURIComponent(slug), 'POST', { pagina: atual, total }).catch(() => {}); }, 2500);
  }

  if (estado.logado && estado.historico === 1 && estado.progresso && estado.progresso.pagina > 1 && estado.progresso.pagina <= total) {
    const pg = estado.progresso.pagina;
    mostrarAviso(`<span>${esc(t('parou').replace('{p}', pg))}</span><button type="button" class="pv-lnk" data-ir>${t('continuar')}</button>`, (av) => {
      av.querySelector('[data-ir]').onclick = () => { av.hidden = true; irPara(pg); };
    });
  } else if (estado.logado && estado.historico == null) {
    mostrarAviso(`<span>${esc(t('hist_p'))} <a href="/privacidade.html#leitura" target="_blank" rel="noopener">${t('saiba')}</a></span><span class="pv-acoes"><button type="button" class="pv-lnk" data-h="1">${t('hist_sim')}</button><button type="button" class="pv-lnk pv-fraco" data-h="0">${t('hist_nao')}</button></span>`, (av) => {
      av.querySelectorAll('[data-h]').forEach((b) => {
        b.onclick = () => {
          const ligar = b.dataset.h === '1';
          api('/conta/historico', 'POST', { ligar }).then((r) => {
            estado.historico = r.historico;
            if (ligar) { av.innerHTML = `<span>${t('hist_ok')}</span>`; setTimeout(() => { av.hidden = true; }, 2500); guardarProgresso(); } else av.hidden = true;
          }).catch(() => { av.hidden = true; });
        };
      });
    });
  }

  // ---------- citações: selecionar um trecho e guardar na Biblioteca ----------
  const temLogin = estado.provedores && estado.provedores.length > 0;
  let trecho = '', pagTrecho = 1;
  function esconderSel() { sel.hidden = true; }
  function avaliarSelecao() {
    const s = window.getSelection();
    const txt = s && !s.isCollapsed ? s.toString().replace(/\s+/g, ' ').trim() : '';
    if (!txt || txt.length < 2 || !rolo.contains(s.anchorNode)) { esconderSel(); return; }
    const pag = (s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentElement).closest('.pv-pag');
    trecho = txt.slice(0, 3000);
    pagTrecho = pag ? +pag.dataset.n : atual;
    const r = s.getRangeAt(0).getBoundingClientRect(), caixa = el.getBoundingClientRect();
    sel.innerHTML = (temLogin ? `<button type="button" data-c="guardar">${t('guardar')} · p. ${pagTrecho}</button>` : '') + `<button type="button" data-c="copiar">${t('copiar')}</button>`;
    sel.hidden = false;
    const top = Math.max(r.top - caixa.top - sel.offsetHeight - 10, 56);
    const left = Math.min(Math.max(r.left - caixa.left + r.width / 2 - sel.offsetWidth / 2, 8), caixa.width - sel.offsetWidth - 8);
    sel.style.top = top + 'px';
    sel.style.left = left + 'px';
  }
  let tSel;
  document.addEventListener('selectionchange', () => { clearTimeout(tSel); tSel = setTimeout(avaliarSelecao, 350); });
  rolo.addEventListener('scroll', esconderSel, { passive: true });
  sel.addEventListener('mousedown', (e) => e.preventDefault()); // não perde a seleção ao clicar
  sel.addEventListener('click', (e) => {
    const b = e.target.closest('[data-c]');
    if (!b) return;
    if (b.dataset.c === 'copiar') {
      const ref = (document.getElementById('citeText') || {}).getAttribute ? document.getElementById('citeText').getAttribute('data-abnt') : '';
      const texto = `“${trecho}” (p. ${pagTrecho})${ref ? '\n\n' + ref : ''}`;
      (navigator.clipboard ? navigator.clipboard.writeText(texto) : Promise.reject()).then(() => mostrarAviso(`<span>${t('copiado')}</span>`), () => {});
      esconderSel();
      return;
    }
    if (!estado.logado) {
      mostrarAviso(`<span>${t('entrar_cit')}</span><a class="pv-lnk" href="/entrar.html?volta=${encodeURIComponent(location.pathname + '#leitor')}">${t('entrar')}</a>`);
      esconderSel();
      return;
    }
    b.disabled = true;
    api('/conta/citacoes', 'POST', { slug, trecho, pagina: pagTrecho }).then((r) => {
      mostrarAviso(`<span>${t('guardada')} <b>${esc(r.chamada || '')}</b></span><a class="pv-lnk" href="/conta.html#citacoes">${t('ver_bib')}</a>`);
      window.getSelection().removeAllRanges();
      esconderSel();
    }).catch((er) => { mostrarAviso(`<span>${esc(er.message)}</span>`); b.disabled = false; });
  });
}

const raiz = document.getElementById('pdfLeitor');
if (raiz) iniciar(raiz);
