# HANDOFF FROM: tech-lead

## Dispatch Metadata
- **TO:** backend-engineer
- **DISPATCH CHAIN:** [user] → [product-owner] → [00-chief-of-staff] → [solution-architect] → [tech-lead] → [backend-engineer]
- **DISPATCH DEPTH:** 5/10
- **DATE:** 2026-02-27
- **GITHUB ISSUE:** #31
- **FEATURE BRANCH:** `feature/31-pricing-integrity-trust-consistency`
- **PRIORITY:** P0
- **TRACEABILITY TAGS:** `PRICING`, `TRUST`, `BOOKING`

---

## Model/Plan References
- `.github/.system-state/contracts/issue31_p0_pricing_integrity_trust_consistency_contracts.yaml`
- `.github/.system-state/delivery/issue31_p0_pricing_integrity_trust_consistency_execution_plan.yaml`
- `.github/.system-state/delivery/issue31_p0_pricing_integrity_trust_consistency_implementation_plan.yaml`

## Your Slice Ownership (Backend)
1. **I31-S2 (paired with frontend-engineer):** implement booking pre-confirmation price disclosure schema in `POST /api/bookings`.

## Required API Contract Delta
File: `src/app/api/bookings/route.ts`

Success response must include:
- `pricing.subtotal`
- `pricing.tax`
- `pricing.total`
- `pricing.currency`
- `pricing.pricingModelLabel`
- `pricing.disclosure`

Required constraints:
- `pricing.total == pricing.subtotal + pricing.tax`
- `pricing.disclosure` includes "before confirmation"
- `pricing.disclosure` includes no hidden fees language

## Checkpoint (No Bypass)
- **CP2-booking-price-disclosure** must pass before QA S3 start.
- Do not claim completion without contract test evidence for required pricing fields.

## Acceptance IDs (Backend)
- I31-S2: AC-I31-002, AC-I31-003

## Constraints
- No contract drift outside `POST /api/bookings` scope.
- Preserve existing Square integration and PCI delegation boundaries.
- Keep deterministic API semantics for downstream tests.

## Handoff Rule
After backend S2 evidence is complete, hand off execution result to `qa-test-engineer`.
