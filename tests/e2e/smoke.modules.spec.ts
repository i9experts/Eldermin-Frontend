import { test, expect } from '@playwright/test';

test('dashboard loads without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/dashboard');
  await expect(page.getByRole('heading').first()).toBeVisible();
  expect(errors, `Console errors: ${errors.join('; ')}`).toHaveLength(0);
});

test('Staff HR loads without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/hr');
  await expect(page.getByRole('heading').first()).toBeVisible();
  expect(errors).toHaveLength(0);
});

test('Finance loads without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/finance');
  await expect(page.getByRole('heading').first()).toBeVisible();
  expect(errors).toHaveLength(0);
});

test('Students loads without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/students');
  await expect(page.getByRole('heading').first()).toBeVisible();
  expect(errors).toHaveLength(0);
});

test('Staff list empty state does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/api/v1/hr/staff**', route =>
    route.fulfill({ json: { data: [], total: 0 } }));
  await page.goto('/hr');
  await expect(page.getByRole('heading').first()).toBeVisible();
  expect(errors).toHaveLength(0);
});
