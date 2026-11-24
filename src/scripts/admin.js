// Painel The Prophetic Voices — interface (sem bibliotecas; pdf.js só é carregado ao enviar um PDF).
import { instalarLoja, ACOES_LOJA } from './admin-loja.js';
const app = document.getElementById('app');
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let S = { usuario: null, permissoes: null, papeis: {}, papeis_loja: {} };
const inicio = () => (S.permissoes && !S.permissoes.ver_revista && S.permissoes.loja_ver ? 'loja' : 'artigos');

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
  $('#menuLogo').href = '#' + inicio();
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
    <h1>Entrar</h1><p class="muted small">Painel The Prophetic Voices — revista e loja.</p>
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
    try { await api('/entrar', { method: 'POST', body: d, publico: true }); await carregarSessao(); ir(inicio()); }
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
    <p class="muted small">${novo ? `Você foi convidado para a plataforma The Prophetic Voices (${esc(c.papel_nome)}).` : 'Crie uma nova senha para a sua conta.'}</p>
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
    try { await api('/convite', { method: 'POST', body: { token, nome: d.nome, senha: d.senha }, publico: true }); history.replaceState(null, '', location.pathname); await carregarSessao(); toast(novo ? 'Conta criada.' : 'Senha alterada.'); ir(inicio()); }
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
        <label class="f"><span>Acesso ao PDF</span><select name="acesso">
          <option value="livre" ${a.acesso === 'livre' ? 'selected' : ''}>Livre — qualquer pessoa lê e baixa (domínio público ou licença aberta)</option>
          <option value="cadastro" ${a.acesso !== 'livre' ? 'selected' : ''}>Com cadastro gratuito — publicado com autorização do autor/editora</option>
        </select><small>O resumo e a ficha do artigo continuam abertos nos dois casos.</small></label>
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
  const nomeLoja = (p) => (S.papeis_loja[p] ? S.papeis_loja[p].nome : p);
  const opLoja = (sel) => ['nenhum', 'visualizador', 'expedicao', 'gerente'].map((p) => `<option value="${p}" ${p === sel ? 'selected' : ''}>${esc(nomeLoja(p))}</option>`).join('');
  const opPapeis = (sel) => S.permissoes.papeis_atribuiveis.map((p) => `<option value="${p}" ${p === sel ? 'selected' : ''}>${esc(nomePapel(p))}</option>`).join('');
  app.innerHTML = `
    <div class="head"><div><h1>Usuários</h1><p class="muted">${usuarios.filter((u) => u.ativo).length} ativos · cada pessoa entra com o próprio e-mail e senha.</p></div></div>
    <div class="grid2">
      <div class="card" style="padding:6px 12px"><table class="tb"><thead><tr><th>Pessoa</th><th>Revista</th><th>Loja</th><th>Último acesso</th><th></th></tr></thead><tbody>
      ${usuarios.map((u) => `<tr data-id="${u.id}" style="${u.ativo ? '' : 'opacity:.5'}">
        <td><b style="font-weight:500">${esc(u.nome)}</b>${u.id === S.usuario.id ? ' <span class="papel">você</span>' : ''}<div class="small muted">${esc(u.email)}${u.ativo ? '' : ' · desativado'}</div></td>
        <td>${u.editavel ? `<select data-papel style="padding:6px 10px;font-size:14px">${S.permissoes.papeis_atribuiveis.includes(u.papel) ? '' : `<option value="${u.papel}" selected>${esc(nomePapel(u.papel))}</option>`}${opPapeis(u.papel)}</select>${['proprietario', 'administrador'].includes(u.papel) ? '' : `<label class="small muted" style="display:flex;gap:6px;align-items:center;margin-top:6px"><input type="checkbox" data-revista ${u.revista ? 'checked' : ''}> acesso à revista</label>`}` : `<span class="papel">${u.revista || ['proprietario', 'administrador'].includes(u.papel) ? esc(nomePapel(u.papel)) : 'sem acesso'}</span>`}</td>
        <td>${['proprietario', 'administrador'].includes(u.papel) ? '<span class="papel">acesso total</span>' : u.editavel ? `<select data-loja style="padding:6px 10px;font-size:14px">${opLoja(u.papel_loja)}</select>` : `<span class="papel">${esc(nomeLoja(u.papel_loja))}</span>`}</td>
        <td class="small muted">${data(u.ultimo_acesso)}</td>
        <td style="text-align:right;white-space:nowrap">${u.editavel ? `<button class="btn sm" data-reset>Nova senha</button> <button class="btn sm ${u.ativo ? 'dng' : ''}" data-ativo="${u.ativo ? 0 : 1}">${u.ativo ? 'Desativar' : 'Reativar'}</button>` : ''}</td></tr>`).join('')}
      </tbody></table><div id="linkReset"></div></div>
      <div class="stack">
        <form class="card" id="fconv"><h3>Convidar pessoa</h3><div class="form">
          <label class="f"><span>E-mail</span><input type="email" name="email" required></label>
          <label class="f"><span>Nome</span><input name="nome" placeholder="opcional"></label>
          <label class="f"><span>Papel na revista</span><select name="papel">${opPapeis('leitor')}</select></label>
          <label class="f check"><input type="checkbox" name="revista" checked> Acesso à revista (artigos)</label>
          <label class="f"><span>Papel na loja</span><select name="papel_loja">${opLoja('nenhum')}</select><small><a href="#papeis">O que cada papel pode fazer</a></small></label>
          <div class="f"><button class="btn pri" type="submit">Gerar convite</button></div>
        </div><div id="linkConv"></div></form>
        ${convites.length ? `<div class="card"><h3>Links pendentes</h3>${convites.map((c) => `<div class="com"><header><span><b>${esc(c.email)}</b> <span class="papel">${c.tipo === 'convite' ? (c.revista === 0 ? 'sem revista' : esc(nomePapel(c.papel))) + (c.papel_loja && c.papel_loja !== 'nenhum' ? ' · loja: ' + esc(nomeLoja(c.papel_loja)) : '') : 'nova senha'}</span></span><button class="lnk small" data-cancel="${c.id}">cancelar</button></header><p class="small muted">expira ${data(c.expira_em)}</p></div>`).join('')}</div>` : ''}
      </div>
    </div>`;
  $('#fconv').addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target)); d.revista = e.target.revista.checked;
    try { const r = await api('/usuarios/convite', { method: 'POST', body: d }); e.target.reset(); $('#linkConv').innerHTML = caixaLink(r.link, r.expira); } catch (er) { toast(er.message, true); }
  });
  $$('tr[data-id]').forEach((tr) => {
    const id = tr.dataset.id;
    $('[data-papel]', tr)?.addEventListener('change', async (e) => {
      try { await api('/usuarios/' + id, { method: 'PUT', body: { papel: e.target.value } }); toast('Papel alterado.'); } catch (er) { toast(er.message, true); telaUsuarios(); }
    });
    $('[data-revista]', tr)?.addEventListener('change', async (e) => {
      try { await api('/usuarios/' + id, { method: 'PUT', body: { revista: e.target.checked } }); toast('Acesso à revista atualizado.'); } catch (er) { toast(er.message, true); telaUsuarios(); }
    });
    $('[data-loja]', tr)?.addEventListener('change', async (e) => {
      try { await api('/usuarios/' + id, { method: 'PUT', body: { papel_loja: e.target.value } }); toast('Acesso à loja atualizado.'); } catch (er) { toast(er.message, true); telaUsuarios(); }
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
  app.innerHTML = `<div class="head"><div><h1>Minha conta</h1><p class="muted">${esc(u.email)} · revista: <span class="papel">${S.permissoes.ver_revista ? esc(nomePapel(u.papel)) : 'sem acesso'}</span> · loja: <span class="papel">${S.permissoes.loja_gerir ? 'gerente' : S.permissoes.loja_expedir ? 'expedição' : S.permissoes.loja_ver ? 'visualizador' : 'sem acesso'}</span></p></div></div>
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
  app.innerHTML = `<div class="head"><div><h1>Papéis</h1><p class="muted">Como num Drive compartilhado: cada pessoa tem um papel em cada área, e o papel define o que ela pode fazer.</p></div></div><h2 style="margin:0 0 14px">Revista</h2>
  <div class="roles">${Object.entries(S.papeis).sort((x, y) => y[1].nivel - x[1].nivel).map(([k, p]) => `<div class="card"><span class="papel">nível ${p.nivel}</span><b>${esc(p.nome)}</b><p class="small muted" style="margin:6px 0 0">${esc(p.descricao)}</p><ul>${ACOES_PAPEL[k].map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}</div>
  <div class="head" style="margin-top:34px"><div><h2>Loja</h2><p class="muted">O acesso à loja é separado do acesso à revista: uma pessoa pode cuidar só do estoque, sem ver os artigos. Proprietários e administradores têm acesso total às duas áreas.</p></div></div>
  <div class="roles">${Object.entries(S.papeis_loja).sort((x, y) => y[1].nivel - x[1].nivel).map(([k, p]) => `<div class="card"><b>${esc(p.nome)}</b><p class="small muted" style="margin:6px 0 0">${esc(p.descricao)}</p><ul>${(ACOES_LOJA[k] || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}</div>
  <div class="card" style="margin-top:20px"><h3>Fluxo de um pedido</h3><p class="muted" style="margin:0">Aguardando pagamento → Pago (o estoque sai automaticamente quando o Mercado Pago confirma) → Em separação (etiqueta gerada) → Enviado → Entregue. Cancelar ou reembolsar um pedido pago devolve os itens ao estoque.</p></div>
  <div class="card" style="margin-top:20px"><h3>Fluxo de um artigo</h3><p class="muted" style="margin:0">Rascunho → Em revisão → Publicado (aparece no site na hora) → Arquivado (sai do site, continua no painel). Autores levam o artigo até “Em revisão”; editores e acima publicam.</p></div>`;
}

// ---------------------------------------------------------------- estatísticas
// Acessos às páginas dos artigos e downloads dos PDFs, por período, artigo, mês e país.
let EST = { periodo: '12m', de: '', ate: '' };
const isoDia = (d) => new Date(d.getTime() - 3 * 3600e3).toISOString().slice(0, 10);
const num = (n) => Number(n || 0).toLocaleString('pt-BR');
const nomePais = (c) => {
  if (!c || c === 'XX') return 'Não identificado';
  try { return new Intl.DisplayNames(['pt-BR'], { type: 'region' }).of(c); } catch (e) { return c; }
};
const nomeMes = (m) => { const [a, b] = m.split('-'); return new Date(Date.UTC(+a, +b - 1, 15)).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric', timeZone: 'UTC' }); };
const dataBR = (s) => (s ? s.split('-').reverse().join('/') : '—');

function intervalo() {
  const hoje = new Date();
  const ate = isoDia(hoje);
  if (EST.periodo === '30d') return { de: isoDia(new Date(hoje - 29 * 864e5)), ate, nome: 'Últimos 30 dias' };
  if (EST.periodo === '12m') { const d = new Date(hoje); d.setUTCFullYear(d.getUTCFullYear() - 1); d.setUTCDate(d.getUTCDate() + 1); return { de: isoDia(d), ate, nome: 'Últimos 12 meses' }; }
  if (EST.periodo === 'ano') return { de: ate.slice(0, 4) + '-01-01', ate, nome: 'Ano de ' + ate.slice(0, 4) };
  if (EST.periodo === 'livre' && EST.de && EST.ate) return { de: EST.de, ate: EST.ate, nome: `${dataBR(EST.de)} a ${dataBR(EST.ate)}` };
  return { de: '', ate: '', nome: 'Desde o início da contagem' };
}

function baixarCsv(nome, linhas) {
  const csv = '﻿' + linhas.map((l) => l.map((c) => { const t = String(c ?? ''); return /[";\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; }).join(';')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = nome;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function barrasMes(meses) {
  if (!meses.length) return '<p class="muted small">Ainda não há registros neste período.</p>';
  const max = Math.max(1, ...meses.map((m) => Math.max(m.acessos, m.downloads)));
  return `<div class="est-leg small muted"><span><i class="est-a"></i>Acessos</span><span><i class="est-d"></i>Downloads</span></div>
  <div class="est-meses">${meses.map((m) => `<div class="est-mes"><span class="small">${esc(nomeMes(m.mes))}</span>
    <div class="est-bar"><i class="est-a" style="width:${(m.acessos / max) * 100}%"></i><b>${num(m.acessos)}</b></div>
    <div class="est-bar"><i class="est-d" style="width:${(m.downloads / max) * 100}%"></i><b>${num(m.downloads)}</b></div></div>`).join('')}</div>`;
}

function tabelaPaises(paises) {
  if (!paises.length) return '<p class="muted small">Ainda não há registros neste período.</p>';
  return `<table class="tb"><thead><tr><th>País</th><th class="num">Acessos</th><th class="num">Downloads</th></tr></thead><tbody>
  ${paises.map((p) => `<tr><td>${esc(nomePais(p.pais))}</td><td class="num">${num(p.acessos)}</td><td class="num">${num(p.downloads)}</td></tr>`).join('')}</tbody></table>`;
}

const NOTA_EST = 'Acessos = aberturas da página do artigo no site. Downloads = aberturas ou downloads do PDF (botões “Baixar PDF”, “PDF ↓”, “Abrir em tela cheia” e links diretos); a leitura no visualizador embutido da página não conta como download. Robôs de busca, pré-visualizações de links e pessoas logadas no painel ficam fora da contagem. O site não guarda IP nem nenhum dado pessoal dos leitores: só totais por dia e país.';

function filtrosPeriodo() {
  const op = [['30d', '30 dias'], ['12m', '12 meses'], ['ano', 'Este ano'], ['tudo', 'Tudo'], ['livre', 'Escolher datas']];
  return `<div class="filtros est-filtros">${op.map(([k, n]) => `<button class="chip" aria-pressed="${EST.periodo === k}" data-per="${k}">${n}</button>`).join('')}
    <span class="est-datas" ${EST.periodo === 'livre' ? '' : 'hidden'}><input type="date" id="estDe" value="${esc(EST.de)}"> a <input type="date" id="estAte" value="${esc(EST.ate)}"> <button class="btn sm" id="estAplicar">Aplicar</button></span></div>`;
}

function ligarFiltros(recarregar) {
  $$('[data-per]').forEach((b) => b.addEventListener('click', () => { EST.periodo = b.dataset.per; if (b.dataset.per !== 'livre') recarregar(); else $('.est-datas').hidden = false; $$('[data-per]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); }));
  const ap = $('#estAplicar');
  if (ap) ap.addEventListener('click', () => { EST.de = $('#estDe').value; EST.ate = $('#estAte').value; if (!EST.de || !EST.ate || EST.de > EST.ate) return toast('Escolha a data inicial e a final.', true); recarregar(); });
}

async function telaEstatisticas(slug) {
  marcarMenu('estatisticas');
  if (!S.permissoes.ver_estatisticas) return ir('artigos');
  const iv = intervalo();
  const q = new URLSearchParams();
  if (iv.de) { q.set('de', iv.de); q.set('ate', iv.ate); }
  if (slug) q.set('artigo', slug);
  const r = await api('/estatisticas?' + q);
  const recarregar = () => telaEstatisticas(slug);
  const kpis = `<div class="lj-kpis">
    <div class="card"><span class="small muted">Acessos às páginas</span><b>${num(r.totais.acessos)}</b></div>
    <div class="card"><span class="small muted">Downloads do PDF</span><b>${num(r.totais.downloads)}</b></div>
    <div class="card"><span class="small muted">Países</span><b>${num(r.totais.paises)}</b></div>
    <div class="card"><span class="small muted">Contagem desde</span><b>${dataBR(r.contagem_desde)}</b></div></div>`;

  if (slug) {
    const a = r.artigo;
    const fonte = [a.periodico, a.volume && 'v. ' + a.volume, a.numero && 'n. ' + a.numero, a.paginas_original && 'p. ' + a.paginas_original, a.ano].filter(Boolean).join(', ');
    const link = location.origin + '/artigos/' + a.slug + '.html';
    app.innerHTML = `<div class="est-rel">
    <div class="head no-print"><div><a href="#estatisticas" class="small muted">← Todas as estatísticas</a></div>
      <div class="est-acoes"><button class="btn sm" id="estCsv">Exportar planilha (CSV)</button><button class="btn sm pri" id="estImprimir">Imprimir ou salvar em PDF</button></div></div>
    <div class="no-print">${filtrosPeriodo()}</div>
    <div class="est-cab"><img src="/media/pv07-cobre.png" alt="Símbolo The Prophetic Voices" class="est-logo"><div><p class="small muted" style="margin:0">Relatório de acessos · ${esc(iv.nome)}</p></div></div>
    <h1 style="margin:6px 0 4px">${esc(a.titulo)}</h1>
    ${a.titulo_original ? `<p class="muted" style="margin:0 0 4px"><i>${esc(a.titulo_original)}</i></p>` : ''}
    <p style="margin:0 0 4px">${esc(a.autor)}${fonte ? ` · Original: ${esc(fonte)}` : ''}</p>
    <p class="small muted" style="margin:0 0 18px">Publicado na revista The Prophetic Voices em ${a.publicado_em ? dataBR(a.publicado_em.slice(0, 10)) : '—'} · ${esc(link)}</p>
    ${kpis}
    <div class="grid2"><div class="card"><h3>Por mês</h3>${barrasMes(r.meses)}</div><div class="card"><h3>Por país</h3>${tabelaPaises(r.paises)}</div></div>
    <p class="small muted" style="margin-top:18px">${esc(NOTA_EST)}</p>
    <p class="small muted">Relatório gerado em ${new Date().toLocaleString('pt-BR')} · thepropheticvoices.com.br</p></div>`;
    ligarFiltros(recarregar);
    $('#estImprimir').addEventListener('click', () => window.print());
    $('#estCsv').addEventListener('click', () => baixarCsv(`relatorio-${a.slug}.csv`, [
      ['Relatório de acessos', a.titulo], ['Autor', a.autor], ['Período', iv.nome], ['Página', link], [],
      ['Mês', 'Acessos', 'Downloads'], ...r.meses.map((m) => [m.mes, m.acessos, m.downloads]), ['Total', r.totais.acessos, r.totais.downloads], [],
      ['País', 'Acessos', 'Downloads'], ...r.paises.map((p) => [nomePais(p.pais), p.acessos, p.downloads])]));
    return;
  }

  app.innerHTML = `<div class="head"><div><h1>Estatísticas</h1><p class="muted">Acessos e downloads dos artigos da revista · ${esc(iv.nome)}. Abra um artigo para gerar o relatório que pode ser enviado à editora ou ao autor.</p></div>
    <div class="est-acoes"><button class="btn sm" id="estCsv">Exportar planilha (CSV)</button></div></div>
  ${filtrosPeriodo()}${kpis}
  <div class="card" style="padding:6px 12px;margin-bottom:18px"><table class="tb"><thead><tr><th>Artigo</th><th class="num">Acessos</th><th class="num">Downloads</th><th class="num">Países</th><th></th></tr></thead><tbody>
  ${r.artigos.map((a) => `<tr><td><a href="#estatisticas/${esc(a.slug)}" style="text-decoration:none"><b style="font-weight:500">${esc(a.titulo)}</b></a><br><span class="small muted">${esc(a.autor)}${a.periodico ? ' · ' + esc(a.periodico) + (a.ano ? ' (' + esc(a.ano) + ')' : '') : ''}${a.status === 'arquivado' ? ' · arquivado' : ''}</span></td>
    <td class="num">${num(a.acessos)}</td><td class="num">${num(a.downloads)}</td><td class="num">${num(a.paises)}</td><td><a class="btn sm" href="#estatisticas/${esc(a.slug)}">Relatório</a></td></tr>`).join('') || '<tr><td colspan="5" class="muted">Nenhum artigo publicado.</td></tr>'}
  </tbody></table></div>
  <div class="grid2"><div class="card"><h3>Por mês</h3>${barrasMes(r.meses)}</div><div class="card"><h3>Por país</h3>${tabelaPaises(r.paises)}</div></div>
  <p class="small muted" style="margin-top:18px">${esc(NOTA_EST)}</p>`;
  ligarFiltros(recarregar);
  $('#estCsv').addEventListener('click', () => baixarCsv('estatisticas-revista.csv', [
    ['Período', iv.nome], [],
    ['Artigo', 'Autor', 'Original', 'Ano', 'Acessos', 'Downloads', 'Países', 'Página'],
    ...r.artigos.map((a) => [a.titulo, a.autor, a.periodico, a.ano, a.acessos, a.downloads, a.paises, location.origin + '/artigos/' + a.slug + '.html']),
    [], ['Mês', 'Acessos', 'Downloads'], ...r.meses.map((m) => [m.mes, m.acessos, m.downloads]),
    [], ['País', 'Acessos', 'Downloads'], ...r.paises.map((p) => [nomePais(p.pais), p.acessos, p.downloads])]));
}

// ---------------------------------------------------------------- navegação
// ---------------------------------------------------------------- comentários dos leitores (moderação)
let filtroCom = 'pendente';
const NOMES_STATUS_COM = { pendente: 'Pendentes', aprovado: 'Aprovados', rejeitado: 'Rejeitados' };

async function atualizarPendentes() {
  const b = $('#nPend');
  if (!b || !S.permissoes || !S.permissoes.moderar_comentarios) return;
  try { const { n } = await api('/moderacao/pendentes'); b.textContent = n; b.hidden = !n; } catch (e) {}
}

async function telaComentarios() {
  marcarMenu('comentarios');
  if (!S.permissoes.moderar_comentarios) return ir(inicio());
  const r = await api('/moderacao?status=' + filtroCom);
  const ativos = r.provedores.filter((p) => p.configurado);
  app.innerHTML = `<div class="head"><div><h1>Comentários</h1><p class="muted">Comentários dos leitores nos artigos. Nada aparece no site antes de ser aprovado. Não há respostas em sequência: cada comentário é independente.</p></div></div>
  <div class="filtros" style="margin-bottom:16px">${Object.keys(NOMES_STATUS_COM).map((s) => `<button class="chip" data-st="${s}" aria-pressed="${filtroCom === s}">${NOMES_STATUS_COM[s]} <b>${r.contagem[s] || 0}</b></button>`).join('')}</div>
  <div class="stack">${r.comentarios.map((c) => `<div class="card">
      <div class="small muted"><a href="/artigos/${esc(c.slug)}.html#comentarios" target="_blank" rel="noopener">${esc(c.titulo)} ↗</a> · ${data(c.criado_em)}</div>
      <p style="margin:10px 0;white-space:pre-wrap;line-height:1.6">${esc(c.texto)}</p>
      <div class="small"><b style="font-weight:500">${esc(c.nome)}</b> <span class="muted">${esc(c.email || 'sem e-mail')}${c.bloqueado ? ' · bloqueado' : ''}</span></div>
      ${c.moderado_em ? `<div class="small muted" style="margin-top:4px">${c.status === 'aprovado' ? 'Aprovado' : c.status === 'rejeitado' ? 'Rejeitado' : 'Moderado'} por ${esc(c.moderado_por_nome || '—')} em ${data(c.moderado_em)}</div>` : ''}
      <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
        ${c.status !== 'aprovado' ? `<button class="btn sm pri" data-com="${c.id}" data-acao="aprovar">Aprovar</button>` : ''}
        ${c.status !== 'rejeitado' ? `<button class="btn sm" data-com="${c.id}" data-acao="rejeitar">${c.status === 'aprovado' ? 'Tirar do site' : 'Rejeitar'}</button>` : ''}
        <button class="btn sm dng" data-com="${c.id}" data-acao="apagar">Apagar</button>
        <button class="btn sm" data-leitor="${c.leitor_id}" data-bloq="${c.bloqueado ? 0 : 1}">${c.bloqueado ? 'Desbloquear leitor' : 'Bloquear leitor'}</button>
      </div></div>`).join('') || `<div class="card"><p class="muted" style="margin:0">Nenhum comentário ${filtroCom === 'pendente' ? 'aguardando aprovação' : NOMES_STATUS_COM[filtroCom].toLowerCase()}.</p></div>`}</div>
  <div class="card" style="margin-top:28px"><h3>Logins do site</h3>
    <p class="small muted">${r.leitores} ${r.leitores === 1 ? 'leitor cadastrado' : 'leitores cadastrados'}. ${ativos.length ? 'A seção de comentários e o cadastro aparecem no site.' : 'Nenhum login configurado ainda: o cadastro e a seção de comentários ficam escondidos no site até o primeiro ser ligado.'} O passo a passo está em <code>docs/CONFIGURAR-LOGINS.md</code> no repositório.</p>
    <table class="tb"><thead><tr><th>Login</th><th>Situação</th><th>Endereço de retorno (para o painel do provedor)</th></tr></thead><tbody>
    ${r.provedores.map((p) => `<tr><td>${esc(p.nome)}</td><td>${p.configurado ? '✓ Ligado' : '<span class="muted">Falta configurar</span>'}</td><td><code class="small">${esc(p.retorno)}</code> <button class="lnk small" data-copiar="${esc(p.retorno)}">copiar</button></td></tr>`).join('')}
    </tbody></table></div>`;
  $$('[data-st]').forEach((b) => b.addEventListener('click', () => { filtroCom = b.dataset.st; telaComentarios(); }));
  $$('[data-com]').forEach((b) => b.addEventListener('click', async () => {
    if (b.dataset.acao === 'apagar' && !b.dataset.conf) { b.dataset.conf = '1'; b.textContent = 'Confirmar: apagar'; return; }
    try { await api('/moderacao/' + b.dataset.com, { method: 'POST', body: { acao: b.dataset.acao } }); toast({ aprovar: 'Comentário aprovado e publicado.', rejeitar: 'Comentário rejeitado.', apagar: 'Comentário apagado.' }[b.dataset.acao]); atualizarPendentes(); telaComentarios(); }
    catch (er) { toast(er.message, true); }
  }));
  $$('[data-leitor]').forEach((b) => b.addEventListener('click', async () => {
    const bloquear = b.dataset.bloq === '1';
    if (bloquear && !b.dataset.conf) { b.dataset.conf = '1'; b.textContent = 'Confirmar bloqueio'; return; }
    try { await api('/moderacao/leitor/' + b.dataset.leitor, { method: 'POST', body: { bloquear } }); toast(bloquear ? 'Leitor bloqueado; os pendentes dele foram rejeitados.' : 'Leitor desbloqueado.'); atualizarPendentes(); telaComentarios(); }
    catch (er) { toast(er.message, true); }
  }));
}

// ---------------------------------------------------------------- testemunhos publicados no site
const ST_T = { rascunho: 'Rascunho', publicado: 'Publicado', arquivado: 'Fora do site' };
const AUT_T = { anonimo: 'Sem identificação', nome: 'Com o nome' };

async function telaTestemunhos(idEditar) {
  marcarMenu('testemunhos');
  if (!S.permissoes.publicar) return ir(inicio());
  const r = await api('/testemunhos');
  const t = idEditar === 'novo' ? { id: 0, titulo: '', texto: '', assinatura: '', autorizacao: 'anonimo', status: 'rascunho' } : r.testemunhos.find((x) => String(x.id) === String(idEditar));
  if (t) return formTestemunho(t, r.email);
  app.innerHTML = `<div class="head"><div><h1>Testemunhos</h1><p class="muted">Os relatos chegam pelo formulário da página Testemunhos. Aqui a equipe publica os que foram autorizados. ${r.email ? 'Ao publicar pela primeira vez, os inscritos recebem o testemunho por e-mail.' : 'Os e-mails automáticos ainda não estão ligados (veja a aba E-mails).'}</p></div><a class="btn pri" href="#testemunhos/novo">Novo testemunho</a></div>
  <div class="stack">${r.testemunhos.map((x) => `<div class="card"><div class="small muted">${ST_T[x.status]} · ${AUT_T[x.autorizacao]}${x.publicado_em ? ' · publicado em ' + data(x.publicado_em, false) : ''}${x.envio_status === 'concluido' || x.envio_status === 'fila' ? ` · e-mail para ${x.envio_total} inscrito(s)` : ''}</div>
    <h3 style="margin:8px 0 6px">${esc(x.titulo)}</h3><p class="small muted" style="margin:0 0 12px">${esc(x.texto.slice(0, 220))}${x.texto.length > 220 ? '…' : ''}</p>
    <a class="btn sm" href="#testemunhos/${x.id}">Abrir</a>${x.status === 'publicado' ? ` <a class="btn sm" target="_blank" rel="noopener" href="/testemunhos.html#t-${x.id}">Ver no site ↗</a>` : ''}</div>`).join('') || '<div class="card"><p class="muted" style="margin:0">Nenhum testemunho cadastrado ainda.</p></div>'}</div>`;
}

function formTestemunho(t, emailOn) {
  const novo = !t.id;
  app.innerHTML = `<div class="head"><div><a href="#testemunhos" class="small muted">← Todos os testemunhos</a><h1>${novo ? 'Novo testemunho' : esc(t.titulo)}</h1><p class="muted">${novo ? 'Copie o relato do formulário, ajuste só o necessário (sem mudar o sentido) e retire nomes de outras pessoas.' : ST_T[t.status] + (t.publicado_em ? ' · publicado em ' + data(t.publicado_em) : '')}</p></div></div>
  <form id="ft" class="card stack">
    <label class="f"><span>Título</span><input name="titulo" maxlength="160" required value="${esc(t.titulo)}" placeholder="Ex.: Uma palavra que se cumpriu"></label>
    <label class="f"><span>Testemunho</span><textarea name="texto" rows="14" required>${esc(t.texto)}</textarea><small>Deixe uma linha em branco entre os parágrafos.</small></label>
    <label class="f"><span>Autorização dada por quem enviou</span><select name="autorizacao"><option value="anonimo"${t.autorizacao === 'anonimo' ? ' selected' : ''}>Publicar sem identificar a pessoa</option><option value="nome"${t.autorizacao === 'nome' ? ' selected' : ''}>Publicar com o nome da pessoa</option></select><small>Testemunhos marcados como “só para a equipe” não entram aqui.</small></label>
    <label class="f"><span>Assinatura exibida</span><input name="assinatura" maxlength="160" value="${esc(t.assinatura || '')}" placeholder="Com nome: “Ana Souza, Imperatriz (MA)” · Sem identificar: “Uma aluna da Escola de Profetas”"></label>
    <p class="err" id="errT"></p>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" type="submit">${novo ? 'Salvar rascunho' : 'Salvar alterações'}</button></div>
  </form>
  ${novo ? '' : `<div class="card" style="margin-top:16px">
    ${t.status !== 'publicado' ? `<label class="check" style="display:flex;gap:10px;align-items:flex-start;margin-bottom:12px"><input type="checkbox" id="autOk"> <span>Conferi no formulário que a pessoa autorizou a publicação <b>${t.autorizacao === 'nome' ? 'com o nome dela' : 'sem identificação'}</b>, e que o texto não expõe crianças, vítimas ou outras pessoas.</span></label>
      <button class="btn cob" id="pubT">Publicar no site${!t.publicado_em && emailOn ? ' e avisar os inscritos por e-mail' : ''}</button>` : '<button class="btn" id="arqT">Tirar do site</button>'}
    ${t.status !== 'publicado' && !t.publicado_em ? '' : ''}
    <button class="btn dng" id="excT" style="margin-left:8px">Excluir</button>
    ${t.publicado_em && t.status !== 'publicado' ? '<p class="small muted" style="margin:10px 0 0">Este testemunho já foi enviado por e-mail antes; publicar de novo não reenvia.</p>' : ''}
  </div>`}`;
  $('#ft').addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    try {
      if (novo) { const r = await api('/testemunhos', { method: 'POST', body: d }); toast('Rascunho salvo.'); ir('testemunhos/' + r.testemunho.id); }
      else { await api('/testemunhos/' + t.id, { method: 'PUT', body: d }); toast('Alterações salvas.'); telaTestemunhos(t.id); }
    } catch (er) { $('#errT').textContent = er.message; }
  });
  $('#pubT')?.addEventListener('click', async () => {
    if (!$('#autOk').checked) return toast('Marque a confirmação da autorização antes de publicar.', true);
    try { await api('/testemunhos/' + t.id + '/status', { method: 'POST', body: { status: 'publicado', autorizacao_conferida: true } }); toast(!t.publicado_em && emailOn ? 'Publicado. Os e-mails estão sendo enviados.' : 'Publicado no site.'); telaTestemunhos(t.id); }
    catch (er) { toast(er.message, true); }
  });
  $('#arqT')?.addEventListener('click', async () => {
    try { await api('/testemunhos/' + t.id + '/status', { method: 'POST', body: { status: 'arquivado' } }); toast('Retirado do site.'); telaTestemunhos(t.id); } catch (er) { toast(er.message, true); }
  });
  $('#excT')?.addEventListener('click', async (e) => {
    const b = e.currentTarget;
    if (!b.dataset.conf) { b.dataset.conf = '1'; b.textContent = 'Confirmar: excluir'; return; }
    try { await api('/testemunhos/' + t.id, { method: 'DELETE' }); toast('Testemunho excluído.'); ir('testemunhos'); } catch (er) { toast(er.message, true); }
  });
}

// ---------------------------------------------------------------- e-mails automáticos
async function telaEmails() {
  marcarMenu('emails');
  if (!S.permissoes.publicar) return ir(inicio());
  const r = await api('/emails');
  const soma = (st, or) => r.inscritos.filter((x) => x.status === st && (!or || x.origem === or)).reduce((a, x) => a + x.n, 0);
  const ST = { fila: 'Enviando', concluido: 'Enviado', sem_servico: 'Não enviado (serviço desligado)' };
  app.innerHTML = `<div class="head"><div><h1>E-mails</h1><p class="muted">Quando um artigo ou testemunho é publicado pela primeira vez, cada inscrito recebe um e-mail com ele. Ninguém recebe o mesmo aviso duas vezes, e cada e-mail traz o link para cancelar.</p></div></div>
  <div class="card" style="border-color:${r.configurado ? 'var(--line)' : 'var(--cobre)'}"><h3>Serviço de envio</h3>
    <p class="small ${r.configurado ? '' : 'muted'}" style="margin:0">${r.configurado ? `✓ Ligado · remetente <code>${esc(r.remetente)}</code>` : 'Desligado: faltam os segredos <code>EMAIL_API_TOKEN</code> e <code>CF_ACCOUNT_ID</code> no Cloudflare. Enquanto isso, as inscrições pela conta são registradas, mas nada é enviado e o rodapé responde “abrem em breve”. Passo a passo em <code>docs/CONFIGURAR-EMAILS.md</code>.'}</p></div>
  <div class="card" style="margin-top:16px"><h3>Inscritos</h3>
    <table class="tb"><tbody>
      <tr><td>Recebendo</td><td class="num"><b>${soma('ativo')}</b></td><td class="small muted">${soma('ativo', 'conta')} pela conta do site · ${soma('ativo', 'rodape')} pelo rodapé</td></tr>
      <tr><td>Aguardando confirmação</td><td class="num">${soma('pendente')}</td><td class="small muted">inscreveram-se no rodapé e ainda não clicaram no e-mail</td></tr>
      <tr><td>Cancelados</td><td class="num">${soma('cancelado')}</td><td class="small muted">não recebem mais nada</td></tr>
    </tbody></table></div>
  <div class="card" style="margin-top:16px"><h3>Últimos envios</h3>
    <table class="tb"><thead><tr><th>Quando</th><th>O quê</th><th>Situação</th><th class="num">Enviados</th><th class="num">Falhas</th></tr></thead><tbody>
    ${r.envios.map((e) => `<tr><td class="small muted" style="white-space:nowrap">${data(e.criado_em)}</td><td>${e.tipo === 'artigo' ? 'Artigo' : 'Testemunho'}: ${esc(e.titulo)}</td><td class="small">${ST[e.status]}${e.na_fila ? ` · ${e.na_fila} na fila` : ''}</td><td class="num">${e.enviados}/${e.total}</td><td class="num">${e.falhas || '—'}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">Nenhum envio ainda.</td></tr>'}
    </tbody></table></div>
  <div class="card" style="margin-top:16px"><h3>Interessados em escrever para a revista</h3>
    <p class="small muted">Leitores que marcaram, na Biblioteca, que querem ser avisados quando a chamada de artigos abrir.</p>
    <table class="tb"><thead><tr><th>Nome</th><th>E-mail</th><th>Trilho</th><th>Desde</th></tr></thead><tbody>
    ${(r.autores || []).map((x) => `<tr><td>${esc(x.nome)}</td><td class="small">${esc(x.email || '—')}</td><td class="small">${{ academico: 'Artigo acadêmico', ensaio: 'Ensaio teológico', ambos: 'Os dois' }[x.interesse_autor] || ''}</td><td class="small muted" style="white-space:nowrap">${data(x.interesse_autor_em)}</td></tr>`).join('') || '<tr><td colspan="4" class="muted">Ninguém ainda.</td></tr>'}
    </tbody></table></div>`;
}

// ---------------------------------------------------------------- Spirit Immersion (participantes, devocionais, testemunhos)
const AUT_SI = { equipe: 'Só a equipe', anonimo: 'Publicar sem identificar', nome: 'Publicar com o nome' };
const TIPO_SI = { testemunho: 'Testemunho', profetica: 'Impressão profética', ouvi: 'O que ouvi de Deus', texto: 'Texto lido', oracao: 'Oração', outro: 'Registro' };
async function telaSpirit() {
  marcarMenu('spirit');
  app.innerHTML = '<p class="muted center">Carregando…</p>';
  const r = await api('/spirit');
  const e = r.edicao;
  const pr = e.prep;
  const fase = { antes: `A preparação começa em ${1 - pr.dia_atual} dia(s) (1º de dezembro)`, preparacao: `Preparação · dia ${pr.dia_atual} de ${pr.dias}`, jornada: `Jornada · dia ${e.dia_atual} de ${e.dias}`, fim: 'Edição encerrada' }[e.etapa];
  const grafico = (porDia, total, c, rot) => {
    const max = Math.max(1, total), pd = {}; porDia.forEach((x) => (pd[x.dia] = x));
    const ult = Math.min(Math.max(c.dia_atual, 0), c.dias);
    return `<div style="display:flex;align-items:flex-end;gap:2px;height:90px;border-bottom:1px solid rgba(248,233,183,.15)">${Array.from({ length: c.dias }, (_, i) => {
      const x = pd[i + 1] || { orou: 0 }; const h = Math.round((100 * x.orou) / max);
      return `<i title="${rot} ${i + 1}: ${x.orou} de ${total} oraram" style="flex:1;display:block;min-width:2px;height:${i + 1 > ult ? 2 : Math.max(2, h)}%;background:${i + 1 > ult ? 'rgba(248,233,183,.1)' : 'var(--cobre)'}"></i>`;
    }).join('')}</div>`;
  };
  const filtro = sessionStorage.getItem('si-aut') || '';
  const tes = r.testemunhos.filter((t) => !filtro || t.autorizacao === filtro);
  app.innerHTML = `<div class="head"><div><h1>Spirit Immersion ${esc(e.id)}</h1><p class="muted">${esc(fase)} · preparação de 31 dias em dezembro (15, 30, 45 min e 1 h) e jornada de 100 dias, de 1º/01 a 10/04/2027. Página pública: <a href="/spirit-immersion.html" target="_blank" rel="noopener">/spirit-immersion.html ↗</a></p></div></div>
  <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:16px">
    <div class="card"><h3>Participantes</h3><p style="font-size:42px;margin:4px 0">${r.total_pessoas}</p><p class="small muted" style="margin:0">${r.participantes_prep} na preparação · ${r.participantes} aceitaram os 100 dias<br>${r.dias_orados_prep} dias marcados na preparação · ${r.dias_orados_total} dias (≈ ${r.dias_orados_total} h) na jornada</p></div>
    <div class="card"><h3>Quantos oraram em cada dia</h3><p class="small muted" style="margin:0 0 6px">Preparação · 31 dias</p>${grafico(r.por_dia_prep, r.participantes_prep, pr, 'Preparação, dia')}<p class="small muted" style="margin:14px 0 6px">Jornada · 100 dias</p>${grafico(r.por_dia, r.participantes, e, 'Dia')}<p class="small muted" style="margin:8px 0 0">Passe o mouse sobre a barra para ver o dia. Cada participante vê só o próprio registro.</p></div>
  </div>
  <div class="card" style="margin-top:16px"><h3>Devocionais em PDF</h3>
    <p class="small muted">O devocional aparece na conta dos participantes a partir da data de liberação${r.email_servico ? ' e, nesse dia, vai por e-mail a quem pediu' : '. Os e-mails automáticos ainda não estão ligados (aba E-mails): por enquanto, o PDF fica só na conta'}. Pode cadastrar a série inteira com antecedência.${r.na_fila ? ` · ${r.na_fila} e-mail(s) na fila.` : ''}</p>
    <table class="tb"><thead><tr><th>Liberar em</th><th>Título</th><th>PDF</th><th>Situação</th><th class="num">E-mails</th><th></th></tr></thead><tbody>
    ${r.devocionais.map((d) => `<tr data-dev="${d.id}"><td class="small" style="white-space:nowrap">${esc(d.liberar_em.split('-').reverse().join('/'))}</td><td>${esc(d.titulo)}${d.resumo ? `<div class="small muted">${esc(d.resumo)}</div>` : ''}</td>
      <td class="small">${d.pdf_url ? `<a href="${esc(d.pdf_url)}" target="_blank" rel="noopener">abrir ↗</a>` : '—'} <label class="btn sm" style="cursor:pointer">${d.pdf_url ? 'Trocar' : 'Enviar PDF'}<input type="file" accept="application/pdf" data-pdf="${d.id}" hidden></label></td>
      <td class="small">${d.status === 'publicado' ? (d.liberar_em <= e.hoje ? 'Publicado · visível' : 'Publicado · aguardando a data') : 'Rascunho'}</td>
      <td class="num small">${d.total_envio ? `${d.enviados}/${d.total_envio}` : '—'}</td>
      <td style="white-space:nowrap">${d.status === 'publicado' ? `<button class="btn sm" data-st="rascunho">Tirar do ar</button>` : `<button class="btn sm cob" data-st="publicado">Publicar</button>`} <button class="btn sm" data-edit>Editar</button> <button class="btn sm dng" data-del>Apagar</button></td></tr>`).join('') || '<tr><td colspan="6" class="muted">Nenhum devocional cadastrado.</td></tr>'}
    </tbody></table>
    <form id="fDev" class="stack" style="margin-top:16px"><h3 style="margin:0">Novo devocional</h3>
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:12px"><label class="f"><span>Título</span><input name="titulo" maxlength="200" required placeholder="Ex.: Semana 1 · O espírito de graça e de súplicas"></label>
      <label class="f"><span>Liberar em</span><input name="liberar_em" type="date" required value="${esc(e.hoje)}"></label></div>
      <label class="f"><span>Resumo (vai no e-mail; opcional)</span><textarea name="resumo" rows="2" maxlength="1000"></textarea></label>
      <div><button class="btn pri" type="submit">Criar</button> <span class="small muted">Depois de criar, envie o PDF e publique.</span></div></form>
  </div>
  <div class="card" style="margin-top:16px"><h3>Testemunhos dos participantes · ${r.testemunhos.length}</h3>
    <p class="small muted">Testemunhos escritos pelos participantes na área de Testemunhos da conta. O Diário de Oração deles é sempre privado e nunca aparece aqui. Só publique (aba Testemunhos) os que trazem autorização para isso, respeitando o nível escolhido; “só a equipe” fica restrito ao ministério.</p>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">${[['', 'Todos'], ['equipe', AUT_SI.equipe], ['anonimo', AUT_SI.anonimo], ['nome', AUT_SI.nome]].map(([k, v]) => `<button class="btn sm${filtro === k ? ' pri' : ''}" data-faut="${k}">${esc(v)} (${k ? r.testemunhos.filter((t) => t.autorizacao === k).length : r.testemunhos.length})</button>`).join('')}</div>
    <div class="stack">${tes.map((t) => `<div style="border-top:1px solid rgba(248,233,183,.12);padding-top:12px"><div class="small muted">${t.data ? esc(t.data.split('-').reverse().join('/')) + ' · ' : ''}${esc(TIPO_SI[t.tipo] || 'Testemunho')}${t.referencia ? ' · ' + esc(t.referencia) : ''} · ${esc(t.nome)}${t.email ? ' · ' + esc(t.email) : ''} · <b>${esc(AUT_SI[t.autorizacao])}</b> · ${data(t.atualizado_em)}</div><p style="white-space:pre-wrap;margin:6px 0 0">${esc(t.testemunho)}</p></div>`).join('') || '<p class="muted" style="margin:0">Nenhum testemunho ainda.</p>'}</div>
  </div>`;

  $$('[data-faut]').forEach((b) => b.addEventListener('click', () => { sessionStorage.setItem('si-aut', b.dataset.faut); telaSpirit(); }));
  $('#fDev').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    try { await api('/spirit/devocionais', { method: 'POST', body: Object.fromEntries(new FormData(ev.target)) }); toast('Devocional criado. Agora envie o PDF.'); telaSpirit(); } catch (er) { toast(er.message, true); }
  });
  $$('[data-dev]').forEach((tr) => {
    const id = tr.dataset.dev, d = r.devocionais.find((x) => String(x.id) === id);
    const inp = $('[data-pdf]', tr);
    inp.addEventListener('change', async () => {
      const f = inp.files[0]; if (!f) return;
      toast('Enviando o PDF…');
      try { await api(`/spirit/devocionais/${id}/pdf`, { method: 'POST', body: f, headers: { 'Content-Type': 'application/pdf' } }); toast('PDF enviado.'); telaSpirit(); } catch (er) { toast(er.message, true); }
    });
    $('[data-st]', tr).addEventListener('click', async (ev) => {
      try { await api(`/spirit/devocionais/${id}/status`, { method: 'POST', body: { status: ev.target.dataset.st } }); toast(ev.target.dataset.st === 'publicado' ? 'Publicado.' : 'Tirado do ar.'); telaSpirit(); } catch (er) { toast(er.message, true); }
    });
    $('[data-edit]', tr).addEventListener('click', async () => {
      const titulo = prompt('Título', d.titulo); if (titulo === null) return;
      const liberar = prompt('Liberar em (AAAA-MM-DD)', d.liberar_em); if (liberar === null) return;
      const resumo = prompt('Resumo (opcional)', d.resumo || ''); if (resumo === null) return;
      try { await api(`/spirit/devocionais/${id}`, { method: 'PUT', body: { titulo, liberar_em: liberar, resumo } }); toast('Alterado.'); telaSpirit(); } catch (er) { toast(er.message, true); }
    });
    $('[data-del]', tr).addEventListener('click', async () => {
      if (!confirm(`Apagar o devocional “${d.titulo}” e o PDF dele?`)) return;
      try { await api(`/spirit/devocionais/${id}`, { method: 'DELETE' }); toast('Apagado.'); telaSpirit(); } catch (er) { toast(er.message, true); }
    });
  });
}

async function carregarSessao() {
  const s = await api('/sessao', { publico: true });
  S = { usuario: s.usuario, permissoes: s.permissoes, papeis: s.papeis, papeis_loja: s.papeis_loja || {}, configurar: s.configurar, chave: s.chave_configurada };
  mostrarMenu();
  atualizarPendentes();
  return s;
}

async function rotear() {
  const h = decodeURIComponent(location.hash.slice(1));
  try {
    if (h.startsWith('convite=')) return telaConvite(h.slice(8));
    if (h.startsWith('redefinir=')) return telaConvite(h.slice(10));
    if (S.configurar) return telaConfigurar(S.chave);
    if (!S.usuario) return telaEntrar();
    if (h === 'loja' || h.startsWith('loja/') || h.startsWith('loja?')) return await rotaLoja(h);
    if (!S.permissoes.ver_revista && ['', 'artigos'].includes(h) || h.startsWith('artigo/') && !S.permissoes.ver_revista) return S.permissoes.loja_ver ? ir('loja') : telaConta();
    if (h.startsWith('artigo/')) return await telaArtigo(h.slice(7));
    if (h === 'usuarios') return await telaUsuarios();
    if (h === 'comentarios') return await telaComentarios();
    if (h === 'testemunhos') return await telaTestemunhos();
    if (h.startsWith('testemunhos/')) return await telaTestemunhos(h.slice(12));
    if (h === 'emails') return await telaEmails();
    if (h === 'spirit') return await telaSpirit();
    if (h === 'estatisticas') return await telaEstatisticas('');
    if (h.startsWith('estatisticas/')) return await telaEstatisticas(h.slice(13));
    if (h === 'historico') return await telaHistorico();
    if (h === 'conta') return telaConta();
    if (h === 'papeis') return telaPapeis();
    return await telaArtigos();
  } catch (e) {
    app.innerHTML = `<div class="card"><h2>Algo deu errado</h2><p class="muted">${esc(e.message)}</p><a class="btn" href="#${inicio()}">Voltar</a></div>`;
  }
}

const rotaLoja = instalarLoja({ app, $, $$, esc, api, toast, data, ir, marcarMenu, get S() { return S; } });
window.addEventListener('hashchange', rotear);
carregarSessao().then(rotear).catch((e) => { app.innerHTML = `<div class="auth card"><h2>Painel indisponível</h2><p class="muted">${esc(e.message)}</p></div>`; });
