/* Online-only PWA. Never place accounts, API responses, journals or auth in Cache Storage. */
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  // Leave OAuth, mutations, APIs, downloads and cross-origin traffic to the browser.
  if (request.method !== 'GET' || request.mode !== 'navigate' || url.origin !== self.location.origin || /^\/(auth|api|email|arquivos)(\/|$)/.test(url.pathname)) return;
  event.respondWith(fetch(request, { cache: 'no-store' }).catch(() => new Response(
    '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#0b0a08"><title>Sem conexão — The Prophetic Voices</title><body style="margin:0;background:#0b0a08;color:#f8e9b7;font:18px/1.6 system-ui;min-height:100vh;display:grid;place-items:center"><main style="padding:32px;max-width:480px"><p>The Prophetic Voices</p><h1>Você está sem conexão.</h1><p>Conecte-se à internet para abrir sua conta, acompanhar os devocionais e registrar sua jornada. Nada é enviado enquanto você está sem conexão.</p><button onclick="location.reload()" style="padding:14px 22px;border:0;border-radius:30px;background:#f8e9b7;color:#0b0a08;font:inherit">Tentar novamente</button></main></body></html>',
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } }
  )));
});
