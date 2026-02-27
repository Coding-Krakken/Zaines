# Handoff: Continuous Website Improvement Program (Issue #29)

**From:** product-owner  
**To:** solution-architect  
**Date:** 2026-02-27  
**GitHub Issue:** #29  
**Dispatch Chain:** [00-chief-of-staff] → [product-owner] → [solution-architect]  
**Dispatch Depth:** 2/10

---

## Canonical Business Alignment (Mandatory Source Loaded)
Source of truth reviewed: `.github/.system-state/model/business_owner_profile.zaine.yaml`

Program guardrails validated against profile:
- Brand promise: **Safe. Fun. Loved.** with cozy, elite, home-based positioning.
- Trust anchors: only 3 private suites, owner onsite, camera-monitored safety, no harsh chemicals.
- Pricing transparency: clear pricing pre-confirmation, no hidden fees, no surprise add-ons.
- Funnel objective: every page funnels to booking without gimmicks.

Traceability tags required across all acceptance criteria: `BRAND`, `TRUST`, `SAFETY`, `PRICING`, `BOOKING`.

---

## Scope Boundary

### In Scope (Program)
- Requirement-level continuous improvement framework across:
  1) UX/Design
  2) Accessibility
  3) Performance/Core Web Vitals
  4) SEO/Discoverability
  5) Conversion Funnel
  6) Reliability/Operations
  7) Security/Privacy/Compliance
  8) Developer Experience/Release Quality
- Measurable KPIs, thresholds, and evidence requirements.
- Prioritized near-term tranche (first 5 slices) with testable acceptance criteria.

### Out of Scope (for this tranche)
- New services outside current booking/lead funnel.
- Major IA expansion beyond required pages in business profile.
- Unapproved pricing model change (decision remains with business owner).
- Any implementation that bypasses model-first gates.

---

## Domain Improvement Goals + Measurable Success Criteria

### 1) UX/Design
**Goal:** Increase clarity and trust while preserving cozy/elite positioning.
- KPI U1: Hero value proposition comprehension score ≥85% in moderated 5-second test (n≥20).
- KPI U2: Booking CTA visibility in first viewport on mobile and desktop = 100% of key pages.
- KPI U3: Bounce rate on Home and Pricing reduced by ≥15% from current 28-day baseline.

### 2) Accessibility
**Goal:** Remove user barriers and maintain inclusive booking path.
- KPI A1: WCAG 2.2 AA critical violations = 0 on Home, Pricing, Book Now, Contact.
- KPI A2: Keyboard-only completion of booking initiation path success ≥95% in QA scripts.
- KPI A3: Color contrast failures on interactive elements = 0.

### 3) Performance / Core Web Vitals
**Goal:** Meet trust-critical speed targets.
- KPI P1: LCP <1.2s p75 (mobile).
- KPI P2: INP <200ms p75 (mobile) as modern proxy for interaction quality.
- KPI P3: CLS <0.05 p75.
- KPI P4: Booking-related API p95 latency ≤2.0s under defined probe profile.

### 4) SEO / Discoverability
**Goal:** Improve local intent discoverability for Syracuse private boarding searches.
- KPI S1: Valid `robots.txt` and `sitemap.xml` deployed and continuously verified.
- KPI S2: All required pages include unique metadata aligned to target keywords.
- KPI S3: Indexed valid pages coverage ≥95% of intended public routes (Search Console).

### 5) Conversion Funnel
**Goal:** Raise qualified booking intent with transparent, low-friction flow.
- KPI C1: Booking start rate (sessions → booking flow start) improves by ≥20% from baseline.
- KPI C2: Contact form completion success ≥98% (server accepted / submitted).
- KPI C3: Pricing comprehension survey score ≥90% (“no hidden fees” understood).

### 6) Reliability / Operations
**Goal:** Keep trust-critical user flows stable and recoverable.
- KPI R1: Uptime >99.9%.
- KPI R2: Critical flow success (availability check, contact submit, auth magic-link trigger) ≥99%.
- KPI R3: Rollback readiness drill (DNS fallback simulation) documented and pass within 5 minutes.

### 7) Security / Privacy / Compliance
**Goal:** Preserve PCI delegation and safe data handling.
- KPI Sec1: Payment data handling remains fully delegated to Square (0 card-data touchpoints in app logs/state).
- KPI Sec2: High-severity dependency audit findings = 0 open.
- KPI Sec3: Sensitive-field redaction pass rate = 100% for defined log probes.

### 8) Developer Experience / Release Quality
**Goal:** Improve delivery predictability while minimizing regressions.
- KPI D1: PR quality gate pass rate ≥95% (lint/typecheck/tests/build).
- KPI D2: Mean time to detect production-critical regression <15 minutes via alerting.
- KPI D3: Every merged change references model artifacts and traceability tags.

---

