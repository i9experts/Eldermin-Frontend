# Early Years (ECE) — QA Checklist

Full first QA pass across the backend `src/ece/*` module, the admin frontend
`src/pages/early-years/*`, and the parent mobile app's Early Years screens
(`lib/app/modules/early_years/*`).

Related code: `src/ece/{ece.controller,ece.service,ece-scope.util,dto/ece.dto}.ts`,
`src/roles/decorators/roles-or-module-manage.decorator.ts`, `src/auth/role-sets.ts`
(backend) · `src/pages/early-years/*.tsx`, `src/services/ece.service.ts` (frontend) ·
`lib/app/modules/early_years/*` (parent app) · `src/ece/ece-campus.spec.ts`,
`src/upload/upload-access.spec.ts` (tests).

---

## Fixed this pass (backend)

- [x] **Severity: Major — tenancy/campus-scope gap on Montessori work
  records.** `GET /ece/montessori/work-records/:studentId` and
  `PUT /ece/montessori/work-records` were the only two student-keyed ECE
  routes in the whole controller that never called
  `assertStudentInScope`/`assertEceStudentInScope` — every sibling
  student-keyed route (`getProfile`, `getPortfolio`, `createObservation`,
  `getCareRecords`, `getSupportCaseById`, etc.) does. A campus-scoped
  teacher could view or edit Montessori work-tracking records for a child
  enrolled at a **different campus of the same school**, bypassing the
  "this child is not at your campus" 403 enforced everywhere else. Fixed by
  adding `await this.service.assertStudentInScope(schoolSlug, studentId,
  req.user)` to both handlers.
- [x] **Severity: Major — ten writes reachable by staff with no Early Years
  module grant.** `createExperience`/`updateExperience`/`deleteExperience`
  (Learning Experience Library), `createEnvironmentArea`/
  `updateEnvironmentArea`/`logSafetyCheck`/`addEnvironmentObservation`/
  `seedDefaultEnvironmentAreas` (Environment/Provision Areas), and
  `createMontessoriMaterial`/`seedClassicMontessoriMaterials` (Montessori
  setup) carried no `@Roles`/`@RolesOrModuleManage` decorator of their own —
  only the controller-level `@Roles(...SCHOOL_STAFF_ROLES)` applied, which
  blocks parent/student/reseller tokens but does **not** enforce the
  per-module custom-role grant the five sibling writes
  (`createObservation`, `quickObserve`, `createPortfolioEntry`,
  `shareEntry`, `upsertWeeklyPlan`) already enforce. A staff member with a
  custom role that has no Early Years module grant could still reach these
  ten writes. Fixed by adding
  `@RolesOrModuleManage('early-years', STAFF_WRITE_ROLES, { allowModuleWide: true })`
  to all ten, matching the existing convention (not `TEACHING_ADMIN_ROLES`,
  since these are routine teacher actions — logging a safety check, adding a
  reusable material — not ontology setup).
- [x] Extended `src/ece/ece-campus.spec.ts`: the existing
  "EceController applies the scope before touching a child" test now also
  covers `getWorkRecords`/`upsertWorkRecord` (17 → 19 scope checks), and a
  new test asserts all ten newly-guarded handlers carry the
  `RolesOrModuleManage(early-years)` metadata with `allowModuleWide: true`.
  Updated `src/upload/upload-access.spec.ts`'s "the five existing write
  guards are untouched" regression test to the new, intentional count of 15
  guarded handlers (previously would have silently passed if someone
  *removed* a guard — it now also catches someone forgetting to add one).

---

## Verified — no bug found

