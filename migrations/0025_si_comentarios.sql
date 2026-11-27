-- Spirit Immersion: comentários nos devocionais (pedido do Gabriel, 25/11/2026).
-- Abertos, sem aprovação prévia: aparecem na hora para os outros inscritos (só dentro da conta, nunca no site público).
-- A equipe pode tirar do ar (status 'removido') ou apagar; o leitor pode apagar o próprio comentário.
CREATE TABLE si_comentarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  devocional_id INTEGER NOT NULL REFERENCES si_devocionais(id) ON DELETE CASCADE,
  leitor_id INTEGER NOT NULL REFERENCES leitores(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'publicado' CHECK (status IN ('publicado','removido')),
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  removido_em TEXT,
  removido_por INTEGER REFERENCES usuarios(id)
);
CREATE INDEX si_comentarios_dev ON si_comentarios(devocional_id, status, criado_em);
CREATE INDEX si_comentarios_leitor ON si_comentarios(leitor_id, criado_em);
