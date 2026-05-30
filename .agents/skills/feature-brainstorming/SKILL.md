---
name: feature-brainstorming
description: Use when the user wants to explore ideas for adding new features or modifying existing functionality in the WeatherHistogram app — before deciding on an approach or writing any code. Also use when the user expresses dissatisfaction with an existing feature, asks "what options do I have?", or says they're "thinking about" making a change.
---

# Feature Brainstorming

## Overview

When the user needs to explore **what** could be done (not **how**), this skill generates a structured exploration of alternatives for the WeatherHistogram app. The output is a curated list of approaches with qualitative analysis — no code, no implementation details, no architecture decisions.

## When to Use

Use when the user:

- "Estaba pensando en añadir X..." / "I'm thinking of adding X..."
- "No me convence cómo funciona Y..." / "I'm not happy with how Y works..."
- "¿Qué opciones tengo para Z?" / "What options do I have for Z?"
- Wants to explore alternatives before committing to an approach
- Asks for ideas, possibilities, or directions about features

**Do NOT use when:**

- The user has already decided on an approach and wants implementation
- The task is a bugfix with an obvious solution
- The user explicitly asks for code or technical details
- The request is about configuration, CI, build tools, or other non-feature concerns

## Core Principles

### 1. Understand Before Ideating
Never generate ideas without first understanding:
- What the user wants to achieve (goal)
- Why the current behavior isn't sufficient (pain point)
- What constraints exist (platform, time, complexity)

### 2. Explore Before Proposing
Never propose ideas (whether new features or modifications) without first exploring the actual codebase. Use subagents to inspect the relevant files. Even for entirely new features, exploration reveals existing patterns, data sources, and integration points.

**No exceptions:**
- Not even when "you already know the codebase well"
- Not even when "the user described it clearly"
- Not even when "it's a simple change"

### 3. Ideas, Not Implementation
The output must be ideas and trade-offs. No code snippets, no architecture details, no file paths, no function names, no implementation strategies.

- Describe capabilities ("show precipitation visually"), not mechanisms ("use a canvas bar chart")
- Describe user outcomes ("faster access to data"), not code ("optimize the query")
- If you catch yourself describing HOW instead of WHAT, stop and rephrase

### 4. Multiple Approaches
Always present 3+ distinct approaches. If only one reasonable approach exists, explain why. Approaches should be meaningfully different — not minor variations of the same idea.

## Brainstorming Process

### Step 1: Clarify Intent (Ask Questions)

Ask the user to clarify BEFORE generating ideas. Understand:

| Question | Purpose |
|---|---|
| "¿Qué problema resuelve o qué oportunidad aprovecha?" | Understand the goal |
| "¿Qué es lo que no te gusta del comportamiento actual?" (for modifications) | Identify pain points |
| "¿Hay algún requisito o restricción importante? (soporte offline, rendimiento, móvil...)" | Surface constraints |
| "¿Prefieres algo simple y rápido o algo más completo aunque lleve más tiempo?" | Set scope expectations |

**Ask in a single message** (not one-by-one). Use natural conversation, not a robotic list. You only need 1-3 questions, not all of them.

### Step 2: Explore the Codebase (Subagents)

After the user responds, dispatch exploration subagents to inspect existing code before generating ideas.

**For NEW features:**
- Explore areas of the codebase the feature could integrate with
- Understand existing patterns (services, rendering, UI, data flow)
- Check if similar functionality already partially exists

**For MODIFICATIONS to existing features:**
- Explore the specific module being modified (its structure, API, tests)
- Explore related modules it interacts with
- Review the module's test file

Use the `explore` subagent type for fast codebase exploration. Dispatch in parallel when multiple areas need inspection.

**CRITICAL:** Do not read files yourself during this step — delegate to subagents. Synthesize findings afterward.

### Step 3: Generate Approaches

Based on clarification (Step 1) and codebase exploration (Step 2), generate 3+ distinct approaches.

For each approach, describe:
- **What it is**: The core idea, user-visible outcome
- **Strengths**: Why this approach works well
- **Trade-offs**: What it sacrifices or makes harder
- **Effort level**: Low / Medium / High (qualitative only, no detail)

**NO implementation details.** If an approach needs technical capability X, describe it as a capability (e.g. "offline-capable") not as an implementation (e.g. "use StorageService with IndexedDB").

### Step 4: Present & Ask for Direction

End with a clear question asking which direction the user wants to explore further. Offer to:

- Deepen the analysis on a specific approach
- Combine ideas from multiple approaches
- Move to implementation when ready (which would then use the feature-ticket-creator skill)

## Output Format

Use a clean, scannable structure:

```
## Opciones para [nombre de la funcionalidad]

Después de explorar el código y entender el contexto, aquí van las alternativas:

### Opción 1: [Nombre descriptivo]
**Esfuerzo estimado:** Bajo/Medio/Alto

[2-4 frases describiendo la idea, el valor para el usuario y cómo se vería]

**Fortalezas:** [lista breve de 1-3 puntos]
**Contrapartidas:** [lista breve de 1-3 puntos]

### Opción 2: [Nombre descriptivo]
...
```

## Common Rationalizations (and Why They Fail)

| Rationalization | Why It's Wrong |
|---|---|
| "Ya conozco el código, no hace falta explorar" | El conocimiento que tienes puede estar desactualizado o incompleto. La exploración asegura que tus ideas se basan en la realidad actual del código. |
| "El usuario tiene prisa, mejor voy directo a las ideas" | Si no entiendes el problema, las ideas serán genéricas. Las preguntas toman 30 segundos y evitan ir por mal camino. |
| "Es una funcionalidad nueva, no hay código que explorar" | Siempre hay código relacionado: APIs similares, patrones existentes, componentes que integrar. Explorar evita sugerir algo inviable. |
| "Las preguntas son obvias, no hace falta hacerlas" | Lo obvio para ti puede no serlo. El usuario agradece que le preguntes. |
| "Es solo una idea, no necesito explorar tanto" | Las mejores ideas nacen del contexto. Sin exploración, son solo suposiciones. |
| "El usuario ya me dijo lo que quiere" | Dijo lo que quiere conseguir, no cómo quiere que sea. Las preguntas descubren matices. |

## Common Mistakes

| Mistake | How to Avoid |
|---|---|
| Proposing ideas without exploring code | Always run Step 2 first, especially for modifications |
| Skipping clarifying questions | Ask at least 1 question in Step 1 before ideating |
| Including implementation details | If you mention file paths, function names, or code patterns, stop and rephrase |
| Suggesting only one approach | Force yourself to find 3+ distinct options |
| Making assumptions about user's needs | The clarifying questions exist to avoid this |
| Using a robotic, questionnaire tone | Be conversational, not like filling a form |

## Red Flags — Stop and Self-Correct

If you notice any of these, stop and go back to the relevant step:

- 🔴 You're about to mention a specific file, function, or variable name → You're implementing, not brainstorming. Go back to Step 3.
- 🔴 You haven't explored the codebase yet and you're already proposing ideas → Go back to Step 2.
- 🔴 You only have one approach to suggest → Force yourself to find at least 2 more distinct options.
- 🔴 You're describing HOW instead of WHAT → Rephrase as user-facing capability.
- 🔴 You haven't asked the user anything about their needs → Go back to Step 1. Always.
- 🔴 You're combining brainstorming with implementation in the same response → Split them. Brainstorm first, implement later (with feature-ticket-creator).
- 🔴 You catch yourself thinking "this is simple enough to skip steps" → That's exactly when the skill is most needed.
