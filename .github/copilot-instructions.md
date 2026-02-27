# Copilot Instructions - Funky Town Comics & Vinyl

> **Auto-generated from:** `.github/.system-state/copilot/*.{yaml,md}`  
> **Last Updated:** February 18, 2026  
> **Status:** Phase 0 - Copilot Model (IN PROGRESS)

---

## 🎯 Project Overview

**Project:** Funky Town Comics & Vinyl Headless Commerce Modernization  
**Risk Tier:** T2 (Production-grade)  
**Business Domain:** Retail eCommerce (Vinyl Records, Comics, Collectibles)

### Current State

- **Platform:** Square Online Store (fully managed)
- **Products:** 481 SKUs across 3 categories (records/CDs, comics, action figures)
- **Revenue:** ~$5,250/month baseline
- **Location:** Syracuse, NY (single tenant)

### Target State

- **Architecture:** Headless Commerce (Next.js 14 App Router + Square APIs)
- **Performance:** Core Web Vitals Excellence (LCP <1.2s, FID <10ms, CLS <0.05)
- **Conversion:** 50%+ improvement (target >2.0%)
- **Revenue:** 110%+ increase (target >$11,000/month)

---

## 🚨 Critical Constraints (Non-Negotiable)

1. **PRESERVE ALL INTEGRATIONS** - Square Payments, POS sync, inventory management, gift cards must remain 100% functional
2. **ZERO DOWNTIME MIGRATION** - Gradual rollout with immediate DNS rollback capability (<5 min)
3. **PCI COMPLIANCE** - Fully delegated to Square (NEVER handle card data directly)
4. **MODEL-FIRST WORKFLOW** - NO CODE before corresponding models exist and validate

---

## 📋 Development Model: STRICT MODEL-FIRST

### Phase Sequence (Current: Phase 0)

```
✅ Phase -1: Meta-Reasoning (COMPLETE)
🔄 Phase 0:  Copilot Model (IN PROGRESS - THIS FILE)
⏳ Phase 1:  System State Model (NEXT)
⏳ Phase 2:  Delivery Model
⏳ Phase 3:  Contracts Model (API schemas)
⏳ Phase 4:  Data Model
⏳ Phase 5:  Security Model
⏳ Phase 6:  Resilience Model (failure modes)
⏳ Phase 7:  Observability Model (metrics, SLOs, alerts)
⏳ Phase 8:  Test Traceability Model
⏳ Phase 9:  Performance Budgets
⏳ Phase 10: Dependency Governance
⏳ Phase 11: CI/CD Pipeline Model
⏳ Phase 12: Roadmap Model
⏳ Phase 13: IMPLEMENTATION (ONLY AFTER ALL MODELS COMPLETE)
```

### Transition Gate: Model → Implementation

**Required before ANY code:**

- ✅ All models created and validated
- ✅ Architectural review complete
- ✅ Security review complete
- ✅ Test strategy approved
- ✅ Models are consistent (no undefined states/unmodeled failures)
- ✅ All invariants specified
- ✅ All contracts defined

---

## 🎨 Canonical Patterns (SINGLE PATTERN ONLY)

### Technology Stack

- **Framework:** Next.js 14 (App Router)
- **UI Components:** Headless UI + Tailwind CSS
- **Client State:** Zustand
- **Server State:** React Query (TanStack Query)
- **Forms:** React Hook Form + Zod validation
- **Styling:** Tailwind CSS + CSS Modules
- **Backend:** Square APIs (unchanged)
- **Deployment:** Vercel
- **Monitoring:** Vercel Analytics + Sentry

### Single Canonical Patterns (NO VARIATIONS)

- **Component pattern:** One pattern for all components
- **API route pattern:** One pattern for all API routes
- **State management:** One approach (Zustand + React Query)
- **Form handling:** One pattern (React Hook Form + Zod)
- **Error handling:** One pattern (matches failure model)

---

## 📊 Complexity Budget

**Total:** 340 complexity points allocated across 7 implementation phases