- [ ] **Rich-text rendering bug class (same class just fixed in Class
  Diary) does NOT apply here.** Checked every text-entry surface that
  reaches a parent: Observation narrative (`ObservationFormModal.tsx`),
  Quick Observe narrative (`QuickObserveModal.tsx`), Learning Story
  narrative (`LearningStoryModal.tsx`), and Portfolio entry narrative
  (`ChildProfileView.tsx`) all use a plain `<textarea>`, never
  `RichTextEditor`. The backend schema stores these as plain strings, and
  every render site (web `{entry.narrative}` / `{o.narrative}`, Flutter
  `Text(entry.narrative)` / `Text(observation.narrative)` in
  `early_years_detail_screens.dart`) renders them as plain text —
  consistent end to end. No HTML is ever authored or stored for these
  fields, so there is nothing to parse.
- [ ] **Flutter Early Years screens (`early_years_screen.dart`,
  `early_years_detail_screens.dart`, `early_years_controller.dart`) are
  null-safety solid.** `_SummaryCard(summary: c.summary.value!)` force-unwraps,
  but is only reached when `c.eligible` is true, and `eligible` itself
  requires `summary.value != null` — no crash path found. Portfolio and
  Observations lists each have their own loading shimmer, error view (with
  retry), and empty state (`AppEmptyView`) before ever mapping over data.
  Load-more/pagination guards `hasMore`/`loading` correctly.
- [ ] **Coordinator Insights (`InsightsTab.tsx` / `getCoordinatorInsights`)
  is safe for a brand-new/zero-data tenant.** The frontend guards
  `isLoading || !data` before touching any nested field. The backend always
  returns `domainCoverage` as `domains.map(...)` (so `[]`, never
  `undefined`, for a school with zero domains), and
  `Math.max(1, ...data.domainCoverage.map(...))` is safe against an empty
  array.
- [ ] **Admin frontend early-years tabs (Children, Dashboard, Experience
  Library, Montessori, Care, Support, Weekly Plan, Environment, Settings)
  all defensively cast query results to `any[]` and check `.length === 0`
  / fall back to `|| []` before mapping** — consistent with the rest of
  Eldermin's "no mock data, no `undefined.map()` crash" rule. No raw
  `.map()` on a possibly-undefined query result was found across any of
  the 12 tab files.
- [ ] **`ece-scope.util.ts` (`assertEceStudentInScope`, `eceScopedStudentIds`,
  `eceCampusOf`) is solid** — already covered by 12 passing tests in
  `ece-campus.spec.ts` from a prior QA round; no new issue found on review.
- [ ] **`createPortfolioEntry` already explicitly verifies `dto.studentId`
  belongs to the school before creating** — a stronger check than most
  other `create*` methods in the service, not a gap.

---

## Not yet tested this pass (recommend a follow-up pass)

- [ ] SNC ECE (Pakistan Single National Curriculum) cascading picker against
  real seeded data (`seedPakistanNationalCurriculum`) — ontology seed/import
  itself was read and looks structurally sound (219 Learning Outcomes,
  age-band differentiated) but was not exercised end-to-end against the
  frontend Framework/Domain/Skill pickers in `SettingsTab.tsx`.
- [ ] AI Observation Assistant (`suggestObservationMappings`,
  `checkObservationQuality`) — Claude-proxy call path exists and
  re-validates returned `skillId`s against the real catalog (good defensive
  pattern), but was not exercised live (no API key / network access in this
  session).
- [ ] "My Learning Journey" year-end portfolio PDF generation
  (`generateLearningJourneyPdf`, `pdf-lib`-based) — read the code, did not
  render a PDF to visually confirm layout/Urdu font embedding.
- [ ] Email notification on `shareEntry`/`notifyFamily` — confirmed the code
  path is real (not a stub) but did not trigger a live send in this
  session.

---

## Test / verification summary

- `npx jest src/ece/ece-campus.spec.ts` → 22/22 passing (10 new assertions
  added this pass).
- `npx jest src/upload/upload-access.spec.ts` → updated regression test
  passing against the new, intentional guard count.
- Full backend suite: `npx jest` → **4742/4742 passing, 205/205 suites**.
- `npx tsc --noEmit` → clean.
- No frontend or Flutter code changes were needed this pass (investigated,
  confirmed correct) — only the backend controller and its tests changed.
