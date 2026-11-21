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
import { contar, contavel, totaisArtigo } from './estatisticas.js';

function html(texto, status = 200, privado = false) {
  const h = cabecalhos(new Headers({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': privado ? 'private, no-store' : 'no-cache' }));
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
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const path = url.pathname;
    try {
      if (path === '/api/loja/mp/webhook') return await webhookMercadoPago(req, env, url);
      if (path.startsWith('/api/')) {
        if (!origemOk(req)) return erro('Pedido recusado.', 403);
        if (path.startsWith('/api/loja/publico/')) return await apiLojaPublica(req, env, url);
        return await api(req, env, url);
      }

      if (path === '/sitemap.xml') {
        const canonico = 'https://thepropheticvoices.com.br';
        const fixas = ['/', '/artigos.html', '/cursos', '/novidades', '/testemunhos', '/loja'];
        const linhas = (await env.DB.prepare("SELECT slug FROM artigos WHERE status = 'publicado' ORDER BY slug").all()).results;
        const urls = [...fixas, ...linhas.map(({ slug }) => '/artigos/' + encodeURIComponent(slug) + '.html')];
        const xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
          + urls.map((u) => '<url><loc>' + canonico + u + '</loc></url>').join('') + '</urlset>';
        return new Response(xml, { headers: cabecalhos(new Headers({ 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'no-cache' })) });
      }

      if (path === '/artigos.html' || path === '/artigos' || path === '/artigos/') {
        return html(await paginaLista(env, req, await publicados(env)));
      }

      if (path.startsWith('/artigos/')) {
        const nome = decodeURIComponent(path.slice('/artigos/'.length));
        if (/\.(pdf|jpe?g|png|webp)$/i.test(nome)) {
          const ref = '/artigos/' + nome;
          const a = await env.DB.prepare("SELECT id, pdf_url FROM artigos WHERE status = 'publicado' AND (pdf_url = ? OR capa_url = ?)").bind(ref, ref).first();
          if (!a) {
            const u = await usuarioDaSessao(env, req);
            if (!pode(u, 'ver_rascunhos')) return naoEncontrado(env, req);
            const privada = await env.DB.prepare('SELECT 1 FROM artigos WHERE pdf_url = ? OR capa_url = ?').bind(ref, ref).first();
            if (!privada) return naoEncontrado(env, req);
          }
          const r = await env.ASSETS.fetch(req);
          const headers = new Headers(r.headers);
          headers.set('Cache-Control', a ? 'public, no-cache' : 'private, no-store');
          if (a && r.ok && a.pdf_url === ref) contar(env, ctx, req, a.id, 'downloads');
          return new Response(r.body, { status: r.status, headers });
        }
        const slug = nome.replace(/\.html$/, '');
        if (!slug || slug === 'modelo' || slug.includes('/')) return naoEncontrado(env, req);
        const a = await env.DB.prepare('SELECT * FROM artigos WHERE slug = ?').bind(slug).first();
        if (!a) {
          const alias = await env.DB.prepare(`SELECT a.slug FROM artigos_enderecos e JOIN artigos a ON a.id = e.artigo_id
            WHERE e.slug = ? AND a.status = 'publicado'`).bind(slug).first();
          if (alias) return Response.redirect(new URL('/artigos/' + encodeURIComponent(alias.slug) + '.html', req.url), 301);
          return naoEncontrado(env, req);
        }
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
        const pagina = html(await paginaArtigo(env, req, a, rel, previa, numeros), 200, previa);
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
        const a = await env.DB.prepare('SELECT id, status, pdf_url FROM artigos WHERE pdf_url = ? OR capa_url = ?').bind(ref, ref).first();
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
        h.set('Cache-Control', a.status === 'publicado' ? 'public, no-cache' : 'private, no-store');
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
