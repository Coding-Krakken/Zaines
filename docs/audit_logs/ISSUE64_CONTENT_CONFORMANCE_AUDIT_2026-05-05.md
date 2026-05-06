# Issue 64 Content Conformance Audit

Status: Posted and approved for implementation closeout  
Date: 2026-05-05  
Owner profile source: `.github/.system-state/model/business_owner_profile.zaine.yaml`

## Scope

Audited and normalized trust-critical copy across:

- `src/app/pricing/page.tsx`
- `src/app/book/page.tsx`
- `src/app/book/components/StepWaiver.tsx`
- `src/app/book/components/StepPayment.tsx`
- `src/app/terms/page.tsx`
- `src/app/privacy/page.tsx`
- `src/app/policies/page.tsx`
- `src/app/page.tsx`
- `src/app/api/bookings/route.ts`
- `src/lib/booking/pricing.ts`
- `src/lib/validations/booking-wizard.ts`

## Approved Copy Contracts

Trust evidence claim:

> Only 3 private suites, owner onsite, camera-monitored safety, no harsh chemicals, and same-family dogs can stay together when approved.

Pricing disclosure:

> Premium but fair pricing includes clear subtotal, applicable tax, selected care items, and total shown before confirmation. No hidden fees, no surprise add-ons, or other undisclosed charges are introduced at checkout.

Cancellation/refund policy:

- 48+ hours before check-in: full refund.
- 24-48 hours before check-in: 50% refund.
- Less than 24 hours before check-in: no refund.
- No-show: full charge applies, no refund.

Booking policy acknowledgement:

> I have reviewed the Terms, Privacy Policy, cancellation policy, vaccination requirements, emergency-care authorization, and pricing disclosure before requesting confirmation.

Privacy/security disclosure:

> Payment details are processed by Stripe; Zaine's Stay & Play does not store card numbers on our servers. We use access controls and secure transmission for booking, account, pet health, and message data.

Safety standards:

- Required vaccines: Rabies, DHPP, and Bordetella.
- Vaccination records are required before confirmation and must remain current.
- Supervision protocols are anchored to owner-on-site supervision, camera-monitored safety, no overcrowded group handling, and structured care routines.
- Emergency protocol clarifies immediate owner contact when reachable and veterinary care when urgent treatment cannot wait.

## Contradictions Removed

- Removed cancellation copy promising full future credit or management-discretion credit because the cancellation route implements refund windows only.
- Removed holiday cancellation exception copy because the cancellation route does not implement separate holiday refund terms.
- Replaced absolute privacy/security claims such as "all data is encrypted" and "regular security audits" with evidence-backed Stripe, access-control, and secure-transmission language.
- Normalized pricing copy so pricing, booking, policies, terms, and API disclosures all use the same no-hidden-fees/no-surprise-add-ons contract.

## Conversion Flow Enforcement

- Booking waiver now requires explicit acknowledgement of Terms, Privacy Policy, cancellation policy, vaccination requirements, emergency-care authorization, and pricing disclosure.
- Server booking creation requires all waiver and policy acknowledgement booleans to be `true`.
- Payment step requires explicit pre-confirmation pricing disclosure acknowledgement before checkout completion.
- Payment initialization waits for a validated pricing quote before creating a booking, preventing checkout from being initialized against incomplete pricing evidence.

## Drift Tests Added

Added `src/__tests__/issue64-trust-copy-contract.test.ts` covering:

- Owner-profile-backed trust evidence claims.
- Shared pricing disclosure parity between UI contract and booking API response.
- Cancellation policy windows aligned with the cancellation route.
- Explicit policy acknowledgement validation.
- Vaccine, supervision, and emergency protocol anchors for safety standards.
- Forbidden contradictory/unsupported copy patterns.
- Evidence-backed privacy/security language.

Updated existing pricing consistency tests to follow the shared trust-copy module when route files import it.

## Verification

- `pnpm vitest run src/__tests__/issue64-trust-copy-contract.test.ts src/__tests__/issue31-pricing-consistency.test.ts src/lib/validations/__tests__/booking-wizard.test.ts src/__tests__/booking-flow-contract.test.ts src/__tests__/issue31-booking-pricing-contract.test.ts src/__tests__/bookings-concurrency.test.ts src/__tests__/booking-payment-e2e.test.ts` - PASS, 40 tests
- `pnpm exec tsc --noEmit --pretty false` - PASS
- `pnpm lint` - PASS
- `npm test` - PASS, app tests 276 passed and framework tests 63 passed

## Approval

Approved for Issue #64 closeout: content conforms to the active Zaine business owner profile, no audited contradictions remain in the required surfaces, explicit conversion acknowledgements are enforced, and drift tests protect the key copy contracts.
