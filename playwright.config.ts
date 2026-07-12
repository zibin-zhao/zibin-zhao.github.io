import { defineConfig, devices } from '@playwright/test';
import process from 'node:process';

// Playwright enables color in child processes; avoid Node warning about conflicting inherited flags.
delete process.env.NO_COLOR;

const host = '127.0.0.1';
const port = 43217;
const baseURL = `http://${host}:${port}`;

export default defineConfig({
  testDir: './tests/browser',
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
    command: `npm run dev -- --host ${host} --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
