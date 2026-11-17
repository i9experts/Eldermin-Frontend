# Super Admin CRM — Leads Pipeline: QA Findings Report

Scope: `src/leads/` + `src/super-admin/` (eldermin-backend) and `src/pages/super-admin/CRMTab.tsx` (Eldermin-Frontend).
Method: full read of the relevant backend schema/controller/service, frontend component/hooks/API client, and a grep of both repos for every related concept (admissions, resellers, campaigns, UTM, activity logs, duplicate checks). All claims below are grounded in the actual code, with file references.

## Bottom line

**The pipeline mechanics work and are well-built.** Stage tracking, filtering, notes, and — most importantly — the "Activate Institution" conversion flow are real, correctly wired, and reasonably careful (idempotency guard against double-activation, reuses the exact same provisioning path as self-service onboarding). This is not a half-built screen.

**But it is not yet a marketing-campaign CRM — it's a pipeline viewer with no intake.** The one thing missing that undercuts everything else: **nothing in either codebase actually creates a Lead today.** The onboarding wizard doesn't call it. There's no contact-us/request-demo form anywhere in the frontend. The public endpoint exists and is reachable, but it's orphaned — a correct door with no hallway leading to it. Every lead currently visible in your screenshot had to be created by hand (direct DB insert or a manual API call), not by a prospect filling anything in. Until that's wired up, this screen cannot do the one job a sales CRM exists for.

---

## 1. Is it working properly?

Yes, for what's wired up. Specifically verified by reading the code (not just the UI):

- Stage cards, filtering, "All Leads" toggle — all genuinely functional, not decorative.
- Lead detail modal — stage changes and notes both really persist via `PATCH /leads/:id` and `POST /leads/:id/notes`, with React Query invalidation so the table/modal update without a manual refresh.
- **"Activate Institution" is the standout piece of real engineering here.** It doesn't just flip a label — it creates a real Tenant, Institution, School, Campus, default Grades, an AcademicYear, and a real admin User, explicitly built to be "completely indistinguishable from a self-signed-up school" (the code's own comment, `super-admin.service.ts:428-435`). It links back with `convertedInstitutionId` so you can trace which institution came from which lead. It also correctly refuses to activate an already-activated lead, and refuses if a User with that email already exists.
- No crashes found in the null-safety read-through; the empty-state message is already handled correctly in the table.

What's *not* working, found by reading the code:

- **Two different, disconnected ways to mark a lead "Converted."** The Stage dropdown in the modal can set `stage: 'converted'` directly via the generic update endpoint — this is a **label-only change**. It does not create an institution, does not set `convertedInstitutionId`. Only the separate "Activate Institution" button does the real work. Nothing in the UI warns you these are different actions with very different consequences. **Action for your team:** check whether any of the 6 "Converted" leads in your screenshot have a null `convertedInstitutionId` — if so, those are leads someone marked converted by hand without ever actually creating the school's account.

## 2. Is it developed properly?

Mostly yes, with a few real gaps:

- Good: clean schema, proper DTO validation (`class-validator` on every field), role-gating via `@Roles(SUPER_ADMIN)`, and the conversion flow's reuse of the onboarding provisioning path is a genuinely good design choice (one code path for "how a school gets created," not two to keep in sync).
- Gap: **zero automated tests existed before this QA pass** — I've added a backend Jest+Supertest suite and a frontend Playwright suite (see "Deliverables" below) to close that.
- Gap: **no duplicate-lead protection.** `LeadsService.create()` does a bare insert with no check against `adminEmail` or `schoolName`. There's a Mongo index on `adminEmail` but it's not `unique`. A prospect who submits a form twice (very common — double-clicks, browser back-button resubmits) gets two separate lead rows.
- Gap: **"assign to a rep" exists in the data model and API (`assignedTo` field, accepted by `PATCH /leads/:id`) but has no UI control anywhere.** Right now the field is write-only from a developer's Postman tab — there's no way for a human to actually use it.
- Minor: no structured activity log — just a flat freeform `notes[]` array. Fine for a single-person sales process today; won't scale to "who called when, what was the outcome" reporting once there's a team.

## 3. Does it fulfill the requirement (tracking real leads end to end)?

**Not yet — the "end to end" part is missing at the start, not the finish.** The pipeline from New → Lost is solid. But "end to end" has to include *how a lead gets in*, and today it doesn't:

- The onboarding wizard (`setup-wizard/index.tsx`) never calls `POST /leads`. It only calls `onboardingService.saveStep()`/`.complete()` — and that path *itself* never calls `POST /onboarding/register`, the one method that actually provisions a tenant, or `LeadsService` at all.
- There is no "Contact us" / "Request a demo" page or form anywhere in the frontend, and no corresponding backend route beyond the generic `POST /leads` itself.
- The backend's own demo-seed script never seeds this collection — it only seeds the unrelated, tenant-scoped Admissions-module leads (prospective *students*, a different feature entirely that happens to share the word "Lead").

