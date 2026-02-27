# Handoff: Phase B Parallel Execution Engine (Issue #6)

**HANDOFF FROM:** tech-lead  
**TO:** backend-engineer  
**DATE:** 2026-02-26  
**GITHUB ISSUE:** #6  
**DISPATCH CHAIN:** [00-chief-of-staff] → [solution-architect] → [tech-lead] → [backend-engineer]  
**DISPATCH DEPTH:** 3/10  
**FEATURE BRANCH:** feat/hybrid-memory-hierarchy-parallel-graph

---

## Architecture Reference

- `.github/framework/HYBRID-MEMORY-HIERARCHY-PARALLEL-GRAPH-PLAN.md` (Phase B contract)
- `.github/issue-bodies/hybrid-phase-b.md` (Phase B acceptance criteria)
- `.github/framework/HYBRID-PHASE-B-PARALLEL-EXECUTION-PLAN.md` (execution slices + semantics)
- Existing Phase A baseline:
  - `.github/framework/hybrid-orchestrator.ts`
  - `.github/framework/context-hierarchy.ts`
  - `.github/framework/dependency-graph.ts`

---

## Your Slice Assignment

Implement **all Phase B slices** in strict order:

1. **S1:** deterministic `wave-scheduler.ts`
2. **S2:** `parallel-dispatch-controller.ts` with strict global/per-priority caps
3. **S3:** timeout/retry policy semantics (deterministic, no jitter)
4. **S4:** structured dispatch lifecycle events (`start/success/failure/timeout`)

No Phase C/D/E functionality in this handoff.

---

## Files to Create/Modify

### Create
- `.github/framework/wave-scheduler.ts`
- `.github/framework/parallel-dispatch-controller.ts`
- `.github/framework/__tests__/wave-scheduler.test.ts`
- `.github/framework/__tests__/parallel-dispatch-controller.test.ts`
- `.github/framework/__tests__/parallel-dispatch-retry-timeout.test.ts`
- `.github/framework/__tests__/parallel-dispatch-events.test.ts`

### Modify
- `.github/framework/types.ts` (Phase B contracts only)
- `.github/framework/hybrid-orchestrator.ts` (integration wiring only)
- `.github/framework/README.md` (Phase B module notes + knobs)

---

## Implementation Requirements

- Preserve canonical patterns already used in framework modules.
- Keep deterministic ordering rule: wave index → priority (`P0>P1>P2>P3`) → node id.
- Enforce concurrency caps strictly with admission control.
- Implement explicit failure semantics:
  - terminal node states include `succeeded`, `failed`, `timed_out`, `exhausted`, `blocked`
  - descendants of terminal-failed predecessors become `blocked`
- Retry/timeout semantics must be policy-driven and deterministic:
  - `maxAttempts`, `attemptTimeoutMs`, `retryBackoffMs`, `retryJitter='none'`
- Emit structured lifecycle events with deterministic logical sequence (`seq`).
- Maintain sequential fallback behavior and existing feature-flag controls.
- File length max 300 lines; split helper modules if needed.

---

## Acceptance Criteria (must map 1:1)

- [ ] Independent nodes run in parallel; dependent nodes wait correctly.
- [ ] Max concurrency is strictly enforced.
- [ ] Timeout + retry behavior follows configured policy.
- [ ] Dispatcher emits structured events for start/success/failure/timeout.

---

## Deterministic Replay Evidence Required

Provide evidence artifacts from tests/log snapshots showing:

1. Same graph/config => identical schedule output.
2. Same failure injection => identical event order by deterministic `seq`.
3. Retry attempt counts and delay schedule match policy exactly.

---

## Quality Gates (required before return handoff)

Run from `.github/framework`:

```bash
npx jest __tests__/wave-scheduler.test.ts __tests__/parallel-dispatch-controller.test.ts __tests__/parallel-dispatch-retry-timeout.test.ts __tests__/parallel-dispatch-events.test.ts --runInBand
npm run typecheck
npm run build
npx eslint wave-scheduler.ts parallel-dispatch-controller.ts types.ts hybrid-orchestrator.ts --ext .ts
```

If repository-wide lint fails due baseline debt, provide focused lint pass evidence for touched files.

---

## Return Handoff Requirements

Return to `tech-lead` with:

- file list and scoped diff summary
- acceptance criteria checklist with direct evidence mapping
- deterministic replay evidence summary
- any residual risks/blockers
