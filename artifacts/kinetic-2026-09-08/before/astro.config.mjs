import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://zibinzhao.com',
  integrations: [sitemap()],
  build: { format: 'directory' },
});
