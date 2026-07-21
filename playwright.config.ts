import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  outputDir: 'test-results',
  fullyParallel: false,
  timeout: 60_000,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [['line'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173/dajare-sencho-kokugo/',
    viewport: { width: 810, height: 1080 },
    colorScheme: 'light',
    locale: 'ja-JP',
    serviceWorkers: 'allow',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-ipad-portrait',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 810, height: 1080 },
        deviceScaleFactor: 1,
        hasTouch: true,
        isMobile: true,
      },
    },
  ],
  webServer: {
    command: 'npm run preview:e2e',
    url: 'http://127.0.0.1:4173/dajare-sencho-kokugo/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
