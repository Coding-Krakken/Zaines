# Handoff: Hybrid Orchestration Phase B Slice Plan (Parallel Execution Engine)

**From:** tech-lead
**To:** backend-engineer
**Date:** 2026-02-26
**GitHub Issue:** #6
**Parent PR:** #5
**Dispatch URL:** https://github.com/Coding-Krakken/.subzero/pull/5#issuecomment-3970593115
**Dispatch Chain:** [00-chief-of-staff] → [solution-architect] → [tech-lead] → [backend-engineer]
**Dispatch Depth:** 3/10
**Branch:** feat/hybrid-memory-hierarchy-parallel-graph

---

## Original Request
Create implementation slice plan for Phase B (Parallel Execution Engine) using Phase A contracts as baseline.

## Context Baseline (Phase A Complete)
- Contracts available and tested:
  - `.github/framework/hybrid-orchestrator.ts`
  - `.github/framework/context-hierarchy.ts`
  - `.github/framework/dependency-graph.ts`
  - `.github/framework/types.ts` (hybrid foundational types)
- Existing quality gate and telemetry modules to integrate with:
  - `.github/framework/parallel-quality-gates.ts`
  - `.github/framework/workflow-telemetry.ts`
- Sequential fallback + G1-G10 guardrails are non-negotiable.

---

## Phase B Vertical Slice Plan (1:1 with PR #5 Acceptance Criteria)

### Slice B1 — Deterministic Wave Planning + Dependency-Correct Readiness
**Primary modules:** `wave-scheduler.ts`, `dependency-graph.ts` integration

**Goal:** Independent nodes run together; dependent nodes never run early.

**Implementation scope:**
1. Add `WaveScheduler.createPlan(graph)`:
   - Input: validated DAG nodes from `DependencyGraphBuilder`.
   - Output: immutable schedule plan containing ordered waves.
2. Readiness rule:
   - A node is schedulable only when **all** predecessor node statuses are `completed`.
3. Deterministic ordering:
   - Deterministic wave index from topological depth.
   - Stable in-wave order by `(priorityRank ASC, nodeId ASC)`.
4. Planning artifact:
   - Emit `schedulePlanHash` based on canonical JSON serialization for replay checks.

**Maps to PR #5 AC:**
- ✅ Independent nodes run in parallel; dependent nodes wait correctly.

---

### Slice B2 — Concurrency-Capped Parallel Dispatch Controller
**Primary modules:** `parallel-dispatch-controller.ts`, `hybrid-orchestrator.ts` wiring

**Goal:** Strictly enforce global + per-priority concurrency limits.

**Implementation scope:**
1. Add `ParallelDispatchController.executeWave(wave, state, limits)`:
   - Uses explicit permit accounting (no implicit Promise fan-out).
2. Concurrency policy:
   - Global cap: `MAX_PARALLEL_AGENTS` (default `4`).
   - Per-priority caps (defaults):
     - `P0: 4`
     - `P1: 3`
     - `P2: 2`
     - `P3: 1`
   - Effective slot count for a node = `min(globalAvailable, priorityAvailable)`.
3. Enforcement invariant:
   - At all times: `runningTotal <= MAX_PARALLEL_AGENTS`.
   - For each priority `p`: `runningByPriority[p] <= MAX_PARALLEL_BY_PRIORITY[p]`.
4. Backpressure behavior:
   - Extra ready nodes remain queued in deterministic order until permits free.

**Maps to PR #5 AC:**
- ✅ Max concurrency is strictly enforced.

---

### Slice B3 — Deterministic Timeout + Retry Semantics
**Primary modules:** `parallel-dispatch-controller.ts`, policy contract in `types.ts`

**Goal:** Timeout/retry behavior is deterministic, bounded, and replayable.

**Implementation scope:**
1. Introduce `DispatchPolicy` config contract:
   - `attemptTimeoutMs` (default `120000`)
   - `maxRetries` (default `2`)
   - `backoffMs` (default `2000`)
   - `backoffMultiplier` (default `2`)
2. Deterministic retry schedule:
   - Delay formula: `backoffMs * backoffMultiplier^(attempt-1)`.
   - No random jitter in Phase B.
3. Failure semantics:
   - Node status lifecycle: `queued -> running -> succeeded | failed | timed_out`.
   - `timed_out` is terminal for that attempt; retry consumes next attempt slot.
   - After final attempt failure/timeout, node is terminal failed.
4. Wave-level failure policy:
   - Default Phase B policy: **fail-fast for future waves**.
   - In-flight siblings in current wave are allowed to complete; results are collected deterministically.

**Maps to PR #5 AC:**
- ✅ Timeout + retry behavior follows configured policy.

---

### Slice B4 — Structured Dispatch Lifecycle Events
**Primary modules:** `workflow-telemetry.ts` extension + controller emit points

**Goal:** Every node attempt emits start/success/failure/timeout telemetry with stable schema.

**Implementation scope:**
1. Add structured hybrid dispatch events:
   - `hybrid.dispatch.start`
   - `hybrid.dispatch.success`
   - `hybrid.dispatch.failure`
   - `hybrid.dispatch.timeout`
2. Required metadata fields:
   - `taskId`, `nodeId`, `waveIndex`, `attempt`, `agentId`, `priority`, `schedulePlanHash`, `durationMs`.
3. Event ordering invariant:
   - Exactly one terminal event (`success|failure|timeout`) per attempt after `start`.
