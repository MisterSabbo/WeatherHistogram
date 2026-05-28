---
name: sdd-orchestrator
description: Use when implementing Spec-Driven Development (SDD) — whether documenting existing code with specs, creating new features from user stories, or updating specs when code changes. Invoke when the user asks to "apply SDD", "write specs", "add a feature using SDD", or any request involving structured spec-first workflows. Do NOT use for simple bugfixes or one-line changes that don't warrant a full spec cycle.
---

# sdd-orchestrator

## Overview

Orchestrates the full Spec-Driven Development lifecycle. Accepts any input from the user (module path, user story, feature request, change description) and executes the correct SDD mode automatically — breaking down work into phases, dispatching sub-tasks to specialized agents, and verifying gates before proceeding.

**Core principle:** Specs are written first. Code and tests follow. Changes start with spec updates.

## Mode Detection

The orchestrator decides the mode based on what exists:

| User says... | Detected as... |
|---|---|---|
| `"SDD para src/utils/color.js"` | `spec-retro` — module exists, check if spec exists |
| `"Nuevo servicio src/services/HeatIndex.js"` | `spec-first` — new module path given |
| `"Añade exportar datos guardados"` | `feature` — user story, needs breakdown |
| `"Actualiza color.js con hslToRgb"` | `spec-update` — existing module + existing spec |
| `"Añade una función hslToRgb a color.js"` | `spec-update` — existing module |
| `"Crea un validador de emails"` | `spec-first` — new module implied |
| `"Convierte todo el proyecto a SDD"` | `spec-crawl` — bulk retroactive |
| `"SDD para src/utils/"` | `spec-crawl` — directory-level bulk |
| `"SDD para src/services/ y src/domain/"` | `spec-crawl` — multi-directory bulk |
| `"Convierte src/render/ a SDD"` | `spec-crawl` — directory-level bulk |

**Detection logic:**
1. If input mentions an **existing file path** (`src/...`) AND the file exists → check for existing spec
   - Spec exists → `spec-update`
   - No spec → `spec-retro`
