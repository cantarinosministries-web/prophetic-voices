/* Troca textos marcados com data-pt / data-en quando o visitante muda o idioma no cabeçalho. */
(function () {
  function idioma() {
    if (window.__pvLang) return window.__pvLang;
    try { return localStorage.getItem('pv-lang') || 'pt'; } catch (e) { return 'pt'; }
  }
  function aplicar() {
    var en = idioma() === 'en';
    document.querySelectorAll('[data-pt][data-en]').forEach(function (el) {
      el.textContent = en ? el.getAttribute('data-en') : el.getAttribute('data-pt');
    });
  }
  window.addEventListener('pv:lang', function (e) { if (e && e.detail) window.__pvLang = e.detail; aplicar(); });
  aplicar();
})();
