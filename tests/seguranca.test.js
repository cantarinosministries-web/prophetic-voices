import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lerCookie, origemOk } from '../worker/seguranca.js';

test('cookie inválido é tratado como sessão ausente', () => {
  const req = new Request('https://example.com', { headers: { Cookie: 'pv_sessao=%' } });
  assert.equal(lerCookie(req, 'pv_sessao'), null);
});

test('escritas com origem externa são rejeitadas', () => {
  const req = new Request('https://example.com', {
    method: 'POST',
    headers: { Origin: 'https://outro.example', 'X-PV': '1' },
  });
  assert.equal(origemOk(req), false);
});

test('sitemap só pede artigos publicados e retorna XML', async () => {
  const { default: worker } = await import('../worker/index.js');
  const env = { DB: { prepare(sql) {
    assert.match(sql, /status = 'publicado'/);
    return { all: async () => ({ results: [{ slug: 'estudo' }] }) };
  } } };
  const res = await worker.fetch(new Request('https://example.com/sitemap.xml'), env);
  assert.equal(res.status, 200);
  assert.match(await res.text(), /<loc>https:\/\/thepropheticvoices\.com\.br\/artigos\/estudo\.html<\/loc>/);
});

test('arquivo estático arquivado não é servido pela rota pública', async () => {
  const { default: worker } = await import('../worker/index.js');
  const consultas = [];
  const env = {
    DB: { prepare(sql) {
      consultas.push(sql);
      return { bind: () => ({ first: async () => null }) };
    } },
    ASSETS: { fetch: async (req) => {
      assert.equal(new URL(req.url).pathname, '/404.html');
      return new Response('Não encontrado');
    } },
  };
  const res = await worker.fetch(new Request('https://example.com/artigos/arquivado.pdf'), env);
  assert.equal(res.status, 404);
  assert.match(consultas[0], /status = 'publicado'/);
});
