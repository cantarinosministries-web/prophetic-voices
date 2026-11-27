/* Owner-only history: uses the account data already returned by the authenticated Spirit API.
   No extra requests, analytics, persistent storage or access to other accounts. */
(function (root) {
  'use strict';
  function entries(data) {
    var result = (data.diario || []).filter(function (x) { return x && !x.encrypted && !x.ciphertext; }).map(function (x) {
      return { id: 'r' + x.id, kind: x.tipo === 'testemunho' ? 'testemunho' : 'diario', date: x.data, title: x.tipo, reference: x.referencia || '', text: x.texto || '' };
    });
    (data.devocionais || []).filter(function (x) { return x.liberar_em <= data.edicao.hoje; }).forEach(function (x) {
      result.push({ id: 'd' + x.id, kind: 'devocional', date: x.liberar_em, title: x.titulo, reference: '', text: x.texto || x.resumo || '', pdf: /^\/arquivos\/spirit\/[\w.-]+\.pdf$/.test(x.pdf_url || '') ? x.pdf_url : '', devotional: !!x.texto });
    });
    return result.filter(function (x) { return /^\d{4}-\d{2}-\d{2}$/.test(x.date); }).sort(function (a, b) { return b.date.localeCompare(a.date) || b.id.localeCompare(a.id, undefined, { numeric: true }); });
  }
  function filter(items, options) {
    var term = String(options.term || '').trim().toLocaleLowerCase();
    return items.filter(function (x) {
      return (!options.kind || x.kind === options.kind) && (!options.from || x.date >= options.from) && (!options.to || x.date <= options.to) && (!term || (x.title + ' ' + x.reference + ' ' + x.text).toLocaleLowerCase().includes(term));
    });
  }
  function mount(target, data, options) {
    if (!target) return;
    var esc = options.esc, en = options.en, all = entries(data), page = 0, pageSize = 10;
    var labels = en ? {diario:'Prayer journal',testemunho:'Testimonies',devocional:'Devotionals',all:'All',search:'Search your history',from:'From',to:'To',empty:'No records match these filters.',prev:'Previous',next:'Next',read:'Read entry',pdf:'Open PDF',total:'records',clear:'Clear filters',invalid:'The start date must not be after the end date.'} : {diario:'Diário de Oração',testemunho:'Testemunhos',devocional:'Devocionais',all:'Todos',search:'Buscar no meu histórico',from:'De',to:'Até',empty:'Nenhum registro corresponde aos filtros.',prev:'Anterior',next:'Próxima',read:'Ler registro',pdf:'Abrir PDF',total:'registros',clear:'Limpar filtros',invalid:'A data inicial não pode ser posterior à final.'};
    target.innerHTML = '<div class="sj-history-tools"><label><span>' + (en ? 'Show' : 'Mostrar') + '</span><select id="sjHistoryKind"><option value="">' + labels.all + '</option>' + ['diario','testemunho','devocional'].map(function (k) { return '<option value="' + k + '">' + labels[k] + ' (' + all.filter(function (x) {return x.kind === k;}).length + ')</option>'; }).join('') + '</select></label><label><span>' + labels.search + '</span><input type="search" id="sjHistorySearch" placeholder="' + labels.search + '"></label><label><span>' + labels.from + '</span><input type="date" id="sjHistoryFrom" max="' + esc(data.edicao.hoje) + '"></label><label><span>' + labels.to + '</span><input type="date" id="sjHistoryTo" max="' + esc(data.edicao.hoje) + '"></label><button type="button" class="btn btn-ghost sm" id="sjHistoryClear">' + labels.clear + '</button></div><p id="sjHistoryCount" role="status" aria-live="polite"></p><div id="sjHistoryList"></div><div class="conta-perigo"><button type="button" class="btn btn-ghost sm" id="sjHistoryPrev">' + labels.prev + '</button><span id="sjHistoryPage"></span><button type="button" class="btn btn-ghost sm" id="sjHistoryNext">' + labels.next + '</button></div>';
    var get = function (id) { return target.querySelector('#sjHistory' + id); };
    function draw() {
      var invalid = get('From').value && get('To').value && get('From').value > get('To').value;
      var found = invalid ? [] : filter(all, {kind:get('Kind').value,term:get('Search').value,from:get('From').value,to:get('To').value});
      var pages = Math.max(1,Math.ceil(found.length/pageSize)); page = Math.min(page,pages-1);
      get('Count').textContent = invalid ? labels.invalid : found.length + ' ' + labels.total;
      get('List').innerHTML = found.length ? found.slice(page*pageSize,(page+1)*pageSize).map(function (x) {
        var title = x.kind === 'diario' ? options.typeLabel(x.title) : x.kind === 'testemunho' ? labels.testemunho : x.title;
        var date = new Date(x.date + 'T12:00:00Z').toLocaleDateString(en ? 'en-US' : 'pt-BR',{day:'numeric',month:'long',year:'numeric'});
        return '<details class="sj-history-entry"><summary><span class="sj-sub">' + esc(labels[x.kind]) + ' · ' + esc(date) + '</span><strong>' + esc(title) + '</strong>' + (x.reference ? '<small>' + esc(x.reference) + '</small>' : '') + '</summary><div class="sj-history-content">' + (x.devotional ? options.devotional(x.text) : '<p style="white-space:pre-wrap">' + esc(x.text) + '</p>') + (x.pdf ? '<p><a class="btn btn-ghost sm" target="_blank" rel="noopener" href="' + esc(x.pdf) + '">' + labels.pdf + '</a></p>' : '') + '</div></details>';
      }).join('') : '<p class="sj-mudo">' + labels.empty + '</p>';
      get('Prev').disabled = page === 0; get('Next').disabled = page >= pages-1; get('Page').textContent = (page+1) + ' / ' + pages;
    }
    ['Kind','Search','From','To'].forEach(function (name) { get(name).addEventListener(name === 'Search' ? 'input' : 'change',function () { page=0; draw(); }); });
    get('Clear').onclick = function () { ['Kind','Search','From','To'].forEach(function (name) {get(name).value='';});page=0;draw(); };
    get('Prev').onclick = function () {page--;draw();}; get('Next').onclick = function () {page++;draw();}; draw();
  }
  root.PV_SPIRIT_HISTORY = Object.freeze({entries:entries,filter:filter,mount:mount});
})(globalThis);
