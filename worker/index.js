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
import { spiritPublico, pdfDevocional, processarFilaSpirit } from './spirit.js';

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

// Leitura e download dos artigos (decisão de Gabriel, 22 e 23/11/2026):
//   acesso 'livre'    -> domínio público ou licença aberta: qualquer pessoa lê e baixa
//   acesso 'cadastro' -> publicado com autorização (ou sem licença aberta): gratuito, mas exige conta de leitor
async function acessoLeitura(env, req, artigo) {
  if (artigo && artigo.acesso === 'livre') return { livre: true, aberto: true };
  const leitor = await leitorDaSessao(env, req);
  if (leitor && !leitor.bloqueado) return { livre: true };
  if (await usuarioDaSessao(env, req)) return { livre: true };
  return { livre: false };
}

async function negarArquivo(env, req, artigo, ref) {
  if (!artigo) return naoEncontrado(env, req);
  if (artigo.status !== 'publicado') {
    const usuario = await usuarioDaSessao(env, req);
    return usuario && pode(usuario, 'ver_rascunhos') ? null : naoEncontrado(env, req);
  }
  if (artigo.pdf_url === ref && !(await acessoLeitura(env, req, artigo)).livre) {
    return pedirCadastro(req, artigo.slug);
  }
  return null;
}