| Phase | Budget | Description                                    |
| ----- | ------ | ---------------------------------------------- |
| 1     | 80 pts | Foundation (routing, layouts, Square SDK)      |
| 2     | 80 pts | UX Modernization (product pages, navigation)   |
| 3     | 50 pts | Checkout & Payments (Square integration)       |
| 4     | 30 pts | SEO Restructuring (metadata, sitemaps)         |
| 5     | 40 pts | Conversion Optimization (A/B tests, analytics) |
| 6     | 30 pts | Performance & Analytics (monitoring)           |
| 7     | 30 pts | Launch & QA (final testing, rollout)           |

**Current Spend:** 0 points (models-only phase)

### Complexity Tracking Rules

- Track by work item
- Alert when budget exceeded
- Require justification if >10% over budget
- Complexity reduction required if:
  - Budget exceeded by 10%+
  - Test coverage drops below 80%
  - Build time exceeds 120 seconds

---

## 🔒 Entropy Limits (Determinism Enforcement)

### Dependency Additions

- **Max:** 10 new dependencies per phase
- **Required:** Justification, alternatives considered, license review
- **Prefer:** Managed services over self-hosted, proven over novel

### Abstraction Additions

- **Max:** 5 new abstractions per phase
- **Rule:** Reuse before create, delete before add
- **Avoid:** Speculative abstractions

### Pattern Variations

- **Allowed component patterns:** 1
- **Allowed API patterns:** 1
- **Allowed state patterns:** 1

### File Organization

- Follow Next.js conventions
- Colocate related files
- Separate concerns
- **Max file length:** 300 lines

### Diff Minimization

- Avoid unrelated changes
- Single responsibility per PR
- Formatting changes in separate PR
- Preserve import order
- Minimal renaming (separate PR if extensive)

---

## 🧩 AMM-OS Compliance (Architecture Modernization Methodology)

### Multi-Tenant Architecture

- **Status:** Single tenant, multi-tenant ready
- **Design:** Data layer includes `tenant_id` field (currently one tenant)
- **Future:** Supports franchise locations, white-label expansion

### Configuration UI (Required)

- Site settings (hero images, featured products)
- Shipping configuration
- Tax configuration
- Email templates
- Feature flags

### Feature Flags (Required)

- **Provider:** Vercel Edge Config or LaunchDarkly
- **Use Cases:**
  - Gradual rollout (10% → 25% → 50% → 100%)
  - A/B testing
  - Beta features
  - Emergency killswitch

### Observability (T2 Tier)

- **Structured Logging:** Winston or Pino
- **Error Tracking:** Sentry
- **Performance Monitoring:** Vercel Analytics
- **SLO Tracking:**
  - Uptime >99.9%
  - Checkout success >99%
  - P95 load time <1.5s
- **Alerting:** PagerDuty or Opsgenie
- **Runbooks:** Required for all critical paths

---

## 📦 Documentation Requirements

### .customer/ Packet (Customer-Facing)

**Location:** `.customer/`  
**Update:** Per PR if customer-facing changes

**Required Files:**

- `README.md` - Overview for end users
- `SETUP.md` - Initial setup guide
- `ACCOUNTS.md` - Account management
- `BILLING.md` - Billing information
- `OPERATIONS.md` - Day-to-day operations
- `FAQ.md` - Frequently asked questions
- `TODO.md` - Customer-visible roadmap
- `CHANGELOG.md` - User-facing changes
- `SECURITY.md` - Security contact/policies

### .github/.developer/ Packet (Internal)

**Location:** `.github/.developer/`  
**Update:** Per PR (always)

**Required Files:**

- `README.md` - Developer onboarding
- `TODO.md` - Technical backlog
- `ARCHITECTURE.md` - System architecture
- `DECISIONS/` - Architecture Decision Records (ADRs)
- `RUNBOOKS/` - Operational runbooks
- `RELEASE.md` - Release process
- `INCIDENTS.md` - Incident log
- `SECURITY_INTERNAL.md` - Internal security documentation

### .github/.system-state/ (Canonical Models)

**Location:** `.github/.system-state/`  
**Purpose:** Source of truth for all architecture decisions

**Model Files:**

