# Self-Hosted Runner Migration Guide

## Overview

The Custom-Coding-Creations organization now has two enterprise-wide self-hosted runners available to all repositories. This guide explains the setup and provides instructions for updating CI/CD workflows to leverage them.

## What Was Done

### Runners Deployed

Two self-hosted runners are now operational at the organization level:

1. **archlinux-runner1** (Heavy Build Lane)
   - Labels: `self-hosted,Linux,X64,arch,runner1,heavy`
   - Purpose: CPU/memory-intensive jobs (builds, Docker operations, compilation)
   - Concurrency: Serialized (one heavy job at a time per runner to avoid contention)

2. **archlinux-runner2** (Light Job Lane)
   - Labels: `self-hosted,Linux,X64,arch,runner2,light`
   - Purpose: Quick jobs (lint, unit tests, validation, automation)
   - Concurrency: Can parallelize multiple light jobs

### Why Self-Hosted Runners?

- **Machine Specs**: 8 vCPU (4C/8T), 15GB RAM, SSD storage
- **Analysis Result**: Capacity supports 2 concurrent runners safely
- **Expected Gains**: 
  - Throughput improvement: 1.5x–1.9x for parallel workflows
  - Queue time reduction: 40–70% when jobs are queued
  - Single-job latency: Unchanged (still depends on workload)

### Guardrails in Place

- Load average monitoring (alert if > 8)
- IO wait tracking (prevent bottlenecks)
- Memory pressure oversight (2.2GB swap already in use)
- Docker hygiene (periodic cleanup of dangling images/volumes)

---

## How to Update Your Repository Workflows

### Pattern 1: Heavy Build Job (CI Pipeline)

Route your main build/test workflow to `runner1` with concurrency controls:

```yaml
name: CI

on:
  push:
    branches: [main, 'premerge/**']
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref || github.event.pull_request.number || github.run_id }}
  cancel-in-progress: true

jobs:
  test:
    # Route heavy CI to runner1
    runs-on: [self-hosted, Linux, X64, arch, runner1, heavy]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run linter
        run: pnpm lint
      
      - name: Run tests
        run: pnpm test
      
      - name: Build application
        run: pnpm build
```

### Pattern 2: Light Automation Jobs (Squad Workflows, Triage, Labels)

Route lightweight workflows to `runner2`:

```yaml
name: Squad Triage

on:
  issues:
    types: [labeled]

concurrency:
  group: ${{ github.workflow }}-${{ github.event.issue.number || github.run_id }}
  cancel-in-progress: true

permissions:
  issues: write
  contents: read

jobs:
  triage:
    if: github.event.label.name == 'squad'
    # Route light jobs to runner2
    runs-on: [self-hosted, Linux, X64, arch, runner2, light]
    
    steps:
      - uses: actions/checkout@v4
      - name: Triage issue via Lead agent
        uses: actions/github-script@v7
        with:
          script: |
            # Your triage logic here
```

### Pattern 3: Job-Level Concurrency (Prevent Duplicate Deploys)

For deployment or release workflows, serialize heavy operations:

```yaml
jobs:
  deploy:
    runs-on: [self-hosted, Linux, X64, arch, runner1, heavy]
    
    concurrency:
      group: deployment-${{ github.ref }}
      cancel-in-progress: false  # Don't cancel active deployments
    
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to production
        run: ./scripts/deploy.sh
```

---

## Decision Tree: Which Runner to Use?

```
Is this a heavy workload?
├─ YES: Docker builds, compilations, large test suites
│       └─ Use: runner1 (heavy lane)
│
└─ NO: Lint, quick tests, validations, automation (< 2min)
       └─ Use: runner2 (light lane)
```

---

## Migration Steps for Your Repository

1. **Review your workflows** (`.github/workflows/*.yml`)
2. **Identify heavy jobs**:
   - Docker `build`, `buildx`
   - Large `pnpm install`, `npm install`
   - Long-running test suites
   - Build/compilation steps
