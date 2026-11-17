# The Prophetic Voices — site oficial

Site em [Astro](https://astro.build). Gera páginas estáticas que podem ser hospedadas em Vercel, Netlify ou Cloudflare Pages.

## Rodar no computador

```bash
npm install
npm run dev      # abre em http://localhost:4321
npm run build    # gera o site final na pasta dist/
```

## Estrutura

```
public/media/            vídeo de abertura, logos, imagens da loja
src/layouts/Base.astro   menu, comunidade, rodapé e idioma (todas as páginas)
src/components/          Intro (vídeo), Eagle (águia 3D), PageHero
src/pages/               index (home), artigos, cursos, loja
src/scripts/i18n.js      todos os textos em português e inglês
src/styles/global.css    cores, fontes e estilos
src/data/eagle.json      pontos da águia 3D (gerados da silhueta da logo)
```

## Onde mexer

- Textos: `src/scripts/i18n.js` (PT e EN lado a lado).
- Links da Escola, WhatsApp e Instagram: topo de `src/layouts/Base.astro`.
- Cores oficiais: começo de `src/styles/global.css` (preto, branco, creme #F8E9B7, cobre #BF8957, areia #CAB5A0).

## Pendências

- Logo oficial em SVG para o menu (hoje é um recorte do vídeo).
- Capa oficial do livro *Igreja do Fim* e preços da loja.
- Conteúdo de Artigos e Cursos; integração Hotmart e Mercado Pago.