- `meta/meta_reasoning.yaml` - Classification, risk, complexity
- `copilot/*.{yaml,md}` - This instruction set
- `model/system_state_model.yaml` - Domain model, state machine, invariants
- `delivery/delivery_state_model.yaml` - Project management, work items
- `contracts/*.yaml` - API schemas, event schemas, error schemas
- `data/data_state_model.yaml` - Data schemas, caching, persistence
- `security/*.yaml` - Threat model, RBAC, auth boundaries
- `resilience/failure_modes.yaml` - Failure modes, retry policies, circuit breakers
- `ops/*.yaml` - Metrics, SLOs, alerts, runbooks
- `perf/budgets.yaml` - Performance budgets, load profiles
- `deps/dependency_policy.yaml` - Dependency management
- `ci/pipeline_model.yaml` - CI/CD stages, gates
- `roadmap/roadmap_model.yaml` - Prioritization, next actions

---

## 🎯 Model Rendering Rules

### Models → Code Generation

#### System State Model → TypeScript Types

```yaml
# .github/.system-state/model/system_state_model.yaml
domain_entity:
  name: Product
  fields:
    - id: string
    - name: string
    - price: number
```

↓

```typescript
// src/types/domain.ts
export interface Product {
  id: string
  name: string
  price: number
}
```

#### API Contracts → API Routes

```yaml
# .github/.system-state/contracts/api.yaml
endpoint:
  path: /api/products
  method: GET
  response_schema: Product[]
```

↓

```typescript
// src/app/api/products/route.ts
import { NextResponse } from 'next/server'
import { Product } from '@/types'

export async function GET() {
  const products: Product[] = await fetchProducts()
  return NextResponse.json(products)
}
```

#### State Machine → State Management

- Each state → TypeScript enum value
- Each transition → state update function
- Each guard → validation function
- Invariants → runtime assertions (dev mode)

### Models → Documentation

#### System State Model → Architecture Docs

- Domain entities → "Domain Model" section
- State machine → Mermaid state diagram
- Invariants → "System Invariants" section
- Security boundaries → "Security Architecture"
- AMM-OS extensions → "Multi-Tenancy" and "Configuration"

#### Failure Model → Runbooks

- Each failure mode → separate runbook
- Detection → "Symptoms" section
- Mitigation → "Resolution Steps" (numbered)
- Prevention → "Prevention" section

### Code Drift = Code is WRONG

**Rule:** If code drifts from model, model is RIGHT, code is WRONG.

**Fix Process:**

1. Identify drift via validation
2. Fix code to match model
3. If model is actually wrong, update model FIRST, then code

---

## ✅ Validation Checklist

### Before Any Code (Model Phase)

- [ ] All domain entities defined
- [ ] State machine complete (states, transitions, guards)
- [ ] All invariants specified
- [ ] Failure modes identified
- [ ] Security boundaries defined
- [ ] AMM-OS extensions included
- [ ] API contracts defined (request/response/error schemas)
- [ ] Test traceability mapped
- [ ] Performance budgets set
- [ ] SLO defined and thresholds specified
- [ ] Runbooks created for critical paths

### During Implementation (Code Phase)

- [ ] Lint passes (ESLint)
- [ ] Format passes (Prettier)
- [ ] Typecheck passes (TypeScript strict mode)
- [ ] Build succeeds (Next.js build)
- [ ] Tests pass (≥80% coverage)
- [ ] Code structure mirrors system_state_model.yaml
- [ ] API calls match contracts model
- [ ] Error handling matches failure model
- [ ] Security implementation matches security model
- [ ] Logging matches observability model
- [ ] Single canonical pattern used
- [ ] No speculative abstractions
- [ ] Existing patterns reused
- [ ] Diff minimized (no unrelated changes)
- [ ] Stable formatting
- [ ] Dependency additions justified (<10 per phase)
- [ ] Abstraction additions justified (<5 per phase)
- [ ] Complexity budget respected
- [ ] No hardcoded secrets
- [ ] Secrets scan passed (gitleaks)
- [ ] Dependency scan passed (Dependabot)
- [ ] No PII logged
- [ ] OWASP Top 10 considered

### Before PR Merge

- [ ] CI green (all checks pass)
- [ ] Code mirrors models (validated)
- [ ] Tests trace to invariants (validated)
- [ ] Diff minimized (validated)
- [ ] Documentation updated
- [ ] .customer/ updated if customer-facing changes
- [ ] .github/.developer/ updated
- [ ] Models updated if architecture changed
- [ ] ADR created if significant decision
- [ ] No TODOs or FIXMEs
- [ ] Performance budget met
- [ ] Accessibility checked (if UI changes)

