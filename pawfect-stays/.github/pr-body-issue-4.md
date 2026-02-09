@copilot

**Objective**: Fully implement booking concurrency safety to prevent overbooking race conditions per Issue #4. This PR must add database transaction locks and comprehensive stress tests to ensure capacity limits are never exceeded under concurrent load.

---

## Action Items (Priority Order)

1. **Wrap booking creation in Prisma transaction with advisory lock**
   - **File**: `src/app/api/bookings/route.ts`
   - **Change**: Replace lines 55-178 (capacity check → booking creation) with `prisma.$transaction()` wrapper
   - **Implementation**:
     ```typescript
     const booking = await prisma.$transaction(async (tx) => {
       // Acquire PostgreSQL advisory lock for this suite type + date range
       await tx.$executeRaw`
         SELECT pg_advisory_xact_lock(
           hashtext(${data.suiteType}::text || ${checkInDate.toISOString()}::text)
         )
       `;
       
       // Re-check capacity inside transaction (atomic with lock)
       const overlappingBookings = await tx.booking.count({ /* existing query */ });
       
       if (overlappingBookings >= capacity[data.suiteType]) {
         throw new Error('CAPACITY_EXCEEDED');
       }
       
       // Find available suite and create booking atomically
       const availableSuite = await tx.suite.findFirst({ /* existing query */ });
       return await tx.booking.create({ /* existing data */ });
     }, {
       isolationLevel: 'Serializable',
       timeout: 10000
     });
     ```
   - **Error Handling**: Catch `PrismaClientKnownRequestError` for deadlocks and return `409 Conflict` or `503 Service Unavailable`
   - **Validate**: `pnpm typecheck && pnpm lint`

2. **Add stress tests for concurrent booking requests**
   - **File**: Create `src/__tests__/bookings-concurrency.test.ts`
   - **Tests to add**:
     - `"prevents overbooking when 20 concurrent requests target same suite/dates"`
     - `"allows exactly 10 bookings for standard tier (capacity=10)"`
     - `"rejects 11th concurrent booking with 409 status"`
     - `"handles concurrent bookings across different suite tiers independently"`
     - `"returns 503 on deadlock with Retry-After header"`
   - **Implementation approach**: Use `Promise.all()` with 20 parallel POST requests, mock Prisma with deterministic state
   - **Validate**: `pnpm test src/__tests__/bookings-concurrency.test.ts`

3. **Add error handling for transaction failures**
   - **File**: `src/app/api/bookings/route.ts`
   - **Changes**:
     - Catch `P2034` (transaction conflict) → return `{ error: "Booking conflict, please retry", status: 409 }`
     - Catch timeout errors → return `{ error: "High load, please retry", status: 503, headers: { "Retry-After": "5" } }`
     - Add logging for lock wait times (debug mode)
   - **Validate**: `pnpm test`

4. **Document concurrency model**
   - **File**: `README.md`
   - **Add section**: "## Concurrency & Data Safety"
   - **Content**:
     - Explain PostgreSQL advisory locks used for booking capacity
     - Document transaction isolation level (Serializable)
     - Note performance implications (+5-15ms per booking)
     - Provide deadlock troubleshooting steps
   - **Validate**: Visual review

5. **Optional: Add DB constraint for capacity enforcement**
   - **Files**: `prisma/schema.prisma`, `prisma/migrations/`
   - **Change**: Add computed column or check constraint to enforce suite capacity at DB level
   - **Note**: This is OPTIONAL enhancement; transaction locks alone are sufficient
   - **Validate**: `pnpm prisma migrate dev --name add-capacity-constraint`

---

## Scope

### ✅ In-Scope
- Prisma transaction wrapper with advisory locks
- Concurrent stress tests (20+ requests)
- Error handling for capacity exceeded, deadlocks, timeouts
- README documentation of concurrency model
- Verify all existing tests still pass

### ❌ Out-of-Scope
- Payment integration (Issue #3)
- Email notifications (Issue #5)
- UI changes to booking flow
- Performance optimization beyond correctness
- Database migration (unless optional constraint is added)

---

## Acceptance Criteria

Before marking this PR complete, verify:

- [ ] `pnpm test` passes with 0 failures
- [ ] New file `src/__tests__/bookings-concurrency.test.ts` exists with 4+ test cases
- [ ] Stress test demonstrates capacity never exceeded under concurrent load
- [ ] `pnpm lint` shows 0 errors
- [ ] `pnpm typecheck` compiles successfully
- [ ] Manual test: Run `ab -n 20 -c 20` (Apache Bench) against booking endpoint → verify 409 returned when capacity hit
- [ ] README section "Concurrency & Data Safety" added
- [ ] All commits follow message pattern (see below)

---

## Idempotency & Commits

**Commit Message Pattern**:
```
feat(issue#4): <short-description>

<detailed explanation>

Refs #4
Idempotency-Key: prinstruct-<4-char-hash>
```

**Example**:
```
feat(issue#4): add transaction locks for booking capacity

- Wraps booking creation in Prisma transaction
- Uses pg_advisory_xact_lock for atomic checks
- Prevents race conditions under concurrent load

Refs #4
Idempotency-Key: prinstruct-a3f9
```

**Requirements**:
- Keep commits focused (1-3 file changes per commit)
- Generate unique 4-char hash for each commit (e.g., from `echo "prinstruct-$(date +%s)" | md5sum | cut -c1-4`)
- Reference Issue #4 in all commits

---

## Validation Commands

Run these commands locally before pushing:

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Run new concurrency tests
pnpm test src/__tests__/bookings-concurrency.test.ts

# Run full test suite
pnpm test

# Optional: Stress test with real requests (requires dev server)
# Terminal 1: pnpm dev
# Terminal 2: ab -n 20 -c 20 -p booking.json -T application/json http://localhost:3000/api/bookings
```

---

## Branch & CI Safety

- Branch name should follow: `premerge/issue-4-booking-concurrency` or similar
- Do NOT merge directly to main without CI passing
- All pushes to `premerge/*` branches will trigger CI
- Address any CI failures before requesting review

---

## Security & Constraints

- ✅ No secrets or credentials required
- ✅ No production config changes
- ✅ Database transaction changes are safe (rollback on failure)
- ⚠️ PostgreSQL-specific (advisory locks require PG 9.1+)

---

**To proceed**: Implement items 1-4 above in order, commit with proper idempotency keys, and ensure all acceptance criteria pass.

**Verification for Reviewers**: When @copilot reports completion, verify all checkboxes in "Acceptance Criteria" section are satisfied before approving.

---

Closes #4
