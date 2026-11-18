# Instruções para o Claude neste repositório

- Este é o site oficial do The Prophetic Voices (thepropheticvoices.com.br). Comunicação com o dono (Gabriel Cantarino) em português do Brasil, sem jargão técnico desnecessário.
- Leia `README.md` antes de mexer. A revista (`/artigos`) e o painel (`/admin`) dependem do Worker em `worker/` e do banco D1; não volte a gerar páginas de artigo estáticas.
- Use só as cinco cores oficiais (preto, branco, creme #F8E9B7, cobre #BF8957, areia #CAB5A0) e o logo em `public/media/`. Nunca recomponha o nome da marca em fonte.
- Teste localmente antes de enviar: `npm run banco:local`, `.dev.vars` com `CHAVE_CONFIGURACAO`, `npm run servidor:local`, e confira no Chrome.
- Mudanças no banco: novo arquivo em `migrations/` (numerado), nunca editar migrações já aplicadas.
- Todo trabalho termina com commit e push. A branch `main` publica automaticamente no Cloudflare.
- Ao concluir uma etapa, atualize o documento `claude/manual-do-projeto-site.md` no Projeto do claude.ai.
