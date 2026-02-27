# HANDOFF FROM: solution-architect

## Dispatch Metadata
- **TO:** tech-lead
- **DISPATCH CHAIN:** [00-chief-of-staff] → [product-owner] → [solution-architect] → [tech-lead]
- **DISPATCH DEPTH:** 3/10
- **DATE:** 2026-02-27
- **GITHUB ISSUE:** #29
- **PRIORITY:** P0/P1 Tranche
- **TRACEABILITY TAGS:** `BRAND`, `TRUST`, `SAFETY`, `PRICING`, `BOOKING`

---

## Model-First Architecture Package Produced
1. Domain architecture brief: `.github/.system-state/model/issue29_continuous_improvement_architecture_brief.yaml`
2. Contracts + data/API map: `.github/.system-state/contracts/issue29_continuous_improvement_contracts.yaml`
3. Threat model and security invariants: `.github/.system-state/security/issue29_continuous_improvement_threat_model.yaml`
4. Execution sequence + rollback checkpoints: `.github/.system-state/delivery/issue29_continuous_improvement_execution_plan.yaml`
5. QA traceability matrix + required evidence: `.github/.system-state/delivery/issue29_continuous_improvement_qa_trace_matrix.yaml`
6. Implementation-ready summary: `.github/.system-state/plan/implementation_plan_issue29_continuous_improvement.md`

---

## Domain/Model Deltas Required (Before Any Implementation)
1. Add KPI + acceptance-trace model objects for stories 29.1–29.5 with deterministic pass/fail semantics.
2. Standardize public API error envelope with required `correlationId`; explicitly forbid stack/raw-PII fields.
3. Add redaction matrix model for auth/contact/review/booking payload fields and CI enforcement policy.
4. Add resilience model entries for trust-critical flow thresholds and rollback triggers.
5. Add observability model entries for KPI instrumentation and MTTD threshold (`<15m`).

No code work is compliant until these deltas are represented and validated in the corresponding system-state artifacts.

---

## API/Data/Contracts Map by Slice
- **I29-S1 Reliability:** `POST /api/booking/availability`, `POST /api/contact/submissions`, `POST /api/auth/magic-link` + deterministic validation/failure envelope + p95/acceptance SLOs.
- **I29-S2 Content Clarity:** content trust-profile contract, pricing decision-safe rule, and booking CTA viewport contract on required pages.
- **I29-S3 Accessibility:** WCAG 2.2 AA compliance contract for Home/Pricing/Book/Contact plus keyboard/screen-reader semantics.
- **I29-S4 SEO Baseline:** `GET /robots.txt`, `GET /sitemap.xml`, metadata uniqueness + index policy contract.
- **I29-S5 Security/Privacy:** redaction enforcement contract across public APIs, dependency high-severity blocking contract, PCI boundary contract.

Data-flow and evidence storage requirements are explicitly defined in the contracts artifact under `data_flow_map`.

---

## Sequence Plan + Dependencies + Rollback Checkpoints
1. **I29-S1 (P0)** → reliability baseline (no dependencies) → **CP1** reliability thresholds.
2. **I29-S2 (P0)** depends on S1 → content/pricing clarity → **CP2** comprehension/CTA/pricing-safe gates.
3. **I29-S3 (P1)** depends on S2 → accessibility AA → **CP3** zero critical violations.
4. **I29-S4 (P1)** depends on S2 → SEO hardening → **CP4** robots/sitemap + metadata gates.
5. **I29-S5 (P1)** depends on S1 + S4 → security redaction enforcement → **CP5** redaction/security/PCI gates.

**Rollback posture is mandatory at every checkpoint:** preserve DNS fallback readiness and `<5 minute` rollback window; trigger rollback on defined threshold breaches.

---

## Quality Gate Evidence Requirements (Explicit)
- Contract test outputs for all touched endpoints and deterministic error-schema assertions.
- Probe artifacts for latency, endpoint availability, and critical-flow success rates.
- Content evidence: profile-aligned checklist, 5-second comprehension summary, CTA viewport snapshots.
- Accessibility evidence: axe reports, keyboard-walkthrough evidence, assistive-tech checklist.
- SEO evidence: robots/sitemap probe logs, metadata uniqueness report, indexing policy verification.
- Security evidence: redaction probes (`100%` pass), dependency scan (`high severity = 0`), PCI delegation checklist.
- Release safety evidence: rollback drill artifact preserving `<5 minute` fallback window.

---

## Non-Negotiables Preserved
- Square payments/POS/inventory/gift cards behavior remains unchanged.
- PCI remains delegated to Square with zero card-data handling in app logs/state/storage.
- Zero-downtime migration posture is preserved.
- Deterministic scope: no speculative abstractions or pattern variants.

---

## Your Task (Tech Lead)
1. Break I29-S1..S5 into implementation tickets and assign owner pairs by slice.
2. Enforce strict model-first execution order from `issue29_continuous_improvement_execution_plan.yaml`.
3. Route security-sensitive slices to `security-engineer` for redaction/PCI sign-off.
4. Route acceptance evidence collection to `qa-test-engineer` using the Issue 29 QA trace matrix.
5. Confirm rollback checkpoint evidence before any merge from this tranche.
