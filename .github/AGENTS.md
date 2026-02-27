# Engineering Organization Roster

> **Version:** 1.0.0 | **Updated:** 2026-02-25
> **Classification:** Enterprise Autonomous Engineering Organization

---

## Organization Chart

```
                        ┌──────────────────────┐
                        │   00 CHIEF OF STAFF   │  ← SINGLE ENTRY POINT
                        │    (Router/Planner)    │
                        └──────────┬───────────┘
               ┌───────────────────┼───────────────────┐
               ▼                   ▼                   ▼
    ┌──────────────────┐ ┌─────────────────┐ ┌──────────────────┐
    │  PRODUCT OWNER   │ │ PROGRAM MANAGER │ │   STAKEHOLDER    │
    │  (Requirements)  │ │  (Coordination) │ │   EXECUTIVE      │
    └────────┬─────────┘ └────────┬────────┘ └──────────────────┘
             │                    │
             ▼                    ▼
    ┌──────────────────┐ ┌─────────────────────┐
    │    SOLUTION       │ │     TECH LEAD       │
    │    ARCHITECT      │ │  (Impl. Strategy)   │
    └────────┬─────────┘ └────────┬────────────┘
             │         ┌──────────┼──────────────────┐
             ▼         ▼          ▼                  ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
    │ FRONTEND │ │ BACKEND  │ │ PLATFORM │ │  DATA / ML   │
    │ ENGINEER │ │ ENGINEER │ │ ENGINEER │ │  ENGINEER    │
    └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘
         │            │            │               │
         ▼            ▼            ▼               ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
    │    UX    │ │ A11Y     │ │  DEVOPS  │ │    SRE       │
    │ DESIGNER │ │ SPEC.    │ │ ENGINEER │ │  ENGINEER    │
    └──────────┘ └──────────┘ └──────────┘ └──────────────┘
         │            │            │               │
         └────────────┴─────┬──────┴───────────────┘
                            ▼
              ┌───────────────────────────┐
              │     QA / TEST ENGINEER    │
              │   PERFORMANCE ENGINEER    │
              │   SECURITY ENGINEER       │
              │   PRIVACY OFFICER         │
              └────────────┬──────────────┘
                           ▼
              ┌───────────────────────────┐
              │   DOCUMENTATION ENGINEER  │
              │   SUPPORT READINESS ENG.  │
              └────────────┬──────────────┘
                           ▼
              ┌───────────────────────────┐
              │   ENTERPRISE EXTENSIONS   │
              │   Legal · Finance · L10n  │
              │   Incident Cmd · Red Team │
              └────────────┬──────────────┘
                           ▼
              ┌───────────────────────────┐
              │   99 QUALITY DIRECTOR     │  ← FINAL AUTHORITY
              │   (Gate Keeper / Stop)    │  ← ONLY agent that can end chain
              └───────────────────────────┘
```

---

## Agent Roster

