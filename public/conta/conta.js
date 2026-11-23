/* The Prophetic Voices — páginas /entrar.html (cadastro e entrada) e /conta.html (conta do leitor) */
(function () {
  var raiz = document.getElementById('conta');
  if (!raiz) return;
  var L = window.PV_LOGIN, esc = L.esc;
  var pagina = raiz.getAttribute('data-pagina');
  var params = new URLSearchParams(location.search);
  var volta = params.get('volta');
  if (!volta || !/^\/(?!\/)/.test(volta) || /^\/(entrar|conta)\.html/.test(volta)) volta = '/conta.html';

  var T = {
    pt: {
      e_eyebrow: 'Cadastro', e_h: 'Entrar', e_em: 'ou criar sua conta',
      e_lede: 'Com a sua conta você lê e baixa gratuitamente os artigos da revista The Prophetic Voices e pode comentar neles. Não há senha para criar: use uma conta que você já tem.',
      l_eyebrow: 'Leitura gratuita', l_h: 'Leia e baixe', l_em: 'os artigos gratuitamente',
      l_lede: 'Para ler e baixar os artigos da revista, entre ou crie sua conta. A leitura, o download e o cadastro são totalmente gratuitos. Não há senha para criar: use uma conta que você já tem.',
      e_card: 'Escolha como entrar', e_card_p: 'Se é a primeira vez, a conta é criada na hora.',
      priv: 'Guardamos apenas o seu nome e o seu e-mail, recebidos da conta escolhida. O e-mail não aparece no site, e você pode excluir a sua conta a qualquer momento.',
      priv_links: 'Ao continuar, você concorda com os <a href="/termos.html">Termos de Uso</a> e a <a href="/privacidade.html">Política de Privacidade</a>.',
      breve: 'O cadastro abre em breve.', breve_p: 'Estamos ligando os logins do site. Volte em alguns dias.',
      err_cancelado: 'O login foi cancelado. Escolha uma conta para continuar.', err_expirou: 'O login demorou demais e expirou. Tente de novo.',
      err_falhou: 'Não conseguimos confirmar o login com esse provedor. Tente de novo ou use outra conta.', err_indisponivel: 'Esse login ainda não está disponível.',
      err_bloqueado: 'Esta conta foi bloqueada pela equipe.', 'err_em-uso': 'Esse login já pertence a outra conta do site.',
      c_eyebrow: 'Sua conta', c_h: 'Olá,', c_desde: 'Conta criada em {d}.',
      nome_h: 'Nome exibido', nome_p: 'É o nome que aparece nos seus comentários.', salvar: 'Salvar', salvo: 'Nome atualizado.',
      logins_h: 'Logins vinculados', logins_p: 'Você pode entrar por qualquer um destes.', remover: 'Remover', vincular_h: 'Vincular outro login',
      vinculado: 'Login vinculado à sua conta.', sair: 'Sair', excluir: 'Excluir minha conta', excluir_conf: 'Confirmar exclusão',
      excluir_p: 'Excluir apaga o seu cadastro, os logins vinculados e todos os seus comentários. Não é possível desfazer.',
      excluida: 'Sua conta foi excluída.', voltar_rev: 'Ir para a revista', email: 'E-mail',
      bv_h: 'Bem-vindo ao The Prophetic Voices', bv_p: 'Quer receber no seu e-mail ({e}) os novos artigos da revista e os novos testemunhos assim que forem publicados? Você pode cancelar quando quiser, com um clique em qualquer e-mail.',
      bv_sim: 'Sim, quero receber', bv_nao: 'Agora não', bv_seguir: 'Continuar para onde eu estava →',
      em_h: 'E-mails', em_on: 'Você recebe no e-mail os novos artigos e testemunhos.', em_off: 'Você não recebe e-mails de novos artigos e testemunhos.',
      em_ligar: 'Quero receber', em_desligar: 'Parar de receber', em_sim_ok: 'Pronto! Você vai receber os novos artigos e testemunhos.', em_nao_ok: 'Tudo bem. Você não vai receber e-mails; pode mudar isso aqui quando quiser.'
    },
    en: {
      e_eyebrow: 'Sign up', e_h: 'Sign in', e_em: 'or create your account',
      e_lede: 'With your account you can read and download The Prophetic Voices journal articles for free and comment on them. There is no password to create: use an account you already have.',
      l_eyebrow: 'Free reading', l_h: 'Read and download', l_em: 'the articles for free',
      l_lede: 'To read and download the journal articles, sign in or create your account. Reading, downloading and signing up are completely free. There is no password to create: use an account you already have.',
      e_card: 'Choose how to sign in', e_card_p: 'If it is your first time, your account is created right away.',
      priv: 'We only keep your name and e-mail, received from the account you choose. Your e-mail never appears on the site, and you can delete your account at any time.',
      priv_links: 'By continuing you agree to the <a href="/termos.html">Terms of Use</a> and the <a href="/privacidade.html">Privacy Policy</a>.',
      breve: 'Sign-up opens soon.', breve_p: 'We are setting up the site logins. Please come back in a few days.',
      err_cancelado: 'Sign-in was cancelled. Choose an account to continue.', err_expirou: 'Sign-in took too long and expired. Please try again.',
      err_falhou: 'We could not confirm the sign-in with this provider. Try again or use another account.', err_indisponivel: 'This sign-in is not available yet.',
      err_bloqueado: 'This account was blocked by the team.', 'err_em-uso': 'This login already belongs to another account on the site.',
      c_eyebrow: 'Your account', c_h: 'Hello,', c_desde: 'Account created on {d}.',
      nome_h: 'Display name', nome_p: 'This is the name shown on your comments.', salvar: 'Save', salvo: 'Name updated.',
      logins_h: 'Linked logins', logins_p: 'You can sign in with any of these.', remover: 'Remove', vincular_h: 'Link another login',
      vinculado: 'Login linked to your account.', sair: 'Sign out', excluir: 'Delete my account', excluir_conf: 'Confirm deletion',
      excluir_p: 'Deleting removes your profile, linked logins and all your comments. This cannot be undone.',
      excluida: 'Your account was deleted.', voltar_rev: 'Go to the journal', email: 'E-mail',
      bv_h: 'Welcome to The Prophetic Voices', bv_p: 'Would you like to receive new journal articles and new testimonies at your e-mail ({e}) as soon as they are published? You can unsubscribe at any time with one click in any e-mail.',
      bv_sim: 'Yes, send them to me', bv_nao: 'Not now', bv_seguir: 'Continue where I was →',
      em_h: 'E-mails', em_on: 'You receive new articles and testimonies by e-mail.', em_off: 'You do not receive e-mails about new articles and testimonies.',
      em_ligar: 'Subscribe', em_desligar: 'Unsubscribe', em_sim_ok: 'Done! You will receive new articles and testimonies.', em_nao_ok: 'All right. You will not receive e-mails; you can change this here anytime.'
    }
  };
  var t = function (k) { var l = L.lingua(); return (T[l] && T[l][k]) || T.pt[k] || k; };
  var S = null, aviso = '', erroAviso = params.get('erro') ? 'err_' + params.get('erro') : '';

  function data(s) {
    return new Date(String(s).replace(' ', 'T') + 'Z').toLocaleDateString(L.lingua() === 'en' ? 'en-US' : 'pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  var avisos = function () {
    return (erroAviso && T.pt[erroAviso] ? '<p class="conta-erro" role="alert">' + esc(t(erroAviso)) + '</p>' : '') + (aviso ? '<p class="conta-ok" role="status">' + esc(t(aviso)) + '</p>' : '');
  };

  function telaEntrar() {
    var tem = S.provedores && S.provedores.length;
    var k = params.get('motivo') === 'leitura' ? 'l_' : 'e_';
    raiz.innerHTML = '<div class="conta-grade"><div><div class="eyebrow">' + esc(t(k + 'eyebrow')) + '</div><h1>' + esc(t(k + 'h')) + '<em>' + esc(t(k + 'em')) + '</em></h1><p class="lede">' + esc(t(k + 'lede')) + '</p></div>' +
      '<div class="conta-card">' + avisos() + (tem
        ? '<h2>' + esc(t('e_card')) + '</h2><p>' + esc(t('e_card_p')) + '</p>' + L.botoes(S.provedores, { volta: volta }) + '<p class="conta-priv">' + esc(t('priv')) + ' ' + t('priv_links') + '</p>'
        : '<h2>' + esc(t('breve')) + '</h2><p>' + esc(t('breve_p')) + '</p>') + '</div></div>';
  }

  function telaExcluida() {
    raiz.innerHTML = '<div class="conta-card" style="max-width:560px"><h2>' + esc(t('excluida')) + '</h2><p></p><a class="btn btn-creme sm" href="/artigos.html">' + esc(t('voltar_rev')) + '</a></div>';
  }

  var voltaBv = params.get('bemvindo') && params.get('volta') && /^\/(?!\/)/.test(params.get('volta')) && !/^\/(entrar|conta)\.html/.test(params.get('volta')) ? params.get('volta') : '';
  function boasVindas(l) {
    if (!params.get('bemvindo')) return '';
    if (l.perguntar_email) {
      return '<div class="conta-card conta-bv"><h2>' + esc(t('bv_h')) + '</h2><p>' + esc(t('bv_p').replace('{e}', l.email)) + '</p><div class="conta-perigo"><button type="button" class="btn btn-creme sm" data-email="1">' + esc(t('bv_sim')) + '</button><button type="button" class="btn btn-ghost sm" data-email="0">' + esc(t('bv_nao')) + '</button></div></div>';
    }
    return voltaBv ? '<p class="conta-ok"><a href="' + esc(voltaBv) + '">' + esc(t('bv_seguir')) + '</a></p>' : '';
  }
  function cartaoEmail(l) {
    if (!l.email || (params.get('bemvindo') && l.perguntar_email)) return '';
    return '<div class="conta-card"><h3>' + esc(t('em_h')) + '</h3><p>' + esc(l.recebe_email ? t('em_on') : t('em_off')) + (l.recebe_email ? '<br><small>' + esc(l.email) + '</small>' : '') + '</p>' +
      (l.recebe_email ? '<button type="button" class="btn btn-ghost sm" data-email="0">' + esc(t('em_desligar')) + '</button>' : '<button type="button" class="btn btn-creme sm" data-email="1">' + esc(t('em_ligar')) + '</button>') + '</div>';
  }

  function telaConta() {
    var l = S.leitor;
    var ligados = l.contas.map(function (c) { return c.provedor; });
    var outros = (S.provedores || []).filter(function (p) { return ligados.indexOf(p.id) < 0; });
    raiz.innerHTML = '<div class="conta-grade"><div><div class="eyebrow">' + esc(t('c_eyebrow')) + '</div><h1>' + esc(t('c_h')) + '<em>' + esc(l.nome) + '</em></h1><p class="lede">' + esc(t('c_desde').replace('{d}', data(l.criado_em))) + (l.email ? '<br>' + esc(t('email')) + ': ' + esc(l.email) : '') + '</p>' +
      '<div class="conta-perigo" style="margin-top:28px"><button type="button" class="btn btn-ghost sm" id="sair">' + esc(t('sair')) + '</button></div></div>' +
      '<div>' + avisos() + boasVindas(l) + cartaoEmail(l) +
      '<div class="conta-card"><h3>' + esc(t('nome_h')) + '</h3><p>' + esc(t('nome_p')) + '</p><form class="conta-campo" id="fNome"><input name="nome" maxlength="80" minlength="2" required value="' + esc(l.nome) + '" aria-label="' + esc(t('nome_h')) + '"><button class="btn btn-creme sm" type="submit">' + esc(t('salvar')) + '</button></form></div>' +
      '<div class="conta-card"><h3>' + esc(t('logins_h')) + '</h3><p>' + esc(t('logins_p')) + '</p><ul class="conta-lista">' + l.contas.map(function (c) {
        return '<li>' + (L.ICONES[c.provedor] || '') + '<span>' + esc(L.NOMES[c.provedor] || c.provedor) + (c.email ? '<small>' + esc(c.email) + '</small>' : '') + '</span>' + (l.contas.length > 1 ? '<button type="button" class="lnk-x" data-desv="' + esc(c.provedor) + '">' + esc(t('remover')) + '</button>' : '') + '</li>';
      }).join('') + '</ul>' + (outros.length ? '<h3 style="margin-top:22px">' + esc(t('vincular_h')) + '</h3>' + L.botoes(outros, { volta: '/conta.html?ok=vinculado', vincular: true }) : '') + '</div>' +
      '<div class="conta-card"><p>' + esc(t('excluir_p')) + '</p><div class="conta-perigo"><button type="button" class="btn btn-ghost sm" id="excluir">' + esc(t('excluir')) + '</button></div></div></div></div>';

    raiz.querySelectorAll('[data-email]').forEach(function (b) {
      b.addEventListener('click', function () {
        var sim = b.getAttribute('data-email') === '1';
        L.api('/conta/email', 'POST', { receber: sim }).then(function () {
          if (voltaBv) { location.href = voltaBv; return; }
          aviso = sim ? 'em_sim_ok' : 'em_nao_ok'; erroAviso = ''; return iniciar();
        }).catch(function (er) { alert(er.message); });
      });
    });
    document.getElementById('sair').addEventListener('click', function () { L.api('/conta/sair', 'POST').then(function () { location.href = '/artigos.html'; }); });
    document.getElementById('fNome').addEventListener('submit', function (e) {
      e.preventDefault();
      L.api('/conta/nome', 'POST', { nome: e.target.nome.value }).then(function () { aviso = 'salvo'; erroAviso = ''; return iniciar(); }).catch(function (er) { alert(er.message); });
    });
    raiz.querySelectorAll('[data-desv]').forEach(function (b) {
      b.addEventListener('click', function () { L.api('/conta/desvincular/' + b.getAttribute('data-desv'), 'POST').then(iniciar).catch(function (er) { alert(er.message); }); });
    });
    var ex = document.getElementById('excluir');
    ex.addEventListener('click', function () {
      if (!ex.dataset.conf) { ex.dataset.conf = '1'; ex.textContent = t('excluir_conf'); ex.classList.remove('btn-ghost'); ex.classList.add('btn-cobre'); return; }
      L.api('/conta', 'DELETE').then(telaExcluida).catch(function (er) { alert(er.message); });
    });
  }

  function desenhar() {
    if (!S) return;
    if (pagina === 'entrar') {
      if (S.leitor) { location.replace(volta); return; }
      return telaEntrar();
    }
    if (!S.leitor) { location.replace('/entrar.html?volta=' + encodeURIComponent('/conta.html')); return; }
    telaConta();
  }

  function iniciar() { return L.recarregar().then(function (s) { S = s; desenhar(); }); }
  if (params.get('ok') === 'vinculado') aviso = 'vinculado';
  iniciar();
  window.addEventListener('pv:lang', function () { setTimeout(desenhar, 0); });
})();
