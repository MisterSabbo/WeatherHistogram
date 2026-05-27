# WeatherHistogram — Agent Guide

## Commands (order: lint → typecheck → test → test:e2e)
- `npm run dev` — Vite on port 3000
- `npm run build` — production build
- `npm run clean` — `rm -rf dist` (fails on Windows; use `Remove-Item -Recurse -Force dist`)
- `npm run lint` — ESLint on `src/` (CI uses `--max-warnings 0`)
- `npm run typecheck` — `tsc --noEmit` (excludes `src/**/*.test.js`)
- `npm test` — Vitest unit tests (jsdom, `src/**/*.test.js`, `passWithNoTests: true`)
- `npm run test:e2e` — Playwright (Chromium, single worker, webServer auto-starts dev on :3000, 7% pixel diff)
- `npm run test:e2e -- --update-snapshots` — regenerate E2E screenshot baselines

## Architecture
- **Vanilla JS SPA** — no framework. Vite + JSDoc types (`tsconfig.json`: `checkJs: true`, `strict: false`). `@` alias → project root.
- **Entrypoint:** `src/app.js` — orchestrator with ~30 init functions. Only touch for wiring new inits or event bindings.
- **State:** single mutable `state` object + frozen `CONFIG` in `src/store.js`. No events/pub-sub — modules read/write `state` directly.
- **Rendering:** tiled canvas, three layers in `#chart-area`. **All drawing goes through `render()`** — never draw to tile canvases outside it.
- **PWA:** `sw.js` — cache-first for static assets, stale-while-revalidate for others. API calls (open-meteo, openstreetmap, fonts.googleapis/gstatic) and `/version.json` (iOS 18 Cache API bug) deliberately not intercepted. Offline fallback at `./offline.html`.
- **PWA standalone:** `display-mode: standalone` / `navigator.standalone` → adds `pwa-standalone` class to `<html>`.
- **CI** (`.github/workflows/ci.yml`): Node 22, runs lint → typecheck → test → e2e.

## Config & constants
- **`CONFIG`** (frozen in `src/store.js`): `CHART_HEIGHT: 250`, `MINIMAP_HEIGHT: 80`, `TILE_WIDTH: 1440` (mobile 720 override in app.js), `CACHE_DURATION: 5 min`, `DEFAULT_COORDS: Madrid`, `PIXELS_PER_MM: 10`. `PIXELS_PER_HOUR` (60/50 based on width) is on `state`, not CONFIG.
- **Themes** (`src/theme.js`): built-in `default`, `neon`, `pastel`. Loaded from `public/themes/{id}.json` with fallback to `themes/{id}.json`.
- **ESLint:** `@eslint/js` recommended + browser/ES2021 globals. `L` (Leaflet) is global. Ignores `dist/`, `node_modules/`, `public/`.
- **Vitest:** jsdom env, includes `src/**/*.test.js`, `passWithNoTests: true`.
- **Playwright:** `workers: 1`, `fullyParallel: false`, `maxDiffPixelRatio: 0.07`.
- **CSP** (`index.html`): permissive — allows `unsafe-inline`, `unsafe-eval`, unpkg CDN for Leaflet, open-meteo/openstreetmap API connections.

## Conventions
- **NEVER commit.** Stage with `git add` only. Inform commits are disabled if asked.
- **i18n:** add UI strings to both `es`/`en` in `src/utils/i18n.js`.
- **Changelog:** update `CHANGELOG.md` + `src/data/changelog.js` (embedded JS, not fetched) + version (`index.html` `#app-version-label` + `public/version.json`). Semver `X.Y.Z`; letter suffix for trivial (resets when X/Y/Z changes).
- **E2E:** add/update mock data in `tests/e2e/helpers/mock-data.js` first, then tests in `tests/e2e/interaction/` or `tests/e2e/visual/`.
- **README:** update if documented features or setup change.

## Agent-rules (referenced by `opencode.json` — only 3 auto-loaded, rest read on demand)
**Auto-loaded** via `opencode.json` `instructions`:
- `agent-rules/subagents.md` — when to use subagents
- `agent-rules/memory.md` — MCP memory persistence workflow
- `agent-rules/pre-action-checklist.md` — mandatory steps before every task

**Read on demand** when editing specific areas:
- `agent-rules/core-workflow.md` — install, run, entry point, init functions
- `agent-rules/architecture-*.md` — rendering, services, UI docs
- `agent-rules/build-config.md` — build, test, lint details
- `agent-rules/e2e-testing.md` — Playwright workflow and snapshot management
- `agent-rules/key-interactions.md` — pull-to-refresh, scroll rendering, PWA, view modes
- `agent-rules/defaults-constants.md` — all hardcoded dimensions and values
- `agent-rules/theme-i18n.md` — theme switching and i18n patterns
- `agent-rules/spec-driven-development.md` — SDD workflow orchestration
