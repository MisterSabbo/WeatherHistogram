---
name: feature-ticket-creator
description: Use when the user requests any change to the project — new feature, enhancement, bugfix, refactor, performance improvement, or design change that needs structured requirements before implementation
---

# Feature Ticket Creator

## Overview

When the user asks for a change — whether a new feature, a bugfix, a refactor, or any modification — **you must not start implementing anything until the requirements are fully detailed in a ticket**. This skill forces you to gather all necessary information by asking explicit questions, **never assuming** any detail about the user's intent, scope, design, or acceptance criteria.

The output is a ticket file in `./feat-tickets/` written ONLY in english following the exact format of `./feat-tickets/template.md`.

## When to Use

Use this skill whenever the user mentions:

- "Añade/agrega/implementa X" — adding new functionality
- "Cambia/modifica X" — modifying existing behavior
- "Hay un bug/error en X" — reporting a defect
- "Refactoriza/mejora X" — restructuring code without changing behavior
- "Optimiza/acelera X" — performance improvement
- "Rediseña/cambia el diseño de X" — UI/UX change
- "Crea un ticket para X" — explicitly asks for a ticket
- Any vague or underspecified request that would benefit from structured requirements

**Do NOT use when:**
- The task is a trivial, single-line fix that needs no requirements (typo in a string, CSS color change)
- The user asks directly for a technical implementation detail that is already well-understood
- The user is explicitly asking you to skip the ticket and implement directly

## Core Rule: Never Assume

**Stop and ask.** For every detail of the ticket, you must ask the user rather than inventing it. The user story, rationale, acceptance criteria, scope, dependencies — every field in the template must be explicitly clarified.

The only exceptions are fields that have an obvious default:
- **ID**: auto-increment from the highest existing ticket number in `./feat-tickets/`
- **"All existing tests continue to pass"** and **"Lint passes with 0 warnings / 0 errors"**: always included in acceptance criteria

Everything else: **ask before writing**.

## Requirement Gathering Process

Follow this exact sequence. Do not skip steps.

### Step 1: Detect intent

The user has expressed a desire for change. Before asking anything, identify what type of change this is:

| Trigger phrase | Type to suggest |
|---|---|
| "Añadir", "nuevo", "implementar", "feature", "new" | `feature` |
| "Mejorar", "cambiar", "modificar", "enhance", "improve" | `enhancement` |
| "Bug", "error", "fallo", "no funciona", "no se ve" | `bugfix` |
| "Refactor", "reestructurar", "limpiar", "clean up" | `refactor` |
| "Rendimiento", "performance", "lento", "slow" | `performance` |

### Step 2: Present the Requirements Questionnaire (Single Iteration)

You must never ask questions one by one or category by category. Instead, you must immediately generate and present a unified Questionnaire in a single response so the user can fill it out at once.

#### Category A: Change Type & Scope

- "¿Qué tipo de cambio es? ¿Feature, enhancement, bugfix, refactor, performance, u otro?"
- "¿Qué archivos o áreas del proyecto crees que se verán afectadas?"
- "¿Cuál es el comportamiento actual y qué debería cambiar?"

Do not skip this category. Do not infer the type from the original message without confirming.

#### Category B: User Story

- "¿Quién es el usuario final de este cambio?" (role — e.g., user, developer, admin)
- "¿Qué necesidad o problema concreto resuelve este cambio?"
- "¿Qué beneficio obtiene el usuario al tener esto?"

**Format the answer as:** `As a **{role}**, I want **{capability}** so that **{benefit}**`.

#### Category C: Rationale

- "¿Por qué es importante este cambio ahora?"
- "¿Qué pasa si no lo hacemos?"
- "¿Hay algún contexto adicional (cambios anteriores, decisiones previas) que justifique esto?"

#### Category D: Acceptance Criteria

- "¿Cómo sabremos que este cambio está completo y funciona correctamente?"
- "¿Hay casos específicos que debemos probar? (estados vacíos, errores, límites)"
- "¿Qué comportamiento debe tener en caso de error?"
- "¿Hay algún criterio de rendimiento o accesibilidad?"

**Important:** Do not write acceptance criteria yourself. Ask the user to describe them, then rephrase as checklist items. Each criterion should be testable (verifiable by a human or automated test).

#### Category E: UX / Visual Changes

- "¿Este cambio afecta la interfaz de usuario? ¿Cómo?"
- "¿Puedes describir cómo se ve antes y cómo debería verse después?"
- "¿Hay cambios responsive (móvil, escritorio) o de modo standalone (PWA)?"
- "¿Hay cambios en colores, tipografía, espaciado, iconos o animaciones?"
- "¿Afecta a los temas (default, neon, pastel)?"
- "¿Necesitas un mockup o diagrama?"

#### Category F: Dependencies

- "¿Este cambio depende de algún otro ticket o funcionalidad?"
- "¿Algo más depende de este cambio?"
- Si la respuesta es "sí", verifica si el ticket de dependencia ya existe. Si no, el usuario necesita crearlo primero.

#### Category G: Priority

- "¿Qué prioridad tiene este cambio? (high / medium / low)"
- "¿Hay alguna fecha límite o razón por la que sea urgente?"

#### Category H: SDD Mode

Based on what you now know, suggest the most appropriate SDD mode:

