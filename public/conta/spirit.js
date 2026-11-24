/* The Prophetic Voices — aba "Spirit Immersion" da conta (/conta.html#spirit).
   Ciclo 2027: PREPARAÇÃO de 31 dias em dezembro (quatro jornadas: 15, 30, 45 min e 1 h) e, depois do aceite,
   a JORNADA de 100 dias (1 h por dia, de 1º/01 a 10/04). As duas ficam no histórico da pessoa.
   Também: DIÁRIO (testemunhos, impressões proféticas, o que ouviu de Deus, texto lido, orações) e devocionais em PDF.
   API em /api/conta/spirit (worker/spirit.js). */
(function () {
  var T = {
    pt: {
      e_antes: 'A preparação começa em', e_antes_1: 'A preparação começa amanhã', dias: 'dias',
      e_prep: 'Preparação · dia {d} de {t}', e_jornada: 'Dia {d} de {t}', e_espera: 'Os 100 dias começam em 1º de janeiro', e_aberta: 'Os 100 dias começaram', e_fim: 'Jornada encerrada',
      bloco: '{n}ª jornada · {m} por dia', bloco_c: '{n}ª jornada · {m}', min: '{m} minutos', hora: '1 hora',
      orados: 'dias orados', horas: 'horas de oração', seq: 'dias seguidos', reg: 'registros no diário',
      q_prep: 'Hoje é o dia {d} da preparação. Você completou os seus {m} de oração?', sim_prep: 'Sim, orei {m} hoje ✓',
      q_jor: 'Hoje é o dia {d}. Você completou a sua hora de oração?', sim_jor: 'Sim, orei 1 hora hoje ✓', hoje_ok: 'Hoje está marcado. Glória a Deus!', hoje_dia: 'Escrever no diário',
      antes_p: 'De 1º a 31 de dezembro: 31 dias de preparação em quatro jornadas, com tempo crescente de oração em línguas (15 minutos, 30, 45 e 1 hora por dia). Ao fim, você aceita os 100 dias, de 1º de janeiro a 10 de abril. O diário já está aberto.',
      espera_p: 'Você aceitou os 100 dias. Eles se abrem em 1º de janeiro: 1 hora por dia orando em línguas, até 10 de abril.',
      fim_p: 'Obrigado por perseverar. O seu histórico da preparação, dos 100 dias e o diário continuam aqui.',
      conv_e: 'Convite · 100 dias', conv_h: 'A preparação está chegando ao fim.', conv_h2: 'Os 100 dias começaram.',
      conv_p: 'De 1º de janeiro a 10 de abril de 2027: 1 hora por dia orando em línguas. Você quer fazer parte dos 100 dias?', conv_b: 'Sim, quero fazer parte dos 100 dias', conv_ok: 'Você entrou nos 100 dias. A nova jornada começa em 1º de janeiro.', conv_ok2: 'Você entrou nos 100 dias. Bem-vindo à jornada!',
      prep_h: 'Preparação · 31 dias', prep_hist: 'Histórico · Preparação · 31 dias', prep_p: 'Toque em um dia para marcar a oração. Você pode completar dias anteriores.',
      prep_antes: 'A preparação começa em 1º de dezembro: a partir daí, toque em cada dia para marcar que orou. Até lá, use o diário.',
      jor_h: 'Jornada · 100 dias', jor_p: 'Toque em um dia para marcar a oração. Você pode completar dias anteriores.',
      leg_orou: 'orou', leg_tes: 'com registro no diário', leg_hoje: 'hoje', leg_vazio: 'não marcado',
      dia_prep: 'Preparação · dia {d}', dia_jor: 'Dia {d}', orei_prep: 'Completei os {m} de oração neste dia', orei_jor: 'Completei 1 hora de oração neste dia',
      salvar_dia: 'Salvar', salvo_dia: 'Dia salvo.', fechar: 'Fechar',
      dia_reg: 'Diário de Oração deste dia', dia_escrever: 'Escrever no Diário de Oração deste dia', dia_vazio: 'Nenhum registro no Diário de Oração neste dia.', dia_tes: 'Testemunhos deste dia', dia_tes_escrever: 'Escrever um testemunho deste dia',
      di_h: 'Diário de Oração', di_p: 'Registre como estão sendo os seus dias de oração: as impressões proféticas, o que você ouviu de Deus, a leitura diária, as suas orações. Volte aqui sempre que quiser reler a sua caminhada.', di_priv: 'O Diário de Oração é só seu: ninguém mais tem acesso a ele, nem a equipe do ministério.',
      di_novo: 'Novo registro', di_editando: 'Editando registro', di_data: 'Data', di_tipo: 'Tipo', di_ref: 'Texto bíblico ou referência (opcional)', di_ref_ph: 'Ex.: Salmo 27; Zacarias 12.10',
      di_texto: 'O que você quer registrar?', di_ph: 'O que Deus falou, fez ou mostrou? Uma palavra, uma impressão, um versículo, uma mudança…',
      di_aut: 'Quem pode ler?', aut_privado: 'Só eu', aut_equipe: 'Só a equipe do ministério', aut_anonimo: 'Pode ser publicado sem me identificar', aut_nome: 'Pode ser publicado com o meu nome',
      di_aut_nota: 'O diário é seu: “só eu” é o padrão. Se você liberar um registro, a equipe lê com cuidado e oração, e nada é publicado fora da autorização marcada. Você pode mudar quando quiser.',
      di_salvar: 'Salvar no diário', di_salvo: 'Registro salvo no diário.', di_cancelar: 'Cancelar edição', di_editar: 'Editar', di_apagar: 'Apagar', di_apagar_conf: 'Apagar este registro do diário?',
      di_todos: 'Todos', di_busca: 'Buscar no diário', di_vazio: 'Seu diário ainda está em branco. O primeiro registro pode ser hoje.', di_nada: 'Nenhum registro encontrado.',
      t_testemunho: 'Testemunho', t_profetica: 'Impressão profética', t_ouvi: 'O que ouvi de Deus', t_texto: 'Leitura diária', t_oracao: 'Oração', t_outro: 'Outra anotação',
      te_h: 'Testemunhos', te_p: 'Conte o que Deus tem feito durante esta jornada. Diferente do Diário de Oração, o testemunho é para ser compartilhado: você escolhe quem pode lê-lo.', te_novo: 'Novo testemunho', te_editando: 'Editando testemunho', te_texto: 'Seu testemunho', te_ph: 'O que Deus fez? Uma cura, uma resposta, uma mudança, um encontro…', te_salvar: 'Salvar testemunho', te_salvo: 'Testemunho salvo.', te_vazio: 'Você ainda não escreveu nenhum testemunho.', te_apagar_conf: 'Apagar este testemunho?', te_aut_nota: 'A equipe lê os testemunhos com cuidado e oração. Nada é publicado fora da autorização marcada, e você pode mudá-la ou apagar o testemunho quando quiser.',
      dev_h: 'Devocionais', dev_vazio: 'Os devocionais aparecem aqui assim que forem liberados.', dev_abrir: 'Abrir PDF', dev_de: 'Liberado em {d}',
      cfg_h: 'Preferências', dev_email_on: 'Você recebe os devocionais também no e-mail', dev_email_off: 'Você não recebe os devocionais por e-mail (eles continuam aqui)', dev_email_srv: 'Os e-mails ainda estão sendo ligados; enquanto isso, os devocionais ficam aqui.',
      ligar: 'Receber por e-mail', desligar: 'Parar de receber', sair_p: 'Sair do Spirit Immersion apaga a sua inscrição, os dias marcados (preparação e 100 dias) e todo o seu diário desta edição.', sair: 'Sair e apagar meu registro', sair_conf: 'Confirmar: sair e apagar',
      priv: 'Seu registro é pessoal: só você vê os dias marcados e o diário que não liberar. <a href="/privacidade.html#spirit">Como cuidamos dos seus dados</a>.', sobre: 'Sobre o movimento'
    },
    en: {
      e_antes: 'Preparation begins in', e_antes_1: 'Preparation begins tomorrow', dias: 'days',
      e_prep: 'Preparation · day {d} of {t}', e_jornada: 'Day {d} of {t}', e_espera: 'The 100 days begin on January 1', e_aberta: 'The 100 days have begun', e_fim: 'Journey completed',
      bloco: 'Journey {n} · {m} a day', bloco_c: 'Journey {n} · {m}', min: '{m} minutes', hora: '1 hour',
      orados: 'days prayed', horas: 'hours of prayer', seq: 'days in a row', reg: 'journal entries',
      q_prep: 'Today is day {d} of the preparation. Did you complete your {m} of prayer?', sim_prep: 'Yes, I prayed {m} today ✓',
      q_jor: 'Today is day {d}. Did you complete your hour of prayer?', sim_jor: 'Yes, I prayed 1 hour today ✓', hoje_ok: 'Today is marked. Glory to God!', hoje_dia: 'Write in the journal',
      antes_p: 'From December 1 to 31: 31 days of preparation in four journeys, with increasing time praying in tongues (15 minutes, 30, 45 and 1 hour a day). At the end you accept the 100 days, from January 1 to April 10. The journal is already open.',
      espera_p: 'You accepted the 100 days. They open on January 1: 1 hour a day praying in tongues, until April 10.',
      fim_p: 'Thank you for persevering. Your record of the preparation, the 100 days and your journal stay here.',
      conv_e: 'Invitation · 100 days', conv_h: 'The preparation is coming to an end.', conv_h2: 'The 100 days have begun.',
      conv_p: 'From January 1 to April 10, 2027: 1 hour a day praying in tongues. Do you want to be part of the 100 days?', conv_b: 'Yes, I want to join the 100 days', conv_ok: 'You joined the 100 days. The new journey begins on January 1.', conv_ok2: 'You joined the 100 days. Welcome to the journey!',
      prep_h: 'Preparation · 31 days', prep_hist: 'Record · Preparation · 31 days', prep_p: 'Tap a day to mark your prayer. You can fill in earlier days.',
      prep_antes: 'Preparation begins on December 1: from then on, tap each day to mark that you prayed. Until then, use the journal.',
      jor_h: 'Journey · 100 days', jor_p: 'Tap a day to mark your prayer. You can fill in earlier days.',
      leg_orou: 'prayed', leg_tes: 'with journal entry', leg_hoje: 'today', leg_vazio: 'not marked',
      dia_prep: 'Preparation · day {d}', dia_jor: 'Day {d}', orei_prep: 'I completed {m} of prayer on this day', orei_jor: 'I completed 1 hour of prayer on this day',
      salvar_dia: 'Save', salvo_dia: 'Day saved.', fechar: 'Close',
      dia_reg: 'Prayer Journal for this day', dia_escrever: 'Write in the Prayer Journal for this day', dia_vazio: 'No Prayer Journal entries on this day.', dia_tes: 'Testimonies for this day', dia_tes_escrever: 'Write a testimony for this day',
      di_h: 'Prayer Journal', di_p: 'Record how your days of prayer are going: prophetic impressions, what you heard from God, your daily reading, your prayers. Come back whenever you want to reread your journey.', di_priv: 'The Prayer Journal is yours alone: nobody else can see it, not even the ministry team.',
      di_novo: 'New entry', di_editando: 'Editing entry', di_data: 'Date', di_tipo: 'Type', di_ref: 'Bible passage or reference (optional)', di_ref_ph: 'E.g.: Psalm 27; Zechariah 12:10',
      di_texto: 'What do you want to record?', di_ph: 'What did God say, do or show you? A word, an impression, a verse, a change…',
      di_aut: 'Who may read it?', aut_privado: 'Only me', aut_equipe: 'Only the ministry team', aut_anonimo: 'It may be published without identifying me', aut_nome: 'It may be published with my name',
      di_aut_nota: 'The journal is yours: “only me” is the default. If you share an entry, the team reads it with care and prayer, and nothing is published beyond the permission you choose. You can change it anytime.',
      di_salvar: 'Save to journal', di_salvo: 'Entry saved to your journal.', di_cancelar: 'Cancel editing', di_editar: 'Edit', di_apagar: 'Delete', di_apagar_conf: 'Delete this journal entry?',
      di_todos: 'All', di_busca: 'Search the journal', di_vazio: 'Your journal is still blank. The first entry can be today.', di_nada: 'No entries found.',
      t_testemunho: 'Testimony', t_profetica: 'Prophetic impression', t_ouvi: 'What I heard from God', t_texto: 'Daily reading', t_oracao: 'Prayer', t_outro: 'Other note',
      te_h: 'Testimonies', te_p: 'Tell what God has been doing during this journey. Unlike the Prayer Journal, a testimony is meant to be shared: you choose who may read it.', te_novo: 'New testimony', te_editando: 'Editing testimony', te_texto: 'Your testimony', te_ph: 'What did God do? A healing, an answer, a change, an encounter…', te_salvar: 'Save testimony', te_salvo: 'Testimony saved.', te_vazio: 'You have not written any testimony yet.', te_apagar_conf: 'Delete this testimony?', te_aut_nota: 'The team reads testimonies with care and prayer. Nothing is published beyond the permission you choose, and you can change it or delete the testimony anytime.',
      dev_h: 'Devotionals', dev_vazio: 'Devotionals appear here as soon as they are released.', dev_abrir: 'Open PDF', dev_de: 'Released on {d}',
      cfg_h: 'Preferences', dev_email_on: 'You also receive the devotionals by e-mail', dev_email_off: 'You do not receive the devotionals by e-mail (they stay here)', dev_email_srv: 'E-mails are still being set up; meanwhile, the devotionals stay here.',
      ligar: 'Receive by e-mail', desligar: 'Stop receiving', sair_p: 'Leaving the Spirit Immersion erases your enrollment, the days you marked (preparation and 100 days) and your whole journal for this edition.', sair: 'Leave and erase my record', sair_conf: 'Confirm: leave and erase',
      priv: 'Your record is personal: only you see the days you marked and the journal entries you do not share. <a href="/privacidade.html#spirit">How we care for your data</a>.', sobre: 'About the movement'
    }
  };
  // Diário de Oração: sempre privado (só a pessoa vê). Testemunhos: área à parte, com autorização.
  var TIPOS = ['profetica', 'ouvi', 'texto', 'oracao', 'outro'];
  var AUTS = ['equipe', 'anonimo', 'nome'];
  var vazio = function (data) { return { id: 0, data: data || '', tipo: 'profetica', referencia: '', texto: '' }; };
  var vazioT = function (data) { return { id: 0, data: data || '', texto: '', autorizacao: 'equipe' }; };

  // rascunho do diário sobrevive às re-renderizações (troca de idioma, salvar um dia etc.)
  var rasc = vazio(), rascT = vazioT(), filtro = '', busca = '';

  function tela(alvo, opcoes) {
    var L = window.PV_LOGIN, esc = L.esc;
    var t = function (k) { var l = L.lingua(); return (T[l] && T[l][k]) || T.pt[k] || k; };
    var D = null, aberto = null, msg = ''; // aberto = { c: 'prep' | 'jor', n }

    var en = function () { return L.lingua() === 'en'; };
    var C = function (c) { return c === 'prep' ? D.edicao.prep : D.edicao; };
    var dataDia = function (c, n) { return new Date(Date.parse(C(c).inicio + 'T12:00:00Z') + (n - 1) * 864e5); };
    var isoDia = function (c, n) { return dataDia(c, n).toISOString().slice(0, 10); };
    var diaDeIso = function (c, iso) { return Math.round((Date.parse(iso + 'T12:00:00Z') - Date.parse(C(c).inicio + 'T12:00:00Z')) / 864e5) + 1; };
    var fmtData = function (d, longo) { return d.toLocaleDateString(en() ? 'en-US' : 'pt-BR', longo ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' } : { day: 'numeric', month: 'short' }); };
    var fmtIso = function (iso, longo) { return fmtData(new Date(iso + 'T12:00:00Z'), longo); };
    var mapa = function (lista) { var m = {}; lista.forEach(function (x) { m[x.dia] = x; }); return m; };
    var diario = function () { return D.diario.filter(function (x) { return x.tipo !== 'testemunho'; }); };
    var testemunhos = function () { return D.diario.filter(function (x) { return x.tipo === 'testemunho'; }); };
    var porData = function () { var m = {}; D.diario.forEach(function (x) { (m[x.data] = m[x.data] || []).push(x); }); return m; };
    var ult = function (c) { return Math.min(Math.max(c.dia_atual, 0), c.dias); };
    var blocoDe = function (n) { return D.edicao.prep.blocos.filter(function (b) { return n >= b.de && n <= b.ate; })[0]; };
    var tempo = function (minutos) { return minutos >= 60 ? t('hora') : t('min').replace('{m}', minutos); };
    var rotIso = function (iso) {
      var np = diaDeIso('prep', iso), nj = diaDeIso('jor', iso);
      if (np >= 1 && np <= D.edicao.prep.dias) return t('dia_prep').replace('{d}', np);
      if (nj >= 1 && nj <= D.edicao.dias) return t('dia_jor').replace('{d}', nj);
      return '';
    };
    var seqDe = function (m, u) { var s = 0; for (var k = (m[u] && m[u].orou) ? u : u - 1; k >= 1 && m[k] && m[k].orou; k--) s++; return s; };

    function carregar() { return L.api('/conta/spirit').then(function (d) { D = d; if (!rasc.data) rasc.data = d.edicao.hoje; if (!rascT.data) rascT.data = d.edicao.hoje; desenhar(); }).catch(function (er) { alvo.innerHTML = '<p class="conta-erro">' + esc(er.message) + '</p>'; }); }

    function salvarDia(c, n, orou) {
      return L.api('/conta/spirit/dia', 'POST', { ciclo: c === 'prep' ? 'prep' : 'jornada', dia: n, orou: orou }).then(function () { msg = t('salvo_dia'); return carregar(); });
    }

    function itemDiario(x) {
      return '<li class="sj-reg"><div class="sj-reg-top"><span class="sj-tipo sj-t-' + esc(x.tipo) + '">' + esc(t('t_' + x.tipo)) + '</span>' +
        (x.referencia ? '<span class="sj-ref">' + esc(x.referencia) + '</span>' : '') + '</div>' +
        '<p class="sj-reg-txt">' + esc(x.texto) + '</p>' +
        '<div class="sj-reg-pe"><small></small><span><button type="button" class="lnk-x" data-editreg="' + x.id + '">' + esc(t('di_editar')) + '</button> <button type="button" class="lnk-x" data-delreg="' + x.id + '">' + esc(t('di_apagar')) + '</button></span></div></li>';
    }
    function itemTes(x, comData) {
      return '<li class="sj-reg"><div class="sj-reg-top"><span class="sj-tipo sj-t-testemunho">' + esc(t('t_testemunho')) + '</span>' + (comData ? '<span class="sj-ref">' + esc(fmtIso(x.data, true)) + (rotIso(x.data) ? ' · ' + esc(rotIso(x.data)) : '') + '</span>' : '') + '</div>' +
        '<p class="sj-reg-txt">' + esc(x.texto) + '</p>' +
        '<div class="sj-reg-pe"><small>' + esc(t('aut_' + (x.autorizacao === 'privado' ? 'equipe' : x.autorizacao))) + '</small><span><button type="button" class="lnk-x" data-edittes="' + x.id + '">' + esc(t('di_editar')) + '</button> <button type="button" class="lnk-x" data-deltes="' + x.id + '">' + esc(t('di_apagar')) + '</button></span></div></li>';
    }

    // uma célula da grade
    function celula(c, n, m, pd) {
      var cc = C(c), u = ult(cc), x = m[n], cls = n > u ? 'fut' : x && x.orou ? 'orou' : 'vazio';
      if (n === cc.dia_atual) cls += ' hoje';
      if (pd[isoDia(c, n)]) cls += ' tes';
      if (aberto && aberto.c === c && aberto.n === n) cls += ' sel';
      var rot = (c === 'prep' ? t('dia_prep') : t('dia_jor')).replace('{d}', n) + ' · ' + fmtData(dataDia(c, n));
      return '<button type="button" class="sj-d ' + cls + '" data-dia="' + n + '" data-ciclo="' + c + '"' + (n > u ? ' disabled' : '') + ' title="' + esc(fmtData(dataDia(c, n))) + '" aria-label="' + esc(rot) + '"><span>' + n + '</span></button>';
    }

    // editor do dia aberto (dentro do cartão do ciclo)
    function editor(c, m, pd) {
      if (!aberto || aberto.c !== c) return '';
      var n = aberto.n, y = m[n] || { orou: 0 }, todos = pd[isoDia(c, n)] || [];
      var regs = todos.filter(function (x) { return x.tipo !== 'testemunho'; }), tes = todos.filter(function (x) { return x.tipo === 'testemunho'; });
      var tit = (c === 'prep' ? t('dia_prep') : t('dia_jor')).replace('{d}', n) + ' · ' + fmtData(dataDia(c, n), true);
      var orei = c === 'prep' ? t('orei_prep').replace('{m}', tempo(blocoDe(n).minutos)) : t('orei_jor');
      return '<form class="sj-ed" id="sjEd"><h4>' + esc(tit) + '</h4>' +
        '<label class="si-check"><input type="checkbox" name="orou"' + (y.orou ? ' checked' : '') + '><span>' + esc(orei) + '</span></label>' +
        '<div class="conta-perigo"><button class="btn btn-creme sm" type="submit">' + esc(t('salvar_dia')) + '</button><button type="button" class="lnk-x" id="sjFechar">' + esc(t('fechar')) + '</button></div>' +
        '<h5>' + esc(t('dia_reg')) + '</h5>' + (regs.length ? '<ul class="sj-regs">' + regs.map(itemDiario).join('') + '</ul>' : '<p class="sj-mudo">' + esc(t('dia_vazio')) + '</p>') +
        '<a class="btn btn-ghost sm" href="#sjDiario" data-irdiario="' + isoDia(c, n) + '">' + esc(t('dia_escrever')) + '</a>' +
        (tes.length ? '<h5>' + esc(t('dia_tes')) + '</h5><ul class="sj-regs">' + tes.map(function (x) { return itemTes(x); }).join('') + '</ul>' : '') +
        '<a class="btn btn-ghost sm" href="#sjTes" data-irtes="' + isoDia(c, n) + '">' + esc(t('dia_tes_escrever')) + '</a></form>';
    }

    var legenda = function () { return '<div class="sj-leg"><span><i class="orou"></i>' + esc(t('leg_orou')) + '</span><span><i class="tes"></i>' + esc(t('leg_tes')) + '</span><span><i class="hoje"></i>' + esc(t('leg_hoje')) + '</span><span><i></i>' + esc(t('leg_vazio')) + '</span></div>'; };

    function cartaoPrep(mp, pd) {
      var e = D.edicao, p = e.prep, hist = e.etapa === 'jornada' || e.etapa === 'fim';
      var h = '<section class="conta-card sj-cal-card' + (hist ? ' sj-hist' : '') + '" id="sjPrep"><h3>' + esc(hist ? t('prep_hist') : t('prep_h')) + '</h3>' +
        '<p' + (e.etapa === 'antes' ? ' class="sj-aviso"' : '') + '>' + esc(e.etapa === 'antes' ? t('prep_antes') : t('prep_p')) + '</p><div class="sj-blocos">';
      p.blocos.forEach(function (b) {
        var ativo = p.fase === 'durante' && p.dia_atual >= b.de && p.dia_atual <= b.ate;
        h += '<div class="sj-bloco' + (ativo ? ' ativo' : '') + '"><div class="sj-bloco-t"><b>' + esc(t('bloco_c').replace('{n}', b.n).replace('{m}', b.minutos >= 60 ? '1 h' : b.minutos + ' min')) + '</b><small>' + esc(fmtData(dataDia('prep', b.de)) + ' – ' + fmtData(dataDia('prep', b.ate))) + '</small></div><div class="sj-cal sj-cal-p">';
        for (var n = b.de; n <= b.ate; n++) h += celula('prep', n, mp, pd);
        h += '</div></div>';
      });
      return h + '</div>' + legenda() + editor('prep', mp, pd) + '</section>';
    }

    function cartaoJornada(mj, pd) {
      var h = '<section class="conta-card sj-cal-card" id="sjJor"><h3>' + esc(t('jor_h')) + '</h3><p>' + esc(t('jor_p')) + '</p><div class="sj-cal">';
      for (var n = 1; n <= D.edicao.dias; n++) h += celula('jor', n, mj, pd);
      return h + '</div>' + legenda() + editor('jor', mj, pd) + '</section>';
    }

    function desenhar() {
      var e = D.edicao, p = e.prep, mp = mapa(D.dias_prep), mj = mapa(D.dias), pd = porData();
      var oradosP = D.dias_prep.filter(function (x) { return x.orou; }), oradosJ = D.dias.filter(function (x) { return x.orou; }).length;
      var minutos = oradosP.reduce(function (s, x) { return s + blocoDe(x.dia).minutos; }, 0) + 60 * oradosJ;
      var horas = (Math.round(minutos / 6) / 10).toLocaleString(en() ? 'en-US' : 'pt-BR');
      var naJor = D.na_jornada, emJornada = e.etapa === 'jornada' && naJor;
      var cicloAtual = emJornada ? 'jor' : 'prep';
      var cc = C(cicloAtual), u = ult(cc);
      var seq = emJornada ? seqDe(mj, u) : (e.etapa === 'preparacao' ? seqDe(mp, u) : 0);
      var anelPct = e.etapa === 'antes' ? 0 : emJornada || e.etapa === 'fim' ? Math.round(100 * ult(e) / e.dias) : Math.round(100 * ult(p) / p.dias);
      var anelN = e.etapa === 'antes' ? '00' : emJornada || e.etapa === 'fim' ? String(ult(e)).padStart(2, '0') : String(ult(p)).padStart(2, '0');
      var anelT = emJornada || e.etapa === 'fim' ? e.dias : p.dias;
      var titulo, sub = '', corpo = '';
      if (e.etapa === 'antes') {
        titulo = 1 - p.dia_atual === 1 ? t('e_antes_1') : t('e_antes') + ' <b>' + (1 - p.dia_atual) + '</b> ' + t('dias');
        corpo = '<p class="sj-q">' + esc(t('antes_p')) + '</p><a class="btn btn-creme sm" href="#sjDiario" data-irdiario="' + e.hoje + '">' + esc(t('hoje_dia')) + '</a>';
      } else if (e.etapa === 'preparacao') {
        var b = blocoDe(p.dia_atual), tm = tempo(b.minutos);
        titulo = t('e_prep').replace('{d}', '<b>' + p.dia_atual + '</b>').replace('{t}', p.dias);
        sub = t('bloco').replace('{n}', b.n).replace('{m}', tm);
        corpo = mp[p.dia_atual] && mp[p.dia_atual].orou
          ? '<p class="sj-ok">' + esc(t('hoje_ok')) + '</p><a class="btn btn-ghost sm" href="#sjDiario" data-irdiario="' + e.hoje + '">' + esc(t('hoje_dia')) + '</a>'
          : '<p class="sj-q">' + esc(t('q_prep').replace('{d}', p.dia_atual).replace('{m}', tm)) + '</p><div class="conta-perigo"><button type="button" class="btn btn-creme" id="sjHoje" data-ciclo="prep">' + esc(t('sim_prep').replace('{m}', tm)) + '</button><a class="btn btn-ghost sm" href="#sjDiario" data-irdiario="' + e.hoje + '">' + esc(t('hoje_dia')) + '</a></div>';
        if (naJor) corpo += '<p class="sj-mudo" style="margin-top:14px">' + esc(t('espera_p')) + '</p>';
      } else if (e.etapa === 'jornada') {
        if (naJor) {
          titulo = t('e_jornada').replace('{d}', '<b>' + e.dia_atual + '</b>').replace('{t}', e.dias);
          corpo = mj[e.dia_atual] && mj[e.dia_atual].orou
            ? '<p class="sj-ok">' + esc(t('hoje_ok')) + '</p><a class="btn btn-ghost sm" href="#sjDiario" data-irdiario="' + e.hoje + '">' + esc(t('hoje_dia')) + '</a>'
            : '<p class="sj-q">' + esc(t('q_jor').replace('{d}', e.dia_atual)) + '</p><div class="conta-perigo"><button type="button" class="btn btn-creme" id="sjHoje" data-ciclo="jor">' + esc(t('sim_jor')) + '</button><a class="btn btn-ghost sm" href="#sjDiario" data-irdiario="' + e.hoje + '">' + esc(t('hoje_dia')) + '</a></div>';
        } else titulo = t('e_aberta');
      } else { titulo = t('e_fim'); corpo = '<p class="sj-q">' + esc(t('fim_p')) + '</p>'; }

      var h = '<div class="sj">';
      h += '<section class="sj-hud"><span class="si-c tl"></span><span class="si-c br"></span>' +
        '<div class="sj-anel"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" class="g-bg" pathLength="100"/><circle cx="60" cy="60" r="52" class="g-v" pathLength="100" style="stroke-dasharray:' + anelPct + ' 100"/></svg>' +
        '<div><small>SI · ' + esc(e.id) + '</small><b>' + anelN + '</b><small>/ ' + anelT + '</small></div></div>' +
        '<div class="sj-hud-txt">' + (sub ? '<div class="sj-sub">' + esc(sub) + '</div>' : '') + '<h2>' + titulo + '</h2>' +
        '<div class="sj-kpis"><div><b>' + (oradosP.length + oradosJ) + '</b><span>' + esc(t('orados')) + '</span></div><div><b>' + horas + 'h</b><span>' + esc(t('horas')) + '</span></div><div><b>' + seq + '</b><span>' + esc(t('seq')) + '</span></div><div><b>' + diario().length + '</b><span>' + esc(t('reg')) + '</span></div></div>' +
        corpo;
      if (e.etapa !== 'antes' && u) {
        var marcados = cicloAtual === 'jor' ? oradosJ : oradosP.length, pct = Math.round(100 * marcados / u);
        if (e.etapa !== 'fim' && (emJornada || e.etapa === 'preparacao')) h += '<div class="sj-barra" aria-hidden="true"><i style="width:' + pct + '%"></i></div><small class="sj-pct">' + pct + '% · ' + marcados + '/' + u + '</small>';
      }
      h += '</div></section>';
      if (msg) h += '<p class="conta-ok" role="status">' + esc(msg) + '</p>';

      // convite para os 100 dias
      if (D.pode_aceitar) {
        h += '<section class="sj-convite"><span class="si-c tl"></span><span class="si-c br"></span><div class="eyebrow">' + esc(t('conv_e')) + '</div><h2>' + esc(e.etapa === 'jornada' ? t('conv_h2') : t('conv_h')) + '</h2><p>' + esc(t('conv_p')) + '</p>' +
          '<button type="button" class="btn btn-creme" id="sjAceitar">' + esc(t('conv_b')) + '</button></section>';
      }

      // grades: na jornada, os 100 dias primeiro e a preparação como histórico; antes disso, só a preparação
      if (emJornada || (e.etapa === 'fim' && naJor)) h += cartaoJornada(mj, pd);
      if (D.na_preparacao) h += cartaoPrep(mp, pd);

      // diário
      var DI = diario(), TE = testemunhos();
      var cont = {}; DI.forEach(function (r) { cont[r.tipo] = (cont[r.tipo] || 0) + 1; });
      var q = busca.trim().toLowerCase();
      var lista = DI.filter(function (r) { return (!filtro || r.tipo === filtro) && (!q || (r.texto + ' ' + (r.referencia || '')).toLowerCase().indexOf(q) >= 0); });
      h += '<section class="conta-card sj-diario" id="sjDiario"><h3>' + esc(t('di_h')) + (DI.length ? ' · ' + DI.length : '') + '</h3><p>' + esc(t('di_p')) + '</p><p class="sj-priv">🔒 ' + esc(t('di_priv')) + '</p>' +
        '<form id="sjDi" class="sj-di-form"><h4>' + esc(rasc.id ? t('di_editando') : t('di_novo')) + '</h4>' +
        '<div class="sj-tipos" role="radiogroup" aria-label="' + esc(t('di_tipo')) + '">' + TIPOS.map(function (k) {
          return '<label class="sj-chip"><input type="radio" name="tipo" value="' + k + '"' + (rasc.tipo === k ? ' checked' : '') + '><span>' + esc(t('t_' + k)) + '</span></label>';
        }).join('') + '</div>' +
        '<div class="sj-di-linha"><label class="sj-campo sj-c-data"><span>' + esc(t('di_data')) + '</span><input type="date" name="data" required max="' + esc(e.hoje) + '" value="' + esc(rasc.data || e.hoje) + '"></label>' +
        '<label class="sj-campo"><span>' + esc(t('di_ref')) + '</span><input name="referencia" maxlength="200" placeholder="' + esc(t('di_ref_ph')) + '" value="' + esc(rasc.referencia) + '"></label></div>' +
        '<label class="sj-campo"><span>' + esc(t('di_texto')) + '</span><textarea name="texto" rows="6" maxlength="10000" required placeholder="' + esc(t('di_ph')) + '">' + esc(rasc.texto) + '</textarea></label>' +
        '<div class="conta-perigo"><button class="btn btn-creme sm" type="submit">' + esc(t('di_salvar')) + '</button>' + (rasc.id ? '<button type="button" class="lnk-x" id="sjDiCanc">' + esc(t('di_cancelar')) + '</button>' : '') + '</div></form>';
      if (DI.length) {
        h += '<div class="sj-di-filtros"><div class="bib-chips"><button type="button" class="chip" data-ftipo="" aria-pressed="' + (!filtro) + '">' + esc(t('di_todos')) + ' <small>' + DI.length + '</small></button>' +
          TIPOS.filter(function (k) { return cont[k]; }).map(function (k) { return '<button type="button" class="chip" data-ftipo="' + k + '" aria-pressed="' + (filtro === k) + '">' + esc(t('t_' + k)) + ' <small>' + cont[k] + '</small></button>'; }).join('') +
          '</div><input type="search" id="sjBusca" class="sj-busca" placeholder="' + esc(t('di_busca')) + '" value="' + esc(busca) + '" aria-label="' + esc(t('di_busca')) + '"></div>';
        if (!lista.length) h += '<p class="sj-mudo">' + esc(t('di_nada')) + '</p>';
        var ultData = '';
        h += '<div class="sj-linha-tempo">';
        lista.forEach(function (r) {
          if (r.data !== ultData) {
            if (ultData) h += '</ul>';
            ultData = r.data;
            var rot = rotIso(r.data);
            h += '<h5 class="sj-dt"><span>' + esc(fmtIso(r.data, true)) + '</span>' + (rot ? '<b>' + esc(rot) + '</b>' : '') + '</h5><ul class="sj-regs">';
          }
          h += itemDiario(r);
        });
        if (ultData) h += '</ul>';
        h += '</div>';
      } else h += '<p class="sj-mudo">' + esc(t('di_vazio')) + '</p>';
      h += '</section>';

      // testemunhos (área separada, com autorização)
      h += '<section class="conta-card sj-diario sj-tes" id="sjTes"><h3>' + esc(t('te_h')) + (TE.length ? ' · ' + TE.length : '') + '</h3><p>' + esc(t('te_p')) + '</p>' +
        '<form id="sjTeF" class="sj-di-form"><h4>' + esc(rascT.id ? t('te_editando') : t('te_novo')) + '</h4>' +
        '<label class="sj-campo sj-c-data"><span>' + esc(t('di_data')) + '</span><input type="date" name="data" required max="' + esc(e.hoje) + '" value="' + esc(rascT.data || e.hoje) + '"></label>' +
        '<label class="sj-campo"><span>' + esc(t('te_texto')) + '</span><textarea name="texto" rows="5" maxlength="10000" required placeholder="' + esc(t('te_ph')) + '">' + esc(rascT.texto) + '</textarea></label>' +
        '<label class="sj-campo"><span>' + esc(t('di_aut')) + '</span><select name="autorizacao">' + AUTS.map(function (a) { return '<option value="' + a + '"' + (rascT.autorizacao === a ? ' selected' : '') + '>' + esc(t('aut_' + a)) + '</option>'; }).join('') + '</select></label>' +
        '<small class="sj-nota">' + esc(t('te_aut_nota')) + '</small>' +
        '<div class="conta-perigo"><button class="btn btn-creme sm" type="submit">' + esc(t('te_salvar')) + '</button>' + (rascT.id ? '<button type="button" class="lnk-x" id="sjTeCanc">' + esc(t('di_cancelar')) + '</button>' : '') + '</div></form>' +
        (TE.length ? '<ul class="sj-regs">' + TE.map(function (x) { return itemTes(x, true); }).join('') + '</ul>' : '<p class="sj-mudo">' + esc(t('te_vazio')) + '</p>') + '</section>';

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
      var bh = document.getElementById('sjHoje');
      if (bh) bh.onclick = function () {
        var c = bh.getAttribute('data-ciclo'); bh.disabled = true;
        salvarDia(c, C(c).dia_atual, true).catch(function (er) { alert(er.message); bh.disabled = false; });
      };
      var ac = document.getElementById('sjAceitar');
      if (ac) ac.onclick = function () {
        ac.disabled = true;
        L.api('/conta/spirit/aceitar', 'POST').then(function () { msg = D.edicao.etapa === 'jornada' ? t('conv_ok2') : t('conv_ok'); return carregar(); }).catch(function (er) { alert(er.message); ac.disabled = false; });
      };
      alvo.querySelectorAll('[data-dia]').forEach(function (b) {
        b.onclick = function () {
          aberto = { c: b.getAttribute('data-ciclo'), n: +b.getAttribute('data-dia') }; msg = ''; desenhar();
          var f = document.getElementById('sjEd'); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        };
      });
      alvo.querySelectorAll('[data-irdiario]').forEach(function (a) { a.onclick = function (ev) { ev.preventDefault(); irDiario(a.getAttribute('data-irdiario')); }; });
      var f = document.getElementById('sjEd');
      if (f) f.onsubmit = function (ev) { ev.preventDefault(); var a = aberto; salvarDia(a.c, a.n, f.orou.checked).then(function () { aberto = null; desenhar(); }).catch(function (er) { alert(er.message); }); };
      var fc = document.getElementById('sjFechar'); if (fc) fc.onclick = function () { aberto = null; desenhar(); };

      // diário: o rascunho acompanha o que a pessoa digita
      var fd = document.getElementById('sjDi');
      if (fd) {
        var guardar = function () {
          rasc.data = fd.data.value; rasc.referencia = fd.referencia.value; rasc.texto = fd.texto.value;
          var tp = fd.querySelector('input[name="tipo"]:checked'); rasc.tipo = tp ? tp.value : 'profetica';
        };
        fd.addEventListener('input', guardar); fd.addEventListener('change', guardar);
        fd.onsubmit = function (ev) {
          ev.preventDefault(); guardar();
          var btn = fd.querySelector('button[type="submit"]'); btn.disabled = true;
          L.api('/conta/spirit/diario' + (rasc.id ? '/' + rasc.id : ''), 'POST', { data: rasc.data, tipo: rasc.tipo, referencia: rasc.referencia, texto: rasc.texto }).then(function () {
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
          rasc = { id: r.id, data: r.data, tipo: r.tipo, referencia: r.referencia || '', texto: r.texto };
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
      // testemunhos
      var ft = document.getElementById('sjTeF');
      if (ft) {
        var guardarT = function () { rascT.data = ft.data.value; rascT.texto = ft.texto.value; rascT.autorizacao = ft.autorizacao.value; };
        ft.addEventListener('input', guardarT); ft.addEventListener('change', guardarT);
        ft.onsubmit = function (ev) {
          ev.preventDefault(); guardarT();
          var btn = ft.querySelector('button[type="submit"]'); btn.disabled = true;
          L.api('/conta/spirit/diario' + (rascT.id ? '/' + rascT.id : ''), 'POST', { data: rascT.data, tipo: 'testemunho', texto: rascT.texto, autorizacao: rascT.autorizacao }).then(function () {
            msg = t('te_salvo'); rascT = vazioT(D.edicao.hoje); return carregar();
          }).then(function () { var s = document.getElementById('sjTes'); if (s) s.scrollIntoView({ block: 'start' }); }).catch(function (er) { alert(er.message); btn.disabled = false; });
        };
      }
      var tc = document.getElementById('sjTeCanc');
      if (tc) tc.onclick = function () { rascT = vazioT(D.edicao.hoje); desenhar(); };
      alvo.querySelectorAll('[data-irtes]').forEach(function (a) {
        a.onclick = function (ev) {
          ev.preventDefault(); rascT.data = a.getAttribute('data-irtes'); aberto = null; desenhar();
          var s = document.getElementById('sjTes'); if (s) { s.scrollIntoView({ behavior: 'smooth', block: 'start' }); var ta = s.querySelector('textarea'); if (ta) setTimeout(function () { ta.focus({ preventScroll: true }); }, 400); }
        };
      });
      alvo.querySelectorAll('[data-edittes]').forEach(function (b) {
        b.onclick = function () {
          var x = D.diario.filter(function (y) { return y.id === +b.getAttribute('data-edittes'); })[0];
          if (!x) return;
          rascT = { id: x.id, data: x.data, texto: x.texto, autorizacao: x.autorizacao === 'privado' ? 'equipe' : x.autorizacao };
          aberto = null; desenhar();
          var s = document.getElementById('sjTes'); if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
      });
      alvo.querySelectorAll('[data-deltes]').forEach(function (b) {
        b.onclick = function () {
          if (!confirm(t('te_apagar_conf'))) return;
          var id = +b.getAttribute('data-deltes');
          L.api('/conta/spirit/diario/' + id, 'DELETE').then(function () { if (rascT.id === id) rascT = vazioT(D.edicao.hoje); return carregar(); }).catch(function (er) { alert(er.message); });
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
