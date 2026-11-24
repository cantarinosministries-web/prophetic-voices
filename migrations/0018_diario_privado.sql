-- Diário de Oração do Spirit Immersion passa a ser sempre privado.
-- Só os registros do tipo testemunho têm autorização (equipe / anônimo / com nome).
UPDATE si_diario SET autorizacao = 'privado' WHERE tipo <> 'testemunho';
UPDATE si_diario SET autorizacao = 'equipe' WHERE tipo = 'testemunho' AND autorizacao = 'privado';
