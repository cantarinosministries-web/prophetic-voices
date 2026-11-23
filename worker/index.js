// The Prophetic Voices — servidor (Cloudflare Worker).
// Os arquivos estáticos do Astro saem direto da pasta dist; este Worker cuida de:
//   /api/*          API do painel (usuários, artigos, comentários)
//   /artigos.html   lista da revista, montada a partir do banco
//   /artigos/<x>    página de cada artigo (PDFs e capas estáticos seguem para os arquivos)
//   /arquivos/*     PDFs e capas enviados pelo painel e fotos da loja (R2)
//   /api/loja/*     loja virtual (ver worker/loja.js)
//   /auth/*         login dos leitores (Google, Apple, Facebook, Microsoft) — ver worker/leitores.js
//   /api/conta/*, /api/comentarios/*   cadastro do leitor e comentários públicos
//   /email/*, /api/newsletter, /api/publico/testemunhos   e-mails automáticos e testemunhos (ver worker/emails.js)
import { api, usuarioDaSessao } from './api.js';
import { paginaLista, paginaArtigo } from './paginas.js';
import { origemOk, erro, cabecalhos } from './seguranca.js';
import { pode } from './permissoes.js';
import { apiLojaPublica, webhookMercadoPago } from './loja.js';
import { contar, contavel, totaisArtigo } from './estatisticas.js';
import { rotaAuth, apiLeitores, provedoresAtivos, leitorDaSessao } from './leitores.js';
import { rotaEmail, apiNewsletter, testemunhosPublicos, processarFila } from './emails.js';

