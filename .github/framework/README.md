# SubZero Agentic Framework

**Version:** 2.0.0  
**Status:** Active  
**Last Updated:** 2026-02-26

---

## 🎯 Overview

The SubZero Agentic Framework is an **enterprise-grade, GitHub-native orchestration system** for coordinating 27 specialized AI agents across the entire software development lifecycle.

**Key Features:**

- ✅ **GitHub-Native Handoffs:** All agent coordination via Issue/PR comments (NEW in v2.0)
- ✅ **Microsoft-Grade Governance:** Strict quality gates, traceability, auditability
- ✅ **Parallel Quality Gates:** G1-G10 enforcement with parallelization
- ✅ **Declarative Routing:** Agent chain optimization and bypass logic
- ✅ **Workflow Orchestration:** Commit checkpoints, PR automation, review workflows
- ✅ **Telemetry & Observability:** Framework-level metrics and monitoring

---

## 📦 Core Modules

### 0. Business Owner Intent Layer (NEW)

**Canonical Source Profile:**
- `.github/.system-state/model/business_owner_profile.zaine.yaml`

**Purpose:** Make Product Owner outputs explicitly traceable to business-owner intent so implementation stays aligned to brand, trust, safety, pricing, and booking conversion goals.

**Required in workflow:**
- Feature issue intake (Business Owner Intent tags)
- Acceptance criteria generation (AC-to-business alignment)
- Slice planning (slice-to-business alignment)
- Product Owner Definition of Done (alignment validated)

### 1. GitHub Handoff System (NEW in v2.0)

**Modules:**
- `github-handoff-provider.ts` — Post/read handoffs via GitHub API
- `context-resolver.ts` — Resolve work item context (repo, issue, PR, branch)
- `dispatcher.ts` — Dispatch agents via `code chat` with handoff URL
- `comment-template-service.ts` — Load and render comment templates

**Purpose:** Replace file-based handoffs with GitHub-native Issue/PR comments.

**Features:**
- Post handoff comments to PR (preferred) or Issue
- Standardized comment templates (`.github/comment_templates/`)
- Automatic context resolution (env vars, CLI args, git auto-detection)
- Atomic handoff + dispatch operations
- Dry-run mode for testing
- Retry logic with exponential backoff

**Usage:**

```typescript
import { GitHubHandoffProvider } from './github-handoff-provider'
import { ContextResolver } from './context-resolver'
import { postHandoffAndDispatch, AgentDispatcher } from './dispatcher'

// Resolve context
const contextResolver = new ContextResolver()
const context = await contextResolver.resolve()

// Prepare handoff data
const handoffData = {
  agent: 'frontend-engineer',
  workItem: { issueNumber: context.issueNumber, prNumber: context.prNumber },
  status: 'Done',
  scopeCompleted: ['Implemented feature', 'Added tests'],
  keyDecisions: [{ title: 'Decision X', rationale: 'Reason Y' }],
  changesSummary: { filesChanged: 5, linesAdded: 200, linesRemoved: 50, notableFiles: [], commits: [] },
  verification: { commandsRun: ['npm test'], expectedOutcome: ['Pass'], actualOutcome: ['✓'], status: 'Passed' },
  risks: [],
  followUps: [],
  nextAgent: 'backend-engineer',
  nextActions: ['Review', 'Implement backend'],
  links: {},
}

// Post handoff + dispatch (atomic)
const provider = new GitHubHandoffProvider()
const dispatcher = new AgentDispatcher()

await postHandoffAndDispatch(provider, dispatcher, context, handoffData)
```

**Documentation:**
- [GitHub Handoffs Migration Guide](../docs/github-handoffs-migration-guide.md)
- [Comment Templates README](../comment_templates/README.md)

---

### 2. GitHub Work Management

