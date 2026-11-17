# QA Checklist: Super Admin CRM — Leads Pipeline

Tester: ____  Environment: ____ (e.g. http://localhost:5173, or VPS)

## Preconditions

- Logged in as a **super_admin** account (`primaryRole: 'super_admin'`) — a regular institution_owner/admin account will be redirected to `/unauthorized` before this screen ever renders; this is not optional for testing this module.
- At least one lead exists in each of the 6 stages (New, Contacted, Demo Scheduled, Trial, Converted, Lost) for a full visual pass; a fresh platform with zero leads is also required for the Empty-state pass below.
- Know in advance that **leads are not currently created by any live flow** (see Findings Report) — creating test leads for this checklist means calling `POST /api/v1/leads` directly (e.g. via Postman/curl), since neither the onboarding wizard nor a contact form submits one today.

## Navigation

- [ ] Super Admin → CRM tab is reachable from the top nav (`?tab=crm` query param, not a sub-route)
- [ ] Direct deep-link to `/super-admin?tab=crm` loads the CRM screen directly (no need to click through Command Center first)
- [ ] CRM tab is hidden for a platform staff account whose custom PlatformRole doesn't grant `crm:view` (Severity: Major — confirms the role-scoping feature actually applies to this tab)

## Stage-count cards

- [ ] All 6 cards render: New, Contacted, Demo Scheduled, Trial, Converted, Lost
- [ ] Each card's count matches `GET /leads/stats` for that stage (spot-check against the table)
- [ ] Clicking a stage card filters the table to only that stage
- [ ] Clicking the same stage card again clears the filter (toggle behavior)
- [ ] Clicking a different stage card switches the filter directly (no need to clear first)
- [ ] "All Leads" button clears any active stage filter and is visually indicated as active when no stage is selected

## Leads table

- [ ] Columns render: School, Contact (name + email), Source, Stage (colored badge), Received (date)
- [ ] Source column shows a human label ("Onboarding wizard" / "Contact form" / "Manual entry"), never the raw enum value
- [ ] Stage badge color matches the convention: New=blue, Contacted=indigo, Demo Scheduled=purple, Trial=amber, Converted=emerald, Lost=gray
- [ ] Received date is the lead's actual creation date, formatted, not a raw ISO string
- [ ] Clicking any row opens that lead's detail modal
- [ ] **No search/text box exists** on this screen today (Severity: Major gap, not a regression — confirm this is still true, since it's the single biggest missing piece for real sales use; see Findings Report)

## Lead detail modal

- [ ] Modal title = school name; subtitle = contact name · contact email
- [ ] Stage dropdown shows the lead's current stage and can be changed
- [ ] Changing Stage via the dropdown persists (refresh the page / reopen the modal, stage sticks)
- [ ] **Setting Stage to "Converted" via this dropdown does NOT create any institution** — it is a label-only change (Severity: Blocker to understand correctly, not a bug to fix blindly — see Findings Report on why two "converted" paths exist)
- [ ] Source field shows the human label, read-only (not editable here)
- [ ] School type / Location / Students / Staff / Plan requested / Phone fields show lead data or "—" when absent, never `undefined` or blank
- [ ] "Modules requested" chips render when present, section hidden entirely when the lead requested none
- [ ] "Message" section renders when present, hidden entirely when absent
- [ ] Notes list shows existing notes with author name + timestamp, oldest/newest order is consistent
- [ ] Adding a note via the input + "Add" button appears in the list immediately (no manual refresh)
- [ ] "Add" button is disabled while the note text is empty
- [ ] Note text is cleared after a successful add
- [ ] **No "assign to me / assign to teammate" control exists in this modal**, despite the API (`assignedTo`) supporting it (Severity: Major gap — see Findings Report)

## Activate Institution (the real conversion path)

- [ ] For a lead with no `convertedInstitutionId`: "Activate Institution" button is visible, with the explanatory copy "Creates a real, usable account…"
- [ ] Clicking it while pending shows "Activating…" and disables the button (no double-submit)
- [ ] On success, credentials (login URL, email, temporary password) are shown in a one-time panel with a working "Copy credentials" button
- [ ] For a lead whose `convertedInstitutionId` is already set: the "already been activated" banner shows instead of the Activate button (Blocker — confirms a lead can't be double-activated from the UI)
- [ ] Attempting to activate an already-activated lead a second time (e.g. via a stale tab) surfaces the backend's rejection message, not a silent failure or a duplicate institution
- [ ] **No email is sent to the prospect with their credentials** — confirm the admin understands they must manually relay the copied credentials (Severity: Major gap — see Findings Report)
- [ ] After activation, the lead's Stage automatically shows "Converted" (reopen the modal / refresh the table) and its stage-count card total reflects the move

## Empty-state pass (REQUIRED)

- [ ] Table shows "No leads yet — submissions from the marketing site's onboarding wizard and contact form will appear here." when `GET /leads` returns `[]` — not a blank table, not a crash
- [ ] Stage cards all show `0` (not blank, not `—`) when there are genuinely zero leads
- [ ] Page survives (no console errors) when `GET /leads/stats` returns `{}` instead of all 6 keys

## Tenancy / access pass (REQUIRED, adapted — leads are platform-level, not tenant-scoped)

- [ ] `GET /leads` without a token → 401
- [ ] `GET /leads` with a valid institution_owner/admin token (not super_admin) → 401/403, not leads data
- [ ] The public `POST /leads` endpoint requires no token at all (by design — confirm this isn't accidentally tightened or loosened without the team knowing)
- [ ] A super_admin from one install cannot be scoped to "their own" leads only — by design, all leads are visible to every super_admin (confirm this matches the business intent; flag if it doesn't)

## Data correctness / real marketing-campaign readiness (see Findings Report for full detail)

- [ ] Submitting the exact same `adminEmail` twice via `POST /leads` creates two separate lead records (confirm this is the known, accepted-for-now gap, not a surprise)
- [ ] `source` only ever has 3 possible values (Onboarding wizard / Contact form / Manual entry) — no referral, ad-campaign, or reseller-referred source exists to select or display
- [ ] No UTM parameters or campcampaign/ad-source metadata are captured anywhere in the lead record
- [ ] Confirm with the business: do the 6 "Converted" leads currently in the table actually have a `convertedInstitutionId` (real conversions), or were some stage-dropdown-flipped without ever activating a real institution? (Both are possible today — see Findings Report)
