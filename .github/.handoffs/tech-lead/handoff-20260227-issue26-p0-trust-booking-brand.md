# HANDOFF FROM: solution-architect

## Dispatch Metadata
- **TO:** tech-lead
- **DISPATCH CHAIN:** [user] → [product-owner] → [00-chief-of-staff] → [solution-architect] → [tech-lead]
- **DISPATCH DEPTH:** 4/10
- **DATE:** 2026-02-27
- **GITHUB ISSUE:** #26
- **PRIORITY:** P0
- **TRACEABILITY TAGS:** `BRAND`, `TRUST`, `SAFETY`, `PRICING`, `BOOKING`

---

## Model-First Artifacts Produced
1. Architecture correction brief: `.github/.system-state/model/issue26_p0_trust_booking_brand_architecture_brief.yaml`
2. Contract/state deltas: `.github/.system-state/contracts/issue26_p0_trust_booking_brand_contracts.yaml`
3. Risk register: `.github/.system-state/model/issue26_p0_trust_booking_brand_risk_register.yaml`

These files are the canonical basis for implementation sequencing and acceptance gating.

---

## Architecture Correction Brief (P0-first)

### Primary Defect Areas (P0)
1. Booking availability progression + recoverable failure UX
2. Auth magic-link reliability + misconfiguration handling
3. Contact submission persistence + retry-safe error semantics
4. Review submission persistence + moderation lifecycle gating

### Mandatory Invariants
- Booking progression to suite selection is allowed only when `BookingAvailabilityFlow.available`.
- Invalid date range never dispatches availability requests.
- Auth misconfiguration never leaks provider internals to user.
- Contact/review success states require backend persistence acknowledgment.
- Public review list excludes non-approved moderation states.
- `robots.txt` and `sitemap.xml` must return `200` in production.
- Metadata/title naming must use canonical brand string: `Zaine's Stay & Play`.

---

## Contract and State Deltas (Current → Required)

### Required API Contracts
- `POST /api/booking/availability`
- `POST /api/auth/magic-link`
- `POST /api/contact/submissions`
- `POST /api/reviews/submissions`
- `GET /api/reviews` (approved-only filter)
- `GET /robots.txt`
- `GET /sitemap.xml`

### Required Error Code Families
- Booking: `INVALID_DATE_RANGE`, `AVAILABILITY_UNAVAILABLE`
- Auth: `INVALID_EMAIL`, `AUTH_PROVIDER_MISCONFIGURED`, `AUTH_TRANSIENT_FAILURE`
- Contact: `CONTACT_VALIDATION_FAILED`, `CONTACT_RATE_LIMITED`, `CONTACT_PERSISTENCE_FAILED`
- Reviews: `REVIEW_VALIDATION_FAILED`, `REVIEW_PERSISTENCE_FAILED`

### Guard/Fault Semantics
- All P0 flows use schema validation before dispatch.
- All P0 flows return correlation IDs for server-observable failures.
- Contact and review submissions must support idempotency keys.
- Booking/auth/contact/review endpoints target `<=2s p95` response state for success/failure.

---

## Execution Plan (Vertical Slices + Gates)

### Slice S1 (P0): Booking Availability Reliability
**Scope:** `POST /api/booking/availability` contract + booking flow state transitions.

**Engineering tasks:**
- Implement state machine transitions (`idle→validating→checking→available|unavailable_recoverable|service_degraded`).
- Enforce invalid-date guard pre-network.
- Add retry-safe degraded state UX copy (non-technical).

**Gate S1:**
- Booking AC P0-1 passes with explicit state assertions.
- No raw technical fetch errors rendered to users.
- p95 observed <=2s for response/failure state in production-like run.

### Slice S2 (P0): Auth Magic-Link Reliability
**Scope:** `POST /api/auth/magic-link` contract + UI handling for success/config/transient paths.

**Engineering tasks:**
- Add strict email validation guard.
- Map provider configuration failures to support-safe UX and server actionable code.
- Ensure successful dispatch yields deterministic confirmation state.

**Gate S2:**
- P0-2 AC passes for valid/invalid/misconfigured scenarios.
- No provider internals exposed to client.

### Slice S3 (P0): Contact + Review Persistence
**Scope:** `POST /api/contact/submissions`, `POST /api/reviews/submissions`, `GET /api/reviews` moderation filter.

**Engineering tasks:**
- Implement persistent writes with confirmation IDs.
- Add anti-abuse throttling and idempotency handling.
- Enforce moderation pending state and approved-only public listing.

**Gate S3:**
- P0-3/P0-4 AC pass with network + persistence evidence.
- Retry behavior preserves submitted values on failure.

### Slice S4 (P1): SEO + Metadata Baseline
**Scope:** `/robots.txt`, `/sitemap.xml`, metadata consistency requirements.

**Engineering tasks:**
- Implement metadata route handlers for robots and sitemap.
- Validate canonical brand naming on required pages.

**Gate S4:**
- `/robots.txt` and `/sitemap.xml` return `200`.
- Metadata checks pass for required pages (`/`, `/about`, `/pricing`, `/book`, `/contact`).

### Slice S5 (P1): Brand/Pricing Copy Alignment
**Scope:** IA and copy alignment to canonical profile with pricing-decision gate.

**Engineering tasks:**
- Align messaging to small private 3-suite model and trust pillars.
- Lock pricing language to approved option only.

**Gate S5:**
- Stakeholder sign-off on brand alignment.
- Business-owner pricing option finalized before public numeric copy lock.

---

## Release Gate Criteria (Do Not Bypass)
1. All P0 AC pass in production-like environment with traceability tags.
2. No sensitive logging of raw email/phone/message fields in auth/contact/review errors.
3. Booking + auth + forms have deterministic user-facing failure/retry states.
4. SEO baseline assets return `200` before merge of P1 slices.

---

## Open Risks / Decisions (Tracked)
See `.github/.system-state/model/issue26_p0_trust_booking_brand_risk_register.yaml`.

Required escalations before S5 complete:
1. Pricing option decision (`base_plus_tax` vs `tax_inclusive_flat`)
2. Stakeholder brand-positioning approval

---

## Your Task (Tech Lead)
1. Convert S1–S5 into implementation tickets with one owner pair (`frontend-engineer` + `backend-engineer`) per P0 slice.
2. Preserve model-first sequence: contracts/state handling before UI polish.
3. Add QA trace matrix mapped to AC and tags for each slice.
4. Route to `security-engineer` for log-redaction verification and to `qa-test-engineer` for gate evidence.
