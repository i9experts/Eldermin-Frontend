// Super Admin CRM - Leads Pipeline.
// Run: E2E_SUPER_ADMIN_EMAIL=... E2E_SUPER_ADMIN_PASSWORD=... npx playwright test tests/e2e/crm-leads.spec.ts
//
// This whole suite needs a REAL super_admin login, not just mocked API
// data: /super-admin is wrapped in <ProtectedRoute permission="super_admin:view">
// (src/App.tsx), which redirects anything else straight to /unauthorized
// before CRMTab ever mounts - mocking '**/api/v1/leads**' doesn't help if
// the route itself never renders. The shared 'chromium' project's
// storageState (auth.setup.ts) logs in as the demo-school
// institution_owner, which is NOT a super_admin, so this file does its own
// real login per test instead of relying on that shared session, and the
// whole describe block is skipped (not run against the wrong role, and not
// a false pass) when no super_admin credentials are configured.
//
// CRM is also not the default Super Admin tab ('Command Center' is, see
// src/pages/super-admin/index.tsx TABS[0]) and tab switching is a plain
// onClick + useSearchParams, not role="tab" - so every test here navigates
// straight to '/super-admin?tab=crm' rather than clicking a tab button.
import { test, expect, Page } from '@playwright/test';

const EMAIL = process.env.E2E_SUPER_ADMIN_EMAIL;
const PASSWORD = process.env.E2E_SUPER_ADMIN_PASSWORD;

async function loginAsSuperAdmin(page: Page) {
  await page.goto('/login');
  await page.getByLabel(/email address/i).fill(EMAIL!);
  await page.getByLabel(/^password$/i).fill(PASSWORD!);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 15_000 });
}

const SAMPLE_LEADS = [
  {
    _id: 'lead1', schoolName: 'Dar Ut Tarteel', city: 'Karachi',
    adminName: 'Muhammad Waqar', adminEmail: 'info@tarteels.com',
    source: 'onboarding_wizard', stage: 'converted', createdAt: '2026-09-25T00:00:00.000Z',
    convertedInstitutionId: 'inst1', notes: [], modulesRequested: [],
  },
  {
    _id: 'lead2', schoolName: 'QA Fresh Lead', city: 'Lahore',
    adminName: 'Jane Prospect', adminEmail: 'jane@example.com',
    source: 'contact_form', stage: 'new', createdAt: '2026-10-01T00:00:00.000Z',
    convertedInstitutionId: null, notes: [], modulesRequested: [],
  },
];

const STATS = { new: 1, contacted: 1, demo_scheduled: 0, trial: 0, converted: 6, lost: 1 };
const STAFF = [{ id: 'staff1', name: 'Sarah Sales', email: 'sarah@eldermin.com', isActive: true }];

