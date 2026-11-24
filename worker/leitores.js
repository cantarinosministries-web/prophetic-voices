// Cadastro de leitores com login unificado (Google, Apple, Facebook, Microsoft) e comentários públicos nos artigos.
//
//   /auth/<provedor>            começa o login (redireciona para o provedor)
//   /auth/<provedor>/retorno    o provedor devolve o leitor aqui (Apple devolve por POST)
//   /auth/concluir              último passo do login da Apple (grava o cookie no próprio site)
//   /api/conta/*                sessão, nome, logins vinculados, sair, excluir conta
//   /api/comentarios/<slug>     comentários aprovados do artigo; POST envia um novo (fica pendente)
//   /api/moderacao/*            painel: aprovar, rejeitar, apagar, bloquear (editor e acima)
//
// Cada provedor só aparece no site quando os segredos dele estão no Cloudflare (ver docs/CONFIGURAR-LOGINS.md).
import { aleatorio, sha256, lerCookie, json, erro, cabecalhos } from './seguranca.js';
import { inscricaoDoLeitor, definirInscricaoLeitor, emailConfigurado } from './emails.js';
import { apiBiblioteca, ROTAS_BIBLIOTECA } from './biblioteca.js';
import { apiSpiritLeitor, participanteAtivo } from './spirit.js';

const DOM = 'https://thepropheticvoices.com.br';
const COOKIE_LEITOR = 'pv_leitor';
const COOKIE_ESTADO = 'pv_login';
const DIAS_SESSAO = 60;
const MAX_COMENTARIO = 2000;

