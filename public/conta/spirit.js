/* The Prophetic Voices — aba "Spirit Immersion" da conta (/conta.html#spirit).
   Contagem dos 100 dias, check diário da hora de oração, testemunho de cada dia e devocionais em PDF.
   API em /api/conta/spirit (worker/spirit.js). */
(function () {
  var T = {
    pt: {
      antes: 'A jornada começa em', antes_d: 'dias', antes_1: 'A jornada começa amanhã', durante: 'Dia {d} de {t}', depois: 'Jornada encerrada',
      orados: 'dias orados', horas: 'horas de oração', seq: 'dias seguidos', tes: 'testemunhos',
      hoje_q: 'Hoje é o dia {d}. Você completou a sua hora de oração?', hoje_sim: 'Sim, orei 1 hora hoje ✓', hoje_ok: 'Hoje está marcado. Glória a Deus!', hoje_tes: 'Escrever o testemunho de hoje',
      antes_p: 'De 1º de janeiro a 10 de abril de 2027 você vai marcar aqui cada dia em que completou a hora de oração em línguas e registrar o que Deus estiver fazendo. Enquanto isso, prepare o coração: os devocionais de preparação aparecem logo abaixo.',
      cal_h: 'Os 100 dias', cal_p: 'Toque em um dia para marcar a oração ou escrever o testemunho. Você pode completar dias anteriores.',
      leg_orou: 'orou', leg_tes: 'com testemunho', leg_hoje: 'hoje', leg_vazio: 'não marcado',
      dia_h: 'Dia {d} · {data}', orei: 'Completei 1 hora de oração neste dia', tes_l: 'Testemunho do dia (opcional)', tes_ph: 'O que Deus falou, fez ou mostrou hoje? Uma palavra, um versículo, uma mudança…',
      aut_l: 'Quem pode ler este testemunho?', aut_equipe: 'Só a equipe do ministério', aut_anonimo: 'Pode ser publicado sem me identificar', aut_nome: 'Pode ser publicado com o meu nome',
      aut_nota: 'A equipe lê com cuidado e oração. Nada é publicado sem a autorização marcada aqui, e você pode mudá-la quando quiser.',
      salvar: 'Salvar o dia', salvo: 'Dia {d} salvo.', fechar: 'Fechar', futuro: 'Este dia ainda não chegou.',
      dev_h: 'Devocionais', dev_vazio: 'Os devocionais aparecem aqui assim que forem liberados.', dev_abrir: 'Abrir PDF', dev_de: 'Liberado em {d}',
      cfg_h: 'Preferências', dev_email_on: 'Você recebe os devocionais também no e-mail', dev_email_off: 'Você não recebe os devocionais por e-mail (eles continuam aqui)', dev_email_srv: 'Os e-mails ainda estão sendo ligados; enquanto isso, os devocionais ficam aqui.',
      ligar: 'Receber por e-mail', desligar: 'Parar de receber', sair_p: 'Sair do Spirit Immersion apaga a sua inscrição, os dias marcados e os testemunhos desta edição.', sair: 'Sair e apagar meu registro', sair_conf: 'Confirmar: sair e apagar',
      priv: 'Seu registro é pessoal: só você vê os dias marcados. <a href="/privacidade.html#spirit">Como cuidamos dos seus dados</a>.', sobre: 'Sobre o movimento'
    },
    en: {
      antes: 'The journey begins in', antes_d: 'days', antes_1: 'The journey begins tomorrow', durante: 'Day {d} of {t}', depois: 'Journey completed',
      orados: 'days prayed', horas: 'hours of prayer', seq: 'days in a row', tes: 'testimonies',
      hoje_q: 'Today is day {d}. Did you complete your hour of prayer?', hoje_sim: 'Yes, I prayed 1 hour today ✓', hoje_ok: 'Today is marked. Glory to God!', hoje_tes: 'Write today’s testimony',
      antes_p: 'From January 1 to April 10, 2027 you will mark here each day you completed your hour of praying in tongues and record what God is doing. Meanwhile, prepare your heart: the preparation devotionals appear below.',
      cal_h: 'The 100 days', cal_p: 'Tap a day to mark your prayer or write the testimony. You can fill in earlier days.',
      leg_orou: 'prayed', leg_tes: 'with testimony', leg_hoje: 'today', leg_vazio: 'not marked',
      dia_h: 'Day {d} · {data}', orei: 'I completed 1 hour of prayer on this day', tes_l: 'Testimony of the day (optional)', tes_ph: 'What did God say, do or show you today? A word, a verse, a change…',
      aut_l: 'Who may read this testimony?', aut_equipe: 'Only the ministry team', aut_anonimo: 'It may be published without identifying me', aut_nome: 'It may be published with my name',
      aut_nota: 'The team reads it with care and prayer. Nothing is published without the permission marked here, and you can change it at any time.',
      salvar: 'Save the day', salvo: 'Day {d} saved.', fechar: 'Close', futuro: 'This day has not come yet.',
      dev_h: 'Devotionals', dev_vazio: 'Devotionals appear here as soon as they are released.', dev_abrir: 'Open PDF', dev_de: 'Released on {d}',
      cfg_h: 'Preferences', dev_email_on: 'You also receive the devotionals by e-mail', dev_email_off: 'You do not receive the devotionals by e-mail (they stay here)', dev_email_srv: 'E-mails are still being set up; meanwhile, the devotionals stay here.',
      ligar: 'Receive by e-mail', desligar: 'Stop receiving', sair_p: 'Leaving the Spirit Immersion erases your enrollment, the days you marked and the testimonies of this edition.', sair: 'Leave and erase my record', sair_conf: 'Confirm: leave and erase',
      priv: 'Your record is personal: only you see the days you marked. <a href="/privacidade.html#spirit">How we care for your data</a>.', sobre: 'About the movement'
    }
  };

  function tela(alvo, opcoes) {
    var L = window.PV_LOGIN, esc = L.esc;
    var t = function (k) { var l = L.lingua(); return (T[l] && T[l][k]) || T.pt[k] || k; };
    var D = null, aberto = null, msg = '';

    var dataDia = function (n) { return new Date(Date.parse(D.edicao.inicio + 'T12:00:00Z') + (n - 1) * 864e5); };
    var fmtData = function (d, longo) { return d.toLocaleDateString(L.lingua() === 'en' ? 'en-US' : 'pt-BR', longo ? { weekday: 'long', day: 'numeric', month: 'long' } : { day: 'numeric', month: 'short' }); };
    var mapa = function () { var m = {}; D.dias.forEach(function (x) { m[x.dia] = x; }); return m; };

    function carregar() { return L.api('/conta/spirit').then(function (d) { D = d; desenhar(); }).catch(function (er) { alvo.innerHTML = '<p class="conta-erro">' + esc(er.message) + '</p>'; }); }

    function salvarDia(n, orou, testemunho, aut) {
      return L.api('/conta/spirit/dia', 'POST', { dia: n, orou: orou, testemunho: testemunho, autorizacao: aut }).then(function () {
        msg = t('salvo').replace('{d}', n); return carregar();
      });
    }

    function desenhar() {
      var e = D.edicao, m = mapa(), hoje = e.dia_atual, ult = Math.min(Math.max(hoje, 0), e.dias);
      var orados = D.dias.filter(function (x) { return x.orou; }).length;
      var nTes = D.dias.filter(function (x) { return x.testemunho; }).length;
      var seq = 0;
      for (var k = (m[ult] && m[ult].orou) ? ult : ult - 1; k >= 1 && m[k] && m[k].orou; k--) seq++;
      var pct = ult ? Math.round(100 * orados / ult) : 0;
      var titulo = e.fase === 'antes' ? (1 - hoje === 1 ? t('antes_1') : t('antes') + ' <b>' + (1 - hoje) + '</b> ' + t('antes_d')) : e.fase === 'durante' ? t('durante').replace('{d}', '<b>' + hoje + '</b>').replace('{t}', e.dias) : t('depois');

      var h = '<div class="sj">';
      // painel principal
      h += '<section class="sj-hud"><span class="si-c tl"></span><span class="si-c br"></span>' +
        '<div class="sj-anel"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" class="g-bg" pathLength="100"/><circle cx="60" cy="60" r="52" class="g-v" pathLength="100" style="stroke-dasharray:' + (e.fase === 'antes' ? 0 : Math.round(100 * Math.min(ult, e.dias) / e.dias)) + ' 100"/></svg>' +
        '<div><small>SI · ' + esc(e.id) + '</small><b>' + (e.fase === 'antes' ? '00' : String(Math.min(ult, e.dias)).padStart(2, '0')) + '</b><small>/ ' + e.dias + '</small></div></div>' +
        '<div class="sj-hud-txt"><h2>' + titulo + '</h2>' +
        '<div class="sj-kpis"><div><b>' + orados + '</b><span>' + esc(t('orados')) + '</span></div><div><b>' + orados + 'h</b><span>' + esc(t('horas')) + '</span></div><div><b>' + seq + '</b><span>' + esc(t('seq')) + '</span></div><div><b>' + nTes + '</b><span>' + esc(t('tes')) + '</span></div></div>';
      if (e.fase === 'durante') {
        var hj = m[hoje];
        h += hj && hj.orou
          ? '<p class="sj-ok">' + esc(t('hoje_ok')) + '</p><button type="button" class="btn btn-ghost sm" data-abrir="' + hoje + '">' + esc(t('hoje_tes')) + '</button>'
          : '<p class="sj-q">' + esc(t('hoje_q').replace('{d}', hoje)) + '</p><div class="conta-perigo"><button type="button" class="btn btn-creme" id="sjHoje">' + esc(t('hoje_sim')) + '</button><button type="button" class="btn btn-ghost sm" data-abrir="' + hoje + '">' + esc(t('hoje_tes')) + '</button></div>';
      } else if (e.fase === 'antes') h += '<p class="sj-q">' + esc(t('antes_p')) + '</p>';
      if (ult && e.fase !== 'antes') h += '<div class="sj-barra" aria-hidden="true"><i style="width:' + pct + '%"></i></div><small class="sj-pct">' + pct + '% · ' + orados + '/' + ult + '</small>';
      h += '</div></section>';
      if (msg) h += '<p class="conta-ok" role="status">' + esc(msg) + '</p>';

      // calendário dos 100 dias
      h += '<section class="conta-card sj-cal-card"><h3>' + esc(t('cal_h')) + '</h3><p>' + esc(t('cal_p')) + '</p><div class="sj-cal">';
      for (var n = 1; n <= e.dias; n++) {
        var x = m[n], cls = n > ult ? 'fut' : x && x.orou ? 'orou' : 'vazio';
        if (n === hoje) cls += ' hoje';
        if (x && x.testemunho) cls += ' tes';
        if (aberto === n) cls += ' sel';
        h += '<button type="button" class="sj-d ' + cls + '" data-dia="' + n + '"' + (n > ult ? ' disabled' : '') + ' title="' + esc(fmtData(dataDia(n))) + '" aria-label="' + esc(t('dia_h').replace('{d}', n).replace('{data}', fmtData(dataDia(n)))) + '"><span>' + n + '</span></button>';
      }
      h += '</div><div class="sj-leg"><span><i class="orou"></i>' + esc(t('leg_orou')) + '</span><span><i class="tes"></i>' + esc(t('leg_tes')) + '</span><span><i class="hoje"></i>' + esc(t('leg_hoje')) + '</span><span><i></i>' + esc(t('leg_vazio')) + '</span></div>';

      // editor do dia
      if (aberto) {
        var y = m[aberto] || { orou: 0, testemunho: '', autorizacao: 'equipe' };
        h += '<form class="sj-ed" id="sjEd"><h4>' + esc(t('dia_h').replace('{d}', aberto).replace('{data}', fmtData(dataDia(aberto), true))) + '</h4>' +
          '<label class="si-check"><input type="checkbox" name="orou"' + (y.orou ? ' checked' : '') + '><span>' + esc(t('orei')) + '</span></label>' +
          '<label class="sj-campo"><span>' + esc(t('tes_l')) + '</span><textarea name="testemunho" rows="5" maxlength="4000" placeholder="' + esc(t('tes_ph')) + '">' + esc(y.testemunho || '') + '</textarea></label>' +
          '<fieldset class="sj-aut"><legend>' + esc(t('aut_l')) + '</legend>' + ['equipe', 'anonimo', 'nome'].map(function (a) {
            return '<label><input type="radio" name="aut" value="' + a + '"' + ((y.autorizacao || 'equipe') === a ? ' checked' : '') + '> ' + esc(t('aut_' + a)) + '</label>';
          }).join('') + '<small>' + esc(t('aut_nota')) + '</small></fieldset>' +
          '<div class="conta-perigo"><button class="btn btn-creme sm" type="submit">' + esc(t('salvar')) + '</button><button type="button" class="lnk-x" id="sjFechar">' + esc(t('fechar')) + '</button></div></form>';
      }
      h += '</section>';

      // devocionais + preferências
      h += '<div class="sj-cols"><section class="conta-card"><h3>' + esc(t('dev_h')) + '</h3>' + (D.devocionais.length ? '<ul class="sj-devs">' + D.devocionais.map(function (d) {
        return '<li><div><b>' + esc(d.titulo) + '</b>' + (d.resumo ? '<p>' + esc(d.resumo) + '</p>' : '') + '<small>' + esc(t('dev_de').replace('{d}', fmtData(new Date(d.liberar_em + 'T12:00:00Z')))) + '</small></div><a class="btn btn-creme sm" href="' + esc(d.pdf_url) + '" target="_blank" rel="noopener">' + esc(t('dev_abrir')) + ' ↗</a></li>';
      }).join('') + '</ul>' : '<p>' + esc(t('dev_vazio')) + '</p>') + '</section>';
      h += '<section class="conta-card"><h3>' + esc(t('cfg_h')) + '</h3><p>' + esc(D.devocionais_email ? t('dev_email_on') : t('dev_email_off')) + (D.devocionais_email && D.email ? '<br><small>' + esc(D.email) + '</small>' : '') + (D.devocionais_email && !D.email_servico ? '<br><small>' + esc(t('dev_email_srv')) + '</small>' : '') + '</p>' +
        '<button type="button" class="btn btn-ghost sm" id="sjDevEmail">' + esc(D.devocionais_email ? t('desligar') : t('ligar')) + '</button>' +
        '<p style="margin-top:22px">' + t('priv') + ' · <a href="/spirit-immersion.html">' + esc(t('sobre')) + '</a></p>' +
        '<p>' + esc(t('sair_p')) + '</p><button type="button" class="btn btn-ghost sm" id="sjSair">' + esc(t('sair')) + '</button></section></div></div>';

      alvo.innerHTML = h;

      var bh = document.getElementById('sjHoje');
      if (bh) bh.onclick = function () { bh.disabled = true; var x = m[hoje] || {}; salvarDia(hoje, true, x.testemunho || '', x.autorizacao || 'equipe').catch(function (er) { alert(er.message); bh.disabled = false; }); };
      alvo.querySelectorAll('[data-dia],[data-abrir]').forEach(function (b) {
        b.onclick = function () {
          aberto = +(b.getAttribute('data-dia') || b.getAttribute('data-abrir')); msg = ''; desenhar();
          var f = document.getElementById('sjEd'); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        };
      });
      var f = document.getElementById('sjEd');
      if (f) f.onsubmit = function (ev) {
        ev.preventDefault();
        var aut = (f.querySelector('input[name="aut"]:checked') || {}).value || 'equipe';
        var n = aberto;
        salvarDia(n, f.orou.checked, f.testemunho.value, aut).then(function () { aberto = null; desenhar(); }).catch(function (er) { alert(er.message); });
      };
      var fc = document.getElementById('sjFechar'); if (fc) fc.onclick = function () { aberto = null; desenhar(); };
      document.getElementById('sjDevEmail').onclick = function () { L.api('/conta/spirit/devocionais', 'POST', { receber: !D.devocionais_email }).then(carregar).catch(function (er) { alert(er.message); }); };
      var bs = document.getElementById('sjSair');
      bs.onclick = function () {
        if (!bs.dataset.conf) { bs.dataset.conf = '1'; bs.textContent = t('sair_conf'); bs.classList.remove('btn-ghost'); bs.classList.add('btn-cobre'); return; }
        L.api('/conta/spirit/sair', 'POST').then(function () { if (opcoes && opcoes.aoSair) opcoes.aoSair(); }).catch(function (er) { alert(er.message); });
      };
    }

    if (D) desenhar(); else { alvo.innerHTML = '<p class="conta-carregando">…</p>'; carregar(); }
  }

  window.PV_SPIRIT = { tela: tela };
})();
