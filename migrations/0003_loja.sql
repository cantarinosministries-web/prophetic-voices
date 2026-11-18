-- Loja virtual: produtos, variações, fotos, estoque, pedidos, configurações
-- e permissões por área (revista e loja), como pastas de um Drive.

-- usuarios: ganham acesso por área. 'revista' = 0 tira o acesso à revista
-- (o papel continua guardado); papel_loja define o acesso à loja.
ALTER TABLE usuarios ADD COLUMN revista INTEGER NOT NULL DEFAULT 1;
ALTER TABLE usuarios ADD COLUMN papel_loja TEXT NOT NULL DEFAULT 'nenhum'
  CHECK (papel_loja IN ('gerente','expedicao','visualizador','nenhum'));
UPDATE usuarios SET papel_loja = 'gerente' WHERE papel IN ('proprietario','administrador');

ALTER TABLE convites ADD COLUMN papel_loja TEXT;
ALTER TABLE convites ADD COLUMN revista INTEGER NOT NULL DEFAULT 1;

CREATE TABLE produtos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  categoria TEXT,
  descricao TEXT,
  preco INTEGER NOT NULL DEFAULT 0,            -- em centavos
  preco_de INTEGER,                            -- preço "de" (riscado), em centavos
  sku TEXT,
  estoque INTEGER NOT NULL DEFAULT 0,          -- usado quando o produto não tem variações
  estoque_minimo INTEGER NOT NULL DEFAULT 2,
  peso_g INTEGER NOT NULL DEFAULT 300,
  altura_cm REAL NOT NULL DEFAULT 4,
  largura_cm REAL NOT NULL DEFAULT 16,
  comprimento_cm REAL NOT NULL DEFAULT 23,
  ativo INTEGER NOT NULL DEFAULT 0,
  destaque INTEGER NOT NULL DEFAULT 0,
  ordem INTEGER NOT NULL DEFAULT 0,
  criado_por INTEGER REFERENCES usuarios(id),
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE produto_variacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,                          -- ex.: P, M, G, GG
  sku TEXT,
  estoque INTEGER NOT NULL DEFAULT 0,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX variacoes_produto ON produto_variacoes(produto_id);

CREATE TABLE produto_fotos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX fotos_produto ON produto_fotos(produto_id);

CREATE TABLE estoque_movimentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  produto_id INTEGER REFERENCES produtos(id) ON DELETE CASCADE,
  variacao_id INTEGER REFERENCES produto_variacoes(id) ON DELETE SET NULL,
  quantidade INTEGER NOT NULL,                 -- positivo entra, negativo sai
  saldo INTEGER,
  motivo TEXT NOT NULL,
  pedido_id INTEGER,
  usuario_id INTEGER REFERENCES usuarios(id),
  em TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX movimentos_produto ON estoque_movimentos(produto_id, em);

CREATE TABLE pedidos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT NOT NULL UNIQUE,                 -- ex.: PV-26000123
  chave TEXT NOT NULL,                         -- segredo para o comprador acompanhar o pedido
  status TEXT NOT NULL DEFAULT 'aguardando' CHECK (status IN ('aguardando','pago','separacao','enviado','entregue','cancelado','reembolsado')),
  nome TEXT NOT NULL, email TEXT NOT NULL, telefone TEXT, cpf TEXT,
  cep TEXT, rua TEXT, numero TEXT, complemento TEXT, bairro TEXT, cidade TEXT, uf TEXT,
  subtotal INTEGER NOT NULL, frete INTEGER NOT NULL DEFAULT 0, desconto INTEGER NOT NULL DEFAULT 0, total INTEGER NOT NULL,
  frete_servico TEXT, frete_nome TEXT, frete_prazo INTEGER,
  pagamento_metodo TEXT, mp_preferencia TEXT, mp_pagamento TEXT, mp_status TEXT,
  estoque_baixado INTEGER NOT NULL DEFAULT 0,
  me_pedido TEXT, rastreio TEXT, etiqueta_url TEXT,
  observacao TEXT, nota_interna TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  pago_em TEXT, enviado_em TEXT, atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX pedidos_status ON pedidos(status, criado_em);

CREATE TABLE pedido_itens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id INTEGER REFERENCES produtos(id) ON DELETE SET NULL,
  variacao_id INTEGER REFERENCES produto_variacoes(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  variacao TEXT,
  preco INTEGER NOT NULL,
  quantidade INTEGER NOT NULL
);
CREATE INDEX itens_pedido ON pedido_itens(pedido_id);

CREATE TABLE loja_config (
  chave TEXT PRIMARY KEY,
  valor TEXT
);
INSERT INTO loja_config (chave, valor) VALUES
  ('cep_origem', '65900000'),
  ('frete_gratis_acima', ''),
  ('prazo_extra_dias', '2'),
  ('servicos_frete', '1,2,3,4,17'),
  ('remetente_nome', 'The Prophetic Voices'),
  ('remetente_documento', ''),
  ('remetente_cnpj', ''),
  ('remetente_telefone', '99920017003'),
  ('remetente_email', 'cantarinosministries@gmail.com'),
  ('remetente_endereco', ''),
  ('remetente_numero', ''),
  ('remetente_complemento', ''),
  ('remetente_bairro', ''),
  ('remetente_cidade', 'Imperatriz'),
  ('remetente_uf', 'MA'),
  ('retirada_local', ''),
  ('parcelas_max', '12'),
  ('aviso', ''),
  ('loja_aberta', '1');

-- produtos iniciais (inativos até a equipe cadastrar preço, fotos e estoque)
INSERT INTO produtos (slug, nome, categoria, descricao, preco, peso_g, altura_cm, largura_cm, comprimento_cm, ativo, destaque, ordem) VALUES
  ('livro-igreja-do-fim', 'Igreja do Fim', 'Livros', 'Livro de Gabriel Cantarino.', 0, 450, 3, 16, 23, 0, 1, 1),
  ('camiseta-anti-false-prophet-club', 'Camiseta Anti False Prophet Club', 'Vestuário', 'Frente: Jr 5.30-31 e o logo. Costas: ANTI FALSE PROPHET CLUB.', 0, 250, 3, 25, 30, 0, 0, 2);
INSERT INTO produto_variacoes (produto_id, nome, ordem) SELECT id, v.nome, v.ordem FROM produtos,
  (SELECT 'P' nome, 1 ordem UNION ALL SELECT 'M', 2 UNION ALL SELECT 'G', 3 UNION ALL SELECT 'GG', 4) v
  WHERE produtos.slug = 'camiseta-anti-false-prophet-club';
INSERT INTO produto_fotos (produto_id, url, ordem) SELECT id, '/media/tee-back.jpg', 0 FROM produtos WHERE slug = 'camiseta-anti-false-prophet-club';
