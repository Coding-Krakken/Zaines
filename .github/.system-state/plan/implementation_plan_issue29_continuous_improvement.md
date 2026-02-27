# Implementation Plan — Issue #29 (Continuous Website Improvement Program)

**Owner:** solution-architect  
**Date:** 2026-02-27  
**Issue:** #29  
**Source Handoff:** `.github/.handoffs/solution-architect/handoff-20260227-issue29-continuous-improvement-program.md`

## Model-First Artifacts
- `.github/.system-state/model/issue29_continuous_improvement_architecture_brief.yaml`
- `.github/.system-state/contracts/issue29_continuous_improvement_contracts.yaml`
- `.github/.system-state/security/issue29_continuous_improvement_threat_model.yaml`
- `.github/.system-state/delivery/issue29_continuous_improvement_execution_plan.yaml`
- `.github/.system-state/delivery/issue29_continuous_improvement_qa_trace_matrix.yaml`

## Domain/Model Deltas Required Before Code
1. Add KPI entities + acceptance trace mapping for stories 29.1–29.5.
2. Standardize public API error envelope (`errorCode`, `message`, `retryable`, `correlationId`) with explicit forbidden sensitive fields.
3. Define redaction matrix and CI blocking policy for sensitive logging.
4. Define resilience triggers and rollback checkpoints preserving `<5 min` DNS fallback posture.
5. Define observability instrumentation points for KPI claims and alerting MTTD objective `<15 min`.

## Slice Sequence + Dependencies + Rollback Checkpoints
1. **I29-S1 (P0):** Trust-critical funnel reliability baseline (booking/contact/auth)  
   - Dependencies: none  
   - Checkpoint CP1: p95/API and success-rate thresholds met  
   - Rollback trigger: critical flow success `<99%`, error rate `>1%`, p95 `>3s`
2. **I29-S2 (P0):** Booking + pricing clarity content-first  
   - Dependencies: I29-S1  
   - Checkpoint CP2: comprehension + CTA + pricing-safe copy gates pass  
   - Rollback trigger: contradictory pricing claim, missing primary CTA
3. **I29-S3 (P1):** Accessibility AA remediation core pages  
   - Dependencies: I29-S2  
   - Checkpoint CP3: WCAG critical violations `=0`, keyboard path `>=95%`  
   - Rollback trigger: any critical accessibility regression
4. **I29-S4 (P1):** SEO technical baseline hardening  
   - Dependencies: I29-S2  
   - Checkpoint CP4: robots/sitemap `200`, metadata uniqueness pass  
   - Rollback trigger: crawl asset non-200 or indexable non-public route
5. **I29-S5 (P1):** Security + privacy log redaction enforcement  
   - Dependencies: I29-S1 and I29-S4  
   - Checkpoint CP5: redaction `100%`, high severity vulns `0`, PCI boundary pass  
   - Rollback trigger: any redaction failure, high severity unresolved finding

## Evidence Requirements (Must Attach Per Slice)
- Contract tests and probe logs (status, schema, latency).
- Content QA checklist + 5-second comprehension summary + CTA viewport snapshots.
- Accessibility artifacts (axe results, keyboard walkthrough, assistive checklist).
- SEO artifacts (robots/sitemap probe logs, metadata validation, indexing policy checklist).
- Security artifacts (redaction probes, dependency scan output, PCI delegation checklist).
- Rollback readiness artifact proving fallback posture remains within 5 minutes.

## Non-Negotiables Preserved
- Square payments/POS/inventory/gift cards behavior unchanged.
- PCI delegation remains fully with Square.
- Zero-downtime migration posture and DNS rollback readiness maintained.
- Deterministic scope and canonical patterns only (no speculative abstractions).
