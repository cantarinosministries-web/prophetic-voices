-- A movimentação acontece na mesma instrução que atualiza o pedido.
-- O motivo é preenchido pelo Worker novo. O Worker anterior continua compatível.
ALTER TABLE pedidos ADD COLUMN motivo_estoque TEXT;
ALTER TABLE pedidos ADD COLUMN usuario_estoque INTEGER REFERENCES usuarios(id);
ALTER TABLE pedidos ADD COLUMN tentativa_checkout TEXT;
ALTER TABLE pedidos ADD COLUMN mp_checkout_url TEXT;
CREATE UNIQUE INDEX pedidos_tentativa_checkout ON pedidos(tentativa_checkout);

CREATE TRIGGER pedidos_movimentam_estoque
AFTER UPDATE OF estoque_baixado ON pedidos
WHEN OLD.estoque_baixado <> NEW.estoque_baixado AND NEW.motivo_estoque IS NOT NULL
BEGIN
  SELECT RAISE(ABORT, 'PV_ESTOQUE_INSUFICIENTE')
  WHERE NEW.estoque_baixado = 1 AND (
    NOT EXISTS (SELECT 1 FROM pedido_itens WHERE pedido_id = NEW.id)
    OR EXISTS (
      SELECT 1 FROM pedido_itens AS i
      LEFT JOIN produtos AS p ON p.id = i.produto_id
      LEFT JOIN produto_variacoes AS v ON v.id = i.variacao_id
      WHERE i.pedido_id = NEW.id
      GROUP BY i.produto_id, i.variacao_id
      HAVING SUM(i.quantidade) > COALESCE(CASE WHEN i.variacao IS NULL THEN p.estoque ELSE v.estoque END, 0)
    )
  );
  UPDATE produtos
  SET estoque = estoque + (1 - 2 * NEW.estoque_baixado) * (
    SELECT SUM(i.quantidade) FROM pedido_itens AS i WHERE i.pedido_id = NEW.id AND i.variacao IS NULL AND i.produto_id = produtos.id
  )
  WHERE id IN (SELECT i.produto_id FROM pedido_itens AS i WHERE i.pedido_id = NEW.id AND i.variacao IS NULL);
  UPDATE produto_variacoes
  SET estoque = estoque + (1 - 2 * NEW.estoque_baixado) * (
    SELECT SUM(i.quantidade) FROM pedido_itens AS i WHERE i.pedido_id = NEW.id AND i.variacao_id IS NOT NULL AND i.variacao_id = produto_variacoes.id
  )
  WHERE id IN (SELECT i.variacao_id FROM pedido_itens AS i WHERE i.pedido_id = NEW.id AND i.variacao_id IS NOT NULL);
  INSERT INTO estoque_movimentos (produto_id, variacao_id, quantidade, saldo, motivo, pedido_id, usuario_id)
  SELECT i.produto_id, i.variacao_id, (1 - 2 * NEW.estoque_baixado) * SUM(i.quantidade),
    CASE WHEN i.variacao_id IS NULL THEN p.estoque ELSE v.estoque END,
    NEW.motivo_estoque || ' ' || NEW.codigo, NEW.id, NEW.usuario_estoque
  FROM pedido_itens AS i JOIN produtos AS p ON p.id = i.produto_id
  LEFT JOIN produto_variacoes AS v ON v.id = i.variacao_id
  WHERE i.pedido_id = NEW.id AND (i.variacao IS NULL OR v.id IS NOT NULL)
  GROUP BY i.produto_id, i.variacao_id;
  UPDATE pedidos SET motivo_estoque = NULL, usuario_estoque = NULL WHERE id = NEW.id;
END;

CREATE TRIGGER pedidos_limpam_metadados_estoque
AFTER UPDATE OF estoque_baixado ON pedidos
WHEN OLD.estoque_baixado = NEW.estoque_baixado AND NEW.motivo_estoque IS NOT NULL
BEGIN
  UPDATE pedidos SET motivo_estoque = NULL, usuario_estoque = NULL WHERE id = NEW.id;
END;
