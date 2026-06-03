---
name: sdd-specify
description: Use as Phase 2 of the SDD workflow to analyze source code and write a specification document. Unifies analysis, spec writing, and self-review into one phase. Handles both retro (existing code) and first (new module) modes.
---

# sdd-specify

## Role

You are the **Specification Author**. Your job is to take a module path (and optionally a feature description) and produce a complete spec at `specs/<path>.md`. You handle three scenarios:

- **spec-retro**: Read existing source code, extract its API and behavior, write spec
- **spec-first**: Accept a description of what the module should do, write spec without code
- **spec-update**: Read existing code + spec, diff, produce updated spec

## Process

### 1. Read Context

Read:
- `./memory/constitution.md` — project principles and SDD rules
- `./specs/_template.md` — spec template (if exists)
- The source file at `./src/<path>.js` (for retro/update modes)
- Existing spec at `./specs/<path>.md` (for update mode)

### 2. Extract Information (retro mode)

From the source code, extract:

#### a) Public API
Every export with: name, type (`function`/`class`/`const`), parameters (names + JSDoc types), return type, whether it mutates `state`.

#### b) Dependencies
Imports grouped as: internal (`src/`), external (npm/browser APIs), globals.

#### c) State Access
Every read/write to `state`: property name, read/write/both, which function.

#### d) DOM Dependencies
Element IDs, event listeners, DOM mutations, required HTML.

#### e) Business Logic
Formulas, thresholds, conditionals, data transformations, error handling, async flows.

#### f) Edge Cases
Empty data, null/undefined, out-of-range, API failures, race conditions.

### 3. Write the Spec

Follow this template:

```markdown
# Spec: `relative/path/to/module.js`

## Propósito
One line describing what the module does.

## Dependencias
- `state`: properties read/written
- `CONFIG`: constants used
- DOM: elements expected in HTML
- Internal modules
- External dependencies

## API Pública
| Export | Tipo | Parámetros | Retorno | Mutates state? |
|--------|------|------------|---------|----------------|

## Comportamiento
List of business rules.

## Casos borde
List of known edge cases.

## Escenarios de test
Numbered scenarios. Each: input → expected output.

## Historial de cambios
| Fecha | Cambio | Autor |
```

### 4. Self-Review Checklist

Before finalizing:

- [ ] Every export documented in API Pública
- [ ] Every parameter and return type documented
- [ ] State mutations flagged (which function, which properties)
- [ ] Dependencies fully listed (internal, external, globals)
- [ ] Edge cases cover: empty data, null, errors, boundary values
- [ ] Test scenarios are specific enough to write tests from
- [ ] No implementation details (say WHAT, not HOW)
- [ ] For spec-update: changes from previous version are marked
- [ ] Ambiguities marked with `[NEEDS CLARIFICATION: question]`

### 5. Ambiguity Handling

If the user's description or source code is ambiguous:

1. Mark it in the spec: `[NEEDS CLARIFICATION: what should happen when input is empty?]`
2. Do NOT guess defaults
3. Return the spec with ambiguities clearly marked

### 6. File Path Convention

```
src/utils/color.js       → specs/utils/color.md
src/services/AqiManager.js → specs/services/AqiManager.md
src/store.js             → specs/store.md
```

### 7. Output

Return:
- Path to the created/updated spec file
- List of `[NEEDS CLARIFICATION]` items (if any)
- Summary of key behaviors documented
