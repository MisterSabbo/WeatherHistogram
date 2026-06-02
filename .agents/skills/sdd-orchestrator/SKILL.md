---
name: sdd-orchestrator
description: Use when implementing Spec-Driven Development (SDD) — whether documenting existing code with specs, creating new features from user stories, or updating specs when code changes. Invoke when the user asks to "apply SDD", "write specs", "add a feature using SDD", or any request involving structured spec-first workflows. Do NOT use for simple bugfixes or one-line changes that don't warrant a full spec cycle.
---

# sdd-orchestrator

## Overview

Orchestrates the SDD lifecycle in 4 phases inspired by GitHub Spec Kit:

```
Constitution → Specify → Plan → Implement
```

Accepts any input (module path, user story, feature request, change description) and automatically detects the mode — dispatching to specialized agents and verifying gates before proceeding.

**Core principle:** Specs are the source of truth. Code follows.

## Mode Detection

The orchestrator decides the mode based on what exists and what the user says:

| Input | Detected as |
|---|---|
| `"SDD para src/utils/color.js"` — file exists, no spec | `spec` |
| `"Crea src/services/ExportCsv.js"` — file doesn't exist | `full` |
| `"Añade exportar datos guardados"` — user story | `full` |
| `"SDD full para src/utils/color.js"` — explicit mode prefix | `full` forced |
| `"SDD para src/utils/"` — directory path | `crawl` |
| `"Convierte todo el proyecto a SDD"` — bulk keywords | `crawl` |
| `"SDD para src/services/ y src/domain/"` — multi-directory | `crawl` |

> Mode can be forced by prefix: `"full: <input>"`, `"spec: <input>"`, `"crawl: <input>"`.

### Detection Logic

1. Input mentions an **existing file path** (`src/...`) AND file exists → check for spec
   - Spec exists → `full` (update mode: re-spec + re-plan + re-implement)
   - No spec → `spec` (document existing code)
2. Input mentions a **new file path** (doesn't exist) → `full`
3. Input is a **user story** (feature description, no file) → `full`
4. Input mentions a **directory path** or **bulk keywords** → `crawl`
5. Explicit prefix `"full:"`, `"spec:"`, `"crawl:"` → forced mode
6. Default → `full` (safe fallback, will analyze)

## Modes

### spec — Only Specify

Runs **Constitution (check) → Specify**. For documenting existing code without changing it.

```
1. CONSTITUTION (verify exists, skip if current)
2. SPECIFY
   Task(general + agent-specify)
   Input: module path
   Output: specs/<path>.md created/updated

   [GATE] No [NEEDS CLARIFICATION] markers? → report them to user
```

### full — Full Cycle

Runs all 4 phases. For new features, changes, or anything producing code.

```
1. CONSTITUTION (verify exists, update if needed)
   Task(general + agent-constitution)
   Input: project path
   Output: memory/constitution.md verified

2. SPECIFY
   Task(general + agent-specify)
   Input: module path + description
   Output: specs/<path>.md

   [GATE] [NEEDS CLARIFICATION]? → pause, ask user, retry
   [GATE] Spec is reviewable? → no → retry

3. PLAN
   Task(general + agent-plan)
   Input: spec path
   Output: plans/<feature-name>/plan.md + tasks.md

   [GATE] Tasks are ordered and actionable? → no → retry

4. IMPLEMENT
   Task(general + agent-implement)
   Input: plan directory path
   Output: working code + passing tests

   [GATE] npm test + lint + typecheck + build pass? → no → fix, retry (max 2)

   [FINAL GATE] All checks green? → done
```

### crawl — Bulk Mode

Scans directories, finds modules without specs, runs `spec` or `full` on each.

```
1. SCAN
   Find all .js files under target directories
   Exclude: *.test.js, node_modules, dist
   For each, check if specs/<relative-path>.md exists

   Output: modules_without_spec = [path1, path2, ...]

   [GATE] At least one module? → no → report "all done"

2. SORT
   Build dependency graph from import statements
   Topological sort (leaf modules first)

3. For each module in order:
   Run `spec` mode (or `full` if user specified)
   Report: "[3/15] src/utils/dom.js — PASS"

4. Summary: total, passed, failed, specs created
```

## Sub-agent Mapping

| Phase | subagent_type | Skill file |
|---|---|---|
| CONSTITUTION | general | agent-constitution.md |
| SPECIFY | general | agent-specify.md |
| PLAN | general | agent-plan.md |
| IMPLEMENT | general | agent-implement.md |

## Error Handling

**Gate failures:**
- Retry phase up to 2 times
- After 2 failures, abort and report to user with details
- User can skip the gate or fix manually

**Spec ambiguity:**
- If `[NEEDS CLARIFICATION]` markers found → pause flow, ask user for clarification
- Resume from same phase after user responds

**Implementation failures:**
- Collect failure details (test name, expected vs actual, lint rule)
- Re-run IMPLEMENT phase
- If same failures after 2 retries → abort and report

**Missing dependencies (in crawl):**
- Queue undocumented dependencies as spec units before the dependent module

## Verification Checklist (post-mode)

- [ ] All specs follow template format
- [ ] No `[NEEDS CLARIFICATION]` markers remain (if full mode)
- [ ] `npm test` passes
- [ ] `npm run lint` — 0 warnings, 0 errors
- [ ] `npm run typecheck` passes
- [ ] `npm run build` succeeds

## Invocation Examples

```
// Mode: spec (document existing code)
Task(general + sdd-orchestrator) → "SDD para src/store.js"

// Mode: full (new feature)
Task(general + sdd-orchestrator) → "Crea un módulo que calcule el Wind Chill"

// Mode: full (user story)
Task(general + sdd-orchestrator) → "Añade exportar datos guardados como CSV"

// Mode: full (update existing)
Task(general + sdd-orchestrator) → "Añade una función hslToRgb a src/utils/color.js"

// Mode: full forced (re-document + implement)
Task(general + sdd-orchestrator) → "full: src/utils/color.js"

// Mode: crawl (directory)
Task(general + sdd-orchestrator) → "SDD para src/utils/"

// Mode: crawl (whole project)
Task(general + sdd-orchestrator) → "Convierte todo el proyecto a SDD"
```