```
framework/
├── routing-optimizer.ts          ← Smart routing (bypass unnecessary agents)
├── github-work-management.ts      ← Issue/branch/commit/PR lifecycle automation
├── workflow-orchestrator-policy.ts← Enforces issue/branch/commit/PR guardrails
├── definition-of-done-gate.ts     ← Definition of Done validation gate
├── workflow-telemetry.ts          ← Task workflow metrics + final summary
├── task-scheduler.ts             ← Parallel task execution
├── monitoring-dashboard.ts       ← Real-time status visualization
├── streaming-logger.ts           ← Live execution logs
├── task-controller.ts            ← Abort/resume capability
├── handoff-v2.ts                 ← Lightweight handoff protocol
├── parallel-quality-gates.ts     ← Concurrent gate validation
├── context-cache.ts              ← Agent context pre-warming
├── express-lanes.ts              ← Fast-track trivial tasks
├── telemetry.ts                  ← Metrics and analytics
├── agent-learning.ts             ← Adaptive pattern recognition
├── lazy-agent-loader.ts          ← Dynamic agent loading
├── cloud-test-env.ts             ← Isolated test environments
├── test-library.ts               ← Synthetic task library
├── hybrid-orchestrator.ts        ← Hybrid orchestration mode skeleton (Phase A)
├── context-hierarchy.ts          ← L1/L2/L3 context composition contract
├── dependency-graph.ts           ← DAG validation + deterministic wave planning
├── wave-scheduler.ts             ← Deterministic schedule plan + replay hash (Phase B)
├── parallel-dispatch-controller.ts ← Concurrency-capped wave dispatch + retry/timeout (Phase B)
└── types.ts                      ← Shared TypeScript types
```

### 3. Hybrid Orchestration (Memory Hierarchy + Parallel Graph)

The framework now includes a comprehensive implementation blueprint for a hybrid orchestration mode combining context tiering (L1/L2/L3) with dependency-aware parallel wave execution.

**Plan Document:**
- [Hybrid Memory Hierarchy + Parallel Graph Plan](./HYBRID-MEMORY-HIERARCHY-PARALLEL-GRAPH-PLAN.md)

**Hybrid Objectives:**
- Reduce token usage with budgeted context composition
- Improve throughput via dependency-safe parallel execution
- Preserve deterministic behavior, quality gates, and full GitHub traceability
- Support gradual rollout and immediate kill-switch rollback to sequential mode

**Phase B Runtime Knobs:**
- `maxParallelAgents` and `maxParallelByPriority` for strict permit limits
- `attemptTimeoutMs`, `maxRetries`, `backoffMs`, `backoffMultiplier` for deterministic retry behavior

### Workflow Enforcement

The framework now enforces a strict GitHub lifecycle:

1. **No work without issue** (except tiny documented hotfixes)
2. **Branch per issue** (`feature/<issue-id>-slug` or `bugfix/<issue-id>-slug`)
3. **Commit checkpoints** by elapsed time or changed-file threshold
4. **PR threshold auto-trigger** when branch divergence exceeds policy
5. **Definition of Done gate** before merge (tests, lint/typecheck, docs, AC, PR quality)
6. **Telemetry summary** for traceability (Issue, Branch, PR, commits, timing metrics)

### Configuration

```
framework-config/
├── routing-rules.yaml            ← Smart routing decision tree
├── quality-gates-parallel.yaml   ← Gate dependency graph
├── agent-tiers.yaml              ← Core vs Specialist agents
├── slo-thresholds.yaml           ← Performance SLO targets
└── telemetry-config.yaml         ← Metrics collection config
```

---

## Development Phases

### Phase 1: Quick Wins (1-2 weeks)

**Goal:** 50% improvement in developer feedback loop

**Deliverables:**

- [ ] Smart routing optimizer
- [ ] Real-time monitoring dashboard
- [ ] Streaming logger
- [ ] Task abort controller

**Expected Impact:**

- 30-40% fewer handoffs
- 80% faster issue detection
- 50% faster perceived wait time

### Phase 2: Core Optimizations (1 month)

**Goal:** 60% faster execution for simple tasks

**Deliverables:**

- [ ] Parallel task scheduler
- [ ] Lightweight handoff protocol v2
- [ ] Parallel quality gates
- [ ] Context cache
- [ ] Express lanes
- [ ] Expanded test library

**Expected Impact:**

- 60-70% faster simple tasks
- 40% less handoff overhead
- 50% faster PR creation
- 90% test coverage confidence

### Phase 3: Strategic Enhancements (2-3 months)

