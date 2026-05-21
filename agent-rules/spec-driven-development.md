### Spec-Driven Development (SDD)

El proyecto sigue SDD: **todo cambio de comportamiento empieza por la spec**.

#### Invocación

Usa el orquestador SDD para cualquier tarea relacionada con specs:

```bash
# Task(general + sdd-orchestrator)
#   "SDD para src/utils/color.js"          → modo spec-retro
#   "Añade exportar datos guardados"        → modo feature (desglose automático)
#   "Nuevo servicio de alertas"             → modo spec-first
#   "Añade hslToRgb a color.js"             → modo spec-update
```

El orquestador decide el modo automáticamente y ejecuta todas las fases.

#### Modos

| Modo | Cuándo | Fases |
|------|--------|-------|
| `spec-retro` | Código existe, NO hay spec | ANALYZE → SPEC → REVIEW → TEST → VERIFY |
| `spec-first` | Feature nueva, NO hay código | SPEC → REVIEW → TEST → IMPLEMENT → VERIFY |
| `spec-update` | Código existe + spec existe, cambia comportamiento | ANALYZE → UPDATE SPEC → REVIEW → UPDATE TESTS → IMPLEMENT → VERIFY |
| `spec-crawl` | Varios módulos existentes sin spec (directorio o proyecto completo) | SCAN → SORT → [spec-retro por módulo] |
| `feature` | User story sin detalles técnicos | FEATURE BREAKDOWN → [unidades SDD] |

#### ¿Qué módulos tienen spec?

Revisar el directorio `specs/`. Si un módulo no tiene spec ahí, no está spec'ado.

#### ¿Cómo escribir una spec manualmente?

Usar `specs/_template.md` como guía. Las specs van en `specs/` reflejando la estructura de `src/`:

```
src/utils/color.js → specs/utils/color.md
src/app.js         → specs/app.md
```

#### Skills SDD

El orquestador y sus roles están definidos en `.agents/skills/sdd-orchestrator/`:

| Skill | Rol |
|-------|-----|
| `SKILL.md` | Orquestador principal |
| `agent-sdd-feature-breakdown.md` | Desglose de user stories → plan técnico |
| `agent-sdd-analyst.md` | Análisis de código existente |
| `agent-sdd-spec-writer.md` | Redacción de specs |
| `agent-sdd-spec-reviewer.md` | Revisión de specs vs código |
| `agent-sdd-test-writer.md` | Generación de tests desde specs |
| `agent-sdd-implementer.md` | Implementación desde specs |
| `agent-sdd-verifier.md` | Verificación (test + lint + typecheck + build) |
