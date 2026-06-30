// /root/eduos-frontend/tests/e2e/auth.setup.ts
// Logs in once as the demo admin and saves session state reused by all specs.
import { test as setup, expect } from '@playwright/test';

const ADMIN = { email: 'admin@demo-school.com', password: 'Admin@1234' };

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(ADMIN.email);
  await page.getByLabel(/password/i).fill(ADMIN.password);
  await page.getByRole('button', { name: /sign in|login/i }).click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 15_000 });
  await page.context().storageState({ path: 'tests/e2e/.auth/admin.json' });
});
