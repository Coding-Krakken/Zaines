# Implementation Plan — Issue #26 (P0 Trust/Booking/Brand)

**Owner:** tech-lead  
**Date:** 2026-02-27  
**Issue:** #26  
**Feature Branch:** `feature/26-p0-trust-booking-brand`  
**Source Models:**
- `.github/.system-state/model/issue26_p0_trust_booking_brand_architecture_brief.yaml`
- `.github/.system-state/contracts/issue26_p0_trust_booking_brand_contracts.yaml`
- `.github/.system-state/model/issue26_p0_trust_booking_brand_risk_register.yaml`

---

## Model-First Sequence (Mandatory)
1. Contracts, guards, and state semantics (S1–S3 backend + shared schema)
2. UI state wiring and user-safe failure copy (S1–S3 frontend)
3. SEO/metadata route baseline (S4)
4. Brand/pricing copy lock after approvals (S5)

No UI polish or copy expansion may bypass missing contract/state prerequisites.

---

## Vertical Slice Tickets

### T26-S1 — Booking Availability Reliability (P0)
**Owner Pair:** frontend-engineer + backend-engineer  
**Priority:** P0  
**Tags:** `BOOKING`, `TRUST`, `SAFETY`

**Backend scope**
- Implement/confirm `POST /api/booking/availability` contract, error family, correlation ID returns.
- Enforce invalid-date guard before dispatch (`INVALID_DATE_RANGE`).
- Ensure degraded/unavailable paths return retryable semantics and non-PII logs.

**Frontend scope**
- Implement flow states: `idle -> validating_input -> checking_availability -> available|unavailable_recoverable|service_degraded|invalid_input`.
- Prevent network call on invalid range.
- Add recoverable, non-technical retry copy.

**Done when**
- AC-P0-1 passes with explicit state assertions.
- Suite selection enabled only in `available`.
- No raw technical error text shown.

---

### T26-S2 — Auth Magic-Link Reliability (P0)
**Owner Pair:** frontend-engineer + backend-engineer  
**Priority:** P0  
**Tags:** `BOOKING`, `TRUST`

**Backend scope**
- Implement/confirm `POST /api/auth/magic-link` contract and error family.
- Map provider config failures to `AUTH_PROVIDER_MISCONFIGURED` with correlation IDs.
- Keep provider internals out of response body and logs.

**Frontend scope**
- Guard strict email validation pre-submit.
- Render deterministic states: `sent`, `invalid_email`, `provider_misconfigured`, `transient_failure`.
- Show support-safe UX for misconfiguration.

**Done when**
- AC-P0-2 passes across valid/invalid/misconfigured scenarios.
- No provider internals exposed client-side.

---

### T26-S3 — Contact + Review Persistence and Moderation (P0)
**Owner Pair:** frontend-engineer + backend-engineer  
**Priority:** P0  
**Tags:** `TRUST`, `BOOKING`, `BRAND`

**Backend scope**
- Implement/confirm `POST /api/contact/submissions` with idempotency + anti-abuse + persistence ack.
- Implement/confirm `POST /api/reviews/submissions` with moderation pending semantics.
- Implement/confirm `GET /api/reviews` approved-only hard filter.

**Frontend scope**
- Preserve entered values on retryable submit failures.
- Show confirmation identifiers only on persistence-ack success states.
- Enforce field-level validation and pending moderation messaging.

**Done when**
- AC-P0-3 and AC-P0-4 pass with persistence evidence.
- Public reviews exclude pending/rejected records.

---

### T26-S4 — SEO + Metadata Baseline (P1)
**Owner Pair:** frontend-engineer + backend-engineer  
**Priority:** P1  
**Tags:** `BRAND`, `TRUST`, `BOOKING`

**Scope**
- Implement/confirm `GET /robots.txt` and `GET /sitemap.xml` return `200` in production.
- Ensure canonical brand string `Zaine's Stay & Play` across required page metadata.

**Done when**
- AC-P1-3 passes.
- Required routes and metadata checks pass for `/`, `/about`, `/pricing`, `/book`, `/contact`.

---

### T26-S5 — Brand/Pricing Copy Alignment (P1)
**Owner Pair:** frontend-engineer + backend-engineer  
**Priority:** P1  
**Tags:** `BRAND`, `PRICING`, `TRUST`, `BOOKING`

**Scope**
- Align page copy to canonical profile (small private 3-suite model and trust pillars).
- Hold numeric pricing lock until business-owner pricing decision is approved.

**Done when**
- Stakeholder brand-positioning sign-off captured.
- Pricing option decision recorded (`base_plus_tax` or `tax_inclusive_flat`) before final numeric copy lock.

---

## QA Traceability Matrix

| Slice | AC ID | Contracts/States Under Test | Required Evidence | Tags |
|---|---|---|---|---|
| S1 | AC-P0-1-booking-progression | `/api/booking/availability`, `BookingAvailabilityFlow`, INV-I26-001/002 | State transition assertions, no invalid-range dispatch, p95 <=2s evidence | BOOKING, TRUST, SAFETY |
| S2 | AC-P0-2-auth-magic-link | `/api/auth/magic-link`, `MagicLinkFlow`, INV-I26-003 | Valid/invalid/misconfigured scenario tests, safe UX copy verification | BOOKING, TRUST |
| S3 | AC-P0-3-contact-persistence | `/api/contact/submissions`, `ContactSubmissionFlow`, INV-I26-004 | Persistence ack IDs, retry value preservation, idempotency + throttling evidence | TRUST, BOOKING |
| S3 | AC-P0-4-review-moderation | `/api/reviews/submissions`, `/api/reviews`, `ReviewModerationFlow`, INV-I26-004/005 | Moderation pending confirmation, approved-only listing test evidence | TRUST, BRAND |
| S4 | AC-P1-3-seo-baseline | `/robots.txt`, `/sitemap.xml`, metadata contract, INV-I26-006/007 | HTTP 200 checks + metadata/brand consistency for required pages | BRAND, TRUST, BOOKING |
| S5 | AC-P1-1, AC-P1-2 follow-on | Canonical profile + risk register R-26-001/R-26-002 | Stakeholder sign-off artifacts + pricing decision artifact | BRAND, PRICING, TRUST, BOOKING |

---

## Security + QA Routing Requirements
- `security-engineer` must verify log redaction for auth/contact/review failure paths (email/phone/message redaction and correlation-ID-only error logging).
- `qa-test-engineer` must produce gate evidence for AC mapping above in a production-like environment.
- P0 merge gate is blocked until S1–S3 AC evidence and security redaction sign-off are complete.
