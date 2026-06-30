import { test as setup, expect } from '@playwright/test';
const ADMIN = { email: 'admin@demo-school.com', password: 'Admin@1234' };
setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login');
  await page.getByPlaceholder('admin@eduos.com').fill(ADMIN.email);
  await page.getByPlaceholder('••••••••').fill(ADMIN.password);
  await page.getByPlaceholder('••••••••').press('Enter');
  await expect(page).toHaveURL(/dashboard/, { timeout: 15_000 });
  await page.context().storageState({ path: 'tests/e2e/.auth/admin.json' });
});
