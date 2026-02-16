# Baseline Health Check — Logs

Date: 2026-02-15

Commands executed (from project root):

- `pnpm install --frozen-lockfile` (falls back to `npm install` if `pnpm` missing)
- `npm run prisma:generate`
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

Summary of results

- Install: `pnpm` detected and `pnpm install --frozen-lockfile` run from project root. Dependency installation completed (pnpm logs in terminal output).

- Prisma generate: ✔ Generated Prisma Client (v7.3.0).

- Typecheck: ✔ TypeScript passed (Next build step also reports "Finished TypeScript").

- Lint: ✖ ESLint reported many problems.
  - Total: 2260 problems (23 errors, 2237 warnings)
  - Notable error types: `@typescript-eslint/no-this-alias`, `@typescript-eslint/no-unused-vars`, `@typescript-eslint/no-unused-expressions`.
  - Several lint findings reference files under `.vercel/output/static/_next/static/chunks/...` and other generated assets — indicates ESLint is currently scanning build/generated output directories.

- Tests: ✔ All tests passed.
  - Test runner: Vitest v4.0.18
  - Test files run: 6 test files
  - Tests: 32 passed (32)
  - Observations: Some tests wrote to stderr with expected error messages (e.g., `CAPACITY_EXCEEDED`, `Stripe API error`) as part of assertions — tests themselves passed.

- Build: ✔ `next build` completed successfully.
  - Next.js 16.1.6 (Turbopack) compiled and prerendered routes.

Full notable excerpts

Lint summary excerpt:

```
✖ 2260 problems (23 errors, 2237 warnings)

Examples:
  error    Unexpected aliasing of 'this' to local variable (@typescript-eslint/no-this-alias)
  warning  'e' is defined but never used (@typescript-eslint/no-unused-vars)
  warning  Expected an assignment or function call and instead saw an expression (@typescript-eslint/no-unused-expressions)

Many findings reference:
  /home/obsidian/Zaines/.vercel/output/static/_next/static/chunks/...
```

Tests excerpt:

```
Test Files  6 passed (6)
     Tests  32 passed (32)
  Duration  1.13s
```

Build excerpt:

```
✔ Compiled successfully
✓ Finished TypeScript
✓ Generating static pages (26/26)
```

Root-cause hypotheses

- Lint output appears to include generated build artifacts (e.g., `.vercel/output/static`) and possibly other directories that should be ignored by ESLint. This artificially inflates warnings/errors and surfaces issues that are not actionable in source.

- The codebase itself typechecks and tests pass; runtime build also succeeds — therefore the immediate blockers are lint configuration and cleanup of a small number of true code issues (unused vars, `this` aliasing) that may be in source files or in third-party/transpiled output being scanned.

Priority ranking (initial)

- P0 (build/breaking): None — `npm run build` succeeded.
- P1 (high): Lint configuration scanning generated files (fix `.eslintignore` or ESLint config to exclude build output). Address `@typescript-eslint/no-this-alias` and any real source errors.
- P2 (medium): Reduce large number of warnings (unused vars, unused expressions) in source for maintainability.
- P3 (low): Minor test stderr noise (expected in some tests) — confirm whether tests intentionally assert on stderr output and, if desired, suppress or structure logs.

Next steps (Phase 2 entry)

1. Fix ESLint scope: add/verify `.eslintignore` to exclude `.vercel`, `.next`, `node_modules`, and other generated folders. Re-run lint.
2. Triage the 23 ESLint errors to determine which are in source vs generated files; fix source ones with minimal, safe changes.
3. Re-run typecheck/lint/tests/build after fixes and record results.

Artifacts & raw output

- Full raw terminal output was captured during the run and is available in the CI/log dump produced by the audit run. If you need the complete raw output file, I can add it under `docs/audit_logs/raw_baseline_output.txt`.

Update: Lint scope fix applied

- Action: Restricted ESLint invocation to `src` and `scripts` by updating the `lint` script in `package.json` to `eslint src scripts --ext .ts,.tsx,.js` and removed a temporary `.eslintignore` file. Also added `.vercel/**` to `eslint.config.mjs` global ignores.
- Result: Running `npm run lint` now produces no warnings/errors for the targeted source directories.

End of baseline log
