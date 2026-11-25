CREATE TABLE accounts (id TEXT PRIMARY KEY, handle TEXT UNIQUE NOT NULL, token_binding TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 0);
CREATE TABLE rules (id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id), media_id TEXT NOT NULL, keyword TEXT NOT NULL, reply TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 0, UNIQUE(account_id,media_id,keyword));
CREATE TABLE deliveries (account_id TEXT NOT NULL, comment_id TEXT NOT NULL, status TEXT NOT NULL, created_at INTEGER NOT NULL, PRIMARY KEY(account_id,comment_id));
CREATE TABLE budgets (day TEXT PRIMARY KEY, count INTEGER NOT NULL);
CREATE INDEX deliveries_age ON deliveries(created_at);
-- IDs must be obtained through Meta authorization; never infer account IDs from handles.
