-- Retira do acervo o artigo de John Collins (pedido de Gabriel, 19/11/2026).
DELETE FROM estatisticas WHERE artigo_id IN (SELECT id FROM artigos WHERE slug = 'collins-bob-jones-profetas-kansas-city');
DELETE FROM comentarios WHERE artigo_id IN (SELECT id FROM artigos WHERE slug = 'collins-bob-jones-profetas-kansas-city');
DELETE FROM artigos WHERE slug = 'collins-bob-jones-profetas-kansas-city';
