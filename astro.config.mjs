import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.petct-armenia.am',
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'auto' },
  compressHTML: true,
});