function cacheArquivo(artigo, ref) {
  return artigo.status === 'publicado' && (artigo.pdf_url !== ref || artigo.acesso === 'livre')
    ? 'public, no-cache' : 'private, no-store';
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
    ctx.waitUntil(processarFilaSpirit(env).catch((e) => console.error('fila do Spirit Immersion', e)));
  },

  async fetch(req, env, ctx) {
    globalThis.__SI_HOJE = /^\d{4}-\d{2}-\d{2}$/.test(env.SI_HOJE_TESTE || '') ? env.SI_HOJE_TESTE : undefined;
    const url = new URL(req.url);
    let path = url.pathname;
    try {
      if (/^\/artigos\/arquivo-[\w.-]+\.pdf$/.test(path)) {
        path = path.replace('/artigos/arquivo-', '/arquivos/artigos/');
      }
      if (path === '/api/loja/mp/webhook') return await webhookMercadoPago(req, env, url);
      if (path.startsWith('/auth/')) return await rotaAuth(req, env, url);
      if (path.startsWith('/email/')) return await rotaEmail(req, env, url);
      if (path.startsWith('/api/')) {
        if (!origemOk(req)) return erro('Pedido recusado.', 403);
        if (path.startsWith('/api/loja/publico/')) return await apiLojaPublica(req, env, url);
        if (path.startsWith('/api/conta/') || path === '/api/conta' || path.startsWith('/api/comentarios/')) return await apiLeitores(req, env, url);
        if (path === '/api/newsletter') return await apiNewsletter(req, env);
        if (path === '/api/publico/testemunhos' && req.method === 'GET') return await testemunhosPublicos(env);
        if (path === '/api/publico/spirit' && req.method === 'GET') return await spiritPublico(env);
        return await api(req, env, url, ctx);
      }

      if (path === '/sitemap.xml') {
        const fixas = ['/', '/artigos.html', '/cursos', '/novidades', '/testemunhos', '/proponha', '/loja'];
        const { results } = await env.DB.prepare("SELECT slug FROM artigos WHERE status = 'publicado' ORDER BY slug").all();
        const urls = [...fixas, ...results.map(({ slug }) => '/artigos/' + encodeURIComponent(slug) + '.html')];
        const xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
          + urls.map((u) => '<url><loc>https://thepropheticvoices.com.br' + u + '</loc></url>').join('') + '</urlset>';
        return new Response(xml, { headers: cabecalhos(new Headers({ 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'no-cache' })) });
      }

      if (path === '/artigos.html' || path === '/artigos' || path === '/artigos/') {
        return html(await paginaLista(env, req, await publicados(env), !(await acessoLeitura(env, req)).livre, provedoresAtivos(env).length > 0), 200, true);
      }

      if (path.startsWith('/artigos/')) {
        const nome = decodeURIComponent(path.slice('/artigos/'.length));
        if (/\.(pdf|jpe?g|png|webp)$/i.test(nome)) {
          const ref = '/artigos/' + nome;
          const a = await env.DB.prepare("SELECT id, slug, status, pdf_url, acesso FROM artigos WHERE pdf_url = ? OR capa_url = ? ORDER BY status = 'publicado' DESC").bind(ref, ref).first();
          const negado = await negarArquivo(env, req, a, ref);
          if (negado) return negado;
          const r = await env.ASSETS.fetch(req);
          if (r.ok && a.status === 'publicado' && a.pdf_url === ref) contar(env, ctx, req, a.id, 'downloads');
          const h = new Headers(r.headers);
          h.set('Cache-Control', cacheArquivo(a, ref));
          return new Response(r.body, { status: r.status, headers: h });
        }
        const slug = nome.replace(/\.html$/, '');
        if (!slug || slug === 'modelo' || slug.includes('/')) return naoEncontrado(env, req);
        const a = await env.DB.prepare('SELECT * FROM artigos WHERE slug = ?').bind(slug).first();
        if (!a) {
          const alias = await env.DB.prepare("SELECT a.slug FROM artigos_enderecos e JOIN artigos a ON a.id = e.artigo_id WHERE e.slug = ? AND a.status = 'publicado'").bind(slug).first();
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
        const comentarios = !previa && provedoresAtivos(env).length > 0;
        const bloqueado = !previa && !(await acessoLeitura(env, req, a)).livre;
        const pagina = html(await paginaArtigo(env, req, a, rel, previa, numeros, comentarios, bloqueado), 200, previa || a.acesso !== 'livre');
        if (!previa) contar(env, ctx, req, a.id, 'acessos');
        return pagina;
      }

      if (path.startsWith('/arquivos/')) {
        const chave = decodeURIComponent(path.slice('/arquivos/'.length));
        if (/^spirit\/[\w.-]+\.pdf$/.test(chave)) {
          // devocionais do Spirit Immersion: só participantes inscritos (e a equipe logada no painel)
          const obj = await pdfDevocional(env, req, chave, { leitor: await leitorDaSessao(env, req), equipe: !!(await usuarioDaSessao(env, req)) });
          if (obj === 'negado') return new Response(null, { status: 303, headers: cabecalhos(new Headers({ Location: '/spirit-immersion.html', 'Cache-Control': 'no-store' })) });
          if (!obj) return naoEncontrado(env, req);
          const h = cabecalhos(new Headers());
          obj.writeHttpMetadata(h);
          h.set('Cache-Control', 'private, no-store');
          return new Response(obj.body, { headers: h });
        }
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
        const a = await env.DB.prepare('SELECT id, slug, status, pdf_url, acesso FROM artigos WHERE pdf_url = ? OR capa_url = ?').bind(ref, ref).first();
        const negado = await negarArquivo(env, req, a, ref);
        if (negado) return negado;
        const obj = await env.ARQUIVOS.get(chave);
        if (!obj) return naoEncontrado(env, req);
        const h = cabecalhos(new Headers());
        obj.writeHttpMetadata(h);
        h.set('ETag', obj.httpEtag);
        h.set('Cache-Control', cacheArquivo(a, ref));
        if (a.status === 'publicado' && a.pdf_url === ref) contar(env, ctx, req, a.id, 'downloads');
        return new Response(obj.body, { headers: h });
      }

      return env.ASSETS.fetch(req);
    } catch (e) {
      console.error(`erro: ${e?.message || e}`, e?.stack || "");
      return path.startsWith('/api/') ? erro('Erro interno. Tente novamente.', 500) : html('<h1>Erro interno</h1><p>Tente novamente em instantes.</p>', 500);
    }
  },
};