function html(texto, status = 200) {
  const h = cabecalhos(new Headers({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' }));
  return new Response(texto, { status, headers: h });
}

async function naoEncontrado(env, req) {
  const r = await env.ASSETS.fetch(new Request(new URL('/404.html', req.url)));
  return html(r.ok ? await r.text() : '<h1>Página não encontrada</h1>', 404);
}

async function publicados(env) {
  return (await env.DB.prepare("SELECT * FROM artigos WHERE status = 'publicado' ORDER BY ano, titulo").all()).results;
}

// Leitura e download dos artigos: gratuitos, mas exigem conta de leitor (decisão de Gabriel, 22/11/2026).
// Só vale quando há algum login ligado; a equipe logada no painel e os robôs de busca (Google Acadêmico etc.) passam direto.
const BUSCADORES = /Googlebot|Google-?Scholar|Google-InspectionTool|bingbot|DuckDuckBot|Applebot|YandexBot|Semantic ?Scholar|CiteSeerX|BASE|CORE|ia_archiver/i;
async function acessoLeitura(env, req) {
  if (provedoresAtivos(env).length === 0) return { livre: true };
  if (BUSCADORES.test(req.headers.get('User-Agent') || '')) return { livre: true, robo: true };
  if (await leitorDaSessao(env, req)) return { livre: true };
  if (await usuarioDaSessao(env, req)) return { livre: true };
  return { livre: false };
}

// PDF pedido sem login: quem navegou até o arquivo vai para o cadastro e depois volta ao artigo
function pedirCadastro(req, slug) {
  const destino = req.headers.get('Sec-Fetch-Dest') || '';
  const volta = slug ? `/artigos/${slug}.html#leitor` : '/artigos.html';
  if (destino && !['document', 'empty'].includes(destino)) return new Response('Cadastro necessário', { status: 401, headers: cabecalhos(new Headers({ 'Cache-Control': 'no-store' })) });
  const h = cabecalhos(new Headers({ Location: `/entrar.html?motivo=leitura&volta=${encodeURIComponent(volta)}`, 'Cache-Control': 'no-store' }));
  return new Response(null, { status: 303, headers: h });
}

export default {
  // a cada 10 minutos: envia o que ficou na fila de e-mails (novos artigos e testemunhos)
  async scheduled(evento, env, ctx) {
    ctx.waitUntil(processarFila(env).catch((e) => console.error('fila de e-mails', e)));
  },

  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const path = url.pathname;
    try {
      if (path === '/api/loja/mp/webhook') return await webhookMercadoPago(req, env, url);
      if (path.startsWith('/auth/')) return await rotaAuth(req, env, url);
      if (path.startsWith('/email/')) return await rotaEmail(req, env, url);
      if (path.startsWith('/api/')) {
        if (!origemOk(req)) return erro('Pedido recusado.', 403);
        if (path.startsWith('/api/loja/publico/')) return await apiLojaPublica(req, env, url);
        if (path.startsWith('/api/conta/') || path === '/api/conta' || path.startsWith('/api/comentarios/')) return await apiLeitores(req, env, url);
        if (path === '/api/newsletter') return await apiNewsletter(req, env);
        if (path === '/api/publico/testemunhos' && req.method === 'GET') return await testemunhosPublicos(env);
        return await api(req, env, url, ctx);
      }

      if (path === '/artigos.html' || path === '/artigos' || path === '/artigos/') {
        return html(await paginaLista(env, req, await publicados(env), !(await acessoLeitura(env, req)).livre));
      }

      if (path.startsWith('/artigos/')) {
        const nome = decodeURIComponent(path.slice('/artigos/'.length));
        if (/\.pdf$/i.test(nome)) {
          const a = await env.DB.prepare("SELECT id, slug FROM artigos WHERE pdf_url = ? AND status = 'publicado'").bind('/artigos/' + nome).first();
          const acesso = await acessoLeitura(env, req);
          if (!acesso.livre) return pedirCadastro(req, a && a.slug);
          const r = await env.ASSETS.fetch(req);
          if (r.ok && a) contar(env, ctx, req, a.id, 'downloads');
          if (!r.ok || provedoresAtivos(env).length === 0) return r;
          const h = new Headers(r.headers);
          h.set('Cache-Control', 'private, no-store');
          return new Response(r.body, { status: r.status, headers: h });
        }
        if (/\.(jpe?g|png|webp)$/i.test(nome)) return env.ASSETS.fetch(req);
        const slug = nome.replace(/\.html$/, '');
        if (!slug || slug === 'modelo' || slug.includes('/')) return naoEncontrado(env, req);
        const a = await env.DB.prepare('SELECT * FROM artigos WHERE slug = ?').bind(slug).first();
        if (!a) return naoEncontrado(env, req);
        let previa = false;
        if (a.status !== 'publicado') {
          const u = await usuarioDaSessao(env, req);
          if (!u || !pode(u, 'ver_rascunhos')) return naoEncontrado(env, req);
          previa = true;
        }
        const rel = (await publicados(env)).filter((b) => b.id !== a.id);
        rel.sort((x, y) => (y.area === a.area) - (x.area === a.area));
        let numeros = null;
        if (!previa) {
          numeros = await totaisArtigo(env, a.id);
          if (contavel(req)) numeros.acessos += 1; // a visita atual já entra na conta mostrada
        }
        const comentarios = !previa && provedoresAtivos(env).length > 0;
        const bloqueado = !previa && !(await acessoLeitura(env, req)).livre;
        const pagina = html(await paginaArtigo(env, req, a, rel, previa, numeros, comentarios, bloqueado));
        if (!previa) contar(env, ctx, req, a.id, 'acessos');
        return pagina;
      }

      if (path.startsWith('/arquivos/')) {
        const chave = decodeURIComponent(path.slice('/arquivos/'.length));
        if (/^loja\/[\w.-]+$/.test(chave)) {
          const obj = await env.ARQUIVOS.get(chave);
          if (!obj) return naoEncontrado(env, req);
          const h = cabecalhos(new Headers());
          obj.writeHttpMetadata(h);
          h.set('ETag', obj.httpEtag);
          h.set('Cache-Control', 'public, max-age=604800');
          return new Response(obj.body, { headers: h });
        }
        if (!/^artigos\/[\w.-]+$/.test(chave)) return naoEncontrado(env, req);
        const ref = '/arquivos/' + chave;
        const a = await env.DB.prepare('SELECT id, slug, status, pdf_url FROM artigos WHERE pdf_url = ? OR capa_url = ?').bind(ref, ref).first();
        if (!a) return naoEncontrado(env, req);
        if (a.status !== 'publicado') {
          const u = await usuarioDaSessao(env, req);
          if (!u || !pode(u, 'ver_rascunhos')) return naoEncontrado(env, req);
        }
        const ehPdf = a.pdf_url === ref;
        if (ehPdf && a.status === 'publicado' && !(await acessoLeitura(env, req)).livre) return pedirCadastro(req, a.slug);
        const obj = await env.ARQUIVOS.get(chave);
        if (!obj) return naoEncontrado(env, req);
        const h = cabecalhos(new Headers());
        obj.writeHttpMetadata(h);
        h.set('ETag', obj.httpEtag);
        h.set('Cache-Control', a.status !== 'publicado' || (ehPdf && provedoresAtivos(env).length > 0) ? 'private, no-store' : 'public, max-age=86400');
        if (a.status === 'publicado' && a.pdf_url === ref) contar(env, ctx, req, a.id, 'downloads');
        return new Response(obj.body, { headers: h });
      }

      return env.ASSETS.fetch(req);
    } catch (e) {
      console.error(e);
      return path.startsWith('/api/') ? erro('Erro interno. Tente novamente.', 500) : html('<h1>Erro interno</h1><p>Tente novamente em instantes.</p>', 500);
    }
  },
};