const daqui = (min) => new Date(Date.now() + min * 60e3).toISOString().replace('T', ' ').slice(0, 19);
const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64urlTexto = (s) => b64url(new TextEncoder().encode(s));
const deB64url = (s) => {
  const t = s.replace(/-/g, '+').replace(/_/g, '/');
  return decodeURIComponent(escape(atob(t + '='.repeat((4 - (t.length % 4)) % 4))));
};
const lerJwt = (jwt) => { try { return JSON.parse(deB64url(String(jwt).split('.')[1])); } catch (e) { return null; } };
const origemDe = (req) => (new URL(req.url).hostname === 'localhost' ? new URL(req.url).origin : DOM);
const voltaSegura = (v) => (typeof v === 'string' && /^\/(?!\/)[\w\-./?=&#%]*$/.test(v) ? v.slice(0, 300) : '/conta.html');

// ---------------------------------------------------------------- provedores
const FB = (env) => env.FACEBOOK_API_VERSION || 'v23.0';

export const PROVEDORES = {
  google: {
    nome: 'Google',
    configurado: (env) => !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    autorizar: (env, p) => 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID, redirect_uri: p.retorno, response_type: 'code', scope: 'openid email profile',
      state: p.estado, nonce: p.nonce, code_challenge: p.desafio, code_challenge_method: 'S256', prompt: 'select_account',
    }),
    async identidade(env, p) {
      const t = await trocar('https://oauth2.googleapis.com/token', {
        client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, code: p.code, redirect_uri: p.retorno,
        grant_type: 'authorization_code', code_verifier: p.verificador,
      });
      const c = conferirIdToken(t.id_token, { iss: ['https://accounts.google.com', 'accounts.google.com'], aud: env.GOOGLE_CLIENT_ID, nonce: p.nonce });
      return { sub: c.sub, email: c.email || null, verificado: c.email_verified === true || c.email_verified === 'true', nome: c.name || c.given_name || '' };
    },
  },

  apple: {
    nome: 'Apple',
    configurado: (env) => !!(env.APPLE_SERVICES_ID && env.APPLE_TEAM_ID && env.APPLE_KEY_ID && env.APPLE_PRIVATE_KEY),
    autorizar: (env, p) => 'https://appleid.apple.com/auth/authorize?' + new URLSearchParams({
      client_id: env.APPLE_SERVICES_ID, redirect_uri: p.retorno, response_type: 'code', scope: 'name email',
      response_mode: 'form_post', state: p.estado, nonce: p.nonce,
    }),
    async identidade(env, p) {
      const t = await trocar('https://appleid.apple.com/auth/token', {
        client_id: env.APPLE_SERVICES_ID, client_secret: await segredoApple(env), code: p.code, redirect_uri: p.retorno, grant_type: 'authorization_code',
      });
      const c = conferirIdToken(t.id_token, { iss: ['https://appleid.apple.com'], aud: env.APPLE_SERVICES_ID, nonce: p.nonce });
      // a Apple só manda o nome na primeira vez, junto do formulário de retorno
      let nome = '';
      try { const u = JSON.parse(p.user || '{}'); nome = [u.name?.firstName, u.name?.lastName].filter(Boolean).join(' '); } catch (e) {}
      return { sub: c.sub, email: c.email || null, verificado: c.email_verified === true || c.email_verified === 'true', nome };
    },
  },

  facebook: {
    nome: 'Facebook',
    configurado: (env) => !!(env.FACEBOOK_APP_ID && env.FACEBOOK_APP_SECRET),
    autorizar: (env, p) => `https://www.facebook.com/${FB(env)}/dialog/oauth?` + new URLSearchParams({
      client_id: env.FACEBOOK_APP_ID, redirect_uri: p.retorno, response_type: 'code', scope: 'public_profile,email', state: p.estado,
    }),
    async identidade(env, p) {
      const r = await fetch(`https://graph.facebook.com/${FB(env)}/oauth/access_token?` + new URLSearchParams({
        client_id: env.FACEBOOK_APP_ID, client_secret: env.FACEBOOK_APP_SECRET, redirect_uri: p.retorno, code: p.code,
      }));
      const t = await r.json();
      if (!r.ok || !t.access_token) throw new Error('facebook: troca do código falhou');
      // appsecret_proof: prova que o pedido vem do nosso servidor
      const appsecret_proof = [...new Uint8Array(await hmac(env.FACEBOOK_APP_SECRET, t.access_token))].map((b) => b.toString(16).padStart(2, '0')).join('');
      const m = await (await fetch(`https://graph.facebook.com/${FB(env)}/me?` + new URLSearchParams({ fields: 'id,name,email', access_token: t.access_token, appsecret_proof }))).json();
      if (!m.id) throw new Error('facebook: perfil não retornado');
      return { sub: String(m.id), email: m.email || null, verificado: false, nome: m.name || '' };
    },
  },

  microsoft: {
    nome: 'Microsoft',
    configurado: (env) => !!(env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET),
    autorizar: (env, p) => 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?' + new URLSearchParams({
      client_id: env.MICROSOFT_CLIENT_ID, redirect_uri: p.retorno, response_type: 'code', scope: 'openid email profile',
      response_mode: 'query', state: p.estado, nonce: p.nonce, code_challenge: p.desafio, code_challenge_method: 'S256', prompt: 'select_account',
    }),
    async identidade(env, p) {
      const t = await trocar('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        client_id: env.MICROSOFT_CLIENT_ID, client_secret: env.MICROSOFT_CLIENT_SECRET, code: p.code, redirect_uri: p.retorno,
        grant_type: 'authorization_code', code_verifier: p.verificador, scope: 'openid email profile',
      });
      const c = conferirIdToken(t.id_token, { issPadrao: /^https:\/\/login\.microsoftonline\.com\/[0-9a-f-]{36}\/v2\.0$/, aud: env.MICROSOFT_CLIENT_ID, nonce: p.nonce });
      // o sub da Microsoft muda conforme o aplicativo; tid+oid identificam a pessoa de forma estável
      return { sub: c.tid && c.oid ? `${c.tid}:${c.oid}` : c.sub, email: c.email || c.preferred_username || null, verificado: false, nome: c.name || '' };
    },
  },
};

export const provedoresAtivos = (env) => Object.keys(PROVEDORES).filter((k) => PROVEDORES[k].configurado(env));

async function trocar(url, campos) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body: new URLSearchParams(campos) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.id_token) throw new Error(`troca do código falhou (${r.status}): ${d.error || ''} ${d.error_description || ''}`.trim());
  return d;
}

