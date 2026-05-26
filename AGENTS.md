# WeatherHistogram — Agent Guide

## Commands (order: lint → typecheck → test → test:e2e)
- `npm run dev` — Vite on port 3000
- `npm run build` — production build
- `npm run clean` — uses `rm -rf dist` (fails on Windows; use `Remove-Item -Recurse -Force dist`)
- `npm run lint` — ESLint on `src/` (CI uses `--max-warnings 0`)
- `npm run typecheck` — TypeScript JSDoc check (`tsc --noEmit`)
- `npm test` — Vitest unit tests (jsdom, files: `src/**/*.test.js`)
- `npm run test:watch` — Vitest watch mode
- `npm run test:e2e` — Playwright (Chromium headless, auto-starts dev server on port 3000)
- `npm run test:e2e -- --update-snapshots` — regenerate E2E screenshot baselines

## Architecture
- **Vanilla JS SPA** — no framework. Vite + JSDoc types (`tsconfig.json`: `checkJs: true`, `strict: false`). `@` alias → project root.
- **Entrypoint:** `src/app.js` — orchestrator with ~28 init functions. Only touch for wiring new inits or event bindings.
- **State:** single mutable `state` object + frozen `CONFIG` in `src/store.js`. No events/pub-sub — modules read/write `state` directly.
- **Rendering:** tiled canvas, three layers in `#chart-area`. **All drawing goes through `render()`** — never draw to tile canvases outside it.
- **CI** (`.github/workflows/ci.yml`): Node 22, runs lint → typecheck → test → e2e.

## Conventions
- **NEVER commit.** Stage with `git add` only. If asked to commit, stage and inform commits are disabled.
- **i18n:** add UI strings to both `es`/`en` in `src/utils/i18n.js`.
- **Changelog:** update `CHANGELOG.md` + `src/data/changelog.js` (English) + version (`index.html` `#app-version-label` + `public/version.json`). Semver `X.Y.Z`; letter suffix for trivial (resets when X/Y/Z changes).
- **README:** update if documented features or setup change.
- **SOLID principles** — SRP, OCP, LSP, ISP, DIP.
- **E2E:** add/update mock data in `tests/e2e/helpers/mock-data.js` first, then tests in `tests/e2e/interaction/` or `tests/e2e/visual/`. Snapshots use `maxDiffPixelRatio: 0.07`.
- **After changes:** run `git diff --cached` and `git diff`, propose commit message.
- **Final verification:** invoke `@project-auditor`.

## Key facts an agent would miss
- **`npm run clean` is Unix-only** — the `rm -rf` command fails on Windows.
- **Service Worker** (`sw.js`): cache-first for static assets, stale-while-revalidate for others. API calls (open-meteo, openstreetmap) deliberately not intercepted.
- **PWA standalone detection:** checks `display-mode: standalone` / `navigator.standalone` and adds `pwa-standalone` class to `<html>` at init.
- **All rendering through `render()`** — off-screen tiles are skipped via a `drawn` flag. `scroll` event on `#scroll-container` calls `render()` throttled via `requestAnimationFrame`.
- **`CONFIG`** frozen in `src/store.js`: `CHART_HEIGHT` (250), `MINIMAP_HEIGHT` (80), `TILE_WIDTH` (1440; mobile 720 override in app.js), `CACHE_DURATION` (5 min), `DEFAULT_COORDS` (Madrid), `PIXELS_PER_MM` (10). `PIXELS_PER_HOUR` (60/50 based on width) is on `state`, not CONFIG.
- **ESLint** config uses `@eslint/js` recommended + `globals` for browser/ES2021. `L` (Leaflet) is a global. Ignores `dist/`, `node_modules/`, `public/`.
- **Vitest** config: jsdom env, includes `src/**/*.test.js`, `passWithNoTests: true`.
- **Playwright** config: single worker, `fullyParallel: false`, auto-starts dev server, 2% screenshot tolerance.
- **Themes** (`src/theme.js`): built-in `default`, `neon`, `pastel`. Loaded from `public/themes/{id}.json` with fallback to `themes/{id}.json`.

## Agent-rules (loaded via `opencode.json` instructions — read on demand, not preemptively)
- `agent-rules/core-workflow.md` — essential workflow context
- `agent-rules/architecture-*.md` — rendering, services, UI docs
- `agent-rules/build-config.md` — build, test, lint details
- `agent-rules/e2e-testing.md` — Playwright workflow and snapshot management
- `agent-rules/key-interactions.md` — pull-to-refresh, scroll rendering, PWA, view mode, etc.
- `agent-rules/defaults-constants.md` — all hardcoded dimensions and values
- `agent-rules/theme-i18n.md` — theme switching and i18n patterns
- `agent-rules/pre-action-checklist.md` — mandatory steps before every task
- `agent-rules/memory.md` — MCP memory persistence workflow
- `agent-rules/subagents.md` — when to use subagents
- `agent-rules/spec-driven-development.md` — SDD workflow orchestration

## SDD Workflow
- **Orquestador:** `Task(general + sdd-orchestrator)` — acepta cualquier input (ruta de módulo, user story, feature request) y ejecuta SDD completo automáticamente.
- **Roles SDD:** definidos en `.agents/skills/sdd-orchestrator/` — analyst, spec-writer, spec-reviewer, test-writer, implementer, verifier.
- **Modos:** `spec-retro` (código existente sin spec), `spec-first` (feature nueva), `spec-update` (cambio sobre spec existente), `spec-crawl` (directorio completo o todo el proyecto), `feature` (desglose automático de user stories).
- **Especs vivas en `specs/`:** mirror de `src/`. Plantilla en `specs/_template.md`.
