/* The Prophetic Voices — aba "Spirit Immersion" da conta (/conta.html#spirit).
   Contagem dos 100 dias, check diário da hora de oração, DIÁRIO (testemunhos, impressões proféticas,
   o que ouviu de Deus, texto lido, orações) e devocionais em PDF. API em /api/conta/spirit (worker/spirit.js). */
(function () {
  var T = {
    pt: {
      antes: 'A jornada começa em', antes_d: 'dias', antes_1: 'A jornada começa amanhã', durante: 'Dia {d} de {t}', depois: 'Jornada encerrada',
      orados: 'dias orados', horas: 'horas de oração', seq: 'dias seguidos', reg: 'registros no diário',
      hoje_q: 'Hoje é o dia {d}. Você completou a sua hora de oração?', hoje_sim: 'Sim, orei 1 hora hoje ✓', hoje_ok: 'Hoje está marcado. Glória a Deus!', hoje_dia: 'Escrever no diário',
      antes_p: 'De 1º de janeiro a 10 de abril de 2027 você vai marcar aqui cada dia em que completou a hora de oração em línguas. Enquanto isso, prepare o coração: o diário já está aberto, e os devocionais de preparação aparecem logo abaixo.',
      cal_h: 'Os 100 dias', cal_p: 'Toque em um dia para marcar a oração. Você pode completar dias anteriores.',
      cal_antes: 'Os dias se abrem em 1º de janeiro de 2027: a partir daí, toque em um dia para marcar que orou. Até lá, use o diário para registrar a sua preparação.',
      leg_orou: 'orou', leg_tes: 'com registro no diário', leg_hoje: 'hoje', leg_vazio: 'não marcado',
      dia_h: 'Dia {d} · {data}', orei: 'Completei 1 hora de oração neste dia', salvar_dia: 'Salvar', salvo_dia: 'Dia {d} salvo.', fechar: 'Fechar',
      dia_reg: 'Registros deste dia', dia_escrever: 'Escrever no diário deste dia', dia_vazio: 'Nenhum registro no diário neste dia.',
      di_h: 'Diário', di_p: 'Registre como estão sendo os seus dias de oração: testemunhos, impressões proféticas, o que você ouviu de Deus, o texto que leu, orações. Volte aqui sempre que quiser reler a sua caminhada.',
      di_novo: 'Novo registro', di_editando: 'Editando registro', di_data: 'Data', di_tipo: 'Tipo', di_ref: 'Texto bíblico ou referência (opcional)', di_ref_ph: 'Ex.: Salmo 27; Zacarias 12.10',
      di_texto: 'O que você quer registrar?', di_ph: 'O que Deus falou, fez ou mostrou? Uma palavra, uma impressão, um versículo, uma mudança…',
      di_aut: 'Quem pode ler?', aut_privado: 'Só eu', aut_equipe: 'A equipe do ministério', aut_anonimo: 'Pode ser publicado sem me identificar', aut_nome: 'Pode ser publicado com o meu nome',
      di_aut_nota: 'O diário é seu: “só eu” é o padrão. Se você liberar um registro, a equipe lê com cuidado e oração, e nada é publicado fora da autorização marcada. Você pode mudar quando quiser.',
      di_salvar: 'Salvar no diário', di_salvo: 'Registro salvo no diário.', di_cancelar: 'Cancelar edição', di_editar: 'Editar', di_apagar: 'Apagar', di_apagar_conf: 'Apagar este registro do diário?',
      di_todos: 'Todos', di_busca: 'Buscar no diário', di_vazio: 'Seu diário ainda está em branco. O primeiro registro pode ser hoje.', di_nada: 'Nenhum registro encontrado.',
      t_testemunho: 'Testemunho', t_profetica: 'Impressão profética', t_ouvi: 'O que ouvi de Deus', t_texto: 'Texto que li', t_oracao: 'Oração', t_outro: 'Outro',
      dev_h: 'Devocionais', dev_vazio: 'Os devocionais aparecem aqui assim que forem liberados.', dev_abrir: 'Abrir PDF', dev_de: 'Liberado em {d}',
      cfg_h: 'Preferências', dev_email_on: 'Você recebe os devocionais também no e-mail', dev_email_off: 'Você não recebe os devocionais por e-mail (eles continuam aqui)', dev_email_srv: 'Os e-mails ainda estão sendo ligados; enquanto isso, os devocionais ficam aqui.',
      ligar: 'Receber por e-mail', desligar: 'Parar de receber', sair_p: 'Sair do Spirit Immersion apaga a sua inscrição, os dias marcados e todo o seu diário desta edição.', sair: 'Sair e apagar meu registro', sair_conf: 'Confirmar: sair e apagar',
      priv: 'Seu registro é pessoal: só você vê os dias marcados e o diário que não liberar. <a href="/privacidade.html#spirit">Como cuidamos dos seus dados</a>.', sobre: 'Sobre o movimento'
    },
    en: {
      antes: 'The journey begins in', antes_d: 'days', antes_1: 'The journey begins tomorrow', durante: 'Day {d} of {t}', depois: 'Journey completed',
      orados: 'days prayed', horas: 'hours of prayer', seq: 'days in a row', reg: 'journal entries',
      hoje_q: 'Today is day {d}. Did you complete your hour of prayer?', hoje_sim: 'Yes, I prayed 1 hour today ✓', hoje_ok: 'Today is marked. Glory to God!', hoje_dia: 'Write in the journal',
      antes_p: 'From January 1 to April 10, 2027 you will mark here each day you completed your hour of praying in tongues. Meanwhile, prepare your heart: the journal is already open, and the preparation devotionals appear below.',
      cal_h: 'The 100 days', cal_p: 'Tap a day to mark your prayer. You can fill in earlier days.',
      cal_antes: 'The days open on January 1, 2027: from then on, tap a day to mark that you prayed. Until then, use the journal to record your preparation.',
      leg_orou: 'prayed', leg_tes: 'with journal entry', leg_hoje: 'today', leg_vazio: 'not marked',
      dia_h: 'Day {d} · {data}', orei: 'I completed 1 hour of prayer on this day', salvar_dia: 'Save', salvo_dia: 'Day {d} saved.', fechar: 'Close',
      dia_reg: 'Entries for this day', dia_escrever: 'Write in the journal for this day', dia_vazio: 'No journal entries on this day.',
      di_h: 'Journal', di_p: 'Record how your days of prayer are going: testimonies, prophetic impressions, what you heard from God, the passage you read, prayers. Come back whenever you want to reread your journey.',
      di_novo: 'New entry', di_editando: 'Editing entry', di_data: 'Date', di_tipo: 'Type', di_ref: 'Bible passage or reference (optional)', di_ref_ph: 'E.g.: Psalm 27; Zechariah 12:10',
      di_texto: 'What do you want to record?', di_ph: 'What did God say, do or show you? A word, an impression, a verse, a change…',
      di_aut: 'Who may read it?', aut_privado: 'Only me', aut_equipe: 'The ministry team', aut_anonimo: 'It may be published without identifying me', aut_nome: 'It may be published with my name',
      di_aut_nota: 'The journal is yours: “only me” is the default. If you share an entry, the team reads it with care and prayer, and nothing is published beyond the permission you choose. You can change it anytime.',
      di_salvar: 'Save to journal', di_salvo: 'Entry saved to your journal.', di_cancelar: 'Cancel editing', di_editar: 'Edit', di_apagar: 'Delete', di_apagar_conf: 'Delete this journal entry?',
      di_todos: 'All', di_busca: 'Search the journal', di_vazio: 'Your journal is still blank. The first entry can be today.', di_nada: 'No entries found.',
      t_testemunho: 'Testimony', t_profetica: 'Prophetic impression', t_ouvi: 'What I heard from God', t_texto: 'Passage I read', t_oracao: 'Prayer', t_outro: 'Other',
      dev_h: 'Devotionals', dev_vazio: 'Devotionals appear here as soon as they are released.', dev_abrir: 'Open PDF', dev_de: 'Released on {d}',
      cfg_h: 'Preferences', dev_email_on: 'You also receive the devotionals by e-mail', dev_email_off: 'You do not receive the devotionals by e-mail (they stay here)', dev_email_srv: 'E-mails are still being set up; meanwhile, the devotionals stay here.',
      ligar: 'Receive by e-mail', desligar: 'Stop receiving', sair_p: 'Leaving the Spirit Immersion erases your enrollment, the days you marked and your whole journal for this edition.', sair: 'Leave and erase my record', sair_conf: 'Confirm: leave and erase',
      priv: 'Your record is personal: only you see the days you marked and the journal entries you do not share. <a href="/privacidade.html#spirit">How we care for your data</a>.', sobre: 'About the movement'
    }
  };
  var TIPOS = ['testemunho', 'profetica', 'ouvi', 'texto', 'oracao', 'outro'];
  var AUTS = ['privado', 'equipe', 'anonimo', 'nome'];
  var vazio = function (data) { return { id: 0, data: data || '', tipo: 'testemunho', referencia: '', texto: '', autorizacao: 'privado' }; };

  // rascunho do diário sobrevive às re-renderizações (troca de idioma, salvar um dia etc.)
  var rasc = vazio(), filtro = '', busca = '';

  function tela(alvo, opcoes) {
    var L = window.PV_LOGIN, esc = L.esc;
    var t = function (k) { var l = L.lingua(); return (T[l] && T[l][k]) || T.pt[k] || k; };
    var D = null, aberto = null, msg = '';

    var dataDia = function (n) { return new Date(Date.parse(D.edicao.inicio + 'T12:00:00Z') + (n - 1) * 864e5); };
    var isoDia = function (n) { return dataDia(n).toISOString().slice(0, 10); };
    var diaDeIso = function (iso) { return Math.round((Date.parse(iso + 'T12:00:00Z') - Date.parse(D.edicao.inicio + 'T12:00:00Z')) / 864e5) + 1; };
    var fmtData = function (d, longo) { return d.toLocaleDateString(L.lingua() === 'en' ? 'en-US' : 'pt-BR', longo ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' } : { day: 'numeric', month: 'short' }); };
    var fmtIso = function (iso, longo) { return fmtData(new Date(iso + 'T12:00:00Z'), longo); };
    var mapa = function () { var m = {}; D.dias.forEach(function (x) { m[x.dia] = x; }); return m; };
    var porData = function () { var m = {}; D.diario.forEach(function (x) { (m[x.data] = m[x.data] || []).push(x); }); return m; };
    var rotDia = function (n) { return t('dia_h').replace('{d}', n).replace(' · {data}', ''); };

    function carregar() { return L.api('/conta/spirit').then(function (d) { D = d; if (!rasc.data) rasc.data = d.edicao.hoje; desenhar(); }).catch(function (er) { alvo.innerHTML = '<p class="conta-erro">' + esc(er.message) + '</p>'; }); }

    function salvarDia(n, orou) {
      var x = mapa()[n] || {};
      return L.api('/conta/spirit/dia', 'POST', { dia: n, orou: orou, testemunho: x.testemunho || '', autorizacao: x.autorizacao || 'equipe' }).then(function () {
        msg = t('salvo_dia').replace('{d}', n); return carregar();
      });
    }

    function itemDiario(x) {
      return '<li class="sj-reg"><div class="sj-reg-top"><span class="sj-tipo sj-t-' + esc(x.tipo) + '">' + esc(t('t_' + x.tipo)) + '</span>' +
        (x.referencia ? '<span class="sj-ref">' + esc(x.referencia) + '</span>' : '') + '</div>' +
        '<p class="sj-reg-txt">' + esc(x.texto) + '</p>' +
        '<div class="sj-reg-pe"><small>' + esc(t('aut_' + x.autorizacao)) + '</small><span><button type="button" class="lnk-x" data-editreg="' + x.id + '">' + esc(t('di_editar')) + '</button> <button type="button" class="lnk-x" data-delreg="' + x.id + '">' + esc(t('di_apagar')) + '</button></span></div></li>';
    }

    function desenhar() {
      var e = D.edicao, m = mapa(), pd = porData(), hoje = e.dia_atual, ult = Math.min(Math.max(hoje, 0), e.dias);
      var orados = D.dias.filter(function (x) { return x.orou; }).length;
      var seq = 0;
      for (var k = (m[ult] && m[ult].orou) ? ult : ult - 1; k >= 1 && m[k] && m[k].orou; k--) seq++;
      var pct = ult ? Math.round(100 * orados / ult) : 0;
      var titulo = e.fase === 'antes' ? (1 - hoje === 1 ? t('antes_1') : t('antes') + ' <b>' + (1 - hoje) + '</b> ' + t('antes_d')) : e.fase === 'durante' ? t('durante').replace('{d}', '<b>' + hoje + '</b>').replace('{t}', e.dias) : t('depois');

      var h = '<div class="sj">';
      h += '<section class="sj-hud"><span class="si-c tl"></span><span class="si-c br"></span>' +
        '<div class="sj-anel"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" class="g-bg" pathLength="100"/><circle cx="60" cy="60" r="52" class="g-v" pathLength="100" style="stroke-dasharray:' + (e.fase === 'antes' ? 0 : Math.round(100 * ult / e.dias)) + ' 100"/></svg>' +
        '<div><small>SI · ' + esc(e.id) + '</small><b>' + (e.fase === 'antes' ? '00' : String(ult).padStart(2, '0')) + '</b><small>/ ' + e.dias + '</small></div></div>' +
        '<div class="sj-hud-txt"><h2>' + titulo + '</h2>' +
        '<div class="sj-kpis"><div><b>' + orados + '</b><span>' + esc(t('orados')) + '</span></div><div><b>' + orados + 'h</b><span>' + esc(t('horas')) + '</span></div><div><b>' + seq + '</b><span>' + esc(t('seq')) + '</span></div><div><b>' + D.diario.length + '</b><span>' + esc(t('reg')) + '</span></div></div>';
      if (e.fase === 'durante') {
        var hj = m[hoje];
        h += hj && hj.orou
          ? '<p class="sj-ok">' + esc(t('hoje_ok')) + '</p><a class="btn btn-ghost sm" href="#sjDiario" data-irdiario="' + e.hoje + '">' + esc(t('hoje_dia')) + '</a>'
          : '<p class="sj-q">' + esc(t('hoje_q').replace('{d}', hoje)) + '</p><div class="conta-perigo"><button type="button" class="btn btn-creme" id="sjHoje">' + esc(t('hoje_sim')) + '</button><a class="btn btn-ghost sm" href="#sjDiario" data-irdiario="' + e.hoje + '">' + esc(t('hoje_dia')) + '</a></div>';
      } else if (e.fase === 'antes') h += '<p class="sj-q">' + esc(t('antes_p')) + '</p><a class="btn btn-creme sm" href="#sjDiario" data-irdiario="' + e.hoje + '">' + esc(t('hoje_dia')) + '</a>';
      if (ult && e.fase !== 'antes') h += '<div class="sj-barra" aria-hidden="true"><i style="width:' + pct + '%"></i></div><small class="sj-pct">' + pct + '% · ' + orados + '/' + ult + '</small>';
      h += '</div></section>';
      if (msg) h += '<p class="conta-ok" role="status">' + esc(msg) + '</p>';

      // calendário dos 100 dias
      h += '<section class="conta-card sj-cal-card"><h3>' + esc(t('cal_h')) + '</h3><p' + (e.fase === 'antes' ? ' class="sj-aviso"' : '') + '>' + esc(e.fase === 'antes' ? t('cal_antes') : t('cal_p')) + '</p><div class="sj-cal">';
      for (var n = 1; n <= e.dias; n++) {
        var x = m[n], cls = n > ult ? 'fut' : x && x.orou ? 'orou' : 'vazio';
        if (n === hoje) cls += ' hoje';
        if (pd[isoDia(n)] || (x && x.testemunho)) cls += ' tes';
        if (aberto === n) cls += ' sel';
        h += '<button type="button" class="sj-d ' + cls + '" data-dia="' + n + '"' + (n > ult ? ' disabled' : '') + ' title="' + esc(fmtData(dataDia(n))) + '" aria-label="' + esc(t('dia_h').replace('{d}', n).replace('{data}', fmtData(dataDia(n)))) + '"><span>' + n + '</span></button>';
      }
      h += '</div><div class="sj-leg"><span><i class="orou"></i>' + esc(t('leg_orou')) + '</span><span><i class="tes"></i>' + esc(t('leg_tes')) + '</span><span><i class="hoje"></i>' + esc(t('leg_hoje')) + '</span><span><i></i>' + esc(t('leg_vazio')) + '</span></div>';

      if (aberto) {
        var y = m[aberto] || { orou: 0 }, regs = pd[isoDia(aberto)] || [];
        h += '<form class="sj-ed" id="sjEd"><h4>' + esc(t('dia_h').replace('{d}', aberto).replace('{data}', fmtData(dataDia(aberto), true))) + '</h4>' +
          '<label class="si-check"><input type="checkbox" name="orou"' + (y.orou ? ' checked' : '') + '><span>' + esc(t('orei')) + '</span></label>' +
          '<div class="conta-perigo"><button class="btn btn-creme sm" type="submit">' + esc(t('salvar_dia')) + '</button><button type="button" class="lnk-x" id="sjFechar">' + esc(t('fechar')) + '</button></div>' +
          '<h5>' + esc(t('dia_reg')) + '</h5>' + (regs.length ? '<ul class="sj-regs">' + regs.map(itemDiario).join('') + '</ul>' : '<p class="sj-mudo">' + esc(t('dia_vazio')) + '</p>') +
          '<a class="btn btn-ghost sm" href="#sjDiario" data-irdiario="' + isoDia(aberto) + '">' + esc(t('dia_escrever')) + '</a></form>';
      }
      h += '</section>';

      // diário
      var cont = {}; D.diario.forEach(function (r) { cont[r.tipo] = (cont[r.tipo] || 0) + 1; });
      var q = busca.trim().toLowerCase();
      var lista = D.diario.filter(function (r) { return (!filtro || r.tipo === filtro) && (!q || (r.texto + ' ' + (r.referencia || '')).toLowerCase().indexOf(q) >= 0); });
      h += '<section class="conta-card sj-diario" id="sjDiario"><h3>' + esc(t('di_h')) + (D.diario.length ? ' · ' + D.diario.length : '') + '</h3><p>' + esc(t('di_p')) + '</p>' +
        '<form id="sjDi" class="sj-di-form"><h4>' + esc(rasc.id ? t('di_editando') : t('di_novo')) + '</h4>' +
        '<div class="sj-tipos" role="radiogroup" aria-label="' + esc(t('di_tipo')) + '">' + TIPOS.map(function (k) {
          return '<label class="sj-chip"><input type="radio" name="tipo" value="' + k + '"' + (rasc.tipo === k ? ' checked' : '') + '><span>' + esc(t('t_' + k)) + '</span></label>';
        }).join('') + '</div>' +
        '<div class="sj-di-linha"><label class="sj-campo sj-c-data"><span>' + esc(t('di_data')) + '</span><input type="date" name="data" required max="' + esc(e.hoje) + '" value="' + esc(rasc.data || e.hoje) + '"></label>' +
        '<label class="sj-campo"><span>' + esc(t('di_ref')) + '</span><input name="referencia" maxlength="200" placeholder="' + esc(t('di_ref_ph')) + '" value="' + esc(rasc.referencia) + '"></label></div>' +
        '<label class="sj-campo"><span>' + esc(t('di_texto')) + '</span><textarea name="texto" rows="6" maxlength="10000" required placeholder="' + esc(t('di_ph')) + '">' + esc(rasc.texto) + '</textarea></label>' +
        '<label class="sj-campo"><span>' + esc(t('di_aut')) + '</span><select name="autorizacao">' + AUTS.map(function (a) { return '<option value="' + a + '"' + (rasc.autorizacao === a ? ' selected' : '') + '>' + esc(t('aut_' + a)) + '</option>'; }).join('') + '</select></label>' +
        '<small class="sj-nota">' + esc(t('di_aut_nota')) + '</small>' +
        '<div class="conta-perigo"><button class="btn btn-creme sm" type="submit">' + esc(t('di_salvar')) + '</button>' + (rasc.id ? '<button type="button" class="lnk-x" id="sjDiCanc">' + esc(t('di_cancelar')) + '</button>' : '') + '</div></form>';
      if (D.diario.length) {
        h += '<div class="sj-di-filtros"><div class="bib-chips"><button type="button" class="chip" data-ftipo="" aria-pressed="' + (!filtro) + '">' + esc(t('di_todos')) + ' <small>' + D.diario.length + '</small></button>' +
          TIPOS.filter(function (k) { return cont[k]; }).map(function (k) { return '<button type="button" class="chip" data-ftipo="' + k + '" aria-pressed="' + (filtro === k) + '">' + esc(t('t_' + k)) + ' <small>' + cont[k] + '</small></button>'; }).join('') +
          '</div><input type="search" id="sjBusca" class="sj-busca" placeholder="' + esc(t('di_busca')) + '" value="' + esc(busca) + '" aria-label="' + esc(t('di_busca')) + '"></div>';
        if (!lista.length) h += '<p class="sj-mudo">' + esc(t('di_nada')) + '</p>';
        var ultData = '';
        h += '<div class="sj-linha-tempo">';
        lista.forEach(function (r) {
          if (r.data !== ultData) {
            if (ultData) h += '</ul>';
            ultData = r.data;
            var nd = diaDeIso(r.data);
            h += '<h5 class="sj-dt"><span>' + esc(fmtIso(r.data, true)) + '</span>' + (nd >= 1 && nd <= e.dias ? '<b>' + esc(rotDia(nd)) + '</b>' : '') + '</h5><ul class="sj-regs">';
          }
          h += itemDiario(r);
        });
        if (ultData) h += '</ul>';
        h += '</div>';
      } else h += '<p class="sj-mudo">' + esc(t('di_vazio')) + '</p>';
      h += '</section>';

      // devocionais + preferências
      h += '<div class="sj-cols"><section class="conta-card"><h3>' + esc(t('dev_h')) + '</h3>' + (D.devocionais.length ? '<ul class="sj-devs">' + D.devocionais.map(function (d) {
        return '<li><div><b>' + esc(d.titulo) + '</b>' + (d.resumo ? '<p>' + esc(d.resumo) + '</p>' : '') + '<small>' + esc(t('dev_de').replace('{d}', fmtIso(d.liberar_em))) + '</small></div><a class="btn btn-creme sm" href="' + esc(d.pdf_url) + '" target="_blank" rel="noopener">' + esc(t('dev_abrir')) + ' ↗</a></li>';
      }).join('') + '</ul>' : '<p>' + esc(t('dev_vazio')) + '</p>') + '</section>';
      h += '<section class="conta-card"><h3>' + esc(t('cfg_h')) + '</h3><p>' + esc(D.devocionais_email ? t('dev_email_on') : t('dev_email_off')) + (D.devocionais_email && D.email ? '<br><small>' + esc(D.email) + '</small>' : '') + (D.devocionais_email && !D.email_servico ? '<br><small>' + esc(t('dev_email_srv')) + '</small>' : '') + '</p>' +
        '<button type="button" class="btn btn-ghost sm" id="sjDevEmail">' + esc(D.devocionais_email ? t('desligar') : t('ligar')) + '</button>' +
        '<p style="margin-top:22px">' + t('priv') + ' · <a href="/spirit-immersion.html">' + esc(t('sobre')) + '</a></p>' +
        '<p>' + esc(t('sair_p')) + '</p><button type="button" class="btn btn-ghost sm" id="sjSair">' + esc(t('sair')) + '</button></section></div></div>';

      alvo.innerHTML = h;
      ligar();
    }

    function irDiario(data) {
      if (data) rasc.data = data;
      desenhar();
      var f = document.getElementById('sjDiario');
      if (f) { f.scrollIntoView({ behavior: 'smooth', block: 'start' }); var ta = f.querySelector('textarea'); if (ta) setTimeout(function () { ta.focus({ preventScroll: true }); }, 400); }
    }

    function ligar() {
      var hoje = D.edicao.dia_atual;
      var bh = document.getElementById('sjHoje');
      if (bh) bh.onclick = function () { bh.disabled = true; salvarDia(hoje, true).catch(function (er) { alert(er.message); bh.disabled = false; }); };
      alvo.querySelectorAll('[data-dia]').forEach(function (b) {
        b.onclick = function () {
          aberto = +b.getAttribute('data-dia'); msg = ''; desenhar();
          var f = document.getElementById('sjEd'); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        };
      });
      alvo.querySelectorAll('[data-irdiario]').forEach(function (a) { a.onclick = function (ev) { ev.preventDefault(); irDiario(a.getAttribute('data-irdiario')); }; });
      var f = document.getElementById('sjEd');
      if (f) f.onsubmit = function (ev) { ev.preventDefault(); var n = aberto; salvarDia(n, f.orou.checked).then(function () { aberto = null; desenhar(); }).catch(function (er) { alert(er.message); }); };
      var fc = document.getElementById('sjFechar'); if (fc) fc.onclick = function () { aberto = null; desenhar(); };

      // diário: o rascunho acompanha o que a pessoa digita
      var fd = document.getElementById('sjDi');
      if (fd) {
        var guardar = function () {
          rasc.data = fd.data.value; rasc.referencia = fd.referencia.value; rasc.texto = fd.texto.value; rasc.autorizacao = fd.autorizacao.value;
          var tp = fd.querySelector('input[name="tipo"]:checked'); rasc.tipo = tp ? tp.value : 'testemunho';
        };
        fd.addEventListener('input', guardar); fd.addEventListener('change', guardar);
        fd.onsubmit = function (ev) {
          ev.preventDefault(); guardar();
          var btn = fd.querySelector('button[type="submit"]'); btn.disabled = true;
          L.api('/conta/spirit/diario' + (rasc.id ? '/' + rasc.id : ''), 'POST', { data: rasc.data, tipo: rasc.tipo, referencia: rasc.referencia, texto: rasc.texto, autorizacao: rasc.autorizacao }).then(function () {
            msg = t('di_salvo'); var tp = rasc.tipo; rasc = vazio(D.edicao.hoje); rasc.tipo = tp;
            return carregar();
          }).then(function () { var s = document.getElementById('sjDiario'); if (s) s.scrollIntoView({ block: 'start' }); }).catch(function (er) { alert(er.message); btn.disabled = false; });
        };
      }
      var cc = document.getElementById('sjDiCanc');
      if (cc) cc.onclick = function () { rasc = vazio(D.edicao.hoje); desenhar(); };
      alvo.querySelectorAll('[data-editreg]').forEach(function (b) {
        b.onclick = function () {
          var r = D.diario.filter(function (x) { return x.id === +b.getAttribute('data-editreg'); })[0];
          if (!r) return;
          rasc = { id: r.id, data: r.data, tipo: r.tipo, referencia: r.referencia || '', texto: r.texto, autorizacao: r.autorizacao };
          aberto = null; irDiario();
        };
      });
      alvo.querySelectorAll('[data-delreg]').forEach(function (b) {
        b.onclick = function () {
          if (!confirm(t('di_apagar_conf'))) return;
          var id = +b.getAttribute('data-delreg');
          L.api('/conta/spirit/diario/' + id, 'DELETE').then(function () { if (rasc.id === id) rasc = vazio(D.edicao.hoje); return carregar(); }).catch(function (er) { alert(er.message); });
        };
      });
      alvo.querySelectorAll('[data-ftipo]').forEach(function (b) { b.onclick = function () { filtro = b.getAttribute('data-ftipo'); desenhar(); }; });
      var bs = document.getElementById('sjBusca');
      if (bs) bs.oninput = function () {
        busca = bs.value; var pos = bs.selectionStart; desenhar();
        var nb = document.getElementById('sjBusca'); if (nb) { nb.focus(); try { nb.setSelectionRange(pos, pos); } catch (e) {} }
      };

      document.getElementById('sjDevEmail').onclick = function () { L.api('/conta/spirit/devocionais', 'POST', { receber: !D.devocionais_email }).then(carregar).catch(function (er) { alert(er.message); }); };
      var sa = document.getElementById('sjSair');
      sa.onclick = function () {
        if (!sa.dataset.conf) { sa.dataset.conf = '1'; sa.textContent = t('sair_conf'); sa.classList.remove('btn-ghost'); sa.classList.add('btn-cobre'); return; }
        L.api('/conta/spirit/sair', 'POST').then(function () { if (opcoes && opcoes.aoSair) opcoes.aoSair(); }).catch(function (er) { alert(er.message); });
      };
    }

    if (D) desenhar(); else { alvo.innerHTML = '<p class="conta-carregando">…</p>'; carregar(); }
  }

  window.PV_SPIRIT = { tela: tela };
})();
