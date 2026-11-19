-- Retira a tese de Marylyn Ellen White (O Conselho de Yahweh) até a resposta ao pedido de autorização (19/11/2026, a pedido de Gabriel).
DELETE FROM estatisticas WHERE artigo_id IN (SELECT id FROM artigos WHERE slug='white-conselho-de-yahweh');
DELETE FROM comentarios WHERE artigo_id IN (SELECT id FROM artigos WHERE slug='white-conselho-de-yahweh');
DELETE FROM artigos WHERE slug='white-conselho-de-yahweh';
