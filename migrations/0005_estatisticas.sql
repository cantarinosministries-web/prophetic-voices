-- Estatísticas da revista: acessos às páginas dos artigos e downloads dos PDFs.
-- Só contagens por dia e país (sem IP, cookie ou qualquer dado pessoal do leitor).
CREATE TABLE estatisticas (
  artigo_id INTEGER NOT NULL REFERENCES artigos(id) ON DELETE CASCADE,
  dia TEXT NOT NULL,                 -- AAAA-MM-DD, horário de Brasília
  pais TEXT NOT NULL DEFAULT 'XX',   -- código ISO do país (XX = desconhecido)
  acessos INTEGER NOT NULL DEFAULT 0,
  downloads INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (artigo_id, dia, pais)
);
CREATE INDEX estatisticas_dia ON estatisticas(dia);