| #   | Agent ID                     | Role                       | Domain                                          | Agent File                                   |
| --- | ---------------------------- | -------------------------- | ----------------------------------------------- | -------------------------------------------- |
| 00  | `00-chief-of-staff`          | Chief of Staff             | Routing, Planning, Escalation                   | `agents/00-chief-of-staff.agent.md`          |
| 01  | `product-owner`              | Product Owner              | Requirements, User Stories, Acceptance Criteria | `agents/product-owner.agent.md`              |
| 02  | `program-manager`            | Program Manager            | Coordination, Timelines, Dependencies           | `agents/program-manager.agent.md`            |
| 03  | `stakeholder-executive`      | Stakeholder Executive      | Business Strategy, Budget, Priorities           | `agents/stakeholder-executive.agent.md`      |
| 10  | `solution-architect`         | Solution Architect         | System Design, ADRs, Domain Models              | `agents/solution-architect.agent.md`         |
| 11  | `tech-lead`                  | Tech Lead                  | Implementation Strategy, Code Standards         | `agents/tech-lead.agent.md`                  |
| 20  | `frontend-engineer`          | Frontend Engineer          | UI Components, Pages, Client State              | `agents/frontend-engineer.agent.md`          |
| 21  | `backend-engineer`           | Backend Engineer           | API Routes, Server Logic, Integrations          | `agents/backend-engineer.agent.md`           |
| 22  | `platform-engineer`          | Platform Engineer          | Infrastructure, CI/CD, Deployment               | `agents/platform-engineer.agent.md`          |
| 23  | `data-engineer`              | Data Engineer              | Data Pipelines, Schemas, Migrations             | `agents/data-engineer.agent.md`              |
| 24  | `ml-engineer`                | ML Engineer                | ML Models, Recommendations, Analytics           | `agents/ml-engineer.agent.md`                |
| 30  | `ux-designer`                | UX Designer                | User Flows, Wireframes, Design Systems          | `agents/ux-designer.agent.md`                |
| 31  | `accessibility-specialist`   | Accessibility Specialist   | WCAG, ARIA, Screen Readers                      | `agents/accessibility-specialist.agent.md`   |
| 40  | `qa-test-engineer`           | QA/Test Engineer           | Test Strategy, Coverage, Automation             | `agents/qa-test-engineer.agent.md`           |
| 41  | `performance-engineer`       | Performance Engineer       | Perf Budgets, Profiling, Optimization           | `agents/performance-engineer.agent.md`       |
| 50  | `security-engineer`          | Security Engineer          | Threat Models, Pen Testing, Hardening           | `agents/security-engineer.agent.md`          |
| 51  | `privacy-compliance-officer` | Privacy Compliance Officer | GDPR, PII, Data Protection                      | `agents/privacy-compliance-officer.agent.md` |
| 60  | `devops-engineer`            | DevOps Engineer            | CI/CD, IaC, Monitoring                          | `agents/devops-engineer.agent.md`            |
| 61  | `sre-engineer`               | SRE Engineer               | Reliability, SLOs, Incident Response            | `agents/sre-engineer.agent.md`               |
| 70  | `documentation-engineer`     | Documentation Engineer     | Docs, API Refs, Guides                          | `agents/documentation-engineer.agent.md`     |
| 71  | `support-readiness-engineer` | Support Readiness Engineer | Runbooks, FAQ, Triage Guides                    | `agents/support-readiness-engineer.agent.md` |
| 80  | `legal-counsel`              | Legal Counsel              | Licensing, Compliance, Terms                    | `agents/legal-counsel.agent.md`              |
| 81  | `finance-procurement`        | Finance & Procurement      | Cost Analysis, Vendor Evaluation                | `agents/finance-procurement.agent.md`        |
| 82  | `localization-specialist`    | Localization Specialist    | i18n, l10n, Translation                         | `agents/localization-specialist.agent.md`    |
| 83  | `incident-commander`         | Incident Commander         | Incident Management, War Room                   | `agents/incident-commander.agent.md`         |
| 84  | `red-team`                   | Red Team                   | Adversarial Testing, Exploit Discovery          | `agents/red-team.agent.md`                   |
| 90  | `90-framework-auditor`       | Framework Auditor          | Meta-Level Testing, Framework QA                | `agents/90-framework-auditor.agent.md`       |
| 99  | `quality-director`           | Quality Director           | Final Authority, Ship/No-Ship                   | `agents/quality-director.agent.md`           |

**Total Agents: 28**

---

## Routing Guide

### When to Call Which Agent

| Situation                | Route To                 | Prompt to Use                                |
| ------------------------ | ------------------------ | -------------------------------------------- |
| New feature request      | `00-chief-of-staff`      | `discovery/repo-scan.prompt.md`              |
| Bug report               | `00-chief-of-staff`      | `discovery/risk-analysis.prompt.md`          |
| Architecture question    | `solution-architect`     | `architecture/system-design.prompt.md`       |
| Need acceptance criteria | `product-owner`          | `planning/acceptance-criteria.prompt.md`     |
| Need business-owner alignment | `product-owner`      | `planning/acceptance-criteria.prompt.md`     |
| Implement a feature      | `tech-lead`              | `implementation/vertical-slice.prompt.md`    |
| Review a PR              | `quality-director`       | `review/microsoft-grade-pr-review.prompt.md` |
| Fix failing tests        | `qa-test-engineer`       | `testing/test-gap.prompt.md`                 |
| Security concern         | `security-engineer`      | `security/threat-model.prompt.md`            |
| Performance issue        | `performance-engineer`   | `optimization/performance-audit.prompt.md`   |
| Deploy to production     | `devops-engineer`        | `operations/deployment-plan.prompt.md`       |
| Incident in production   | `incident-commander`     | `incident/incident-response.prompt.md`       |
| Need documentation       | `documentation-engineer` | `documentation/readme-update.prompt.md`      |
| Refactoring needed       | `tech-lead`              | `implementation/refactor.prompt.md`          |
| New dependency request   | `solution-architect`     | `architecture/adr-generation.prompt.md`      |
| Release preparation      | `program-manager`        | `release/release-notes.prompt.md`            |
| Audit framework health   | `90-framework-auditor`   | `framework-audit/mode-selection.prompt.md`   |
| Unknown / unclear        | `00-chief-of-staff`      | (Chief will route)                           |

---

## Escalation Path

```
Any Agent → Tech Lead → Solution Architect → Chief of Staff → Stakeholder Executive
                                                   ↑
Quality Director ──── (can escalate to) ──────────┘
```

### Escalation Triggers

