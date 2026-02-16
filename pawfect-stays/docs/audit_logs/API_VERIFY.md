# API Verification — Audit Scripts & Results

Date: 2026-02-15

Summary

- Created audit scripts under `scripts/audit/`:
  - `curl_health.sh` — simple health check for base URL
  - `curl_auth.sh` — checks auth session/protected route behavior
  - `curl_core_flows.sh` — exercises `GET /api/availability`, `POST /api/bookings`, and `POST /api/payments/create-intent`

How to run (local)

1. Start dev server (in project root):

```bash
npm run dev
```

2. In another terminal, run health check:

```bash
./scripts/audit/curl_health.sh http://localhost:3000
```

3. Run auth check:

```bash
./scripts/audit/curl_auth.sh http://localhost:3000
```

4. Run core flows (may attempt to create a booking and a payment intent):

```bash
./scripts/audit/curl_core_flows.sh http://localhost:3000
```

Results observed during audit run

- Ran `./scripts/audit/curl_health.sh` without a running dev server:
  - Output: server unreachable (HTTP status `000` / curl failure)
  - Pass/Fail: FAIL (server not running)

- Notes: The scripts are intentionally permissive and will surface service-level errors (e.g., Stripe not configured, DB not configured). They are safe for CI when run against a configured test environment.

Pass/Fail checklist (what the scripts verify)

- Health: server responds 2xx/3xx → PASS
- Auth: protected route returns 401/403 or 200 with session → PASS
- Availability: `GET /api/availability` returns 200 and JSON → PASS
- Booking create: `POST /api/bookings` returns 200/201 (or a 400 with helpful message if env not configured) → PASS (if configured)
- Payment intent: `POST /api/payments/create-intent` returns 200/201 and clientSecret when Stripe configured → PASS (if configured)

Next actions

1. Start the dev server and re-run scripts above; capture responses and paste into this file.
2. For automated CI, consider adding a job that:
   - Boots the app with test env (DB container, Redis if needed)
   - Runs `curl_health.sh`, `curl_core_flows.sh` and fails fast if health check fails
3. Expand `curl_core_flows.sh` to support an authenticated flow (create test user, log in, use session cookie) if needed for deeper checks.
