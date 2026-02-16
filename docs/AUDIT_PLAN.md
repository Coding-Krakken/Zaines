# Audit Plan — Pawfect Stays

This document captures Phase 0 (Discovery) outcomes and an actionable plan for the full autonomous audit (PHASES 0–7).

## Quick repo summary (tech stack)
- Framework: Next.js 15 (App Router)
- Language: TypeScript (TS 5)
- UI: Tailwind CSS 4 + shadcn/ui components
- DB: Prisma + PostgreSQL (Prisma v7)
- Auth: NextAuth v5 (configured)
- Payments: Stripe
- Background jobs: BullMQ + Redis (worker in `Dockerfile.worker` + `docker-compose.yml`)
- Testing: Vitest
- Linting: ESLint
- Package manager: pnpm (pnpm-lock.yaml present) but package.json scripts use npm; Dockerfile uses pnpm

## Key entrypoints & config
- Frontend entrypoint: `src/app/page.tsx` (Next App Router)
- API routes: `src/app/api/*` (e.g. `/api/bookings`, `/api/payments/webhook`)
- Prisma schema: `prisma/schema.prisma`
- Worker: `scripts/worker.js` (Dockerfile.worker -> `node scripts/worker.js`)
- Compose: `docker-compose.yml` (redis + worker)
- Manifest: `package.json` (scripts: `dev`, `build`, `start`, `test`, `typecheck`, `lint`, Prisma scripts)
- TypeScript config: `tsconfig.json`

## How to install, build, test, lint, typecheck, and run (commands)

Notes: repository supports `pnpm` in Docker and `npm` in README/scripts. Use `pnpm install` or `npm install` depending on local preference. The project includes a `pnpm-lock.yaml` so prefer `pnpm` for lockfile fidelity.

1) Install
   - pnpm: `corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile`
   - or npm: `npm install`

2) Generate Prisma client (required before build/typecheck)
   - `npm run prisma:generate` (or `pnpm prisma:generate`)

3) Typecheck / Lint / Tests
   - Typecheck: `npm run typecheck`
   - Lint: `npm run lint`
   - Tests: `npm test` (Vitest)

4) Build / Start
   - Build: `npm run build` (runs `prisma generate && next build`)
   - Start (production): `npm start`
   - Dev: `npm run dev` (Next dev server)

5) Worker / Compose
   - Docker compose: `RESEND_API_KEY=... pnpm docker-compose up --build`
   - Worker (local): `npm run worker` (requires `REDIS_URL` in env)

## Critical workflows (must be validated)
- User authentication (sign in, sign out, session handling)
- Booking funnel (create booking, validation, capacity checks)
- Payment flow (create payment intent, client secret, webhook processing)
- Email notifications (Resend or local dev queue fallback)
- Worker queue processing (BullMQ + Redis) for emails and retries
- Prisma DB migrations and client generation
- Admin / content flows (reviews, suite management)

## Environment variables & secrets strategy
- Key env vars (see README): `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `REDIS_URL`, `EMAIL_FROM`.
- Repo contains `.env.example` referenced in README — ensure `.env` is gitignored (verify during Phase 5).
- Secrets must never be committed. CI should validate presence for production pipelines.

## Known risk areas & initial mitigation plan (high-level)

- Missing or mismatched lockfile usage (package.json uses npm while repo has `pnpm-lock.yaml`)
  - Mitigation: Standardize on `pnpm` locally and in CI; update README to prefer `pnpm` or ensure `npm ci` is used with package-lock if chosen.

- Prisma client generation required before build/typecheck; failing to run `prisma generate` will break builds
  - Mitigation: Ensure `prisma generate` is part of `build` (already present). Add CI step to run `prisma:generate` before typecheck/build.

- Webhook signature validation and Stripe secrets: webhook endpoint must be tested thoroughly
  - Mitigation: Add `scripts/audit/curl_auth.sh` and `curl_core_flows.sh` during Phase 3 to validate webhooks with stripe CLI.

- Worker/Redis optional; missing `REDIS_URL` triggers local fallback (tmp/email-queue.log). Ensure tests cover both modes.
  - Mitigation: Create test mode with in-memory or file-backed queue; CI should run worker-less tests (unit) and a separate integration suite with Redis if available.

- Concurrency & overbooking: locking strategy in README references advisory locks and serializable transactions — must audit implementation and tests for races
  - Mitigation: Run `bookings-concurrency.test.ts` and add deterministic stress tests if flaky.

- Type, lint, and test failures caused by mismatched devDependency versions (ESLint/TypeScript/Next/Vitest)
  - Mitigation: Run baseline checks and pin failing deps or adjust configs minimally.

- Accessibility & UX risks (missing labels, contrast, keyboard nav)
  - Mitigation: Automated a11y checks (axe core) and manual route pass in Phase 4.

## Deliverables for Phase 0
- `docs/AUDIT_PLAN.md` (this file)
- Updated todo list entry created in root audit plan tracker (managed via tool)

## Next steps (Phase 1)
1. Run clean dependency install respecting `pnpm-lock.yaml` and capture output
2. Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` and record all results in `docs/audit_logs/BASELINE.md`
3. Triage failures and prioritize fixes (P0..P3)

-- End of AUDIT_PLAN
