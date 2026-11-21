CREATE TABLE artigos_enderecos (
  slug TEXT PRIMARY KEY,
  artigo_id INTEGER NOT NULL REFERENCES artigos(id) ON DELETE CASCADE
);

CREATE TRIGGER artigos_preservam_endereco
AFTER UPDATE OF slug ON artigos
WHEN OLD.slug <> NEW.slug
BEGIN
  INSERT INTO artigos_enderecos (slug, artigo_id) VALUES (OLD.slug, NEW.id)
  ON CONFLICT(slug) DO NOTHING;
END;
