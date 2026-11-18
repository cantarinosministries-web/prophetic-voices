# The Prophetic Voices — site oficial

Site em [Astro](https://astro.build) publicado no **Cloudflare** (Worker + arquivos estáticos), com banco de dados **D1** e armazenamento **R2** para a revista e o painel.

## Como funciona

| Parte | O que é | Onde está |
|---|---|---|
| Páginas fixas | Home, Cursos, Loja | `src/pages/*.astro` (geradas no build) |
| Revista | Lista e páginas dos artigos | Montadas a cada visita pelo Worker a partir do banco (`worker/paginas.js`), dentro dos modelos `src/pages/artigos.astro` e `src/pages/artigos/modelo.astro` |
| Painel | `/admin` — login, artigos, usuários, histórico | `src/pages/admin.astro` + `src/scripts/admin.js` (interface) e `worker/api.js` (API) |
| Banco | Usuários, sessões, convites, artigos, comentários, histórico | Cloudflare D1 `pv-db`, estrutura em `migrations/` |
| Arquivos | PDFs e capas enviados pelo painel | Cloudflare R2 `pv-arquivos`, servidos em `/arquivos/...` |

Publicar um artigo pelo painel **não exige novo deploy**: ele aparece no site na hora.

## Papéis do painel

Proprietário › Administrador › Editor › Autor › Revisor › Leitor. Regras em `worker/permissoes.js`; resumo na aba **Papéis** do painel.
Fluxo do artigo: Rascunho → Em revisão → Publicado → Arquivado.

## Rodar no computador

```bash
npm install
npm run banco:local      # cria o banco local com o acervo inicial
echo 'CHAVE_CONFIGURACAO=uma-chave-qualquer' > .dev.vars
npm run servidor:local   # site + painel em http://localhost:8787
```

`npm run dev` continua servindo só as páginas do Astro (sem revista dinâmica nem painel).

## Publicação

O Cloudflare publica sozinho a cada push na branch `main` (Workers Builds):
- **Build command:** `npm run build`
- **Deploy command:** `npm run deploy` (aplica as migrações do banco e publica o Worker)

Configuração inicial (uma vez): veja `docs/CONFIGURAR-CLOUDFLARE.md`.

## Onde mexer

- Textos fixos PT/EN: `src/scripts/i18n.js` (site) e `public/revista/revista.js` (revista).
- Links da Escola, WhatsApp e Instagram: topo de `src/layouts/Base.astro`.
- Cores oficiais: começo de `src/styles/global.css`.
- Estilos da revista: `public/revista/revista.css`; do painel: `public/revista/admin.css`.
- Mudança na estrutura do banco: crie um arquivo novo em `migrations/` (nunca edite os antigos).
