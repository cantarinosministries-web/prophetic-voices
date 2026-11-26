/* Installation is optional; no notification permission or user-content storage. */
(function () {
  'use strict';
  var deferred = null;
  var dialog = document.getElementById('pvInstallDialog');
  var status = document.getElementById('pvInstallStatus');
  var english = function () { try { return localStorage.getItem('pv-lang') === 'en'; } catch (_) { return false; } };
  var standalone = function () { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; };
  function refresh() {
    document.querySelectorAll('[data-pwa-hide-installed]').forEach(function (el) { el.hidden = standalone(); });
    if (standalone() && dialog && dialog.open) dialog.close();
  }
  function showHelp() {
    if (!dialog) return;
    var ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var help = document.getElementById('pvInstallHelp');
    var embedded = /Instagram|FBAN|FBAV/i.test(navigator.userAgent);
    help.textContent = english()
      ? (embedded ? 'First open this page in Safari on iPhone or Chrome on Android, outside Instagram. ' : '') + (ios ? 'In Safari, open Share, choose Add to Home Screen and confirm Add. Enable Open as Web App if that option is shown.' : 'In Chrome or Edge, open the browser menu and look for Install app or Add to Home screen. Available wording depends on your device and browser.')
      : (embedded ? 'Primeiro, abra esta página no Safari do iPhone ou no Chrome do Android, fora do Instagram. ' : '') + (ios ? 'No Safari, toque em Compartilhar, escolha Adicionar à Tela de Início e confirme em Adicionar. Ative Abrir como App da Web, se essa opção aparecer.' : 'No Chrome ou Edge, abra o menu do navegador e procure Instalar aplicativo ou Adicionar à tela inicial. O nome da opção varia conforme o aparelho e o navegador.');
    if (!dialog.open) dialog.showModal();
  }
  window.addEventListener('beforeinstallprompt', function (event) { event.preventDefault(); deferred = event; });
  window.addEventListener('appinstalled', function () { deferred = null; refresh(); if (status) status.textContent = english() ? 'App installed. Open it from your home screen.' : 'Aplicativo instalado. Abra pelo ícone na tela inicial.'; if (dialog && dialog.open) dialog.close(); });
  document.addEventListener('click', async function (event) {
    if (!event.target.closest) return;
    if (event.target.closest('[data-pwa-close]')) { if (dialog) dialog.close(); return; }
    var button = event.target.closest('[data-pwa-install]');
    if (!button) return;
    event.preventDefault();
    if (standalone()) return;
    if (!deferred) { showHelp(); return; }
    var prompt = deferred; deferred = null;
    try { await prompt.prompt(); await prompt.userChoice; } catch (_) { showHelp(); }
  });
  matchMedia('(display-mode: standalone)').addEventListener('change', refresh);
  refresh();
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).then(function (registration) {
        // Apply updates on subsequent visits without reloading a page containing unsaved writing.
        registration.update().catch(function () {});
      }).catch(function () { /* Site remains usable without installation support. */ });
    });
  }
})();
