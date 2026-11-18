// The Prophetic Voices — servidor (Cloudflare Worker).
// Os arquivos estáticos do Astro saem direto da pasta dist; este Worker cuida de:
//   /api/*          API do painel (usuários, artigos, comentários)
//   /artigos.html   lista da revista, montada a partir do banco
//   /artigos/<x>    página de cada artigo (PDFs e capas estáticos seguem para os arquivos)
//   /arquivos/*     PDFs e capas enviados pelo painel e fotos da loja (R2)
//   /api/loja/*     loja virtual (ver worker/loja.js)
import { api, usuarioDaSessao } from './api.js';
import { paginaLista, paginaArtigo } from './paginas.js';
import { origemOk, erro, cabecalhos } from './seguranca.js';
import { pode } from './permissoes.js';
import { apiLojaPublica, webhookMercadoPago } from './loja.js';

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

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const path = url.pathname;
    try {
      if (path === '/api/loja/mp/webhook') return await webhookMercadoPago(req, env, url);
      if (path.startsWith('/api/')) {
        if (!origemOk(req)) return erro('Pedido recusado.', 403);
        if (path.startsWith('/api/loja/publico/')) return await apiLojaPublica(req, env, url);
        return await api(req, env, url);
      }

      if (path === '/artigos.html' || path === '/artigos' || path === '/artigos/') {
        return html(await paginaLista(env, req, await publicados(env)));
      }

      if (path.startsWith('/artigos/')) {
        const nome = decodeURIComponent(path.slice('/artigos/'.length));
        if (/\.(pdf|jpe?g|png|webp)$/i.test(nome)) return env.ASSETS.fetch(req);
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
        return html(await paginaArtigo(env, req, a, rel, previa));
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
        const a = await env.DB.prepare('SELECT status FROM artigos WHERE pdf_url = ? OR capa_url = ?').bind(ref, ref).first();
        if (!a) return naoEncontrado(env, req);
        if (a.status !== 'publicado') {
          const u = await usuarioDaSessao(env, req);
          if (!u || !pode(u, 'ver_rascunhos')) return naoEncontrado(env, req);
        }
        const obj = await env.ARQUIVOS.get(chave);
        if (!obj) return naoEncontrado(env, req);
        const h = cabecalhos(new Headers());
        obj.writeHttpMetadata(h);
        h.set('ETag', obj.httpEtag);
        h.set('Cache-Control', a.status === 'publicado' ? 'public, max-age=86400' : 'private, no-store');
        return new Response(obj.body, { headers: h });
      }

      return env.ASSETS.fetch(req);
    } catch (e) {
      console.error(e);
      return path.startsWith('/api/') ? erro('Erro interno. Tente novamente.', 500) : html('<h1>Erro interno</h1><p>Tente novamente em instantes.</p>', 500);
    }
  },
};
