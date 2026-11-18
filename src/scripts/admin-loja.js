// Painel — área da loja: resumo, produtos (fotos, preços, variações), estoque, pedidos/etiquetas e configurações.
export function instalarLoja(c) {
  const { app, $, $$, esc, api, toast, data, ir, marcarMenu } = c;
  const P = () => c.S.permissoes;
  const brl = (v) => 'R$ ' + ((v || 0) / 100).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const reais = (v) => (v == null || v === '' ? '' : (v / 100).toFixed(2).replace('.', ','));
  const ST = { aguardando: 'Aguardando pagamento', pago: 'Pago', separacao: 'Em separação', enviado: 'Enviado', entregue: 'Entregue', cancelado: 'Cancelado', reembolsado: 'Reembolsado' };
  const stCls = { aguardando: 'revisao', pago: 'publicado', separacao: 'publicado', enviado: 'publicado', entregue: 'arquivado', cancelado: 'rascunho', reembolsado: 'rascunho' };
  const st = (s) => `<span class="st ${stCls[s] || ''}">${esc(ST[s] || s)}</span>`;

  const abas = (atual) => `<div class="filtros lj-abas">${[['loja', 'Resumo'], ['loja/produtos', 'Produtos'], ['loja/estoque', 'Estoque'], ['loja/pedidos', 'Pedidos'], ['loja/config', 'Configurações']]
    .map(([r, n]) => `<a class="chip" href="#${r}" aria-pressed="${r === atual}">${n}</a>`).join('')}<a class="chip" href="/loja.html" target="_blank" rel="noopener" style="margin-left:auto">Ver loja ↗</a></div>`;

  const faixaTeste = (t) => (t && (t.pagamento || t.frete)
    ? `<div class="card small" style="border-color:var(--cobre);margin-bottom:18px"><b>Modo de teste.</b> ${[t.pagamento ? 'pagamento simulado (falta a chave do Mercado Pago)' : '', t.frete ? 'frete simulado (falta o token do Melhor Envio)' : ''].filter(Boolean).join(' · ')}. Veja “Configurações” para ativar as integrações.</div>` : '');

  // ------------------------------------------------------------ resumo
  async function resumo() {
    const r = await api('/loja/resumo');
    const n = (s) => (r.por_status.find((x) => x.status === s) || {}).n || 0;
    app.innerHTML = `<div class="head"><div><h1>Loja</h1><p class="muted">Vendas, estoque e expedição.</p></div>${P().loja_gerir ? '<a class="btn pri" href="#loja/produto/novo">+ Novo produto</a>' : ''}</div>
      ${abas('loja')}${faixaTeste(r.teste)}
      <div class="lj-kpis">
        <div class="card"><span class="small muted">Vendas · 30 dias</span><b>${brl(r.vendas_30d.t)}</b><span class="small muted">${r.vendas_30d.n} pedido(s)</span></div>
        <a class="card" href="#loja/pedidos?status=expedir"><span class="small muted">A expedir</span><b>${n('pago') + n('separacao')}</b><span class="small muted">pagos ou em separação</span></a>
        <a class="card" href="#loja/pedidos?status=aguardando"><span class="small muted">Aguardando pagamento</span><b>${n('aguardando')}</b><span class="small muted">Pix, boleto ou cartão</span></a>
        <a class="card" href="#loja/estoque"><span class="small muted">Estoque baixo</span><b>${r.estoque_baixo.length}</b><span class="small muted">no mínimo ou abaixo</span></a>
      </div>
      <div class="grid2">
        <div class="card" style="padding:6px 12px"><h3 style="margin:12px 6px">Pedidos recentes</h3><table class="tb"><tbody>
          ${r.recentes.map((p) => `<tr class="click" data-ped="${p.id}"><td><b style="font-weight:500">${esc(p.codigo)}</b><div class="small muted">${esc(p.nome)}</div></td><td>${st(p.status)}</td><td style="text-align:right">${brl(p.total)}<div class="small muted">${data(p.criado_em, false)}</div></td></tr>`).join('') || '<tr><td class="muted">Nenhum pedido ainda.</td></tr>'}
        </tbody></table></div>
        <div class="card"><h3>Estoque baixo</h3>${r.estoque_baixo.length ? r.estoque_baixo.map((x) => `<div class="com"><header><span><a class="lnk" href="#loja/produto/${x.id}">${esc(x.nome)}${x.variacao ? ' — ' + esc(x.variacao) : ''}</a></span><b style="color:${x.estoque <= 0 ? '#e8a48a' : 'var(--cobre)'}">${x.estoque}</b></header></div>`).join('') : '<p class="small muted">Tudo certo por aqui.</p>'}</div>
      </div>`;
    $$('[data-ped]').forEach((tr) => tr.addEventListener('click', () => ir('loja/pedido/' + tr.dataset.ped)));
  }

  // ------------------------------------------------------------ produtos
  async function produtos() {
    const { produtos } = await api('/loja/produtos');
    const est = (p) => (p.variacoes.some((v) => v.ativo) ? p.variacoes.filter((v) => v.ativo).reduce((s, v) => s + v.estoque, 0) : p.estoque);
    app.innerHTML = `<div class="head"><div><h1>Produtos</h1><p class="muted">${produtos.length} cadastrados · ${produtos.filter((p) => p.ativo).length} à venda</p></div>${P().loja_gerir ? '<a class="btn pri" href="#loja/produto/novo">+ Novo produto</a>' : ''}</div>
      ${abas('loja/produtos')}
      <div class="card" style="padding:6px 12px"><table class="tb"><thead><tr><th></th><th>Produto</th><th>Preço</th><th>Estoque</th><th>Vendidos</th><th>Situação</th></tr></thead><tbody>
      ${produtos.map((p) => `<tr class="click" data-id="${p.id}"><td><img class="thumb" src="${esc(p.fotos[0] ? p.fotos[0].url : '/media/symbol-creme.png')}" alt=""></td>
        <td><div class="tt">${esc(p.nome)}</div><div class="small muted">${esc(p.categoria || '')}${p.variacoes.filter((v) => v.ativo).length ? ' · ' + p.variacoes.filter((v) => v.ativo).map((v) => esc(v.nome)).join(', ') : ''}</div></td>
        <td>${p.preco ? brl(p.preco) : '<span class="small muted">sem preço</span>'}</td>
        <td style="color:${est(p) <= p.estoque_minimo ? 'var(--cobre)' : 'inherit'}">${est(p)}</td><td class="small muted">${p.vendidos}</td>
        <td>${p.ativo ? '<span class="st publicado">À venda</span>' : '<span class="st rascunho">Fora da loja</span>'}</td></tr>`).join('')}
      </tbody></table>${produtos.length ? '' : '<div class="empty">Nenhum produto ainda.</div>'}</div>`;
    $$('tr[data-id]').forEach((tr) => tr.addEventListener('click', () => ir('loja/produto/' + tr.dataset.id)));
  }

  const cp = (nome, rot, v, o = {}) => `<label class="f ${o.s ? 's' + o.s : ''}"><span>${rot}</span>${o.area ? `<textarea name="${nome}" rows="6">${esc(v ?? '')}</textarea>` : `<input name="${nome}" value="${esc(v ?? '')}" ${o.ph ? `placeholder="${esc(o.ph)}"` : ''} ${o.num ? 'inputmode="decimal"' : ''}>`}${o.dica ? `<small>${o.dica}</small>` : ''}</label>`;

  async function produto(id) {
    const novo = id === 'novo';
    if (novo && !P().loja_gerir) return ir('loja/produtos');
    let p = { nome: '', ativo: 0, destaque: 0, preco: 0, estoque_minimo: 2, peso_g: 300, altura_cm: 4, largura_cm: 16, comprimento_cm: 23, variacoes: [], fotos: [] }, mov = [];
    if (!novo) { const r = await api('/loja/produtos/' + id); p = r.produto; mov = r.movimentos; }
    const g = P().loja_gerir;
    const vars = p.variacoes.filter((v) => v.ativo);
    app.innerHTML = `<p class="small"><a href="#loja/produtos" class="lnk">← Produtos</a></p>
      <div class="head"><div><h1>${novo ? 'Novo produto' : esc(p.nome)}</h1>${novo ? '<p class="muted">Salve primeiro; depois envie as fotos e lance o estoque.</p>' : `<p class="muted">${p.ativo ? '<span class="st publicado">À venda</span>' : '<span class="st rascunho">Fora da loja</span>'} &nbsp; atualizado ${data(p.atualizado_em)}</p>`}</div>
        ${!novo && p.ativo ? `<a class="btn" target="_blank" rel="noopener" href="/produto.html?p=${esc(p.slug)}">Ver na loja ↗</a>` : ''}</div>
      <div class="grid2">
        <form id="fp" class="card"><fieldset ${g ? '' : 'disabled'}><div class="form">
          <div class="sec" style="margin-top:0;padding-top:0;border:0">Produto</div>
          ${cp('nome', 'Nome', p.nome)}
          ${cp('categoria', 'Categoria', p.categoria, { s: 3, ph: 'Livros, Vestuário…' })}
          ${cp('sku', 'Código interno (SKU)', p.sku, { s: 3 })}
          ${cp('descricao', 'Descrição', p.descricao, { area: true })}
          <div class="sec">Preço</div>
          ${cp('preco', 'Preço (R$)', reais(p.preco), { s: 3, num: 1, ph: '89,90' })}
          ${cp('preco_de', 'Preço “de” (riscado, opcional)', reais(p.preco_de), { s: 3, num: 1 })}
          <div class="sec">Variações (tamanhos, cores…)</div>
          <div class="f"><div id="vars" class="stack">${vars.map((v) => `<div class="lj-var" data-vid="${v.id}"><input value="${esc(v.nome)}" data-vn placeholder="Ex.: M"><input value="${esc(v.sku || '')}" data-vs placeholder="SKU (opcional)"><span class="small muted">estoque ${v.estoque}</span><button type="button" class="lnk small" data-vdel>remover</button></div>`).join('')}</div>
            ${g ? '<button type="button" class="btn sm" id="addVar" style="margin-top:8px">+ Variação</button>' : ''}<small>Sem variações, o estoque é do produto inteiro. O estoque de cada variação é lançado em “Estoque”.</small></div>
          <div class="sec">Embalagem (para o frete)</div>
          ${cp('peso_g', 'Peso (g)', p.peso_g, { s: 2, num: 1 })}${cp('altura_cm', 'Altura (cm)', p.altura_cm, { s: 2, num: 1 })}${cp('largura_cm', 'Largura (cm)', p.largura_cm, { s: 2, num: 1 })}${cp('comprimento_cm', 'Comprimento (cm)', p.comprimento_cm, { s: 2, num: 1 })}
          ${cp('estoque_minimo', 'Alerta de estoque baixo', p.estoque_minimo, { s: 2, num: 1 })}${cp('ordem', 'Ordem na vitrine', p.ordem || 0, { s: 2, num: 1 })}
          <label class="f check"><input type="checkbox" name="ativo" ${p.ativo ? 'checked' : ''}> À venda na loja</label>
          <label class="f check"><input type="checkbox" name="destaque" ${p.destaque ? 'checked' : ''}> Destaque (aparece primeiro)</label>
          ${!novo ? cp('slug', 'Endereço', p.slug, { dica: `thepropheticvoices.com.br/produto.html?p=<b>${esc(p.slug)}</b>` }) : ''}
        </div></fieldset></form>
        <div class="stack">${novo ? '<div class="card small muted">Depois de salvar, aparecem aqui as fotos e o estoque.</div>' : `
          <div class="card"><h3>Fotos</h3><div class="lj-fotos">${p.fotos.map((f, i) => `<div class="lj-foto"><img src="${esc(f.url)}" alt="">${g ? `<div>${i ? `<button type="button" class="lnk small" data-fup="${f.id}">← capa</button>` : '<span class="small muted">capa</span>'}<button type="button" class="lnk small" data-fdel="${f.id}">apagar</button></div>` : ''}</div>`).join('') || '<p class="small muted">Nenhuma foto.</p>'}</div>
            ${g ? '<label class="drop" id="dropF" style="margin-top:12px">Arraste as fotos aqui ou <u>escolha</u><input type="file" id="arqF" accept="image/jpeg,image/png,image/webp" multiple hidden></label><p class="small muted" style="margin:8px 0 0">JPG, PNG ou WebP · as fotos são reduzidas para 1600 px antes do envio.</p>' : ''}</div>
          <div class="card"><h3>Estoque</h3>${vars.length ? vars.map((v) => `<div class="com"><header><span>${esc(v.nome)}</span><b>${v.estoque}</b></header></div>`).join('') : `<p class="meta"><b style="font-size:28px;font-weight:300">${p.estoque}</b> em estoque</p>`}
            ${g ? `<form id="fe" class="form" style="margin-top:12px">
              ${vars.length ? `<label class="f s3"><span>Variação</span><select name="variacao_id">${vars.map((v) => `<option value="${v.id}">${esc(v.nome)}</option>`).join('')}</select></label>` : ''}
              <label class="f s3"><span>Tipo</span><select name="tipo"><option value="entrada">Entrada (+)</option><option value="saida">Saída (−)</option><option value="contagem">Contagem (saldo exato)</option></select></label>
              <label class="f s2"><span>Quantidade</span><input name="quantidade" inputmode="numeric" required></label>
              <label class="f s4"><span>Motivo</span><input name="motivo" placeholder="Ex.: chegou a gráfica, brinde, avaria"></label>
              <div class="f"><button class="btn sm pri" type="submit">Lançar</button></div></form>` : ''}</div>
          <div class="card"><h3>Movimentações</h3>${mov.length ? `<table class="tb"><tbody>${mov.map((m) => `<tr><td class="small">${esc(m.motivo)}${m.variacao ? ' · ' + esc(m.variacao) : ''}<div class="muted">${data(m.em)} · ${esc(m.usuario || 'automático')}</div></td><td style="text-align:right;color:${m.quantidade < 0 ? '#e8a48a' : 'var(--cobre)'}">${m.quantidade > 0 ? '+' : ''}${m.quantidade}</td><td class="small muted" style="text-align:right;white-space:nowrap">= ${m.saldo ?? '—'}</td></tr>`).join('')}</tbody></table>` : '<p class="small muted">Nada ainda.</p>'}</div>`}
        </div>
      </div>
      ${g ? `<div class="acoes"><button class="btn pri" id="salvarP">${novo ? 'Criar produto' : 'Salvar alterações'}</button>${!novo ? '<button class="btn dng" id="excluirP" style="margin-left:auto">Excluir</button>' : ''}</div>` : ''}`;

    const linhaVar = () => { const d = document.createElement('div'); d.className = 'lj-var'; d.innerHTML = '<input data-vn placeholder="Ex.: M"><input data-vs placeholder="SKU (opcional)"><span class="small muted">nova</span><button type="button" class="lnk small" data-vdel>remover</button>'; return d; };
    $('#addVar')?.addEventListener('click', () => { $('#vars').append(linhaVar()); $('#vars .lj-var:last-child [data-vn]').focus(); });
    $('#vars').addEventListener('click', (e) => { if (e.target.closest('[data-vdel]')) { const l = e.target.closest('.lj-var'); if (!l.dataset.vid || confirm('Remover esta variação? Se ela já tiver vendas, só será desativada.')) l.remove(); } });
    $('#salvarP')?.addEventListener('click', async (e) => {
      const f = $('#fp');
      const d = Object.fromEntries(new FormData(f));
      d.ativo = f.ativo.checked; d.destaque = f.destaque.checked;
      d.variacoes = $$('#vars .lj-var').map((l) => ({ id: l.dataset.vid || null, nome: $('[data-vn]', l).value, sku: $('[data-vs]', l).value })).filter((v) => v.nome.trim());
      if (!d.nome.trim()) return toast('Dê um nome ao produto.', true);
      e.target.disabled = true;
      try {
        if (novo) { const r = await api('/loja/produtos', { method: 'POST', body: d }); await api('/loja/produtos/' + r.id, { method: 'PUT', body: { variacoes: d.variacoes } }); toast('Produto criado.'); ir('loja/produto/' + r.id); }
        else { await api('/loja/produtos/' + p.id, { method: 'PUT', body: d }); toast('Alterações salvas.'); produto(p.id); }
      } catch (er) { toast(er.message, true); e.target.disabled = false; }
    });
    $('#excluirP')?.addEventListener('click', async () => {
      if (!confirm(`Excluir "${p.nome}"? Se já tiver vendas, ele só sai da loja (o histórico fica).`)) return;
      try { const r = await api('/loja/produtos/' + p.id, { method: 'DELETE' }); toast(r.desativado ? 'Produto tirado da loja (tem vendas).' : 'Produto excluído.'); ir('loja/produtos'); } catch (er) { toast(er.message, true); }
    });
    if (novo) return;

    // fotos: reduz no navegador antes de enviar
    const reduzir = (file) => new Promise((ok) => {
      const img = new Image();
      img.onload = () => {
        const max = 1600, s = Math.min(1, max / Math.max(img.width, img.height));
        if (s === 1 && file.size < 1.5e6) { URL.revokeObjectURL(img.src); return ok(file); }
        const cv = document.createElement('canvas'); cv.width = Math.round(img.width * s); cv.height = Math.round(img.height * s);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(img.src);
        cv.toBlob((b) => ok(b || file), 'image/jpeg', 0.86);
      };
      img.onerror = () => ok(file);
      img.src = URL.createObjectURL(file);
    });
    const enviar = async (files) => {
      for (const f of files) {
        if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { toast('Use JPG, PNG ou WebP.', true); continue; }
        const b = await reduzir(f);
        try { await api(`/loja/produtos/${p.id}/fotos`, { method: 'POST', body: b, headers: { 'Content-Type': b.type || f.type } }); } catch (er) { toast(er.message, true); }
      }
      toast('Fotos enviadas.'); produto(p.id);
    };
    const drop = $('#dropF');
    if (drop) {
      $('#arqF').addEventListener('change', (e) => enviar([...e.target.files]));
      ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('on'); }));
      ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('on'); }));
      drop.addEventListener('drop', (e) => enviar([...e.dataTransfer.files]));
    }
    $$('[data-fdel]').forEach((b) => b.addEventListener('click', async () => { if (!confirm('Apagar esta foto?')) return; await api(`/loja/produtos/${p.id}/fotos/${b.dataset.fdel}`, { method: 'DELETE' }); produto(p.id); }));
    $$('[data-fup]').forEach((b) => b.addEventListener('click', async () => {
      const ids = p.fotos.map((f) => f.id); const i = ids.indexOf(+b.dataset.fup); ids.splice(i, 1); ids.unshift(+b.dataset.fup);
      await api(`/loja/produtos/${p.id}/fotos/ordem`, { method: 'PUT', body: { ids } }); produto(p.id);
    }));
    $('#fe')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try { const r = await api(`/loja/produtos/${p.id}/estoque`, { method: 'POST', body: Object.fromEntries(new FormData(e.target)) }); toast('Estoque atualizado: saldo ' + r.saldo + '.'); produto(p.id); } catch (er) { toast(er.message, true); }
    });
  }

  // ------------------------------------------------------------ estoque (visão geral + contagem rápida)
  async function estoque() {
    const { produtos } = await api('/loja/produtos');
    const linhas = [];
    for (const p of produtos) {
      const vs = p.variacoes.filter((v) => v.ativo);
      if (vs.length) vs.forEach((v) => linhas.push({ p, v, q: v.estoque })); else linhas.push({ p, v: null, q: p.estoque });
    }
    const g = P().loja_gerir;
    app.innerHTML = `<div class="head"><div><h1>Estoque</h1><p class="muted">${linhas.reduce((s, l) => s + Math.max(0, l.q), 0)} unidades em ${linhas.length} itens.${g ? ' Para uma contagem, digite o saldo contado e clique em “Salvar contagem”.' : ''}</p></div></div>
      ${abas('loja/estoque')}
      <div class="card" style="padding:6px 12px"><table class="tb"><thead><tr><th>Produto</th><th>Variação</th><th>Mínimo</th><th>Saldo</th>${g ? '<th>Contagem</th>' : ''}</tr></thead><tbody>
      ${linhas.map((l, i) => `<tr><td><a class="lnk" href="#loja/produto/${l.p.id}">${esc(l.p.nome)}</a>${l.p.ativo ? '' : ' <span class="small muted">(fora da loja)</span>'}</td><td>${esc(l.v ? l.v.nome : '—')}</td><td class="small muted">${l.p.estoque_minimo}</td>
        <td style="color:${l.q <= 0 ? '#e8a48a' : l.q <= l.p.estoque_minimo ? 'var(--cobre)' : 'inherit'}"><b style="font-weight:500">${l.q}</b></td>
        ${g ? `<td><input data-cont="${i}" inputmode="numeric" placeholder="${l.q}" style="width:90px;padding:6px 10px"></td>` : ''}</tr>`).join('')}
      </tbody></table>${linhas.length ? '' : '<div class="empty">Nenhum produto.</div>'}</div>
      ${g && linhas.length ? '<div class="acoes"><button class="btn pri" id="salvarCont">Salvar contagem</button></div>' : ''}`;
    $('#salvarCont')?.addEventListener('click', async (e) => {
      const alt = $$('[data-cont]').filter((x) => x.value.trim() !== '');
      if (!alt.length) return toast('Digite ao menos um saldo contado.', true);
      e.target.disabled = true;
      try {
        for (const x of alt) { const l = linhas[+x.dataset.cont]; await api(`/loja/produtos/${l.p.id}/estoque`, { method: 'POST', body: { tipo: 'contagem', quantidade: x.value, variacao_id: l.v ? l.v.id : null } }); }
        toast('Contagem salva.'); estoque();
      } catch (er) { toast(er.message, true); e.target.disabled = false; }
    });
  }

  // ------------------------------------------------------------ pedidos
  let fPed = { status: '', q: '' };
  async function pedidos(qs) {
    const pr = new URLSearchParams(qs || ''); if (pr.get('status')) fPed.status = pr.get('status');
    const { pedidos } = await api(`/loja/pedidos?status=${encodeURIComponent(fPed.status)}&q=${encodeURIComponent(fPed.q)}`);
    app.innerHTML = `<div class="head"><div><h1>Pedidos</h1><p class="muted">${pedidos.length} pedido(s) neste filtro.</p></div></div>
      ${abas('loja/pedidos')}
      <div class="filtros">${[['', 'Todos'], ['expedir', 'A expedir'], ['aguardando', ST.aguardando], ['pago', 'Pagos'], ['separacao', 'Em separação'], ['enviado', 'Enviados'], ['entregue', 'Entregues'], ['cancelado', 'Cancelados'], ['reembolsado', 'Reembolsados']]
        .map(([s, n]) => `<button class="chip" data-s="${s}" aria-pressed="${fPed.status === s}">${n}</button>`).join('')}
        <input type="search" id="buscaP" placeholder="Código, nome, e-mail ou CPF…" value="${esc(fPed.q)}"></div>
      <div class="card" style="padding:6px 12px"><table class="tb"><thead><tr><th>Pedido</th><th>Cliente</th><th>Situação</th><th>Entrega</th><th style="text-align:right">Total</th></tr></thead><tbody>
      ${pedidos.map((p) => `<tr class="click" data-id="${p.id}"><td><b style="font-weight:500">${esc(p.codigo)}</b><div class="small muted">${data(p.criado_em)}</div></td>
        <td>${esc(p.nome)}<div class="small muted">${esc(p.cidade || '')}${p.uf ? '/' + esc(p.uf) : ''} · ${p.n_itens} item(ns)</div></td><td>${st(p.status)}${p.pagamento_metodo ? `<div class="small muted">${esc(p.pagamento_metodo)}</div>` : ''}</td>
        <td class="small">${esc(p.frete_nome || '')}${p.rastreio ? `<div class="muted">${esc(p.rastreio)}</div>` : ''}</td><td style="text-align:right">${brl(p.total)}</td></tr>`).join('')}
      </tbody></table>${pedidos.length ? '' : '<div class="empty">Nenhum pedido aqui.</div>'}</div>`;
    $$('.chip[data-s]').forEach((b) => b.addEventListener('click', () => { fPed.status = b.dataset.s; pedidos(); }));
    let t; $('#buscaP').addEventListener('input', (e) => { fPed.q = e.target.value; clearTimeout(t); t = setTimeout(() => pedidos().then(() => { const i = $('#buscaP'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }), 350); });
    $$('tr[data-id]').forEach((tr) => tr.addEventListener('click', () => ir('loja/pedido/' + tr.dataset.id)));
  }

  async function pedido(id) {
    const r = await api('/loja/pedidos/' + id);
    const p = r.pedido, g = P().loja_gerir, x = P().loja_expedir;
    const ret = p.frete_servico === 'retirada';
    const prox = { pago: 'separacao', separacao: 'enviado', enviado: 'entregue' }[p.status];
    const wa = 'https://wa.me/55' + String(p.telefone || '').replace(/\D/g, '') + '?text=' + encodeURIComponent(`Olá, ${p.nome.split(' ')[0]}! Aqui é da loja The Prophetic Voices, sobre o seu pedido ${p.codigo}. Acompanhe por aqui: ${r.link_cliente}`);
    app.innerHTML = `<p class="small"><a href="#loja/pedidos" class="lnk">← Pedidos</a></p>
      <div class="head"><div><h1>Pedido ${esc(p.codigo)}</h1><p class="muted">${st(p.status)} &nbsp; feito ${data(p.criado_em)}${p.pago_em ? ' · pago ' + data(p.pago_em) : ''}${p.enviado_em ? ' · enviado ' + data(p.enviado_em) : ''}</p></div>
        <a class="btn" href="${esc(wa)}" target="_blank" rel="noopener">WhatsApp do cliente</a></div>
      ${faixaTeste(r.teste)}
      <div class="grid2">
        <div class="stack">
          <div class="card"><h3>Itens</h3><table class="tb"><tbody>${r.itens.map((i) => `<tr><td>${i.quantidade}×</td><td>${esc(i.nome)}${i.variacao ? ' — <b style="font-weight:500">' + esc(i.variacao) + '</b>' : ''}</td><td style="text-align:right">${brl(i.preco * i.quantidade)}</td></tr>`).join('')}
            <tr><td></td><td class="muted">Frete · ${esc(p.frete_nome || '')}${p.frete_prazo ? ` (${p.frete_prazo} dias úteis)` : ''}</td><td style="text-align:right">${brl(p.frete)}</td></tr>
            <tr><td></td><td><b style="font-weight:500">Total</b></td><td style="text-align:right"><b style="font-weight:500">${brl(p.total)}</b></td></tr></tbody></table></div>
          <div class="card"><h3>Cliente</h3><p class="meta" style="margin:0;line-height:1.8">${esc(p.nome)}<br>${esc(p.email)} · ${esc(p.telefone || '')}<br>CPF ${esc(p.cpf || '')}</p>
            <h3 style="margin-top:18px">${ret ? 'Retirada pessoal' : 'Entrega'}</h3><p class="meta" style="margin:0;line-height:1.8">${ret ? 'O cliente vai retirar pessoalmente.' : `${esc(p.rua)}, ${esc(p.numero)}${p.complemento ? ' — ' + esc(p.complemento) : ''}<br>${esc(p.bairro)} · ${esc(p.cidade)}/${esc(p.uf)} · CEP ${esc(p.cep)}`}</p>
            ${p.observacao ? `<h3 style="margin-top:18px">Observação do cliente</h3><p class="meta" style="margin:0">${esc(p.observacao)}</p>` : ''}</div>
          <div class="card"><h3>Pagamento</h3><p class="meta" style="margin:0;line-height:1.8">${esc(p.pagamento_metodo || '—')}${p.mp_status ? ` · Mercado Pago: <b>${esc(p.mp_status)}</b>` : ''}${p.mp_pagamento ? `<br>ID do pagamento: ${esc(p.mp_pagamento)}` : ''}</p>
            <div class="lj-linha" style="margin-top:12px">${p.status === 'aguardando' ? '<button class="btn sm" id="sinc">Consultar Mercado Pago</button>' : ''}
            ${g && p.mp_pagamento && ['pago', 'separacao'].includes(p.status) ? '<button class="btn sm dng" id="reemb">Reembolsar</button>' : ''}</div>
            <p class="small muted" style="margin:10px 0 0">Link de acompanhamento do cliente: <a class="lnk" href="${esc(r.link_cliente)}" target="_blank" rel="noopener">abrir</a> · <button class="lnk small" data-copiar="${esc(r.link_cliente)}">copiar</button></p></div>
        </div>
        <div class="stack">
          ${x ? `<div class="card"><h3>Expedição</h3>
            ${prox ? `<button class="btn pri" data-st="${prox}" style="width:100%">Marcar como “${ST[prox]}”</button>` : ''}
            ${!ret && ['pago', 'separacao'].includes(p.status) ? `<button class="btn cob" id="etiq" style="width:100%;margin-top:10px">${p.me_pedido ? 'Tentar gerar etiqueta de novo' : 'Comprar etiqueta no Melhor Envio'}</button><p class="small muted" style="margin:8px 0 0">Usa o saldo da sua carteira no Melhor Envio (${esc(p.frete_nome || '')} · ${brl(p.frete)} cobrado do cliente).</p>` : ''}
            ${p.etiqueta_url ? `<a class="btn" style="width:100%;margin-top:10px" href="${esc(p.etiqueta_url)}" target="_blank" rel="noopener">Imprimir etiqueta ↗</a>` : ''}
            ${p.me_pedido && !r.teste.frete ? '<button class="btn sm" id="rast" style="margin-top:10px">Atualizar rastreio</button>' : ''}
            <form id="fx" class="form" style="margin-top:14px">
              <label class="f"><span>Código de rastreio</span><input name="rastreio" value="${esc(p.rastreio || '')}"></label>
              <label class="f"><span>Nota interna (só a equipe vê)</span><textarea name="nota_interna" rows="3">${esc(p.nota_interna || '')}</textarea></label>
              <div class="f"><button class="btn sm" type="submit">Salvar</button></div></form></div>` : ''}
          ${g ? `<div class="card"><h3>Situação (gerente)</h3><div class="form"><label class="f"><span>Mudar para</span><select id="stSel">${Object.keys(ST).map((s) => `<option value="${s}" ${s === p.status ? 'selected' : ''}>${ST[s]}</option>`).join('')}</select>
            <small>Ao marcar como pago, o estoque sai; ao cancelar ou reembolsar um pedido pago, o estoque volta. Reembolso aqui não devolve o dinheiro — use o botão “Reembolsar”.</small></label>
            <div class="f"><button class="btn sm" id="stOk">Aplicar</button></div></div></div>` : ''}
        </div>
      </div>`;
    const put = async (body, msg) => { try { await api('/loja/pedidos/' + p.id, { method: 'PUT', body }); toast(msg); pedido(p.id); } catch (er) { toast(er.message, true); } };
    $$('[data-st]').forEach((b) => b.addEventListener('click', () => put({ status: b.dataset.st }, 'Situação atualizada.')));
    $('#stOk')?.addEventListener('click', () => { const v = $('#stSel').value; if (v !== p.status && confirm(`Mudar o pedido para “${ST[v]}”?`)) put({ status: v }, 'Situação atualizada.'); });
    $('#fx')?.addEventListener('submit', (e) => { e.preventDefault(); put(Object.fromEntries(new FormData(e.target)), 'Salvo.'); });
    $('#sinc')?.addEventListener('click', async () => { try { await api(`/loja/pedidos/${p.id}/sincronizar`, { method: 'POST' }); toast('Consulta feita.'); pedido(p.id); } catch (er) { toast(er.message, true); } });
    $('#reemb')?.addEventListener('click', async () => {
      if (!confirm(`Devolver ${brl(p.total)} ao cliente pelo Mercado Pago? O estoque volta. Esta ação não pode ser desfeita.`)) return;
      try { await api(`/loja/pedidos/${p.id}/reembolso`, { method: 'POST' }); toast('Reembolso feito.'); pedido(p.id); } catch (er) { toast(er.message, true); }
    });
    $('#etiq')?.addEventListener('click', async (e) => {
      if (!confirm('Comprar a etiqueta no Melhor Envio agora? O valor sai do saldo da sua carteira lá.')) return;
      e.target.disabled = true; e.target.textContent = 'Gerando…';
      try { const r2 = await api(`/loja/pedidos/${p.id}/etiqueta`, { method: 'POST' }); toast(r2.simulacao ? 'Etiqueta simulada (modo de teste).' : 'Etiqueta gerada.'); if (r2.url) window.open(r2.url, '_blank', 'noopener'); pedido(p.id); }
      catch (er) { toast(er.message, true); e.target.disabled = false; e.target.textContent = 'Tentar de novo'; }
    });
    $('#rast')?.addEventListener('click', async () => { try { const r2 = await api(`/loja/pedidos/${p.id}/rastreio`, { method: 'POST' }); toast(r2.rastreio ? 'Rastreio: ' + r2.rastreio : 'Ainda sem código de rastreio.'); pedido(p.id); } catch (er) { toast(er.message, true); } });
  }

  // ------------------------------------------------------------ configurações
  async function configuracoes() {
    const r = await api('/loja/config');
    const k = r.config, g = P().loja_gerir;
    const ok = (b, sim, nao) => `<span class="st ${b ? 'publicado' : 'revisao'}">${b ? sim : nao}</span>`;
    app.innerHTML = `<div class="head"><div><h1>Configurações da loja</h1><p class="muted">Frete, remetente das etiquetas e integrações.</p></div></div>
      ${abas('loja/config')}
      <div class="grid2">
        <form id="fc" class="card"><fieldset ${g ? '' : 'disabled'}><div class="form">
          <div class="sec" style="margin-top:0;padding-top:0;border:0">Loja</div>
          <label class="f check"><input type="checkbox" name="loja_aberta" ${k.loja_aberta !== '0' ? 'checked' : ''}> Loja aberta para pedidos</label>
          ${cp('aviso', 'Aviso no topo da loja (opcional)', k.aviso, { ph: 'Ex.: envios a partir de 10/12' })}
          ${cp('parcelas_max', 'Máximo de parcelas no cartão', k.parcelas_max, { s: 2, num: 1 })}
          <div class="sec">Frete</div>
          ${cp('cep_origem', 'CEP de origem (de onde sai)', k.cep_origem, { s: 2 })}
          ${cp('prazo_extra_dias', 'Dias extras de preparo', k.prazo_extra_dias, { s: 2, num: 1, dica: 'Somados ao prazo da transportadora.' })}
          ${cp('frete_gratis_acima', 'Frete grátis acima de (centavos)', k.frete_gratis_acima, { s: 2, num: 1, dica: 'Ex.: 30000 = R$ 300,00. Vazio = nunca.' })}
          ${cp('servicos_frete', 'Serviços do Melhor Envio', k.servicos_frete, { dica: 'Números separados por vírgula. 1 = PAC, 2 = SEDEX, 3 = Jadlog .Package, 4 = Jadlog .Com, 17 = Mini Envios.' })}
          ${cp('retirada_local', 'Retirada pessoal (opcional)', k.retirada_local, { ph: 'Ex.: Igreja One Imperatriz, domingos após o culto', dica: 'Se preenchido, aparece a opção grátis “Retirar pessoalmente”.' })}
          <div class="sec">Remetente (sai na etiqueta)</div>
          ${cp('remetente_nome', 'Nome', k.remetente_nome, { s: 3 })}${cp('remetente_telefone', 'Telefone', k.remetente_telefone, { s: 3 })}
          ${cp('remetente_email', 'E-mail', k.remetente_email, { s: 3 })}${cp('remetente_documento', 'CPF', k.remetente_documento, { s: 3, dica: 'Ou preencha o CNPJ.' })}
          ${cp('remetente_cnpj', 'CNPJ', k.remetente_cnpj, { s: 3 })}${cp('remetente_endereco', 'Rua', k.remetente_endereco, { s: 3 })}
          ${cp('remetente_numero', 'Número', k.remetente_numero, { s: 2 })}${cp('remetente_complemento', 'Complemento', k.remetente_complemento, { s: 2 })}${cp('remetente_bairro', 'Bairro', k.remetente_bairro, { s: 2 })}
          ${cp('remetente_cidade', 'Cidade', k.remetente_cidade, { s: 4 })}${cp('remetente_uf', 'UF', k.remetente_uf, { s: 2 })}
          ${g ? '<div class="f"><button class="btn pri" type="submit">Salvar configurações</button></div>' : ''}
        </div></fieldset></form>
        <div class="stack">
          <div class="card"><h3>Mercado Pago</h3><p class="meta">${ok(!r.teste.pagamento, 'Conectado', 'Modo de teste')} &nbsp; Pix, crédito, débito e boleto</p>
            <p class="small muted">Para ativar: no Cloudflare, adicione o segredo <b>MP_ACCESS_TOKEN</b> (Access Token de produção). Depois, no painel do Mercado Pago → Suas integrações → Webhooks, cadastre o endereço abaixo (evento “Pagamentos”) e copie a assinatura secreta para o segredo <b>MP_WEBHOOK_SECRET</b>.</p>
            <div class="link-box"><input readonly value="${esc(r.webhook)}" onclick="this.select()"><button class="btn sm" data-copiar="${esc(r.webhook)}">Copiar</button></div>
            <p class="small muted" style="margin-top:8px">Assinatura do webhook: ${r.assinatura_webhook ? 'configurada ✓' : 'não configurada'}</p></div>
          <div class="card"><h3>Melhor Envio</h3><p class="meta">${ok(!r.teste.frete, 'Conectado (' + (r.ambiente_frete === 'sandbox' ? 'sandbox' : 'produção') + ')', 'Modo de teste')} &nbsp; cotação e etiquetas</p>
            <p class="small muted">Para ativar: no Melhor Envio → Gerenciar → Tokens, gere um token com as permissões de cotação, carrinho, compra, geração e impressão de etiquetas e de rastreio, e adicione-o no Cloudflare como o segredo <b>MELHOR_ENVIO_TOKEN</b>. As etiquetas são pagas com o saldo da carteira do Melhor Envio.</p></div>
        </div>
      </div>`;
    $('#fc').addEventListener('submit', async (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.target)); d.loja_aberta = e.target.loja_aberta.checked ? '1' : '0';
      try { await api('/loja/config', { method: 'PUT', body: d }); toast('Configurações salvas.'); } catch (er) { toast(er.message, true); }
    });
  }

  // ------------------------------------------------------------ rotas
  return async function rota(h) {
    marcarMenu('loja');
    if (!P().loja_ver) return ir('artigos');
    app.innerHTML = '<p class="muted center">Carregando…</p>';
    const [r, qs] = h.split('?');
    if (r === 'loja') return resumo();
    if (r === 'loja/produtos') return produtos();
    if (r.startsWith('loja/produto/')) return produto(r.slice(13));
    if (r === 'loja/estoque') return estoque();
    if (r === 'loja/pedidos') return pedidos(qs);
    if (r.startsWith('loja/pedido/')) return pedido(r.slice(12));
    if (r === 'loja/config') return configuracoes();
    return resumo();
  };
}

export const ACOES_LOJA = {
  gerente: ['Cadastra e edita produtos, fotos, preços e variações', 'Lança entradas, saídas e contagens de estoque', 'Vê e altera qualquer pedido, faz reembolsos', 'Gera etiquetas e altera as configurações da loja'],
  expedicao: ['Vê produtos, estoque e pedidos', 'Gera etiquetas no Melhor Envio e informa o rastreio', 'Marca pedidos como em separação, enviados e entregues'],
  visualizador: ['Vê produtos, estoque e pedidos', 'Não altera nada'],
  nenhum: ['Não vê a área da loja'],
};
