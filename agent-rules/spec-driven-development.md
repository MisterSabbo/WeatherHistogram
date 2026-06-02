### Spec-Driven Development (SDD)

El proyecto sigue SDD inspirado en GitHub Spec Kit: **todo cambio de comportamiento empieza por la spec**. La constitución define las reglas del proyecto.

#### Invocación

Usa el orquestador SDD para cualquier tarea relacionada con specs:

```bash
# Task(general + sdd-orchestrator)
#   "SDD para src/utils/color.js"            → modo spec (documentar existente)
#   "Añade exportar datos guardados"          → modo full (ciclo completo)
#   "Crea src/services/AlertService.js"       → modo full (nuevo módulo)
#   "Añade hslToRgb a color.js"               → modo full (actualizar)
#   "SDD para src/utils/"                     → modo crawl (bulk directorio)
#   "full: src/utils/color.js"                → modo forzado
```

El orquestador detecta el modo automáticamente según el input.

#### Modos

| Modo | Cuándo | Fases |
|------|--------|-------|
| `spec` | Código existe, NO hay spec | CONSTITUTION (check) → SPECIFY |
| `full` | Feature nueva, user story, o actualización | CONSTITUTION → SPECIFY → PLAN → IMPLEMENT |
| `crawl` | Varios módulos sin spec (directorio o proyecto completo) | SCAN → SORT → [spec o full por módulo] |

#### Ubicación de archivos

```
memory/constitution.md          → principios y reglas del proyecto
specs/utils/color.md            → spec del módulo
plans/export-csv/plan.md        → plan técnico de un feature
plans/export-csv/tasks.md       → desglose de tareas del feature
```

#### Skills SDD

El orquestador y sus roles están definidos en `.agents/skills/sdd-orchestrator/`:

| Skill | Rol |
|-------|------|
| `SKILL.md` | Orquestador principal — detecta modo y ejecuta fases |
| `agent-constitution.md` | Crea/actualiza `memory/constitution.md` |
| `agent-specify.md` | Analiza código y escribe specs (retro, first, update) |
| `agent-plan.md` | Crea plan técnico + desglose de tareas |
| `agent-implement.md` | Escribe tests → implementa código → verifica |
