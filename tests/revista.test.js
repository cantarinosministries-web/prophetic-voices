import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../worker/index.js';

const ctx = { waitUntil() {} };
const url = 'https://thepropheticvoices.com.br';

function ambiente(artigo) {
  return {
    DB: { prepare(sql) {
      return {
        bind() { return this; },
        async first() { return artigo; },
        async all() { return { results: sql.includes("status = 'publicado'") ? [{ slug: 'publicado' }] : [] }; },
        async run() {},
      };
    } },
    ASSETS: { fetch: async () => new Response('arquivo') },
    ARQUIVOS: { get: async () => ({ body: 'arquivo', httpEtag: '"pdf"', writeHttpMetadata() {} }) },
  };
}

test('PDFs estáticos e do painel obedecem à mesma regra editorial', async () => {
  for (const path of ['/artigos/teste.pdf', '/arquivos/artigos/teste.pdf', '/artigos/arquivo-teste.pdf']) {
    const artigo = { id: 1, slug: 'teste', status: 'publicado', acesso: 'cadastro',
      pdf_url: path === '/artigos/arquivo-teste.pdf' ? '/arquivos/artigos/teste.pdf' : path };
    const pedido = () => new Request(url + path);
    assert.equal((await worker.fetch(pedido(), ambiente(artigo), ctx)).status, 303);
    artigo.acesso = 'livre';
    assert.equal((await worker.fetch(pedido(), ambiente(artigo), ctx)).status, 200);
    artigo.status = 'arquivado';
    assert.equal((await worker.fetch(pedido(), ambiente(artigo), ctx)).status, 404);
    assert.equal((await worker.fetch(pedido(), ambiente(null), ctx)).status, 404);
  }
});

test('sitemap publica endereços da revista e newsletter informa quando está desativada', async () => {
  const sitemap = await worker.fetch(new Request(url + '/sitemap.xml'), ambiente(null), ctx);
  assert.equal(sitemap.status, 200);
  assert.match(await sitemap.text(), /\/artigos\/publicado\.html/);
  const newsletter = await worker.fetch(new Request(url + '/api/newsletter'), ambiente(null), ctx);
  assert.deepEqual(await newsletter.json(), { disponivel: false });
});
