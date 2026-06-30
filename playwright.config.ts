// /root/eduos-frontend/playwright.config.ts
// Setup: npm i -D @playwright/test && npx playwright install chromium --with-deps
// Run:   npx playwright test
// VPS:   E2E_BASE_URL=http://93.127.163.238:5173 npx playwright test
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: { storageState: 'tests/e2e/.auth/admin.json' },
      dependencies: ['setup'],
    },
  ],
});
