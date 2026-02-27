# Executive Product Correction: Booking/Auth/Trust Reliability + Canonical Brand Alignment

## Summary
Live-site validation and product-owner review identified conversion-critical failures and business-model drift from the canonical owner profile. This work item tracks a P0-first correction slice to restore booking trust, unblock growth traffic, and align messaging/IA with the approved business profile.

## Source
- Handoff: `.github/.handoffs/00-chief-of-staff/handoff-20260227-134500.md`
- Source of truth: `.github/.system-state/model/business_owner_profile.zaine.yaml`

## Classification
- Type: Bug + Feature Correction
- Priority: P0 (with P1/P2 follow-ons)
- Scope: Large (multi-agent chain)

## Required Traceability Tags
`BRAND`, `TRUST`, `SAFETY`, `PRICING`, `BOOKING`

## In Scope
- Booking funnel reliability and graceful failure handling
- Auth magic-link reliability and user-safe error handling
- Contact/review persistence with user confirmation states
- Canonical brand/IA/copy alignment
- SEO baseline assets: `robots.txt`, `sitemap.xml`, metadata consistency
- Accessibility hardening for dialog/form semantics

## Out of Scope
- New service lines or speculative features
- Broad visual redesign unrelated to conversion/trust

## Acceptance Criteria (High-Level)
- [ ] Booking flow progresses from date selection through confirmation in production-like env.
- [ ] Auth sign-in returns usable confirmation state and handles misconfiguration safely.
- [ ] Contact and review submissions perform backend writes and show clear confirmation/error states.
- [ ] Public messaging and IA align to canonical private 3-suite boarding model.
- [ ] SEO baseline (`/robots.txt`, `/sitemap.xml`) returns 200 and metadata is consistent.
- [ ] Accessibility warning class for dialog/form semantics is resolved in key flows.
- [ ] QA evidence includes route sweep, flow matrix, and network/console verification.

## Explicit Escalations
- Pricing model decision required: `base_plus_tax` vs `tax_inclusive_flat`
- Stakeholder approval required for final de-emphasis/removal of broad “pet resort” positioning
- Security verification required for sensitive-data logging boundaries in booking/auth/contact paths

## Proposed Agent Chain
1. `solution-architect` (architecture/contract correction plan)
2. `tech-lead` (P0-first vertical slice plan)
3. `frontend-engineer` + `backend-engineer` (paired implementation)
4. `qa-test-engineer` (acceptance trace verification)
5. `quality-director` (final gate)
