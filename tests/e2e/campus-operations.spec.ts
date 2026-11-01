import { test, expect } from '@playwright/test';

// Campus Operations (/campus) - module smoke + empty-state coverage.
// Tabs: Dashboard, Buildings, Rooms, Maintenance, Transport, Hostel,
// Security, Utilities, Reports. See src/pages/campus/index.tsx.

const TABS = [
  { name: /dashboard/i, heading: /campus operations/i },
  { name: /buildings/i, heading: /building management/i },
  { name: /rooms/i, heading: /room/i },
  { name: /maintenance/i, heading: /maintenance ticket/i },
  { name: /transport/i, heading: /vehicle fleet/i },
  { name: /hostel/i, heading: /hostel allocation/i },
  { name: /security/i, heading: /visitor/i },
  { name: /utilities/i, heading: /utilit/i },
  { name: /reports/i, heading: /report/i },
];

test('Campus Operations loads without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/campus');
  await expect(page.getByRole('heading').first()).toBeVisible();
  expect(errors, `Console errors: ${errors.join('; ')}`).toHaveLength(0);
});

for (const tab of TABS) {
  test(`${tab.name} tab opens without errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/campus');
    await page.getByRole('tab', { name: tab.name }).click();
    await expect(page.getByText(tab.heading).first()).toBeVisible();
    expect(errors, `Console errors on ${tab.name}: ${errors.join('; ')}`).toHaveLength(0);
  });
}

test.describe('empty-state pass', () => {
  const emptyRoutes: Array<{ path: string; label: string }> = [
    { path: '**/api/v1/campus/buildings**', label: 'buildings' },
    { path: '**/api/v1/campus/rooms**', label: 'campus rooms' },
    { path: '**/api/v1/campus/maintenance**', label: 'maintenance' },
    { path: '**/api/v1/campus/transport/vehicles**', label: 'vehicles' },
    { path: '**/api/v1/campus/hostel/allocations**', label: 'hostel allocations' },
    { path: '**/api/v1/campus/visitors**', label: 'visitors' },
    { path: '**/api/v1/campus/utilities**', label: 'utility readings' },
  ];

  for (const { path, label } of emptyRoutes) {
    test(`renders an empty state, not a crash, when ${label} is []`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.route(path, (route) => route.fulfill({ json: { data: [], meta: { total: 0 } } }));
      await page.goto('/campus');
      await expect(page.getByRole('heading').first()).toBeVisible();
      expect(errors, `Console errors with empty ${label}: ${errors.join('; ')}`).toHaveLength(0);
    });

    test(`survives a null-body response for ${label} (no undefined.map crash)`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.route(path, (route) => route.fulfill({ json: {} }));
      await page.goto('/campus');
      await expect(page.getByRole('heading').first()).toBeVisible();
      expect(errors, `Console errors with null-body ${label}: ${errors.join('; ')}`).toHaveLength(0);
    });
  }

  test('dashboard survives a null-body /campus/dashboard response', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route('**/api/v1/campus/dashboard', (route) => route.fulfill({ json: {} }));
    await page.goto('/campus');
    await expect(page.getByRole('heading').first()).toBeVisible();
    expect(errors, `Console errors: ${errors.join('; ')}`).toHaveLength(0);
  });
});

test.describe('Maintenance', () => {
  test('creating a ticket appears in the list without a refresh', async ({ page }) => {
    await page.goto('/campus');
    await page.getByRole('tab', { name: /maintenance/i }).click();
    await page.getByRole('button', { name: /new ticket/i }).click();
    const title = `E2E Leaky tap ${Date.now()}`;
    await page.getByPlaceholder(/describe the issue/i).fill(title);
    // Building/Location falls back to free text when no buildings exist yet.
    const buildingField = page.getByPlaceholder(/room 12, block a/i);
    if (await buildingField.isVisible().catch(() => false)) await buildingField.fill('Block A');
    await page.getByRole('button', { name: /create ticket/i }).click();
    await expect(page.getByText(title)).toBeVisible();
  });

  test('editing a ticket persists the change, not a fake success toast', async ({ page }) => {
    await page.goto('/campus');
    await page.getByRole('tab', { name: /maintenance/i }).click();
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow).toBeVisible();
    await firstRow.getByTitle('Edit').click();
    const newTitle = `E2E Updated ${Date.now()}`;
    const titleInput = page.getByPlaceholder(/describe the issue/i);
    await titleInput.fill(newTitle);
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByText('Ticket updated')).toBeVisible();
    // Regression guard: this used to show the exact same toast while
    // silently discarding the edit - reload and confirm it actually saved.
    await page.reload();
    await page.getByRole('tab', { name: /maintenance/i }).click();
    await expect(page.getByText(newTitle)).toBeVisible();
  });
});

test.describe('Hostel', () => {
  test('Allocate Bed requires a student, block, and room before saving', async ({ page }) => {
    await page.goto('/campus');
    await page.getByRole('tab', { name: /hostel/i }).click();
    await page.getByRole('button', { name: /allocate bed/i }).click();
    await page.getByRole('button', { name: /allocate bed/i }).last().click();
    await expect(page.getByText(/select a student, block, and room/i)).toBeVisible();
  });
});
