// Senhas, tokens, cookies e cabeçalhos de segurança.

const enc = new TextEncoder();

export function hex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function aleatorio(bytes = 32) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return hex(a);
}

export async function sha256(texto) {
  return hex(await crypto.subtle.digest('SHA-256', enc.encode(texto)));
}

// PBKDF2-SHA256 com 100 mil iterações (o máximo aceito pelo Workers)
export async function hashSenha(senha, salHex) {
  const sal = salHex || aleatorio(16);
  const chave = await crypto.subtle.importKey('raw', enc.encode(senha), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(sal), iterations: 100000 },
    chave,
    256,
  );
  return { hash: hex(bits), sal };
}

export function iguais(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export function senhaValida(s) {
  return typeof s === 'string' && s.length >= 10 && s.length <= 200;
}

export const COOKIE = 'pv_sessao';

export function lerCookie(req, nome) {
  const c = req.headers.get('Cookie') || '';
  for (const p of c.split(/;\s*/)) {
    const i = p.indexOf('=');
    if (i > 0 && p.slice(0, i) === nome) return decodeURIComponent(p.slice(i + 1));
  }
  return null;
}

export function cookieSessao(token, maxAge) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "media-src 'self'",
  "frame-src 'self' https://docs.google.com",
  "worker-src 'self' blob:",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

export function cabecalhos(h = new Headers()) {
  h.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  h.set('X-Frame-Options', 'SAMEORIGIN');
  h.set('Content-Security-Policy', CSP);
  return h;
}

export function json(dados, status = 200, extra = {}) {
  const h = cabecalhos(new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra }));
  return new Response(JSON.stringify(dados), { status, headers: h });
}

export function erro(msg, status = 400) {
  return json({ erro: msg }, status);
}

// pedidos que alteram dados precisam vir do próprio site (proteção contra CSRF)
export function origemOk(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return true;
  if (req.headers.get('X-PV') !== '1') return false;
  const o = req.headers.get('Origin');
  if (!o) return true;
  return o === new URL(req.url).origin;
}
