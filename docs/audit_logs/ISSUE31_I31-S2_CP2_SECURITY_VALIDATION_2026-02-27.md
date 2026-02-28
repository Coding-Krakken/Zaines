# Issue #31 Security Validation (I31-S2 CP2 Booking Price Disclosure)

- **Date:** 2026-02-27
- **Auditor:** security-engineer
- **Issue:** #31
- **Slice:** I31-S2 (Backend)
- **Checkpoint:** CP2-booking-price-disclosure
- **Decision:** **BLOCK (security remediation required before sign-off)**

## Scope

Security review requested by QA handoff `.github/.handoffs/security-engineer/handoff-20260227-issue31-s2-cp2-validation-result.md` with focus on:

1. Input validation and schema enforcement for `POST /api/bookings` pricing disclosure path.
2. Authentication/authorization boundaries for booking/payment transitions.
3. PCI compliance posture (no app-handled card data).
4. Logging safety and sensitive data leakage risk.

## Commands Executed

```bash
pnpm exec vitest run src/__tests__/booking-payment-e2e.test.ts src/__tests__/bookings-concurrency.test.ts
pnpm exec eslint src/app/api/bookings/route.ts src/app/api/payments/webhook/route.ts src/__tests__/booking-payment-e2e.test.ts src/__tests__/bookings-concurrency.test.ts
pnpm run typecheck
pnpm audit --prod --audit-level high
```

## Command Outcomes

- `vitest` (CP2 targeted): **PASS** (`16/16` tests)
- `eslint` (targeted files): **PASS**
- `typecheck`: **PASS**
- `pnpm audit --prod --audit-level high`: **PASS** (`No known vulnerabilities found`)

## Findings

| Severity | Finding | Evidence | Status |
| --- | --- | --- | --- |
| **CRITICAL** | Stripe secret accepted from untrusted request header in booking flow. This allows caller-controlled payment processor credential injection and violates trust boundary/secrets handling. | `src/app/api/bookings/route.ts` reads `x-stripe-secret-key` and instantiates Stripe with it. | **OPEN** |
| **HIGH** | `POST /api/payments/create-intent` allows unauthenticated callers to create payment intents for arbitrary `bookingId` if they know/obtain IDs. Ownership check only runs when session exists. | `src/app/api/payments/create-intent/route.ts` has `if (session?.user?.id && booking.userId !== session.user.id)` (no explicit auth required). | **OPEN** |
| **MEDIUM** | Raw validation error object returned to client on booking/payment input failure, increasing schema/internal detail exposure. | `src/app/api/bookings/route.ts` and `src/app/api/payments/create-intent/route.ts` return `{ details: validation.error }`. | **OPEN** |
| **MEDIUM** | Raw error objects are logged on booking/payment paths; provider exceptions may include sensitive metadata. | `console.error(..., error)` patterns in booking and payment webhook/create-intent routes. | **OPEN** |

## Control Verification

### 1) Input Validation

- Zod schema exists and is enforced for `POST /api/bookings` and `POST /api/payments/create-intent`.
- Pricing disclosure contract fields are present in booking success payload (`subtotal`, `tax`, `total`, `currency`, `pricingModelLabel`, `disclosure`) per passing tests.
- Gap: validation error payloads expose full error object to clients.

### 2) AuthN/AuthZ Boundaries

- `GET /api/bookings` enforces authentication (`401` without session).
- Payment state transitions in webhook are signature-gated by `stripe-signature` + webhook secret.
- Gap: create-intent endpoint does not require auth for booking ownership validation.

### 3) PCI Posture

- No PAN/CVV/expiry handling found in reviewed booking/payment backend routes.
- Payment processing remains Stripe PaymentIntents-based.
- **PCI concern:** accepting Stripe secret from request headers in booking route breaks secrets trust boundary.

### 4) Logging Safety

- Booking diagnostic logs do not print card data.
- Gap: several error logs capture raw exceptions; should normalize/redact to fixed envelope.

## Recommendation

**BLOCK CP2 security sign-off** until the following are remediated:

1. Remove request-header-driven Stripe secret handling from booking route; only server-managed env secrets are allowed.
2. Require authentication for `POST /api/payments/create-intent` (or signed one-time token strategy) and enforce strict booking ownership checks.
3. Replace raw validation/error object responses and logs with deterministic redacted envelopes.

## Re-Verification Criteria

- Security rerun passes with no critical/high findings.
- Targeted tests still pass for CP2 acceptance criteria.
- Dependency audit remains clean at high severity threshold.