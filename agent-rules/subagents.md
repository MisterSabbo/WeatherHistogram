### Subagent Consideration

Before responding, evaluate if a subagent (`explore`, `general`, `android-web-adaptor`, `ios-pwa-reviewer`, `mobile-first-reviewer`, `pwa-auditor`, `pwa-dual-mode-verifier`, `docs-writer`, `skill-creator`) is better suited. If uncertain, ask the user.

### SDD Orchestration

For Spec-Driven Development tasks, use the SDD orquestrator:

```bash
Task(general + sdd-orchestrator) → "descripción de lo que quieres hacer"
```

The orquestrator automatically detects the mode (`spec-retro`, `spec-first`, `spec-update`, `feature`) and runs all phases. See `agent-rules/spec-driven-development.md` for details.