## Prioritized Backlog (Impact × Effort × Risk)

| Priority | Slice | Domain | Business Impact | Effort | Risk | Owner | Dependencies |
|---|---|---|---|---|---|---|---|
| P0 | Trust-Critical Funnel Reliability Baseline | Reliability + Conversion | Very High | M | M | tech-lead + backend-engineer | Existing API contract baselines |
| P0 | Booking + Pricing Clarity UX Rewrite (content-only) | UX + Conversion + Pricing | Very High | M | L | frontend-engineer + ux-designer | Business owner pricing option decision (copy variant fallback allowed) |
| P1 | Accessibility AA Remediation for Core Pages | Accessibility | High | M | L | frontend-engineer + qa-test-engineer | Current axe + keyboard audit baseline |
| P1 | SEO Technical Baseline Hardening | SEO | High | S | L | backend-engineer + frontend-engineer | Metadata model and route inventory |
| P1 | Security & Privacy Log Redaction Enforcement | Security | High | S | M | security-engineer + backend-engineer | Redaction schema + audit scripts |
| P2 | CWV Performance Budget Enforcement | Performance | Medium-High | M | M | platform-engineer + frontend-engineer | perf budget model + CI integration |
| P2 | Ops SLO Alerting + Rollback Drill Runbook Maturity | Reliability/Ops | Medium | M | M | platform-engineer | observability model updates |
| P3 | Release Quality Trend Dashboard | DX | Medium | S | L | qa-test-engineer + platform-engineer | CI metrics export |

---

## First Tranche Selection (Top 5 Slices)

Selected because they maximize trust/conversion value with controlled delivery risk and preserve model-first constraints.

1. Trust-Critical Funnel Reliability Baseline
2. Booking + Pricing Clarity UX Rewrite (content-only)
3. Accessibility AA Remediation for Core Pages
4. SEO Technical Baseline Hardening
5. Security & Privacy Log Redaction Enforcement

---

## Child Issue Draft Titles (for selected tranche)
1. `Issue 29.1: Stabilize trust-critical booking/contact/auth flow reliability baselines`
2. `Issue 29.2: Clarify booking and pricing content to reinforce trust and conversion`
3. `Issue 29.3: Achieve WCAG 2.2 AA compliance on Home/Pricing/Book/Contact`
4. `Issue 29.4: Harden technical SEO baselines (robots, sitemap, metadata integrity)`
5. `Issue 29.5: Enforce privacy-safe logging and redaction on all public APIs`

---

## User Stories + Acceptance Criteria (Given/When/Then)

### Story 29.1 — Reliability Baseline
As a dog parent, I want booking and contact flows to work reliably every time so that I can trust Zaine’s with my dog.

Acceptance Criteria:
1. **Given** the booking availability API is called with valid dates, **when** the request is processed, **then** the response is returned successfully with contract-valid payload and p95 latency ≤2.0s under standard probe profile.  
Tags: `TRUST`, `BOOKING`, `SAFETY`
2. **Given** invalid booking dates are submitted, **when** validation fails, **then** the API returns deterministic client error status and contract-valid error schema without stack leakage.  
Tags: `TRUST`, `BOOKING`, `SAFETY`
3. **Given** a contact submission is made with valid payload, **when** backend accepts it, **then** success rate is ≥98% over probe window and idempotency prevents duplicate side effects.  
Tags: `TRUST`, `BOOKING`
4. **Given** auth magic-link endpoint receives malformed email, **when** request is processed, **then** validation error is returned consistently and no sensitive data is logged.  
Tags: `TRUST`, `SAFETY`

Quality Evidence Required:
- API contract tests passing for success/failure paths.
- Latency probe artifact showing p95 threshold.
- Log redaction verification artifact for error paths.

---

### Story 29.2 — Booking + Pricing Clarity (Content-First)
As a first-time visitor, I want simple, transparent booking and pricing information so that I can decide confidently without fear of hidden charges.

Acceptance Criteria:
1. **Given** a user lands on Home or Pricing, **when** they scan primary messaging, **then** they can identify private-suite capacity, owner-onsite trust points, and all-inclusive/no-hidden-fees promise within 5 seconds (≥85% test pass).  
Tags: `BRAND`, `TRUST`, `PRICING`
2. **Given** pricing model decision is still pending, **when** pricing content is rendered, **then** it uses approved neutral decision-safe copy (no contradictory dollar claims) and preserves transparency principle.  
Tags: `PRICING`, `TRUST`
3. **Given** users navigate public pages, **when** viewing above-the-fold content, **then** an unambiguous booking CTA is present and actionable.  
Tags: `BOOKING`, `BRAND`
4. **Given** users review trust section content, **when** comparing against profile constraints, **then** prohibited claims (fake scarcity, urgency gimmicks, overcrowding language) are absent.  
Tags: `BRAND`, `TRUST`

