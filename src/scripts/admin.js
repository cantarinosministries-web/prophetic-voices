// Painel The Prophetic Voices — interface (sem bibliotecas; pdf.js só é carregado ao enviar um PDF).
const app = document.getElementById('app');
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let S = { usuario: null, permissoes: null, papeis: {} };

const STATUS = { rascunho: 'Rascunho', revisao: 'Em revisão', publicado: 'Publicado', arquivado: 'Arquivado' };
const AREAS = ['Antigo Testamento', 'Novo Testamento', 'Teologia bíblica', 'História'];
const ACOES_PAPEL = {
  proprietario: ['Tudo o que o administrador faz', 'Promove e rebaixa administradores e proprietários', 'Não pode ser alterado por administradores'],
  administrador: ['Convida usuários e define papéis abaixo de administrador', 'Desativa contas e gera links de nova senha', 'Vê o histórico completo', 'Faz tudo o que o editor faz e exclui qualquer artigo'],
  editor: ['Cria e edita qualquer artigo', 'Publica, tira do ar e arquiva', 'Comenta em todos os artigos'],
  autor: ['Cria artigos e envia PDF', 'Edita os próprios artigos enquanto estão em rascunho ou revisão', 'Envia para revisão; não publica', 'Comenta nos próprios artigos'],
  revisor: ['Lê todos os artigos, inclusive rascunhos', 'Comenta em todos os artigos', 'Não edita'],
  leitor: ['Lê todos os artigos, inclusive rascunhos', 'Não edita nem comenta'],
};

// ---------------------------------------------------------------- utilidades
async function api(caminho, opt = {}) {
  const r = await fetch('/api' + caminho, {
    method: opt.method || 'GET',
    headers: { 'X-PV': '1', ...(opt.body && !(opt.body instanceof Blob) ? { 'Content-Type': 'application/json' } : {}), ...(opt.headers || {}) },
    body: opt.body instanceof Blob ? opt.body : opt.body ? JSON.stringify(opt.body) : undefined,
    credentials: 'same-origin',
  });
  let d = {};
  try { d = await r.json(); } catch (e) {}
  if (r.status === 401 && !opt.publico) { S.usuario = null; mostrarMenu(); ir('entrar'); }
  if (!r.ok) throw new Error(d.erro || 'Não foi possível concluir.');
  return d;
}

function toast(msg, erro = false) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'on' + (erro ? ' err' : '');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (t.className = ''), 3200);
}

function data(s, comHora = true) {
  if (!s) return '—';
  const d = new Date(s.replace(' ', 'T') + 'Z');
  return d.toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', ...(comHora ? { hour: '2-digit', minute: '2-digit' } : {}) });
}

const ir = (r) => { if (location.hash !== '#' + r) location.hash = r; else rotear(); };
const nomePapel = (p) => (S.papeis[p] ? S.papeis[p].nome : p);

async function copiar(txt) {
  try { await navigator.clipboard.writeText(txt); toast('Link copiado.'); } catch (e) { toast('Selecione e copie o link manualmente.', true); }
}

function caixaLink(link, expira) {
  return `<div class="card" style="margin-top:14px;border-color:var(--cobre)">
    <h3>Link gerado · válido por ${esc(expira)}</h3>
    <p class="small muted">Envie este link para a pessoa (WhatsApp ou e-mail). Ele só funciona uma vez.</p>
    <div class="link-box"><input readonly value="${esc(link)}" onclick="this.select()"><button class="btn sm pri" data-copiar="${esc(link)}">Copiar</button></div>
    <a class="btn sm" style="margin-top:10px" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent('Seu acesso ao painel The Prophetic Voices: ' + link)}">Enviar pelo WhatsApp</a>
  </div>`;
}
document.addEventListener('click', (e) => { const b = e.target.closest('[data-copiar]'); if (b) copiar(b.dataset.copiar); });

function mostrarMenu() {
  const u = S.usuario;
  $('#menu').hidden = !u;
  $('#who').hidden = !u;
  if (!u) return;
  $('#whoName').innerHTML = `${esc(u.nome)} <span class="papel">${esc(nomePapel(u.papel))}</span>`;
  $$('#menu a').forEach((a) => { a.hidden = a.dataset.perm ? !S.permissoes[a.dataset.perm] : false; });
}
function marcarMenu(r) { $$('#menu a').forEach((a) => a.classList.toggle('on', a.dataset.r === r)); }

$('#sair').addEventListener('click', async () => {
  await api('/sair', { method: 'POST' }).catch(() => {});
  S.usuario = null; mostrarMenu(); ir('entrar');
});