1. **Blocked >2 attempts** — Escalate to next level
2. **Scope ambiguity** — Escalate to Product Owner
3. **Architecture conflict** — Escalate to Solution Architect
4. **Security concern** — Escalate to Security Engineer (always)
5. **Quality gate failure** — Escalate to Quality Director
6. **Business decision needed** — Escalate to Stakeholder Executive
7. **Cross-cutting concern** — Escalate to Chief of Staff

---

## Stop Conditions

### An agent MUST STOP and escalate when:

1. Task is outside their defined scope
2. They've attempted the same fix 3 times without success
3. A security vulnerability is discovered
4. A model violation is detected (code drifts from model)
5. Required input is missing and cannot be inferred
6. The change would break a quality gate
7. The change requires an ADR that doesn't exist

---

## Infinite Loop Prevention

### Rules

1. **Max dispatch depth:** 10 agents in a single chain
2. **No self-dispatch:** An agent cannot call itself
3. **No A→B→A cycles:** Track dispatch history in context
4. **Blocked detection:** If an agent receives the same task >2 times, escalate to Chief of Staff
5. **Timeout:** If no progress after 3 dispatches, Quality Director makes ship/no-ship call

### Dispatch Tracking

Every dispatch MUST include:

```
Dispatch Chain: [00-chief-of-staff] → [product-owner] → [solution-architect] → [current]
Dispatch Depth: 3/10
```

---

## Handoff Protocol: File-Based System

> **Location:** `.github/.handoffs/`
> **Protocol:** Write handoff file → attach as context → short CLI trigger

### Why File-Based

PowerShell's `code chat -m` command truncates or drops complex multi-line string arguments. The file-based handoff system solves this by writing the full prompt to a file in the target agent's inbox directory, then attaching it with `--add-file`.

### Directory Structure

Each agent has an inbox at `.github/.handoffs/<agent-id>/`. See [.github/.handoffs/README.md](.handoffs/README.md) for full protocol documentation.

### Dispatch Format (ALL agents MUST use this)

**Step 1:** Write the handoff file to the target agent's inbox:

```powershell
# The sending agent creates a handoff file in the target's inbox
# File: .github/.handoffs/<target-agent-id>/handoff-<YYYYMMDD-HHmmss>.md
```

**Step 2:** Dispatch with the file attached:

```powershell
$repo = (Get-Location).Path
$handoff = ".github/.handoffs/<target-agent-id>/handoff-<timestamp>.md"
code chat -m <target-agent-id> --add-file $repo --add-file $handoff "Execute the task in your handoff file at $handoff"
```

### Handoff File Template

Every handoff file MUST follow this structure:

```markdown
# Handoff: <Short Title>

**From:** <sending-agent-id>
**To:** <receiving-agent-id>
**Date:** <YYYY-MM-DD HH:MM>
**Dispatch Chain:** [agent1] → [agent2] → [you]
**Dispatch Depth:** N/10

---

## Original Request

<What the user originally asked for>

## Context

<Background, current state, relevant history>

## Work Completed So Far

- <What previous agents have done>

## Your Task

<Specific actionable instructions>

### Deliverables

1. <Concrete deliverable>

### Acceptance Criteria

- [ ] <Measurable criterion>

## Constraints

- <Constraint>

## Reference Files

- <path/to/file>

## Next Agent

Hand off to: `<next-agent-id>`
```

### Rules

1. **One handoff file per dispatch** - Don't reuse files across dispatches
2. **Keep files after processing** - Serves as audit trail
3. **Most recent file wins** - If multiple exist, process the latest
4. **Never inline the prompt** - Always use a file for multi-line content
5. **Short CLI message only** - The `code chat` argument is just a trigger pointing to the file

### Quality Director Exception

Quality Director (`99-quality-director`) is the ONLY agent authorized to end the chain:

```
CHAIN COMPLETE ✅
All acceptance criteria met.
All quality gates passed.
Evidence: <list of evidence>
```

---

## Quick Reference: Agent Invocation

```powershell
# Simple single-line command (OK for trivial tasks)
code chat -m frontend-engineer "Build the product card component"

# Multi-line / complex tasks: USE FILE-BASED HANDOFF (MANDATORY)
# 1. Write handoff file
# 2. Attach + dispatch
$repo = (Get-Location).Path
$handoff = ".github/.handoffs/solution-architect/handoff-20260225-143000.md"
code chat -m solution-architect --add-file $repo --add-file $handoff "Execute the task in your handoff file at $handoff"
```

### NEVER Do This (Broken Approaches)

```powershell
# ❌ WRONG: Multi-line string argument — gets truncated/dropped
code chat -m agent "Line 1
Line 2
Line 3"

# ❌ WRONG: Backtick continuation — unreliable
code chat -m agent --add-file $repo `
  "Multi-line content"

# ❌ WRONG: Here-string as argument — may not be passed correctly
$prompt = @"
Long content
"@
code chat -m agent $prompt
```
