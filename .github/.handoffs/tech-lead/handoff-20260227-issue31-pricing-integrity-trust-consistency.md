# HANDOFF FROM: solution-architect

## Dispatch Metadata
- **TO:** tech-lead
- **DISPATCH CHAIN:** [user] → [product-owner] → [00-chief-of-staff] → [solution-architect] → [tech-lead]
- **DISPATCH DEPTH:** 4/10
- **DATE:** 2026-02-27
- **GITHUB ISSUE:** #31
- **PRIORITY:** P0
- **TRACEABILITY TAGS:** `PRICING`, `TRUST`, `BOOKING`, `BRAND`

---

## Model-First Artifacts Produced
1. Architecture brief: `.github/.system-state/model/issue31_p0_pricing_integrity_trust_consistency_architecture_brief.yaml`
2. Contract/schema impact + AC mapping: `.github/.system-state/contracts/issue31_p0_pricing_integrity_trust_consistency_contracts.yaml`
3. Execution slices + quality gate requirements: `.github/.system-state/delivery/issue31_p0_pricing_integrity_trust_consistency_execution_plan.yaml`

These are mandatory upstream artifacts before any implementation starts.

---

## Contract/Schema Impact (Explicit)

### No Change
- `src/app/api/booking/availability/route.ts`
- `src/app/api/contact/submissions/route.ts`
- `src/app/api/reviews/submissions/route.ts`
- `src/app/api/reviews/route.ts`

Rationale: These contracts do not own Issue #31 pre-confirmation pricing disclosure semantics.

### Change Required
- `src/app/api/bookings/route.ts` (add canonical pricing breakdown + disclosure fields in success response)
- `src/app/book/page.tsx` (enforce pre-confirmation pricing disclosure visibility)
- `src/app/book/components/StepSuites.tsx` (normalize add-on semantics to no-surprise policy)
- `src/app/pricing/page.tsx` (remove contradictory add-on upsell framing)
- `src/app/pricing/layout.tsx` (remove contradictory add-on metadata language)
- `src/app/page.tsx` (keep trust-pricing claims aligned)
- `src/app/contact/page.tsx` (align transparency claims)
- `src/app/reviews/page.tsx` (align trust-pricing references where present)
- `src/app/faq/page.tsx` (align FAQ answers to policy)
- `src/app/policies/page.tsx` (align policy text to no hidden fees/no surprise add-ons)

---

## Architecture Blueprint (Implementation Slices)

### I31-S1 (P0): Cross-route pricing policy normalization
**Objective:** Normalize pricing trust messaging across required routes.

**Required routes:** `/`, `/pricing`, `/book`, `/contact`, `/reviews`, `/faq`, `/policies`.

**Mapped ACs:**
- AC-I31-001 Cross-page pricing consistency
- AC-I31-002 No surprise add-ons enforcement
- AC-I31-004 Business-profile copy conformance

**Checkpoint CP1 pass conditions:**
- Required claims present on all in-scope routes.
- Forbidden claims absent on all in-scope routes.

---

### I31-S2 (P0): Booking price-before-confirmation disclosure semantics
**Objective:** Guarantee deterministic subtotal/tax/total/pricing-model disclosure before confirmation.

**Primary contract:** `POST /api/bookings` success payload includes:
- `pricing.subtotal`
- `pricing.tax`
- `pricing.total`
- `pricing.currency`
- `pricing.pricingModelLabel`
- `pricing.disclosure`

**Mapped ACs:**
- AC-I31-002 No surprise add-ons enforcement
- AC-I31-003 Price-before-confirmation clarity

**Checkpoint CP2 pass conditions:**
- API response includes required pricing fields.
- UI shows pricing disclosure before confirmation action.

---

### I31-S3 (P0): Regression protection + audit evidence
**Objective:** Prevent reintroduction of pricing trust drift and produce gate evidence.

**Mapped ACs:**
- AC-I31-005 Regression protection for copy + booking quote/API consistency

**Checkpoint CP3 pass conditions:**
- Route copy consistency tests pass for all in-scope routes.
- `POST /api/bookings` pricing breakdown contract tests pass.
- Route-by-route pricing audit artifacts published under `docs/audit_logs/`.

---

## Dependencies and Execution Order
1. `I31-S1` first (content contract baseline)
2. `I31-S2` second (booking disclosure schema + UX wiring)
3. `I31-S3` third (regression tests + audit evidence)

No bypass of this sequence is allowed.

---

## Mandatory Evidence Package
Publish and attach:
- `docs/audit_logs/ISSUE31_PRICING_CONSISTENCY_ROUTE_AUDIT_2026-02-27.md`
- `docs/audit_logs/ISSUE31_BOOKING_PRICE_DISCLOSURE_API_EVIDENCE_2026-02-27.md`
- `docs/audit_logs/ISSUE31_TEST_EXECUTION_SUMMARY_2026-02-27.md`

Required test additions:
- `src/__tests__/issue31-pricing-consistency.test.ts`
- `src/__tests__/issue31-booking-pricing-contract.test.ts`

---

## Approval Request Package Requirements (Downstream)
Quality Director package must include:
1. Formal approval request for Issue #31.
2. Objective evidence links under `docs/audit_logs/`.
3. AC pass/fail matrix for AC-I31-001..AC-I31-005.
4. Next-biggest-thing proposal with ACs and effort estimate.

### Pre-authorized Next Biggest Thing (include verbatim in approval package)
**ID:** I31-NBT-P1  
**Title:** Brand authenticity and trust narrative alignment  
**Effort:** M

**Acceptance Criteria:**
1. Remove generic/fabricated team personas from About page.
2. Align About narrative to owner-led, Syracuse-local, small-capacity profile.
3. Ensure trust claims are evidence-backed and non-generic.

Traceability: `BRAND`, `TRUST`, `SAFETY`.

---

## Your Task (Tech Lead)
1. Create execution tickets for `I31-S1`, `I31-S2`, `I31-S3` with owner pairs and AC mapping.
2. Enforce model-first order and no-bypass checkpoints `CP1`, `CP2`, `CP3`.
3. Route API contract work in `I31-S2` to backend + frontend pair.
4. Route regression and evidence collection in `I31-S3` to `qa-test-engineer`.
5. Submit completion package to `quality-director` only after mandatory evidence artifacts are produced.
