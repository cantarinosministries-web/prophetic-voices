# Spirit Immersion 2027 — agendador isolado

Implementado em 25/11/2026. **Não publicado; nenhum envio real.**

## Arquitetura inspecionada

O site é Astro 5 com Worker próprio (`worker/index.js`), D1 e R2. `worker/spirit.js`
já administra participantes, diário e e-mails da edição 2027; o cron de 10 minutos
processa os e-mails. O push em `main` publica automaticamente. Esta implementação
não modifica esses arquivos, seu banco, suas migrações ou seu cron. A branch tem
apenas um serviço separado e testes. Nenhum checkout compartilhado com Claude.

## Decisão sobre WhatsApp

A [Groups API oficial da Meta](https://developers.facebook.com/documentation/business-messaging/whatsapp/groups)
limita os grupos a **8 participantes**, exige Official Business Account e não oferece
mensagens interativas nos grupos. Logo ela não atende ao destino obrigatório:
**grupo existente Spirit Immersion, informado como tendo 361 membros**. Esse destino
não foi autenticado nem inspecionado. Não se substitui esse grupo por listas individuais,
outro grupo, grupos menores ou outro produto.

O agendador está funcional nos modos `dry-run` e `manual`. `live` retorna
`OFFICIAL_GROUP_UNSUPPORTED`, sem tocar no banco. Não há transporte WhatsApp,
QR, token ou método de envio escondido atrás de configuração. “✅ Sim” e “❌ Ainda não”
são linhas de texto; não gravam respostas no diário nem são botões interativos.

A biblioteca [whatsapp-web.js](https://wwebjs.dev/guide/) acessa grupos existentes via
WhatsApp Web, mas é não oficial; seu próprio autor adverte sobre bloqueios e ausência
de autorização do WhatsApp. Não é apresentada como integração compatível com as regras.
O caminho compatível disponível aqui é preparar a mensagem e um administrador postar
manualmente no grupo existente. Se a Meta ampliar o suporte, implementar um transporte
oficial separado, mantendo a barreira de aprovação antes de qualquer envio.

**Pendente por incompatibilidade:** teste autenticado no grupo privado com número
secundário, persistência da sessão WhatsApp e teste de entrega. Não foram simulados
como se tivessem acontecido. Antes de um eventual experimento não oficial, é necessária
a decisão do usuário sobre o risco e sua autenticação local. Nenhum login deve ser
iniciado no CI, QR enviado a logs públicos ou sessão commitada. LocalAuth precisaria de
armazenamento persistente privado, como explica a [documentação de autenticação](https://wwebjs.dev/guide/creating-your-bot/authentication.html).

## Executar agora, sem dependências adicionais

Node >=22.13 (SQLite nativo). Da raiz do repositório:

```bash
node --test tests/spirit-whatsapp.test.js
node automation/spirit-immersion/local.js tick 2027-01-01T23:00:00Z
node automation/spirit-immersion/local.js tick 2027-01-01T23:00:00Z
node automation/spirit-immersion/local.js export 2027-01-01
node automation/spirit-immersion/local.js list
```

Primeira execução: `simulated`; segunda: `duplicate`. Reiniciar o processo preserva
o resultado. A simulação de data é restrita ao executável local. O Worker sempre usa
o relógio atual, inclusive quando o cron chega atrasado. Exemplos não iniciam daemon.

```bash
SI_TIME=08:30 SI_DIARY_URL=https://thepropheticvoices.com.br SI_MODE=manual \
  node automation/spirit-immersion/local.js tick 2027-04-10T11:30:00Z
SI_MODE=manual node automation/spirit-immersion/local.js export 2027-04-10
```

`manual` prepara a mensagem para copiar, sem enviá-la nem alegar que foi entregue.
O texto preserva exatamente a pergunta solicitada, inclusive “sua uma hora”.
O padrão é 20:00, a confirmar antes da ativação; link inicial configurável conforme pedido.

## Persistência, recuperação e encerramento

- Cron a cada minuto em UTC; seleção de data/horário por `Intl.DateTimeFormat` com
  `America/Sao_Paulo`, sem offset fixo. Pode gerar a mensagem após o horário escolhido
  no mesmo dia, recuperando uma indisponibilidade breve. Não repõe dias anteriores.
- Exatamente 100 datas: 01/01/2027–10/04/2027 inclusive. Antes/depois da campanha,
  não escreve no banco. Após dia 100 o agendador é inerte; o gatilho Cloudflare ainda
  invoca o Worker até sua remoção administrativa. Não há token de gestão para removê-lo.
- Chave diária única por modo e inserção atômica no D1/SQLite, protegida também por
  `UNIQUE(local_date, mode)`. Concorrência/reinício não produzem segunda entrada.
- Falha no banco faz o Worker sinalizar erro; o próximo cron tenta de novo no mesmo
  dia. Se a gravação já ocorreu, a chave única resolve a repetição com segurança.
- Essa garantia é de **fila**, não de entrega WhatsApp. Um transporte futuro precisa
  distinguir falha anterior ao envio de resultado incerto; timeout após envio não pode
  ser repetido automaticamente, para evitar mensagens duplicadas.
- Logs JSON com evento/dia/data/código, sem corpo da mensagem, link ou exceção crua.
  Dados e estado local estão em `.local/`, ignorados pelo Git, com diretório privado.
  Não armazenamos respostas individuais nem listas de membros.
- Falha persistente por um dia inteiro exige intervenção; não há alerta externo
  configurado nem promessa de horário exato de entrega por Cron Triggers.

## Cloudflare: viabilidade e custos verificados em 25/11/2026

| Opção | Viabilidade | Custo estimado em USD |
|---|---|---|
| Workers Free + Cron + D1 | Adequado à fila sem sessão de navegador | $0 incremental, dentro da franquia compartilhada da conta |
| Workers Paid | Desnecessário para esta fila | mínimo $5/mês; cerca de $20 em quatro mensalidades jan–abr, sem excedentes |
| Containers | Executa Node/Chromium; não resolve a incompatibilidade do WhatsApp | exige Workers Paid; CPU, memória, disco, egress e Durable Objects podem acrescentar custos |
| Node local + SQLite | Já executado, sem serviço contratado; computador precisa ficar disponível para rotina real | sem assinatura adicional; energia/internet existentes |

O cron por minuto representa 1.440 invocações/dia, 144.000 durante os 100 dias,
abaixo dos 100.000 pedidos/dia do Workers Free; CPU continua sujeita ao limite gratuito.
O D1 Free inclui 5 milhões de linhas lidas/dia, 100 mil escritas/dia e 5 GB totais.
A conta pode já consumir parte dessas cotas: não foi inspecionada. O Worker não
carrega Chromium e não persiste sessões WhatsApp; Containers seriam outro serviço.

Containers inclui, no plano de $5, 25 GiB-h, 375 vCPU-min e 200 GB-h/mês.
Excedentes: $0.0000025/GiB-s de memória, $0.000020/vCPU-s e $0.00000007/GB-s de disco.
Exemplo **basic**, 1 GiB/4 GB/0,25 vCPU, 30 dias sempre ativo: memória $6,26 + disco
$0,68 + CPU até $12,51 se toda a CPU alocada ficar ocupada + plano $5 ≈ **$24,44/mês**,
antes de Durable Objects, logs, tráfego e tributos. CPU é cobrada por uso real;
memória/disco por recursos provisionados enquanto ativo. Rodar poucos minutos/dia
pode caber nas franquias, mas continua exigindo plano pago e estratégia privada de
restauração da sessão; não presumir que o disco do contêiner substitui backup durável.
Não foram contratados plano, container, banco remoto ou API.

Fontes primárias:
[Workers](https://developers.cloudflare.com/workers/platform/pricing/),
[Cron em UTC e propagação até 15 minutos](https://developers.cloudflare.com/workers/configuration/cron-triggers/),
[D1](https://developers.cloudflare.com/d1/platform/pricing/),
[Containers](https://developers.cloudflare.com/containers/platform/pricing/).
Preços futuros podem mudar. Não existe tarifa aplicável de WhatsApp estimada para o
grupo de 361 membros porque o destino não é suportado pela API oficial atual.

## Testar o Worker localmente

```bash
npx wrangler d1 migrations apply spirit-immersion-test-only --local \
  --config automation/spirit-immersion/wrangler.jsonc
npx wrangler dev --test-scheduled --config automation/spirit-immersion/wrangler.jsonc
# Em outro terminal, dispara o cron local com a data real:
curl 'http://localhost:8787/__scheduled?cron=*+*+*+*+*'
```

Em novembro/2026 o cron retorna sem enfileirar; os testes automatizados percorrem
as 100 datas sem alterar relógio de produção. O `database_id` zerado é proposital:
configuração local sem banco remoto real. Não há script de deploy nem integração
com o deploy do site. Publicar este serviço exigirá criar banco isolado, inserir ID,
rever quotas, aprovar horário e modo, e autorização específica de deploy.

Antes de qualquer piloto real: confirmar identidade do número secundário e ID exato
do grupo privado por dados obtidos localmente, impedir seleção por nome e destinos
alternativos, limitar membros de teste, validar reconexão/reinício e deduplicação,
e tratar envio de resultado incerto sem repetição automática. O grupo oficial
permanece fora do piloto. Autenticação sozinha não autoriza envio.