// ---------------------------------------------------------------- telas sem login
function telaEntrar() {
  app.innerHTML = `<div class="auth"><div class="card">
    <h1>Entrar</h1><p class="muted small">Painel da revista The Prophetic Voices.</p>
    <form id="f" class="stack" style="margin-top:18px">
      <label class="f"><span>E-mail</span><input type="email" name="email" autocomplete="username" required autofocus></label>
      <label class="f"><span>Senha</span><input type="password" name="senha" autocomplete="current-password" required></label>
      <p class="err" id="err"></p>
      <button class="btn pri" type="submit">Entrar</button>
      <p class="small muted">Esqueceu a senha? Peça a um administrador um link para criar uma nova.</p>
    </form></div></div>`;
  $('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    try { await api('/entrar', { method: 'POST', body: d, publico: true }); await carregarSessao(); ir('artigos'); }
    catch (er) { $('#err').textContent = er.message; }
  });
}

function telaConfigurar(chaveOk) {
  app.innerHTML = `<div class="auth"><div class="card">
    <h1>Configurar</h1>
    <p class="muted small">Primeiro acesso: crie a conta do proprietário da plataforma.</p>
    ${chaveOk ? '' : '<p class="err">Falta definir a variável secreta CHAVE_CONFIGURACAO no Cloudflare (veja o guia de configuração).</p>'}
    <form id="f" class="stack" style="margin-top:18px">
      <label class="f"><span>Chave de configuração</span><input type="password" name="chave" required><small>A mesma que você definiu no Cloudflare.</small></label>
      <label class="f"><span>Seu nome</span><input name="nome" required></label>
      <label class="f"><span>E-mail</span><input type="email" name="email" autocomplete="username" required></label>
      <label class="f"><span>Senha (mínimo 10 caracteres)</span><input type="password" name="senha" minlength="10" autocomplete="new-password" required></label>
      <p class="err" id="err"></p>
      <button class="btn pri" type="submit">Criar conta de proprietário</button>
    </form></div></div>`;
  $('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    try { await api('/configurar', { method: 'POST', body: Object.fromEntries(new FormData(e.target)), publico: true }); await carregarSessao(); toast('Plataforma configurada.'); ir('artigos'); }
    catch (er) { $('#err').textContent = er.message; }
  });
}

async function telaConvite(token, tipo) {
  let c;
  try { c = (await api('/convite?token=' + encodeURIComponent(token), { publico: true })).convite; }
  catch (e) { app.innerHTML = `<div class="auth"><div class="card"><h1>Link inválido</h1><p class="muted">${esc(e.message)} Peça um novo link a um administrador.</p><a class="btn" href="#entrar">Ir para o login</a></div></div>`; return; }
  const novo = c.tipo === 'convite';
  app.innerHTML = `<div class="auth"><div class="card">
    <h1>${novo ? 'Bem-vindo' : 'Nova senha'}</h1>
    <p class="muted small">${novo ? `Você foi convidado como <b>${esc(c.papel_nome)}</b> na revista The Prophetic Voices.` : 'Crie uma nova senha para a sua conta.'}</p>
    <form id="f" class="stack" style="margin-top:18px">
      <label class="f"><span>E-mail</span><input value="${esc(c.email)}" disabled></label>
      ${novo ? `<label class="f"><span>Seu nome</span><input name="nome" value="${esc(c.nome || '')}" required></label>` : ''}
      <label class="f"><span>Senha (mínimo 10 caracteres)</span><input type="password" name="senha" minlength="10" autocomplete="new-password" required></label>
      <label class="f"><span>Repita a senha</span><input type="password" name="senha2" minlength="10" autocomplete="new-password" required></label>
      <p class="err" id="err"></p>
      <button class="btn pri" type="submit">${novo ? 'Criar minha conta' : 'Salvar nova senha'}</button>
    </form></div></div>`;
  $('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    if (d.senha !== d.senha2) { $('#err').textContent = 'As senhas não conferem.'; return; }
    try { await api('/convite', { method: 'POST', body: { token, nome: d.nome, senha: d.senha }, publico: true }); history.replaceState(null, '', location.pathname); await carregarSessao(); toast(novo ? 'Conta criada.' : 'Senha alterada.'); ir('artigos'); }
    catch (er) { $('#err').textContent = er.message; }
  });
}

// ---------------------------------------------------------------- artigos
let filtro = { status: '', q: '' };

