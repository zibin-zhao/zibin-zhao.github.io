import { defineConfig, devices } from '@playwright/test';
import process from 'node:process';

// Regression traffic is local. Do not route preview readiness checks through a machine proxy.
for (const name of [
  'HTTP_PROXY',
  'HTTPS_PROXY',
  'ALL_PROXY',
  'http_proxy',
  'https_proxy',
  'all_proxy',
])
  delete process.env[name];
delete process.env.NO_COLOR;
const baseURL = 'http://127.0.0.1:43229';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  reporter: [['line'], ['json', { outputFile: 'artifacts/browser/latest.json' }]],
  use: { baseURL, trace: 'retain-on-failure' },
  outputDir: 'test-results/playwright',
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 43229 --ignore-lock',
    // Astro 7 normally backgrounds agent-started servers; Playwright must own its server process.
    env: { ASTRO_PREVIEW_BACKGROUND: '0' },
    url: baseURL,
    reuseExistingServer: false,
    timeout: 60000,
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
    {
      name: 'webkit-phone',
      testMatch: ['**/lanting.spec.ts', '**/past-designs.spec.ts'],
      use: { ...devices['iPhone 13'] },
    },
  ],
});
