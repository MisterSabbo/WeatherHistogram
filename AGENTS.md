# WeatherHistogram — Agent Guide

## Commands (order: lint → typecheck → test → test:e2e)
- `npm install` — install dependencies (CI uses `npm ci`)
- `npm run dev` — Vite on port 3000
- `npm run build` — production build
- `npm run clean` — `rm -rf dist` (fails on Windows; use `Remove-Item -Recurse -Force dist`)
- `npm run lint` — ESLint on `src/` (CI uses `--max-warnings 0`)
- `npm run typecheck` — `tsc --noEmit`
- `npm test` — Vitest unit tests (jsdom, `passWithNoTests: true`)
- `npm run test:e2e` — Playwright (Chromium, single worker, webServer auto-starts dev on :3000, 7% pixel diff). Pre-requisite: `npx playwright install --with-deps chromium`
- `npx playwright test --update-snapshots` — regenerate E2E screenshot baselines (Windows: npm intercepts the flag, use npx directly)

## Architecture
- **Vanilla JS SPA** — no framework. Vite + JSDoc types (`tsconfig.json`: `checkJs: true`, `strict: false`). `@` alias → project root.
- **Entrypoint:** `src/app.js` — orchestrator with init functions. Only touch for wiring new inits or event bindings.
- **CSS:** `src/style.css` is an `@import` index of 8 modules in `src/styles/` — edit the modules, not the index.
- **State:** single mutable `state` object + frozen `CONFIG` in `src/store.js`. No events/pub-sub — modules read/write `state` directly.
- **Rendering:** tiled canvas, three layers in `#chart-area`. **All drawing goes through `render()`** — never draw to tile canvases outside it.
- **PWA:** `sw.js` — cache-first for static assets, stale-while-revalidate for others. API calls (open-meteo, openstreetmap, fonts.googleapis/gstatic) and `/version.json` (iOS 18 Cache API bug) deliberately not intercepted. Offline fallback at `./offline.html`.
- **PWA standalone:** `display-mode: standalone` / `navigator.standalone` → adds `pwa-standalone` class to `<html>`.
- **CI** (`.github/workflows/ci.yml`): Node 24, runs lint → typecheck → test → e2e.

## Config & constants
- **`CONFIG`** (frozen in `src/store.js`): `CHART_HEIGHT: 250`, `MINIMAP_HEIGHT: 80`, `TILE_WIDTH: 1440` (mobile 720 override in app.js), `CACHE_DURATION: 5 min`, `DEFAULT_COORDS: Madrid`, `PIXELS_PER_MM: 10`. `PIXELS_PER_HOUR` (60/50 based on width) is on `state`, not CONFIG.
- **Themes** (`src/theme.js`): built-in `default`, `neon`, `pastel`. Loaded from `public/themes/{id}.json` with fallback to `themes/{id}.json`.

## Conventions
- **NEVER commit.** Stage with `git add` only. Inform commits are disabled if asked.
- **i18n:** add UI strings to both `es`/`en` in `src/utils/i18n.js`.
- **Changelog:** update `CHANGELOG.md` + `src/data/changelog.js` (embedded JS, not fetched) + version (`index.html` `#app-version-label` + `public/version.json`). Semver `X.Y.Z`; letter suffix for trivial (resets when X/Y/Z changes).
- **E2E:** add/update mock data in `tests/e2e/helpers/mock-data.js` first, then tests in `tests/e2e/interaction/` or `tests/e2e/visual/`. Snapshot path: `{testFileDir}/{testFileName}-snapshots/{arg}{ext}`.
- **README:** update if documented features or setup change.

## Agent-rules (referenced by `opencode.json` — only 3 auto-loaded, rest read on demand)
**Auto-loaded** via `opencode.json` `instructions`:
- `agent-rules/subagents.md` — when to use subagents
- `agent-rules/memory.md` — MCP memory persistence workflow
- `agent-rules/pre-action-checklist.md` — mandatory steps before every task
- `agent-rules/repository-language.md` — English-only policy for all repo files

**Read on demand** when editing specific areas:
- `agent-rules/build-and-workflow.md` — install, run, entry point, build config, lint, test commands
- `agent-rules/architecture-*.md` — rendering, services, UI docs
- `agent-rules/architecture-rendering.md` — rendering pipeline, scroll, PWA interactions, view modes
- `agent-rules/e2e-testing.md` — Playwright workflow and snapshot management
- `agent-rules/config-and-theming.md` — hardcoded dimensions, constants, theme switching, i18n patterns
- `agent-rules/spec-driven-development.md` — SDD workflow orchestration
