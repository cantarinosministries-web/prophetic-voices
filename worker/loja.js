// Loja virtual do The Prophetic Voices.
//   /api/loja/publico/*   vitrine, CEP, frete, criação e consulta de pedidos (sem login)
//   /api/loja/mp/webhook  avisos do Mercado Pago (pagamento aprovado, recusado, estornado…)
//   /api/loja/*           painel da loja (produtos, fotos, estoque, pedidos, etiquetas, configurações)
//
// Integrações (segredos no Cloudflare):
//   MP_ACCESS_TOKEN      Mercado Pago, "Access Token" de produção (Pix, crédito, débito, boleto)
//   MP_WEBHOOK_SECRET    Mercado Pago, "assinatura secreta" dos webhooks
//   MELHOR_ENVIO_TOKEN   Melhor Envio, token de acesso (cotação e etiquetas)
//   ME_AMBIENTE          'producao' (padrão) ou 'sandbox'
// Sem as chaves a loja funciona em MODO DE TESTE: frete e pagamento são simulados.
import { aleatorio, sha256, hex, iguais, json, erro } from './seguranca.js';
import { podeLoja } from './permissoes.js';
import { usuarioDaSessao } from './api.js';

// enquanto o Mercado Pago não estiver conectado, só a equipe logada consegue testar a compra
async function equipeTestando(env, req) { const u = await usuarioDaSessao(env, req); return !!(u && podeLoja(u, 'ver')); }

const STATUS = ['aguardando', 'pago', 'separacao', 'enviado', 'entregue', 'cancelado', 'reembolsado'];
const deStatusVendido = (status) => ['pago', 'separacao', 'enviado', 'entregue'].includes(status);
const STATUS_NOME = {
  aguardando: 'Aguardando pagamento', pago: 'Pago', separacao: 'Em separação', enviado: 'Enviado',
  entregue: 'Entregue', cancelado: 'Cancelado', reembolsado: 'Reembolsado',
};
const CONFIG_CAMPOS = ['cep_origem', 'frete_gratis_acima', 'prazo_extra_dias', 'servicos_frete', 'retirada_local', 'parcelas_max',
  'remetente_nome', 'remetente_documento', 'remetente_cnpj', 'remetente_telefone', 'remetente_email', 'remetente_endereco',
  'remetente_numero', 'remetente_complemento', 'remetente_bairro', 'remetente_cidade', 'remetente_uf', 'loja_aberta', 'aviso'];

const so = (s) => String(s || '').replace(/\D/g, '');
const txt = (s, n = 200) => String(s ?? '').trim().slice(0, n);
const reais = (c) => Math.round(c) / 100;
const brl = (c) => 'R$ ' + (c / 100).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const lojaPronta = (env) => !!(env.MP_ACCESS_TOKEN && env.MP_WEBHOOK_SECRET && env.MELHOR_ENVIO_TOKEN && env.ME_AMBIENTE !== 'sandbox');
const modoTeste = (env) => ({ pagamento: !env.MP_ACCESS_TOKEN, frete: !env.MELHOR_ENVIO_TOKEN });

async function corpoJson(req) {
  try { return await req.json(); } catch (e) { return {}; }
}

export async function config(env) {
  const r = await env.DB.prepare('SELECT chave, valor FROM loja_config').all();
  const c = {};
  for (const x of r.results) c[x.chave] = x.valor ?? '';
  return c;
}

function cpfValido(c) {
  c = so(c);
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  for (const t of [9, 10]) {
    let s = 0;
    for (let i = 0; i < t; i++) s += +c[i] * (t + 1 - i);
    if (((s * 10) % 11) % 10 !== +c[t]) return false;
  }
  return true;
}

// ---------------------------------------------------------------- produtos
async function produtosCompletos(env, onde = 'p.ativo = 1', binds = []) {
  const p = (await env.DB.prepare(`SELECT p.* FROM produtos p WHERE ${onde} ORDER BY p.destaque DESC, p.ordem, p.nome`).bind(...binds).all()).results;
  if (!p.length) return [];
  const ids = p.map((x) => x.id);
  const ph = ids.map(() => '?').join(',');
  const v = (await env.DB.prepare(`SELECT * FROM produto_variacoes WHERE produto_id IN (${ph}) ORDER BY ordem, id`).bind(...ids).all()).results;
  const f = (await env.DB.prepare(`SELECT * FROM produto_fotos WHERE produto_id IN (${ph}) ORDER BY ordem, id`).bind(...ids).all()).results;
  return p.map((x) => ({ ...x, variacoes: v.filter((y) => y.produto_id === x.id), fotos: f.filter((y) => y.produto_id === x.id) }));
}

function paraVitrine(p) {
  const vars = p.variacoes.filter((v) => v.ativo);
  const estoque = vars.length ? vars.reduce((s, v) => s + Math.max(0, v.estoque), 0) : Math.max(0, p.estoque);
  return {
    id: p.id, slug: p.slug, nome: p.nome, categoria: p.categoria, descricao: p.descricao, preco: p.preco, preco_de: p.preco_de,
    destaque: !!p.destaque, disponivel: estoque > 0, fotos: p.fotos.map((f) => f.url),
    variacoes: vars.map((v) => ({ id: v.id, nome: v.nome, disponivel: v.estoque > 0, poucas: v.estoque > 0 && v.estoque <= 3 })),
    poucas: estoque > 0 && estoque <= 3,
  };
}

// confere itens do carrinho contra o banco (preço e estoque sempre do servidor)
async function conferirItens(env, itens) {
  if (!Array.isArray(itens) || !itens.length) throw new Error('Seu carrinho está vazio.');
  if (itens.length > 30) throw new Error('Carrinho grande demais.');
  const ids = [...new Set(itens.map((i) => parseInt(i.produto_id, 10)).filter(Boolean))];
  const prods = await produtosCompletos(env, `p.ativo = 1 AND p.id IN (${ids.map(() => '?').join(',') || '0'})`, ids);
  const saida = [];
  for (const i of itens) {
    const p = prods.find((x) => x.id === parseInt(i.produto_id, 10));
    const q = Math.min(99, Math.max(1, parseInt(i.quantidade, 10) || 1));
    if (!p || p.preco <= 0) throw new Error('Um dos produtos do carrinho não está mais à venda.');
    const ativas = p.variacoes.filter((v) => v.ativo);
    let v = null;
    if (ativas.length) {
      v = ativas.find((x) => x.id === parseInt(i.variacao_id, 10));
      if (!v) throw new Error(`Escolha o tamanho/variação de “${p.nome}”.`);
    }
    const disp = v ? v.estoque : p.estoque;
    const ja = saida.filter((s) => s.produto.id === p.id && (s.variacao ? s.variacao.id : null) === (v ? v.id : null)).reduce((s, x) => s + x.quantidade, 0);
    if (disp < q + ja) throw new Error(disp > 0 ? `Só temos ${disp} unidade(s) de “${p.nome}${v ? ' — ' + v.nome : ''}”.` : `“${p.nome}${v ? ' — ' + v.nome : ''}” esgotou.`);
    saida.push({ produto: p, variacao: v, quantidade: q, preco: p.preco });
  }
  return saida;
}

