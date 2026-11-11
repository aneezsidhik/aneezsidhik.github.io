// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const PORT = 4173;

module.exports = defineConfig({
  testDir: './test/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled' },
  },
  use: {
    baseURL: `http://localhost:${PORT}`,
    timezoneId: 'Europe/London',
    locale: 'en-GB',
  },
  webServer: {
    command: `npx http-server . -p ${PORT} -c-1 --silent`,
    url: `http://localhost:${PORT}/index.html`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'portrait-1080x1920',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1080, height: 1920 } },
    },
    {
      name: 'portrait-768x1366',
      testMatch: /portrait-layout\.spec\.js/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1366 } },
    },
  ],
});
