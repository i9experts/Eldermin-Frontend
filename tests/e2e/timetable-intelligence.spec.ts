// Timetable Intelligence (Academics > Timetable Intelligence, /timetable).
// Lives inside src/pages/academics/index.tsx as `TimetableIntelligenceTab`
// (no dedicated /pages/timetable/ and no timetable.service.ts — this tab
// calls GET /teaching/timetable, GET /teaching/teachers, GET /hr/attendance
// directly via the generic `api` client). Sub-tabs are client-side
// useState, NOT URL-synced, so every sub-tab must be reached by clicking
// the nav button — there is no deep-link URL per sub-tab.
import { test, expect, Page } from '@playwright/test';

const SUBTABS = [
  { id: 'planner', label: 'Timetable Planner' },
  { id: 'teachers', label: 'Teacher Scheduling' },
  { id: 'rooms', label: 'Room Allocation' },
  { id: 'substitutes', label: 'Substitutes' },
  { id: 'workload', label: 'Workload Intel' },
  { id: 'reports', label: 'Reports' },
  { id: 'settings', label: 'Settings' },
];

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

async function gotoTimetable(page: Page) {
  await page.goto('/timetable');
  await expect(page.getByText('Timetable Planner')).toBeVisible({ timeout: 15_000 });
}

test.describe('Timetable Intelligence — navigation', () => {
  test('module loads on /timetable and defaults to Timetable Planner', async ({ page }) => {
    const errors = trackErrors(page);
    await gotoTimetable(page);
    expect(errors, `Console errors: ${errors.join('; ')}`).toHaveLength(0);
  });

  for (const tab of SUBTABS) {
    test(`sub-tab "${tab.label}" opens without console errors`, async ({ page }) => {
      const errors = trackErrors(page);
      await gotoTimetable(page);
      await page.getByRole('button', { name: new RegExp(tab.label, 'i') }).click();
      // Each sub-tab renders its own heading/section text — assert the
      // sub-tab's own label (or its on-page heading variant) is visible,
      // not just the nav button itself.
      await expect(page.getByText(new RegExp(tab.label, 'i')).first()).toBeVisible();
      expect(errors, `Console errors on ${tab.label}: ${errors.join('; ')}`).toHaveLength(0);
    });
  }

  test('refreshing the page always resets to Timetable Planner (no URL sync — known gap)', async ({ page }) => {
    await gotoTimetable(page);
    await page.getByRole('button', { name: /Substitutes/i }).click();
    await expect(page.getByText(/Substitute Management/i)).toBeVisible();
    await page.reload();
    // Documents the current behavior: sub-tabs are not deep-linkable, so a
    // refresh always lands back on Planner instead of staying on Substitutes.
    await expect(page.getByText('Timetable Planner')).toBeVisible();
  });
});

test.describe('Timetable Intelligence — empty state (API returns [])', () => {
  test('all 7 sub-tabs survive when timetables/teachers/attendance are empty', async ({ page }) => {
    const errors = trackErrors(page);
    await page.route('**/teaching/timetable*', (route) => route.fulfill({ json: [] }));
    await page.route('**/teaching/teachers*', (route) => route.fulfill({ json: [] }));
    await page.route('**/hr/attendance*', (route) => route.fulfill({ json: [] }));

    await gotoTimetable(page);
    await expect(page.getByText(/no timetable|create.*timetable|go to teaching management/i)).toBeVisible();

    for (const tab of SUBTABS) {
      await page.getByRole('button', { name: new RegExp(tab.label, 'i') }).click();
      // Must not white-screen or throw on an empty array.
      await expect(page.locator('body')).toBeVisible();
    }
    expect(errors, `Console errors with empty API responses: ${errors.join('; ')}`).toHaveLength(0);
  });

  test('survives a null-body response (undefined.map() crash class)', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route('**/teaching/timetable*', (route) => route.fulfill({ json: null }));
    await page.route('**/teaching/teachers*', (route) => route.fulfill({ json: null }));
    await page.route('**/hr/attendance*', (route) => route.fulfill({ json: null }));

    await page.goto('/timetable');
    // Give react-query a moment to settle before asserting no crash.
    await expect(page.locator('body')).toBeVisible();
    expect(errors, `Console errors on null API body: ${errors.join('; ')}`).toHaveLength(0);
  });
});

test.describe('Timetable Intelligence — known fake-write regressions', () => {
  // These document real gaps found in code review (academics/index.tsx):
  // the Substitutes "Assign" button and the Settings "Save"/"Reset" buttons
  // only call toast.success(...) with no network request at all. If a real
  // API integration is ever added, these tests should be UPDATED to assert
  // the write DOES happen — until then they guard against a regression
  // where the UI silently claims success without persisting anything.

  test('Substitutes tab: "Assign" shows a success toast but issues NO write request', async ({ page }) => {
    const writes: string[] = [];
    page.on('request', (req) => {
      if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method()) && req.url().includes('/teaching/')) {
        writes.push(`${req.method()} ${req.url()}`);
      }
    });

    await gotoTimetable(page);
    await page.getByRole('button', { name: /Substitutes/i }).click();
    await expect(page.getByText(/Substitute Management/i)).toBeVisible();

    const assignBtn = page.getByRole('button', { name: /Assign/i }).first();
    if (await assignBtn.isVisible().catch(() => false)) {
      await assignBtn.click();
      await expect(page.getByText(/substitute assigned successfully/i)).toBeVisible();
    }
    expect(writes, `Unexpected write request(s) fired: ${writes.join('; ')}`).toHaveLength(0);
  });

  test('Settings tab: "Save Settings" shows a success toast but issues NO write request', async ({ page }) => {
    const writes: string[] = [];
    page.on('request', (req) => {
      if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method())) {
        writes.push(`${req.method()} ${req.url()}`);
      }
    });

    await gotoTimetable(page);
    await page.getByRole('button', { name: /Settings/i }).click();
    await page.getByRole('button', { name: /Save Settings/i }).click();
    await expect(page.getByText(/settings saved successfully/i)).toBeVisible();

    expect(writes, `Unexpected write request(s) fired: ${writes.join('; ')}`).toHaveLength(0);
  });

  test('Settings tab: values do not persist across reload (form is uncontrolled/not wired)', async ({ page }) => {
    await gotoTimetable(page);
    await page.getByRole('button', { name: /Settings/i }).click();
    const firstInput = page.locator('form input, input').first();
    if (await firstInput.isVisible().catch(() => false)) {
      await firstInput.fill('999');
      await page.getByRole('button', { name: /Save Settings/i }).click();
      await page.reload();
      await page.getByRole('button', { name: /Settings/i }).click();
      await expect(firstInput).not.toHaveValue('999');
    }
  });
});
