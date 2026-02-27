## P0 Product Correction — Booking/Auth/Form Reliability + Brand Realignment

**Requested By:** product-owner handoff (2026-02-27)
**Source Handoff:** `.github/.handoffs/00-chief-of-staff/handoff-20260227-134500.md`
**Priority:** P0
**Type:** Bug + Enhancement
**First Agent Route:** `solution-architect`
**Traceability Tags:** `BRAND`, `TRUST`, `SAFETY`, `PRICING`, `BOOKING`

### Problem Summary
Production behavior is not conversion-safe and is misaligned with the canonical business-owner profile. Critical trust paths are degraded:
- Booking progression blocked by failed availability checks.
- Magic-link auth returns configuration failure.
- Contact/review submissions appear non-persistent.
- Runtime fetch/session noise undermines trust.
- SEO baseline assets (`/sitemap.xml`, `/robots.txt`) return 404.
- Messaging/IA drift from canonical small, elite, home-based private boarding model.

### Scope
#### In Scope (Now)
- Booking reliability and end-to-end completion
- Auth sign-in reliability and user-safe failures
- Contact/review persistence + confirmation UX
- Canonical brand/copy/IA realignment
- Pricing clarity and policy consistency
- SEO baseline viability (`robots.txt`, `sitemap.xml`, metadata consistency)
- Accessibility warning class for dialog/form semantics

#### Out of Scope (This Slice)
- New service lines or speculative product expansion
- Non-essential visual redesign experiments
- New pages not required for canonical IA

### Acceptance Criteria (P0 Gate)
- [ ] Booking funnel progresses from date selection to suite selection and confirmation with <=2s p95 availability response/failure state.
- [ ] Availability failures show recoverable user message + retry affordance; no raw technical text.
- [ ] Auth magic-link submit returns user-success confirmation for valid email and handles misconfiguration with support-safe message + server-side actionable logs.
- [ ] Contact form submits to backend, persists, and returns visible confirmation; failures preserve form values and enable retry.
- [ ] Review form submits to moderation workflow; invalid input blocks write with field-level validation.
- [ ] `/robots.txt` and `/sitemap.xml` return HTTP 200.

### Acceptance Criteria (P1/P2 Follow-On)
- [ ] Home/IA/copy reflect canonical private boarding profile (3 suites, safety-first, owner-on-site, all-inclusive trust messaging).
- [ ] Pricing and cancellation terms are explicit, customer-safe, and consistent across pricing + booking.
- [ ] Metadata/title consistency uses canonical brand naming.
- [ ] Accessibility warning class resolved for dialogs/forms (`aria-describedby` and associated error semantics).

### Dependencies / Escalations
1. Business owner decision: finalize pricing option (`base_plus_tax` vs `tax_inclusive_flat`).
2. Stakeholder approval: de-emphasize/remove broad “pet resort” positioning.
3. Security/compliance check: verify no sensitive data logging in booking/auth/contact paths.

### Execution Sequence
1. `solution-architect`: architecture/contract correction plan (P0 first).
2. `tech-lead`: vertical slice sequence and release gating.
3. `frontend-engineer` + `backend-engineer`: paired implementation per P0 story.
4. `qa-test-engineer`: AC traceability tests and production-like validation.
5. `quality-director`: final quality gate and PR readiness decision.