4. Summary rollup:
   - Aggregate per-run counters for `started/succeeded/failed/timedOut/retried`.

**Maps to PR #5 AC:**
- ✅ Dispatcher emits structured events for start/success/failure/timeout.

---

## Determinism Evidence Strategy (Required)

### Replay Suite
- Run same DAG + same config + same simulated outcomes `N=100` times.
- Assert identical:
  - wave composition
  - node dispatch order
  - retry attempt order
  - terminal statuses
  - `schedulePlanHash`

### Snapshot Suite
- Snapshot artifact for each scenario:
  - `waves[]`
  - `dispatchSequence[]`
  - `attemptTimeline[]`
  - `eventEnvelope[]` (event + required metadata keys)
- Snapshot updates require explicit review sign-off.

### Canonical Test Scenarios
1. Diamond DAG: `A -> {B,C} -> D`
2. Multi-wave with mixed priorities and capped slots
3. Timeout with retry success on last attempt
4. Timeout/failure exhaustion leading to fail-fast halt
5. Recovery from queued backlog under cap pressure

---

## Concurrency Cap + Failure Policy (Explicit)

### Invariants (Must Hold)
1. No node starts if any dependency is non-terminal or failed.
2. No node starts without available global and priority permits.
3. No node gets more than `maxRetries + 1` total attempts.
4. No downstream wave starts after terminal blocking failure in prior wave.
5. Deterministic ordering remains stable under retries and partial failures.

### Failure Semantics Matrix
- **Dependency failure:** dependent nodes marked `blocked` and never dispatched.
- **Attempt timeout:** emit `hybrid.dispatch.timeout`; retry if attempts remain.
- **Attempt failure (non-timeout):** emit `hybrid.dispatch.failure`; retry if attempts remain.
- **Final terminal failure:** stop scheduling future waves; produce deterministic run summary.
- **Controller-level exception:** emit fatal orchestration error and return partial run evidence.

---

## Integration Plan (Quality Gates + Telemetry Contracts)

### Quality Gates Integration
1. Add targeted unit tests for `wave-scheduler.ts` and `parallel-dispatch-controller.ts`.
2. Extend integration tests in `hybrid-orchestrator.test.ts` for Phase B wiring.
3. Ensure no bypass of existing `ParallelQualityGates` chain (`G1`-`G10` semantics unchanged).
4. Add deterministic replay/snapshot tests to protect against ordering regressions.

### Telemetry Contract Integration
1. Extend telemetry event typing in `types.ts` (hybrid dispatch event schema).
2. Add emit helpers in `workflow-telemetry.ts` for structured lifecycle events.
3. Ensure per-run metrics can be surfaced in existing workflow summaries without schema breakage.
4. Validate required event metadata fields in tests.

---

## Execution Sequence (Recommended)
1. Land `wave-scheduler.ts` + deterministic schedule tests.
2. Land `parallel-dispatch-controller.ts` with strict permit accounting.
3. Land retry/timeout policy wiring and deterministic failure semantics tests.
4. Land telemetry event schema + emitter integration.
5. Land hybrid orchestrator integration tests and replay/snapshot evidence.

---

## Deliverables for Backend Engineer
1. Implement `wave-scheduler.ts` with deterministic schedule output and invariants.
2. Implement `parallel-dispatch-controller.ts` with strict global/per-priority caps.
3. Add timeout/retry policy contract + deterministic backoff behavior.
4. Extend telemetry contracts for structured dispatch lifecycle events.
5. Add/extend tests providing replay + snapshot determinism evidence.

## Acceptance Criteria (Ready-to-Verify)
- [x] Independent nodes run in parallel; dependent nodes wait correctly.
- [x] Max concurrency is strictly enforced.
- [x] Timeout + retry behavior follows configured policy.
- [x] Dispatcher emits structured events for start/success/failure/timeout.
- [x] Determinism evidence captured via replay and snapshot tests.
- [x] No drift from `HYBRID-MEMORY-HIERARCHY-PARALLEL-GRAPH-PLAN.md`.

## Execution Evidence (2026-02-26)

Commands run from `.github/framework`:

1. `npm run typecheck` ✅
2. `npm test -- __tests__/wave-scheduler.test.ts __tests__/parallel-dispatch-controller.test.ts __tests__/parallel-dispatch-retry-timeout.test.ts __tests__/parallel-dispatch-events.test.ts --runInBand --no-cache --forceExit` ✅
3. `npx eslint wave-scheduler.ts parallel-dispatch-controller.ts types.ts --ext .ts -f compact` ✅

Notes:
- Jest required `--forceExit` because timeout-simulation tests intentionally leave unresolved async handles.
- ESLint completed with zero file warnings/errors; only the known TypeScript version support notice was emitted by `@typescript-eslint`.

## Reference Files
- `.github/framework/HYBRID-MEMORY-HIERARCHY-PARALLEL-GRAPH-PLAN.md`
- `.github/framework/HYBRID-PHASE-A-FOUNDATIONS.md`
- `.github/framework/hybrid-orchestrator.ts`
- `.github/framework/dependency-graph.ts`
- `.github/framework/parallel-quality-gates.ts`
- `.github/framework/workflow-telemetry.ts`
- `.github/framework/types.ts`

## Next Agent
Hand off to: `qa-test-engineer` after backend implementation + evidence is complete.