async function telaArtigos() {
  marcarMenu('artigos');
  app.innerHTML = '<p class="muted center">Carregando artigos…</p>';
  const { artigos } = await api('/artigos');
  const cont = { '': artigos.length };
  for (const a of artigos) cont[a.status] = (cont[a.status] || 0) + 1;
  app.innerHTML = `
    <div class="head"><div><h1>Artigos</h1><p class="muted">${artigos.length} no acervo · ${cont.publicado || 0} publicados no site</p></div>
      ${S.permissoes.criar_artigo ? '<a class="btn pri" href="#artigo/novo">+ Novo artigo</a>' : ''}</div>
    <div class="filtros">
      ${['', 'rascunho', 'revisao', 'publicado', 'arquivado'].map((s) => `<button class="chip" data-s="${s}" aria-pressed="${filtro.status === s}">${s ? STATUS[s] : 'Todos'} <b>${cont[s] || 0}</b></button>`).join('')}
      <input type="search" id="busca" placeholder="Buscar título ou autor…" value="${esc(filtro.q)}">
    </div>
    <div class="card" style="padding:6px 12px"><table class="tb"><thead><tr><th></th><th>Título</th><th>Situação</th><th>Responsável</th><th>Atualizado</th></tr></thead><tbody id="lin"></tbody></table>
    <div class="empty" id="vazio" hidden>Nenhum artigo aqui.</div></div>`;
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const desenhar = () => {
    const q = norm(filtro.q);
    const r = artigos.filter((a) => (!filtro.status || a.status === filtro.status) && (!q || norm(a.titulo + ' ' + a.autor + ' ' + (a.tradutor || '')).includes(q)));
    $('#lin').innerHTML = r.map((a) => `<tr class="click" data-id="${a.id}">
      <td><img class="thumb" src="${esc(a.capa_url || '/media/symbol-creme.png')}" alt="" loading="lazy"></td>
      <td><div class="tt">${esc(a.titulo)}</div><div class="small muted">${esc(a.autor)}${a.ano ? ' · ' + esc(a.ano) : ''}${a.n_comentarios ? ` · ${a.n_comentarios} comentário${a.n_comentarios > 1 ? 's' : ''}` : ''}</div></td>
      <td><span class="st ${a.status}">${STATUS[a.status]}</span></td>
      <td class="small muted">${esc(a.criado_por_nome || 'Acervo inicial')}</td>
      <td class="small muted">${data(a.atualizado_em, false)}</td></tr>`).join('');
    $('#vazio').hidden = r.length > 0;
  };
  desenhar();
  $$('.chip').forEach((b) => b.addEventListener('click', () => { filtro.status = b.dataset.s; $$('.chip').forEach((x) => x.setAttribute('aria-pressed', x === b)); desenhar(); }));
  $('#busca').addEventListener('input', (e) => { filtro.q = e.target.value; desenhar(); });
  $('#lin').addEventListener('click', (e) => { const tr = e.target.closest('tr[data-id]'); if (tr) ir('artigo/' + tr.dataset.id); });
}

