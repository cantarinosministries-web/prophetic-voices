-- Acesso por artigo e Biblioteca do leitor (23/11/2026, pedido do Gabriel).
--   acesso: 'livre' (domínio público ou licença aberta: qualquer um lê e baixa)
--           'cadastro' (publicado com autorização ou sem licença aberta: leitura gratuita com login)
-- O editor escolhe no painel, artigo por artigo.

ALTER TABLE artigos ADD COLUMN acesso TEXT NOT NULL DEFAULT 'cadastro' CHECK (acesso IN ('livre','cadastro'));

-- domínio público (Walker 1902, Price 1889, Jastrow 1909, Bernard 1905, Cassuto 1943) e licença aberta CC BY 4.0 (Widder 2014)
UPDATE artigos SET acesso = 'livre' WHERE slug IN (
  'walker-profetas-verdadeiros-falsos', 'price-escolas-filhos-profetas', 'jastrow-roeh-hozeh',
  'bernard-profetas-novo-testamento', 'cassuto-filhos-de-deus', 'widder-historias-de-corte-jose-daniel'
);

-- histórico de leitura ("Continuar lendo"): opcional. NULL = ainda não respondeu; 1 = ligado; 0 = desligado
ALTER TABLE leitores ADD COLUMN historico INTEGER;
-- interesse em escrever para a revista: NULL, 'academico', 'ensaio' ou 'ambos'
ALTER TABLE leitores ADD COLUMN interesse_autor TEXT;
ALTER TABLE leitores ADD COLUMN interesse_autor_em TEXT;

CREATE TABLE leitor_salvos (
  leitor_id INTEGER NOT NULL REFERENCES leitores(id) ON DELETE CASCADE,
  artigo_id INTEGER NOT NULL REFERENCES artigos(id) ON DELETE CASCADE,
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (leitor_id, artigo_id)
);

CREATE TABLE leitor_colecoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  leitor_id INTEGER NOT NULL REFERENCES leitores(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX leitor_colecoes_leitor ON leitor_colecoes(leitor_id);

CREATE TABLE leitor_colecao_itens (
  colecao_id INTEGER NOT NULL REFERENCES leitor_colecoes(id) ON DELETE CASCADE,
  artigo_id INTEGER NOT NULL REFERENCES artigos(id) ON DELETE CASCADE,
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (colecao_id, artigo_id)
);

CREATE TABLE leitor_citacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  leitor_id INTEGER NOT NULL REFERENCES leitores(id) ON DELETE CASCADE,
  artigo_id INTEGER NOT NULL REFERENCES artigos(id) ON DELETE CASCADE,
  trecho TEXT NOT NULL,
  pagina INTEGER,
  nota TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX leitor_citacoes_leitor ON leitor_citacoes(leitor_id, criado_em);

-- onde o leitor parou em cada artigo; só é gravado com o histórico ligado
CREATE TABLE leitor_progresso (
  leitor_id INTEGER NOT NULL REFERENCES leitores(id) ON DELETE CASCADE,
  artigo_id INTEGER NOT NULL REFERENCES artigos(id) ON DELETE CASCADE,
  pagina INTEGER NOT NULL,
  total INTEGER,
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (leitor_id, artigo_id)
);
CREATE INDEX leitor_progresso_leitor ON leitor_progresso(leitor_id, atualizado_em);
