# Quality Gates

> **Version:** 1.0.0 | **Updated:** 2026-02-25
> **Standard:** Microsoft/NASA/Google Engineering Grade

---

## Gate Overview

Every change must pass through a series of quality gates before reaching production. Gates are **non-negotiable** — no bypass without Chief of Staff + Quality Director joint approval with documented ADR.

```
Code → [G1: Lint] → [G2: Format] → [G3: Type] → [G4: Test] → [G5: Build]
  → [G6: Security] → [G7: Docs] → [G8: PR] → [G9: Perf] → [G10: Ship]
```

---

## G1: Lint Gate

| Check             | Tool                   | Threshold            | Blocking |
| ----------------- | ---------------------- | -------------------- | -------- |
| ESLint errors     | ESLint                 | 0                    | YES      |
| ESLint warnings   | ESLint                 | 0 (--max-warnings 0) | YES      |
| JSX accessibility | eslint-plugin-jsx-a11y | 0 violations         | YES      |
| Import order      | eslint-plugin-import   | Sorted, grouped      | YES      |
| No console.log    | custom rule            | 0 in production code | YES      |
| No debugger       | ESLint                 | 0                    | YES      |

### Commands

```bash
npm run lint          # Must exit 0
npm run lint:fix      # Auto-fix then verify
```

### Failure Response

- Fix all lint errors before proceeding
- If rule seems wrong, propose ADR to change it — do not disable

---

## G2: Format Gate

| Check                | Tool                        | Threshold  | Blocking |
| -------------------- | --------------------------- | ---------- | -------- |
| Prettier conformance | Prettier                    | 100% files | YES      |
| Tailwind class order | prettier-plugin-tailwindcss | Sorted     | YES      |
| File endings         | Prettier                    | LF (Unix)  | YES      |
| Trailing whitespace  | Prettier                    | None       | YES      |

### Commands

```bash
npm run format:check  # Must exit 0
npm run format        # Auto-fix then verify
```

### Failure Response

- Run `npm run format` to auto-fix
- Format changes in separate commit if mixed with logic changes

---

## G3: Type Safety Gate

| Check               | Tool              | Threshold             | Blocking |
| ------------------- | ----------------- | --------------------- | -------- |
| TypeScript strict   | tsc --noEmit      | 0 errors              | YES      |
| No `any` types      | TypeScript strict | 0 (use `unknown`)     | YES      |
| No type assertions  | Review            | Justified + commented | YES      |
| Exhaustive switches | TypeScript        | `never` default       | YES      |

### Commands

```bash
npm run typecheck     # Must exit 0
```

### Failure Response

- Fix all type errors
- Add proper type definitions for external data
- Use Zod for runtime validation at boundaries

---

## G4: Test Gate

| Check               | Tool | Threshold         | Blocking |
| ------------------- | ---- | ----------------- | -------- |
| Unit test pass rate | Jest | 100%              | YES      |
| Line coverage       | Jest | ≥80%              | YES      |
| Branch coverage     | Jest | ≥75%              | YES      |
| Function coverage   | Jest | ≥80%              | YES      |
| Statement coverage  | Jest | ≥80%              | YES      |
| No skipped tests    | Jest | 0 `.skip` in main | YES      |
| No focused tests    | Jest | 0 `.only` in main | YES      |
| Snapshot freshness  | Jest | Updated           | YES      |

### Commands

```bash
npm test              # All tests pass
npm test -- --coverage # With coverage report
```

### Failure Response

- Fix failing tests (do not delete them)
- If test is wrong, fix the test with documented reason
- Add missing tests before adding new features
- Coverage drops require new tests in same PR

---

## G5: Build Gate

| Check            | Tool    | Threshold     | Blocking |
| ---------------- | ------- | ------------- | -------- |
| Production build | Next.js | Successful    | YES      |
| Build warnings   | Next.js | 0 critical    | YES      |
| Bundle size      | Next.js | Within budget | YES      |
| Build time       | Next.js | <120 seconds  | WARNING  |

### Commands

```bash
npm run build         # Must exit 0
```

### Failure Response

- Fix build errors before proceeding
- Investigate bundle size regressions
- Dynamic imports for large dependencies

---

## G6: Security Gate

| Check                       | Tool                   | Threshold                                        | Blocking |
| --------------------------- | ---------------------- | ------------------------------------------------ | -------- |
| Secrets in code             | gitleaks               | 0 findings                                       | YES      |
| Dependency vulns (critical) | npm audit / Dependabot | 0                                                | YES      |
| Dependency vulns (high)     | npm audit / Dependabot | 0                                                | YES      |
| Dependency vulns (medium)   | npm audit              | Documented                                       | WARNING  |
| OWASP Top 10                | Manual review          | Addressed                                        | YES      |
| CSP headers                 | Next.js config         | Configured                                       | YES      |
| PCI compliance              | Review                 | No card data handled                             | YES      |
| Input validation            | Zod                    | All API inputs                                   | YES      |
| XSS prevention              | React/Next.js          | No dangerouslySetInnerHTML without justification | YES      |

