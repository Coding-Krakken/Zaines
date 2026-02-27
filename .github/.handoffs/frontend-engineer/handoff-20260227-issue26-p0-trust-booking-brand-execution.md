# HANDOFF FROM: tech-lead

## Dispatch Metadata
- **TO:** frontend-engineer
- **DISPATCH CHAIN:** [user] → [product-owner] → [00-chief-of-staff] → [solution-architect] → [tech-lead] → [frontend-engineer]
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
Implement frontend portions of S1, S2, and S3 (P0), then S4/S5 only after P0 gates pass.

### Ticket Mapping
1. **T26-S1 (P0):** Booking availability UX state machine and guard behavior
2. **T26-S2 (P0):** Magic-link UI validation and deterministic outcome states
3. **T26-S3 (P0):** Contact/review submit UX with retry-safe behavior and moderation messaging
4. **T26-S4 (P1):** Metadata/brand consistency checks in required routes
5. **T26-S5 (P1):** Canonical brand/pricing copy alignment (dependency-gated)

### Implementation Requirements
- Enforce model-first sequencing: state/contract handling before polish.
- Do not dispatch booking availability request on invalid date range.
- Render non-technical error copy for degraded/retryable failures.
- Preserve form values for retryable contact/review failures.
- Do not expose provider internals in auth UI.
- Keep canonical brand string consistent: `Zaine's Stay & Play`.
- Keep files under 300 lines and avoid introducing new UI patterns.

### Owner Pairing
This slice is paired with `backend-engineer`.
- Coordinate on API payload/error code shapes before finalizing UI state branching.
- Use contract error enums exactly as modeled.

## Acceptance Criteria (Frontend-Visible)
- [ ] AC-P0-1 booking progression UX states are deterministic and recoverable.
- [ ] AC-P0-2 auth magic-link states are deterministic and support-safe.
- [ ] AC-P0-3 contact submission UX shows confirmation only on persistence ack.
- [ ] AC-P0-4 review UX enforces validation and moderation pending semantics.
- [ ] AC-P1-3 required pages preserve canonical brand metadata naming.

## Constraints
- No speculative redesign.
- No new page IA in this slice.
- No pricing numerics finalized until risk R-26-001 decision is closed.

## Next Agent
After implementation evidence is complete, hand off to: `qa-test-engineer`

## Autonomous Execution
- Do not ask user for confirmation.
- Complete all executable work in this handoff.
- If blocked by API contract drift, escalate to `tech-lead` with exact contract mismatch.