// O id_token chega direto do provedor, por conexão segura e em troca do nosso segredo; conferimos emissor, destinatário, prazo e nonce.
function conferirIdToken(jwt, { iss, issPadrao, aud, nonce }) {
  const c = lerJwt(jwt);
  if (!c || !c.sub) throw new Error('id_token inválido');
  if (iss && !iss.includes(c.iss)) throw new Error('emissor inesperado: ' + c.iss);
  if (issPadrao && !issPadrao.test(c.iss || '')) throw new Error('emissor inesperado: ' + c.iss);
  const auds = Array.isArray(c.aud) ? c.aud : [c.aud];
  if (!auds.includes(aud)) throw new Error('destinatário inesperado');
  if (!c.exp || c.exp * 1000 < Date.now() - 60e3) throw new Error('id_token expirado');
  if (nonce && c.nonce && c.nonce !== nonce) throw new Error('nonce não confere');
  if (nonce && !c.nonce) throw new Error('nonce ausente');
  return c;
}

async function hmac(chave, texto) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(chave), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', k, new TextEncoder().encode(texto));
}

// "senha" do login da Apple: um JWT assinado com a chave .p8 (ES256), válido por 5 minutos
async function segredoApple(env) {
  const pem = String(env.APPLE_PRIVATE_KEY).replace(/\\n/g, '\n').replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const chave = await crypto.subtle.importKey('pkcs8', der, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const agora = Math.floor(Date.now() / 1000);
  const cab = b64urlTexto(JSON.stringify({ alg: 'ES256', kid: env.APPLE_KEY_ID }));
  const corpo = b64urlTexto(JSON.stringify({ iss: env.APPLE_TEAM_ID, iat: agora, exp: agora + 300, aud: 'https://appleid.apple.com', sub: env.APPLE_SERVICES_ID }));
  const ass = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, chave, new TextEncoder().encode(`${cab}.${corpo}`));
  return `${cab}.${corpo}.${b64url(ass)}`;
}

// ---------------------------------------------------------------- sessão do leitor
export async function leitorDaSessao(env, req) {
  const tok = lerCookie(req, COOKIE_LEITOR);
  if (!tok || !/^[0-9a-f]{64}$/.test(tok)) return null;
  return (await env.DB.prepare(
    `SELECT l.* FROM leitor_sessoes s JOIN leitores l ON l.id = s.leitor_id WHERE s.token_hash = ? AND s.expira_em > datetime('now')`,
  ).bind(await sha256(tok)).first()) || null;
}

async function criarSessao(env, leitorId) {
  const tok = aleatorio(32);
  await env.DB.prepare("DELETE FROM leitor_sessoes WHERE expira_em < datetime('now')").run();
  await env.DB.prepare('INSERT INTO leitor_sessoes (token_hash, leitor_id, expira_em) VALUES (?,?,?)').bind(await sha256(tok), leitorId, daqui(DIAS_SESSAO * 1440)).run();
  await env.DB.prepare("UPDATE leitores SET ultimo_acesso = datetime('now') WHERE id = ?").bind(leitorId).run();
  return `${COOKIE_LEITOR}=${tok}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${DIAS_SESSAO * 86400}`;
}