function campo(nome, rotulo, a, opt = {}) {
  const v = a[nome] ?? '';
  const cls = opt.s ? `f s${opt.s}` : 'f';
  const dica = opt.dica ? `<small>${opt.dica}</small>` : '';
  if (opt.area) return `<label class="${cls}"><span>${rotulo}</span><textarea name="${nome}" ${opt.req ? 'required' : ''} placeholder="${esc(opt.ph || '')}">${esc(v)}</textarea>${dica}</label>`;
  if (opt.sel) return `<label class="${cls}"><span>${rotulo}</span><select name="${nome}">${opt.sel.map((o) => `<option value="${esc(o[0])}" ${String(v) === o[0] ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select>${dica}</label>`;
  return `<label class="${cls}"><span>${rotulo}</span><input name="${nome}" value="${esc(v)}" ${opt.req ? 'required' : ''} placeholder="${esc(opt.ph || '')}" ${opt.tipo ? `type="${opt.tipo}"` : ''}>${dica}</label>`;
}

async function telaArtigo(id) {
  marcarMenu('artigos');
  let a = { tipo: 'traducao', area: 'Antigo Testamento', resumo_editorial: 1, palavras_chave: '[]', status: 'rascunho', tradutor: S.usuario.nome, pode: { editar: true } };
  const novo = id === 'novo';
  if (!novo) {
    app.innerHTML = '<p class="muted center">Carregando…</p>';
    a = (await api('/artigos/' + id)).artigo;
  } else if (!S.permissoes.criar_artigo) { toast('Seu papel não permite criar artigos.', true); return ir('artigos'); }
  let kw = [];
  try { kw = JSON.parse(a.palavras_chave || '[]'); } catch (e) {}
  const ed = novo || a.pode.editar;
  app.innerHTML = `
    <p class="small"><a href="#artigos" class="lnk">← Artigos</a></p>
    <div class="head"><div><h1>${novo ? 'Novo artigo' : esc(a.titulo)}</h1>
      ${novo ? '<p class="muted">Preencha os dados, salve e depois envie o PDF.</p>' : `<p class="muted"><span class="st ${a.status}">${STATUS[a.status]}</span> &nbsp; criado por ${esc(a.criado_por_nome || 'acervo inicial')} · atualizado ${data(a.atualizado_em)}${a.atualizado_por_nome ? ' por ' + esc(a.atualizado_por_nome) : ''}</p>`}</div>
      ${!novo ? `<a class="btn" target="_blank" rel="noopener" href="/artigos/${esc(a.slug)}.html">${a.status === 'publicado' ? 'Ver no site ↗' : 'Ver prévia ↗'}</a>` : ''}</div>
    ${!ed && !novo ? '<p class="card small muted" style="margin-bottom:18px">Você pode ler este artigo, mas seu papel não permite editá-lo nesta situação.</p>' : ''}
    <div class="grid2">
      <form id="f" class="card"><fieldset ${ed ? '' : 'disabled'}><div class="form">
        <div class="sec" style="margin-top:0;padding-top:0;border:0">Identificação</div>
        ${campo('tipo', 'Tipo', a, { s: 2, sel: [['traducao', 'Tradução'], ['original', 'Artigo original']] })}
        ${campo('area', 'Área', a, { s: 2, sel: AREAS.map((x) => [x, x]) })}
        ${campo('ano', 'Ano (do original)', a, { s: 2, ph: '1902' })}
        ${campo('titulo', 'Título em português', a, { req: true })}
        ${campo('titulo_original', 'Título original', a, { ph: 'Para traduções' })}
        ${campo('autor', 'Autor', a, { s: 3, req: true, ph: 'Dean A. Walker' })}
        ${campo('autor_citacao', 'Autor na citação', a, { s: 3, ph: 'WALKER, Dean A.', dica: 'SOBRENOME, Nome — usado em “Como citar”.' })}
        ${campo('afiliacao', 'Afiliação do autor', a, { s: 3 })}
        ${campo('tradutor', 'Tradutor', a, { s: 3 })}
        ${campo('tema', 'Tema (curto)', a, { s: 3, ph: 'Discernimento profético · 1 Reis' })}
        ${campo('tema_en', 'Tema em inglês', a, { s: 3 })}
        <div class="sec">Fonte original</div>
        ${campo('periodico', 'Periódico', a, { s: 4, ph: 'The Biblical World' })}
        ${campo('mes', 'Mês', a, { s: 2, ph: 'out.' })}
        ${campo('volume', 'Volume', a, { s: 2 })}
        ${campo('numero', 'Número', a, { s: 2 })}
        ${campo('paginas_original', 'Páginas', a, { s: 2, ph: '272–277' })}
        ${campo('editora_original', 'Editora original', a, { s: 3 })}
        ${campo('url_original', 'Link do original', a, { s: 3, tipo: 'url', ph: 'https://www.jstor.org/stable/…' })}
        <div class="sec">Resumo e busca</div>
        ${campo('resumo', 'Resumo', a, { area: true, dica: 'Obrigatório para publicar.' })}
        <label class="f check"><input type="checkbox" name="resumo_editorial" ${a.resumo_editorial ? 'checked' : ''}> Resumo escrito pela redação (o original não tem resumo)</label>
        ${campo('resumo_en', 'Resumo em inglês', a, { area: true })}
        <label class="f"><span>Palavras-chave</span><input name="palavras_chave" value="${esc(kw.join(', '))}" placeholder="separe por vírgula"><small>Entram na busca do site e nos metadados do Google Acadêmico.</small></label>
        ${campo('direitos', 'Direitos', a, { ph: 'Original em domínio público. Tradução © 2026 …' })}
        ${!novo ? campo('slug', 'Endereço da página', a, { dica: `thepropheticvoices.com.br/artigos/<b>${esc(a.slug)}</b>.html — mude só antes de publicar.` }) : ''}
      </div></fieldset></form>
      <div class="stack">
        ${novo ? '<div class="card small muted">Depois de salvar, aparecem aqui o envio do PDF, a capa e os comentários.</div>' : `
        <div class="card">
          <h3>PDF e capa</h3>
          <img class="capa" id="capa" src="${esc(a.capa_url || '/media/symbol-creme.png')}" alt="Capa">
          <p class="meta" style="margin:12px 0">${a.pdf_url ? `<b>PDF enviado</b>${a.pdf_paginas ? ` · ${a.pdf_paginas} páginas` : ''} · <a href="${esc(a.pdf_url)}" target="_blank" rel="noopener">abrir</a>` : 'Nenhum PDF enviado.'}</p>
          ${ed ? `<label class="drop" id="drop">Arraste o PDF aqui ou <u>escolha o arquivo</u><input type="file" id="arq" accept="application/pdf" hidden></label>
          <div class="prog" style="margin-top:10px" hidden id="prog"><i></i></div>
          <p class="small muted" style="margin:10px 0 0">A capa é gerada da primeira página do PDF. <label class="lnk" style="text-decoration:underline">Trocar só a capa<input type="file" id="capaArq" accept="image/jpeg,image/png,image/webp" hidden></label></p>` : ''}
        </div>
        <div class="card"><h3>Comentários internos</h3><div id="coms"><p class="small muted">Carregando…</p></div>
          ${a.pode.comentar ? '<form id="fc" class="stack" style="margin-top:12px"><textarea name="texto" style="min-height:90px" placeholder="Escreva uma observação para a equipe…" required></textarea><button class="btn sm" type="submit">Comentar</button></form>' : ''}
        </div>`}
      </div>
    </div>
    <div class="acoes" id="acoes">
      ${ed ? `<button class="btn pri" id="salvar">${novo ? 'Criar artigo' : 'Salvar alterações'}</button>` : ''}
      ${!novo && a.pode.enviar_revisao && a.status === 'rascunho' ? '<button class="btn" data-st="revisao">Enviar para revisão</button>' : ''}
      ${!novo && a.pode.voltar_rascunho && a.status === 'revisao' ? '<button class="btn" data-st="rascunho">Voltar para rascunho</button>' : ''}
      ${!novo && a.pode.publicar && a.status !== 'publicado' ? '<button class="btn cob" data-st="publicado">Publicar no site</button>' : ''}
      ${!novo && a.pode.arquivar && a.status === 'publicado' ? '<button class="btn" data-st="arquivado">Tirar do ar</button>' : ''}
      ${!novo && a.pode.publicar && a.status === 'arquivado' ? '<button class="btn" data-st="rascunho">Restaurar como rascunho</button>' : ''}
      ${!novo && a.pode.excluir ? '<button class="btn dng" id="excluir" style="margin-left:auto">Excluir</button>' : ''}
    </div>`;

  const tipoSel = $('#f [name=tipo]');
  const ajustarTipo = () => { const orig = tipoSel.value === 'original'; ['titulo_original', 'tradutor'].forEach((n) => { $(`#f [name=${n}]`).closest('.f').hidden = orig; }); };
  tipoSel.addEventListener('change', ajustarTipo); ajustarTipo();
  const ler = () => {
    const d = Object.fromEntries(new FormData($('#f')));
    d.resumo_editorial = $('#f [name=resumo_editorial]').checked;
    return d;
  };
  const salvar = async () => {
    const d = ler();
    if (!d.titulo || !d.autor) { toast('Título e autor são obrigatórios.', true); return null; }
    if (novo) { const r = await api('/artigos', { method: 'POST', body: d }); toast('Artigo criado.'); ir('artigo/' + r.artigo.id); return r.artigo; }
    const r = await api('/artigos/' + a.id, { method: 'PUT', body: d }); toast('Alterações salvas.'); return r.artigo;
  };
  $('#salvar')?.addEventListener('click', async (e) => { e.target.disabled = true; try { const r = await salvar(); if (r && !novo) telaArtigo(a.id); } catch (er) { toast(er.message, true); } e.target.disabled = false; });
  $$('[data-st]').forEach((b) => b.addEventListener('click', async () => {
    const st = b.dataset.st;
    const msg = { publicado: 'Publicar este artigo no site agora?', arquivado: 'Tirar este artigo do site? Ele continua no painel.', revisao: 'Enviar para revisão da equipe?', rascunho: 'Voltar este artigo para rascunho?' }[st];
    if (!confirm(msg)) return;
    try { if (ed) await api('/artigos/' + a.id, { method: 'PUT', body: ler() }); await api(`/artigos/${a.id}/status`, { method: 'POST', body: { status: st } }); toast(st === 'publicado' ? 'Publicado no site.' : 'Situação atualizada.'); telaArtigo(a.id); }
    catch (er) { toast(er.message, true); }
  }));
  $('#excluir')?.addEventListener('click', async () => {
    if (!confirm(`Excluir definitivamente "${a.titulo}"? O PDF e os comentários também serão apagados.`)) return;
    try { await api('/artigos/' + a.id, { method: 'DELETE' }); toast('Artigo excluído.'); ir('artigos'); } catch (er) { toast(er.message, true); }
  });
  if (novo) return;

  // ---- PDF
  const enviarPdf = async (file) => {
    if (!file || file.type !== 'application/pdf') { toast('Escolha um arquivo PDF.', true); return; }
    const prog = $('#prog'), barra = $('#prog i');
    prog.hidden = false; barra.style.width = '15%';
    try {
      let paginas = '', capa = null;
      try {
        const pdfjs = await import('pdfjs-dist');
        const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
        const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
        paginas = doc.numPages;
        const pg = await doc.getPage(1);
        const vp = pg.getViewport({ scale: 1 });
        const sc = 900 / vp.width;
        const c = document.createElement('canvas');
        c.width = Math.round(vp.width * sc); c.height = Math.round(vp.height * sc);
        await pg.render({ canvasContext: c.getContext('2d'), viewport: pg.getViewport({ scale: sc }) }).promise;
        capa = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.84));
      } catch (e) { console.warn('capa automática falhou', e); }
      barra.style.width = '45%';
      await api(`/artigos/${a.id}/arquivo?tipo=pdf&paginas=${paginas}`, { method: 'POST', body: file, headers: { 'Content-Type': 'application/pdf' } });
      barra.style.width = '80%';
      if (capa) await api(`/artigos/${a.id}/arquivo?tipo=capa`, { method: 'POST', body: capa, headers: { 'Content-Type': 'image/jpeg' } });
      barra.style.width = '100%';
      toast('PDF enviado' + (capa ? ' e capa gerada.' : '.'));
      telaArtigo(a.id);
    } catch (er) { toast(er.message, true); prog.hidden = true; }
  };
  const drop = $('#drop');
  if (drop) {
    $('#arq').addEventListener('change', (e) => enviarPdf(e.target.files[0]));
    ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('on'); }));
    ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('on'); }));
    drop.addEventListener('drop', (e) => enviarPdf(e.dataTransfer.files[0]));
    $('#capaArq').addEventListener('change', async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try { await api(`/artigos/${a.id}/arquivo?tipo=capa`, { method: 'POST', body: f, headers: { 'Content-Type': f.type } }); toast('Capa atualizada.'); telaArtigo(a.id); } catch (er) { toast(er.message, true); }
    });
  }

  // ---- comentários
  const carregarComs = async () => {
    const { comentarios } = await api(`/artigos/${a.id}/comentarios`);
    $('#coms').innerHTML = comentarios.length ? comentarios.map((c) => `<div class="com"><header><span><b>${esc(c.nome || 'Usuário removido')}</b> <span class="papel">${esc(nomePapel(c.papel))}</span></span><span>${data(c.criado_em)}${c.usuario_id === S.usuario.id || S.permissoes.gerir_usuarios ? ` · <button class="lnk small" data-del="${c.id}">apagar</button>` : ''}</span></header><p>${esc(c.texto)}</p></div>`).join('') : '<p class="small muted">Nenhum comentário ainda.</p>';
    $$('[data-del]').forEach((b) => b.addEventListener('click', async () => { if (!confirm('Apagar este comentário?')) return; await api(`/artigos/${a.id}/comentarios/${b.dataset.del}`, { method: 'DELETE' }); carregarComs(); }));
  };
  carregarComs();
  $('#fc')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try { await api(`/artigos/${a.id}/comentarios`, { method: 'POST', body: { texto: e.target.texto.value } }); e.target.reset(); carregarComs(); } catch (er) { toast(er.message, true); }
  });
}

