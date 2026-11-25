// Local persistent dry-run/manual outbox. Node >=22.13; no network or WhatsApp login.
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { tick } from './core.js';
const root = fileURLToPath(new URL('.', import.meta.url));
const state = resolve(root, '.local');
mkdirSync(state, { recursive: true, mode: 0o700 });
const db = new DatabaseSync(resolve(state, 'outbox.sqlite'));
db.exec(readFileSync(new URL('./migrations/0001_outbox.sql', import.meta.url), 'utf8'));
const args = process.argv.slice(2);
const command = args[0] ?? 'tick';
try {
  if (command === 'list') {
    console.log(JSON.stringify(db.prepare('SELECT local_date, day, mode, created_at FROM si_whatsapp_outbox ORDER BY local_date').all(), null, 2));
  } else if (command === 'export') {
    if (!/^2027-\d{2}-\d{2}$/.test(args[1] ?? '')) throw new Error('Use export YYYY-MM-DD');
    const row = db.prepare('SELECT body FROM si_whatsapp_outbox WHERE local_date = ? AND mode = ?').get(args[1], process.env.SI_MODE ?? 'dry-run');
    if (!row) throw new Error('No prepared message');
    console.log(row.body);
  } else if (command === 'tick') {
    // Simulation override exists ONLY in this local executable, never in Worker.
    const now = args[1] ? new Date(args[1]) : new Date();
    const store = { async insert(row) {
      return db.prepare('INSERT INTO si_whatsapp_outbox VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING')
        .run(row.key, row.date, row.day, row.mode, row.body, row.createdAt).changes === 1;
    } };
    console.log(JSON.stringify(await tick({ now, env: process.env, store })));
  } else throw new Error('Use tick [ISO timestamp], list, or export YYYY-MM-DD');
} finally { db.close(); }
