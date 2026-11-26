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
      e_lede: 'Com a sua conta você lê e baixa gratuitamente todos os artigos da revista The Prophetic Voices, comenta neles e ganha uma biblioteca pessoal para salvar artigos, montar coleções e guardar citações. Não há senha para criar: use uma conta que você já tem.',
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
      excluir_p: 'Excluir apaga o seu cadastro, os logins vinculados, os seus comentários e toda a sua Biblioteca (salvos, coleções, citações e histórico) e o seu registro no Spirit Immersion. Não é possível desfazer.',
      excluida: 'Sua conta foi excluída.', voltar_rev: 'Ir para a revista', email: 'E-mail',
      bv_h: 'Bem-vindo ao The Prophetic Voices', bv_p: 'Quer receber no seu e-mail ({e}) os novos artigos da revista e os novos testemunhos assim que forem publicados? Você pode cancelar quando quiser, com um clique em qualquer e-mail.',
      bv_sim: 'Sim, quero receber', bv_nao: 'Agora não', bv_seguir: 'Continuar para onde eu estava →',
      em_h: 'E-mails', em_on: 'Você recebe no e-mail os novos artigos e testemunhos.', em_off: 'Você não recebe e-mails de novos artigos e testemunhos.',
      em_ligar: 'Quero receber', em_desligar: 'Parar de receber', em_sim_ok: 'Pronto! Você vai receber os novos artigos e testemunhos.', em_nao_ok: 'Tudo bem. Você não vai receber e-mails; pode mudar isso aqui quando quiser.',
      aba_bib: 'Biblioteca', aba_dados: 'Dados da conta', bib_lede: 'Sua mesa de estudo: os artigos que você salvou, suas coleções, as citações que guardou e onde parou a leitura.',
      cont_h: 'Continuar lendo', cont_pag: 'Página {p} de {t}', cont_ir: 'Continuar',
      hist_h: 'Histórico de leitura', hist_on: 'Ligado: o site lembra a página em que você parou em cada artigo. Só você vê isso.', hist_off: 'Desligado: o site não guarda onde você parou.',
      hist_ligar: 'Ligar', hist_desligar: 'Desligar e apagar', hist_saiba: 'Como funciona',
      salvos_h: 'Artigos salvos', salvos_vazio: 'Você ainda não salvou nenhum artigo. Use “Salvar na biblioteca” na página de qualquer artigo.', ir_rev: 'Ir para a revista',
      todos: 'Todos', ler: 'Ler', remover_bib: 'Remover', colecoes: 'Coleções', nova_col: 'Nova coleção', nome_col: 'Nome da coleção', criar: 'Criar',
      renomear: 'Renomear', apagar_col: 'Apagar coleção', apagar_col_conf: 'Apagar a coleção “{n}”? Os artigos continuam salvos.', col_vazia: 'Nenhum artigo nesta coleção ainda.',
      cit_h: 'Citações guardadas', cit_p: 'Selecione um trecho no leitor do artigo e toque em “Guardar citação”, ou registre aqui à mão.', cit_vazio: 'Nenhuma citação guardada ainda.',
      cit_nova: 'Registrar citação', cit_artigo: 'Artigo', cit_escolha: 'Escolha o artigo…', cit_trecho: 'Trecho', cit_pag: 'Página', cit_nota: 'Nota (opcional)', guardar: 'Guardar',
      copiar: 'Copiar', copiado: 'Copiado ✓', apagar: 'Apagar', pag_abrev: 'p.',
      com_h: 'Comentários enviados', st_pendente: 'Aguardando a equipe', st_aprovado: 'Publicado', st_rejeitado: 'Não publicado',
      rec_h: 'Publicados recentemente', livre: 'Acesso livre',
      esc_h: 'Escreva para a revista', esc_p: 'A revista vai receber artigos acadêmicos e ensaios teológicos. Registre seu interesse e acompanhe a abertura na página Proponha um artigo.',
      esc_ac: 'Artigo acadêmico', esc_en: 'Ensaio teológico', esc_am: 'Os dois', esc_ok: 'Interesse registrado. A abertura será anunciada na página Proponha um artigo.', esc_sair: 'Retirar interesse', esc_mais: 'Saiba mais'
    },
    en: {
      e_eyebrow: 'Sign up', e_h: 'Sign in', e_em: 'or create your account',
      e_lede: 'With your account you can read and download every article in The Prophetic Voices journal for free, comment on them and get a personal library to save articles, build collections and keep quotations. There is no password to create: use an account you already have.',
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
      excluir_p: 'Deleting removes your profile, linked logins, your comments and your whole Library (saved articles, collections, quotations and history) and your Spirit Immersion record. This cannot be undone.',
      excluida: 'Your account was deleted.', voltar_rev: 'Go to the journal', email: 'E-mail',
      bv_h: 'Welcome to The Prophetic Voices', bv_p: 'Would you like to receive new journal articles and new testimonies at your e-mail ({e}) as soon as they are published? You can unsubscribe at any time with one click in any e-mail.',
      bv_sim: 'Yes, send them to me', bv_nao: 'Not now', bv_seguir: 'Continue where I was →',
      em_h: 'E-mails', em_on: 'You receive new articles and testimonies by e-mail.', em_off: 'You do not receive e-mails about new articles and testimonies.',
      em_ligar: 'Subscribe', em_desligar: 'Unsubscribe', em_sim_ok: 'Done! You will receive new articles and testimonies.', em_nao_ok: 'All right. You will not receive e-mails; you can change this here anytime.',
      aba_bib: 'Library', aba_dados: 'Account details', bib_lede: 'Your study desk: the articles you saved, your collections, the quotations you kept and where you stopped reading.',
      cont_h: 'Continue reading', cont_pag: 'Page {p} of {t}', cont_ir: 'Continue',
      hist_h: 'Reading history', hist_on: 'On: the site remembers the page where you stopped in each article. Only you see it.', hist_off: 'Off: the site does not keep where you stopped.',
      hist_ligar: 'Turn on', hist_desligar: 'Turn off and erase', hist_saiba: 'How it works',
      salvos_h: 'Saved articles', salvos_vazio: 'You have not saved any article yet. Use “Save to library” on any article page.', ir_rev: 'Go to the journal',
      todos: 'All', ler: 'Read', remover_bib: 'Remove', colecoes: 'Collections', nova_col: 'New collection', nome_col: 'Collection name', criar: 'Create',
      renomear: 'Rename', apagar_col: 'Delete collection', apagar_col_conf: 'Delete the collection “{n}”? The articles stay saved.', col_vazia: 'No articles in this collection yet.',
      cit_h: 'Saved quotations', cit_p: 'Select a passage in the article reader and tap “Save quotation”, or add one here by hand.', cit_vazio: 'No quotations saved yet.',
      cit_nova: 'Add quotation', cit_artigo: 'Article', cit_escolha: 'Choose the article…', cit_trecho: 'Passage', cit_pag: 'Page', cit_nota: 'Note (optional)', guardar: 'Save',
      copiar: 'Copy', copiado: 'Copied ✓', apagar: 'Delete', pag_abrev: 'p.',
      com_h: 'Comments you sent', st_pendente: 'Awaiting the team', st_aprovado: 'Published', st_rejeitado: 'Not published',
      rec_h: 'Recently published', livre: 'Open access',
      esc_h: 'Write for the journal', esc_p: 'The journal will receive academic articles and theological essays. Register your interest and check the Propose an article page for the opening announcement.',
      esc_ac: 'Academic article', esc_en: 'Theological essay', esc_am: 'Both', esc_ok: 'Interest registered. The call will be announced on the Propose an article page.', esc_sair: 'Withdraw interest', esc_mais: 'Learn more'
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

  var aba = /^#(dados)$/.test(location.hash) || params.get('bemvindo') || params.get('ok') ? 'dados' : /^#(spirit|sjHistorico)$/.test(location.hash) ? 'spirit' : 'biblioteca';
  var B = null, filtroCol = 0;

  function telaConta() {
    var l = S.leitor;
    raiz.innerHTML = '<div class="conta-topo"><div><div class="eyebrow">' + esc(t('c_eyebrow')) + '</div><h1>' + esc(t('c_h')) + '<em>' + esc(l.nome) + '</em></h1></div>' +
      '<div class="conta-abas" role="tablist"><button type="button" role="tab" data-aba="biblioteca" aria-selected="' + (aba === 'biblioteca') + '">' + esc(t('aba_bib')) + '</button>' +
      (l.spirit && window.PV_SPIRIT ? '<button type="button" role="tab" data-aba="spirit" aria-selected="' + (aba === 'spirit') + '">Spirit<span class="ab-l"> Immersion</span></button>' : '') +
      '<button type="button" role="tab" data-aba="dados" aria-selected="' + (aba === 'dados') + '">' + esc(t('aba_dados')) + '</button></div></div><div id="painelAba"></div>';
    raiz.querySelectorAll('[data-aba]').forEach(function (b) {
      b.addEventListener('click', function () {
        aba = b.getAttribute('data-aba');
        try { history.replaceState(null, '', location.pathname + location.search + (aba === 'dados' ? '#dados' : aba === 'spirit' ? '#spirit' : '')); } catch (e) {}
        telaConta();
      });
    });
    if (aba === 'spirit' && !(l.spirit && window.PV_SPIRIT)) aba = 'biblioteca';
    if (aba === 'dados') telaDados(document.getElementById('painelAba'));
    else if (aba === 'spirit') window.PV_SPIRIT.tela(document.getElementById('painelAba'), { aoSair: function () { aba = 'biblioteca'; history.replaceState(null, '', location.pathname); iniciar(); } });
    else telaBiblioteca(document.getElementById('painelAba'));
  }

  // ---------------------------------------------------------------- Biblioteca
  function dataCurta(s) {
    return new Date(String(s).replace(' ', 'T') + 'Z').toLocaleDateString(L.lingua() === 'en' ? 'en-US' : 'pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function carregarBib() { return L.api('/conta/biblioteca').then(function (d) { B = d; return d; }); }
  function falha(er) { alert(er.message); }

  function telaBiblioteca(alvo) {
    if (!B) { alvo.innerHTML = '<p class="conta-carregando">…</p>'; carregarBib().then(function () { if (aba === 'biblioteca') telaBiblioteca(alvo); }).catch(falha); return; }
    var h = '<p class="lede bib-lede">' + esc(t('bib_lede')) + '</p><div class="bib-grade"><div class="bib-col">';

    // continuar lendo
    if (B.historico === 1 && B.continuar.length) {
      h += '<section class="conta-card" id="continuar"><h3>' + esc(t('cont_h')) + '</h3><ul class="bib-lista">' + B.continuar.map(function (a) {
        var pct = a.total ? Math.round(100 * a.pagina / a.total) : 0;
        return '<li><a class="bib-capa" href="/artigos/' + esc(a.slug) + '.html#leitor"><img src="' + esc(a.capa) + '" alt="" loading="lazy"></a><div class="bib-info"><a href="/artigos/' + esc(a.slug) + '.html#leitor" class="bib-tit">' + esc(a.titulo) + '</a><small>' + esc(a.autor) + '</small>' +
          '<div class="bib-prog" aria-hidden="true"><i style="width:' + pct + '%"></i></div><small>' + esc(t('cont_pag').replace('{p}', a.pagina).replace('{t}', a.total || '?')) + '</small></div>' +
          '<a class="btn btn-creme sm" href="/artigos/' + esc(a.slug) + '.html#leitor">' + esc(t('cont_ir')) + '</a></li>';
      }).join('') + '</ul></section>';
    }

    // salvos + coleções
    var cols = B.colecoes;
    if (filtroCol && !cols.some(function (c) { return c.id === filtroCol; })) filtroCol = 0;
    var lista = filtroCol ? B.salvos.filter(function (a) { return a.colecoes.indexOf(filtroCol) >= 0; }) : B.salvos;
    h += '<section class="conta-card" id="salvos"><h3>' + esc(t('salvos_h')) + (B.salvos.length ? ' · ' + B.salvos.length : '') + '</h3>';
    if (!B.salvos.length) {
      h += '<p>' + esc(t('salvos_vazio')) + '</p><a class="btn btn-ghost sm" href="/artigos.html">' + esc(t('ir_rev')) + '</a>';
    } else {
      h += '<div class="bib-chips"><button type="button" class="chip" data-fcol="0" aria-pressed="' + (!filtroCol) + '">' + esc(t('todos')) + '</button>' + cols.map(function (c) {
        return '<button type="button" class="chip" data-fcol="' + c.id + '" aria-pressed="' + (filtroCol === c.id) + '">' + esc(c.nome) + ' <small>' + c.itens.length + '</small></button>';
      }).join('') + '<button type="button" class="chip chip-novo" id="novaCol">+ ' + esc(t('nova_col')) + '</button></div>';
      if (filtroCol) {
        var fc = cols.filter(function (c) { return c.id === filtroCol; })[0];
        h += '<div class="bib-colbar"><button type="button" class="lnk-x" data-rencol="' + fc.id + '">' + esc(t('renomear')) + '</button><button type="button" class="lnk-x" data-delcol="' + fc.id + '">' + esc(t('apagar_col')) + '</button></div>';
      }
      h += lista.length ? '<ul class="bib-lista">' + lista.map(function (a) {
        return '<li><a class="bib-capa" href="/artigos/' + esc(a.slug) + '.html"><img src="' + esc(a.capa) + '" alt="" loading="lazy"></a><div class="bib-info"><a href="/artigos/' + esc(a.slug) + '.html" class="bib-tit">' + esc(a.titulo) + '</a><small>' + esc(a.autor) + (a.ano ? ' · ' + esc(a.ano) : '') + '</small>' +
          (cols.length ? '<details class="bib-cols"><summary>' + esc(t('colecoes')) + (a.colecoes.length ? ' · ' + a.colecoes.length : '') + '</summary><div>' + cols.map(function (c) {
            return '<label><input type="checkbox" data-item="' + c.id + '" data-slug="' + esc(a.slug) + '"' + (a.colecoes.indexOf(c.id) >= 0 ? ' checked' : '') + '> ' + esc(c.nome) + '</label>';
          }).join('') + '</div></details>' : '') + '</div>' +
          '<div class="bib-acoes"><a class="btn btn-creme sm" href="/artigos/' + esc(a.slug) + '.html#leitor">' + esc(t('ler')) + '</a><button type="button" class="lnk-x" data-tirar="' + esc(a.slug) + '">' + esc(t('remover_bib')) + '</button></div></li>';
      }).join('') + '</ul>' : '<p>' + esc(t('col_vazia')) + '</p>';
    }
    h += '</section>';

    // citações
    h += '<section class="conta-card" id="citacoes"><h3>' + esc(t('cit_h')) + (B.citacoes.length ? ' · ' + B.citacoes.length : '') + '</h3><p>' + esc(t('cit_p')) + '</p>';
    h += B.citacoes.length ? '<ul class="bib-cits">' + B.citacoes.map(function (c) {
      return '<li><blockquote>“' + esc(c.trecho) + '” <b>' + esc(c.chamada) + '</b></blockquote>' + (c.nota ? '<p class="bib-nota">' + esc(c.nota) + '</p>' : '') +
        '<small><a href="/artigos/' + esc(c.slug) + '.html">' + esc(c.titulo) + '</a> · ' + esc(dataCurta(c.criado_em)) + '</small>' +
        '<div class="bib-acoes"><button type="button" class="lnk-x" data-copiar="' + c.id + '">' + esc(t('copiar')) + '</button><button type="button" class="lnk-x" data-delcit="' + c.id + '">' + esc(t('apagar')) + '</button></div></li>';
    }).join('') + '</ul>' : '<p class="bib-vazio">' + esc(t('cit_vazio')) + '</p>';
    h += '<details class="bib-form"><summary>+ ' + esc(t('cit_nova')) + '</summary><form id="fCit" class="bib-campos">' +
      '<label><span>' + esc(t('cit_artigo')) + '</span><select name="slug" required><option value="">' + esc(t('cit_escolha')) + '</option>' + B.artigos.map(function (a) { return '<option value="' + esc(a.slug) + '">' + esc(a.titulo) + ' — ' + esc(a.autor) + '</option>'; }).join('') + '</select></label>' +
      '<label><span>' + esc(t('cit_trecho')) + '</span><textarea name="trecho" maxlength="3000" required rows="4"></textarea></label>' +
      '<div class="bib-linha"><label><span>' + esc(t('cit_pag')) + '</span><input name="pagina" inputmode="numeric" pattern="[0-9]*" maxlength="4"></label><label style="flex:3"><span>' + esc(t('cit_nota')) + '</span><input name="nota" maxlength="1000"></label></div>' +
      '<button class="btn btn-creme sm" type="submit">' + esc(t('guardar')) + '</button></form></details></section>';

    // comentários enviados
    if (B.comentarios.length) {
      h += '<section class="conta-card" id="comentarios"><h3>' + esc(t('com_h')) + '</h3><ul class="bib-cits">' + B.comentarios.map(function (c) {
        return '<li><p class="bib-com">' + esc(c.texto) + '</p><small><a href="/artigos/' + esc(c.slug) + '.html#comentarios">' + esc(c.titulo) + '</a> · ' + esc(dataCurta(c.criado_em)) + ' · <span class="bib-st bib-st-' + esc(c.status) + '">' + esc(t('st_' + c.status)) + '</span></small></li>';
      }).join('') + '</ul></section>';
    }
    h += '</div><div class="bib-col">';

    // histórico
    h += '<section class="conta-card"><h3>' + esc(t('hist_h')) + '</h3><p>' + esc(B.historico === 1 ? t('hist_on') : t('hist_off')) + ' <a href="/privacidade.html#leitura">' + esc(t('hist_saiba')) + '</a></p>' +
      (B.historico === 1 ? '<button type="button" class="btn btn-ghost sm" data-hist="0">' + esc(t('hist_desligar')) + '</button>' : '<button type="button" class="btn btn-creme sm" data-hist="1">' + esc(t('hist_ligar')) + '</button>') + '</section>';

    // recentes
    if (B.recentes.length) {
      h += '<section class="conta-card"><h3>' + esc(t('rec_h')) + '</h3><ul class="bib-mini">' + B.recentes.map(function (a) {
        return '<li><a href="/artigos/' + esc(a.slug) + '.html"><b>' + esc(a.titulo) + '</b><small>' + esc(a.autor) + (a.acesso === 'livre' ? ' · ' + esc(t('livre')) : '') + '</small></a></li>';
      }).join('') + '</ul></section>';
    }

    // escreva para a revista
    var tr = B.interesse_autor;
    h += '<section class="conta-card conta-escreva"><h3>' + esc(t('esc_h')) + '</h3><p>' + esc(t('esc_p')) + '</p>' +
      (tr ? '<p class="conta-ok" style="margin:0 0 14px">' + esc(t('esc_ok')) + ' (' + esc(t({ academico: 'esc_ac', ensaio: 'esc_en', ambos: 'esc_am' }[tr])) + ')</p><div class="conta-perigo"><a class="btn btn-ghost sm" href="/proponha.html">' + esc(t('esc_mais')) + '</a><button type="button" class="lnk-x" data-trilho="">' + esc(t('esc_sair')) + '</button></div>'
        : '<div class="conta-perigo"><button type="button" class="btn btn-creme sm" data-trilho="academico">' + esc(t('esc_ac')) + '</button><button type="button" class="btn btn-creme sm" data-trilho="ensaio">' + esc(t('esc_en')) + '</button><button type="button" class="btn btn-ghost sm" data-trilho="ambos">' + esc(t('esc_am')) + '</button></div><p style="margin:14px 0 0"><a href="/proponha.html">' + esc(t('esc_mais')) + ' →</a></p>') +
      '</section></div></div>';

    alvo.innerHTML = h;
    var refazer = function () { return carregarBib().then(function () { telaBiblioteca(alvo); }); };

    alvo.querySelectorAll('[data-fcol]').forEach(function (b) { b.onclick = function () { filtroCol = +b.getAttribute('data-fcol'); telaBiblioteca(alvo); }; });
    var nc = document.getElementById('novaCol');
    if (nc) nc.onclick = function () {
      var nome = prompt(t('nome_col'));
      if (nome && nome.trim()) L.api('/conta/colecoes', 'POST', { nome: nome }).then(function (r) { filtroCol = r.id; return refazer(); }).catch(falha);
    };
    alvo.querySelectorAll('[data-rencol]').forEach(function (b) {
      b.onclick = function () {
        var c = B.colecoes.filter(function (x) { return x.id === +b.getAttribute('data-rencol'); })[0];
        var nome = prompt(t('nome_col'), c.nome);
        if (nome && nome.trim()) L.api('/conta/colecoes/' + c.id, 'POST', { nome: nome }).then(refazer).catch(falha);
      };
    });
    alvo.querySelectorAll('[data-delcol]').forEach(function (b) {
      b.onclick = function () {
        var c = B.colecoes.filter(function (x) { return x.id === +b.getAttribute('data-delcol'); })[0];
        if (confirm(t('apagar_col_conf').replace('{n}', c.nome))) L.api('/conta/colecoes/' + c.id, 'DELETE').then(function () { filtroCol = 0; return refazer(); }).catch(falha);
      };
    });
    alvo.querySelectorAll('[data-item]').forEach(function (cb) {
      cb.onchange = function () {
        L.api('/conta/colecoes/' + cb.getAttribute('data-item') + '/itens', 'POST', { slug: cb.getAttribute('data-slug'), incluir: cb.checked })
          .then(function () { return carregarBib(); }).then(function () {
            var aberto = cb.closest('details'); var s = cb.getAttribute('data-slug');
            telaBiblioteca(alvo);
            if (aberto) { var d = alvo.querySelector('[data-slug="' + s + '"]'); if (d) d.closest('details').open = true; }
          }).catch(falha);
      };
    });
    alvo.querySelectorAll('[data-tirar]').forEach(function (b) {
      b.onclick = function () { L.api('/conta/salvos/' + encodeURIComponent(b.getAttribute('data-tirar')), 'POST', { salvar: false }).then(refazer).catch(falha); };
    });
    alvo.querySelectorAll('[data-copiar]').forEach(function (b) {
      b.onclick = function () {
        var c = B.citacoes.filter(function (x) { return x.id === +b.getAttribute('data-copiar'); })[0];
        var txt = '“' + c.trecho + '” ' + c.chamada + (c.nota ? '\n' + c.nota : '') + '\n\n' + c.referencia;
        var ok = function () { b.textContent = t('copiado'); setTimeout(function () { b.textContent = t('copiar'); }, 1800); };
        if (navigator.clipboard) navigator.clipboard.writeText(txt).then(ok, ok); else ok();
      };
    });
    alvo.querySelectorAll('[data-delcit]').forEach(function (b) {
      b.onclick = function () { L.api('/conta/citacoes/' + b.getAttribute('data-delcit'), 'DELETE').then(refazer).catch(falha); };
    });
    var fc = document.getElementById('fCit');
    if (fc) fc.onsubmit = function (e) {
      e.preventDefault();
      L.api('/conta/citacoes', 'POST', { slug: fc.slug.value, trecho: fc.trecho.value, pagina: fc.pagina.value, nota: fc.nota.value }).then(refazer).catch(falha);
    };
    alvo.querySelectorAll('[data-hist]').forEach(function (b) {
      b.onclick = function () { L.api('/conta/historico', 'POST', { ligar: b.getAttribute('data-hist') === '1' }).then(refazer).catch(falha); };
    });
    alvo.querySelectorAll('[data-trilho]').forEach(function (b) {
      b.onclick = function () { L.api('/conta/interesse', 'POST', { trilho: b.getAttribute('data-trilho') || null }).then(refazer).catch(falha); };
    });
    if (/^#(citacoes|salvos|continuar|comentarios)$/.test(location.hash) && !alvo.dataset.rolou) {
      alvo.dataset.rolou = '1';
      var sec = document.querySelector(location.hash); if (sec) setTimeout(function () { sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
    }
  }

  // ---------------------------------------------------------------- Dados da conta
  function telaDados(alvo) {
    var l = S.leitor;
    var ligados = l.contas.map(function (c) { return c.provedor; });
    var outros = (S.provedores || []).filter(function (p) { return ligados.indexOf(p.id) < 0; });
    alvo.innerHTML = '<div class="conta-grade"><div><p class="lede" style="margin-top:0">' + esc(t('c_desde').replace('{d}', data(l.criado_em))) + (l.email ? '<br>' + esc(t('email')) + ': ' + esc(l.email) : '') + '</p>' +
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
