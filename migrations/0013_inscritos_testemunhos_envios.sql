-- E-mails automáticos: inscritos, testemunhos publicados no site e fila de envio.

-- quem recebe os e-mails de novos artigos e testemunhos (pela conta de leitor ou pelo formulário do rodapé)
CREATE TABLE inscritos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  nome TEXT,
  leitor_id INTEGER UNIQUE REFERENCES leitores(id) ON DELETE CASCADE,
  origem TEXT NOT NULL CHECK (origem IN ('conta','rodape')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','ativo','cancelado')),
  token TEXT NOT NULL UNIQUE,
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  confirmado_em TEXT,
  cancelado_em TEXT
);
CREATE INDEX inscritos_status ON inscritos(status);

-- o leitor já respondeu se quer receber e-mails? (NULL = ainda não perguntamos)
ALTER TABLE leitores ADD COLUMN respondeu_email TEXT;

-- testemunhos publicados no site (o relato chega pelo formulário; a equipe publica aqui com a autorização dada)
CREATE TABLE testemunhos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  texto TEXT NOT NULL,
  assinatura TEXT,
  autorizacao TEXT NOT NULL CHECK (autorizacao IN ('anonimo','nome')),
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','publicado','arquivado')),
  criado_por INTEGER REFERENCES usuarios(id),
  atualizado_por INTEGER REFERENCES usuarios(id),
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now')),
  publicado_em TEXT
);
CREATE INDEX testemunhos_status ON testemunhos(status, publicado_em);

-- cada aviso enviado (um por artigo/testemunho, nunca repetido) e cada destinatário
CREATE TABLE envios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL CHECK (tipo IN ('artigo','testemunho')),
  ref_id INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'fila' CHECK (status IN ('fila','concluido','sem_servico')),
  total INTEGER NOT NULL DEFAULT 0,
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  concluido_em TEXT,
  UNIQUE (tipo, ref_id)
);

CREATE TABLE envio_destinos (
  envio_id INTEGER NOT NULL REFERENCES envios(id) ON DELETE CASCADE,
  inscrito_id INTEGER NOT NULL REFERENCES inscritos(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'fila' CHECK (status IN ('fila','enviado','falha','cancelado')),
  tentativas INTEGER NOT NULL DEFAULT 0,
  erro TEXT,
  enviado_em TEXT,
  PRIMARY KEY (envio_id, inscrito_id)
);
CREATE INDEX envio_destinos_fila ON envio_destinos(status);
