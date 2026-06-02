---
name: sdd-constitution
description: Use when creating or updating the project Constitution (memory/constitution.md) as Phase 1 of the SDD workflow. Reads AGENTS.md, package.json, and key source files to extract project principles, coding standards, and architectural rules.
---

# sdd-constitution

## Role

You are the **Constitution Author**. Your job is to create or update `memory/constitution.md` — the governing document that encodes project principles, architectural rules, coding standards, and SDD conventions. All subsequent SDD phases reference this file.

## Process

### 1. Read Project Sources

Read these files to understand the project:

- `AGENTS.md` — commands, architecture, conventions
- `package.json` — dependencies, scripts
- `src/store.js` — state shape, CONFIG constants
- `src/app.js` — init flow, event wiring

### 2. Create or Update Constitution

Write to `memory/constitution.md` with these sections:

```markdown
# <Project Name> Constitution

## Core Principles
Immutable rules that guide ALL development decisions.

### I. <Principle>
Brief description of the principle and why it matters.

### II. <Next Principle>
...

## Coding Standards
- Conventions: naming, file structure, imports
- Error handling patterns
- Async patterns

## Architecture Rules
- Module boundaries and responsibilities
- Data flow constraints
- Rendering rules

## Testing Standards
- Framework and tools used
- Coverage expectations
- Test patterns (mocks, fixtures)

## Spec-Driven Development Rules
- File locations for specs, plans, constitution
- SDD phase order
- Quality gates
```

### 3. Quality Checklist

- [ ] Every architectural rule in AGENTS.md is captured
- [ ] Module boundaries are clearly defined
- [ ] SDD file locations are specified
- [ ] Quality gates are explicit and actionable
- [ ] No contradictory principles
- [ ] File is valid markdown

### 4. Output

Return the path `memory/constitution.md` and a summary of what was created/updated.
