# Issue #26 QA Gate Evidence (2026-02-27)

## Scope
Validated requested gate evidence for:
- I26-S1 (AC-P0-1)
- I26-S2 (AC-P0-2)
- I26-S3 (AC-P0-3, AC-P0-4)
- I26-S4 (AC-P1-3)

Source model:
- .github/.system-state/model/issue26_p0_trust_booking_brand_implementation_plan.yaml
- .github/.system-state/delivery/issue26_p0_trust_booking_brand_qa_trace_matrix.yaml

## Gate Decision
- **Issue #26 P0 Gate: FAIL**
- **Issue #26 P1 SEO merge check: FAIL**

## AC Pass/Fail Matrix

| AC | Slice | Status | Evidence | Notes |
|---|---|---|---|---|
| AC-P0-1-booking-progression | I26-S1 | FAIL | docs/audit_logs/issue26_api_contract_tests.log, docs/audit_logs/issue26_latency_probe.json | Booking contract tests fail (`POST is not a function`), no validated UI transition evidence for deterministic progression/retry semantics. |
| AC-P0-2-auth-magic-link | I26-S2 | FAIL | docs/audit_logs/issue26_api_contract_tests.log, docs/audit_logs/issue26_latency_probe.json | Auth contract tests fail (`POST is not a function`); support-safe/misconfigured/sent state not passing in automation. |
| AC-P0-3-contact-persistence | I26-S3 | FAIL | docs/audit_logs/issue26_api_contract_tests.log, docs/audit_logs/issue26_latency_probe.json | Contact tests fail (`__resetIssue26InMemoryState is not a function`), persistence/idempotency/retry evidence not passing. |
| AC-P0-4-review-moderation | I26-S3 | FAIL | docs/audit_logs/issue26_api_contract_tests.log, docs/audit_logs/issue26_latency_probe.json | Review submit/list tests fail (`POST is not a function`, `getApprovedPublicReviews is not a function`). |
| AC-P1-3-seo-baseline | I26-S4 | FAIL | docs/audit_logs/issue26_route_status_probe.json, docs/audit_logs/issue26_metadata_probe.json | `/robots.txt` and `/sitemap.xml` are HTTP 500 (not 200). `/book` and `/contact` return 500 during metadata probe. |

## Traceability Tags Proof

| AC | Required Tags | Tag Evidence Status |
|---|---|---|
| AC-P0-1-booking-progression | BOOKING, TRUST, SAFETY | Present in model matrix; execution evidence captured in artifacts above. |
| AC-P0-2-auth-magic-link | BOOKING, TRUST | Present in model matrix; execution evidence captured in artifacts above. |
| AC-P0-3-contact-persistence | TRUST, BOOKING | Present in model matrix; execution evidence captured in artifacts above. |
| AC-P0-4-review-moderation | TRUST, BRAND | Present in model matrix; execution evidence captured in artifacts above. |
| AC-P1-3-seo-baseline | BRAND, TRUST, BOOKING | Present in model matrix; execution evidence captured in artifacts above. |

Global tag completeness check:
- BRAND: covered
- TRUST: covered
- SAFETY: covered
- BOOKING: covered
- **PRICING: not represented in validated AC set (missing direct AC evidence binding in this gate scope)**

## Production-like Latency Evidence (p95 <= 2000ms target)
Artifact: docs/audit_logs/issue26_latency_probe.json

Summary from probe (15 samples each):
- booking_success: p95 21.14ms (status series mostly 500)
- booking_failure: p95 32.36ms (status series mostly 500)
- auth_success: p95 20.96ms (status series mostly 500)
- auth_failure: p95 23.25ms (status series mostly 500)
- contact_success: p95 1256.39ms (mixed 500/404)
- contact_failure: p95 35.20ms (status series mostly 500)
- review_success: p95 29.00ms (status series mostly 500)
- review_failure: p95 35.57ms (status series mostly 500)
- review_list: p95 35.10ms (status series mostly 500)

Interpretation:
- Raw p95 timing target is met.
- Required success/failure contract-state validation is **not** met due persistent 500/404 behavior and failing contract tests.

## Robots/Sitemap Verification
Artifact: docs/audit_logs/issue26_route_status_probe.json

- /robots.txt -> 500
- /sitemap.xml -> 500

Result: FAIL (required 200/200 not met)

## Metadata Consistency Checks
Artifact: docs/audit_logs/issue26_metadata_probe.json

Checked paths:
- / -> 200, title contains HTML-encoded canonical brand string
- /about -> 200, title contains HTML-encoded canonical brand string
- /pricing -> 200, title contains HTML-encoded canonical brand string
- /book -> 500
- /contact -> 500

Result: FAIL (all required pages were not consistently available with successful metadata response)

## Blocking Defects (exact locations)
1. src/app/api/reviews/submissions/route.ts is empty (no POST export).
2. src/app/api/reviews/route.ts fails at runtime/test with `getApprovedPublicReviews is not a function` (module export linkage failure).
3. src/app/api/auth/magic-link/__tests__/route.test.ts contains duplicated test blocks and fails all contract assertions with `POST is not a function`.
4. src/app/api/booking/availability/__tests__/route.test.ts fails all assertions with `POST is not a function`.
5. src/app/api/contact/submissions/__tests__/route.test.ts fails with `__resetIssue26InMemoryState is not a function` (test/runtime module export linkage failure).
6. Runtime compile errors also surface in book flow module linkage (`calculateNights` export resolution failure) causing `/book` failures during metadata probe.

## Test Execution Evidence
- Issue-26 route contract suite: docs/audit_logs/issue26_api_contract_tests.log
  - Test files: 4 failed
  - Tests: 21 failed
- Legacy availability route suite (non-issue26 endpoint) was run separately and passed:
  - src/app/api/availability/__tests__/route.test.ts (5 passed)
