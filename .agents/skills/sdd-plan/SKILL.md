---
name: sdd-plan
description: Use as Phase 3 of the SDD workflow to create a technical implementation plan and task breakdown from a specification. Produces plan.md and tasks.md in plans/<feature-name>/.
---

# sdd-plan

## Role

You are the **Technical Planner**. Your job is to take a specification and produce:
1. A **technical plan** (`plan.md`) with architecture decisions, data models, and implementation approach
2. A **task breakdown** (`tasks.md`) with ordered, actionable tasks

Output goes to `./plans/<feature-name>/` (e.g. `./plans/export-csv/plan.md`).

## Process

### 1. Read Context

Read:
- `./memory/constitution.md` — project principles and constraints
- The spec at the given path
- `AGENTS.md` — architecture rules
- Relevant source files to understand existing patterns

### 2. Check for Ambiguities

Scan the spec for `[NEEDS CLARIFICATION]` markers:

- If found → return them to the orchestrator with a request for clarification
- If none → proceed

### 3. Determine Feature Name

Derive a short kebab-case feature name from the spec (e.g. `export-csv`, `color-utils-refactor`).
Create directory: `./plans/<feature-name>/`

### 4. Write plan.md

```markdown
# Plan: <Feature Name>

## Spec Reference
<path to spec>

## Technical Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|

## Architecture
- Modules to create/modify
- Data flow
- Key algorithms

## Files to Change
| File | Action (create/modify) | Description |
|------|----------------------|-------------|

## Dependencies
- Internal modules this depends on
- External packages needed (if any)

## Risk Areas
- Performance concerns
- Breaking changes
- Migration needed
```

### 5. Write tasks.md

```markdown
# Tasks: <Feature Name>

## Execution Order
Tasks must be executed in order. Parallel tasks marked with `[P]`.

### Phase 1: <Setup/Prep>
- [ ] `<task-description>` — `<file-path>` — `<acceptance-criteria>`

### Phase 2: <Core Logic>
- [ ] `[P]` `<task-description>` — `<file-path>`
- [ ] `[P]` `<task-description>` — `<file-path>`

### Phase 3: <Integration>
- [ ] `<task-description>` — `<file-path>`

### Phase 4: <Verification>
- [ ] All tests pass
- [ ] Lint passes (0 warnings, 0 errors)
- [ ] Typecheck passes
- [ ] Build succeeds
```

Each task should:
- Reference the exact file path to modify
- Include acceptance criteria (how to know it's done)
- Mark parallel tasks with `[P]`
- Respect dependency order (services before UI, etc.)

### 6. Output

Return:
- Path to `./plans/<feature-name>/plan.md`
- Path to `./plans/<feature-name>/tasks.md`
- Number of tasks
- Any risks or concerns
