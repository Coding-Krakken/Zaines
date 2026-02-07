Title: Fix Prisma client initialization (runtime crash)

Description

Resolve the Prisma client constructor error so the dev server and API routes initialize successfully.

Evidence

Runtime error observed during dev runs: PrismaClientConstructorValidationError -> "Using engine type 'client' requires either 'adapter' or 'accelerateUrl'..." causing 500s when importing server modules. See `src/lib/prisma.ts`.

Acceptance criteria

- Dev server starts without Prisma constructor errors.
- GET `/api/availability` with valid dates returns 200 JSON (not 500).
- CI smoke test imports Prisma without throwing.

Labels: bug, backend, priority/critical
