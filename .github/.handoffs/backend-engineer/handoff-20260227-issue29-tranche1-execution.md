# HANDOFF FROM: tech-lead

## Dispatch Metadata
- **TO:** backend-engineer
- **DISPATCH CHAIN:** [00-chief-of-staff] → [product-owner] → [solution-architect] → [tech-lead] → [backend-engineer]
- **DISPATCH DEPTH:** 4/10
- **DATE:** 2026-02-27
- **GITHUB ISSUE:** #29
- **FEATURE BRANCH:** `feature/29-continuous-improvement-tranche1`
- **PRIORITY:** P0/P1 tranche implementation
- **TRACEABILITY TAGS:** `BRAND`, `TRUST`, `SAFETY`, `PRICING`, `BOOKING`

---

## Model/Plan References
- `.github/.system-state/delivery/issue29_continuous_improvement_implementation_plan.yaml`
- `.github/.system-state/delivery/issue29_continuous_improvement_execution_plan.yaml`
- `.github/.system-state/contracts/issue29_continuous_improvement_contracts.yaml`
- `.github/.system-state/security/issue29_continuous_improvement_threat_model.yaml`

## Your Slice Ownership (Backend)
1. **I29-S1 (paired with frontend-engineer):** `/api/booking/availability`, `/api/contact/submissions`, `/api/auth/magic-link` deterministic contract + envelope behavior.
2. **I29-S4 (paired with frontend-engineer):** `/robots.txt`, `/sitemap.xml` and indexing baseline contract support.
3. **I29-S5 (paired with security-engineer):** redaction enforcement, dependency security gate support, PCI boundary guarantees.

## Required Contract Semantics
- Public API error envelope required fields: `errorCode`, `message`, `retryable`, `correlationId`.
- Forbidden leakage fields: `stack`, `raw_email`, `raw_phone`, `raw_message`, `payment_card_data`.
- Contact/auth/booking failures must remain deterministic and retry-safe.
- S5 redaction pass threshold is 100% for sensitive fields.

## Execution Order (Do Not Bypass)
1. Implement I29-S1 and satisfy CP1.
2. Implement I29-S4 and satisfy CP4.
3. Implement I29-S5 and satisfy CP5 with security-engineer sign-off.

## Constraints
- Preserve Square integration boundaries and PCI delegation.
- No raw sensitive payloads in logs.
- No schema or model drift without model update first.

## Next Agent
After backend evidence is complete, hand off to: `qa-test-engineer`
