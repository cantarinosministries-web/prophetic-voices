import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { configuration, plan, message, tick, d1Store } from '../automation/spirit-immersion/core.js';
import worker from '../automation/spirit-immersion/worker.js';
const migration = readFileSync(new URL('../automation/spirit-immersion/migrations/0001_outbox.sql', import.meta.url), 'utf8');
const quiet = () => {};
function sqlite(db) {
  db.exec(migration);
  return d1Store({ prepare(sql) { return { bind(...args) { return { async run() {
    return { meta: { changes: Number(db.prepare(sql).run(...args).changes) } };
  } }; } }; } });
}

test('100 dias inclusivos e limites no fuso America/Sao_Paulo', async () => {
  const db = new DatabaseSync(':memory:');
  const store = sqlite(db);
  const config = configuration();
  assert.equal(plan(new Date('2027-01-01T02:59:59Z'), config).status, 'before');
  assert.equal(plan(new Date('2027-01-01T22:59:59Z'), config).status, 'waiting');
  for (let day = 1; day <= 100; day++) {
    const now = new Date(Date.parse('2027-01-01T23:00:00Z') + (day - 1) * 86400000);
    assert.equal(plan(now, config).day, day);
    assert.equal((await tick({ now, store, log: quiet })).status, 'simulated');
    assert.equal((await tick({ now, store, log: quiet })).status, 'duplicate');
  }
  assert.equal(plan(new Date('2027-04-11T02:59:59Z'), config).day, 100);
  assert.equal(plan(new Date('2027-04-11T03:00:00Z'), config).status, 'completed');
  assert.equal((await tick({ now: new Date('2028-01-01'), store, log: quiet })).status, 'completed');
  assert.equal(db.prepare('SELECT count(*) AS n FROM si_whatsapp_outbox').get().n, 100);
  db.close();
});

test('horário e link configuráveis; texto solicitado; opções são texto, não botões', () => {
  const config = configuration({ SI_TIME: '00:00', SI_DIARY_URL: 'https://example.org/diario' });
  assert.equal(plan(new Date('2027-02-01T03:00:00Z'), config).day, 32);
  assert.equal(message(100, config), 'SPIRIT IMMERSION\nDIA 100/100\n\nVocê completou sua uma hora de oração hoje?\n\n✅ Sim\n❌ Ainda não\n\nLembre-se de atualizar o diário de oração.\nhttps://example.org/diario');
  for (const SI_TIME of ['24:00', '8:00', '12:60', '']) assert.throws(() => configuration({ SI_TIME }));
  for (const SI_DIARY_URL of ['http://example.com', 'https://u:p@example.com', 'https://chat.whatsapp.com/private']) assert.throws(() => configuration({ SI_DIARY_URL }));
  assert.throws(() => configuration({ SI_MODE: 'anything' }));
  assert.throws(() => plan(new Date('invalid'), config));
  for (const n of [0, 101, 1.5]) assert.throws(() => message(n, config));
});

test('invocações concorrentes produzem uma única entrada persistida', async () => {
  const db = new DatabaseSync(':memory:');
  const store = sqlite(db);
  const results = await Promise.all(Array.from({ length: 30 }, () => tick({ now: new Date('2027-02-01T23:00:00Z'), store, log: quiet })));
  assert.equal(results.filter(r => r.status === 'simulated').length, 1);
  assert.equal(results.filter(r => r.status === 'duplicate').length, 29);
  db.close();
});

test('reinício preserva deduplicação; modo manual tem fila separada', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'si-test-'));
  const path = join(dir, 'state.sqlite');
  const now = new Date('2027-01-15T23:00:00Z');
  try {
    let db = new DatabaseSync(path);
    await tick({ now, store: sqlite(db), log: quiet }); db.close();
    db = new DatabaseSync(path);
    assert.equal((await tick({ now, store: sqlite(db), log: quiet })).status, 'duplicate');
    assert.equal((await tick({ now, env: { SI_MODE: 'manual' }, store: sqlite(db), log: quiet })).status, 'prepared');
    db.close();
  } finally { rmSync(dir, { recursive: true }); }
});

test('falha antes/depois do commit é recuperada sem duplicar; não repõe dias perdidos', async () => {
  const db = new DatabaseSync(':memory:');
  const store = sqlite(db);
  const now = new Date('2027-03-01T23:00:00Z');
  await assert.rejects(tick({ now, store: { insert: async () => { throw new Error('offline'); } }, log: quiet }));
  await assert.rejects(tick({ now, store: { insert: async r => { await store.insert(r); throw new Error('lost response'); } }, log: quiet }));
  assert.equal((await tick({ now, store, log: quiet })).status, 'duplicate');
  assert.equal((await tick({ now: new Date('2027-03-03T23:00:00Z'), store, log: quiet })).status, 'simulated');
  assert.equal(db.prepare('SELECT count(*) AS n FROM si_whatsapp_outbox').get().n, 2);
  db.close();
});

test('live bloqueado antes de tocar no banco, sem vazar dados privados nos logs', async () => {
  const logs = [];
  const result = await tick({ now: new Date('2027-01-01T23:00:00Z'), env: { SI_MODE: 'live', SI_DIARY_URL: 'https://example.org/?secret=private' }, store: { insert() { assert.fail('live cannot enqueue'); } }, log: s => logs.push(s) });
  assert.equal(result.status, 'blocked');
  assert.doesNotMatch(logs.join(''), /private|https|secret/);
});

test('Worker não expõe endpoint de envio ou simulação e não aceita data de teste', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-11-25T12:00:00Z') });
  assert.equal((await worker.fetch(new Request('https://example.org/send', { method: 'POST' }))).status, 404);
  // Current date is intentionally not overridden by SI_HOJE_TESTE or the trigger.
  await worker.scheduled({ scheduledTime: Date.parse('2027-01-01T23:00:00Z') }, { SI_HOJE_TESTE: '2027-01-01' });
});

test('handler scheduled usa D1 e mantém unicidade sob reexecução', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2027-04-10T23:00:00Z') });
  const db = new DatabaseSync(':memory:');
  db.exec(migration);
  const SI_DB = { prepare(sql) { return { bind(...args) { return { async run() {
    return { meta: { changes: Number(db.prepare(sql).run(...args).changes) } };
  } }; } }; } };
  t.mock.method(console, 'log', quiet);
  await worker.scheduled({}, { SI_DB });
  await worker.scheduled({}, { SI_DB });
  assert.equal(db.prepare('SELECT count(*) AS n FROM si_whatsapp_outbox').get().n, 1);
  assert.equal(db.prepare('SELECT day FROM si_whatsapp_outbox').get().day, 100);
  db.close();
});

test('handler sinaliza falha sem registrar exceção possivelmente sensível', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2027-01-01T23:00:00Z') });
  const logger = t.mock.method(console, 'error', quiet);
  await assert.rejects(worker.scheduled({}, { SI_DB: { prepare() { throw new Error('secret-token'); } } }), /SPIRIT_SCHEDULER_FAILURE/);
  assert.doesNotMatch(JSON.stringify(logger.mock.calls), /secret-token/);
});
