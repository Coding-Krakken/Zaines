# HANDOFF FROM: tech-lead

## Dispatch Metadata
- **TO:** frontend-engineer
- **DISPATCH CHAIN:** [user] → [product-owner] → [00-chief-of-staff] → [solution-architect] → [tech-lead] → [frontend-engineer]
- **DISPATCH DEPTH:** 5/10
- **DATE:** 2026-02-27
- **GITHUB ISSUE:** #31
- **FEATURE BRANCH:** `feature/31-pricing-integrity-trust-consistency`
- **PRIORITY:** P0
- **TRACEABILITY TAGS:** `PRICING`, `TRUST`, `BOOKING`, `BRAND`

---

## Model/Plan References
- `.github/.system-state/model/issue31_p0_pricing_integrity_trust_consistency_architecture_brief.yaml`
- `.github/.system-state/contracts/issue31_p0_pricing_integrity_trust_consistency_contracts.yaml`
- `.github/.system-state/delivery/issue31_p0_pricing_integrity_trust_consistency_execution_plan.yaml`
- `.github/.system-state/delivery/issue31_p0_pricing_integrity_trust_consistency_implementation_plan.yaml`

## Your Slice Ownership (Frontend)
1. **I31-S1 (paired with tech-lead):** normalize pricing-trust policy copy across required routes.
2. **I31-S2 (paired with backend-engineer):** ensure pre-confirmation disclosure is visible in booking UX before confirm action.

## Required Files (Frontend)
- `src/app/page.tsx`
- `src/app/pricing/page.tsx`
- `src/app/pricing/layout.tsx`
- `src/app/book/page.tsx`
- `src/app/book/components/StepSuites.tsx`
- `src/app/contact/page.tsx`
- `src/app/reviews/page.tsx`
- `src/app/faq/page.tsx`
- `src/app/policies/page.tsx`

## Required Claim Contract (All in-scope routes)
- Must include: clear pricing before confirmation, no hidden fees, no surprise add-ons, premium but fair.
- Must not include: generic add-on upsell framing, contradictory tax messages, hidden-fee language, discount/budget positioning.

## I31-S2 Frontend Contract Requirement
- Booking flow must show pricing disclosure before any confirmation action is enabled.
- Disclosure language must align with backend `pricing.disclosure` semantics.

## Checkpoints (No Bypass)
1. **CP1-route-policy-consistency** must pass before any S2 completion claim.
2. **CP2-booking-price-disclosure** must pass before QA S3 start.

## Acceptance IDs (Frontend)
- I31-S1: AC-I31-001, AC-I31-002, AC-I31-004
- I31-S2: AC-I31-002, AC-I31-003

## Constraints
- Keep canonical Next.js 14 + Tailwind + existing component pattern.
- No model drift; if contract conflict is found, escalate to tech-lead.
- No contradictory pricing language on any required route.

## Handoff Rule
After completing S1/S2 and posting evidence, hand off execution result to `qa-test-engineer`.
