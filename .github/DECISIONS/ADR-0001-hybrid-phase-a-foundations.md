# ADR-0001: Hybrid Orchestration Phase A Foundations

- Status: Accepted
- Date: 2026-02-26
- Owners: solution-architect
- Issue: #6
- Related PR: #5

## Context

The framework requires a hybrid orchestration foundation that combines memory hierarchy (L1/L2/L3) and dependency-graph planning while preserving deterministic behavior, model-first governance, and sequential rollback safety.

Phase A scope is contract-first and foundational. It must validate core assumptions before introducing parallel dispatch runtime complexity.

## Decision

1. Use a contract-first `HybridOrchestrator` that returns structured outputs and preserves explicit sequential fallback.
2. Define three independent feature flags:
   - `hybridOrchestrationEnabled`
   - `parallelGraphEnabled`
   - `memoryHierarchyEnabled`
3. Require graph validation with explicit cycle path reporting before wave planning.
4. Require budget-aware context composition where each L1/L2/L3 slice includes token estimates.
5. Apply sanitization to L2/L3 content before emission into composed context.

## Rationale

- Independent flags support safe rollout and isolated kill switches.
- Deterministic sorting and cycle-path diagnostics reduce debugging ambiguity and improve replayability.
- Token-aware context contracts allow future budget enforcement without breaking interfaces.
- Sanitization at the context boundary prevents leaking sensitive text into downstream prompts and logs.

## Alternatives Considered

1. Single global feature flag only.
   - Rejected because it prevents subsystem-specific isolation and staged rollout.
2. Graph validation without cycle path output.
   - Rejected because remediation quality drops and incident triage slows.
3. Context hierarchy without token estimates.
   - Rejected because budget compliance cannot be verified or enforced deterministically.

## Consequences

### Positive

- Enables Phase B implementation planning with stable, typed interfaces.
- Preserves rollback safety via sequential fallback.
- Supports acceptance-criteria testing for cycle detection, context slices, and flag gating.

### Negative

- Adds contract surface area that future phases must maintain.
- Regex-based sanitization is conservative and may over-redact some text.

## Verification Evidence

- `npm run typecheck`
- `npm run build`
- `npm test -- dependency-graph.test.ts`
- `npm test -- context-hierarchy.test.ts`
- `npm test -- hybrid-orchestrator.test.ts`

## Follow-up

Phase B must implement:

- Wave scheduler and parallel dispatch controller from these contracts.
- Structured telemetry events for wave lifecycle and token economics.
- Retry/timeout/circuit-breaker policy integration.
