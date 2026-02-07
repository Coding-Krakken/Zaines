Title: Ensure booking capacity is safe under concurrency

Description

Prevent overbooking via DB transactions, advisory locks, or constraints and add tests simulating concurrent booking requests.

Evidence

The booking creation logic checks capacity via queries but does not use a transactional lock; this can permit race conditions under concurrent requests.

Acceptance criteria

- Booking creation performs an atomic check-and-create using a DB transaction or advisory lock.\n- Stress tests simulate concurrent requests and show capacity is never exceeded.\n- Add DB-level constraints or counters where appropriate.

Labels: backend, reliability, priority/high