Quality Evidence Required:
- Content QA checklist mapped to business profile fields.
- 5-second comprehension test summary.
- Snapshot-based regression evidence for CTA placement.

---

### Story 29.3 — Accessibility AA Core Pages
As a user with accessibility needs, I want to use the core pages and booking entry point without barriers so that I can complete my intent independently.

Acceptance Criteria:
1. **Given** automated accessibility scans run on Home/Pricing/Book/Contact, **when** results are reviewed, **then** WCAG 2.2 AA critical violations equal 0.  
Tags: `TRUST`, `SAFETY`, `BOOKING`
2. **Given** keyboard-only navigation, **when** traversing navigation, forms, and CTA controls, **then** focus order is logical and all interactive controls are operable.  
Tags: `TRUST`, `BOOKING`
3. **Given** screen reader semantic parsing, **when** reading page structure, **then** headings, labels, and form errors are announced meaningfully.  
Tags: `TRUST`, `SAFETY`

Quality Evidence Required:
- Axe report artifacts.
- Keyboard walkthrough test evidence.
- Assistive-technology checklist result log.

---

### Story 29.4 — SEO Baseline Hardening
As a local dog owner searching online, I want to find accurate information quickly so that I can discover and book Zaine’s services.

Acceptance Criteria:
1. **Given** production SEO endpoints are queried, **when** `robots.txt` and `sitemap.xml` are fetched, **then** both return 200 with valid content and include canonical public route coverage.  
Tags: `BOOKING`, `TRUST`
2. **Given** required pages are inspected, **when** metadata is validated, **then** each has unique title/description aligned to Syracuse private boarding intent keywords.  
Tags: `BRAND`, `BOOKING`
3. **Given** crawl simulation runs, **when** non-public/system routes are assessed, **then** they are excluded from indexing policy.  
Tags: `SAFETY`, `TRUST`

Quality Evidence Required:
- Route metadata verification logs.
- Endpoint probe logs for robots/sitemap.
- Search Console setup and baseline capture checklist.

---

### Story 29.5 — Security/Privacy Log Redaction Enforcement
As a customer, I want my personal data protected so that I can trust the platform with sensitive interactions.

Acceptance Criteria:
1. **Given** API requests include sensitive fields (email, phone, free-text), **when** logs are emitted, **then** configured sensitive fields are redacted 100% of the time.  
Tags: `SAFETY`, `TRUST`
2. **Given** dependency/security scans run in CI, **when** high severity issues are detected, **then** merge is blocked until resolved or formally risk-accepted.  
Tags: `SAFETY`, `TRUST`
3. **Given** payment-related integrations are audited, **when** data flow is traced, **then** no card data enters app-controlled storage/logging/state.  
Tags: `SAFETY`, `TRUST`, `BOOKING`

Quality Evidence Required:
- Redaction probe logs and fixtures.
- CI scan artifact with high-severity count.
- PCI delegation checklist evidence.

---

## Definition of Done (Per Selected Slice)
Each selected slice is Done only when all are true:
1. Acceptance criteria pass with objective evidence artifacts attached.
2. Required model files/contracts are updated first (or confirmed unchanged with rationale).
3. Tests pass: unit/integration/e2e relevant to slice; no regression in trust-critical flows.
4. Lint/typecheck/build gates pass.
5. Rollback safety documented (no change compromises <5 minute fallback posture).
6. Traceability mapping present for every AC (`BRAND|TRUST|SAFETY|PRICING|BOOKING`).
7. Documentation updated in `.github/.developer/` and customer-facing docs if user-visible behavior changes.

---

## Dependency Map
- **Business owner pricing decision** is an open decision dependency for final numeric pricing copy.
- **System-state model updates** required before implementation-level change tickets proceed.
- **Security and resilience models** must define redaction and failure behavior for reliability/security slices.
- **Observability model** must define KPI instrumentation points before KPI claims are accepted.

---

## Priority Rationale
- Prioritized by business value and trust-risk: funnel reliability and clarity directly affect booking conversion and brand trust.
- Accessibility and SEO are immediate growth multipliers with moderate effort and low architectural risk.
- Security redaction remains trust-preserving and compliance-critical with high downside if delayed.

---

## Request to Solution Architect
Design the technical architecture package for tranche items 29.1–29.5 under strict model-first governance. Provide:
1. Domain/model deltas required before implementation.
2. API/data/contracts map for each selected slice.
3. Sequence plan with dependencies and rollback checkpoints.
4. Implementation handoff suitable for `tech-lead` with explicit quality gate evidence requirements.

Non-negotiables to preserve:
- Square integration behavior (payments/POS/inventory/gift cards).
- Zero-downtime/rollback readiness posture.
- PCI delegation and sensitive-data safety.
- Deterministic scope (no speculative abstractions).