// ---------------------------------------------------------------- frete (Melhor Envio)
const meBase = (env) => (env.ME_AMBIENTE === 'sandbox' ? 'https://sandbox.melhorenvio.com.br' : 'https://melhorenvio.com.br');

async function me(env, metodo, caminho, dados) {
  const r = await fetch(meBase(env) + caminho, {
    method: metodo,
    headers: {
      Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${env.MELHOR_ENVIO_TOKEN}`,
      'User-Agent': 'The Prophetic Voices (cantarinosministries@gmail.com)',
    },
    body: dados ? JSON.stringify(dados) : undefined,
  });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch (e) { j = { message: t.slice(0, 300) }; }
  if (!r.ok) {
    const det = j.errors ? Object.values(j.errors).flat().join(' ') : (j.message || j.error || r.status);
    throw new Error('Melhor Envio: ' + det);
  }
  return j;
}

function volume(itens) {
  let peso = 0, alt = 0, larg = 0, comp = 0;
  for (const i of itens) {
    const p = i.produto;
    peso += (p.peso_g || 300) * i.quantidade;
    alt += (p.altura_cm || 4) * i.quantidade;
    larg = Math.max(larg, p.largura_cm || 16);
    comp = Math.max(comp, p.comprimento_cm || 23);
  }
  return { height: Math.max(2, Math.ceil(alt)), width: Math.max(11, Math.ceil(larg)), length: Math.max(16, Math.ceil(comp)), weight: Math.max(0.1, peso / 1000) };
}

async function cotarFrete(env, cfg, cep, itens) {
  cep = so(cep);
  if (cep.length !== 8) throw new Error('CEP inválido.');
  const subtotal = itens.reduce((s, i) => s + i.preco * i.quantidade, 0);
  const extra = parseInt(cfg.prazo_extra_dias, 10) || 0;
  let op = [];
  if (modoTeste(env).frete) {
    const kg = volume(itens).weight;
    op = [
      { id: '1', nome: 'PAC', empresa: 'Correios', preco: Math.round((19.9 + 6 * kg) * 100), prazo: 8 },
      { id: '2', nome: 'SEDEX', empresa: 'Correios', preco: Math.round((32.9 + 11 * kg) * 100), prazo: 3 },
    ];
  } else {
    const r = await me(env, 'POST', '/api/v2/me/shipment/calculate', {
      from: { postal_code: so(cfg.cep_origem) }, to: { postal_code: cep },
      products: itens.map((i, n) => ({
        id: String(n + 1), width: i.produto.largura_cm, height: i.produto.altura_cm, length: i.produto.comprimento_cm,
        weight: (i.produto.peso_g || 300) / 1000, insurance_value: reais(i.preco), quantity: i.quantidade,
      })),
      options: { receipt: false, own_hand: false },
      services: cfg.servicos_frete || '1,2,3,4,17',
    });
    op = (Array.isArray(r) ? r : []).filter((s) => !s.error && (s.custom_price || s.price)).map((s) => ({
      id: String(s.id), nome: s.name, empresa: s.company ? s.company.name : '',
      preco: Math.round(parseFloat(s.custom_price || s.price) * 100), prazo: parseInt(s.custom_delivery_time || s.delivery_time, 10) || null,
    }));
  }
  op = op.map((o) => ({ ...o, prazo: o.prazo ? o.prazo + extra : null })).sort((a, b) => a.preco - b.preco);
  const gratis = parseInt(so(cfg.frete_gratis_acima), 10);
  if (gratis && subtotal >= gratis && op.length) op[0] = { ...op[0], preco_original: op[0].preco, preco: 0, gratis: true };
  if (txt(cfg.retirada_local)) op.push({ id: 'retirada', nome: 'Retirar pessoalmente', empresa: txt(cfg.retirada_local, 300), preco: 0, prazo: null });
  return { opcoes: op, simulacao: modoTeste(env).frete };
}

// ---------------------------------------------------------------- Mercado Pago
async function mp(env, metodo, caminho, dados, chaveIdem) {
  const h = { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' };
  if (chaveIdem) h['X-Idempotency-Key'] = chaveIdem;
  const r = await fetch('https://api.mercadopago.com' + caminho, { method: metodo, headers: h, body: dados ? JSON.stringify(dados) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error('Mercado Pago: ' + (j.message || r.status));
  return j;
}

async function hmacHex(segredo, texto) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(segredo), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(texto)));
}

const METODO = { pix: 'Pix', bank_transfer: 'Pix', ticket: 'Boleto', credit_card: 'Cartão de crédito', debit_card: 'Cartão de débito', account_money: 'Saldo Mercado Pago', prepaid_card: 'Cartão pré-pago' };

// O D1 aplica o movimento e o status na mesma operação.
async function aplicarPagamento(env, pedido, pg) {
  const status = pg.status;
  const pagamento = String(pg.id);
  const simulacao = modoTeste(env).pagamento && pagamento.startsWith('TESTE-');
  if (!simulacao && pg.external_reference !== pedido.codigo) return;
  const metodo = METODO[pg.payment_type_id] || METODO[pg.payment_method_id] || pg.payment_type_id || null;
  if (status === 'approved') {
    if (pedido.mp_status === 'approved' && pedido.mp_pagamento && pedido.mp_pagamento !== pagamento) {
      await env.DB.prepare("UPDATE pedidos SET nota_interna = 'Mais de um pagamento aprovado. Confira no Mercado Pago.' WHERE id = ?")
        .bind(pedido.id).run();
      return;
    }
    if ((!simulacao && pg.currency_id !== 'BRL') || Math.round(Number(pg.transaction_amount) * 100) !== pedido.total) {
      await env.DB.prepare("UPDATE pedidos SET nota_interna = 'Pagamento com valor ou moeda divergente. Confira no Mercado Pago.' WHERE id = ? AND estoque_baixado = 0")
        .bind(pedido.id).run();
      return;
    }
    try {
      await env.DB.prepare(`UPDATE pedidos SET status = CASE WHEN status IN ('aguardando','cancelado') THEN 'pago' ELSE status END,
        mp_pagamento = ?, mp_status = 'approved', pagamento_metodo = COALESCE(?, pagamento_metodo), estoque_baixado = 1,
        motivo_estoque = 'Venda', usuario_estoque = NULL, pago_em = COALESCE(pago_em, datetime('now')), atualizado_em = datetime('now')
        WHERE id = ? AND status <> 'reembolsado' AND (estoque_baixado = 0 OR mp_pagamento IS NULL OR mp_pagamento = ?)
          AND (mp_status IS NOT 'approved' OR mp_pagamento = ?)`)
        .bind(pagamento, metodo, pedido.id, pagamento, pagamento).run();
    } catch (error) {
      if (!String(error).includes('PV_ESTOQUE_INSUFICIENTE')) throw error;
      await env.DB.prepare(`UPDATE pedidos SET mp_pagamento = ?, mp_status = 'approved',
        nota_interna = 'Pagamento aprovado sem estoque. Reponha e sincronize ou reembolse.'
        WHERE id = ? AND estoque_baixado = 0 AND status <> 'reembolsado'
          AND (mp_status IS NOT 'approved' OR mp_pagamento = ?)`).bind(pagamento, pedido.id, pagamento).run();
    }
    return;
  }
  if (['refunded', 'charged_back'].includes(status)) {
    await env.DB.prepare(`UPDATE pedidos SET status = 'reembolsado', mp_status = ?, estoque_baixado = 0,
      motivo_estoque = 'Estorno', usuario_estoque = NULL, atualizado_em = datetime('now')
      WHERE id = ? AND mp_pagamento = ?`).bind(status, pedido.id, pagamento).run();
  }
}

async function sincronizarPagamento(env, pedido, pagamentoId) {
  if (modoTeste(env).pagamento) return pedido;
  let pg = null;
  if (pagamentoId) {
    pg = await mp(env, 'GET', `/v1/payments/${encodeURIComponent(pagamentoId)}`);
    if (pg.external_reference !== pedido.codigo) return pedido;
  } else {
    const r = await mp(env, 'GET', `/v1/payments/search?external_reference=${encodeURIComponent(pedido.codigo)}&sort=date_created&criteria=desc`);
    const res = r.results || [];
    pg = res.find((x) => String(x.id) === pedido.mp_pagamento) || res.find((x) => x.status === 'approved') || res.find((x) => ['refunded', 'charged_back'].includes(x.status)) || res[0];
  }
  if (pg) await aplicarPagamento(env, pedido, pg);
  return env.DB.prepare('SELECT * FROM pedidos WHERE id = ?').bind(pedido.id).first();
}

async function linkPagamento(env, origem, pedido, itens) {
  const voltar = `${origem}/pedido.html?codigo=${pedido.codigo}&chave=${pedido.chave}`;
  if (modoTeste(env).pagamento) return voltar + '&simulacao=1';
  if (pedido.mp_checkout_url) return pedido.mp_checkout_url;
  const cfg = await config(env);
  const nomes = pedido.nome.split(/\s+/);
  const pref = await mp(env, 'POST', '/checkout/preferences', {
    items: [
      ...itens.map((i) => ({
        id: String(i.produto_id), title: i.variacao ? `${i.nome} — ${i.variacao}` : i.nome, quantity: i.quantidade,
        unit_price: reais(i.preco), currency_id: 'BRL',
      })),
      ...(pedido.frete > 0 ? [{ id: 'frete', title: `Frete — ${pedido.frete_nome}`, quantity: 1, unit_price: reais(pedido.frete), currency_id: 'BRL' }] : []),
    ],
    payer: {
      name: nomes[0], surname: nomes.slice(1).join(' ') || undefined, email: pedido.email,
      identification: { type: 'CPF', number: pedido.cpf }, phone: { area_code: pedido.telefone.slice(0, 2), number: pedido.telefone.slice(2) },
    },
    external_reference: pedido.codigo,
    notification_url: `${origem}/api/loja/mp/webhook`,
    back_urls: { success: voltar, pending: voltar, failure: voltar },
    auto_return: 'approved',
    statement_descriptor: 'PROPHETICVOICES',
    payment_methods: { installments: Math.min(12, Math.max(1, parseInt(cfg.parcelas_max, 10) || 12)) },
  }, 'pref-' + pedido.codigo);
  await env.DB.prepare('UPDATE pedidos SET mp_preferencia = ?, mp_checkout_url = ? WHERE id = ?').bind(pref.id, pref.init_point, pedido.id).run();
  return pref.init_point;
}

async function iniciarCheckout(env, origem, pedido, itens) {
  const acompanhar = `/pedido.html?codigo=${pedido.codigo}&chave=${pedido.chave}`;
  let ir = acompanhar;
  if (pedido.status === 'aguardando' && pedido.mp_status !== 'approved') {
    try {
      ir = await linkPagamento(env, origem, pedido, itens);
    } catch {
      console.warn('Falha ao abrir o checkout', pedido.codigo);
    }
  }
  return json({ codigo: pedido.codigo, chave: pedido.chave, ir }, 201);
}

function pedidoPublico(p, itens) {
  return {
    codigo: p.codigo, status: p.status, status_nome: STATUS_NOME[p.status], criado_em: p.criado_em, pago_em: p.pago_em, enviado_em: p.enviado_em,
    subtotal: p.subtotal, frete: p.frete, desconto: p.desconto, total: p.total, frete_nome: p.frete_nome, frete_prazo: p.frete_prazo,
    pagamento_metodo: p.pagamento_metodo, mp_status: p.mp_status, rastreio: p.rastreio,
    itens: itens.map((i) => ({ nome: i.nome, variacao: i.variacao, preco: i.preco, quantidade: i.quantidade })),
  };
}

async function novoCodigo(env) {
  const ano = String(new Date().getUTCFullYear()).slice(2);
  for (let t = 0; t < 8; t++) {
    const c = `PV-${ano}${String(Math.floor(Math.random() * 1e6)).padStart(6, '0')}`;
    if (!(await env.DB.prepare('SELECT 1 FROM pedidos WHERE codigo = ?').bind(c).first())) return c;
  }
  throw new Error('Tente novamente.');
}

// ---------------------------------------------------------------- rotas públicas
export async function apiLojaPublica(req, env, url) {
  const m = req.method;
  const p = url.pathname.replace(/^\/api\/loja\/publico/, '').replace(/\/+$/, '') || '/';
  const cfg = await config(env);

  if (p === '/produtos' && m === 'GET') {
    const prods = (await produtosCompletos(env)).filter((x) => x.preco > 0).map(paraVitrine);
    const teste = modoTeste(env);
    return json({ produtos: prods, loja_aberta: cfg.loja_aberta !== '0' && (teste.pagamento ? await equipeTestando(env, req) : lojaPronta(env)), aviso: cfg.aviso || '', teste }, 200, { 'Cache-Control': 'no-cache' });
  }

  const mcep = p.match(/^\/cep\/(\d{8})$/);
  if (mcep && m === 'GET') {
    let r, j;
    try {
      r = await fetch(`https://viacep.com.br/ws/${mcep[1]}/json/`, { headers: { Accept: 'application/json' } });
      j = await r.json().catch(() => null);
    } catch (e) { return erro('Consulta de CEP indisponível; preencha o endereço.', 502); }
    if (!r.ok || !j || j.erro) return erro('CEP não encontrado.', 404);
    return json({ cep: mcep[1], rua: j.logradouro, bairro: j.bairro, cidade: j.localidade, uf: j.uf, complemento: j.complemento });
  }

  if (p === '/frete' && m === 'POST') {
    const d = await corpoJson(req);
    try {
      const itens = await conferirItens(env, d.itens);
      return json(await cotarFrete(env, cfg, d.cep, itens));
    } catch (e) { return erro(e.message); }
  }

  if (p === '/pedido' && m === 'POST') {
    if (cfg.loja_aberta === '0' || (!modoTeste(env).pagamento && !lojaPronta(env))) return erro('A loja está temporariamente fechada para pedidos.', 503);
    if (modoTeste(env).pagamento && !(await equipeTestando(env, req))) return erro('As vendas on-line abrem em breve. Por enquanto, fale conosco pelo WhatsApp.', 503);
    const d = await corpoJson(req);
    const c = d.cliente || {}, e = d.endereco || {};
    const cli = { nome: txt(c.nome, 120), email: txt(c.email, 160).toLowerCase(), telefone: so(c.telefone).slice(0, 11), cpf: so(c.cpf) };
    if (cli.nome.split(/\s+/).length < 2) return erro('Informe nome e sobrenome.');
    if (!/^\S+@\S+\.\S+$/.test(cli.email)) return erro('E-mail inválido.');
    if (cli.telefone.length < 10) return erro('Telefone inválido (com DDD).');
    if (!cpfValido(cli.cpf)) return erro('CPF inválido.');
    const tentativa = typeof d.tentativa === 'string' && /^[0-9a-f-]{36}$/i.test(d.tentativa) ? d.tentativa : null;
    if (tentativa) {
      const existente = await env.DB.prepare('SELECT * FROM pedidos WHERE tentativa_checkout = ?').bind(tentativa).first();
      if (existente) {
        if (existente.email !== cli.email || existente.cpf !== cli.cpf) return erro('Tentativa de checkout inválida.', 409);
        const gravados = (await env.DB.prepare('SELECT * FROM pedido_itens WHERE pedido_id = ?').bind(existente.id).all()).results;
        return iniciarCheckout(env, url.origin, existente, gravados);
      }
    }
    let itens, frete;
    try {
      itens = await conferirItens(env, d.itens);
      const cot = await cotarFrete(env, cfg, e.cep, itens);
      frete = cot.opcoes.find((o) => o.id === String(d.frete_servico));
      if (!frete) return erro('Escolha uma opção de frete válida.');
    } catch (x) { return erro(x.message); }
    const ret = frete.id === 'retirada';
    const end = { cep: so(e.cep), rua: txt(e.rua, 160), numero: txt(e.numero, 20), complemento: txt(e.complemento, 80), bairro: txt(e.bairro, 80), cidade: txt(e.cidade, 80), uf: txt(e.uf, 2).toUpperCase() };
    if (!ret && (!end.rua || !end.numero || !end.bairro || !end.cidade || end.uf.length !== 2)) return erro('Complete o endereço de entrega.');
    const subtotal = itens.reduce((s, i) => s + i.preco * i.quantidade, 0);
    const codigo = await novoCodigo(env), chave = aleatorio(16);
    const linhas = itens.map((i) => ({ produto_id: i.produto.id, variacao_id: i.variacao ? i.variacao.id : null, nome: i.produto.nome, variacao: i.variacao ? i.variacao.nome : null, preco: i.preco, quantidade: i.quantidade }));
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO pedidos (codigo, chave, tentativa_checkout, status, nome, email, telefone, cpf, cep, rua, numero, complemento, bairro, cidade, uf,
          subtotal, frete, desconto, total, frete_servico, frete_nome, frete_prazo, observacao)
        VALUES (?,?,?,'aguardando',?,?,?,?,?,?,?,?,?,?,?,?,?,0,?,?,?,?,?) ON CONFLICT(tentativa_checkout) DO NOTHING`)
        .bind(codigo, chave, tentativa, cli.nome, cli.email, cli.telefone, cli.cpf, end.cep, end.rua, end.numero, end.complemento || null, end.bairro, end.cidade, end.uf,
          subtotal, frete.preco, subtotal + frete.preco, frete.id, `${frete.empresa && !ret ? frete.empresa + ' ' : ''}${frete.nome}`, frete.prazo, txt(d.observacao, 500) || null),
      ...linhas.map((l) => env.DB.prepare(`INSERT INTO pedido_itens (pedido_id, produto_id, variacao_id, nome, variacao, preco, quantidade)
        SELECT id, ?, ?, ?, ?, ?, ? FROM pedidos WHERE codigo = ?`)
        .bind(l.produto_id, l.variacao_id, l.nome, l.variacao, l.preco, l.quantidade, codigo)),
    ]);
    const ped = await env.DB.prepare('SELECT * FROM pedidos WHERE codigo = ? OR tentativa_checkout = ?').bind(codigo, tentativa).first();
    if (ped.email !== cli.email || ped.cpf !== cli.cpf) return erro('Tentativa de checkout inválida.', 409);
    const gravados = (await env.DB.prepare('SELECT * FROM pedido_itens WHERE pedido_id = ?').bind(ped.id).all()).results;
    return iniciarCheckout(env, url.origin, ped, gravados);
  }

  if (p === '/pedido' && m === 'GET') {
    const ped = await env.DB.prepare('SELECT * FROM pedidos WHERE codigo = ?').bind(txt(url.searchParams.get('codigo'), 20)).first();
    if (!ped || !iguais(await sha256(ped.chave), await sha256(String(url.searchParams.get('chave') || '')))) return erro('Pedido não encontrado.', 404);
    let atual = ped;
    if (ped.status === 'aguardando') {
      try { atual = await sincronizarPagamento(env, ped, url.searchParams.get('payment_id') || url.searchParams.get('collection_id')); } catch (e) { console.error(e); }
    }
    const itens = (await env.DB.prepare('SELECT * FROM pedido_itens WHERE pedido_id = ?').bind(ped.id).all()).results;
    return json({ pedido: pedidoPublico(atual, itens), simulacao: modoTeste(env).pagamento });
  }

  // pagar de novo (pedido aguardando) — gera um novo link do Mercado Pago
  if (p === '/pedido/pagar' && m === 'POST') {
    if (cfg.loja_aberta === '0' || (modoTeste(env).pagamento ? !(await equipeTestando(env, req)) : !lojaPronta(env))) {
      return erro('A loja está temporariamente fechada para pagamentos.', 503);
    }
    const d = await corpoJson(req);
    const ped = await env.DB.prepare('SELECT * FROM pedidos WHERE codigo = ?').bind(txt(d.codigo, 20)).first();
    if (!ped || !iguais(await sha256(ped.chave), await sha256(String(d.chave || '')))) return erro('Pedido não encontrado.', 404);
    if (ped.status !== 'aguardando' || ped.mp_status === 'approved') return erro('Este pedido não está aguardando pagamento.');
    const itens = (await env.DB.prepare('SELECT * FROM pedido_itens WHERE pedido_id = ?').bind(ped.id).all()).results;
    try { return json({ ir: await linkPagamento(env, url.origin, ped, itens) }); } catch (e) { return erro('Não conseguimos abrir o pagamento agora. Tente em instantes.', 502); }
  }

  // modo de teste: aprova o pagamento sem cobrar nada (só funciona sem a chave do Mercado Pago)
  if (p === '/simular-pagamento' && m === 'POST') {
    if (!modoTeste(env).pagamento || !(await equipeTestando(env, req))) return erro('Indisponível.', 404);
    const d = await corpoJson(req);
    const ped = await env.DB.prepare('SELECT * FROM pedidos WHERE codigo = ?').bind(txt(d.codigo, 20)).first();
    if (!ped || !iguais(await sha256(ped.chave), await sha256(String(d.chave || '')))) return erro('Pedido não encontrado.', 404);
    const metodo = { pix: 'pix', boleto: 'ticket', credito: 'credit_card', debito: 'debit_card' }[d.metodo] || 'pix';
    await aplicarPagamento(env, ped, { id: 'TESTE-' + aleatorio(4), status: 'approved', payment_type_id: metodo, transaction_amount: reais(ped.total) });
    return json({ ok: true });
  }

  return erro('Rota não encontrada.', 404);
}

// ---------------------------------------------------------------- webhook do Mercado Pago
export async function webhookMercadoPago(req, env, url) {
  if (req.method !== 'POST') return json({ ok: true });
  if (modoTeste(env).pagamento) return json({ ok: true });
  const b = await corpoJson(req);
  const tipo = b.type || b.topic || url.searchParams.get('type') || url.searchParams.get('topic');
  const id = String(url.searchParams.get('data.id') || (b.data && b.data.id) || url.searchParams.get('id') || '');
  if (tipo !== 'payment' || !id) return json({ ok: true });
  if (!env.MP_WEBHOOK_SECRET) return erro('Webhook indisponível.', 503);
  {
    const partes = Object.fromEntries((req.headers.get('x-signature') || '').split(',').map((x) => x.trim().split('=')));
    const manifesto = `id:${/^[a-z0-9]+$/i.test(id) ? id.toLowerCase() : id};request-id:${req.headers.get('x-request-id') || ''};ts:${partes.ts || ''};`;
    if (!partes.v1 || !iguais(await hmacHex(env.MP_WEBHOOK_SECRET, manifesto), partes.v1)) return erro('Assinatura inválida.', 401);
  }
  try {
    const pg = await mp(env, 'GET', `/v1/payments/${encodeURIComponent(id)}`);
    const ped = pg.external_reference && (await env.DB.prepare('SELECT * FROM pedidos WHERE codigo = ?').bind(pg.external_reference).first());
    if (ped) await aplicarPagamento(env, ped, pg);
  } catch (e) {
    console.error(e);
    return erro('Falha temporária.', 500); // o Mercado Pago tenta de novo
  }
  return json({ ok: true });
}

// ---------------------------------------------------------------- painel da loja
function limparProduto(d) {
  const o = {};
  if ('nome' in d) o.nome = txt(d.nome, 160);
  if ('categoria' in d) o.categoria = txt(d.categoria, 60) || null;
  if ('descricao' in d) o.descricao = txt(d.descricao, 5000) || null;
  if ('sku' in d) o.sku = txt(d.sku, 60) || null;
  for (const k of ['preco', 'preco_de']) if (k in d) o[k] = d[k] === '' || d[k] == null ? (k === 'preco' ? 0 : null) : Math.max(0, Math.round(parseFloat(String(d[k]).replace(',', '.')) * 100) || 0);
  for (const k of ['estoque_minimo', 'peso_g', 'ordem']) if (k in d) o[k] = Math.max(0, parseInt(d[k], 10) || 0);
  for (const k of ['altura_cm', 'largura_cm', 'comprimento_cm']) if (k in d) o[k] = Math.max(1, parseFloat(String(d[k]).replace(',', '.')) || 1);
  for (const k of ['ativo', 'destaque']) if (k in d) o[k] = d[k] ? 1 : 0;
  return o;
}

const slugLoja = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70) || 'produto';

async function slugLivre(env, base, id) {
  let s = base, i = 2;
  while (await env.DB.prepare('SELECT 1 FROM produtos WHERE slug = ? AND id <> ?').bind(s, id || 0).first()) s = `${base}-${i++}`;
  return s;
}

async function etiquetaMelhorEnvio(env, ped) {
  const cfg = await config(env);
  const itens = (await env.DB.prepare('SELECT i.*, p.peso_g, p.altura_cm, p.largura_cm, p.comprimento_cm FROM pedido_itens i LEFT JOIN produtos p ON p.id = i.produto_id WHERE i.pedido_id = ?').bind(ped.id).all()).results;
  if (ped.frete_servico === 'retirada') throw new Error('Pedido de retirada pessoal não precisa de etiqueta.');
  if (modoTeste(env).frete) {
    await env.DB.prepare("UPDATE pedidos SET me_pedido = ?, rastreio = ?, etiqueta_url = NULL WHERE id = ?").bind('TESTE', 'TESTE' + ped.codigo.slice(-6), ped.id).run();
    return { simulacao: true };
  }
  const doc = so(cfg.remetente_documento), cnpj = so(cfg.remetente_cnpj);
  if (!doc && !cnpj) throw new Error('Preencha o CPF ou CNPJ do remetente em Configurações da loja.');
  if (!cfg.remetente_endereco || !cfg.remetente_numero || !cfg.remetente_bairro) throw new Error('Preencha o endereço do remetente em Configurações da loja.');
  const vol = volume(itens.map((i) => ({ produto: i, quantidade: i.quantidade })));
  const seguro = reais(ped.subtotal);
  let meId = ped.me_pedido;
  if (!meId) {
    const carrinho = await me(env, 'POST', '/api/v2/me/cart', {
      service: parseInt(ped.frete_servico, 10),
      from: {
        name: cfg.remetente_nome, phone: so(cfg.remetente_telefone), email: cfg.remetente_email, document: doc || undefined, company_document: cnpj || undefined,
        address: cfg.remetente_endereco, number: cfg.remetente_numero, complement: cfg.remetente_complemento || undefined, district: cfg.remetente_bairro,
        city: cfg.remetente_cidade, state_abbr: cfg.remetente_uf, country_id: 'BR', postal_code: so(cfg.cep_origem),
      },
      to: {
        name: ped.nome, phone: ped.telefone, email: ped.email, document: ped.cpf, address: ped.rua, number: ped.numero, complement: ped.complemento || undefined,
        district: ped.bairro, city: ped.cidade, state_abbr: ped.uf, country_id: 'BR', postal_code: ped.cep,
      },
      products: itens.map((i) => ({ name: i.variacao ? `${i.nome} ${i.variacao}` : i.nome, quantity: i.quantidade, unitary_value: reais(i.preco) })),
      volumes: [vol],
      options: { insurance_value: seguro, receipt: false, own_hand: false, reverse: false, non_commercial: true, tags: [{ tag: ped.codigo }] },
    });
    meId = carrinho.id;
    await env.DB.prepare('UPDATE pedidos SET me_pedido = ? WHERE id = ?').bind(meId, ped.id).run();
  }
  await me(env, 'POST', '/api/v2/me/shipment/checkout', { orders: [meId] });
  await me(env, 'POST', '/api/v2/me/shipment/generate', { orders: [meId] });
  const imp = await me(env, 'POST', '/api/v2/me/shipment/print', { mode: 'private', orders: [meId] });
  let rastreio = null;
  try { const t = await me(env, 'POST', '/api/v2/me/shipment/tracking', { orders: [meId] }); rastreio = t[meId] && (t[meId].tracking || t[meId].melhorenvio_tracking); } catch (e) {}
  await env.DB.prepare('UPDATE pedidos SET etiqueta_url = ?, rastreio = COALESCE(?, rastreio) WHERE id = ?').bind(imp.url || null, rastreio, ped.id).run();
  return { url: imp.url };
}

export async function apiLoja(req, env, url, seg, u, { corpo, registrar }) {
  const m = req.method;
  if (!podeLoja(u, 'ver')) return erro('Você não tem acesso à loja.', 403);
  const gerir = podeLoja(u, 'gerir'), expedir = podeLoja(u, 'expedir');
  const negar = () => erro('Seu papel na loja não permite essa ação.', 403);

  // ---- resumo
  if (seg[0] === 'resumo' && m === 'GET') {
    const v = await env.DB.prepare("SELECT COUNT(*) n, COALESCE(SUM(total),0) t FROM pedidos WHERE status IN ('pago','separacao','enviado','entregue') AND pago_em > datetime('now','-30 days')").first();
    const st = (await env.DB.prepare('SELECT status, COUNT(*) n FROM pedidos GROUP BY status').all()).results;
    const baixo = (await env.DB.prepare(`
      SELECT p.id, p.nome, NULL AS variacao, p.estoque, p.estoque_minimo FROM produtos p
        WHERE p.ativo = 1 AND NOT EXISTS (SELECT 1 FROM produto_variacoes v WHERE v.produto_id = p.id AND v.ativo = 1) AND p.estoque <= p.estoque_minimo
      UNION ALL
      SELECT p.id, p.nome, v.nome, v.estoque, p.estoque_minimo FROM produto_variacoes v JOIN produtos p ON p.id = v.produto_id
        WHERE p.ativo = 1 AND v.ativo = 1 AND v.estoque <= p.estoque_minimo ORDER BY 4`).all()).results;
    const recentes = (await env.DB.prepare('SELECT id, codigo, nome, status, total, criado_em FROM pedidos ORDER BY id DESC LIMIT 8').all()).results;
    return json({ vendas_30d: v, por_status: st, estoque_baixo: baixo, recentes, teste: modoTeste(env), status_nome: STATUS_NOME });
  }

  // ---- produtos
  if (seg[0] === 'produtos') {
    const id = parseInt(seg[1], 10);
    if (!seg[1] && m === 'GET') {
      const prods = await produtosCompletos(env, '1 = 1');
      const vendidos = (await env.DB.prepare("SELECT produto_id, SUM(quantidade) q FROM pedido_itens i JOIN pedidos p ON p.id = i.pedido_id WHERE p.status IN ('pago','separacao','enviado','entregue') GROUP BY produto_id").all()).results;
      return json({ produtos: prods.map((p) => ({ ...p, vendidos: (vendidos.find((x) => x.produto_id === p.id) || {}).q || 0 })) });
    }
    if (!seg[1] && m === 'POST') {
      if (!gerir) return negar();
      const d = await corpo(req);
      const o = limparProduto(d);
      if (!o.nome) return erro('Dê um nome ao produto.');
      o.slug = await slugLivre(env, slugLoja(d.slug || o.nome));
      o.criado_por = u.id;
      const k = Object.keys(o);
      const r = await env.DB.prepare(`INSERT INTO produtos (${k.join(',')}) VALUES (${k.map(() => '?').join(',')}) RETURNING id`).bind(...k.map((x) => o[x])).first();
      await registrar(env, u, 'cadastrou o produto', o.nome);
      return json({ id: r.id }, 201);
    }
    if (!id) return erro('Rota não encontrada.', 404);
    const [prod] = await produtosCompletos(env, 'p.id = ?', [id]);
    if (!prod) return erro('Produto não encontrado.', 404);

    if (!seg[2] && m === 'GET') {
      const mov = (await env.DB.prepare('SELECT e.*, v.nome AS variacao, u.nome AS usuario FROM estoque_movimentos e LEFT JOIN produto_variacoes v ON v.id = e.variacao_id LEFT JOIN usuarios u ON u.id = e.usuario_id WHERE e.produto_id = ? ORDER BY e.id DESC LIMIT 80').bind(id).all()).results;
      return json({ produto: prod, movimentos: mov });
    }
    if (!seg[2] && m === 'PUT') {
      if (!gerir) return negar();
      const d = await corpo(req);
      const o = limparProduto(d);
      if ('nome' in o && !o.nome) return erro('Dê um nome ao produto.');
      if (d.slug) o.slug = await slugLivre(env, slugLoja(d.slug), id);
      if (o.ativo && (('preco' in o ? o.preco : prod.preco) <= 0)) return erro('Defina um preço antes de colocar o produto à venda.');
      const ops = [];
      const k = Object.keys(o);
      if (k.length) ops.push(env.DB.prepare(`UPDATE produtos SET ${k.map((x) => x + ' = ?').join(', ')}, atualizado_em = datetime('now') WHERE id = ?`).bind(...k.map((x) => o[x]), id));
      if (Array.isArray(d.variacoes)) {
        const manter = d.variacoes.map((v) => parseInt(v.id, 10)).filter(Boolean);
        for (const v of prod.variacoes) {
          if (!manter.includes(v.id)) {
            // variação removida: se nunca vendeu, apaga; se já vendeu, só desativa (mantém o histórico)
            ops.push(env.DB.prepare('UPDATE produto_variacoes SET ativo = 0 WHERE id = ?').bind(v.id));
            ops.push(env.DB.prepare('DELETE FROM produto_variacoes WHERE id = ? AND estoque = 0 AND NOT EXISTS (SELECT 1 FROM pedido_itens WHERE variacao_id = ?) AND NOT EXISTS (SELECT 1 FROM estoque_movimentos WHERE variacao_id = ?)').bind(v.id, v.id, v.id));
          }
        }
        d.variacoes.slice(0, 40).forEach((v, n) => {
          const nome = txt(v.nome, 40);
          if (!nome) return;
          const vid = parseInt(v.id, 10);
          if (vid && prod.variacoes.some((x) => x.id === vid)) ops.push(env.DB.prepare('UPDATE produto_variacoes SET nome = ?, sku = ?, ordem = ?, ativo = ? WHERE id = ?').bind(nome, txt(v.sku, 60) || null, n, v.ativo === false ? 0 : 1, vid));
          else ops.push(env.DB.prepare('INSERT INTO produto_variacoes (produto_id, nome, sku, ordem) VALUES (?,?,?,?)').bind(id, nome, txt(v.sku, 60) || null, n));
        });
      }
      if (ops.length) await env.DB.batch(ops);
      await registrar(env, u, 'editou o produto', o.nome || prod.nome, 'preco' in o && o.preco !== prod.preco ? `preço ${brl(prod.preco)} → ${brl(o.preco)}` : null);
      return json({ ok: true });
    }
    if (!seg[2] && m === 'DELETE') {
      if (!gerir) return negar();
      const vendeu = await env.DB.prepare('SELECT 1 FROM pedido_itens WHERE produto_id = ?').bind(id).first();
      if (vendeu) {
        await env.DB.prepare("UPDATE produtos SET ativo = 0, atualizado_em = datetime('now') WHERE id = ?").bind(id).run();
        await registrar(env, u, 'tirou da loja o produto', prod.nome, 'já tem vendas: foi desativado, não apagado');
        return json({ ok: true, desativado: true });
      }
      for (const f of prod.fotos) if (f.url.startsWith('/arquivos/loja/')) await env.ARQUIVOS.delete(f.url.slice('/arquivos/'.length));
      await env.DB.batch([
        env.DB.prepare('DELETE FROM estoque_movimentos WHERE produto_id = ?').bind(id),
        env.DB.prepare('DELETE FROM produto_fotos WHERE produto_id = ?').bind(id),
        env.DB.prepare('DELETE FROM produto_variacoes WHERE produto_id = ?').bind(id),
        env.DB.prepare('DELETE FROM produtos WHERE id = ?').bind(id),
      ]);
      await registrar(env, u, 'excluiu o produto', prod.nome);
      return json({ ok: true });
    }

    // fotos: corpo = a imagem (JPG, PNG ou WebP, até 8 MB)
    if (seg[2] === 'fotos' && !seg[3] && m === 'POST') {
      if (!gerir) return negar();
      const tipo = (req.headers.get('Content-Type') || '').split(';')[0];
      const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[tipo];
      if (!ext) return erro('Envie uma imagem JPG, PNG ou WebP.');
      const buf = await req.arrayBuffer();
      if (buf.byteLength > 8 * 1024 * 1024) return erro('Imagem grande demais (máximo 8 MB).');
      if (prod.fotos.length >= 12) return erro('Máximo de 12 fotos por produto.');
      const chave = `loja/${prod.slug}-${aleatorio(5)}.${ext}`;
      await env.ARQUIVOS.put(chave, buf, { httpMetadata: { contentType: tipo } });
      const ordem = prod.fotos.length ? Math.max(...prod.fotos.map((f) => f.ordem)) + 1 : 0;
      await env.DB.prepare('INSERT INTO produto_fotos (produto_id, url, ordem) VALUES (?,?,?)').bind(id, '/arquivos/' + chave, ordem).run();
      await registrar(env, u, 'enviou foto do produto', prod.nome);
      return json({ ok: true }, 201);
    }
    if (seg[2] === 'fotos' && seg[3] === 'ordem' && m === 'PUT') {
      if (!gerir) return negar();
      const d = await corpo(req);
      const ids = (Array.isArray(d.ids) ? d.ids : []).map((x) => parseInt(x, 10)).filter((x) => prod.fotos.some((f) => f.id === x));
      if (ids.length) await env.DB.batch(ids.map((fid, n) => env.DB.prepare('UPDATE produto_fotos SET ordem = ? WHERE id = ?').bind(n, fid)));
      return json({ ok: true });
    }
    if (seg[2] === 'fotos' && seg[3] && m === 'DELETE') {
      if (!gerir) return negar();
      const f = prod.fotos.find((x) => x.id === parseInt(seg[3], 10));
      if (!f) return erro('Foto não encontrada.', 404);
      if (f.url.startsWith('/arquivos/loja/')) await env.ARQUIVOS.delete(f.url.slice('/arquivos/'.length));
      await env.DB.prepare('DELETE FROM produto_fotos WHERE id = ?').bind(f.id).run();
      return json({ ok: true });
    }

    // estoque: entrada, saída ou contagem (inventário: define o saldo exato)
    if (seg[2] === 'estoque' && m === 'POST') {
      if (!gerir) return negar();
      const d = await corpo(req);
      const ativas = prod.variacoes.filter((v) => v.ativo);
      const v = ativas.length ? prod.variacoes.find((x) => x.id === parseInt(d.variacao_id, 10)) : null;
      if (ativas.length && !v) return erro('Escolha a variação.');
      const atual = v ? v.estoque : prod.estoque;
      const q = parseInt(d.quantidade, 10);
      if (!Number.isFinite(q) || q < 0 || q > 100000) return erro('Quantidade inválida.');
      const tipo = ['entrada', 'saida', 'contagem'].includes(d.tipo) ? d.tipo : 'entrada';
      const delta = tipo === 'entrada' ? q : tipo === 'saida' ? -q : q - atual;
      if (!delta) return json({ ok: true, saldo: atual });
      const motivo = txt(d.motivo, 200) || { entrada: 'Entrada de mercadoria', saida: 'Saída manual', contagem: 'Contagem de estoque' }[tipo];
      const saldo = atual + delta;
      await env.DB.batch([
        v ? env.DB.prepare('UPDATE produto_variacoes SET estoque = ? WHERE id = ?').bind(saldo, v.id) : env.DB.prepare('UPDATE produtos SET estoque = ? WHERE id = ?').bind(saldo, id),
        env.DB.prepare('INSERT INTO estoque_movimentos (produto_id, variacao_id, quantidade, saldo, motivo, usuario_id) VALUES (?,?,?,?,?,?)').bind(id, v ? v.id : null, delta, saldo, motivo, u.id),
      ]);
      await registrar(env, u, 'ajustou o estoque de', `${prod.nome}${v ? ' — ' + v.nome : ''}`, `${atual} → ${saldo} (${motivo})`);
      return json({ ok: true, saldo });
    }
    return erro('Rota não encontrada.', 404);
  }

  // ---- pedidos
  if (seg[0] === 'pedidos') {
    if (!seg[1] && m === 'GET') {
      const st = url.searchParams.get('status');
      const q = txt(url.searchParams.get('q'), 80);
      const cond = [], b = [];
      if (STATUS.includes(st)) { cond.push('status = ?'); b.push(st); }
      if (st === 'expedir') cond.push("status IN ('pago','separacao')");
      if (q) { cond.push('(codigo LIKE ? OR nome LIKE ? OR email LIKE ? OR cpf LIKE ?)'); b.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${so(q) || q}%`); }
      const r = await env.DB.prepare(`SELECT id, codigo, status, nome, email, cidade, uf, total, frete_nome, pagamento_metodo, rastreio, criado_em, pago_em,
          (SELECT SUM(quantidade) FROM pedido_itens WHERE pedido_id = pedidos.id) AS n_itens
        FROM pedidos ${cond.length ? 'WHERE ' + cond.join(' AND ') : ''} ORDER BY id DESC LIMIT 300`).bind(...b).all();
      return json({ pedidos: r.results, status_nome: STATUS_NOME });
    }
    const ped = await env.DB.prepare('SELECT * FROM pedidos WHERE id = ?').bind(parseInt(seg[1], 10)).first();
    if (!ped) return erro('Pedido não encontrado.', 404);
    const itens = async () => (await env.DB.prepare('SELECT * FROM pedido_itens WHERE pedido_id = ?').bind(ped.id).all()).results;

    if (!seg[2] && m === 'GET') {
      const { chave, ...resto } = ped;
      return json({ pedido: { ...resto, status_nome: STATUS_NOME[ped.status] }, itens: await itens(), status_nome: STATUS_NOME, teste: modoTeste(env),
        link_cliente: `${url.origin}/pedido.html?codigo=${ped.codigo}&chave=${chave}` });
    }
    if (!seg[2] && m === 'PUT') {
      const d = await corpo(req);
      const sets = [], b = [];
      if (d.status && d.status !== ped.status) {
        if (!STATUS.includes(d.status)) return erro('Status inválido.');
        const deExpedicao = ['pago', 'separacao', 'enviado', 'entregue'];
        if (!(gerir || (expedir && deExpedicao.includes(d.status) && deExpedicao.includes(ped.status)))) return negar();
        if (d.status === 'pago' && ped.status === 'aguardando' && !gerir) return negar();
        sets.push('status = ?'); b.push(d.status);
        if (d.status === 'enviado') sets.push("enviado_em = COALESCE(enviado_em, datetime('now'))");
        if (d.status === 'pago') sets.push("pago_em = COALESCE(pago_em, datetime('now'))");
      }
      if ('rastreio' in d) { if (!expedir) return negar(); sets.push('rastreio = ?'); b.push(txt(d.rastreio, 60) || null); }
      if ('nota_interna' in d) { if (!expedir) return negar(); sets.push('nota_interna = ?'); b.push(txt(d.nota_interna, 1000) || null); }
      if (d.status && d.status !== ped.status) {
        sets.push('estoque_baixado = ?', 'motivo_estoque = ?', 'usuario_estoque = ?');
        b.push(deStatusVendido(d.status) ? 1 : 0, deStatusVendido(d.status) ? 'Venda (manual)' : 'Cancelamento/estorno', u.id);
      }
      if (sets.length) {
        try {
          const atualizado = await env.DB.prepare(`UPDATE pedidos SET ${sets.join(', ')}, atualizado_em = datetime('now') WHERE id = ? AND status = ? AND estoque_baixado = ?`)
            .bind(...b, ped.id, ped.status, ped.estoque_baixado).run();
          if (!atualizado.meta.changes) return erro('O pedido mudou. Atualize e tente novamente.', 409);
        } catch (error) {
          if (String(error).includes('PV_ESTOQUE_INSUFICIENTE')) return erro('Estoque insuficiente para concluir a operação.', 409);
          throw error;
        }
        if (d.status && d.status !== ped.status) await registrar(env, u, 'mudou o pedido', ped.codigo, `${STATUS_NOME[ped.status]} → ${STATUS_NOME[d.status]}`);
      }
      return json({ ok: true });
    }
    if (seg[2] === 'sincronizar' && m === 'POST') {
      try { await sincronizarPagamento(env, ped, null); } catch (e) { return erro(e.message, 502); }
      return json({ ok: true });
    }
    if (seg[2] === 'reembolso' && m === 'POST') {
      if (!gerir) return negar();
      if (!ped.mp_pagamento) return erro('Este pedido não tem pagamento registrado.');
      if (!modoTeste(env).pagamento && !String(ped.mp_pagamento).startsWith('TESTE')) {
        try { await mp(env, 'POST', `/v1/payments/${ped.mp_pagamento}/refunds`, {}, 'ref-' + ped.codigo); } catch (e) { return erro(e.message, 502); }
      }
      await env.DB.prepare("UPDATE pedidos SET status = 'reembolsado', mp_status = 'refunded', estoque_baixado = 0, motivo_estoque = 'Estorno', usuario_estoque = ?, atualizado_em = datetime('now') WHERE id = ?").bind(u.id, ped.id).run();
      await registrar(env, u, 'reembolsou o pedido', ped.codigo, brl(ped.total));
      return json({ ok: true });
    }
    if (seg[2] === 'etiqueta' && m === 'POST') {
      if (!expedir) return negar();
      if (!['pago', 'separacao'].includes(ped.status)) return erro('Só pedidos pagos ou em separação recebem etiqueta.');
      try {
        const r = await etiquetaMelhorEnvio(env, ped);
        await env.DB.prepare("UPDATE pedidos SET status = 'separacao', atualizado_em = datetime('now') WHERE id = ? AND status = 'pago'").bind(ped.id).run();
        await registrar(env, u, 'gerou etiqueta do pedido', ped.codigo);
        return json({ ok: true, ...r });
      } catch (e) { return erro(e.message, 502); }
    }
    if (seg[2] === 'rastreio' && m === 'POST') {
      if (!expedir) return negar();
      if (!ped.me_pedido || modoTeste(env).frete) return erro('Sem etiqueta do Melhor Envio para consultar.');
      try {
        const t = await me(env, 'POST', '/api/v2/me/shipment/tracking', { orders: [ped.me_pedido] });
        const x = t[ped.me_pedido] || {};
        const cod = x.tracking || x.melhorenvio_tracking || null;
        if (cod) await env.DB.prepare('UPDATE pedidos SET rastreio = ? WHERE id = ?').bind(cod, ped.id).run();
        if (x.status === 'posted' && ['pago', 'separacao'].includes(ped.status)) await env.DB.prepare("UPDATE pedidos SET status = 'enviado', enviado_em = datetime('now') WHERE id = ?").bind(ped.id).run();
        if (x.status === 'delivered') await env.DB.prepare("UPDATE pedidos SET status = 'entregue' WHERE id = ?").bind(ped.id).run();
        return json({ ok: true, rastreio: cod, situacao: x.status || null });
      } catch (e) { return erro(e.message, 502); }
    }
    return erro('Rota não encontrada.', 404);
  }

  // ---- configurações
  if (seg[0] === 'config') {
    if (m === 'GET') {
      return json({ config: await config(env), teste: modoTeste(env), ambiente_frete: env.ME_AMBIENTE === 'sandbox' ? 'sandbox' : 'producao',
        webhook: `${url.origin}/api/loja/mp/webhook`, assinatura_webhook: !!env.MP_WEBHOOK_SECRET });
    }
    if (m === 'PUT') {
      if (!gerir) return negar();
      const d = await corpo(req);
      const ops = [];
      for (const k of CONFIG_CAMPOS) if (k in d) ops.push(env.DB.prepare('INSERT INTO loja_config (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor').bind(k, txt(d[k], 400)));
      if (ops.length) await env.DB.batch(ops);
      await registrar(env, u, 'alterou as configurações da loja');
      return json({ ok: true });
    }
  }

  return erro('Rota não encontrada.', 404);
}
