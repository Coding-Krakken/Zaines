# ISSUE31 I31-S2 CP2 Security Validation Remediation — 2026-02-27

## Scope
- Issue: #31
- Slice: I31-S2 (Backend)
- Checkpoint: CP2-booking-price-disclosure (security)
- Remediation target: clear NO-SHIP findings from quality-director adjudication

## Findings Addressed

### 1) CRITICAL — request-header Stripe secret handling
- File remediated: `src/app/api/bookings/route.ts`
- Change: removed all request-header Stripe key ingestion (`x-stripe-secret-key`, `x-stripe-publishable-key`) and dynamic Stripe client construction from request context.
- Security outcome: Stripe secret trust boundary restored to server-side configuration only.

### 2) HIGH — missing mandatory auth on create-intent
- File remediated: `src/app/api/payments/create-intent/route.ts`
- Change: added hard auth gate (`401 AUTH_REQUIRED`) before booking lookup/payment processing.
- Change: ownership check is now strict and unconditional for authenticated session user (`booking.userId !== session.user.id` -> `403`).
- Security outcome: unauthenticated and cross-user payment intent creation paths are blocked.

### 3) MEDIUM — validation payload leakage
- Files remediated:
  - `src/app/api/bookings/route.ts`
  - `src/app/api/payments/create-intent/route.ts`
- Change: replaced raw `validation.error` response payloads with deterministic redacted envelopes:
  - booking: `{ error, code: BOOKING_VALIDATION_ERROR, details: { fields: [...] }, correlationId }`
  - payment: `{ error, code: PAYMENT_VALIDATION_ERROR, details: { fields: [...] }, correlationId }`
- Security outcome: internal parser object shape is no longer exposed.

### 4) MEDIUM — raw error object logging
- Files remediated:
  - `src/app/api/bookings/route.ts`
  - `src/app/api/payments/create-intent/route.ts`
- Change: replaced raw `console.error(..., error)` patterns with `logServerFailure(...)` structured logging.
- Security outcome: deterministic, redacted operational logs without raw exception payload leakage.

## Test Evidence

### Targeted security/contract tests
Command:
`pnpm exec vitest run src/__tests__/issue31-bookings-security-remediation.test.ts src/__tests__/issue31-payments-create-intent-security.test.ts`

Result:
- Test Files: 2 passed
- Tests: 4 passed

Coverage intent:
- booking route returns redacted validation envelope shape
- create-intent requires authentication
- create-intent returns redacted validation envelope shape
- create-intent enforces strict ownership for authenticated users

## Quality Gates

### Lint
Command:
`pnpm run lint`

Result:
- Passed (no ESLint errors)

### Typecheck
Command:
`pnpm run typecheck`

Result:
- Passed (`tsc --noEmit` clean)

## Remediation Status
- CRITICAL finding: RESOLVED
- HIGH finding: RESOLVED
- MEDIUM findings: RESOLVED
- Current checkpoint recommendation: READY FOR QUALITY-DIRECTOR RE-REVIEW