### Before Deployment

- [ ] All tests passing (unit, integration, e2e)
- [ ] Performance budget met (Lighthouse >90)
- [ ] Security scan clean
- [ ] Rollback plan documented
- [ ] Staged rollout plan defined (10%→25%→50%→100%)
- [ ] Rollback triggers specified
- [ ] Monitoring dashboards ready
- [ ] Alerts configured
- [ ] Runbooks validated

---

## 🔄 Rollback Strategy

### DNS Fallback

- **Target:** Square Online Store (current production)
- **Time:** <5 minutes
- **Trigger:** Manual or automated (error rate >1%, checkout success <95%)
- **Data:** Square is source of truth (no data loss)
- **Cart State:** Preserved across rollback

### Gradual Traffic Shift

1. **10%** - Monitor for 24 hours
2. **25%** - Monitor for 48 hours
3. **50%** - Monitor for 72 hours
4. **100%** - Full production

### Rollback Triggers (Automated)

- Error rate >1%
- Payment success rate <95%
- Page load p95 >3s
- Critical errors in Sentry
- Square API sync failures

### Rollback Validation

- [ ] DNS fallback tested in staging
- [ ] Rollback triggers automated
- [ ] Cart state preserves across rollback
- [ ] Square backend unaffected
- [ ] Rollback time <5 minutes validated

---

## 📈 Success Metrics & SLOs

### Core Web Vitals (Required)

- **LCP (Largest Contentful Paint):** <1.2s
- **FID (First Input Delay):** <10ms
- **CLS (Cumulative Layout Shift):** <0.05

### Business Metrics

- **Conversion Rate:** >2.0% (baseline: 1.5%)
- **Revenue:** >$11,000/month (baseline: $5,250)
- **Average Order Value:** Track trend
- **Cart Abandonment:** <60%

### Technical SLOs

- **Uptime:** >99.9%
- **Checkout Success Rate:** >99%
- **Payment Success Rate:** >99%
- **Error Rate:** <0.1%
- **P95 Page Load:** <1.5s
- **P99 Page Load:** <3.0s

### Lighthouse Scores

- **Performance:** >90
- **Accessibility:** >95
- **SEO:** >95
- **Best Practices:** >90

---

## 🔐 Security Constraints

### PCI Compliance

- **Delegated to Square:** NEVER handle card data directly
- **No card storage:** Not in logs, not in database, not in state
- **Payment iframe:** Square Web Payments SDK only

### Secrets Management

- **Never hardcode:** Use environment variables
- **Vercel Env Vars:** Production secrets in Vercel dashboard
- **Local development:** `.env.local` (gitignored)
- **Secrets scanning:** gitleaks in CI

### Sensitive Data

- **No PII in logs:** Redact customer emails, addresses, phone numbers
- **No credentials in code:** API keys via env vars only
- **HTTPS only:** Enforce in production
- **CSP headers:** Content Security Policy configured

### Security Scanning

- **Dependencies:** Dependabot alerts
- **Code scanning:** Snyk or SonarQube
- **OWASP Top 10:** Address in security model

---

## 🧪 CI/CD Requirements

### Required Checks (Every PR)

- **Lint:** ESLint (no errors)
- **Format:** Prettier (enforced)
- **Typecheck:** TypeScript strict mode
- **Test:** Jest with ≥80% coverage
- **Build:** Next.js production build
- **Secrets Scan:** gitleaks
- **Dependency Scan:** Dependabot

### T2 Additional Checks

- **E2E Tests:** Playwright (critical user journeys)
- **Security Scan:** Snyk or SonarQube
- **Performance Budget:** Lighthouse CI (>90 performance score)

### Deployment Pipeline

1. **PR:** All checks pass → merge to main
2. **Staging:** Auto-deploy to staging.funkytowncomics.com
3. **Production:** Manual approval → gradual rollout

---

## 🎓 Self-Audit Checklist (Before Completion)

### Model Integrity

- [ ] All affected models updated?
- [ ] Code mirrors models exactly?
- [ ] No model drift?

