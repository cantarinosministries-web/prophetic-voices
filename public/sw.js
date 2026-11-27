/* PWA só on-line. Nunca guardar conta, respostas da API, diário ou login no Cache Storage.
   As páginas da conta já saem do servidor com Cache-Control: private, no-store; as demais seguem o cache normal do navegador. */
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  // Pré-carregamento da navegação: a página começa a baixar enquanto o service worker acorda (abre mais rápido).
  if (self.registration && self.registration.navigationPreload) { try { await self.registration.navigationPreload.enable(); } catch (_) {} }
  await self.clients.claim();
})()));
const SEM_CONEXAO = '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#000000"><title>Sem conexão — The Prophetic Voices</title><body style="margin:0;background:#000;color:#F8E9B7;font:18px/1.6 system-ui;min-height:100vh;display:grid;place-items:center"><main style="padding:32px;max-width:480px"><p>The Prophetic Voices</p><h1>Você está sem conexão.</h1><p>Conecte-se à internet para abrir sua conta, acompanhar os devocionais e registrar sua jornada. Nada é enviado enquanto você está sem conexão.</p><p lang="en" style="color:#CAB5A0">You are offline. Connect to the internet to open your account.</p><button onclick="location.reload()" style="padding:14px 22px;border:0;border-radius:30px;background:#F8E9B7;color:#000;font:inherit">Tentar novamente</button></main></body></html>';
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  // Login, gravações, API, downloads e outros sites ficam com o navegador, sem passar por aqui.
  if (request.method !== 'GET' || request.mode !== 'navigate' || url.origin !== self.location.origin || /^\/(auth|api|email|arquivos)(\/|$)/.test(url.pathname)) return;
  event.respondWith((async () => {
    try {
      const pre = await event.preloadResponse;
      if (pre) return pre;
      return await fetch(request);
    } catch (_) {
      return new Response(SEM_CONEXAO, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
    }
  })());
});
