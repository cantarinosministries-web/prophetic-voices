// Estatísticas da revista: conta acessos às páginas dos artigos e downloads dos PDFs,
// e monta o relatório do painel. Guarda só totais por dia e país: nenhum IP, cookie ou dado pessoal.
import { lerCookie, COOKIE, json, erro } from './seguranca.js';

// robôs, pré-visualizações de links e ferramentas automáticas ficam fora da contagem
const ROBO = /bot|crawl|spider|slurp|archiver|facebookexternalhit|whatsapp|telegram|discord|preview|embedly|curl|wget|python|java\/|go-http|okhttp|headless|lighthouse|pingdom|uptime|monitor|scanner/i;

const hoje = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10); // horário de Brasília

export function contavel(req) {
  if (req.method !== 'GET') return false;
  const ua = req.headers.get('User-Agent') || '';
  if (!ua || ROBO.test(ua)) return false;
  if (lerCookie(req, COOKIE)) return false; // equipe logada no painel
  const prop = req.headers.get('Sec-Purpose') || req.headers.get('Purpose') || '';
  if (/prefetch|prerender/i.test(prop)) return false;
  return true;
}

// tipo: 'acessos' (página do artigo) ou 'downloads' (PDF)
export function contar(env, ctx, req, artigoId, tipo) {
  if (!artigoId || !contavel(req)) return;
  if (tipo === 'downloads') {
    // o leitor embutido na página do artigo não conta como download; nem os pedaços que o visualizador de PDF pede depois do primeiro
    const destino = req.headers.get('Sec-Fetch-Dest') || '';
    if (['iframe', 'embed', 'object', 'frame'].includes(destino)) return;
    if (req.headers.get('X-PV-Leitor')) return; // leitor de PDF próprio da página (pdf.js)
    const faixa = req.headers.get('Range');
    if (faixa && !/^bytes=0-/.test(faixa)) return;
  }
  const pais = /^[A-Z]{2}$/.test(req.cf && req.cf.country || '') ? req.cf.country : 'XX';
  const a = tipo === 'acessos' ? 1 : 0;
  const p = env.DB.prepare(
    `INSERT INTO estatisticas (artigo_id, dia, pais, acessos, downloads) VALUES (?,?,?,?,?)
     ON CONFLICT(artigo_id, dia, pais) DO UPDATE SET acessos = acessos + excluded.acessos, downloads = downloads + excluded.downloads`,
  ).bind(artigoId, hoje(), pais, a, 1 - a).run().catch((e) => console.error('estatísticas', e));
  if (ctx && ctx.waitUntil) ctx.waitUntil(p);
}

// totais de sempre de um artigo, para mostrar na própria página
export async function totaisArtigo(env, artigoId) {
  const r = await env.DB.prepare('SELECT COALESCE(SUM(acessos), 0) acessos, COALESCE(SUM(downloads), 0) downloads FROM estatisticas WHERE artigo_id = ?').bind(artigoId).first();
  return { acessos: r ? r.acessos : 0, downloads: r ? r.downloads : 0 };
}

// GET /api/estatisticas?de=AAAA-MM-DD&ate=AAAA-MM-DD&artigo=<slug>
export async function relatorio(env, url) {
  const dataOk = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
  const de = dataOk(url.searchParams.get('de')) ? url.searchParams.get('de') : '2000-01-01';
  const ate = dataOk(url.searchParams.get('ate')) ? url.searchParams.get('ate') : '2999-12-31';
  const slug = url.searchParams.get('artigo') || '';
  let artigo = null;
  if (slug) {
    artigo = await env.DB.prepare('SELECT id, slug, titulo, titulo_original, autor, periodico, volume, numero, ano, paginas_original, editora_original, url_original, publicado_em, status FROM artigos WHERE slug = ?').bind(slug).first();
    if (!artigo) return erro('Artigo não encontrado.', 404);
  }
  const filtro = artigo ? ' AND artigo_id = ?' : '';
  const args = artigo ? [de, ate, artigo.id] : [de, ate];
  const artigos = (await env.DB.prepare(
    `SELECT a.id, a.slug, a.titulo, a.autor, a.periodico, a.ano, a.status, a.publicado_em,
            COALESCE(SUM(e.acessos), 0) acessos, COALESCE(SUM(e.downloads), 0) downloads,
            COUNT(DISTINCT CASE WHEN e.pais <> 'XX' AND (e.acessos + e.downloads) > 0 THEN e.pais END) paises
       FROM artigos a LEFT JOIN estatisticas e ON e.artigo_id = a.id AND e.dia BETWEEN ? AND ?
      WHERE a.status IN ('publicado','arquivado')${artigo ? ' AND a.id = ?' : ''}
      GROUP BY a.id ORDER BY (acessos + downloads) DESC, a.titulo`,
  ).bind(...args).all()).results;
  const meses = (await env.DB.prepare(
    `SELECT substr(dia, 1, 7) mes, SUM(acessos) acessos, SUM(downloads) downloads FROM estatisticas
      WHERE dia BETWEEN ? AND ?${filtro} GROUP BY mes ORDER BY mes`,
  ).bind(...args).all()).results;
  const paises = (await env.DB.prepare(
    `SELECT pais, SUM(acessos) acessos, SUM(downloads) downloads FROM estatisticas
      WHERE dia BETWEEN ? AND ?${filtro} GROUP BY pais HAVING SUM(acessos + downloads) > 0 ORDER BY SUM(acessos + downloads) DESC`,
  ).bind(...args).all()).results;
  const inicio = (await env.DB.prepare(`SELECT MIN(dia) d FROM estatisticas${artigo ? ' WHERE artigo_id = ?' : ''}`).bind(...(artigo ? [artigo.id] : [])).first()).d;
  const soma = (k) => artigos.reduce((t, a) => t + a[k], 0);
  return json({
    periodo: { de, ate }, contagem_desde: inicio, artigo,
    totais: { acessos: soma('acessos'), downloads: soma('downloads'), paises: paises.filter((p) => p.pais !== 'XX').length },
    artigos, meses, paises,
  });
}
