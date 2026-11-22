/* The Prophetic Voices — comentários dos leitores na página do artigo (aprovados pela equipe; sem respostas em sequência) */
(function () {
  var sec = document.getElementById('comentarios');
  if (!sec) return;
  var slug = sec.getAttribute('data-slug');
  var lista = document.getElementById('comLista');
  var form = document.getElementById('comForm');
  var MAX = 2000;

  var T = {
    pt: {
      com_h: 'Comentários', com_note: 'Os comentários passam pela equipe editorial antes de aparecer.',
      vazio: 'Ainda não há comentários publicados neste artigo.',
      entrar: 'Entre para comentar', entrar_p: 'Use uma das suas contas. Guardamos só o seu nome e e-mail; o e-mail nunca aparece no site.',
      como: 'Comentando como', sair: 'sair', conta: 'minha conta', ph: 'Escreva seu comentário sobre o artigo…', enviar: 'Enviar para aprovação',
      enviado: 'Recebemos o seu comentário. Ele aparece aqui depois de aprovado pela equipe.', pend_1: 'Você tem 1 comentário aguardando aprovação neste artigo.',
      pend_n: 'Você tem {n} comentários aguardando aprovação neste artigo.', bloq: 'Sua conta não pode enviar comentários.', carac: '{n} de {m}', erro: 'Não foi possível carregar os comentários.'
    },
    en: {
      com_h: 'Comments', com_note: 'Comments are reviewed by the editorial team before they appear.',
      vazio: 'There are no published comments on this article yet.',
      entrar: 'Sign in to comment', entrar_p: 'Use one of your accounts. We only keep your name and e-mail; your e-mail never appears on the site.',
      como: 'Commenting as', sair: 'sign out', conta: 'my account', ph: 'Write your comment on the article…', enviar: 'Send for approval',
      enviado: 'We received your comment. It will appear here once approved by the team.', pend_1: 'You have 1 comment awaiting approval on this article.',
      pend_n: 'You have {n} comments awaiting approval on this article.', bloq: 'Your account cannot send comments.', carac: '{n} of {m}', erro: 'Could not load the comments.'
    }
  };
  var L = window.PV_LOGIN;
  var esc = L.esc;
  var t = function (k) { var l = L.lingua(); return (T[l] && T[l][k]) || T.pt[k]; };
  var estado = { comentarios: [], pendentes: 0, sessao: null, aviso: '', rascunho: '' };

  function data(s) {
    var d = new Date(String(s).replace(' ', 'T') + 'Z');
    return d.toLocaleDateString(L.lingua() === 'en' ? 'en-US' : 'pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Fortaleza' });
  }

  function desenhar() {
    sec.querySelector('#com-h').textContent = t('com_h');
    sec.querySelector('.art-note').textContent = t('com_note');
    lista.innerHTML = estado.comentarios.length
      ? estado.comentarios.map(function (c) {
          return '<article class="com"><div class="com-av" aria-hidden="true">' + esc(L.iniciais(c.nome)) + '</div><div class="com-c"><div class="com-m"><b>' + esc(c.nome) + '</b><span>' + esc(data(c.criado_em)) + '</span></div><p>' + esc(c.texto).replace(/\n/g, '<br>') + '</p></div></article>';
        }).join('')
      : '<p class="com-vazio">' + esc(t('vazio')) + '</p>';

    var s = estado.sessao;
    if (!s) { form.innerHTML = ''; return; }
    var pend = estado.pendentes ? '<p class="com-aviso">' + esc((estado.pendentes === 1 ? t('pend_1') : t('pend_n')).replace('{n}', estado.pendentes)) + '</p>' : '';
    var aviso = estado.aviso ? '<p class="com-aviso ok">' + esc(estado.aviso) + '</p>' : '';
    if (!s.leitor) {
      form.innerHTML = aviso + '<div class="com-entrar"><h3>' + esc(t('entrar')) + '</h3><p>' + esc(t('entrar_p')) + '</p>' + L.botoes(s.provedores, { volta: location.pathname + '#comentarios' }) + '</div>';
      return;
    }
    if (s.leitor.bloqueado) { form.innerHTML = '<p class="com-aviso">' + esc(t('bloq')) + '</p>'; return; }
    form.innerHTML = aviso + pend +
      '<form class="com-novo" novalidate><div class="com-quem"><div class="com-av" aria-hidden="true">' + esc(L.iniciais(s.leitor.nome)) + '</div><span>' + esc(t('como')) + ' <b>' + esc(s.leitor.nome) + '</b> · <a href="/conta.html">' + esc(t('conta')) + '</a> · <button type="button" class="lnk" data-sair>' + esc(t('sair')) + '</button></span></div>' +
      '<label class="sr" for="comTexto">' + esc(t('ph')) + '</label><textarea id="comTexto" maxlength="' + MAX + '" rows="5" placeholder="' + esc(t('ph')) + '">' + esc(estado.rascunho) + '</textarea>' +
      '<div class="com-acoes"><span class="com-n" id="comN"></span><p class="com-erro" id="comErro" role="alert"></p><button class="btn btn-creme sm" type="submit">' + esc(t('enviar')) + '</button></div></form>';
    var ta = form.querySelector('textarea'), n = form.querySelector('#comN');
    var conta = function () { estado.rascunho = ta.value; n.textContent = t('carac').replace('{n}', ta.value.length).replace('{m}', MAX); };
    ta.addEventListener('input', conta); conta();
    form.querySelector('[data-sair]').addEventListener('click', function () { L.api('/conta/sair', 'POST').then(recarregar, recarregar); });
    form.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      var b = e.target.querySelector('button[type=submit]');
      b.disabled = true;
      L.api('/comentarios/' + encodeURIComponent(slug), 'POST', { texto: ta.value }).then(function () {
        estado.rascunho = ''; estado.aviso = t('enviado'); return buscar();
      }).catch(function (er) { form.querySelector('#comErro').textContent = er.message; b.disabled = false; });
    });
  }

  function buscar() {
    return fetch('/api/comentarios/' + encodeURIComponent(slug), { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (d) {
      estado.comentarios = d.comentarios || []; estado.pendentes = d.pendentes_meus || 0; desenhar();
    }).catch(function () { lista.innerHTML = '<p class="com-vazio">' + esc(t('erro')) + '</p>'; });
  }
  function recarregar() { return L.recarregar().then(function (s) { estado.sessao = s; estado.aviso = ''; return buscar(); }); }

  L.sessao().then(function (s) { estado.sessao = s; return buscar(); });
  window.addEventListener('pv:lang', function () { setTimeout(desenhar, 0); });
})();
