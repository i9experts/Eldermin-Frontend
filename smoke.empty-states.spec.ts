// /root/eduos-frontend/tests/e2e/smoke.empty-states.spec.ts
// Eldermin's #1 bug class: undefined.map() crashes when the API returns
// empty or unexpected bodies. Each critical list gets two tests:
//   1) API returns [] -> page shows an empty state
//   2) API returns {} (null body) -> page must not crash (no pageerror)
// Run: npx playwright test tests/e2e/smoke.empty-states.spec.ts
//
// Adjust the `route` glob and `path` if your URL paths differ.
import { test, expect } from '@playwright/test';

const lists = [
  { name: 'Staff list',    route: '**/hr/staff*',   path: '/hr/staff',  empty: /no staff|empty|add your first/i },
  { name: 'Student list',  route: '**/students*',   path: '/students',  empty: /no students|empty|add your first/i },
  { name: 'Finance / invoices', route: '**/finance/**', path: '/finance', empty: /no (invoices|transactions|records)|empty/i },
];

for (const l of lists) {
  test(`${l.name}: renders empty state when API returns []`, async ({ page }) => {
    await page.route(l.route, (route) => route.fulfill({ json: { data: [], total: 0 } }));
    await page.goto(l.path);
    await expect(page.getByText(l.empty).first()).toBeVisible();
  });

  test(`${l.name}: survives null body without crashing`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route(l.route, (route) => route.fulfill({ json: {} }));
    await page.goto(l.path);
    await expect(page.getByRole('heading').first()).toBeVisible();
    expect(errors, `Crash on null body: ${errors.join('; ')}`).toHaveLength(0);
  });
}

// Gov & Compliance has NO backend — the page must show an honest
// placeholder/empty state on its own, with zero JS errors.
test('Gov & Compliance (frontend-only) shows placeholder without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/compliance');
  await expect(page.getByRole('heading', { name: /governance|compliance/i }).first()).toBeVisible();
  expect(errors, `Errors: ${errors.join('; ')}`).toHaveLength(0);
});
