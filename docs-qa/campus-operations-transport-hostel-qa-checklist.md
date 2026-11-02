# Campus Operations — Transport & Hostel Deep QA Checklist

Follow-up to the earlier full Campus Operations QA pass (all 9 tabs, 15 bugs
fixed). This pass goes deeper on **Transport** and **Hostel** only.

Related code: `src/pages/campus/{index,modals}.tsx`, `src/services/campus.api.ts`,
`src/hooks/useCampus.ts` (frontend) · `src/campus/{campus.controller,campus.service,campus.schema}.ts`
(backend) · `tests/e2e/campus-operations.spec.ts`, `src/campus/campus-service.spec.ts` (tests).

---

## 🔴 Blocker — missing feature, not a bug

- [ ] **Route management has no UI at all.** `createRoute`/`updateRoute` exist
  and work correctly on the backend, and `useRoutes` is wired on the
  frontend — but only to show a read-only "Routes Configured" count. There
  is no "Add Route" button, no route edit modal, and no way to define a
  route's stops, assign a vehicle/driver, or set pickup/drop times from the
  UI. **A school admin cannot create a transport route through Eldermin
  today.**
- [ ] **Student transport allocation has no UI at all.** `allocateTransport`,
  `removeStudentTransport`, and `getRouteStudents` all exist and work
  correctly on the backend (`useAllocateTransport`/`useRouteStudents` hooks
  are even already written) — but nothing in `TransportTab` ever calls
  them. **A school admin cannot assign a student to a bus route through
  Eldermin today**, even though the whole backend model (route capacity,
  per-student monthly fee, service type, old-route-to-new-route transfer) is
  fully built and tested.
- [ ] Only **Vehicle** CRUD is reachable from the Transport tab today (add
  vehicle, edit vehicle). Recommend scoping a follow-up pass specifically to
  build the Route + Student Allocation UI, mirroring the Hostel allocation
  pattern (`StudentSelect` + real dropdowns) from the earlier QA pass.

---

## Fixed this pass (backend)

- [x] **Tenancy leak — Transport.** `allocateStudentTransport`/
  `removeStudentTransport` incremented/decremented a route's
  `totalStudents` counter via an **unscoped** `findByIdAndUpdate` — the
  same class of cross-tenant leak already fixed in Hostel's
  allocate/checkout during the earlier pass, just never applied to
  Transport. A caller could corrupt another tenant's route counter by id
  guessing. **Fixed**: scoped by `schoolSlug`, and the route is now
  validated to belong to the tenant (404 if not) before any counter is
  touched. Severity: **Major** (data corruption across tenants).
- [x] **Route-count drift on reassignment.** Moving a student from Route A
  to Route B incremented B's `totalStudents` but never decremented A's —
  every reassignment left A's count permanently too high, with no way to
  self-correct. **Fixed**: the student's previous active allocation (if
  any, and if it's actually a different route) is now decremented too.
  Severity: **Major** (visible, compounding data-quality bug).
- [x] **Hostel bed double-booking.** `allocateHostel`'s capacity check only
  compared room-level `occupancy` vs `capacity` — it never checked whether
  the *specific requested bed number* was already taken. Two students
  could both be allocated "Bed 1" in the same room as long as the room
  had a free slot overall. **Fixed**: a bed number (when supplied) is now
  checked for an existing active allocation in that room before saving.
  Severity: **Major** (two real students end up assigned the same bed).
- [x] **Hostel double-checkout.** `checkOutHostel` had no precondition on
  the allocation's current status — calling it twice on the same
  allocation (e.g. a double-click, or a stale tab) decremented
  `room.occupancy`/`block.occupiedBeds` a second time for a bed that was
  never actually reoccupied, eventually driving occupancy negative and
  making a room appear to have more free space than it really does.
  **Fixed**: the update now requires `status != 'checked_out'`; a repeat
  checkout gets a clean 400 ("already checked out") instead of silently
  re-processing. Severity: **Major** (silent capacity-count corruption).
