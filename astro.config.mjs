import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // TODO: switch to 'https://zibinzhao.com' + re-add public/CNAME once the domain is registered.
  site: 'https://zibin-zhao.github.io',
  integrations: [sitemap()],
  build: { format: 'directory' },
});