3. **Identify light jobs**:
   - Linting, formatting checks
   - Type checking
   - Label sync, issue triage
   - Automation scripts (< 2 min)
4. **Apply routing**:
   - Heavy jobs: `runs-on: [self-hosted, Linux, X64, arch, runner1, heavy]`
   - Light jobs: `runs-on: [self-hosted, Linux, X64, arch, runner2, light]`
5. **Add concurrency controls**:
   - Top-level for overall workflow cancellation
   - Job-level for critical paths (deployments)
6. **Test**: Push to a feature branch and verify workflow triggers

---

## Example: Full Migration for Next.js + Playwright App

```yaml
name: Full CI/CD

on:
  push:
    branches: [main, 'premerge/**']
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref || github.event.pull_request.number || github.run_id }}
  cancel-in-progress: true

jobs:
  # Light jobs: lint, type check
  quality:
    runs-on: [self-hosted, Linux, X64, arch, runner2, light]
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm typecheck

  # Heavy jobs: build + test
  test:
    needs: quality  # Only run if linting passes
    runs-on: [self-hosted, Linux, X64, arch, runner1, heavy]
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test
      - run: pnpm build

  # Heavy jobs: e2e tests (Playwright)
  e2e:
    needs: test
    runs-on: [self-hosted, Linux, X64, arch, runner1, heavy]
    timeout-minutes: 45
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm install --dir ./tests
      - run: pnpm exec playwright install --with-deps
      - run: pnpm test:e2e
```

---

## Copilot Instructions for Workflow Updates

### Prompt for Copilot

> I have two self-hosted runners available in my organization:
> - **runner1** (heavy): For CPU/memory-intensive jobs (builds, Docker, tests)
> - **runner2** (light): For quick automation (lint, type checks, triage)
>
> Please update my `.github/workflows/*.yml` files to:
> 1. Route heavy CI jobs (build, test, Docker) to runner1
> 2. Route light jobs (lint, typecheck, automation) to runner2
> 3. Add top-level `concurrency` controls to cancel redundant runs
> 4. Add job-level concurrency for critical paths (deployments)
>
> Heavy jobs run-on: `[self-hosted, Linux, X64, arch, runner1, heavy]`
> Light jobs run-on: `[self-hosted, Linux, X64, arch, runner2, light]`
> Concurrency group: `${{ github.workflow }}-${{ github.ref || github.event.pull_request.number || github.run_id }}`

---

## Monitoring & Troubleshooting

### Check Runner Status

```bash
gh api orgs/Custom-Coding-Creations/actions/runners \
  --jq '.runners[] | {name, status, busy, labels}'
```

### Monitor Load

```bash
# On runner host
watch -n 2 'load average: `uptime | awk -F"load average: " "{print $2}"` | iostat -z 1 2'
```

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Jobs queued, runners idle | Job label mismatch | Verify `runs-on` matches runner labels exactly |
| Slow Docker builds | Runner out of disk | Run `docker system prune -a` on runner host |
| Memory pressure | Too many concurrent jobs | Reduce concurrent job count or add guardrails |
| Workflow timeout | Heavy job underestimated | Increase timeout or split into smaller jobs |

---

## Best Practices

1. **Label jobs correctly**: Use exact label matching in `runs-on`
2. **Set timeouts**: Prevent runaway jobs (`timeout-minutes: XX`)
3. **Parallelize light jobs**: Multiple lint/type-check jobs can run on runner2 simultaneously
4. **Serialize heavy jobs**: Limit Docker builds / compilation to one per runner
5. **Monitor thresholds**:
   - Load average: < 8 (on 8-core machine)
   - Memory: Keep swap usage minimal
   - Disk: Maintain > 20GB free space

---

## Questions?

Refer to the machine capacity analysis (`host-diagnostics.log` if available) or contact DevOps.
