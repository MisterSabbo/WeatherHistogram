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

The full pre-action checklist is in @agent-rules/pre-action-checklist.md — loaded automatically at session start via `opencode.json` instructions. Refer to it before every task.

**After completing changes: invoke `@project-auditor` to verify compliance.**

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

## Testing

For E2E testing workflow (Playwright, mock data, snapshot management): @agent-rules/e2e-testing.md

## Special Behaviors

For non-obvious interactions (pull-to-refresh, PWA detection, SW, IndexedDB migration): @agent-rules/key-interactions.md

## MCP & Subagents

Already loaded at session start via `opencode.json` — see @agent-rules/memory.md and @agent-rules/subagents.md.