### Determinism

- [ ] Single canonical pattern used?
- [ ] No speculative abstraction?
- [ ] Existing patterns reused?

### Entropy Control

- [ ] Diff minimized?
- [ ] No unnecessary abstraction?
- [ ] Complexity budget respected?

### Governance

- [ ] Rollback preserved?
- [ ] Determinism enforced?
- [ ] Delivery state updated?
- [ ] Roadmap updated if needed?

**If ANY answer is NO, fix before proceeding.**

---

## 🚀 Next Action

**Current Phase:** Phase 0 - Copilot Model (THIS FILE)  
**Next Phase:** Phase 1 - System State Model

**Create:** `.github/.system-state/model/system_state_model.yaml`

**Must Define:**

- Application domain model (entities: Product, Category, Cart, Order, etc.)
- State machine (states, transitions, guards, forbidden transitions)
- Invariants (system-level constraints that must always hold)
- Security boundaries (trust zones)
- AMM-OS extensions (tenant model, config hierarchy, feature flags)

**Do NOT begin implementation** until all models (Phases 1-12) are complete and validated.

---

## 📚 References

### Source Files

- `.github/.system-state/copilot/instruction.model.yaml` - Canonical model (YAML)
- `.github/.system-state/copilot/INSTRUCTIONS.md` - Detailed instructions
- `.github/.system-state/copilot/PROMPT_SHORT.md` - Quick reference
- `.github/.system-state/copilot/RENDER_RULES.md` - Model rendering rules
- `.github/.system-state/copilot/VALIDATION.md` - Validation checklists

### External Documentation