**Goal:** Self-improving, production-grade framework

**Deliverables:**

- [ ] Telemetry system
- [ ] Agent learning engine
- [ ] Agent consolidation (27 → 20)
- [ ] Lazy agent loading
- [ ] Cloud test environments
- [ ] Interactive documentation

**Expected Impact:**

- Data-driven optimization
- 30% monthly improvement (compounding)
- 20-30% complexity reduction
- Zero test pollution

---

## Usage

### CLI Commands

```powershell
# Start monitoring dashboard
npm run framework:monitor

# Run framework audit
npm run framework:audit

# View telemetry
npm run framework:metrics

# Test framework with synthetic tasks
npm run framework:test -- --mode FAST
npm run framework:test -- --mode COMPREHENSIVE

# GitHub workflow operations
powershell -File .github/scripts/github-workflow.ps1 -Action create-issue -Title "feat(framework): title" -Body "details" -Labels "feature,P1,component:framework"
powershell -File .github/scripts/github-workflow.ps1 -Action create-branch -Issue 123 -Type feature -Slug "short-slug"
powershell -File .github/scripts/github-workflow.ps1 -Action create-pr -Issue 123 -Title "feat(framework): title (#123)" -Body "summary" -Head "feature/123-short-slug"
```

### Programmatic API

```typescript
import { RoutingOptimizer } from '.github/framework/routing-optimizer'
import { GithubWorkManagement } from '.github/framework/github-work-management'
import { WorkflowOrchestratorPolicy } from '.github/framework/workflow-orchestrator-policy'
import { DefinitionOfDoneGate } from '.github/framework/definition-of-done-gate'
import { WorkflowTelemetry } from '.github/framework/workflow-telemetry'

// Smart routing
const route = RoutingOptimizer.determineRoute(task)

// Enforce workflow policy
const policy = new WorkflowOrchestratorPolicy()
const decision = policy.evaluate(snapshot)

// Operate issue/PR lifecycle
const workManager = new GithubWorkManagement()

// Validate Definition of Done and summarize telemetry
const dodResult = DefinitionOfDoneGate.evaluate(dodInput)
const telemetry = new WorkflowTelemetry()
const summary = telemetry.buildFinalSummary(task.id)
```

---

## Metrics & SLOs

### Performance Targets

| Metric                        | Baseline | Phase 1 | Phase 2 | Phase 3 |
| ----------------------------- | -------- | ------- | ------- | ------- |
| Simple task duration          | 50 min   | 25 min  | 10 min  | 5 min   |
| Dispatch chain length         | 5-6      | 4-5     | 3-4     | 3       |
| Quality gate PR creation time | 10 min   | 8 min   | 5 min   | 5 min   |
| Feedback loop start time      | 5 min    | 2 min   | 30 sec  | 10 sec  |

### Quality Metrics

| Metric        | Baseline | Phase 1 | Phase 2 | Phase 3  |
| ------------- | -------- | ------- | ------- | -------- |
| Test coverage | 4 tasks  | 10      | 30      | 50+      |
| Agent count   | 27       | 27      | 27      | 20       |
| Observability | Manual   | Live    | Auto    | Adaptive |

---

## Contributing

All framework changes must:

1. Include tests (unit + integration)
2. Update relevant documentation
3. Pass quality gates (G1-G10)
4. Include telemetry instrumentation
5. Maintain backward compatibility (or provide migration)

---

## Architecture Decision Records

See [../DECISIONS.md](../DECISIONS.md) for framework ADRs:

- ADR-FW001: Smart routing bypass logic
- ADR-FW002: Handoff protocol v2 format
- ADR-FW003: Quality gate parallelization
- ADR-FW004: Agent consolidation strategy
- ADR-FW005: Telemetry data model

---

## References

- [Epic #25](https://github.com/Coding-Krakken/FunkyTown/issues/25) — Full implementation plan
- [AGENTS.md](../AGENTS.md) — Current agent roster
- [QUALITY-GATES.md](../QUALITY-GATES.md) — Quality gate definitions
- [AI_MODEL_ASSIGNMENT.md](../AI_MODEL_ASSIGNMENT.md) — Model routing
