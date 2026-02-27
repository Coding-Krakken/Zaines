# Issue #29 Security Sign-off (I29-S1, I29-S5, CP5 Remediation)

- **Date:** 2026-02-27
- **Auditor:** security-engineer
- **Branch:** `feature/29-continuous-improvement-tranche1`
- **Issue:** #29
- **Decision:** **Issue #29 CP5 security remediation PASS**

## Scope

Evaluated controls required by `.github/.handoffs/security-engineer/handoff-20260227-issue29-remediation-cp5-security.md`:

1. Deterministic public error envelope behavior (`errorCode`, `message`, `retryable`, `correlationId`)
2. Sensitive-field log redaction posture (`email`, `phone`, `freeText`, `message`, `authorization`, `cookie`)
3. Dependency high-severity posture and deterministic audit execution
4. PCI delegation boundary (no app-layer PAN/CVV/expiry handling)

## Evidence Summary

### 1) Route-by-route findings (I29-S1 + I29-S5)

| Route                            | Check                                                            | Result | Notes                                                                                                     |
| -------------------------------- | ---------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------- |
| `POST /api/booking/availability` | Error envelope includes `correlationId`, no stack/raw PII fields | PASS   | Uses `createPublicErrorEnvelope(...)` on all error paths and `logServerFailure(...)` for server failures. |
| `POST /api/contact/submissions`  | Error envelope includes `correlationId`, no stack/raw PII fields | PASS   | Validation/rate-limit/persistence failure paths return deterministic envelope only.                       |
| `POST /api/auth/magic-link`      | Error envelope includes `correlationId`, no stack/raw PII fields | PASS   | All error branches use `createPublicErrorEnvelope(...)`; no raw payload echoing.                          |
| `POST /api/reviews/submissions`  | Error envelope includes `correlationId`, no stack/raw PII fields | PASS   | Validation and persistence failures return deterministic envelope.                                        |
| `GET /api/reviews`               | Public data response path                                        | PASS   | Returns approved reviews list only; no error-envelope regression observed in route logic.                 |

### 2) Redaction probe evidence (I29-S5)

- `logServerFailure` in `src/lib/api/issue26.ts` emits only: `route`, `errorCode`, `correlationId`, `errorType`.
- No request body, headers, email, phone, free text, authorization, or cookie fields are logged by this shared failure logger.
- Scope route files (`booking/availability`, `contact/submissions`, `auth/magic-link`, `reviews/submissions`) call `logServerFailure` and do not directly log payload fields.

Redaction posture for required scope: **PASS (100% by design for scoped logger fields)**.

### 3) Dependency security gate (CP5 blocker remediation)

Before remediation (from prior evidence):

- `docs/audit_logs/issue29_npm_audit.json` reported `metadata.vulnerabilities.high = 1`.
- `docs/audit_logs/issue29_dependency_audit.log` failed with `reference.startsWith is not a function`.

Root cause:

- Audit execution used incompatible global `pnpm` (`8.15.9`) path instead of repository-pinned package manager version.

Deterministic remediation command path:

- `corepack pnpm --version` => `9.15.5`
- `corepack pnpm audit --prod --json`
- `corepack pnpm audit --prod --audit-level high`

Command executed:

`corepack pnpm audit --prod --json`

`corepack pnpm audit --prod --audit-level high`

Result:

- `docs/audit_logs/issue29_npm_audit.json` now records `high: 0`, `critical: 0`.
- `docs/audit_logs/issue29_dependency_audit.log` now completes with `No known vulnerabilities found`.

Dependency high-severity posture: **PASS**.

### 4) PCI delegation boundary check

Commands executed:

`grep_search` for `cardNumber|card_number|cvv|cvc|exp_month|expMonth|exp_year|expYear|payment_method_data\.` across `src/**`.

Route/code review of `src/app/book/components/StepPayment.tsx` and `src/app/api/payments/create-intent/route.ts`.

Result:

- No PAN/CVV/expiry fields handled directly in app code.
- Payment collection remains provider-hosted via Stripe Elements (`PaymentElement`) and Stripe PaymentIntents.

Additional route review confirms payment processing uses Stripe provider integration and does not introduce app-managed card PAN/CVV/expiry persistence.

PCI boundary posture for issue scope: **PASS**.

## Test/Tooling Notes

- Targeted Vitest run surfaced a test-mock drift in `src/app/api/auth/magic-link/__tests__/route.test.ts` (mock missing `createPublicErrorEnvelope` export).
- This is a test harness issue, not an observed production route security-control regression.
- **Remediation note (non-blocking for security gate):** update that test mock to include `createPublicErrorEnvelope` (or use partial `importOriginal` mock pattern).

## Final Gate Statement

**Issue #29 CP5 security remediation PASS**

No critical/high unresolved security blockers found for CP5 scope. Proceed to QA rerun evidence consolidation.
