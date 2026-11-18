-- Plataforma The Prophetic Voices: usuários, sessões, convites, artigos, comentários e histórico.

CREATE TABLE usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  nome TEXT NOT NULL,
  papel TEXT NOT NULL CHECK (papel IN ('proprietario','administrador','editor','autor','revisor','leitor')),
  senha_hash TEXT NOT NULL,
  senha_sal TEXT NOT NULL,
  ativo INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  ultimo_acesso TEXT
);

CREATE TABLE sessoes (
  token_hash TEXT PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  criada_em TEXT NOT NULL DEFAULT (datetime('now')),
  expira_em TEXT NOT NULL
);
CREATE INDEX sessoes_usuario ON sessoes(usuario_id);

-- convites (novo usuário) e links de redefinição de senha
CREATE TABLE convites (
  token_hash TEXT PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('convite','redefinicao')),
  email TEXT NOT NULL COLLATE NOCASE,
  nome TEXT,
  papel TEXT,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  criado_por INTEGER REFERENCES usuarios(id),
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  expira_em TEXT NOT NULL,
  usado_em TEXT
);

CREATE TABLE tentativas_login (
  chave TEXT NOT NULL,
  em TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX tentativas_chave ON tentativas_login(chave, em);

CREATE TABLE artigos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','revisao','publicado','arquivado')),
  tipo TEXT NOT NULL DEFAULT 'traducao' CHECK (tipo IN ('traducao','original')),
  titulo TEXT NOT NULL,
  titulo_original TEXT,
  autor TEXT NOT NULL,
  autor_citacao TEXT,
  afiliacao TEXT,
  tradutor TEXT,
  periodico TEXT,
  volume TEXT,
  numero TEXT,
  ano TEXT,
  mes TEXT,
  paginas_original TEXT,
  editora_original TEXT,
  url_original TEXT,
  area TEXT NOT NULL DEFAULT 'Antigo Testamento',
  tema TEXT,
  tema_en TEXT,
  resumo TEXT,
  resumo_en TEXT,
  resumo_editorial INTEGER NOT NULL DEFAULT 1,
  palavras_chave TEXT NOT NULL DEFAULT '[]',
  direitos TEXT,
  pdf_url TEXT,
  pdf_paginas INTEGER,
  capa_url TEXT,
  criado_por INTEGER REFERENCES usuarios(id),
  atualizado_por INTEGER REFERENCES usuarios(id),
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now')),
  publicado_em TEXT
);
CREATE INDEX artigos_status ON artigos(status);

CREATE TABLE comentarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  artigo_id INTEGER NOT NULL REFERENCES artigos(id) ON DELETE CASCADE,
  usuario_id INTEGER REFERENCES usuarios(id),
  texto TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX comentarios_artigo ON comentarios(artigo_id);

CREATE TABLE historico (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER REFERENCES usuarios(id),
  acao TEXT NOT NULL,
  alvo TEXT,
  detalhe TEXT,
  em TEXT NOT NULL DEFAULT (datetime('now'))
);