- `spec-first` — completely new feature, no code exists yet
- `spec-retro` — code already exists but has no spec
- `spec-update` — both code and spec exist, behavior changes
- `feature` — user story that needs decomposition across multiple units

Ask: "¿Te parece correcto usar modo **{mode}** para SDD?"

### Step 3: Determine Ticket ID

Scan `./feat-tickets/` for existing ticket files. The highest existing number is the base. The next ticket ID is that number + 1, formatted as three digits (e.g., `005`).

```bash
Get-ChildItem -Path "./feat-tickets" -Filter "*.md" | Where-Object { $_.Name -match '^\d{3}-' }
```

If no tickets exist, start at `001`.

### Step 4: Confirm & Write

Summarize all gathered information back to the user in a concise format. Ask:

> "He recopilado la siguiente información para el ticket. ¿Es correcta?"
> [present ticket content in markdown]
> "Si todo está bien, procedo a crear el archivo."

Only once the user confirms, write the file.

### Step 5: Write the Ticket File

Create the file at `./feat-tickets/{ID}-{slugified-title}.md`

The slugified title is the title in lowercase with hyphens instead of spaces, removing special characters. For example: "Añadir cabeceras de día" → `anadir-cabeceras-de-dia`.

The file must match the template format exactly:

```markdown
# {Title}

| Field | Value |
|---|---|
| **ID** | `{ID}` |
| **Type** | `{feature | enhancement | bugfix}` |
| **SDD Mode** | `{spec-first | spec-retro | spec-update | feature}` |
| **Priority** | `{high | medium | low}` |
| **Dependencies** | `{none | ticket IDs}` |

## Description (User Story)

As a **{role}**, I want **{capability}** so that **{benefit}**.

## Rationale

{Why this change matters for the user experience.}

## Acceptance Criteria

- [ ] {Criterion 1}
- [ ] {Criterion 2}
- [ ] {Criterion 3}
- [ ] {All existing tests continue to pass}
- [ ] {Lint passes with 0 warnings / 0 errors}

## UX / Visual Changes

{Describe any UI changes, with mockups or descriptions if applicable.}
```

**Rules for writing:**
- The title should be descriptive but concise (max ~60 chars ideal)
- The user story must use the exact format `As a **{role}**, I want **{capability}** so that **{benefit}**`.
- Acceptance criteria must be checklist items (`- [ ]`)
- Always append the standard criteria: "All existing tests continue to pass" and "Lint passes with 0 warnings / 0 errors"
- UX / Visual Changes section may contain ASCII mockups, tables, or prose descriptions — whatever the user provided
- Use the locale (es/en) of the user's original request for the ticket content

## Template Field Reference

| Field | Required | Description |
|---|---|---|
| **ID** | Yes | 3-digit zero-padded number, auto-incremented from existing tickets |
| **Type** | Yes | One of: `feature`, `enhancement`, `bugfix`, `refactor`, `performance` |
| **SDD Mode** | Yes | One of: `spec-first`, `spec-retro`, `spec-update`, `feature` |
| **Priority** | Yes | One of: `high`, `medium`, `low` |
| **Dependencies** | Yes | `none` or comma-separated ticket IDs (e.g., `002, 003`) |
| **User Story** | Yes | Standard format with role, capability, benefit |
| **Rationale** | Yes | Why this matters, what problem it solves |
| **Acceptance Criteria** | Yes | Testable checklist items |
| **UX / Visual Changes** | No | Only if UI changes are involved. Can be "None" |

## Common Mistakes

| Mistake | Why It's Wrong |
|---|---|
| **Assuming the user story** without asking | The user's first message is rarely a complete user story. Always ask. |
| **Skipping rationale** | Without knowing _why_, future implementers and reviewers lack context to make good decisions. |
| **Writing acceptance criteria that aren't testable** | "It should work well" is not testable. "The button turns green on hover" is. |
| **Asking all questions at once** | The user can't process 15 questions at once. Ask one category at a time. |
| **Forgetting to scan for existing tickets** | You might create a duplicate ticket or reuse an already-taken ID. |
| **Assuming the SDD mode** | The mode depends on whether specs exist — ask the user or verify against the codebase. |
| **Writing the ticket without confirmation** | Always confirm the full content with the user before writing the file. |
| **Using emojis** | Do not add emojis to ticket content unless the user explicitly uses them. |

## Red Flags — STOP and Follow the Workflow

- "I know what the user wants, I can skip the questions" → **Stop.** Ask anyway.
- "This is obvious, I can fill in the template directly" → **Stop.** The user must confirm every field.
- "I'll ask a few questions and assume the rest" → **Stop.** Ask each category explicitly.
- "The user said 'create a ticket for X', I already have everything I need" → **Stop.** You still need to confirm each field.
- "This is just a small change, no need for a full ticket" → **Stop.** If you're using this skill, a ticket is needed.

## Verification Checklist

Before delivering the final ticket:

- [ ] Every field in the template is present and filled
- [ ] The ID is the correct next number from existing tickets
- [ ] The user confirmed all information before the file was written
- [ ] Acceptance criteria are testable (not vague)
- [ ] "All existing tests continue to pass" is in the checklist
- [ ] "Lint passes with 0 warnings / 0 errors" is in the checklist
- [ ] The file name follows the pattern `{ID}-{slugified-title}.md`
- [ ] The file is in `./feat-tickets/`
- [ ] The locale matches the user's language (es/en)
- [ ] No emojis unless the user explicitly used them
