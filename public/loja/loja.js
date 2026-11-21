/* The Prophetic Voices — loja (vitrine, produto, carrinho/checkout e acompanhamento do pedido).
   Os dados vêm de /api/loja/publico; preço, estoque e frete são sempre conferidos no servidor. */
(function () {
  'use strict';
  var raiz = document.getElementById('loja');
  if (!raiz) return;
  var pagina = raiz.getAttribute('data-pagina');

  // ------------------------------------------------------------ idioma
  var D = {
    pt: {
      carregando: 'Carregando…', vazio_loja: 'Os produtos estão sendo cadastrados. Volte em breve.', esgotado: 'Esgotado', poucas: 'Últimas unidades',
      ver: 'Ver produto', adicionar: 'Adicionar ao carrinho', adicionado: 'Adicionado ✓', escolha: 'Escolha uma opção', qtd: 'Quantidade',
      ir_carrinho: 'Ir para o carrinho', continuar: 'Continuar comprando', todos: 'Todos', fechada: 'As vendas on-line abrem em breve. Por enquanto, fale conosco pelo WhatsApp.',
      carrinho_vazio: 'Seu carrinho está vazio.', ver_loja: 'Ver a loja', remover: 'Remover', subtotal: 'Subtotal', frete: 'Frete', total: 'Total',
      calcular: 'Calcular', cep: 'CEP', frete_titulo: 'Entrega', frete_escolha: 'Informe o CEP para ver as opções de entrega.', dias: 'dias úteis', gratis: 'Grátis',
      dados: 'Seus dados', nome: 'Nome completo', email: 'E-mail', tel: 'Celular (com DDD)', cpf: 'CPF', endereco: 'Endereço de entrega',
      rua: 'Rua / avenida', numero: 'Número', compl: 'Complemento', bairro: 'Bairro', cidade: 'Cidade', uf: 'UF', obs: 'Observação (opcional)',
      pagar: 'Ir para o pagamento', pagando: 'Abrindo o pagamento…', seguro: 'Pagamento seguro pelo Mercado Pago: Pix, cartão de crédito (até 12x), débito ou boleto.',
      resumo: 'Resumo', teste: 'MODO DE TESTE — frete e pagamento simulados; nenhuma cobrança é feita.', aviso_cep: 'Calcule o frete e escolha uma opção de entrega.',
      pedido: 'Pedido', situacao: 'Situação', pagamento: 'Pagamento', entrega: 'Entrega', rastreio: 'Código de rastreio', itens: 'Itens',
      pagar_agora: 'Pagar agora', obrigado: 'Obrigado! Recebemos o seu pedido.', aguardando_txt: 'Assim que o pagamento for confirmado, você verá a atualização aqui. Pix costuma ser aprovado na hora; boleto, em até 3 dias úteis.',
      pago_txt: 'Pagamento confirmado. Vamos separar e enviar o seu pedido.', guarde: 'Guarde este link para acompanhar o pedido.', simular: 'Simular pagamento aprovado (teste)',
      nao_achado: 'Pedido não encontrado. Confira o link recebido.', retirada: 'Retirada pessoal', voltar: '← Voltar à loja', variacao: 'Opção',
    },
    en: {
      carregando: 'Loading…', vazio_loja: 'Products are being added. Please come back soon.', esgotado: 'Sold out', poucas: 'Last units',
      ver: 'View product', adicionar: 'Add to cart', adicionado: 'Added ✓', escolha: 'Choose an option', qtd: 'Quantity',
      ir_carrinho: 'Go to cart', continuar: 'Keep shopping', todos: 'All', fechada: 'Online sales open soon. For now, please contact us on WhatsApp.',
      carrinho_vazio: 'Your cart is empty.', ver_loja: 'See the store', remover: 'Remove', subtotal: 'Subtotal', frete: 'Shipping', total: 'Total',
      calcular: 'Calculate', cep: 'ZIP (CEP)', frete_titulo: 'Delivery', frete_escolha: 'Enter your CEP to see delivery options.', dias: 'business days', gratis: 'Free',
      dados: 'Your details', nome: 'Full name', email: 'E-mail', tel: 'Mobile (with area code)', cpf: 'CPF', endereco: 'Delivery address',
      rua: 'Street', numero: 'Number', compl: 'Complement', bairro: 'District', cidade: 'City', uf: 'State', obs: 'Note (optional)',
      pagar: 'Proceed to payment', pagando: 'Opening payment…', seguro: 'Secure payment via Mercado Pago: Pix, credit card (up to 12x), debit or boleto.',
      resumo: 'Summary', teste: 'TEST MODE — shipping and payment are simulated; no charge is made.', aviso_cep: 'Calculate shipping and choose a delivery option.',
      pedido: 'Order', situacao: 'Status', pagamento: 'Payment', entrega: 'Delivery', rastreio: 'Tracking code', itens: 'Items',
      pagar_agora: 'Pay now', obrigado: 'Thank you! We received your order.', aguardando_txt: 'Once payment is confirmed you will see the update here. Pix is usually instant; boleto takes up to 3 business days.',
      pago_txt: 'Payment confirmed. We will pack and ship your order.', guarde: 'Keep this link to follow your order.', simular: 'Simulate approved payment (test)',
      nao_achado: 'Order not found. Please check the link you received.', retirada: 'Personal pickup', voltar: '← Back to the store', variacao: 'Option',
    },
  };
  var STATUS_EN = { aguardando: 'Awaiting payment', pago: 'Paid', separacao: 'Being packed', enviado: 'Shipped', entregue: 'Delivered', cancelado: 'Cancelled', reembolsado: 'Refunded' };
  var ultimaTentativa, ultimoCheckout;
  function lang() { if (window.__pvLang) return window.__pvLang; try { return localStorage.getItem('pv-lang') || 'pt'; } catch (e) { return 'pt'; } }
  function t(k) { return (D[lang()] || D.pt)[k] || D.pt[k] || k; }

  // ------------------------------------------------------------ utilidades
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function brl(c) { return 'R$ ' + (c / 100).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function so(s) { return String(s || '').replace(/\D/g, ''); }
  function api(metodo, caminho, dados) {
    return fetch('/api/loja/publico' + caminho, {
      method: metodo, headers: dados ? { 'Content-Type': 'application/json', 'X-PV': '1' } : { 'X-PV': '1' },
      body: dados ? JSON.stringify(dados) : undefined, credentials: 'same-origin',
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.erro || 'Erro ' + r.status); return j; }); });
  }
  function carrinho() { try { var c = JSON.parse(localStorage.getItem('pv-cart') || '[]'); return Array.isArray(c) ? c.filter(function (i) { return i && typeof i === 'object' && i.p; }) : []; } catch (e) { return []; } }
  function salvar(c) { try { localStorage.setItem('pv-cart', JSON.stringify(c)); } catch (e) {} window.dispatchEvent(new Event('pv:cart')); }
  function adicionar(p, v, q) {
    var c = carrinho(), achou = false;
    c.forEach(function (i) { if (i.p === p && (i.v || null) === (v || null)) { i.q = Math.min(99, i.q + q); achou = true; } });
    if (!achou) c.push({ p: p, v: v || null, q: q });
    salvar(c);
  }
  function foto(p, cls) {
    return p.fotos && p.fotos.length ? '<img class="' + (cls || '') + '" src="' + esc(p.fotos[0]) + '" alt="' + esc(p.nome) + '" loading="lazy" />'
      : '<div class="semfoto"><img src="/media/symbol-creme.png" alt="" /></div>';
  }
  var dados = null;
  function carregar() {
    if (dados) return Promise.resolve(dados);
    return api('GET', '/produtos').then(function (j) { dados = j; return j; });
  }
  function faixaTeste(j) { return j && j.teste && (j.teste.pagamento || j.teste.frete) ? '<div class="lj-teste">' + esc(t('teste')) + '</div>' : ''; }

  // ------------------------------------------------------------ vitrine
  var filtro = '';
  function vitrine() {
    carregar().then(function (j) {
      var prods = j.produtos;
      var cats = []; prods.forEach(function (p) { if (p.categoria && cats.indexOf(p.categoria) < 0) cats.push(p.categoria); });
      var lista = prods.filter(function (p) { return !filtro || p.categoria === filtro; });
      var h = faixaTeste(j);
      if (!j.loja_aberta) h += '<div class="lj-aviso">' + esc(t('fechada')) + '</div>';
      if (j.aviso) h += '<div class="lj-aviso">' + esc(j.aviso) + '</div>';
      if (cats.length > 1) {
        h += '<div class="lj-cats">' + [''].concat(cats).map(function (c) {
          return '<button type="button" class="chip" data-cat="' + esc(c) + '" aria-pressed="' + (c === filtro) + '">' + esc(c || t('todos')) + '</button>';
        }).join('') + '</div>';
      }
      if (!lista.length) h += '<p class="lj-vazio">' + esc(t('vazio_loja')) + '</p>';
      h += '<div class="lj-grade">' + lista.map(function (p) {
        return '<a class="tile lj-card' + (p.disponivel ? '' : ' off') + '" href="/produto.html?p=' + encodeURIComponent(p.slug) + '">' +
          '<div class="lj-img">' + foto(p) + (p.disponivel ? (p.poucas ? '<span class="selo">' + esc(t('poucas')) + '</span>' : '') : '<span class="selo">' + esc(t('esgotado')) + '</span>') + '</div>' +
          '<span class="s">' + esc((p.categoria || '').toUpperCase()) + '</span>' +
          '<span class="lj-nome">' + esc(p.nome) + '</span>' +
          '<div class="pr"><b>' + (p.preco_de > p.preco ? '<s>' + brl(p.preco_de) + '</s> ' : '') + brl(p.preco) + '</b><span class="add">' + esc(t('ver')) + '</span></div></a>';
      }).join('') + '</div>';
      raiz.innerHTML = h;
      raiz.querySelectorAll('[data-cat]').forEach(function (b) { b.addEventListener('click', function () { filtro = b.getAttribute('data-cat'); vitrine(); }); });
    }).catch(function (e) { raiz.innerHTML = '<p class="lj-erro">' + esc(e.message) + '</p>'; });
  }

  // ------------------------------------------------------------ produto
  var escolha = null, fotoAtual = 0;
  function produto() {
    var slug = new URLSearchParams(location.search).get('p');
    carregar().then(function (j) {
      var p = j.produtos.filter(function (x) { return x.slug === slug; })[0];
      if (!p) { raiz.innerHTML = '<p class="lj-vazio">' + esc(t('vazio_loja')) + '</p><p><a class="btn btn-ghost" href="/loja.html">' + esc(t('voltar')) + '</a></p>'; return; }
      document.title = p.nome + ' — Loja The Prophetic Voices';
      if (p.variacoes.length === 1 && p.variacoes[0].disponivel) escolha = p.variacoes[0].id;
      var fotos = p.fotos.length ? p.fotos : [];
      var h = faixaTeste(j) + '<a class="lj-voltar" href="/loja.html">' + esc(t('voltar')) + '</a><div class="lj-produto">' +
        '<div class="lj-galeria"><div class="lj-img grande">' + (fotos.length ? '<img src="' + esc(fotos[fotoAtual] || fotos[0]) + '" alt="' + esc(p.nome) + '" />' : foto(p)) + '</div>' +
        (fotos.length > 1 ? '<div class="lj-miniaturas">' + fotos.map(function (f, i) { return '<button type="button" data-foto="' + i + '" aria-pressed="' + (i === fotoAtual) + '"><img src="' + esc(f) + '" alt="" /></button>'; }).join('') + '</div>' : '') + '</div>' +
        '<div class="lj-info"><span class="eyebrow">' + esc(p.categoria || '') + '</span><h1>' + esc(p.nome) + '</h1>' +
        '<div class="lj-preco">' + (p.preco_de > p.preco ? '<s>' + brl(p.preco_de) + '</s>' : '') + '<b>' + brl(p.preco) + '</b></div>' +
        (p.variacoes.length ? '<div class="lj-campo"><span class="flabel">' + esc(t('variacao')) + '</span><div class="lj-vars">' + p.variacoes.map(function (v) {
          return '<button type="button" class="chip" data-var="' + v.id + '" aria-pressed="' + (escolha === v.id) + '"' + (v.disponivel ? '' : ' disabled') + '>' + esc(v.nome) + '</button>';
        }).join('') + '</div></div>' : '') +
        '<div class="lj-campo"><span class="flabel">' + esc(t('qtd')) + '</span><div class="lj-qtd"><button type="button" data-q="-1">−</button><input id="ljQ" type="number" min="1" max="99" value="1" inputmode="numeric" /><button type="button" data-q="1">+</button></div></div>' +
        (p.disponivel && j.loja_aberta ? '<button type="button" class="btn btn-creme lj-add">' + esc(t('adicionar')) + '</button>' : '<button type="button" class="btn btn-ghost" disabled>' + esc(t('esgotado')) + '</button>') +
        '<p class="lj-msg" role="status"></p>' +
        '<div class="lj-desc">' + esc(p.descricao || '').replace(/\n/g, '<br>') + '</div>' +
        '<p class="lj-seguro">' + esc(t('seguro')) + '</p></div></div>';
      raiz.innerHTML = h;
      raiz.querySelectorAll('[data-foto]').forEach(function (b) { b.addEventListener('click', function () { fotoAtual = +b.getAttribute('data-foto'); produto(); }); });
      raiz.querySelectorAll('[data-var]').forEach(function (b) { b.addEventListener('click', function () { escolha = +b.getAttribute('data-var'); raiz.querySelectorAll('[data-var]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }); });
      var q = document.getElementById('ljQ');
      raiz.querySelectorAll('[data-q]').forEach(function (b) { b.addEventListener('click', function () { q.value = Math.min(99, Math.max(1, (+q.value || 1) + +b.getAttribute('data-q'))); }); });
      var add = raiz.querySelector('.lj-add'), msg = raiz.querySelector('.lj-msg');
      if (add) add.addEventListener('click', function () {
        if (p.variacoes.length && !escolha) { msg.textContent = t('escolha'); return; }
        adicionar(p.id, p.variacoes.length ? escolha : null, Math.min(99, Math.max(1, +q.value || 1)));
        msg.innerHTML = esc(t('adicionado')) + ' · <a href="/carrinho.html">' + esc(t('ir_carrinho')) + '</a>';
      });
    }).catch(function (e) { raiz.innerHTML = '<p class="lj-erro">' + esc(e.message) + '</p>'; });
  }

  // ------------------------------------------------------------ carrinho + checkout
  var cot = null, servico = null, form = {};
  function linhas(j) {
    return carrinho().map(function (i) {
      var p = j.produtos.filter(function (x) { return x.id === i.p; })[0];
      if (!p) return null;
      var v = i.v ? p.variacoes.filter(function (x) { return x.id === i.v; })[0] : null;
      if (i.v && !v) return null;
      return { i: i, p: p, v: v };
    }).filter(Boolean);
  }
  function itensApi(j) { return linhas(j).map(function (l) { return { produto_id: l.p.id, variacao_id: l.v ? l.v.id : null, quantidade: l.i.q }; }); }
  function guardarForm() { raiz.querySelectorAll('[data-f]').forEach(function (el) { form[el.getAttribute('data-f')] = el.value; }); }
  function campo(k, rot, extra) { return '<label class="lj-f"><span>' + esc(t(rot || k)) + '</span><input data-f="' + k + '" value="' + esc(form[k] || '') + '" ' + (extra || '') + ' /></label>'; }

  function carrinhoPag() {
    carregar().then(function (j) {
      var ls = linhas(j);
      // limpa itens que sumiram da loja
      if (ls.length !== carrinho().length) salvar(ls.map(function (l) { return l.i; }));
      if (!ls.length) { raiz.innerHTML = faixaTeste(j) + '<div class="lj-vazio"><p>' + esc(t('carrinho_vazio')) + '</p><a class="btn btn-creme" href="/loja.html">' + esc(t('ver_loja')) + '</a></div>'; return; }
      var sub = ls.reduce(function (s, l) { return s + l.p.preco * l.i.q; }, 0);
      var op = cot && cot.opcoes.filter(function (o) { return o.id === servico; })[0];
      var ret = op && op.id === 'retirada';
      var h = faixaTeste(j) + '<div class="lj-checkout"><div class="lj-col">' +
        '<h2>' + esc(t('resumo')) + '</h2><div class="lj-itens">' + ls.map(function (l, n) {
          return '<div class="lj-item"><div class="lj-img mini">' + foto(l.p) + '</div><div class="lj-item-t"><b>' + esc(l.p.nome) + '</b>' + (l.v ? '<span>' + esc(l.v.nome) + '</span>' : '') +
            '<span>' + brl(l.p.preco) + '</span></div><div class="lj-qtd sm"><button type="button" data-mais="' + n + '" data-d="-1">−</button><span>' + l.i.q + '</span><button type="button" data-mais="' + n + '" data-d="1">+</button></div>' +
            '<button type="button" class="lj-x" data-rem="' + n + '" aria-label="' + esc(t('remover')) + '">×</button></div>';
        }).join('') + '</div>' +
        '<h2>' + esc(t('frete_titulo')) + '</h2><div class="lj-cep">' + campo('cep', 'cep', 'inputmode="numeric" maxlength="9" placeholder="00000-000" autocomplete="postal-code"') +
        '<button type="button" class="btn btn-ghost sm" id="ljFrete">' + esc(t('calcular')) + '</button></div>' +
        '<div class="lj-fretes">' + (cot ? cot.opcoes.map(function (o) {
          return '<label class="lj-op"><input type="radio" name="frete" value="' + esc(o.id) + '"' + (o.id === servico ? ' checked' : '') + ' /><span><b>' + esc(o.id === 'retirada' ? t('retirada') : (o.empresa ? o.empresa + ' · ' : '') + o.nome) + '</b>' +
            (o.id === 'retirada' ? '<small>' + esc(o.empresa) + '</small>' : o.prazo ? '<small>' + o.prazo + ' ' + esc(t('dias')) + '</small>' : '') + '</span><em>' + (o.preco ? brl(o.preco) : esc(t('gratis'))) + '</em></label>';
        }).join('') : '<p class="lj-dica">' + esc(t('frete_escolha')) + '</p>') + '</div>' +
        '</div><div class="lj-col">' +
        '<h2>' + esc(t('dados')) + '</h2><div class="lj-form">' + campo('nome', 'nome', 'autocomplete="name"') + campo('email', 'email', 'type="email" autocomplete="email"') +
        campo('telefone', 'tel', 'inputmode="tel" autocomplete="tel"') + campo('cpf', 'cpf', 'inputmode="numeric" maxlength="14"') + '</div>' +
        (ret ? '' : '<h2>' + esc(t('endereco')) + '</h2><div class="lj-form">' + campo('rua', 'rua', 'autocomplete="address-line1"') + '<div class="lj-dupla">' + campo('numero') + campo('complemento', 'compl') + '</div>' +
          campo('bairro') + '<div class="lj-dupla">' + campo('cidade') + campo('uf', 'uf', 'maxlength="2"') + '</div></div>') +
        '<label class="lj-f"><span>' + esc(t('obs')) + '</span><textarea data-f="observacao" rows="2">' + esc(form.observacao || '') + '</textarea></label>' +
        '<div class="lj-totais"><div><span>' + esc(t('subtotal')) + '</span><b>' + brl(sub) + '</b></div><div><span>' + esc(t('frete')) + '</span><b>' + (op ? (op.preco ? brl(op.preco) : esc(t('gratis'))) : '—') + '</b></div>' +
        '<div class="tot"><span>' + esc(t('total')) + '</span><b>' + brl(sub + (op ? op.preco : 0)) + '</b></div></div>' +
        '<button type="button" class="btn btn-creme lj-pagar" id="ljPagar"' + (j.loja_aberta ? '' : ' disabled') + '>' + esc(j.loja_aberta ? t('pagar') : t('fechada')) + '</button>' +
        '<p class="lj-msg" role="alert" id="ljMsg"></p><p class="lj-seguro">' + esc(t('seguro')) + '</p></div></div>';
      raiz.innerHTML = h;

      raiz.querySelectorAll('[data-mais]').forEach(function (b) { b.addEventListener('click', function () {
        guardarForm(); var c = ls.map(function (l) { return l.i; }); var i = c[+b.getAttribute('data-mais')];
        i.q = Math.min(99, Math.max(1, i.q + +b.getAttribute('data-d'))); salvar(c); cot = null; servico = null; carrinhoPag();
      }); });
      raiz.querySelectorAll('[data-rem]').forEach(function (b) { b.addEventListener('click', function () {
        guardarForm(); var c = ls.map(function (l) { return l.i; }); c.splice(+b.getAttribute('data-rem'), 1); salvar(c); cot = null; servico = null; carrinhoPag();
      }); });
      raiz.querySelectorAll('input[name=frete]').forEach(function (r) { r.addEventListener('change', function () { guardarForm(); servico = r.value; carrinhoPag(); }); });
      var cepEl = raiz.querySelector('[data-f=cep]');
      cepEl.addEventListener('input', function () { var d = so(cepEl.value).slice(0, 8); cepEl.value = d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d; });
      cepEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') document.getElementById('ljFrete').click(); });
      var cpfEl = raiz.querySelector('[data-f=cpf]');
      cpfEl.addEventListener('input', function () { var d = so(cpfEl.value).slice(0, 11); cpfEl.value = d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2'); });
      document.getElementById('ljFrete').addEventListener('click', function () {
        guardarForm(); var msg = document.getElementById('ljMsg'); var cep = so(form.cep);
        if (cep.length !== 8) { msg.textContent = 'CEP inválido.'; return; }
        this.disabled = true;
        Promise.all([
          api('POST', '/frete', { cep: cep, itens: itensApi(j) }),
          api('GET', '/cep/' + cep).catch(function () { return null; }),
        ]).then(function (r) {
          cot = r[0]; servico = cot.opcoes.length ? cot.opcoes[0].id : null;
          if (r[1]) { form.rua = form.rua || r[1].rua || ''; form.bairro = form.bairro || r[1].bairro || ''; form.cidade = r[1].cidade || form.cidade; form.uf = r[1].uf || form.uf; }
          carrinhoPag();
        }).catch(function (e) { msg.textContent = e.message; }).then(function () { var b = document.getElementById('ljFrete'); if (b) b.disabled = false; });
      });
      document.getElementById('ljPagar').addEventListener('click', function () {
        guardarForm(); var msg = document.getElementById('ljMsg'); var b = this;
        if (!cot || !servico) { msg.textContent = t('aviso_cep'); return; }
        b.disabled = true; b.textContent = t('pagando'); msg.textContent = '';
        var dados = {
          itens: itensApi(j), frete_servico: servico, observacao: form.observacao,
          cliente: { nome: form.nome, email: form.email, telefone: form.telefone, cpf: form.cpf },
          endereco: { cep: form.cep, rua: form.rua, numero: form.numero, complemento: form.complemento, bairro: form.bairro, cidade: form.cidade, uf: form.uf },
        };
        var checkout = JSON.stringify(dados);
        if (checkout !== ultimoCheckout) {
          ultimoCheckout = checkout;
          ultimaTentativa = crypto.randomUUID();
        }
        dados.tentativa = ultimaTentativa;
        api('POST', '/pedido', dados).then(function (r) {
          try { var hist = JSON.parse(localStorage.getItem('pv-pedidos') || '[]'); hist.unshift({ codigo: r.codigo, chave: r.chave }); localStorage.setItem('pv-pedidos', JSON.stringify(hist.slice(0, 10))); } catch (e) {}
          salvar([]);
          location.href = r.ir;
        }).catch(function (e) { msg.textContent = e.message; b.disabled = false; b.textContent = t('pagar'); });
      });
    }).catch(function (e) { raiz.innerHTML = '<p class="lj-erro">' + esc(e.message) + '</p>'; });
  }

  // ------------------------------------------------------------ acompanhamento do pedido
  function pedidoPag() {
    var q = new URLSearchParams(location.search);
    var cod = q.get('codigo'), ch = q.get('chave');
    var extra = q.get('payment_id') ? '&payment_id=' + encodeURIComponent(q.get('payment_id')) : '';
    if (!cod || !ch) { raiz.innerHTML = '<p class="lj-vazio">' + esc(t('nao_achado')) + '</p>'; return; }
    api('GET', '/pedido?codigo=' + encodeURIComponent(cod) + '&chave=' + encodeURIComponent(ch) + extra).then(function (j) {
      var p = j.pedido, en = lang() === 'en';
      var h = (j.simulacao ? '<div class="lj-teste">' + esc(t('teste')) + '</div>' : '') +
        '<div class="lj-pedido"><span class="eyebrow">' + esc(t('pedido')) + ' ' + esc(p.codigo) + '</span><h1>' + esc(p.status === 'aguardando' ? t('obrigado') : (en ? STATUS_EN[p.status] : p.status_nome)) + '</h1>' +
        '<ol class="lj-etapas">' + ['aguardando', 'pago', 'separacao', 'enviado', 'entregue'].map(function (s, n, arr) {
          var at = arr.indexOf(p.status); var cl = at < 0 ? '' : n < at ? 'feito' : n === at ? 'atual' : '';
          return '<li class="' + cl + '">' + esc(en ? STATUS_EN[s] : { aguardando: 'Aguardando pagamento', pago: 'Pago', separacao: 'Em separação', enviado: 'Enviado', entregue: 'Entregue' }[s]) + '</li>';
        }).join('') + '</ol>' +
        '<p class="lj-dica">' + esc(p.status === 'aguardando' ? t('aguardando_txt') : p.status === 'pago' ? t('pago_txt') : '') + '</p>' +
        (p.status === 'aguardando' ? '<div class="lj-acoes"><button type="button" class="btn btn-creme" id="ljPagarDeNovo">' + esc(t('pagar_agora')) + '</button>' +
          (j.simulacao ? '<button type="button" class="btn btn-ghost" id="ljSimular">' + esc(t('simular')) + '</button>' : '') + '</div>' : '') +
        '<dl class="lj-dl"><div><dt>' + esc(t('situacao')) + '</dt><dd>' + esc(en ? STATUS_EN[p.status] : p.status_nome) + '</dd></div>' +
        (p.pagamento_metodo ? '<div><dt>' + esc(t('pagamento')) + '</dt><dd>' + esc(p.pagamento_metodo) + '</dd></div>' : '') +
        '<div><dt>' + esc(t('entrega')) + '</dt><dd>' + esc(p.frete_nome || '') + (p.frete_prazo ? ' · ' + p.frete_prazo + ' ' + esc(t('dias')) : '') + (p.entrega ? '<br>' + esc(p.entrega) : '') + '</dd></div>' +
        (p.rastreio ? '<div><dt>' + esc(t('rastreio')) + '</dt><dd><a href="https://www.melhorrastreio.com.br/rastreio/' + encodeURIComponent(p.rastreio) + '" target="_blank" rel="noopener">' + esc(p.rastreio) + '</a></dd></div>' : '') + '</dl>' +
        '<h2>' + esc(t('itens')) + '</h2><div class="lj-totais">' + p.itens.map(function (i) {
          return '<div><span>' + i.quantidade + '× ' + esc(i.nome) + (i.variacao ? ' — ' + esc(i.variacao) : '') + '</span><b>' + brl(i.preco * i.quantidade) + '</b></div>';
        }).join('') + '<div><span>' + esc(t('frete')) + '</span><b>' + (p.frete ? brl(p.frete) : esc(t('gratis'))) + '</b></div><div class="tot"><span>' + esc(t('total')) + '</span><b>' + brl(p.total) + '</b></div></div>' +
        '<p class="lj-dica">' + esc(t('guarde')) + '</p><p class="lj-msg" id="ljMsg" role="alert"></p><a class="lj-voltar" href="/loja.html">' + esc(t('voltar')) + '</a></div>';
      raiz.innerHTML = h;
      var pg = document.getElementById('ljPagarDeNovo');
      if (pg) pg.addEventListener('click', function () {
        if (j.simulacao) { document.getElementById('ljMsg').textContent = t('teste'); return; }
        pg.disabled = true;
        api('POST', '/pedido/pagar', { codigo: cod, chave: ch }).then(function (r) { location.href = r.ir; }).catch(function (e) { document.getElementById('ljMsg').textContent = e.message; pg.disabled = false; });
      });
      var sim = document.getElementById('ljSimular');
      if (sim) sim.addEventListener('click', function () {
        sim.disabled = true;
        api('POST', '/simular-pagamento', { codigo: cod, chave: ch, metodo: 'pix' }).then(pedidoPag).catch(function (e) { document.getElementById('ljMsg').textContent = e.message; });
      });
      // enquanto aguarda (Pix), confere de novo a cada 20 s
      if (p.status === 'aguardando' && !j.simulacao && !pedidoPag.timer) pedidoPag.timer = setInterval(function () { if (!document.hidden) pedidoPag(); }, 20000);
      if (p.status !== 'aguardando' && pedidoPag.timer) { clearInterval(pedidoPag.timer); pedidoPag.timer = null; }
    }).catch(function () { raiz.innerHTML = '<p class="lj-vazio">' + esc(t('nao_achado')) + '</p>'; });
  }

  var render = { vitrine: vitrine, produto: produto, carrinho: carrinhoPag, pedido: pedidoPag }[pagina];
  if (!render) return;
  window.addEventListener('pv:lang', function (e) { if (e && e.detail) window.__pvLang = e.detail; if (pagina === 'carrinho') guardarForm(); render(); });
  raiz.innerHTML = '<p class="lj-dica">' + esc(t('carregando')) + '</p>';
  render();
})();