// ---------------------------------------------------------------- usuários
async function telaUsuarios() {
  marcarMenu('usuarios');
  if (!S.permissoes.gerir_usuarios) return ir('artigos');
  app.innerHTML = '<p class="muted center">Carregando…</p>';
  const { usuarios, convites } = await api('/usuarios');
  const opPapeis = (sel) => S.permissoes.papeis_atribuiveis.map((p) => `<option value="${p}" ${p === sel ? 'selected' : ''}>${esc(nomePapel(p))}</option>`).join('');
  app.innerHTML = `
    <div class="head"><div><h1>Usuários</h1><p class="muted">${usuarios.filter((u) => u.ativo).length} ativos · cada pessoa entra com o próprio e-mail e senha.</p></div></div>
    <div class="grid2">
      <div class="card" style="padding:6px 12px"><table class="tb"><thead><tr><th>Pessoa</th><th>Papel</th><th>Último acesso</th><th></th></tr></thead><tbody>
      ${usuarios.map((u) => `<tr data-id="${u.id}" style="${u.ativo ? '' : 'opacity:.5'}">
        <td><b style="font-weight:500">${esc(u.nome)}</b>${u.id === S.usuario.id ? ' <span class="papel">você</span>' : ''}<div class="small muted">${esc(u.email)}${u.ativo ? '' : ' · desativado'}</div></td>
        <td>${u.editavel ? `<select data-papel style="padding:6px 10px;font-size:14px">${S.permissoes.papeis_atribuiveis.includes(u.papel) ? '' : `<option value="${u.papel}" selected>${esc(nomePapel(u.papel))}</option>`}${opPapeis(u.papel)}</select>` : `<span class="papel">${esc(nomePapel(u.papel))}</span>`}</td>
        <td class="small muted">${data(u.ultimo_acesso)}</td>
        <td style="text-align:right;white-space:nowrap">${u.editavel ? `<button class="btn sm" data-reset>Nova senha</button> <button class="btn sm ${u.ativo ? 'dng' : ''}" data-ativo="${u.ativo ? 0 : 1}">${u.ativo ? 'Desativar' : 'Reativar'}</button>` : ''}</td></tr>`).join('')}
      </tbody></table><div id="linkReset"></div></div>
      <div class="stack">
        <form class="card" id="fconv"><h3>Convidar pessoa</h3><div class="form">
          <label class="f"><span>E-mail</span><input type="email" name="email" required></label>
          <label class="f"><span>Nome</span><input name="nome" placeholder="opcional"></label>
          <label class="f"><span>Papel</span><select name="papel">${opPapeis('autor')}</select><small><a href="#papeis">O que cada papel pode fazer</a></small></label>
          <div class="f"><button class="btn pri" type="submit">Gerar convite</button></div>
        </div><div id="linkConv"></div></form>
        ${convites.length ? `<div class="card"><h3>Links pendentes</h3>${convites.map((c) => `<div class="com"><header><span><b>${esc(c.email)}</b> <span class="papel">${c.tipo === 'convite' ? esc(nomePapel(c.papel)) : 'nova senha'}</span></span><button class="lnk small" data-cancel="${c.id}">cancelar</button></header><p class="small muted">expira ${data(c.expira_em)}</p></div>`).join('')}</div>` : ''}
      </div>
    </div>`;
  $('#fconv').addEventListener('submit', async (e) => {
    e.preventDefault();
    try { const r = await api('/usuarios/convite', { method: 'POST', body: Object.fromEntries(new FormData(e.target)) }); e.target.reset(); $('#linkConv').innerHTML = caixaLink(r.link, r.expira); } catch (er) { toast(er.message, true); }
  });
  $$('tr[data-id]').forEach((tr) => {
    const id = tr.dataset.id;
    $('[data-papel]', tr)?.addEventListener('change', async (e) => {
      try { await api('/usuarios/' + id, { method: 'PUT', body: { papel: e.target.value } }); toast('Papel alterado.'); } catch (er) { toast(er.message, true); telaUsuarios(); }
    });
    $('[data-ativo]', tr)?.addEventListener('click', async (e) => {
      const ativo = e.target.dataset.ativo === '1';
      if (!ativo && !confirm('Desativar esta pessoa? Ela perde o acesso imediatamente.')) return;
      try { await api('/usuarios/' + id, { method: 'PUT', body: { ativo } }); telaUsuarios(); } catch (er) { toast(er.message, true); }
    });
    $('[data-reset]', tr)?.addEventListener('click', async () => {
      try { const r = await api(`/usuarios/${id}/redefinicao`, { method: 'POST' }); $('#linkReset').innerHTML = caixaLink(r.link, r.expira); } catch (er) { toast(er.message, true); }
    });
  });
  $$('[data-cancel]').forEach((b) => b.addEventListener('click', async () => { await api('/convites/' + b.dataset.cancel, { method: 'DELETE' }); telaUsuarios(); }));
}

