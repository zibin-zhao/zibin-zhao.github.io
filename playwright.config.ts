import { defineConfig, devices } from '@playwright/test';
import process from 'node:process';

// Playwright enables color in child processes; avoid Node warning about conflicting inherited flags.
delete process.env.NO_COLOR;

const host = '127.0.0.1';
const port = 43217;
const baseURL = `http://${host}:${port}`;

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  reporter: 'line',
  outputDir: 'test-results/playwright',
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run build && npm run preview -- --host ${host} --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'regression',
      testMatch: '**/browser/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'canonical-768',
      testMatch: '**/e2e/stitch.spec.ts',
      use: { viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'desktop',
      testMatch: '**/e2e/stitch.spec.ts',
      use: { viewport: { width: 1440, height: 1000 } },
    },
    {
      name: 'mobile',
      testMatch: '**/e2e/stitch.spec.ts',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } },
    },
  ],
});
