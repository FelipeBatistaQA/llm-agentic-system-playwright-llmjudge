import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  testDir: './tests',
  timeout: process.env.CI ? 60000 : 120000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['blob'], ['json', { outputFile: 'test-results/results.json' }]]
    : [['html'], ['json', { outputFile: 'test-results/results.json' }]],
  use: {
    // Disable trace in CI to avoid hanging issues
    trace: 'on',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: process.env.CI ? [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-extensions',
            '--disable-background-timer-throttling',
            '--disable-renderer-backgrounding',
            '--disable-backgrounding-occluded-windows',
            '--disable-web-security',
            '--force-device-scale-factor=1',
          ] : [],
        },
      },
    },
  ],
});
