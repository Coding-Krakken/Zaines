# Slice Planning

> **Category:** Planning
> **File:** `planning/slice-planning.prompt.md`

---

## Purpose

Break a feature or epic into vertical slices — independently deployable, testable increments that deliver user-visible value.

## When to Use

- When Product Owner has defined acceptance criteria
- When Tech Lead is planning implementation
- When Program Manager is creating delivery plan

## Inputs Required

- User stories with acceptance criteria
- Business Owner Source Profile (`.github/.system-state/model/business_owner_profile.zaine.yaml`)
- Domain model
- Component architecture
- API contracts
- Dependencies between features

## Outputs Required

A prioritized list of vertical slices:

```markdown
## Slice 1: [Name] (Priority: P1, Complexity: 3)

### Description

One-sentence description of what this slice delivers.

### User Value

What the user can do after this slice ships.

### Scope

- [ ] Component: ProductCard
- [ ] API: GET /api/products
- [ ] Type: Product interface
- [ ] Test: ProductCard.test.tsx
- [ ] Test: products/route.test.ts

### Acceptance Criteria

- Given X, When Y, Then Z

### Dependencies

- None (or: depends on Slice N)

### Agent Assignment

- Frontend: frontend-engineer
- Backend: backend-engineer

### Business Alignment

- Tags: [BRAND|TRUST|SAFETY|PRICING|BOOKING]
```

## Quality Expectations

- Each slice delivers user-visible value
- Each slice is independently testable
- Each slice is independently deployable
- Slices are ordered by dependency, then priority
- Complexity points are realistic
- Every slice maps to at least one business intent tag

## Failure Cases

- Slice too large (>3 days) → Break into smaller slices
- Slice has no user value → Combine with another slice
- Circular dependencies between slices → Re-sequence

## Evidence Expectations

- Slice definitions with scope
- Dependency graph
- Complexity estimates
- Agent assignments
- Business alignment mapping by slice
