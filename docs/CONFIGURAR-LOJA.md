# Loja — como ativar as vendas

A loja já está no ar em **modo de teste**: só quem está logado no painel consegue simular uma compra; visitantes veem
"As vendas on-line abrem em breve". Para vender de verdade, faça os passos abaixo uma única vez.

## 1. Cadastrar os produtos (painel → Loja → Produtos)
- Nome, descrição, preço, fotos, variações (P, M, G…), peso e medidas da embalagem (usados no frete).
- Lançar o estoque em "Estoque" (entrada ou contagem).
- Marcar "À venda na loja".

## 2. Mercado Pago (Pix, crédito, débito e boleto)
1. Entre em https://www.mercadopago.com.br/developers/panel/app e crie uma aplicação ("Pagamentos on-line" → "Checkout Pro").
2. Em **Credenciais de produção**, copie o **Access Token** (começa com `APP_USR-`).
3. No Cloudflare: Workers & Pages → `solitary-bush-a41a` → Settings → Variables and Secrets → **Add** → tipo *Secret*,
   nome `MP_ACCESS_TOKEN`, valor = o Access Token.
4. De volta ao Mercado Pago: na aplicação, **Webhooks** → URL de produção
   `https://thepropheticvoices.com.br/api/loja/mp/webhook`, evento **Pagamentos** → salvar.
5. Copie a **assinatura secreta** mostrada ali e crie no Cloudflare o secret `MP_WEBHOOK_SECRET`.

## 3. Melhor Envio (frete e etiquetas)
1. Em https://melhorenvio.com.br → Gerenciar → **Tokens** → Novo token. Marque: cotação de frete (shipping-calculate),
   carrinho (cart-read, cart-write), compra/geração/impressão de etiquetas (shipping-checkout, shipping-generate,
   shipping-print), rastreio (shipping-tracking) e leitura de pedidos (orders-read).
2. No Cloudflare, crie o secret `MELHOR_ENVIO_TOKEN` com esse token.
3. Coloque saldo na carteira do Melhor Envio: é dele que sai o valor de cada etiqueta.

## 4. Configurações da loja (painel → Loja → Configurações)
- CEP de origem, CPF ou CNPJ e endereço do remetente (saem na etiqueta).
- Opcional: frete grátis acima de um valor, retirada pessoal, dias extras de preparo, aviso no topo da loja.

O checkout público exige `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET` e `MELHOR_ENVIO_TOKEN`, com o Melhor Envio fora do sandbox e a loja aberta no painel.

## Como funciona por dentro
- Preço, estoque e frete são sempre recalculados no servidor (o carrinho do navegador não decide nada).
- A baixa de estoque e a atualização do pedido são atômicas. Sem saldo, o pagamento fica registrado para conciliação no painel. Reponha e sincronize o pedido ou reembolse pelo fluxo do provedor.
- Cada pedido tem um link secreto de acompanhamento para o cliente (`/pedido.html?codigo=…&chave=…`).
- Papéis da loja: Gerente (tudo), Expedição (etiquetas, rastreio, status de envio), Visualizador (só leitura).
  Proprietário e administrador têm acesso total. O acesso à loja é independente do acesso à revista.