- [Next.js 14 App Router](https://nextjs.org/docs)
- [Square Developer Docs](https://developer.squareup.com/)
- [Vercel Deployment](https://vercel.com/docs)
- [AMM-OS Methodology](https://amm-os.org/) (if applicable)

---

## 🏢 Engineering Organization (Copilot Agents)

This repository is operated by a **27-agent Copilot engineering organization**. Every significant task is routed through the Chief of Staff (agent `00-chief-of-staff`), who dispatches to specialized agents via `code chat -m <agent-id>`.

### Agent Roster

See [AGENTS.md](AGENTS.md) for the full org roster, routing guide, escalation paths, and dispatch protocol.

### Core Agents

| ID                   | Agent              | Role                                  |
| -------------------- | ------------------ | ------------------------------------- |
| `00-chief-of-staff`  | Chief of Staff     | Entry point & router                  |
| `solution-architect` | Solution Architect | Domain models, ADRs                   |
| `tech-lead`          | Tech Lead          | Implementation planning               |
| `frontend-engineer`  | Frontend Engineer  | React/Next.js                         |
| `backend-engineer`   | Backend Engineer   | API routes, Square                    |
| `qa-test-engineer`   | QA Engineer        | Testing                               |
| `security-engineer`  | Security Engineer  | Threat models                         |
| `quality-director`   | Quality Director   | **ONLY agent that can end the chain** |

### Dispatch Format

**File-based handoffs (MANDATORY for multi-line prompts):**

```powershell
# 1. Write handoff file to target agent's inbox
#    File: .github/.handoffs/<agent-id>/handoff-<YYYYMMDD-HHmmss>.md

# 2. Dispatch with file attached
$repo = (Get-Location).Path
$handoff = ".github/.handoffs/<agent-id>/handoff-<timestamp>.md"
code chat -m <agent-id> --add-file $repo --add-file $handoff "Execute the task in your handoff file at $handoff"
```

**Simple single-line tasks only:**

```powershell
code chat -m <agent-id> --add-file $repo "Short single-line instruction"
```

See [.github/.handoffs/README.md](.handoffs/README.md) for full file-based handoff protocol.

### Quality Gates

See [QUALITY-GATES.md](QUALITY-GATES.md) for G1-G10 quality gates enforced on every PR.

### Prompt Library (12 Categories, 27 Prompts)

| Category        | Prompts                                                   |
| --------------- | --------------------------------------------------------- |
| discovery/      | repo-scan, techstack-detection, risk-analysis             |
| architecture/   | domain-model, system-design, adr-generation, api-contract |
| planning/       | slice-planning, acceptance-criteria                       |
| implementation/ | vertical-slice, refactor                                  |
| review/         | microsoft-grade-pr-review, gap-analysis                   |
| testing/        | test-gap, e2e-design                                      |
| security/       | threat-model, dependency-review                           |
| operations/     | observability, deployment-plan                            |
| documentation/  | runbook, readme-update                                    |
| release/        | release-notes, rollback-plan                              |
| incident/       | incident-response, postmortem                             |
| optimization/   | performance-audit, repo-health                            |

### Git & GitHub Workflow Integration

**CRITICAL:** All agents must integrate git/GitHub project management into their workflows.

**Core Rules:**

1. ✅ **Code not committed = code that doesn't exist**
2. ✅ **All work tracked in GitHub Issues**
3. ✅ **Feature branches for all non-trivial work**
4. ✅ **Pull Requests only created by Quality Director**
5. ✅ **Conventional commit messages (always)**

**Workflow Documentation:**

- [GIT_WORKFLOW.md](GIT_WORKFLOW.md) — Complete git/GitHub workflows, branch strategy, commit authority, PR management
- [operations/git-commit.prompt.md](prompts/operations/git-commit.prompt.md) — How to commit changes
- [operations/create-pr.prompt.md](prompts/operations/create-pr.prompt.md) — How to create PRs (Quality Director only)
- [operations/manage-issue.prompt.md](prompts/operations/manage-issue.prompt.md) — How to manage GitHub issues
- [operations/branch-strategy.prompt.md](prompts/operations/branch-strategy.prompt.md) — Branch creation and management

**Agent Commit Authority:**

| Agent Role             | Commit What                      | To Which Branch                      |
| ---------------------- | -------------------------------- | ------------------------------------ |
| Chief of Staff         | Emergency commits, governance    | main (exception)                     |
| Solution Architect     | Model files only                 | main (models only), feature branches |
| Tech Lead              | Implementation plans, code       | feature branches                     |
| Frontend Engineer      | React/Next.js code + tests       | feature branches                     |
| Backend Engineer       | API routes, server code + tests  | feature branches                     |
| Platform Engineer      | Infrastructure, CI/CD            | feature branches                     |
| QA Test Engineer       | Test files, test evidence        | feature branches                     |
| Security Engineer      | Security audits, reports         | feature branches                     |
| Documentation Engineer | Documentation files              | feature branches, main (docs only)   |
| Quality Director       | Validation evidence, creates PRs | feature branches                     |

**Before Starting Work:**

1. Confirm GitHub Issue exists (created by Chief of Staff)
2. Confirm feature branch exists (created by Tech Lead)
3. Pull latest: `git pull origin <branch-name>`

**During Work:**

1. Commit after each meaningful unit (≤3 files or 1 vertical slice)
2. Use conventional commit messages: `<type>(<scope>): <subject>`
3. Run quality gates before committing (lint, typecheck, test)
4. Push to remote: `git push origin <branch-name>`
5. Update GitHub Issue with progress comments

**Before Handoff:**

1. All changes committed and pushed
2. Handoff file created AND committed
3. Next agent dispatched with branch reference

**Quality Director Final Steps:**

1. Validate all G1-G10 quality gates pass
2. Create Pull Request (ONLY Quality Director)
3. Request reviews (Chief of Staff mandatory)
4. Update GitHub Issue with PR link

**See [GIT_WORKFLOW.md](GIT_WORKFLOW.md) for complete workflows, examples, and troubleshooting.**

---

### Governance

- [GIT_WORKFLOW.md](GIT_WORKFLOW.md) — **Git/GitHub project management workflows**
- [SECURITY.md](SECURITY.md) — Security policy & PCI compliance
- [RUNBOOK.md](RUNBOOK.md) — Operational runbooks
- [DECISIONS.md](DECISIONS.md) — Architecture Decision Records
- [PR_TEMPLATE.md](PR_TEMPLATE.md) — Pull request template
- [ISSUE_TEMPLATE.md](ISSUE_TEMPLATE.md) — Issue template with agent routing

---

**🤖 This file governs ALL Copilot behavior for this codebase.**  
**When in doubt, prioritize: (1) Model-first, (2) Determinism, (3) Rollback safety, (4) Commit your work.**
