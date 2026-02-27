## Phase C — Memory Policy Integration (Week 3)

**Program:** Hybrid Orchestration (Memory Hierarchy + Parallel Graph)  
**Parent PR:** #5  
**Priority:** P0  
**Owner Agent:** `backend-engineer`  
**Due Date:** 2026-03-19

### Scope
- Integrate budget-aware context composition.
- Add trimming policy (hard cap, priority pruning, critical pinning).
- Implement selective L2/L3 retrieval and provenance rendering.

### Acceptance Criteria
- [ ] Token budget remains under hard cap per dispatch.
- [ ] Prompt includes provenance for L1/L2/L3.
- [ ] Cache miss fallback is deterministic and logged.
- [ ] Long-chain synthetic tests show no context blowup.

### Guardrails
- No secret/PII leakage in context composition.
- No full-repo context blast by default.
- Preserve deterministic behavior under retries.

### Evidence Required
- Token budget test outputs
- Provenance sample dispatches
- Long-chain synthetic run evidence

### Dependency
- Starts after Phase B complete.
- Blocks Phase D.
