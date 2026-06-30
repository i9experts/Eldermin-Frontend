# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.setup.ts >> authenticate as admin
- Location: tests/e2e/auth.setup.ts:3:1

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /dashboard/
Received string:  "http://localhost:5173/login"
Timeout: 15000ms

Call log:
  - Expect "toHaveURL" with timeout 15000ms
    34 × unexpected value "http://localhost:5173/login"

```

```yaml
- img "Eldermin"
- paragraph: Elevate. Administer. Excel.
- heading "Welcome back" [level=2]
- paragraph: Sign in to your account to continue
- text: Cannot POST /api/v1/api/v1/auth/login Email address
- textbox "admin@eduos.com": admin@demo-school.com
- text: Password
- textbox "••••••••": Admin@1234
- button
- checkbox "Remember me"
- text: Remember me
- button "Forgot password?"
- button "Sign In"
- paragraph: Demo credentials
- paragraph: "Email: admin@demo-school.com"
- paragraph: "Password: Admin@1234"
- paragraph: © 2026 Eldermin. All rights reserved.
```

# Test source

```ts
  1  | import { test as setup, expect } from '@playwright/test';
  2  | const ADMIN = { email: 'admin@demo-school.com', password: 'Admin@1234' };
  3  | setup('authenticate as admin', async ({ page }) => {
  4  |   await page.goto('/login');
  5  |   await page.getByPlaceholder('admin@eduos.com').fill(ADMIN.email);
  6  |   await page.getByPlaceholder('••••••••').fill(ADMIN.password);
  7  |   await page.getByPlaceholder('••••••••').press('Enter');
> 8  |   await expect(page).toHaveURL(/dashboard/, { timeout: 15_000 });
     |                      ^ Error: expect(page).toHaveURL(expected) failed
  9  |   await page.context().storageState({ path: 'tests/e2e/.auth/admin.json' });
  10 | });
  11 | 
```