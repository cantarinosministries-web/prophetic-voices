// No WhatsApp transport is bundled: the official Groups API cannot address the
// existing 361-member group. Live mode must fail closed, even if misconfigured.
export const CAMPAIGN = Object.freeze({ id: 'spirit-2027', start: '2027-01-01', end: '2027-04-10', days: 100, zone: 'America/Sao_Paulo' });
const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: CAMPAIGN.zone, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
export function configuration(env = {}) {
  const time = env.SI_TIME ?? '20:00';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('INVALID_TIME');
  const mode = env.SI_MODE ?? 'dry-run';
  if (!['dry-run', 'manual', 'live'].includes(mode)) throw new Error('INVALID_MODE');
  const url = new URL(env.SI_DIARY_URL ?? 'https://thepropheticvoices.com.br');
  if (url.protocol !== 'https:' || url.username || url.password || url.hostname === 'chat.whatsapp.com' || url.hostname.endsWith('.whatsapp.com')) throw new Error('INVALID_DIARY_URL');
  return { time, mode, diaryUrl: url.href };
}
export function plan(now, config) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) throw new Error('INVALID_DATE');
  const parts = Object.fromEntries(formatter.formatToParts(now).map(p => [p.type, p.value]));
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  if (date < CAMPAIGN.start) return { status: 'before' };
  if (date > CAMPAIGN.end) return { status: 'completed' };
  if (`${parts.hour}:${parts.minute}` < config.time) return { status: 'waiting' };
  const day = Math.round((Date.parse(date + 'T00:00:00Z') - Date.parse(CAMPAIGN.start + 'T00:00:00Z')) / 86400000) + 1;
  return { status: 'due', date, day, key: `${CAMPAIGN.id}:${date}:${config.mode}` };
}
export function message(day, config) {
  if (!Number.isInteger(day) || day < 1 || day > 100) throw new Error('INVALID_DAY');
  return `SPIRIT IMMERSION\nDIA ${day}/100\n\nVocê completou sua uma hora de oração hoje?\n\n✅ Sim\n❌ Ainda não\n\nLembre-se de atualizar o diário de oração.\n${config.diaryUrl}`;
}
export async function tick({ now = new Date(), env = {}, store, log = console.log }) {
  const config = configuration(env);
  const task = plan(now, config);
  if (task.status !== 'due') return task;
  // No credentials, destination ids, invite links or message contents in logs.
  if (config.mode === 'live') {
    log(JSON.stringify({ event: 'blocked', code: 'OFFICIAL_GROUP_UNSUPPORTED', day: task.day }));
    return { status: 'blocked', code: 'OFFICIAL_GROUP_UNSUPPORTED' };
  }
  const body = message(task.day, config);
  // Atomic unique insert, never SELECT-then-INSERT. DB failure is retried by the
  // next invocation, even after restart. No catch-up into a different local day.
  const created = await store.insert({ ...task, mode: config.mode, body, createdAt: now.toISOString() });
  const status = created ? (config.mode === 'dry-run' ? 'simulated' : 'prepared') : 'duplicate';
  log(JSON.stringify({ event: status, day: task.day, date: task.date }));
  return { status, day: task.day, date: task.date };
}
export function d1Store(db) {
  return { async insert(row) {
    const result = await db.prepare(`INSERT INTO si_whatsapp_outbox
      (id, local_date, day, mode, body, created_at) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO NOTHING`).bind(row.key, row.date, row.day, row.mode, row.body, row.createdAt).run();
    return result.meta.changes === 1;
  } };
}