// ---------------------------------------------------------------- conta, histórico, papéis
function telaConta() {
  marcarMenu('');
  const u = S.usuario;
  app.innerHTML = `<div class="head"><div><h1>Minha conta</h1><p class="muted">${esc(u.email)} · <span class="papel">${esc(nomePapel(u.papel))}</span></p></div></div>
  <div class="grid2" style="grid-template-columns:1fr 1fr">
    <form class="card" id="fn"><h3>Nome</h3><div class="form"><label class="f"><span>Como aparece na equipe</span><input name="nome" value="${esc(u.nome)}" required></label><div class="f"><button class="btn" type="submit">Salvar nome</button></div></div></form>
    <form class="card" id="fs"><h3>Trocar senha</h3><div class="form">
      <label class="f"><span>Senha atual</span><input type="password" name="atual" autocomplete="current-password" required></label>
      <label class="f"><span>Nova senha (mínimo 10)</span><input type="password" name="nova" minlength="10" autocomplete="new-password" required></label>
      <label class="f"><span>Repita a nova senha</span><input type="password" name="nova2" minlength="10" autocomplete="new-password" required></label>
      <div class="f"><button class="btn pri" type="submit">Trocar senha</button><small>As outras sessões abertas serão encerradas.</small></div></div></form>
  </div>`;
  $('#fn').addEventListener('submit', async (e) => { e.preventDefault(); try { await api('/meu-nome', { method: 'POST', body: { nome: e.target.nome.value } }); await carregarSessao(); toast('Nome salvo.'); } catch (er) { toast(er.message, true); } });
  $('#fs').addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    if (d.nova !== d.nova2) return toast('As senhas não conferem.', true);
    try { await api('/minha-senha', { method: 'POST', body: d }); e.target.reset(); toast('Senha alterada.'); } catch (er) { toast(er.message, true); }
  });
}

