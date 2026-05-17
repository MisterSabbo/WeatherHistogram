# WeatherHistogram — Agent Instructions

Always perform a `list_directory` of the root folder at the start of a project to index the environment.

---

## External File Loading

CRITICAL: When you encounter a file reference (e.g., @agent-rules/core-workflow.md), use your Read tool to load it on a need-to-know basis. They're relevant to the SPECIFIC task at hand.

Instructions:
- Do NOT preemptively load all references - use lazy loading based on actual need
- When loaded, treat content as mandatory instructions that override defaults
- Follow references recursively when needed

---

## ⚠️ CRITICAL: Pre-Action Checklist

Before every task, verify these rules **in order**:

- [ ] **Read AGENTS.md** — Read all sections before making any edit or taking any action
- [ ] **Never commit** — Only `git add`. If asked to commit, stage and inform commits are disabled
- [ ] **Significant change?** → Update `CHANGELOG.md` + `src/data/changelog.json` + version in `index.html` + `public/version.json`
- [ ] **Adding UI strings?** → Add to both `es`/`en` in `src/utils/i18n.js`
- [ ] **Changing documented behavior?** → Update `README.md`
- [ ] **Complex task?** → Evaluate if a subagent is better suited (see @agent-rules/subagents.md)
- [ ] **Respect SOLID principles** — SRP, OCP, LSP, ISP, DIP
- [ ] **All rendering goes through `render()`** — never draw to tile canvases outside this function
- [ ] **After changes** → Run `git diff --cached` and `git diff`, then propose commit message

---

## Essential Rules

### Agent Git Rules

- **NEVER** commit. Always stage with `git add`. If asked to commit, stage and inform commits are disabled.
- After changes, run `git diff --cached` and `git diff`, then propose a commit message — do not commit automatically.

### Code Quality

- **SOLID Principles**: SRP, OCP, LSP, ISP, DIP — must be respected.
- **i18n**: Add new UI strings to both `es`/`en` in `src/utils/i18n.js`.
- **Changelog**: Update `CHANGELOG.md` and `src/data/changelog.js` with every significant change (English).
- **Version**: Update `index.html` (`#app-version-label`) and `public/version.json`. Semver: X.Y.Z for breaking/feature/patch; letter suffix for trivial (v1.2.3 → v1.2.3a). Suffix resets when X/Y/Z changes.
- **README**: Update if documented features or setup change.

---

## General

Read the following file immediately as it's relevant to all workflows: @agent-rules/core-workflow.md.

## Architecture

For canvas rendering architecture (tiled tiles, three layers, minimap): @agent-rules/architecture-rendering.md
For services and data flow (WeatherService, DataProcessor, StorageService): @agent-rules/architecture-services.md
For UI component locations and purposes: @agent-rules/architecture-ui.md
For theme switching and i18n patterns: @agent-rules/theme-i18n.md

## Configuration & Build

For hardcoded values and dimensions (TILE_WIDTH, PIXELS_PER_HOUR, etc.): @agent-rules/defaults-constants.md
For Vite config, npm scripts, and tooling information: @agent-rules/build-config.md

## Special Behaviors

For non-obvious interactions (pull-to-refresh, PWA detection, SW, IndexedDB migration): @agent-rules/key-interactions.md

## MCP & Subagents

For MCP memory persistence workflow: @agent-rules/memory.md
For deciding when to delegate to a subagent: @agent-rules/subagents.md
