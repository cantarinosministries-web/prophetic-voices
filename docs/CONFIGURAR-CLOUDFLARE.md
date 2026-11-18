# Configurar o Cloudflare (uma vez só)

Tempo: uns 10 minutos. Tudo no painel do Cloudflare (conta cantarinosministries@gmail.com).

## 1. Criar o banco de dados (D1)
1. Menu da esquerda → **Storage & Databases → D1 SQL Database** → **Create**.
2. Nome: `pv-db` → **Create**.
3. Copie o **Database ID** (um código como `3f2a…`) e mande para o Claude, ou cole em `wrangler.jsonc` no lugar de `COLE-AQUI-O-ID-DO-BANCO`.

## 2. Criar o armazenamento de arquivos (R2)
1. Menu → **R2 Object Storage**. Se pedir, ative o R2 (o plano gratuito cobre 10 GB; pode pedir um cartão, sem cobrança dentro do limite).
2. **Create bucket** → nome `pv-arquivos` → **Create**.

## 3. Criar a chave de configuração
1. Menu → **Workers & Pages** → projeto **solitary-bush-a41a** → **Settings → Variables and Secrets** → **Add**.
2. Tipo **Secret**, nome `CHAVE_CONFIGURACAO`, valor: uma frase longa que só você saiba. Salve.
   Ela só é usada uma vez, para criar a conta do proprietário.

## 4. Ligar a publicação automática
1. No mesmo projeto → **Settings → Build**.
2. **Build command:** `npm run build`
3. **Deploy command:** `npm run deploy`
4. Salve. A partir daqui, cada alteração enviada ao GitHub (branch `main`) publica o site sozinha.

## 5. Primeiro acesso
1. Abra `https://thepropheticvoices.com.br/admin`.
2. Informe a chave do passo 3, seu nome, e-mail e senha → você vira **Proprietário**.
3. Em **Usuários**, convide a equipe. O painel gera um link (válido por 7 dias) para enviar pelo WhatsApp; a pessoa cria a própria senha.

## Se algo der errado
- **Deploy falhou:** Workers & Pages → projeto → **Deployments** → abra a tentativa e copie o log para o Claude.
- **Esqueceu a senha:** outro administrador gera um link de nova senha em **Usuários**. Se for o único proprietário, peça ao Claude para gerar o link direto no banco.
