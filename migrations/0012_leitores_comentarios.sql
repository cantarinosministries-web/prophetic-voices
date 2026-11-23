-- Cadastro de leitores do site (login com Google, Apple, Facebook e Microsoft) e comentários públicos nos artigos.
-- É separado das contas do painel (tabela usuarios): leitor não tem acesso ao /admin.

CREATE TABLE leitores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT COLLATE NOCASE,
  bloqueado INTEGER NOT NULL DEFAULT 0,
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  ultimo_acesso TEXT
);
CREATE INDEX leitores_email ON leitores(email);

-- cada login (Google, Apple...) ligado a um leitor; um leitor pode ter vários
CREATE TABLE leitor_contas (
  provedor TEXT NOT NULL,
  sub TEXT NOT NULL,
  leitor_id INTEGER NOT NULL REFERENCES leitores(id) ON DELETE CASCADE,
  email TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (provedor, sub)
);
CREATE INDEX leitor_contas_leitor ON leitor_contas(leitor_id);

CREATE TABLE leitor_sessoes (
  token_hash TEXT PRIMARY KEY,
  leitor_id INTEGER NOT NULL REFERENCES leitores(id) ON DELETE CASCADE,
  criada_em TEXT NOT NULL DEFAULT (datetime('now')),
  expira_em TEXT NOT NULL
);
CREATE INDEX leitor_sessoes_leitor ON leitor_sessoes(leitor_id);

-- estado temporário de cada login em andamento (10 minutos)
CREATE TABLE login_estados (
  estado_hash TEXT PRIMARY KEY,
  provedor TEXT NOT NULL,
  verificador TEXT NOT NULL,
  nonce TEXT NOT NULL,
  volta TEXT,
  vincular_leitor INTEGER,
  concluido_leitor INTEGER,
  expira_em TEXT NOT NULL
);

CREATE TABLE comentarios_leitores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  artigo_id INTEGER NOT NULL REFERENCES artigos(id) ON DELETE CASCADE,
  leitor_id INTEGER NOT NULL REFERENCES leitores(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovado','rejeitado')),
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  moderado_em TEXT,
  moderado_por INTEGER REFERENCES usuarios(id)
);
CREATE INDEX comentarios_leitores_artigo ON comentarios_leitores(artigo_id, status);
CREATE INDEX comentarios_leitores_status ON comentarios_leitores(status, criado_em);
