# HANDOFF FROM: tech-lead

## Dispatch Metadata
- **TO:** backend-engineer
- **DISPATCH CHAIN:** [user] → [product-owner] → [00-chief-of-staff] → [solution-architect] → [tech-lead] → [backend-engineer]
- **DISPATCH DEPTH:** 5/10
- **DATE:** 2026-02-27
- **GITHUB ISSUE:** #26
- **FEATURE BRANCH:** `feature/26-p0-trust-booking-brand`
- **PRIORITY:** P0
- **TRACEABILITY TAGS:** `BRAND`, `TRUST`, `SAFETY`, `PRICING`, `BOOKING`

---

## Model/Plan References
- `.github/.system-state/model/issue26_p0_trust_booking_brand_architecture_brief.yaml`
- `.github/.system-state/contracts/issue26_p0_trust_booking_brand_contracts.yaml`
- `.github/.system-state/model/issue26_p0_trust_booking_brand_risk_register.yaml`
- `.github/.system-state/delivery/issue26_p0_trust_booking_brand_implementation_plan.yaml`
- `.github/.system-state/delivery/issue26_p0_trust_booking_brand_qa_trace_matrix.yaml`

## Your Task
Implement backend contracts and guard/failure semantics for S1, S2, S3 (P0), then S4 (P1 baseline).

### Ticket Mapping
1. **T26-S1 (P0):** `POST /api/booking/availability` + booking guard/failure semantics
2. **T26-S2 (P0):** `POST /api/auth/magic-link` + misconfiguration/transient semantics
3. **T26-S3 (P0):** `POST /api/contact/submissions`, `POST /api/reviews/submissions`, `GET /api/reviews` moderation filter
4. **T26-S4 (P1):** `GET /robots.txt`, `GET /sitemap.xml` baseline route contracts

### Implementation Requirements
- Validate schemas before dispatch/processing in all P0 endpoints.
- Return modeled error code families exactly.
- Return correlation IDs on server-observable failures.
- Implement idempotency keys for contact and review submissions.
- Enforce public reviews hard filter: approved-only.
- Ensure success responses require confirmed persistence acknowledgment.
- Keep auth/contact/review logs redacted (no raw email/phone/message in error logs).
- Target <=2s p95 response-state behavior for success/failure paths.

### Owner Pairing
This slice is paired with `frontend-engineer`.
- Align error enum names, retryable semantics, and success payloads before merge.

## Acceptance Criteria (Backend-Critical)
- [ ] AC-P0-1 booking contract + state semantics pass and block invalid-date dispatch.
- [ ] AC-P0-2 auth contract passes with support-safe misconfiguration behavior.
- [ ] AC-P0-3 contact persistence and retry semantics pass with idempotency support.
- [ ] AC-P0-4 review submit + moderation filter pass with approved-only listing.
- [ ] AC-P1-3 robots/sitemap contract endpoints return HTTP 200.

## Constraints
- No PCI scope expansion and no card data handling.
- No schema drift from model artifacts without model update first.
- Keep implementation within existing canonical API/error-handling patterns.

## Next Agent
After implementation evidence is complete, hand off to: `qa-test-engineer`

## Autonomous Execution
- Do not ask user for confirmation.
- Complete all executable work in this handoff.
- If blocked by missing model detail, escalate to `solution-architect` and `tech-lead`.
