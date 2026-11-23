/* The Prophetic Voices — página do artigo: botão "Salvar na biblioteca" e estado do leitor no artigo
   (salvo? histórico ligado? onde parou?). O estado fica em window.PV_ESTADO para o leitor de PDF (src/scripts/leitor-pdf.js). */
(function () {
  var L = window.PV_LOGIN;
  var btn = document.getElementById('salvarBtn');
  var slug = btn ? btn.getAttribute('data-slug') : (document.getElementById('pdfLeitor') || {}).getAttribute && document.getElementById('pdfLeitor').getAttribute('data-slug');
  if (!L || !slug) return;
  var t = function (k) { return window.PV_T ? window.PV_T(k) : k; };

  window.PV_ESTADO = L.sessao().then(function (s) {
    if (!s || !s.leitor) return { logado: false, provedores: (s && s.provedores) || [] };
    return L.api('/conta/artigo/' + encodeURIComponent(slug)).then(function (e) {
      e.logado = true; e.provedores = s.provedores; return e;
    }).catch(function () { return { logado: true, salvo: false, historico: null, progresso: null, provedores: s.provedores }; });
  });

  if (!btn) return;
  var rotulo = btn.querySelector('span');
  function marcar(salvo) {
    btn.setAttribute('aria-pressed', salvo ? 'true' : 'false');
    btn.classList.toggle('btn-salvo', !!salvo);
    rotulo.setAttribute('data-i18n', salvo ? 'saved' : 'save');
    rotulo.textContent = t(salvo ? 'saved' : 'save');
  }
  window.PV_ESTADO.then(function (e) {
    if (!e.provedores.length) return; // sem login ligado, não há biblioteca
    btn.hidden = false;
    marcar(e.salvo);
    btn.addEventListener('click', function () {
      if (!e.logado) { location.href = '/entrar.html?volta=' + encodeURIComponent(location.pathname); return; }
      var novo = btn.getAttribute('aria-pressed') !== 'true';
      btn.disabled = true;
      L.api('/conta/salvos/' + encodeURIComponent(slug), 'POST', { salvar: novo })
        .then(function (r) { marcar(r.salvo); })
        .catch(function (er) { alert(er.message); })
        .then(function () { btn.disabled = false; });
    });
  });
})();