2. If input mentions a **new file path** (doesn't exist) → `spec-first`
3. If input mentions a **directory path** (`src/utils/`, `src/services/`) → `spec-crawl`
4. If input mentions **bulk keywords** ("todo", "convertir", "todos", "resto", "crawl") → `spec-crawl`
5. If input is a **user story** (feature description without file paths) → `feature`
6. Default → `feature` (safe fallback, will analyze and decide)

## Modes

### spec-retro — Document existing code

```
ANALYZE → SPEC WRITE → SPEC REVIEW → TEST WRITE → VERIFY
```

Use when: code exists, no spec, goal is documentation + test regeneration.

### spec-first — New feature from scratch

```
SPEC WRITE → SPEC REVIEW → TEST WRITE → IMPLEMENT → VERIFY
```

Use when: no code exists, spec drives implementation (TDD).

### spec-update — Update existing spec + code

```
ANALYZE (diff) → UPDATE SPEC → SPEC REVIEW → UPDATE TESTS → IMPLEMENT → VERIFY
```

Use when: both code and spec exist, behavior changes.

### spec-crawl — Bulk retroactive specs

```
SCAN → SORT → [for each module: spec-retro]
```

Use when: user wants to document multiple existing modules (a directory, a list, or the whole project) in one go. The orchestrator scans source files, identifies which lack specs, orders them by dependency, and runs `spec-retro` on each sequentially.

### feature — User story decomposition

```
FEATURE BREAKDOWN → [for each unit: run appropriate mode]
```

Use when: user describes a feature without technical details. The breakdown phase produces a plan of SDD units, then executes each one in dependency order.

## Orchestration Flow (per mode)

### spec-retro flow

```
1. ANALYZE
   Task(explore + agent-sdd-analyst)
   Input:  module path
   Output: { api: [...], deps: [...], stateAccess: [...], domDeps: [...],
             edgeCases: [...], testCoverage: [...] }

   [GATE] All exports and dependencies identified? → No → retry ANALYZE

2. SPEC WRITE
   Task(docs-writer + agent-sdd-spec-writer)
   Input:  analysis output
   Output: specs/<module-path>.md created

   [GATE] Spec follows template, no gaps? → No → retry SPEC WRITE

3. SPEC REVIEW
   Task(general + agent-sdd-spec-reviewer)
   Input:  spec file path
   Output: APPROVED | corrections list

   [GATE] APPROVED? → No → apply corrections, re-review

4. TEST WRITE
   Task(general + agent-sdd-test-writer)
   Input:  spec file path
   Output: test file created/updated

   [GATE] Tests cover all spec scenarios? → No → retry TEST WRITE

5. VERIFY
   Task(general + agent-sdd-verifier)
   Input:  module path
   Output: PASS | FAIL with details

   [GATE] PASS? → Yes → done. No → fix and retry.
```

### spec-first flow

```
1. SPEC WRITE (no analysis needed — new module)
   Task(docs-writer + agent-sdd-spec-writer)
   Output: specs/<path>.md

   [GATE] Spec complete and reviewable? → No → retry

2. SPEC REVIEW
   Task(general + agent-sdd-spec-reviewer)
   Output: APPROVED | corrections

   [GATE] APPROVED? → No → fix

3. TEST WRITE
   Task(general + agent-sdd-test-writer)
   Output: test file

   [GATE] Tests cover spec? → No → retry

4. IMPLEMENT
   Task(general + agent-sdd-implementer)
   Output: source file created

   [GATE] npm test passes? → No → fix

5. VERIFY
   Task(general + agent-sdd-verifier)
   Output: PASS | FAIL
```

### spec-crawl flow

```
1. SCAN
   Find all .js files under the target directories (src/ or subdirectories)
   Exclude: *.test.js, *node_modules*, *dist*
   For each file, check if specs/<relative-path-without-src>.md exists

   Input:  target path(s) from user (default: src/)
   Output: modules_without_spec = [path1, path2, ...]

   [GATE] At least one module found? → No → report "all modules already spec'd"

2. SORT
   Read each module's import statements (regex: import ... from '...')
   Build a dependency graph (module → its internal deps)
   Topological sort: modules that nothing depends on go first

   Dependency tier ordering (used as fallback if no imports found):
     utils/ → data/ → services/ → domain/ → render/metrics/ → render/ → ui/ → store/theme → app.js

   Output: ordered_modules = [path1, path2, ...]

3. For each module in ordered_modules:
   Run spec-retro flow (ANALYZE → SPEC WRITE → SPEC REVIEW → TEST WRITE → VERIFY)
   Report progress: "[3/15] src/utils/dom.js — PASS"

4. Summary report
   Total: X modules
   Passed: X
   Failed: X (with details)
   Specs created: X files in specs/
   Tests rewritten: X files
   Bugs found: X (if any)
```

### feature flow

```
1. FEATURE BREAKDOWN
   Task(explore + agent-sdd-feature-breakdown)
   Input:  user story
   Output: {
     units: [{ path, mode, description, deps }],
     order: [path1, path2, ...]
   }

   [GATE] Plan covers all aspects of the user story? → No → retry

2. For each unit in order:
   Run appropriate mode (spec-first | spec-update | spec-retro)

3. Summary report
```

## Sub-task Conventions

When launching sub-tasks, use the following format:

```
Task(
  subagent_type: <type>,
  description: "<role> for <module>",
  prompt: """
    [LOAD SKILL: sdd-orchestrator/<role-skill-file>]
    [ROLE: <role-name>]
    [MODULE: <path>]
    [SPEC: <spec-path>]  // if applicable
    [ANALYSIS: <analysis-json>]  // if applicable
    ...
  """
)
```

### Subagent mapping

| Phase | subagent_type | Skill file |
|---|---|---|
| FEATURE BREAKDOWN | explore | agent-sdd-feature-breakdown.md |
| ANALYZE | explore | agent-sdd-analyst.md |
| SPEC WRITE | docs-writer | agent-sdd-spec-writer.md |
| SPEC REVIEW | general | agent-sdd-spec-reviewer.md |
| TEST WRITE | general | agent-sdd-test-writer.md |
| IMPLEMENT | general | agent-sdd-implementer.md |
| VERIFY | general | agent-sdd-verifier.md |

## Error Handling

**Gate failures:**
- If a gate fails, retry the phase up to 2 times
- After 2 failures, abort the mode and report to user with details
- User can choose to skip the gate or fix manually

**Test failures in VERIFY:**
- Collect failure details
- Re-run IMPLEMENT (or TEST WRITE if spec changed)
- If same failures persist after 2 retries, abort and report

**Missing dependencies:**
- If FEATURE BREAKDOWN detects a dependency that isn't spec'd yet, queue it as a spec-retro unit before the feature unit

## Verification Checklist (post-mode)

- [ ] All specs written/updated follow `specs/_template.md`
- [ ] `npm test` passes (all tests, not just changed ones)
- [ ] `npm run lint` has no new errors
- [ ] `npm run typecheck` passes
- [ ] `npm run build` succeeds

## Invocation Examples

```
// Mode: spec-retro (single module)
Task(general + sdd-orchestrator) → "SDD para src/store.js"

// Mode: spec-crawl (directory)
Task(general + sdd-orchestrator) → "SDD para src/utils/"

// Mode: spec-crawl (whole project)
Task(general + sdd-orchestrator) → "Convierte todo el proyecto a SDD"

// Mode: spec-crawl (multiple dirs)
Task(general + sdd-orchestrator) → "SDD para src/services/ y src/domain/"

// Mode: feature (user story)
Task(general + sdd-orchestrator) → "Añade exportar datos guardados como CSV"

// Mode: spec-first (new module)
Task(general + sdd-orchestrator) → "Crea un módulo que calcule el Wind Chill"

// Mode: spec-update (existing change)
Task(general + sdd-orchestrator) → "Añade una función hslToRgb a src/utils/color.js"
```
