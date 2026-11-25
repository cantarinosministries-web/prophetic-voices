CREATE TABLE IF NOT EXISTS si_whatsapp_outbox (
  id TEXT PRIMARY KEY,
  local_date TEXT NOT NULL CHECK(local_date BETWEEN '2027-01-01' AND '2027-04-10'),
  day INTEGER NOT NULL CHECK(day BETWEEN 1 AND 100),
  mode TEXT NOT NULL CHECK(mode IN ('dry-run', 'manual')),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(local_date, mode)
);