const limparCookieLeitor = () => `${COOKIE_LEITOR}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
// SameSite=None: a Apple devolve o leitor por POST vindo do site dela
const cookieEstado = (v, max) => `${COOKIE_ESTADO}=${v}; Path=/auth; HttpOnly; Secure; SameSite=None; Max-Age=${max}`;

function redirecionar(destino, cookies = []) {
  const h = cabecalhos(new Headers({ Location: destino, 'Cache-Control': 'no-store' }));
  for (const c of cookies) h.append('Set-Cookie', c);
  return new Response(null, { status: 303, headers: h });
}

const falha = (volta, motivo) => {
  const u = new URL('/entrar.html', DOM);
  u.searchParams.set('erro', motivo);
  if (volta) u.searchParams.set('volta', volta);
  return u.pathname + u.search;
};

// ---------------------------------------------------------------- /auth/*
export async function rotaAuth(req, env, url) {
  const seg = url.pathname.split('/').filter(Boolean); // ['auth', provedor, 'retorno'?]

  if (seg[1] === 'concluir') {
    const c = url.searchParams.get('c') || '';
    if (!/^[0-9a-f]{64}$/.test(c)) return redirecionar(falha(null, 'expirou'));
    const e = await env.DB.prepare("SELECT * FROM login_estados WHERE estado_hash = ? AND concluido_leitor IS NOT NULL AND expira_em > datetime('now')").bind(await sha256('c:' + c)).first();
    if (!e) return redirecionar(falha(null, 'expirou'));
    await env.DB.prepare('DELETE FROM login_estados WHERE estado_hash = ?').bind(e.estado_hash).run();
    return redirecionar(voltaSegura(e.volta), [await criarSessao(env, e.concluido_leitor)]);
  }

  const nome = seg[1];
  const prov = PROVEDORES[nome];
  if (!prov) return redirecionar('/entrar.html');
  const retorno = `${origemDe(req)}/auth/${nome}/retorno`;

  // ---- início
  if (seg.length === 2 && req.method === 'GET') {
    const volta = voltaSegura(url.searchParams.get('volta'));
    if (!prov.configurado(env)) return redirecionar(falha(volta, 'indisponivel'));
    let vincular = null;
    if (url.searchParams.get('vincular') === '1') {
      const l = await leitorDaSessao(env, req);
      if (l) vincular = l.id;
    }
    const estado = aleatorio(24), verificador = aleatorio(32), nonce = aleatorio(16);
    const desafio = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verificador)));
    await env.DB.prepare("DELETE FROM login_estados WHERE expira_em < datetime('now')").run();
    await env.DB.prepare('INSERT INTO login_estados (estado_hash, provedor, verificador, nonce, volta, vincular_leitor, expira_em) VALUES (?,?,?,?,?,?,?)')
      .bind(await sha256(estado), nome, verificador, nonce, volta, vincular, daqui(10)).run();
    return redirecionar(prov.autorizar(env, { retorno, estado, nonce, desafio }), [cookieEstado(estado, 600)]);
  }

  // ---- retorno
  if (seg[2] !== 'retorno') return redirecionar('/entrar.html');
  let dados = Object.fromEntries(url.searchParams);
  if (req.method === 'POST') {
    try { dados = { ...dados, ...Object.fromEntries(await req.formData()) }; } catch (e) {}
  }
  const estado = String(dados.state || '');
  const doCookie = lerCookie(req, COOKIE_ESTADO);
  const limpa = cookieEstado('', 0);
  if (!estado || !doCookie || estado !== doCookie) return redirecionar(falha(null, 'expirou'), [limpa]);
  const e = await env.DB.prepare("SELECT * FROM login_estados WHERE estado_hash = ? AND provedor = ? AND expira_em > datetime('now')").bind(await sha256(estado), nome).first();
  if (!e) return redirecionar(falha(null, 'expirou'), [limpa]);
  await env.DB.prepare('DELETE FROM login_estados WHERE estado_hash = ?').bind(e.estado_hash).run();
  if (dados.error || !dados.code) return redirecionar(falha(e.volta, dados.error === 'access_denied' || dados.error === 'user_cancelled_authorize' ? 'cancelado' : 'falhou'), [limpa]);

  let id;
  try {
    id = await prov.identidade(env, { code: String(dados.code), retorno, verificador: e.verificador, nonce: e.nonce, user: dados.user });
  } catch (er) {
    console.error('login ' + nome, er && er.message);
    return redirecionar(falha(e.volta, 'falhou'), [limpa]);
  }

  const r = await vincularOuCriar(env, nome, id, e.vincular_leitor);
  if (r.erro) return redirecionar(falha(e.volta, r.erro), [limpa]);
  if (r.bloqueado) return redirecionar(falha(e.volta, 'bloqueado'), [limpa]);

  if (req.method === 'POST') {
    // Apple: o cookie de sessão é gravado num passo seguinte, já dentro do site
    const c = aleatorio(32);
    await env.DB.prepare('INSERT INTO login_estados (estado_hash, provedor, verificador, nonce, volta, concluido_leitor, expira_em) VALUES (?,?,?,?,?,?,?)')
      .bind(await sha256('c:' + c), nome, '-', '-', destinoFinal(e.volta, r), r.leitor, daqui(2)).run();
    return redirecionar(`/auth/concluir?c=${c}`, [limpa]);
  }
  return redirecionar(destinoFinal(e.volta, r), [limpa, await criarSessao(env, r.leitor)]);
}

// conta recém-criada passa pela boas-vindas (pergunta sobre os e-mails) antes de voltar
const destinoFinal = (volta, r) => (r.novo ? `/conta.html?bemvindo=1&volta=${encodeURIComponent(voltaSegura(volta))}` : voltaSegura(volta));

async function vincularOuCriar(env, provedor, id, vincularA) {
  const ja = await env.DB.prepare('SELECT lc.leitor_id, l.bloqueado FROM leitor_contas lc JOIN leitores l ON l.id = lc.leitor_id WHERE lc.provedor = ? AND lc.sub = ?').bind(provedor, id.sub).first();
  if (vincularA) {
    if (ja && ja.leitor_id !== vincularA) return { erro: 'em-uso' };
    if (!ja) await env.DB.prepare('INSERT INTO leitor_contas (provedor, sub, leitor_id, email) VALUES (?,?,?,?)').bind(provedor, id.sub, vincularA, id.email).run();
    const l = await env.DB.prepare('SELECT bloqueado FROM leitores WHERE id = ?').bind(vincularA).first();
    return { leitor: vincularA, bloqueado: l && l.bloqueado };
  }
  if (ja) {
    if (id.email) await env.DB.prepare('UPDATE leitor_contas SET email = ? WHERE provedor = ? AND sub = ?').bind(id.email, provedor, id.sub).run();
    return { leitor: ja.leitor_id, bloqueado: ja.bloqueado };
  }
  // mesma pessoa entrando por outro provedor: só junta as contas quando o e-mail foi confirmado pelo provedor (Google e Apple)
  if (id.email && id.verificado) {
    const outro = await env.DB.prepare('SELECT id, bloqueado FROM leitores WHERE email = ? ORDER BY id LIMIT 1').bind(id.email).first();
    if (outro) {
      await env.DB.prepare('INSERT INTO leitor_contas (provedor, sub, leitor_id, email) VALUES (?,?,?,?)').bind(provedor, id.sub, outro.id, id.email).run();
      return { leitor: outro.id, bloqueado: outro.bloqueado };
    }
  }
  const nome = (id.nome || (id.email ? id.email.split('@')[0] : '') || 'Leitor').trim().slice(0, 80);
  const novo = await env.DB.prepare('INSERT INTO leitores (nome, email) VALUES (?,?) RETURNING id').bind(nome, id.email).first();
  await env.DB.prepare('INSERT INTO leitor_contas (provedor, sub, leitor_id, email) VALUES (?,?,?,?)').bind(provedor, id.sub, novo.id, id.email).run();
  return { leitor: novo.id, bloqueado: 0, novo: true };
}

// ---------------------------------------------------------------- /api/conta e /api/comentarios (públicas)
async function corpo(req) { try { return await req.json(); } catch (e) { return {}; } }

const publicoLeitor = async (env, l) => {
  if (!l) return null;
  const contas = (await env.DB.prepare('SELECT provedor, email, criado_em FROM leitor_contas WHERE leitor_id = ? ORDER BY criado_em').bind(l.id).all()).results;
  const insc = await inscricaoDoLeitor(env, l.id);
  return { nome: l.nome, email: l.email, criado_em: l.criado_em, bloqueado: !!l.bloqueado, contas,
    recebe_email: !!(insc && insc.status === 'ativo'), perguntar_email: !l.respondeu_email && !!l.email, spirit: await participanteAtivo(env, l.id) };
};

export async function apiLeitores(req, env, url) {
  const m = req.method;
  const p = url.pathname.replace(/^\/api/, '').replace(/\/+$/, '');
  const seg = p.split('/').filter(Boolean);
  const l = await leitorDaSessao(env, req);

  if (seg[0] === 'conta') {
    if (p === '/conta/sessao' && m === 'GET') {
      return json({ leitor: await publicoLeitor(env, l), provedores: provedoresAtivos(env).map((k) => ({ id: k, nome: PROVEDORES[k].nome })), email_servico: emailConfigurado(env) });
    }
    if (p === '/conta/sair' && m === 'POST') {
      const tok = lerCookie(req, COOKIE_LEITOR);
      if (tok) await env.DB.prepare('DELETE FROM leitor_sessoes WHERE token_hash = ?').bind(await sha256(tok)).run();
      return json({ ok: true }, 200, { 'Set-Cookie': limparCookieLeitor() });
    }
    if (!l) return erro('Entre na sua conta para continuar.', 401);
    if (p === '/conta/nome' && m === 'POST') {
      const nome = String((await corpo(req)).nome || '').replace(/\s+/g, ' ').trim();
      if (nome.length < 2 || nome.length > 80) return erro('O nome precisa ter entre 2 e 80 caracteres.');
      await env.DB.prepare('UPDATE leitores SET nome = ? WHERE id = ?').bind(nome, l.id).run();
      return json({ ok: true });
    }
    if (p === '/conta/email' && m === 'POST') {
      try { await definirInscricaoLeitor(env, l, !!(await corpo(req)).receber); } catch (er) { return erro(er.message); }
      return json({ ok: true });
    }
    if (seg[1] === 'desvincular' && seg[2] && m === 'POST') {
      const n = (await env.DB.prepare('SELECT COUNT(*) n FROM leitor_contas WHERE leitor_id = ?').bind(l.id).first()).n;
      if (n <= 1) return erro('Este é o seu único login. Vincule outro antes de remover este, ou exclua a conta.');
      await env.DB.prepare('DELETE FROM leitor_contas WHERE leitor_id = ? AND provedor = ?').bind(l.id, seg[2]).run();
      return json({ ok: true });
    }
    if (ROTAS_BIBLIOTECA.includes(seg[1])) return apiBiblioteca(req, env, url, seg, l);
    if (seg[1] === 'spirit') return apiSpiritLeitor(req, env, url, seg, l);
    if (p === '/conta' && m === 'DELETE') {
      // LGPD: apaga o cadastro, os logins, as sessões, os comentários e toda a Biblioteca (salvos, coleções, citações, histórico)
      await env.DB.prepare('DELETE FROM leitores WHERE id = ?').bind(l.id).run();
      return json({ ok: true }, 200, { 'Set-Cookie': limparCookieLeitor() });
    }
    return erro('Rota não encontrada.', 404);
  }

  if (seg[0] === 'comentarios' && seg[1]) {
    const a = await env.DB.prepare("SELECT id FROM artigos WHERE slug = ? AND status = 'publicado'").bind(seg[1]).first();
    if (!a) return erro('Artigo não encontrado.', 404);
    if (m === 'GET') {
      const lista = (await env.DB.prepare(
        "SELECT c.id, c.texto, c.criado_em, l.nome FROM comentarios_leitores c JOIN leitores l ON l.id = c.leitor_id WHERE c.artigo_id = ? AND c.status = 'aprovado' ORDER BY c.criado_em",
      ).bind(a.id).all()).results;
      const meus = l ? (await env.DB.prepare("SELECT COUNT(*) n FROM comentarios_leitores WHERE artigo_id = ? AND leitor_id = ? AND status = 'pendente'").bind(a.id, l.id).first()).n : 0;
      return json({ comentarios: lista, pendentes_meus: meus });
    }
    if (m === 'POST') {
      if (!l) return erro('Entre na sua conta para comentar.', 401);
      if (l.bloqueado) return erro('Sua conta não pode comentar.', 403);
      const texto = String((await corpo(req)).texto || '').replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
      if (texto.length < 3) return erro('Escreva o seu comentário.');
      if (texto.length > MAX_COMENTARIO) return erro(`O comentário pode ter até ${MAX_COMENTARIO} caracteres.`);
      const n = (await env.DB.prepare("SELECT COUNT(*) n FROM comentarios_leitores WHERE leitor_id = ? AND criado_em > datetime('now','-1 hour')").bind(l.id).first()).n;
      if (n >= 5) return erro('Você enviou vários comentários na última hora. Tente mais tarde.', 429);
      await env.DB.prepare('INSERT INTO comentarios_leitores (artigo_id, leitor_id, texto) VALUES (?,?,?)').bind(a.id, l.id, texto).run();
      return json({ ok: true }, 201);
    }
  }
  return erro('Rota não encontrada.', 404);
}

// ---------------------------------------------------------------- /api/moderacao (painel)
export async function apiModeracao(req, env, url, seg, u, { registrar }) {
  const m = req.method;
  if (seg.length === 0 && m === 'GET') {
    const status = ['pendente', 'aprovado', 'rejeitado'].includes(url.searchParams.get('status')) ? url.searchParams.get('status') : 'pendente';
    const lista = (await env.DB.prepare(
      `SELECT c.id, c.texto, c.status, c.criado_em, c.moderado_em, a.slug, a.titulo, l.id AS leitor_id, l.nome, l.email, l.bloqueado, mu.nome AS moderado_por_nome
       FROM comentarios_leitores c JOIN artigos a ON a.id = c.artigo_id JOIN leitores l ON l.id = c.leitor_id LEFT JOIN usuarios mu ON mu.id = c.moderado_por
       WHERE c.status = ? ORDER BY c.criado_em ${status === 'pendente' ? 'ASC' : 'DESC'} LIMIT 300`,
    ).bind(status).all()).results;
    const cont = (await env.DB.prepare('SELECT status, COUNT(*) n FROM comentarios_leitores GROUP BY status').all()).results;
    const leitores = (await env.DB.prepare('SELECT COUNT(*) n FROM leitores').first()).n;
    return json({
      comentarios: lista, contagem: Object.fromEntries(cont.map((x) => [x.status, x.n])), leitores,
      provedores: Object.entries(PROVEDORES).map(([k, v]) => ({ id: k, nome: v.nome, configurado: v.configurado(env), retorno: `${DOM}/auth/${k}/retorno` })),
    });
  }
  if (seg[0] === 'pendentes' && m === 'GET') {
    return json({ n: (await env.DB.prepare("SELECT COUNT(*) n FROM comentarios_leitores WHERE status = 'pendente'").first()).n });
  }
  if (seg[0] === 'leitor' && seg[1] && m === 'POST') {
    const alvo = await env.DB.prepare('SELECT * FROM leitores WHERE id = ?').bind(parseInt(seg[1], 10)).first();
    if (!alvo) return erro('Leitor não encontrado.', 404);
    const bloquear = !!(await corpo(req)).bloquear;
    await env.DB.prepare('UPDATE leitores SET bloqueado = ? WHERE id = ?').bind(bloquear ? 1 : 0, alvo.id).run();
    if (bloquear) await env.DB.prepare("UPDATE comentarios_leitores SET status = 'rejeitado', moderado_em = datetime('now'), moderado_por = ? WHERE leitor_id = ? AND status = 'pendente'").bind(u.id, alvo.id).run();
    await registrar(env, u, bloquear ? 'bloqueou o leitor' : 'desbloqueou o leitor', alvo.nome, alvo.email);
    return json({ ok: true });
  }
  const id = parseInt(seg[0], 10);
  if (id && m === 'POST') {
    const c = await env.DB.prepare('SELECT c.*, a.titulo FROM comentarios_leitores c JOIN artigos a ON a.id = c.artigo_id WHERE c.id = ?').bind(id).first();
    if (!c) return erro('Comentário não encontrado.', 404);
    const acao = (await corpo(req)).acao;
    if (acao === 'apagar') {
      await env.DB.prepare('DELETE FROM comentarios_leitores WHERE id = ?').bind(id).run();
      await registrar(env, u, 'apagou um comentário de leitor em', c.titulo, c.texto.slice(0, 120));
      return json({ ok: true });
    }
    const novo = { aprovar: 'aprovado', rejeitar: 'rejeitado', pendente: 'pendente' }[acao];
    if (!novo) return erro('Ação inválida.');
    await env.DB.prepare("UPDATE comentarios_leitores SET status = ?, moderado_em = datetime('now'), moderado_por = ? WHERE id = ?").bind(novo, u.id, id).run();
    await registrar(env, u, { aprovado: 'aprovou um comentário em', rejeitado: 'rejeitou um comentário em', pendente: 'voltou para pendente um comentário em' }[novo], c.titulo, c.texto.slice(0, 120));
    return json({ ok: true });
  }
  return erro('Rota não encontrada.', 404);
}
