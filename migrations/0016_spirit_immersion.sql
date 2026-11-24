-- Spirit Immersion (24/11/2026, pedido do Gabriel): movimento de oração em línguas, 1 hora por dia.
-- Edição 2027: 100 dias, de 1º de janeiro a 10 de abril de 2027. O participante entra pela conta de leitor,
-- marca os dias em que completou a hora de oração, deixa testemunhos diários e recebe devocionais em PDF.
-- Tudo é apagado junto com a conta do leitor (ON DELETE CASCADE).

-- quem participa de cada edição
CREATE TABLE si_participantes (
  leitor_id INTEGER NOT NULL REFERENCES leitores(id) ON DELETE CASCADE,
  edicao TEXT NOT NULL,
  devocionais_email INTEGER NOT NULL DEFAULT 1,      -- 1 = quer receber os devocionais por e-mail
  consentimento_em TEXT NOT NULL,                    -- aceite destacado (registro de oração e testemunhos são dados sobre a fé)
  inscrito_em TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (leitor_id, edicao)
);
CREATE INDEX si_participantes_edicao ON si_participantes(edicao);

-- cada dia da jornada: orou a hora inteira? testemunho do dia e até onde ele pode ir
CREATE TABLE si_dias (
  leitor_id INTEGER NOT NULL REFERENCES leitores(id) ON DELETE CASCADE,
  edicao TEXT NOT NULL,
  dia INTEGER NOT NULL CHECK (dia BETWEEN 1 AND 366),
  orou INTEGER NOT NULL DEFAULT 0,
  testemunho TEXT,
  autorizacao TEXT NOT NULL DEFAULT 'equipe' CHECK (autorizacao IN ('equipe','anonimo','nome')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (leitor_id, edicao, dia)
);
CREATE INDEX si_dias_edicao ON si_dias(edicao, dia);

-- devocionais em PDF (enviados pelo painel; aparecem na conta do participante a partir de "liberar_em")
CREATE TABLE si_devocionais (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  edicao TEXT NOT NULL,
  titulo TEXT NOT NULL,
  resumo TEXT,
  liberar_em TEXT NOT NULL,                          -- data (AAAA-MM-DD, horário de Brasília)
  pdf_url TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','publicado')),
  enfileirado_em TEXT,                               -- quando os e-mails deste devocional entraram na fila (nunca repete)
  criado_por INTEGER REFERENCES usuarios(id),
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX si_devocionais_edicao ON si_devocionais(edicao, liberar_em);

-- fila dos e-mails de devocionais (um por participante e devocional)
CREATE TABLE si_envios (
  devocional_id INTEGER NOT NULL REFERENCES si_devocionais(id) ON DELETE CASCADE,
  leitor_id INTEGER NOT NULL REFERENCES leitores(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'fila' CHECK (status IN ('fila','enviado','falha','cancelado')),
  tentativas INTEGER NOT NULL DEFAULT 0,
  erro TEXT,
  enviado_em TEXT,
  PRIMARY KEY (devocional_id, leitor_id)
);
CREATE INDEX si_envios_fila ON si_envios(status);
