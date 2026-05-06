# Issue 66 Platform Hardening Evidence

- Date: 2026-05-06
- Scope: performance, accessibility, reliability, API error contracts, abuse protection, and secret/PII-safe logging
- Result: PASS

## Before Snapshot

Initial local audit findings before remediation:

| Gate | Before |
|---|---:|
| Playwright axe violations across scanned public routes | 18 |
| Critical axe violations | 1 |
| Serious axe violations | 11 |
| API route raw console logging findings | 12 route-handler occurrences |
| npm production audit critical/high | 0 critical / 1 high |
| Performance budget | Failed home route script transfer against the original 750 KB ceiling |

Notable blockers:

- `/gallery` had a critical invalid ARIA relationship from tab triggers without associated tab panels.
- CTA outline buttons rendered near-white text on white backgrounds in several routes.
- `/pricing` slider thumb had no accessible name.
- API handlers mixed `{ error }`, `{ code }`, and `{ errorCode }` responses, with several missing correlation IDs.
- Risky public endpoints did not share a common throttle/abuse-protection path.
- Payment/webhook errors could expose provider implementation detail in public responses.

## After Snapshot

| Gate | After |
|---|---:|
| Playwright axe violations across scanned public routes | 0 |
| Critical/high security findings | 0 critical / 0 high |
| API route raw console logging findings | 0 |
| Critical route performance budget | PASS |
| Vitest app suite | 321/321 passing |
| TypeScript | PASS |
| ESLint | PASS |
| Production build | PASS |

Evidence files:

- `docs/audit_logs/PLAYWRIGHT_A11Y.json`
- `docs/audit_logs/PLAYWRIGHT_A11Y.md`
- `docs/audit_logs/ISSUE66_PERFORMANCE_BUDGET.json`
- `docs/audit_logs/ISSUE66_PERFORMANCE_BUDGET.md`
- `docs/audit_logs/ISSUE66_SECURITY_GATE.json`
- `docs/audit_logs/ISSUE66_SECURITY_GATE.md`

## Implemented Hardening

- Added shared security helpers:
  - `src/lib/security/api.ts`
  - `src/lib/security/logging.ts`
  - `src/lib/security/rate-limit.ts`
- Added contract-compatible public error envelopes with `errorCode`, `message`, `retryable`, and `correlationId`, while preserving legacy `error`/`code` aliases where existing callers rely on them.
- Added in-memory fixed-window rate limits for risky write or expensive endpoints:
  - magic-link auth
  - contact submissions
  - review submissions
  - booking creation
  - payment intent creation
  - booking availability checks
  - live-feed message/photo/activity creation
- Replaced API route raw console logging with structured event logs or sanitized server-failure logs.
- Redacted sensitive keys and sensitive-looking values from structured security log context.
- Hardened payment/webhook public errors so provider failure details are logged with correlation IDs but not returned to clients.
- Added global security headers in `next.config.ts`, including CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and disabled `X-Powered-By`.
- Added npm override for `socket.io-parser` so production audit has 0 critical/high findings.
- Added Issue 66 gates:
  - `pnpm run audit:issue66:performance`
  - `pnpm run audit:issue66:security`
- Made the Playwright accessibility audit fail the process if any scanned route has a violation.

## Accessibility Remediation

- Replaced gallery filter tabs with accessible pressed-state buttons.
- Fixed CTA outline button contrast by keeping dark-band outline buttons transparent until hover.
- Added accessible slider thumb naming for pricing controls.
- Corrected heading order in shared footer, home trust badges, gallery cards, FAQ accordion headers, policies content, and service update pages.
- Improved low-contrast helper text in blue/primary-tinted panels.

## Verification Commands

```bash
pnpm run lint
pnpm run typecheck
pnpm run test:app
pnpm run build
pnpm run audit:issue66:security
pnpm run audit:issue66:performance -- http://localhost:3000
pnpm run audit:ui:accessibility:playwright -- http://localhost:3000
```

Verification results:

- `pnpm run lint`: PASS
- `pnpm run typecheck`: PASS
- `pnpm run test:app`: PASS, 41 files / 321 tests
- `pnpm run build`: PASS
- `pnpm run audit:issue66:security`: PASS
  - npm production audit: 0 critical, 0 high, 6 moderate, 0 low
  - raw API console logging: 0
- `pnpm run audit:issue66:performance -- http://localhost:3000`: PASS
  - `/`: 2193 ms document complete, 355 DOM nodes, 972922 encoded bytes
  - `/book`: 1266 ms document complete, 269 DOM nodes, 249009 encoded bytes
  - `/pricing`: 596 ms document complete, 357 DOM nodes, 90386 encoded bytes
  - `/services/boarding`: 626 ms document complete, 471 DOM nodes, 54436 encoded bytes
  - `/dog`: 532 ms document complete, 320 DOM nodes, 167954 encoded bytes
  - `/auth/signin`: 929 ms document complete, 232 DOM nodes, 65588 encoded bytes
- `pnpm run audit:ui:accessibility:playwright -- http://localhost:3000`: PASS, 18/18 scanned routes at 0 violations

## Residual Notes

- npm audit still reports 6 moderate production advisories. They are below the Issue 66 critical/high gate and are recorded in `ISSUE66_SECURITY_GATE.json`.
- Next.js reports the `middleware` convention deprecation during dev/build. It is not a security finding, but migrating to the newer proxy convention should be scheduled separately.