So right now, "CRM — Leads Pipeline" is an accurate name for a screen that tracks leads *if a human puts them there*. It is not yet tracking real marketing-site traffic.

## 4. Does it cover your marketing campaigns properly?

**No — there's currently no way to tell which campaign, channel, or referral source a lead came from, beyond three static buckets.** Specifically:

- `source` is a hard 3-value enum: `onboarding_wizard | contact_form | manual`. There's no way to say "Facebook ad," "Google search," "referred by [reseller]," or "returning from last year's conference," even though your Resellers module elsewhere tracks its own separate `sourceType` for commission purposes — it isn't connected to this Lead schema at all.
- No UTM parameter capture anywhere (`utm_source`, `utm_campaign`, etc.) — if your marketing site adds campaign links, nothing currently stores which one drove the submission.
- No "which campaign" free-text or tag field exists on the Lead at all (the *Admissions* module's unrelated student-lead schema has a `campaign?: string` field — the CRM one does not).

If campaign attribution matters to you (it should, to know which marketing spend is working), this is the gap to close first — it's a schema + form addition, not a redesign.

---

## Prioritized recommendations

1. **Wire up real intake** (highest priority — nothing else matters without this): add `POST /leads` calls from (a) the public marketing site's contact/demo-request form (build one if it doesn't exist) and (b) the onboarding wizard's first step, so every real prospect actually lands in this pipeline.
2. **Add campaign/source attribution**: extend `source` beyond the 3-value enum (or add a separate `channel`/`campaign` free-text/tag field) and capture UTM params from the submitting page's URL.
3. **Add duplicate detection** on `adminEmail` at creation time — reject, or merge into the existing lead with a new note, rather than silently creating a second row.
4. **Expose `assignedTo` in the UI** — a simple staff-picker dropdown in the lead detail modal, since the API already supports it.
5. **Clarify the two "Converted" paths** — either hide the Stage dropdown's ability to set `converted` directly (force everyone through "Activate Institution"), or clearly label the dropdown option as "Converted (label only — use Activate Institution to actually create the account)".
6. **Add a search box** — school/contact/email text search, since six stage buckets don't scale once lead volume grows.
7. Lower priority: email the prospect their credentials automatically on activation (right now it's a manual copy/paste), and add a structured activity log if/when more than one person works the pipeline.

---

## Deliverables from this QA pass

- `docs-qa/crm-leads-pipeline-qa-checklist.md` — manual QA checklist (copy/paste-ready, `- [ ]` items with severity tags).
- `eldermin-backend/test/e2e/leads.crm.e2e-spec.ts` — Jest+Supertest suite: public-intake validation, the documented duplicate-lead gap (as a named `KNOWN GAP` test, not a silent absence), auth/role gating, the full New→Contacted→Notes→Converted(label-only) pipeline, and the real Activate-Institution conversion + its double-activation guard. The super_admin-gated tests `describe.skip` cleanly (not fail) when `SUPER_ADMIN_EMAIL`/`SUPER_ADMIN_PASSWORD` aren't set — see the file's header comment for the exact run command.
- `Eldermin-Frontend/tests/e2e/crm-leads.spec.ts` — Playwright suite covering the stage cards, filtering, the detail modal, the empty state, the documented no-search-box gap, and a note-adding round trip. Needs `E2E_SUPER_ADMIN_EMAIL`/`E2E_SUPER_ADMIN_PASSWORD` for the same role-gating reason (see the file's header comment) — this screen is `super_admin`-only and the repo's existing shared login session is a regular institution_owner.

**Honesty check on execution**: I could not actually *run* either suite in this sandbox — there's no MongoDB connection configured here (confirmed via `.env`), so there's no live backend/data to test against, and no super_admin credentials exist to log in with. Both suites are fully written, typecheck cleanly, and are grounded in the actual route/response shapes I read directly from the code — but they still need a first real run against your actual environment (with `SUPER_ADMIN_EMAIL`/`SUPER_ADMIN_PASSWORD` set) before you treat them as "green."

## Also fixed along the way

While building the Playwright suite I found the existing `tests/e2e/auth.setup.ts` was already broken by my earlier Login page redesign (it filled fields by placeholder text, and the placeholders changed). Fixed it to select by label instead, and added real `htmlFor`/`id` linkage between the Login page's labels and inputs so this doesn't silently break again the next time the page's copy changes.
