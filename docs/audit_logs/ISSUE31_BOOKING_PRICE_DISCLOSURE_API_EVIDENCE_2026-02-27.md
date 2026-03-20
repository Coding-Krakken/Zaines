# Issue #31 Booking Price Disclosure API Evidence (2026-02-27)

## Scope

- Issue: `#31`
- Slice: `I31-S2` contract verification as prerequisite for `I31-S3`
- Endpoint: `POST /api/bookings`
- Checkpoint: `CP2-booking-price-disclosure`
- Test source: `src/__tests__/issue31-booking-pricing-contract.test.ts`

## Command Executed

```bash
pnpm run test:app -- src/__tests__/issue31-booking-pricing-contract.test.ts
```

Supplemental machine-readable evidence:

```bash
pnpm exec vitest run src/__tests__/issue31-booking-pricing-contract.test.ts --reporter=json --outputFile=tmp/issue31-booking-pricing-contract-vitest.json
```

## Objective Results

- Total tests: `1`
- Passed: `1`
- Failed: `0`
- Status: `PASS`

## Contract Assertion Outcome

Expected required response fields under `pricing`:

- `subtotal`
- `tax`
- `total`
- `currency`
- `pricingModelLabel`
- `disclosure`

Observed passing evidence:

- Required fields present and asserted:
  - `subtotal` (number)
  - `tax` (number)
  - `total` (number)
  - `currency` (string)
  - `pricingModelLabel` (string)
  - `disclosure` (string)
- Pricing invariant validated:
  - `pricing.total === pricing.subtotal + pricing.tax`
- Disclosure semantics validated:
  - contains `before confirmation`
  - contains `no hidden fees`

## CP2 Decision

- `CP2-booking-price-disclosure`: **PASS**

## Validation Notes

- CP2 contract assertions pass against `src/__tests__/issue31-booking-pricing-contract.test.ts`.
- Machine-readable rerun artifact: `tmp/issue31-booking-pricing-contract-vitest.json`.

## Traceability

- AC-I31-002: **PASS**
- AC-I31-003: **PASS**
