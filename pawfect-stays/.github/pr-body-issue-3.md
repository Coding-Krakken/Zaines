@copilot

**Objective**: Integrate Stripe payment intent creation directly into the booking flow per Issue #3. This PR must unify the booking and payment endpoints so that POST /api/bookings returns both booking data and payment client_secret, and webhook events properly update booking status.

---

## Action Items (Priority Order)

1. **Integrate payment intent creation into booking endpoint**
   - **File**: `src/app/api/bookings/route.ts`
   - **Change**: Replace the TODO comment `// TODO: Create payment intent with Stripe` (line ~186) with actual Stripe integration
   - **Implementation**:
     ```typescript
     // After creating booking successfully:
     
     // Create Stripe Payment Intent if Stripe is configured
     let clientSecret: string | undefined;
     if (isStripeConfigured()) {
       try {
         const paymentIntent = await stripe.paymentIntents.create({
           amount: formatAmountForStripe(booking.total),
           currency: "usd",
           automatic_payment_methods: { enabled: true },
           metadata: {
             bookingId: booking.id,
             bookingNumber: booking.bookingNumber,
             userId: booking.userId,
           },
           description: `Booking #${booking.bookingNumber} at Pawfect Stays`,
           receipt_email: data.email,
         });
         
         // Create payment record
         await prisma.payment.create({
           data: {
             bookingId: booking.id,
             amount: booking.total,
             currency: "usd",
             status: "pending",
             stripePaymentId: paymentIntent.id,
           },
         });
         
         clientSecret = paymentIntent.client_secret || undefined;
       } catch (error) {
         console.error("Failed to create payment intent:", error);
         // Don't fail booking if payment creation fails
       }
     }
     
     // Return booking with optional client_secret
     return NextResponse.json({
       success: true,
       booking: { ...existing fields... },
       payment: clientSecret ? { clientSecret } : undefined,
       message: clientSecret 
         ? "Booking created. Please complete payment."
         : "Booking created successfully.",
     }, { status: 201 });
     ```
   - **Error Handling**: Gracefully handle Stripe failures without blocking booking creation
   - **Validate**: `pnpm typecheck && pnpm lint`

2. **Add necessary imports to booking route**
   - **File**: `src/app/api/bookings/route.ts`
   - **Change**: Add imports at the top of the file
   - **Implementation**:
     ```typescript
     import { stripe, formatAmountForStripe, isStripeConfigured } from "@/lib/stripe";
     ```
   - **Validate**: `pnpm typecheck`

3. **Fix webhook handler payment status values**
   - **File**: `src/app/api/payments/webhook/route.ts`
   - **Issue**: Lines 132, 147 use incorrect status values `"COMPLETED"`, `"FAILED"`, `"CANCELLED"`, `"REFUNDED"`
   - **Fix**: Change to match Prisma schema lowercase values: `"succeeded"`, `"failed"`, `"cancelled"`, `"refunded"`
   - **Changes**:
     - Line 132: `status: "COMPLETED"` → `status: "succeeded"`
     - Line 139: `status: "CONFIRMED"` → `status: "confirmed"`
     - Line 158: `status: "FAILED"` → `status: "failed"`
     - Line 166: `status: "CANCELLED"` → `status: "cancelled"`
     - Line 185: `status: "CANCELLED"` → `status: "cancelled"`
     - Line 199: `status: "REFUNDED"` → `status: "refunded"`
     - Line 209: `status: "CANCELLED"` → `status: "cancelled"`
   - **Validate**: `pnpm typecheck`

4. **Add end-to-end integration test**
   - **File**: Create `src/__tests__/booking-payment-e2e.test.ts`
   - **Tests to add**:
     - `"POST /api/bookings returns clientSecret when Stripe is configured"`
     - `"POST /api/bookings creates payment record with pending status"`
     - `"POST /api/bookings handles Stripe failures gracefully"`
     - `"webhook payment_intent.succeeded updates booking to confirmed"`
     - `"webhook payment_intent.payment_failed updates booking to cancelled"`
   - **Implementation approach**: 
     - Mock Stripe SDK calls
     - Mock Prisma client
     - Test full flow: booking creation → payment intent → webhook → status update
   - **Validate**: `pnpm test src/__tests__/booking-payment-e2e.test.ts`

5. **Update booking response type definition**
   - **File**: `src/app/api/bookings/route.ts`
   - **Change**: Update the response JSON structure to include optional payment field
   - **Implementation**: Ensure TypeScript types are consistent with the new response shape
   - **Validate**: `pnpm typecheck`

6. **Document the booking → payment flow**
   - **File**: `README.md`
   - **Add section**: "## Booking & Payment Flow"
   - **Content**:
     - Explain the unified booking + payment creation flow
     - Document response structure with `payment.clientSecret`
     - Show example webhook flow: payment success → booking confirmed
     - Note graceful degradation when Stripe is not configured
     - Provide test instructions with Stripe CLI for webhook testing
   - **Validate**: Visual review

7. **Optional: Add booking status transition validation**
   - **File**: `src/app/api/payments/webhook/route.ts`
   - **Enhancement**: Add validation to prevent invalid status transitions (e.g., confirmed → pending)
   - **Note**: This is OPTIONAL enhancement for data integrity
   - **Validate**: `pnpm test`

---

## Scope

### ✅ In-Scope
- Integrate payment intent creation into POST /api/bookings
- Return `clientSecret` in booking response for frontend payment handling
- Fix payment status enum mismatches in webhook handler
- Create payment record when booking is created
- Add E2E test covering booking → payment → webhook reconciliation
- Document the unified flow in README
- Verify existing tests still pass

### ❌ Out-of-Scope
- Frontend payment form UI (separate frontend work)
- Email notifications (Issue #5)
- Concurrency safety (Issue #4 / PR #9)
- Refund/cancellation endpoints (future enhancement)
- Subscription or recurring payments
- Alternative payment methods beyond Stripe

---

## Acceptance Criteria

Before marking this PR complete, verify:

- [ ] `pnpm test` passes with 0 failures
- [ ] New file `src/__tests__/booking-payment-e2e.test.ts` exists with 5+ test cases
- [ ] POST /api/bookings returns JSON with optional `payment.clientSecret` field
- [ ] Payment record is created when booking is created (if Stripe configured)
- [ ] Webhook handler uses correct lowercase status values (`"succeeded"`, not `"COMPLETED"`)
- [ ] `pnpm lint` shows 0 errors
- [ ] `pnpm typecheck` compiles successfully
- [ ] Manual test: Create booking → verify payment intent in Stripe dashboard
- [ ] Manual test: Trigger webhook → verify booking status updates to `confirmed`
- [ ] README section "Booking & Payment Flow" added with examples

---

## Idempotency & Commits

**Commit Message Pattern**:
```
feat(issue#3): <short-description>

<detailed explanation>

Refs #3
Idempotency-Key: prinstruct-<4-char-hash>
```

**Example**:
```
feat(issue#3): integrate payment intent into booking flow

- Add Stripe payment intent creation to POST /api/bookings
- Return clientSecret in booking response
- Create payment record with pending status
- Handle Stripe failures gracefully without blocking booking

Refs #3
Idempotency-Key: prinstruct-7e4f
```

**Requirements**:
- Keep commits focused (1-3 file changes per commit)
- Generate unique 4-char hash for each commit (e.g., from `echo "prinstruct-$(date +%s)" | md5sum | cut -c1-4`)
- Reference Issue #3 in all commits

---

## Validation Commands

Run these commands locally before pushing:

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Run new E2E tests
pnpm test src/__tests__/booking-payment-e2e.test.ts

# Run full test suite
pnpm test

# Manual webhook testing with Stripe CLI (requires Stripe CLI installed)
# Terminal 1: pnpm dev
# Terminal 2: stripe listen --forward-to localhost:3000/api/payments/webhook
# Terminal 3: stripe trigger payment_intent.succeeded
```

---

## Branch & CI Safety

- Branch name: `premerge/issue-3-booking-payment-integration`
- Do NOT merge directly to main without CI passing
- All pushes to `premerge/*` branches will trigger CI
- Address any CI failures before requesting review
- Ensure Stripe test keys are used, not production keys

---

## Security & Constraints

- ✅ Use Stripe test keys only (sk_test_*, pk_test_*)
- ✅ Webhook signature verification is already implemented
- ✅ Never log or expose client secrets in responses beyond the intended field
- ⚠️ Payment intent creation failure does NOT block booking creation (graceful degradation)
- ✅ Idempotent payment record creation (check for existing payment before creating)

---

## Testing Strategy

### Unit Tests
- Booking endpoint returns clientSecret when Stripe configured
- Booking endpoint handles Stripe failure gracefully
- Payment record created with correct status

### Integration Tests
- Full booking → payment intent → webhook flow
- Status transitions: pending → succeeded → confirmed
- Status transitions: pending → failed → cancelled

### Manual Testing
1. **Happy Path**:
   - POST /api/bookings with valid data
   - Verify response includes `payment.clientSecret`
   - Use Stripe test card (4242 4242 4242 4242) to complete payment
   - Trigger webhook → verify booking status = "confirmed"

2. **Failure Path**:
   - Use Stripe test card that fails (4000 0000 0000 0002)
   - Trigger payment_intent.payment_failed webhook
   - Verify booking status = "cancelled"

3. **Degraded Mode**:
   - Unset STRIPE_SECRET_KEY
   - Create booking → verify no payment.clientSecret in response
   - Verify booking still succeeds with status = "pending"

---

## Implementation Notes

### Key Technical Decisions

1. **Graceful Degradation**: If Stripe fails or is unconfigured, booking creation still succeeds but without payment integration. This prevents Stripe outages from completely blocking operations.

2. **Payment Status Enum Fix**: The webhook handler was using uppercase status values that don't match the Prisma schema. Fixed to use lowercase: `"succeeded"`, `"failed"`, `"cancelled"`, `"refunded"`.

3. **Idempotent Payment Creation**: Check for existing payment records before creating to prevent duplicate charges if booking endpoint is called multiple times.

4. **Metadata Tracking**: Store `bookingId`, `bookingNumber`, and `userId` in Stripe payment intent metadata for easy reconciliation in webhook handlers.

---

**To proceed**: Implement items 1-6 above in order, commit with proper idempotency keys, and ensure all acceptance criteria pass.

**Verification for Reviewers**: When @copilot reports completion, verify all checkboxes in "Acceptance Criteria" section are satisfied before approving.

---

Closes #3
