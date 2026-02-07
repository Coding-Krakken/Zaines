Title: Make env vars safe for local dev (prevent startup crashes)

Description

Avoid hard crashes during module import when required env vars (DATABASE_URL, STRIPE keys, NEXTAUTH_SECRET) are missing; add clear dev-mode fallbacks and improve docs.

Evidence

`src/lib/stripe.ts` throws if `STRIPE_SECRET_KEY` is missing. The repository's `.env.example` lists many required variables without examples.

Acceptance criteria

- App boots with missing STRIPE keys; routes that require Stripe return 400 with actionable error instead of crashing.
- `.env.example` updated and a `README.md` dev setup section added with exact env list and example values.
- CI checks ensure required env vars are enforced only in production environments.

Labels: chore, docs, dev-experience