- [x] **Dangling block reference.** `createRoom` never verified the
  `blockId` it was given actually belonged to the tenant (unlike the
  equivalent, already-correct check on `createCampusRoom`'s `buildingId`).
  A room could be created pointing at a non-existent or cross-tenant
  block, which only surfaced later — confusingly — when `allocateHostel`'s
  own block lookup failed against what looked like a perfectly normal
  room. **Fixed**: `createRoom` now 404s immediately if the block isn't
  found for this tenant. Severity: **Minor** (data-integrity guard, not
  itself exploitable cross-tenant since allocation independently
  re-validates both room and block).

## Verified correct (no change needed)

- [x] The Hostel allocation create flow (`AllocateHostelModal` →
  `useAllocateHostel` → `POST /hostel/allocations`) round-trips correctly
  against the real backend contract: field names match exactly
  (`studentId`, `blockId`, `roomId`, `bedNumber`), and `academicYear` —
  required by the schema but not collected in the modal itself — is
  correctly appended by the parent `HostelTab` component via the shared
  `getCurrentAcademicYear()` utility before the mutation fires. No
  frontend/backend shape mismatch found here.
- [x] `updateHostelAllocation` deliberately excludes `studentId`/`roomId`/
  `blockId`/`schoolSlug` from what it lets you edit — moving a student to
  a different room/block is correctly treated as a transfer (not
  supported by this endpoint) rather than silently reassigning counters
  incorrectly.
- [x] Vehicles and routes cannot actually be *deleted* (no delete endpoint
  exists for either) — only status changes (e.g. `retired`, `inactive`,
  `suspended`). This means the "deleting a vehicle/route with active
  allocations" edge case from this pass's brief is moot: there's nothing
  to dangle, since deletion isn't offered. **Editing** a vehicle/route's
  status while students/allocations still reference it doesn't cascade
  or warn — low-priority, noted below, not fixed this pass.

## Not fixed this pass — minor, noted for follow-up

- [ ] Setting a vehicle to `retired`/`inactive`, or a route to `suspended`,
  doesn't warn the admin if active student allocations still reference it
  — the allocation just silently points at an inactive route/vehicle.
  Severity: **Minor** (cosmetic/data-hygiene, not a correctness bug).

---

## Manual QA checklist

### Multi-tenant isolation
- [ ] Tenant A cannot increment/decrement Tenant B's route `totalStudents`
  by submitting Tenant B's real `routeId` while authenticated as Tenant A.
- [ ] Tenant A cannot allocate a hostel bed against Tenant B's real
  `roomId`/`blockId`.
- [ ] Tenant A cannot create a hostel room pointing at Tenant B's real
  `blockId`.
- [ ] Tenant A cannot check out, update, or re-allocate Tenant B's real
  hostel allocation or transport allocation by id.

### Double-booking / capacity
- [ ] Allocating a bed with a `bedNumber` already active in that room is
  rejected with a clear message, not a silent duplicate.
- [ ] A room at full `capacity` cannot accept one more allocation
  (existing coverage; re-verify after this pass's changes).
- [ ] Two separate "Allocate Bed" submissions in quick succession for the
  last free slot in a room do not both succeed (room-level capacity check
  already guards this; confirm no race under concurrent clicks).

### Checkout correctness
- [ ] Checking out an active allocation frees exactly one bed
  (`room.occupancy -1`, `block.occupiedBeds -1`) and sets the room back to
  `available`.
- [ ] Checking out the same allocation a second time is rejected (400,
  "already checked out"), and does **not** decrement counters again.
- [ ] Checking out a non-existent allocation id returns 404, not a silent
  no-op.

### Route-student consistency
- [ ] Allocating a student to Route A, then reassigning them to Route B,
  increments B's `totalStudents` and decrements A's.
- [ ] Removing a student's transport allocation decrements their route's
  `totalStudents` exactly once.
- [ ] `GET /transport/routes/:id/students` only ever shows students whose
  *current* active allocation is that route — a reassigned student
  disappears from the old route's list immediately.

### Dangling references
- [ ] Creating a hostel room with an invalid/foreign `blockId` is rejected
  (404), not silently saved.
- [ ] (Noted, not blocking) Setting a vehicle/route to an inactive status
  while students are still actively allocated to it does not corrupt data,
  but also doesn't warn the admin — acceptable for now.

### Empty / null-body states
- [ ] Transport → Vehicles tab renders its empty state, not a crash, when
  the vehicles API returns `[]` or `{}`.
- [ ] Transport → Routes count and Hostel → Blocks/Rooms/Allocations all
  render without crashing when their APIs return `[]` or `{}`.

### Hostel allocation UI (rebuild verification)
- [ ] Allocate Bed modal: Student, Block, and Room are all required before
  the "Allocate Bed" button submits (existing coverage).
- [ ] Selecting a Block correctly filters the Room dropdown to that
  block's rooms only, showing live `occupancy/capacity`.
- [ ] A successful allocation appears in the Hostel tab's list without a
  manual refresh.
