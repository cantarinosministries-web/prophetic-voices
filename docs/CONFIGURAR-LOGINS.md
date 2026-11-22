# Logins do site (cadastro de leitores e comentários)

O site aceita entrar com **Google, Apple, Facebook e Microsoft**. Cada login só aparece no site depois que os segredos dele
estão no Cloudflare. Enquanto nenhum estiver configurado, o botão de conta, a página de cadastro e a seção de comentários
ficam escondidos (a página `/entrar.html` mostra "O cadastro abre em breve").

Onde colar os segredos: Cloudflare → Workers & Pages → **solitary-bush-a41a** → Settings → **Variables and secrets** →
Add → tipo **Secret** → nome exatamente como abaixo. Depois de salvar, o site já usa o valor (não precisa novo deploy).

Endereços que cada provedor pede:

| Provedor | Endereço de retorno (redirect URI) |
|---|---|
| Google | `https://thepropheticvoices.com.br/auth/google/retorno` |
| Apple | `https://thepropheticvoices.com.br/auth/apple/retorno` |
| Facebook | `https://thepropheticvoices.com.br/auth/facebook/retorno` |
| Microsoft | `https://thepropheticvoices.com.br/auth/microsoft/retorno` |

Domínio: `thepropheticvoices.com.br` · Política de privacidade: `https://thepropheticvoices.com.br/privacidade.html`
(**ainda não existe**: Google, Facebook e Apple pedem esse endereço; criar a página antes de publicar o app deles).

---

## 1. Google (grátis, ~10 min) — recomendado primeiro

1. https://console.cloud.google.com → criar projeto "Prophetic Voices".
2. **Google Auth Platform** (ou "APIs e serviços → Tela de consentimento OAuth"): tipo **Externo**; nome do app "The Prophetic Voices";
   e-mail de suporte; logo (símbolo PV); domínio autorizado `thepropheticvoices.com.br`; links de privacidade e termos.
   Escopos: só `openid`, `email` e `profile` (não exigem verificação do Google).
3. **Clientes → Criar cliente** → tipo **Aplicativo da Web** → URI de redirecionamento autorizado: o endereço da tabela acima.
4. Copiar o **ID do cliente** e a **chave secreta**.
5. Publicar o app ("Publicar aplicativo" / sair do modo de teste), senão só os e-mails de teste conseguem entrar.

Segredos: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

## 2. Facebook (grátis; a Meta revisa o app)

1. https://developers.facebook.com → Meus apps → **Criar app** → caso de uso "Autenticar e solicitar dados de usuários com o Login do Facebook".
2. Login do Facebook → Configurações → **URIs de redirecionamento do OAuth válidos**: o endereço da tabela. Deixe "Login no OAuth da Web" ligado.
3. Configurações do app → Básico: domínio, link da política de privacidade, link de **exclusão de dados** (pode ser
   `https://thepropheticvoices.com.br/conta.html`, onde o leitor exclui a própria conta), ícone e categoria.
4. Permissões usadas: `public_profile` e `email` (padrão, sem revisão avançada). Colocar o app no **modo Ao vivo**.
   A Meta pode pedir a **verificação da empresa** para o modo ao vivo.
5. Copiar o **ID do app** e a **Chave secreta do app**.

Segredos: `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`. (Opcional: `FACEBOOK_API_VERSION`, padrão `v23.0`; a Meta encerra cada versão uns dois anos depois do lançamento.)

## 3. Microsoft (grátis)

1. https://entra.microsoft.com (ou portal.azure.com) → **Registros de aplicativo** → Novo registro.
2. Tipos de conta: **"Contas em qualquer diretório organizacional e contas Microsoft pessoais"**.
3. URI de redirecionamento: plataforma **Web**, o endereço da tabela.
4. **Certificados e segredos** → Novo segredo do cliente → copiar o **Valor** (aparece uma vez só; anotar a validade, máximo 2 anos).
5. Copiar o **ID do aplicativo (cliente)** na Visão geral.

Segredos: `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`. **Renovar o segredo antes de vencer.**

## 4. Apple (exige Apple Developer Program, US$ 99/ano)

Sem a assinatura (ou a isenção para organizações sem fins lucrativos) não é possível oferecer o login da Apple.

1. https://developer.apple.com/account → Certificates, Identifiers & Profiles → **Identifiers** → "+" → **App IDs** → marcar
   **Sign in with Apple**. (Anotar o **Team ID**, que aparece no canto superior direito.)
2. Identifiers → "+" → **Services IDs** → identificador, por exemplo `br.com.thepropheticvoices.login` (esse é o `APPLE_SERVICES_ID`).
   Ligar **Sign in with Apple** → Configure → App ID principal do passo 1 → Domains: `thepropheticvoices.com.br` →
   Return URLs: o endereço da tabela.
3. **Keys** → "+" → marcar Sign in with Apple (ligada ao App ID) → baixar o arquivo `.p8` (só baixa uma vez) e anotar o **Key ID**.
4. Abrir o `.p8` num editor de texto e colar o conteúdo inteiro (com as linhas BEGIN/END) no segredo `APPLE_PRIVATE_KEY`.

Segredos: `APPLE_SERVICES_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`.

Observação: a Apple deixa a pessoa esconder o e-mail; nesse caso chega um endereço `@privaterelay.appleid.com`, e o nome
só vem no primeiro login (depois o leitor pode mudar em "Minha conta").

---

## Como funciona (técnico)

- Código: `worker/leitores.js`; páginas `src/pages/entrar.astro` e `src/pages/conta.astro` com `public/conta/`;
  comentários na página do artigo em `public/revista/comentarios.js`; moderação no painel → **Comentários** (editor e acima).
- Banco: `migrations/0012_leitores_comentarios.sql` (`leitores`, `leitor_contas`, `leitor_sessoes`, `login_estados`, `comentarios_leitores`).
  Os leitores **não** têm acesso ao painel; são separados da tabela `usuarios`.
- Fluxo OAuth 2.0 / OpenID Connect com código de autorização, `state` ligado a um cookie, PKCE (Google e Microsoft) e `nonce`.
  O `id_token` vem direto do provedor em troca do segredo; o servidor confere emissor, destinatário, validade e nonce.
- Contas unidas pelo e-mail só quando o provedor confirma o e-mail (Google e Apple). Nos outros casos, o leitor vincula
  logins manualmente em "Minha conta".
- Guardamos só nome, e-mail e o identificador de cada login. Nenhuma foto. Excluir a conta apaga tudo, inclusive os comentários.
- Comentários: até 2.000 caracteres, no máximo 5 por hora por leitor, sempre **pendentes** até alguém aprovar. Sem respostas em sequência.
