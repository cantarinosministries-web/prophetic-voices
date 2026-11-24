-- Diário do Spirit Immersion (24/11/2026, pedido do Gabriel): espaço na conta para o participante registrar
-- como estão sendo os dias de oração — testemunhos, impressões proféticas, o que ouviu de Deus, o texto que leu,
-- orações — e consultar depois. Privado por padrão; a pessoa escolhe, registro por registro, se a equipe pode ler
-- ou publicar (sem identificar / com o nome). Apagado junto com a conta ou ao sair do movimento.
CREATE TABLE si_diario (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  leitor_id INTEGER NOT NULL REFERENCES leitores(id) ON DELETE CASCADE,
  edicao TEXT NOT NULL,
  data TEXT NOT NULL,                                -- AAAA-MM-DD (horário de Brasília)
  tipo TEXT NOT NULL DEFAULT 'testemunho' CHECK (tipo IN ('testemunho','profetica','ouvi','texto','oracao','outro')),
  referencia TEXT,                                   -- ex.: passagem bíblica lida
  texto TEXT NOT NULL,
  autorizacao TEXT NOT NULL DEFAULT 'privado' CHECK (autorizacao IN ('privado','equipe','anonimo','nome')),
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX si_diario_leitor ON si_diario(leitor_id, edicao, data);
CREATE INDEX si_diario_aut ON si_diario(edicao, autorizacao);
