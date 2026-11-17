import { defineConfig } from 'astro/config';
import relativeLinks from 'astro-relative-links';

// build.format 'file' + relativeLinks: o site gerado abre direto no navegador
// (duplo clique) e também funciona em qualquer hospedagem estática.
export default defineConfig({
  build: { format: 'file', assets: 'assets' },
  integrations: [relativeLinks()],
});
