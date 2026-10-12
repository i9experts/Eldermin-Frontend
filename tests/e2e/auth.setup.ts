import { test as setup, expect } from '@playwright/test';
const ADMIN = { email: 'admin@demo-school.com', password: 'Admin@1234' };
setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login');
  // getByLabel, not getByPlaceholder - placeholder text is redesign churn
  // (this file broke once already when Login.tsx's placeholders changed);
  // the Email address/Password <label>s are now htmlFor-linked to their
  // inputs specifically so this stays stable across future visual changes.
  await page.getByLabel(/email address/i).fill(ADMIN.email);
  await page.getByLabel(/^password$/i).fill(ADMIN.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 15_000 });
  await page.context().storageState({ path: 'tests/e2e/.auth/admin.json' });
});
