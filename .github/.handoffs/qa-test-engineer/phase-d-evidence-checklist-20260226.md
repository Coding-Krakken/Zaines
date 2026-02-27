# Phase D Evidence Checklist - Reliability and Recovery

**Owner:** qa-test-engineer  
**Issue:** #9  
**PR:** #5  
**Branch:** feat/hybrid-memory-hierarchy-parallel-graph  
**Status:** Dependency-gated on Phase C completion evidence

---

## Gate Condition (Must Be Met Before Phase D Execution)

- [ ] Phase C completion evidence is posted and verified in PR #5 thread.
- [ ] Gate reference confirmation is linked from Issue #9.
- [ ] Working branch is up to date with latest Phase C changes.

---

## Acceptance Criteria to Evidence Mapping

### AC1: Checkpoint restart has no duplicate side effects
- [ ] Fault-injection test simulates restart from checkpoint boundary.
- [ ] Verification shows idempotent side effects (no duplicate writes/emits).
- [ ] Test log includes checkpoint ID, replay count, and side-effect counters.

### AC2: Failed-node replay is idempotent across siblings
- [ ] Parallel sibling execution scenario with one failed node is exercised.
- [ ] Replay run confirms no duplicate sibling side effects.
- [ ] Evidence includes before/after state snapshots and replay correlation IDs.

### AC3: Circuit breaker threshold behavior validated
- [ ] Threshold crossing test demonstrates open transition at configured failure limit.
- [ ] Recovery test demonstrates half-open/open-close behavior per contract.
- [ ] Evidence includes threshold config values, error counts, and transition timestamps.

### AC4: Post-mortem payload has root cause + remediation hints
- [ ] Failure scenario emits post-mortem payload.
- [ ] Payload includes explicit root cause classification.
- [ ] Payload includes remediation hints actionable by operations/support.

---

## Required Evidence Artifacts

- [ ] Test execution logs (unit/integration/e2e as applicable).
- [ ] Fault-injection scenario descriptions and outcomes.
- [ ] Coverage delta report for reliability/recovery paths.
- [ ] Acceptance criteria matrix linking test IDs to AC1-AC4.

---

## Exit Criteria for Phase D Handoff to DevOps

- [ ] All AC checks marked complete with linked evidence.
- [ ] No `.only` or `.skip` tests without linked issue and rationale.
- [ ] Reliability/recovery suite passes on branch with reproducible command output.
- [ ] Security coordination checkpoint completed with `security-engineer`.
