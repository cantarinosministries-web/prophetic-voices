/* The Prophetic Voices — botões de login (Google, Apple, Facebook, Microsoft), usados no cadastro, na conta e nos comentários */
(function () {
  var ICONES = {
    google: '<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>',
    apple: '<svg width="18" height="20" viewBox="0 0 384 512" aria-hidden="true"><path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>',
    facebook: '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#1877F2"/><path fill="#fff" d="M15.1 15.5l.5-3.5h-3.3V9.8c0-1 .5-1.9 2-1.9h1.5v-3s-1.4-.2-2.7-.2c-2.8 0-4.6 1.7-4.6 4.7V12H5.4v3.5h3.1V24h3.8v-8.5z"/></svg>',
    microsoft: '<svg width="18" height="18" viewBox="0 0 23 23" aria-hidden="true"><path fill="#F25022" d="M1 1h10v10H1z"/><path fill="#7FBA00" d="M12 1h10v10H12z"/><path fill="#00A4EF" d="M1 12h10v10H1z"/><path fill="#FFB900" d="M12 12h10v10H12z"/></svg>'
  };
  var NOMES = { google: 'Google', apple: 'Apple', facebook: 'Facebook', microsoft: 'Microsoft' };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var lingua = function () { try { return localStorage.getItem('pv-lang') === 'en' ? 'en' : 'pt'; } catch (e) { return 'pt'; } };

  // lista de botões; "rotulo" recebe o nome do provedor (ex.: "Continuar com Google")
  function botoes(provedores, opcoes) {
    opcoes = opcoes || {};
    var volta = opcoes.volta || (location.pathname + location.search + location.hash);
    var en = lingua() === 'en';
    return '<div class="pv-logins">' + provedores.map(function (p) {
      var id = p.id || p;
      var q = 'volta=' + encodeURIComponent(volta) + (opcoes.vincular ? '&vincular=1' : '');
      var txt = (opcoes.rotulo || (en ? 'Continue with {p}' : 'Continuar com {p}')).replace('{p}', NOMES[id] || id);
      return '<a class="pv-login pv-login-' + esc(id) + '" href="/auth/' + esc(id) + '?' + q + '">' + (ICONES[id] || '') + '<span>' + esc(txt) + '</span></a>';
    }).join('') + '</div>';
  }

  var sessao = null;
  function carregar() {
    if (!sessao) sessao = fetch('/api/conta/sessao', { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.json() : { leitor: null, provedores: [] }; }).catch(function () { return { leitor: null, provedores: [] }; });
    return sessao;
  }
  function recarregar() { sessao = null; return carregar(); }

  function api(caminho, metodo, corpo) {
    return fetch('/api' + caminho, {
      method: metodo || 'GET', credentials: 'same-origin',
      headers: corpo ? { 'X-PV': '1', 'Content-Type': 'application/json' } : { 'X-PV': '1' },
      body: corpo ? JSON.stringify(corpo) : undefined
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { if (!r.ok) throw new Error(d.erro || 'Não foi possível concluir.'); return d; }); });
  }

  var iniciais = function (nome) {
    var p = String(nome || '?').trim().split(/\s+/);
    return ((p[0] || '?')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
  };

  window.PV_LOGIN = { ICONES: ICONES, NOMES: NOMES, botoes: botoes, sessao: carregar, recarregar: recarregar, api: api, esc: esc, iniciais: iniciais, lingua: lingua };
})();
