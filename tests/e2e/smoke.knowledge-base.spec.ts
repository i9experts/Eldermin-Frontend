import { test, expect } from '@playwright/test';

// Mocked KB articles for the 3 HR tabs this smoke test opens the drawer
// on, plus one more used by the standalone page + search tests below.
const ARTICLES: Record<string, { module: string; tabKey: string; title: string; tagline: string; body: string; steps: string[]; order: number }> = {
  dashboard: {
    module: 'hr', tabKey: 'dashboard', order: 1,
    title: 'Dashboard',
    tagline: "Your morning read on the whole staff.",
    body: 'Every time you open Staff & HR, this is the screen you land on.',
    steps: ['Check the top row first.', 'Use the Quick Action tiles.'],
  },
  employees: {
    module: 'hr', tabKey: 'employees', order: 2,
    title: 'Employees',
    tagline: 'The single source of truth for every person on payroll.',
    body: 'This is the master directory.',
    steps: ['Click + Add Employee for a single new hire.', 'Use Bulk Import for a whole campus.'],
  },
  payroll: {
    module: 'hr', tabKey: 'payroll', order: 8,
    title: 'Payroll',
    tagline: 'Define what staff are paid, run payroll monthly.',
    body: 'Payroll has three layers, in order.',
    steps: ['Set up Salary Components and Templates once.', 'Each month, click + New Payroll Run.'],
  },
};

// RegExp routes (rather than glob strings) to avoid `?` being read as a
// single-character glob wildcard, which would make the list-endpoint
// pattern accidentally also match the per-tab article endpoint.
test.beforeEach(async ({ page }) => {
  await page.route(/\/api\/v1\/kb\/articles\/hr\/[^/?]+/, (route) => {
    const url = new URL(route.request().url());
    const tabKey = url.pathname.split('/').pop()!;
    const article = ARTICLES[tabKey];
    if (!article) return route.fulfill({ status: 404, json: { message: 'not found' } });
    return route.fulfill({ json: article });
  });
  await page.route(/\/api\/v1\/kb\/search/, (route) => {
    const url = new URL(route.request().url());
    const q = (url.searchParams.get('q') || '').toLowerCase();
    const matches = Object.values(ARTICLES).filter(
      (a) => a.title.toLowerCase().includes(q) || a.tagline.toLowerCase().includes(q) || a.body.toLowerCase().includes(q),
    );
    return route.fulfill({ json: matches });
  });
  await page.route(/\/api\/v1\/kb\/articles(\?|$)/, (route) => {
    return route.fulfill({ json: Object.values(ARTICLES) });
  });
});

test('KB button opens the drawer with the right article on 3 different HR tabs', async ({ page }) => {
  await page.goto('/hr');
  await expect(page.getByRole('heading').first()).toBeVisible();

  // Dashboard is the default active tab.
  await page.getByRole('button', { name: 'Open knowledge base help for this tab' }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  await expect(page.getByText('Your morning read on the whole staff.')).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();

  // Switch to Employees, reopen the drawer.
  await page.getByRole('button', { name: 'Employees' }).click();
  await page.getByRole('button', { name: 'Open knowledge base help for this tab' }).click();
  await expect(page.getByRole('heading', { name: 'Employees', exact: true })).toBeVisible();
  await expect(page.getByText('The single source of truth for every person on payroll.')).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();

  // Switch to Payroll, reopen the drawer.
  await page.getByRole('button', { name: 'Payroll' }).click();
  await page.getByRole('button', { name: 'Open knowledge base help for this tab' }).click();
  await expect(page.getByRole('heading', { name: 'Payroll', exact: true })).toBeVisible();
  await expect(page.getByText('Define what staff are paid, run payroll monthly.')).toBeVisible();
});

test('standalone /knowledge-base page loads and search works against a mocked API', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/knowledge-base');
  await expect(page.getByRole('heading', { name: 'Knowledge Base' })).toBeVisible();

  // Sidebar lists the mocked articles.
  await expect(page.getByRole('button', { name: 'Employees' })).toBeVisible();

  // Search narrows to matching articles across modules.
  await page.getByPlaceholder('Search all modules...').fill('payroll');
  await expect(page.getByText('No articles match')).toHaveCount(0);
  await expect(page.getByText('Payroll', { exact: true }).first()).toBeVisible();

  expect(errors).toHaveLength(0);
});
