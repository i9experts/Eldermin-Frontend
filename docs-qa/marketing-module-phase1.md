# Marketing Module — Phase 1: Real Lead Intake + Pipeline Gaps

Follow-up to `crm-leads-pipeline-findings.md`. Scope for this phase, per direction: wire the real public onboarding wizard into Super Admin's CRM (not build a new public marketing site — one already exists at eldermin.com/wizard, calling this backend's `POST /onboarding/register` directly), fix the pipeline-quality gaps the QA pass found, and leave campaign-level reporting for a later phase.

## What this ships

### 1. The wizard now actually creates CRM visibility (the core gap)
`OnboardingService.register()` — called the moment someone submits the public signup form — now creates a `MarketingLead` immediately, in the `trial` stage (matching the real trial `Tenant` it just created), with `convertedInstitutionId` already set to that real institution. This means:
- Super Admin can now see every self-service signup in the Leads Pipeline, not just manually-entered leads.
- "Activate Institution" correctly shows "already activated" for these — there's nothing left to activate, the account is already real.
- `saveStep()` enriches the same lead as the prospect progresses (step 1 → country/city/school type, step 5 → requested modules/plan), so an admin evaluating an in-progress or abandoned wizard sees real detail, not a blank record.
- `complete()` moves the lead to `converted` once the full 8-step setup finishes (guarded so an admin's own "lost" call isn't silently reopened).
- Same dedup principle as below applies here too: registering with an email that already has an open lead (e.g. a sales inquiry logged before someone self-signs up) reuses that lead instead of creating a second one.

### 2. Campaign/UTM attribution
`MarketingLead` now has `utmSource`/`utmMedium`/`utmCampaign`/`utmContent`/`utmTerm`. `RegisterDto` and `CreateLeadDto` both accept them (optional, additive). **This needs the marketing site itself to start sending them** on its calls to `POST /onboarding/register` (and any future contact-form call to `POST /leads`) — that site isn't in either repo this session has access to, so it can't be wired up from here. The backend/CRM side is ready the moment it is.

### 3. Duplicate-lead protection
`LeadsService.create()` now folds a resubmission for the same `adminEmail` into the existing *open* (not converted/lost) lead instead of creating a duplicate — appends a note, refreshes the lead's details from the new submission. A closed lead (already converted or marked lost) is left alone; a resubmission against one of those creates a genuinely new lead.

### 4. Assignee picker
The lead detail modal now has a real "Assigned to" picker (reuses the Team & Access staff list) — `assignedTo` existed in the schema/API before this with no UI control at all.

### 5. Search
The Leads Pipeline table now has a text search box (school / contact name / email), client-side over whatever the stage filter already narrowed to.

## Explicitly deferred (per direction for this phase)

- Campaign-level reporting (a "Campaigns" view grouping leads by UTM campaign with conversion rates) — clean follow-up once real attributed data is flowing in from #2 above.
- A dedicated "sales" role for lead assignment — assignment currently goes to any `super_admin`/platform-staff account, matching the schema's existing `assignedTo: ref User` with no role change.

## Test coverage added/updated

- `eldermin-backend/test/e2e/leads.crm.e2e-spec.ts`: full register → saveStep → complete lead lifecycle, the register()-side dedup, and the updated (now-passing, not just documented) `LeadsService.create()` dedup behavior.
- `Eldermin-Frontend/tests/e2e/crm-leads.spec.ts`: search box, assignee picker, and campaign/UTM display in the detail modal. The two previous `KNOWN GAP` tests (no search box, duplicate leads) are now real positive assertions since both gaps are fixed.

Same execution caveat as the original QA pass: I could not run either suite against a live environment — no MongoDB connection or super_admin account exists in this sandbox. Both are grounded in direct reads of the actual route/response shapes, typecheck cleanly, and the backend boots cleanly with the new wiring, but still need a first real run before being trusted as green.
