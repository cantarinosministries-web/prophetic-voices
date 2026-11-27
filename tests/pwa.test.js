import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const manifest = JSON.parse(readFileSync(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'));
function worker(fetch) {
  const events = {};
  const self = { location: { origin: 'https://example.invalid' }, addEventListener(name, fn) { events[name] = fn; }, skipWaiting() {}, clients: { claim() {} }, registration: {} };
  vm.runInNewContext(readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8'), { self, URL, Response, fetch });
  return events;
}
test('manifest launches account without identifiers and icons have the declared dimensions', () => {
  assert.equal(manifest.start_url, '/conta.html#spirit'); assert.equal(manifest.display, 'standalone'); assert.equal(manifest.scope, '/');
  assert.equal(manifest.id, '/'); assert.equal(manifest.name, 'The Prophetic Voices');
  for (const icon of manifest.icons) {
    const png = readFileSync(new URL('../public' + icon.src, import.meta.url));
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
  }
});
test('worker leaves authentication, APIs, writes and cross-origin requests untouched', () => {
  const events = worker(() => { throw Error('must not fetch'); });
  for (const [path, method, mode] of [['/auth/google','GET','navigate'],['/api/conta/spirit','GET','navigate'],['/email/confirmar','GET','navigate'],['/arquivos/test.pdf','GET','navigate'],['/api/conta/spirit','POST','cors'],['https://accounts.google.com/','GET','navigate'],['/conta/spirit.js','GET','cors']]) {
    let intercepted = false;
    events.fetch({ request: { url: new URL(path, 'https://example.invalid').href, method, mode }, respondWith() { intercepted = true; } });
    assert.equal(intercepted, false, path);
  }
});
test('navigation goes to the network and keeps normal browser caching (no forced no-store)', async () => {
  const events = worker(async (_, options) => { assert.equal(options, undefined); return new Response('fresh page'); });
  let response;
  events.fetch({ request: { url: 'https://example.invalid/conta.html', method: 'GET', mode: 'navigate' }, respondWith(promise) { response = promise; } });
  assert.equal(await (await response).text(), 'fresh page');
});
test('offline fallback contains no private data and never queues a write or populates cache', async () => {
  const events = worker(async () => { throw Error('offline'); });
  let response;
  events.fetch({ request: { url: 'https://example.invalid/conta.html', method: 'GET', mode: 'navigate' }, respondWith(promise) { response = promise; } });
  const r = await response;
  assert.equal(r.status, 503); assert.equal(r.headers.get('Cache-Control'), 'no-store'); assert.match(await r.text(), /Você está sem conexão/);
  assert.doesNotMatch(readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8'), /caches\.(open|put|match)|indexedDB|localStorage/);
});
