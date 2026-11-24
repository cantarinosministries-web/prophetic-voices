# E-mails automáticos (novos artigos e testemunhos)

Quando um artigo ou testemunho é publicado **pela primeira vez**, cada inscrito recebe um e-mail com ele.
O envio usa o **Cloudflare Email Service** (o mesmo Cloudflare do site). Enquanto ele não estiver configurado, nada é enviado:
o painel → E-mails mostra "Desligado", o rodapé responde "As inscrições por e-mail abrem em breve" e as publicações
desse período ficam registradas como "não enviado" (não são disparadas depois, para ninguém receber coisa antiga).

## Quem recebe
- **Leitores com conta**: logo após criar a conta, a página de boas-vindas pergunta se querem receber (Sim / Agora não).
  Podem mudar em "Minha conta". O e-mail é o da conta Google/Apple/Facebook/Microsoft, já confirmado pelo provedor.
- **Rodapé do site**: a pessoa informa o e-mail e recebe um e-mail de confirmação (sem confirmar, não recebe nada).
- Todo e-mail tem "Cancelar inscrição" (página /newsletter.html) e o cabeçalho de cancelamento com um clique do Gmail/Apple Mail.

## Configurar (uma vez)
1. **Plano Workers Paid** (Cloudflare → Workers & Pages → Plans; US$ 5/mês). O envio para qualquer destinatário exige esse plano.
   Inclui 3.000 e-mails por mês; acima disso, US$ 0,35 por mil.
2. **Domínio de envio**: Cloudflare → Email → **Email Sending** (Email Service) → adicionar/onboard `thepropheticvoices.com.br`.
   Como o domínio já está na Cloudflare, os registros de DNS (SPF/DKIM) são criados pelo próprio painel. Aguarde ficar "verificado".
   Contas novas começam com uma cota diária conservadora, que sobe com o uso; se precisar, há formulário de aumento.
3. **Token**: Cloudflare → My Profile → API Tokens → Create Token → permissão de **envio de e-mails (Email Sending)** na conta
   do site. Copie o token.
4. **Segredos/variáveis** no Worker `solitary-bush-a41a` → Settings → Variables and secrets:
   - `EMAIL_API_TOKEN` (tipo **Secret**): o token do passo 3.
   - `CF_ACCOUNT_ID` (tipo Text): o ID da conta (aparece na lateral da página inicial do Workers & Pages).
   - Opcional `EMAIL_REMETENTE` (padrão `novidades@thepropheticvoices.com.br`).
5. **Apple** (se o login da Apple for ligado): quem esconde o e-mail recebe por um endereço `@privaterelay.appleid.com`.
   Para esses e-mails chegarem, registre o domínio e o remetente em Apple Developer → Certificates, Identifiers & Profiles →
   Services → **Sign in with Apple for Email Communication**.
6. Teste: inscreva-se pelo rodapé, confirme, e publique um testemunho de teste no painel. Painel → E-mails mostra o envio.

## Como funciona (técnico)
- Código: `worker/emails.js`. Banco: `migrations/0013_inscritos_testemunhos_envios.sql` (`inscritos`, `testemunhos`, `envios`, `envio_destinos`;
  coluna `leitores.respondeu_email`).
- API REST `POST https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/email/sending/send`, um e-mail por destinatário
  (cada um com seu link de cancelamento). Cabeçalhos `List-Unsubscribe` (https) e `List-Unsubscribe-Post: List-Unsubscribe=One-Click`.
- Ao publicar: cria o envio (único por artigo/testemunho) e a fila de destinatários; manda até 150 na hora e o resto a cada
  10 minutos (cron `*/10 * * * *` no `wrangler.jsonc`). Até 3 tentativas por destinatário. Quem cancela no meio sai da fila.
- Conteúdo retirado do site antes do envio terminar não é mais enviado. Republicar não reenvia.
- Sem pixel de abertura nem rastreamento de cliques (compromisso da Política de Privacidade, seção 6).
Divulgue a abertura da chamada na página "Proponha um artigo". O registro de interesse na Biblioteca ajuda a equipe editorial a planejar a chamada. Ele não ativa os e-mails de novidades.
