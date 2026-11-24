# Homologação (ambiente de ensaio)

Ambiente separado para ensaiar mudanças antes de entrarem na `main` (que publica o site real).

## O que existe

| Peça | Produção | Homologação |
|---|---|---|
| Worker | `solitary-bush-a41a` | `pv-homologacao` |
| Endereço | https://thepropheticvoices.com.br | https://pv-homologacao.cantarinosministries.workers.dev |
| Banco D1 | `pv-db` | `pv-db-homologacao` (`0a980460-7a64-4c5b-b014-7052800e5980`) |
| Arquivos R2 | `pv-arquivos` | `pv-arquivos-homologacao` |
| Cron de e-mails | a cada 10 min | desligado |
| Branch publicada | `main` | a branch do PR em ensaio (Cloudflare → pv-homologacao → Settings → Builds → Production branch) |

A configuração fica em `wrangler.jsonc` (`env.homologacao`). O deploy da homologação é `npm run deploy:homologacao`: aplica as migrações no banco de teste e publica o Worker `pv-homologacao`. Nada disso toca o banco nem os arquivos de produção.

O banco de teste começa só com o que as migrações criam (acervo da revista, sem leitores, pedidos ou diário). Não copiar dados reais para cá.

## Login na homologação

O endereço de retorno do login vem de `SITE_URL` (variável do ambiente). Para testar um provedor:

1. No provedor (ex.: Google Cloud → Clientes → Site The Prophetic Voices), acrescentar o URI de redirecionamento
   `https://pv-homologacao.cantarinosministries.workers.dev/auth/google/retorno`.
   O retorno de produção continua cadastrado; os dois convivem.
2. Em Cloudflare → pv-homologacao → Settings → Variables and secrets, criar `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` (o Gabriel cola os valores).
3. **Depois de salvar um segredo pelo painel, publique de novo pelo build** (Deployments → último build da branch → Retry build, ou um novo commit na branch). Em 24/11/2026 a versão criada pelo botão "Add variables and deploy" deu "Erro interno" nas páginas de artigo (o Worker não achou o modelo `/artigos/modelo.html`); o build seguinte, que manteve os segredos, voltou ao normal.
4. Roteiro: abrir um artigo com acesso "cadastro" → "Ler online" → entrar com o Google → conferir que volta ao mesmo artigo e o PDF abre. Conferir também um artigo de acesso livre (abre sem login) e `/sitemap.xml`.

## Depois do ensaio

Com o roteiro aprovado: PR → Ready for review → conferir `verificar` → Merge. A `main` está protegida (regra "Proteger main"): só entra por PR com `verificar` verde, sem force push e sem apagar a branch.
