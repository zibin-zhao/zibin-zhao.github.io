import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import pastDesigns from './tools/past-designs.json' with { type: 'json' };

export default defineConfig({
  site: 'https://zibinzhao.com',
  integrations: [sitemap({ filter: (page) => !page.includes('/past/') })],
  redirects: Object.fromEntries(
    pastDesigns.flatMap((design) =>
      design.supersedes.flatMap((previous) =>
        ['', '/zh'].map((prefix) => [
          `${prefix}/past/${previous}/`,
          `${prefix}/past/${design.id}/`,
        ]),
      ),
    ),
  ),
  build: { format: 'directory' },
});
