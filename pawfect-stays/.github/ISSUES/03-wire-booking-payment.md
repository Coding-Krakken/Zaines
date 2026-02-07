Title: Wire booking → payment end-to-end

Description

Integrate Stripe PaymentIntent creation into the booking flow and ensure booking states are updated on successful payment (finish TODOs and unify flows).

Evidence

`src/app/api/bookings/route.ts` contains TODOs to create a payment intent. There are separate endpoints at `src/app/api/payments/create-intent/route.ts` and `src/app/api/payments/webhook/route.ts`.

Acceptance criteria

- POST `/api/bookings` returns booking data plus payment `client_secret` (or payment URL) when payment is required.
- On Stripe webhook events, booking status moves to `confirmed` and the payment record is updated accordingly.
- Provide one E2E test or manual test steps demonstrating booking → payment → webhook reconciliation.

Labels: feature, payments, priority/high