### Commands

```bash
npm audit             # Review findings
npx gitleaks detect   # Must find 0 secrets
```

### Failure Response

- Critical/High: Block PR, fix immediately
- Medium: Document in PR, create follow-up issue
- Low: Document in PR, prioritize in backlog
- Never suppress without Security Engineer approval + ADR

---

## G7: Documentation Gate

| Check           | Criterion                 | Threshold                | Blocking |
| --------------- | ------------------------- | ------------------------ | -------- |
| README current  | Manual                    | Reflects actual state    | YES      |
| API docs        | Contract match            | All endpoints documented | YES      |
| ADR exists      | For significant decisions | Complete template        | YES      |
| Changelog entry | For user-facing changes   | Present                  | YES      |
| JSDoc/TSDoc     | Public functions          | Documented               | WARNING  |
| Runbook update  | For new critical paths    | Present                  | YES      |
| Customer docs   | If customer-facing        | Updated                  | YES      |

### Failure Response

- Add missing documentation in same PR
- API docs must match implementation
- ADR required for new dependencies, patterns, or architecture changes

---

## G8: PR Completeness Gate

| Check                 | Criterion                  | Threshold              | Blocking |
| --------------------- | -------------------------- | ---------------------- | -------- |
| PR title              | Conventional commit format | Compliant              | YES      |
| PR description        | Template filled            | Complete               | YES      |
| Linked issue          | Issue or ADR reference     | Present                | YES      |
| All CI green          | All automated checks       | Passing                | YES      |
| Review approval       | Qualified reviewer         | ≥1 approval            | YES      |
| No unresolved threads | All conversations          | Resolved               | YES      |
| No TODO/FIXME         | Without linked issue       | 0 orphaned             | YES      |
| PR size               | Lines changed              | <500 (warning >200)    | WARNING  |
| Commits               | Clean history              | Squash or clean rebase | YES      |

### Failure Response

- Fill out PR template completely
- Link to issue or create one
- Resolve all review conversations
- Split large PRs into smaller ones

---

## G9: Performance Gate

| Check                    | Tool             | Threshold     | Blocking          |
| ------------------------ | ---------------- | ------------- | ----------------- |
| LCP                      | Lighthouse       | <1.2s         | YES (pre-release) |
| FID/INP                  | Lighthouse       | <10ms         | YES (pre-release) |
| CLS                      | Lighthouse       | <0.05         | YES (pre-release) |
| Lighthouse Performance   | Lighthouse CI    | ≥90           | YES (pre-release) |
| Lighthouse Accessibility | Lighthouse CI    | ≥95           | YES (pre-release) |
| Lighthouse SEO           | Lighthouse CI    | ≥95           | WARNING           |
| First Load JS            | Bundle analysis  | <100KB        | WARNING           |
| Time to Interactive      | Lighthouse       | <2.0s         | WARNING           |
| Memory leaks             | Manual/automated | None detected | YES               |

### Failure Response

- Profile and identify bottleneck
- Optimize critical rendering path
- Lazy load non-critical resources
- Document performance trade-offs in ADR

---

## G10: Ship Gate (Quality Director Only)

| Check                | Criterion             | Threshold        | Blocking |
| -------------------- | --------------------- | ---------------- | -------- |
| All gates passed     | G1-G9                 | All green        | YES      |
| Acceptance criteria  | Product Owner defined | All met          | YES      |
| Model compliance     | Models match code     | No drift         | YES      |
| Rollback plan        | Documented            | Present + tested | YES      |
| Monitoring ready     | Sentry + Analytics    | Configured       | YES      |
| Feature flags        | If gradual rollout    | Configured       | YES      |
| Stakeholder sign-off | If business-critical  | Approved         | YES      |

### Failure Response

- Return to appropriate agent for remediation
- Document blockers and communicate ETA
- Quality Director has VETO authority on any release

---

## Gate Bypass Protocol

**Bypasses are EXCEPTIONAL and require:**

1. Joint approval: Chief of Staff + Quality Director
2. Written ADR documenting:
   - What gate is bypassed
   - Why it cannot be met
   - Risk assessment
   - Remediation timeline
   - Monitoring plan
3. Automatic follow-up issue created
4. Bypass expires after 5 business days

**Gates that CANNOT be bypassed:**

- G6 Security (critical/high vulnerabilities)
- G10 Ship (Quality Director veto)

---

## Gate Metrics Dashboard

Track these metrics over time:

| Metric                | Target           | Alert      |
| --------------------- | ---------------- | ---------- |
| Gate pass rate        | >95%             | <90%       |
| Average time in gates | <30 min          | >60 min    |
| Bypass frequency      | <5% of PRs       | >10%       |
| Test flakiness        | <1%              | >5%        |
| Build reliability     | >99%             | <95%       |
| Security finding rate | Decreasing trend | Increasing |
