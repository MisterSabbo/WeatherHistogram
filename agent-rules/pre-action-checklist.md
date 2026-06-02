# Pre-Action Checklist

Before every task, verify these rules **in order**:

- [ ] **Read AGENTS.md** — Read all sections before making any edit or taking any action
- [ ] **Checked relevant architecture docs?** → Load the doc that matches the area you're changing, before editing code:

    | If editing... | Load... |
    |---|---|
    | `src/render/*` | `architecture-rendering.md`, `key-interactions.md` |
    | `src/services/*`, `src/domain/*` | `architecture-services.md` |
    | `src/ui/*` | `architecture-ui.md` |
    | `src/app.js` | `architecture-rendering.md`, `architecture-ui.md`, `key-interactions.md` |
    | `store.js`, `CONFIG` | `defaults-constants.md` |
    | build/test/CI config | `build-config.md` |
    | theme/i18n changes | `theme-i18n.md` |
- [ ] **Never commit** — Only `git add`. If asked to commit, stage and inform commits are disabled. **Even if the user says "yes" to a plan that includes committing, you must still ask specifically for commit authorization before executing it.**
- [ ] **Significant change?** → Update `CHANGELOG.md` + `src/data/changelog.js` + version in `index.html` + `public/version.json`. Consider significant any change that: adds or removes files, modifies `src/app.js`, or refactors architecture (modules, services, rendering, data flow)
- [ ] **Adding UI strings?** → Add to both `es`/`en` in `src/utils/i18n.js`
- [ ] **Changing documented behavior?** → Update `README.md`. Consider documented behavior any change that adds or modifies user-facing features (visible UI, interactions, modals)
- [ ] **E2E snapshot or test update?** → If `npm run test:e2e` fails due to intentional changes: (1) update mock data in `tests/e2e/helpers/mock-data.js` if API fields changed, (2) add/modify tests in `tests/e2e/interaction/` or `tests/e2e/visual/`, (3) regenerate snapshots with `npm run test:e2e -- --update-snapshots`
- [ ] **Complex task?** → Evaluate if a subagent is better suited (see @agent-rules/subagents.md). Consider a subagent when the task involves 3+ files across different directories, or spans multiple architectural layers (services + UI + rendering). Keywords that trigger subagent evaluation:

    | If task mentions... | Consider subagent |
    |---|---|
    | `explore`, `find`, `search files`, `investigate code`, `look for` | `explore` |
    | `complex`, `multi-step`, `refactor`, `migration`, `large task` | `general` |
    | `Android`, `Chrome Android`, `touch Android`, `WebView` | `android-web-adaptor` |
    | `iOS`, `Safari`, `iPhone`, `iPad`, `notch`, `Dynamic Island`, `safe area` | `ios-pwa-reviewer` |
    | `responsive`, `mobile-first`, `mobile layout`, `viewport`, `touch target` | `mobile-first-reviewer` |
    | `PWA audit`, `service worker`, `manifest`, `offline`, `install prompt` | `pwa-auditor` |
    | `PWA dual`, `standalone mode`, `browser vs PWA` | `pwa-dual-mode-verifier` |
    | `docs`, `documentation`, `README`, `write docs` | `docs-writer` |
    | `new skill`, `create skill`, `skill for` | `skill-creator` |
- [ ] **SDD check** — If the task involves modifying or creating code, check if SDD applies:

    | Situation | Action |
    |---|---|
    | Feature nueva sin código | Invocar orquestador SDD — detecta `full` automáticamente |
    | Cambio en módulo existente con spec | Invocar orquestador SDD — detecta `full` automáticamente |
    | Cambio en módulo existente SIN spec | Invocar orquestador SDD — detecta `spec` automáticamente |
    | User story sin detalles técnicos | Invocar orquestador SDD — detecta `full` automáticamente |
    | Directorio completo o todo el proyecto | Invocar orquestador SDD — detecta `crawl` automáticamente |
    | Bugfix trivial (1 línea, sin cambio de comportamiento) | Saltar SDD, ir directo a implementación |

    > Para invocar: `Task(general + sdd-orchestrator)` con la descripción de lo que se quiere hacer.
    > El orquestador detecta el modo automáticamente.

- [ ] **Respect SOLID principles** — SRP, OCP, LSP, ISP, DIP
- [ ] **All rendering goes through `render()`** — never draw to tile canvases outside this function
- [ ] **Verify code** → Run `npm run lint && npm run typecheck && npm test && npm run test:e2e` — **lint must report 0 warnings and 0 errors** before proceeding
- [ ] **After changes** → Run `git diff --cached` and `git diff`, then propose commit message
- [ ] **Task done?** → `memory_add_observations` on relevant entities summarizing what changed, issues, and next step (see @agent-rules/memory.md)
- [ ] **Final audit** → Invoke `@project-auditor` to verify all rules were followed
