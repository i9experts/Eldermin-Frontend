// /root/eduos-frontend/tests/e2e/smoke.modules.spec.ts
// Pre-demo smoke: every module in sidebar groups A–G opens without JS errors.
// Run: npx playwright test tests/e2e/smoke.modules.spec.ts
//
// NOTE: link names use the UI labels from the spec (section 22). If your
// sidebar uses different text for any module, adjust the `name` regex only.
import { test, expect } from '@playwright/test';

type Mod = { group: RegExp; name: RegExp; heading: RegExp };

const modules: Mod[] = [
  // A. Foundation
  { group: /foundation/i, name: /institution setup|organization/i, heading: /institution|organization/i },
  { group: /foundation/i, name: /governance|compliance/i, heading: /governance|compliance/i }, // frontend-only: must show honest empty state, not crash
  { group: /foundation/i, name: /documents/i, heading: /documents/i },
  // B. People
  { group: /people/i, name: /staff|human resource|hr/i, heading: /staff|hr/i },
  { group: /people/i, name: /teaching|teacher/i, heading: /teaching|teacher/i },
  // C. Finance & Administration
  { group: /finance/i, name: /^finance$|financial/i, heading: /finance/i },
  { group: /finance/i, name: /procurement/i, heading: /procurement/i },
  { group: /finance/i, name: /campus operations/i, heading: /campus/i },
  // D. Admissions
  { group: /admission/i, name: /admission/i, heading: /admission/i },
  // E. Academics
  { group: /academic/i, name: /curriculum/i, heading: /curriculum/i },
  { group: /academic/i, name: /syllabus/i, heading: /syllabus/i },
  { group: /academic/i, name: /timetable/i, heading: /timetable/i },
  { group: /academic/i, name: /library/i, heading: /library/i },
  // F. Students
  { group: /students/i, name: /student 360|student profile/i, heading: /student/i },
  { group: /students/i, name: /assessment/i, heading: /assessment/i },
  { group: /students/i, name: /behaviour|tarbiyah/i, heading: /behaviour|tarbiyah/i },
  // G. Intelligence
  { group: /intelligence/i, name: /analytics|data intelligence/i, heading: /analytics|intelligence/i },
];

for (const m of modules) {
  test(`module loads without errors: ${m.name.source}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/dashboard');
    await expect(page.getByRole('heading').first()).toBeVisible();

    // Expand the sidebar group if collapsed, then open the module.
    const groupToggle = page.getByText(m.group).first();
    if (await groupToggle.isVisible()) await groupToggle.click();
    await page.getByRole('link', { name: m.name }).first().click();

    await expect(page.getByRole('heading', { name: m.heading }).first()).toBeVisible();
    expect(errors, `Console errors: ${errors.join('; ')}`).toHaveLength(0);
  });
}

test('global header renders all components on dashboard', async ({ page }) => {
  await page.goto('/dashboard');
  // Campus switcher, academic year switcher, search, notifications, profile.
  await expect(page.getByRole('heading').first()).toBeVisible();
  const headerChecks: RegExp[] = [/campus/i, /20\d\d/, /search/i];
  for (const re of headerChecks) {
    await expect(
      page.getByText(re).first().or(page.getByPlaceholder(re).first()).or(page.getByRole('button', { name: re }).first()),
    ).toBeVisible();
  }
});
