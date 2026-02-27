# HANDOFF FROM: ux-designer

## Dispatch Metadata
- **TO:** frontend-engineer
- **DISPATCH CHAIN:** [00-chief-of-staff] → [product-owner] → [solution-architect] → [tech-lead] → [ux-designer] → [frontend-engineer]
- **DISPATCH DEPTH:** 5/10
- **DATE:** 2026-02-27
- **GITHUB ISSUE:** #29
- **FEATURE BRANCH:** `feature/29-continuous-improvement-tranche1`
- **SLICE:** `I29-S2`
- **PRIORITY:** P0
- **TRACEABILITY TAGS:** `BRAND`, `TRUST`, `PRICING`, `BOOKING`

---

## Source Artifacts
- `.github/.system-state/contracts/issue29_continuous_improvement_contracts.yaml`
- `.github/.system-state/model/issue29_continuous_improvement_architecture_brief.yaml`
- `docs/audit_logs/ISSUE29_S2_CONTENT_CLARITY_EVIDENCE_2026-02-27.md`

## Objective
Implement I29-S2 content and CTA layout updates to satisfy CP2:
1. trust-profile claims enforced,
2. pricing copy decision-safe while selected option remains TBD,
3. booking CTA visible/actionable in first viewport on required routes (mobile + desktop).

## UX Specs to Implement

### A) Trust-profile copy (required claims only)
Apply the copy package in:
- `/` (`src/app/page.tsx`)
- `/pricing` (`src/app/pricing/page.tsx`)
- `/book` (`src/app/book/page.tsx`)
- `/contact` (`src/app/contact/page.tsx`)

Required trust claims to keep visible in first-view content:
- only 3 private suites
- owner onsite
- camera-monitored safety
- no harsh chemicals
- no hidden fees

Forbidden claims to avoid:
- fake scarcity
- urgency gimmicks
- contradictory pricing claims

### B) Pricing decision-safe enforcement
Until `business_owner_profile.zaine.yaml -> service.boarding.rate.selected_option_id != TBD`:
- remove or neutralize newly introduced numeric pricing claims in trust-critical hero/CTA copy
- avoid conflicting numeric values across booking/pricing surfaces
- retain transparency statements:
  - clear total before confirmation
  - no hidden fees
  - no surprise add-ons

### C) CTA-first viewport rule
Required pages: `/`, `/pricing`, `/book`, `/contact`.

Current gap to close:
- mobile CTA visibility fails on `/pricing` and `/contact` when booking CTA is only reachable via menu.

Implementation requirement:
- add route-level mobile-visible booking CTA in first viewport for `/pricing` and `/contact`
- CTA must navigate directly to `/book` in one tap
- keep existing desktop behavior and style tokens intact

## QA Evidence Expectations (for CP2)
After implementation, provide to QA:
1. Updated content checklist proving required claims present / forbidden claims absent.
2. 5-second comprehension summary output (target `>=85`).
3. CTA viewport snapshots for mobile + desktop on all required pages.

## Exit Criteria for This Slice
- `AC-29.2-1` through `AC-29.2-4` satisfied.
- `CP2-content-trust-pricing` pass conditions met.

## Next Agent
After implementation and evidence capture, hand off to: `qa-test-engineer`
