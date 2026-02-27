# Issue #29 — Tranche 1 Frontend QA Evidence

**Date:** 2026-02-27  
**Prepared By:** `qa-test-engineer`  
**Branch Context:** `feature/29-continuous-improvement-tranche1`  
**Scope:** Frontend tranche execution verification for I29-S1, I29-S2, I29-S3, I29-S4  
**Traceability Tags:** `BRAND`, `TRUST`, `SAFETY`, `PRICING`, `BOOKING`

---

## 1) Execution Inputs

Validated implementation handoff:

- `.github/.handoffs/qa-test-engineer/handoff-20260227-issue29-tranche1-frontend-execution-result.md`

Trace matrix references:

- `.github/.system-state/delivery/issue29_continuous_improvement_qa_trace_matrix.yaml`
- `.github/.system-state/delivery/issue29_continuous_improvement_execution_plan.yaml`

---

## 2) Commands Executed

1. `pnpm run test:app`
   - **PASS** (`14` files, `60` tests)
2. `pnpm run build`
   - **PASS**
3. `node scripts/audit/issue29_gate_probe.js http://127.0.0.1:3100`
   - **PASS** (artifacts written)
4. `node scripts/audit/issue29_content_probe.js http://127.0.0.1:3100`
   - **PASS** (artifacts written)
5. `node scripts/audit/issue29_keyboard_probe.js http://127.0.0.1:3100`
   - **PASS** (artifact written)
6. `node scripts/audit/accessibility_check.js http://127.0.0.1:3100`
   - **FAIL** (`Cannot find module 'axe-core'`)
7. `pnpm run audit:ui:accessibility:playwright -- http://127.0.0.1:3100`
   - **FAIL** (`Cannot find module 'playwright'`)
8. `node scripts/audit/accessibility_basic_check.js http://127.0.0.1:3100`
   - **PASS** (fallback artifact written)

---

## 3) CP1/CP2/CP3/CP4 Decision Matrix

| Checkpoint                    | Result   | Evidence                                                                                         |
| ----------------------------- | -------- | ------------------------------------------------------------------------------------------------ |
| **CP1-reliability-baseline**  | **PASS** | `docs/audit_logs/issue29_latency_probe.json`, `docs/audit_logs/issue29_probe_run.log`            |
| **CP2-content-trust-pricing** | **PASS** | `docs/audit_logs/issue29_content_probe.json`, `docs/audit_logs/issue29_cta_snapshots/*`          |
| **CP3-accessibility-aa**      | **FAIL** | `docs/audit_logs/issue29_keyboard_walkthrough.json`, `docs/audit_logs/AXE_BASIC_RESULTS.json`    |
| **CP4-seo-baseline**          | **PASS** | `docs/audit_logs/issue29_route_status_probe.json`, `docs/audit_logs/issue29_metadata_probe.json` |

---

## 4) Detailed Findings

### CP1 — Reliability Baseline

`issue29_latency_probe.json` shows deterministic behavior and bounded latency for trust-critical endpoints:

- `booking-success`: `20/20` at HTTP `200`, p95 `111.88ms`
- `booking-invalid-range`: `20/20` at HTTP `400`, deterministic error payload with `errorCode`, `message`, `retryable`, `correlationId`
- `contact-success`: `20/20` at HTTP `201`, p95 `44.96ms`
- `auth-invalid-email`: `20/20` at HTTP `422`, deterministic validation payload

**Result:** PASS

### CP2 — Content Trust + CTA First Viewport

`issue29_content_probe.json` verifies required routes (`/`, `/pricing`, `/book`, `/contact`) on desktop + mobile:

- CTA visible in viewport for all 8 route/profile combinations
- CTA text present and actionable (`Book Now`, `Book Your Stay`, `Start Booking`)
- First-viewport heading and lead snippets align to trust-profile and booking intent

Snapshot artifacts:

- `docs/audit_logs/issue29_cta_snapshots/desktop-home.png`
- `docs/audit_logs/issue29_cta_snapshots/desktop-pricing.png`
- `docs/audit_logs/issue29_cta_snapshots/desktop-book.png`
- `docs/audit_logs/issue29_cta_snapshots/desktop-contact.png`
- `docs/audit_logs/issue29_cta_snapshots/mobile-home.png`
- `docs/audit_logs/issue29_cta_snapshots/mobile-pricing.png`
- `docs/audit_logs/issue29_cta_snapshots/mobile-book.png`
- `docs/audit_logs/issue29_cta_snapshots/mobile-contact.png`

**Result:** PASS

### CP3 — Accessibility AA

Keyboard traversal (`issue29_keyboard_walkthrough.json`) results:

- Required routes all report `hasFocusableProgress: true`
- Required routes all report `hasCtaFocus: true`

Automated accessibility blocker status:

- Primary axe script failed due missing runtime dependency: `Cannot find module 'axe-core'`
- Playwright axe path also failed due missing runtime dependency: `Cannot find module 'playwright'`
- Fallback basic scan (`AXE_BASIC_RESULTS.json`) identified one issue on `/book`:
  - `button-no-name` on combobox trigger with id `petCount`

**Result:** FAIL (automation/tooling gap plus one remaining `/book` control naming issue)

### CP4 — SEO Baseline

Endpoint/status probe (`issue29_route_status_probe.json`):

- `/robots.txt`: HTTP `200`
- `/sitemap.xml`: HTTP `200`

Metadata probe (`issue29_metadata_probe.json`):

- `/`, `/pricing`, `/book`, `/contact` all HTTP `200`
- Distinct titles/descriptions present
- `ctaMentionInInitialHtml: true` for all required routes

Robots sample confirms indexing exclusions for system routes:

- `Disallow: /api/`
- `Disallow: /dashboard/`
- `Disallow: /auth/`
- `Disallow: /book/confirmation`
- `Disallow: /_next/`
- `Disallow: /static/`
- `Disallow: /preview-themes/`

**Result:** PASS

---

## 5) Acceptance Criteria Mapping (Frontend Tranche)

- **AC-29.1-1:** PASS
- **AC-29.1-2:** PASS
- **AC-29.1-3:** PASS
- **AC-29.1-4:** PASS
- **AC-29.2-1:** PASS
- **AC-29.2-2:** PASS
- **AC-29.2-3:** PASS
- **AC-29.2-4:** PASS
- **AC-29.3-1:** **FAIL/PARTIAL** (axe automation not executable in current environment)
- **AC-29.3-2:** PASS (keyboard traversal evidence passes)
- **AC-29.3-3:** **FAIL/PARTIAL** (`/book` control accessible-name issue requires remediation)
- **AC-29.4-1:** PASS
- **AC-29.4-2:** PASS
- **AC-29.4-3:** PASS

---

## 6) QA Gate Recommendation

**Issue #29 tranche 1 frontend QA gate: FAIL**

Blocking items:

1. CP3 axe automation cannot execute in current workspace (`axe-core` and `playwright` module gaps in script runtime paths).
2. `/book` has one actionable accessibility naming defect (`button-no-name` for `petCount` control) from `AXE_BASIC_RESULTS.json`.

Recommended remediation owner: `frontend-engineer` (UI control naming), `tech-lead`/`platform-engineer` (audit runtime dependency alignment for axe scripts).