test.describe('CRM Leads Pipeline', () => {
  test.skip(!EMAIL || !PASSWORD, 'Set E2E_SUPER_ADMIN_EMAIL/E2E_SUPER_ADMIN_PASSWORD - this screen is super_admin-only and the shared chromium session is a regular institution_owner.');

  test.beforeEach(async ({ page }) => {
    // Routes must be registered before navigation/login so they're already
    // active the moment CRMTab's queries fire.
    await page.route('**/api/v1/leads/stats', route => route.fulfill({ json: STATS }));
    await page.route('**/api/v1/leads?stage=*', route => {
      const url = new URL(route.request().url());
      const stage = url.searchParams.get('stage');
      route.fulfill({ json: SAMPLE_LEADS.filter(l => l.stage === stage) });
    });
    await page.route('**/api/v1/leads', route => {
      if (route.request().method() === 'GET') return route.fulfill({ json: SAMPLE_LEADS });
      return route.continue();
    });
    await page.route('**/api/v1/super-admin/team/staff', route => route.fulfill({ json: STAFF }));
    await loginAsSuperAdmin(page);
  });

  test('renders the pipeline heading, all 6 stage cards, and the leads table', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/super-admin?tab=crm');
    await expect(page.getByText('CRM — Leads Pipeline')).toBeVisible();
    for (const label of ['New', 'Contacted', 'Demo Scheduled', 'Trial', 'Converted', 'Lost']) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
    await expect(page.getByText('Dar Ut Tarteel')).toBeVisible();
    expect(errors, `Console errors: ${errors.join('; ')}`).toHaveLength(0);
  });

  test('stage card count matches the stats endpoint', async ({ page }) => {
    await page.goto('/super-admin?tab=crm');
    const convertedCard = page.getByText('Converted', { exact: true }).locator('..');
    await expect(convertedCard.getByText('6')).toBeVisible();
  });

  test('clicking a stage card filters the table to that stage', async ({ page }) => {
    await page.goto('/super-admin?tab=crm');
    await page.getByText('New', { exact: true }).click();
    await expect(page.getByText('QA Fresh Lead')).toBeVisible();
    await expect(page.getByText('Dar Ut Tarteel')).not.toBeVisible();
  });

  test('"All Leads" clears the stage filter again', async ({ page }) => {
    await page.goto('/super-admin?tab=crm');
    await page.getByText('New', { exact: true }).click();
    await page.getByRole('button', { name: 'All Leads' }).click();
    await expect(page.getByText('Dar Ut Tarteel')).toBeVisible();
    await expect(page.getByText('QA Fresh Lead')).toBeVisible();
  });

  test('clicking a row opens the lead detail modal with Stage, Source and Notes', async ({ page }) => {
    await page.goto('/super-admin?tab=crm');
    await page.getByText('QA Fresh Lead').click();
    await expect(page.getByText('Jane Prospect · jane@example.com')).toBeVisible();
    await expect(page.getByText('Contact form')).toBeVisible();
    await expect(page.getByText('Activate Institution')).toBeVisible();
  });

  // Previously a KNOWN GAP (see QA report): assignedTo existed in the
  // schema/API but had no UI control at all. Fixed with a picker reusing
  // the Team & Access staff list.
  test('assigning a lead to a staff member persists via the Assigned to picker', async ({ page }) => {
    let patchedBody: any;
    await page.route('**/api/v1/leads/lead2', route => {
      if (route.request().method() === 'PATCH') {
        patchedBody = route.request().postDataJSON();
        return route.fulfill({ json: { ...SAMPLE_LEADS[1], assignedTo: STAFF[0] } });
      }
      return route.continue();
    });
    await page.goto('/super-admin?tab=crm');
    await page.getByText('QA Fresh Lead').click();
    await page.getByLabel('Assigned to').selectOption({ label: 'Sarah Sales' });
    await expect.poll(() => patchedBody?.assignedTo).toBe('staff1');
  });

  test('UTM/campaign attribution shows in the detail modal when present', async ({ page }) => {
    await page.unroute('**/api/v1/leads?stage=*');
    await page.route('**/api/v1/leads?stage=*', route => route.fulfill({
      json: SAMPLE_LEADS.filter(l => l.stage === 'new').map(l => ({ ...l, utmSource: 'google', utmMedium: 'cpc', utmCampaign: 'qa-campaign' })),
    }));
    await page.goto('/super-admin?tab=crm');
    await page.getByText('QA Fresh Lead').click();
    await expect(page.getByText('google / cpc / qa-campaign')).toBeVisible();
  });

  test('an already-converted lead with convertedInstitutionId shows "already activated", not the Activate button', async ({ page }) => {
    await page.goto('/super-admin?tab=crm');
    await page.getByText('Dar Ut Tarteel').click();
    await expect(page.getByText(/already been activated as a live institution/i)).toBeVisible();
    await expect(page.getByText('Activate Institution')).not.toBeVisible();
  });

  test('empty state: table shows a real message, not a blank table, when API returns []', async ({ page }) => {
    await page.unroute('**/api/v1/leads');
    await page.route('**/api/v1/leads', route => {
      if (route.request().method() === 'GET') return route.fulfill({ json: [] });
      return route.continue();
    });
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/super-admin?tab=crm');
    await expect(page.getByText(/no leads yet/i)).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  // Previously a KNOWN GAP (see QA report): no search/text-filter input
  // existed at all, only the 6 stage cards + "All Leads". Fixed with a
  // client-side search box over school/contact/email.
  test('search box filters the table by school, contact name, or email', async ({ page }) => {
    await page.goto('/super-admin?tab=crm');
    await page.getByPlaceholder(/search school, contact, or email/i).fill('jane@example.com');
    await expect(page.getByText('QA Fresh Lead')).toBeVisible();
    await expect(page.getByText('Dar Ut Tarteel')).not.toBeVisible();
  });

  test('adding a note persists and appears in the list without a page refresh', async ({ page }) => {
    await page.goto('/super-admin?tab=crm');
    await page.getByText('QA Fresh Lead').click();
    const note = `QA note ${Date.now()}`;
    // addLeadNote POSTs then invalidates the detail/list queries - respond
    // to the POST with the lead + new note appended so the refetch the
    // invalidation triggers has somewhere real to read it back from.
    await page.route('**/api/v1/leads/lead2/notes', route =>
      route.fulfill({ json: { ...SAMPLE_LEADS[1], notes: [{ text: note, authorName: 'QA', createdAt: new Date().toISOString() }] } }));
    await page.getByPlaceholder('Add a note...').fill(note);
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByText(note)).toBeVisible();
  });
});
