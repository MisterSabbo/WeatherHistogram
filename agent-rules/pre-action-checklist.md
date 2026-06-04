# Pre-Action Checklist

Verify in order before every task:

- [ ] **Read AGENTS.md** — all sections before any edit or action
- [ ] **Load relevant architecture doc** — see "Read on demand" table in `AGENTS.md` for the file you're editing
- [ ] **Never commit** — `git add` only. If asked to commit, stage and inform commits are disabled. Even if user says "yes" to a plan, ask specifically for commit authorization before executing.
- [ ] **Significant change?** (adds/removes files, modifies `src/app.js`, refactors architecture) → Update `CHANGELOG.md` + `src/data/changelog.js` + version in `index.html` + `public/version.json`
- [ ] **Adding UI strings?** → Add to both `es`/`en` in `src/utils/i18n.js`
- [ ] **Changing user-facing behavior?** → Update `README.md`
- [ ] **E2E fails after intentional changes?** → (1) update mock data in `tests/e2e/helpers/mock-data.js`, (2) add/modify tests, (3) `npx playwright test --update-snapshots` (Windows: npm intercepts --flag, use npx directly)
- [ ] **Complex task?** (3+ files across dirs, multiple architectural layers) → Delegate to subagent — see keyword→subagent table in `@agent-rules/subagents.md`
- [ ] **SDD applies?** → If modifying/creating code, check `agent-rules/spec-driven-development.md` for mode detection. Bugfix trivial (1 line, no behavior change) → skip SDD. Else → `Task(general + sdd-orchestrator)` with description
- [ ] **Respect SOLID** — SRP, OCP, LSP, ISP, DIP
- [ ] **All rendering goes through `render()`** — never draw to tile canvases outside it
- [ ] **Verify code** → `npm run lint && npm run typecheck && npm test && npm run test:e2e` — lint: 0 warnings, 0 errors
- [ ] **After changes** → `git diff --cached && git diff`, then propose commit message
- [ ] **Task done?** → `memory_add_observations` on relevant entities (see `@agent-rules/memory.md`)
- [ ] **Final audit** → Invoke `@project-auditor` to verify all rules followed