async function telaHistorico() {
  marcarMenu('historico');
  if (!S.permissoes.ver_historico) return ir('artigos');
  const { historico } = await api('/historico');
  app.innerHTML = `<div class="head"><div><h1>Histórico</h1><p class="muted">As últimas 300 ações na plataforma.</p></div></div>
  <div class="card" style="padding:6px 12px"><table class="tb"><thead><tr><th>Quando</th><th>Quem</th><th>O quê</th></tr></thead><tbody>
  ${historico.map((h) => `<tr><td class="small muted" style="white-space:nowrap">${data(h.em)}</td><td>${esc(h.nome || '—')}</td><td>${esc(h.acao)} ${h.alvo ? `<b style="font-weight:500">${esc(h.alvo)}</b>` : ''} ${h.detalhe ? `<span class="small muted">(${esc(h.detalhe)})</span>` : ''}</td></tr>`).join('')}
  </tbody></table></div>`;
}

function telaPapeis() {
  marcarMenu('papeis');
  app.innerHTML = `<div class="head"><div><h1>Papéis</h1><p class="muted">Como num Drive compartilhado: cada pessoa tem um papel, e o papel define o que ela pode fazer.</p></div></div>
  <div class="roles">${Object.entries(S.papeis).sort((x, y) => y[1].nivel - x[1].nivel).map(([k, p]) => `<div class="card"><span class="papel">nível ${p.nivel}</span><b>${esc(p.nome)}</b><p class="small muted" style="margin:6px 0 0">${esc(p.descricao)}</p><ul>${ACOES_PAPEL[k].map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}</div>
  <div class="card" style="margin-top:20px"><h3>Fluxo de um artigo</h3><p class="muted" style="margin:0">Rascunho → Em revisão → Publicado (aparece no site na hora) → Arquivado (sai do site, continua no painel). Autores levam o artigo até “Em revisão”; editores e acima publicam.</p></div>`;
}

// ---------------------------------------------------------------- navegação
async function carregarSessao() {
  const s = await api('/sessao', { publico: true });
  S = { usuario: s.usuario, permissoes: s.permissoes, papeis: s.papeis, configurar: s.configurar, chave: s.chave_configurada };
  mostrarMenu();
  return s;
}

async function rotear() {
  const h = decodeURIComponent(location.hash.slice(1));
  try {
    if (h.startsWith('convite=')) return telaConvite(h.slice(8));
    if (h.startsWith('redefinir=')) return telaConvite(h.slice(10));
    if (S.configurar) return telaConfigurar(S.chave);
    if (!S.usuario) return telaEntrar();
    if (h.startsWith('artigo/')) return await telaArtigo(h.slice(7));
    if (h === 'usuarios') return await telaUsuarios();
    if (h === 'historico') return await telaHistorico();
    if (h === 'conta') return telaConta();
    if (h === 'papeis') return telaPapeis();
    return await telaArtigos();
  } catch (e) {
    app.innerHTML = `<div class="card"><h2>Algo deu errado</h2><p class="muted">${esc(e.message)}</p><a class="btn" href="#artigos">Voltar</a></div>`;
  }
}

window.addEventListener('hashchange', rotear);
carregarSessao().then(rotear).catch((e) => { app.innerHTML = `<div class="auth card"><h2>Painel indisponível</h2><p class="muted">${esc(e.message)}</p></div>`; });
