# WeatherHistogram Constitution

## Core Principles

### I. Vanilla JS SPA
No frameworks. Vite + vanilla HTML/CSS/JS. JSDoc types with `checkJs: true`, `strict: false`. `@` alias maps to project root.

### II. Single Mutable State
Single mutable `state` object + frozen `CONFIG` in `src/store.js`. No events/pub-sub — modules read/write `state` directly. `PIXELS_PER_HOUR` is on `state` (not CONFIG) because it's dynamic based on viewport width.

### III. Rendering Pipeline
All drawing goes through `render()`. Never draw to tile canvases outside this function. Three canvas layers in `#chart-area`: (1) tile canvases, (2) fixed-overlay-canvas, (3) stickman-canvas. Minimap has its own cached render.

### IV. PWA First
Service worker with cache-first for static assets, stale-while-revalidate for others. API calls (open-meteo, openstreetmap, fonts.googleapis/gstatic) and `/version.json` deliberately not intercepted. Offline fallback at `./offline.html`.

### V. i18n
All UI strings added to both `es` and `en` in `src/utils/i18n.js`. Use `data-i18n`/`data-i18n-title`/`data-i18n-placeholder` for HTML translations, `t('key')` in JS.

### VI. Change Tracking
Changelog updated in `CHANGELOG.md` + `src/data/changelog.js` + version bumped in `index.html` (`#app-version-label`) + `public/version.json`. Semver `X.Y.Z`; letter suffix for trivial changes (resets when X/Y/Z changes).

### VII. Repository Language
All repository files must be written in English — code identifiers, comments, commit messages, documentation, config files, and asset naming. The only exceptions are explicit locale translations (e.g. i18n entries, locale-specific JSON).

### VIII. Never Commit Directly
Stage with `git add` only. If asked to commit, inform that commits are disabled.

### IX. Module Boundaries
- `src/utils/` — pure functions, no side effects, no state access
- `src/services/` — async I/O (fetch, IndexedDB, localStorage), read/write state
- `src/domain/` — business logic, orchestrates services (e.g. `WeatherFetcher.js`)
- `src/ui/` — DOM manipulation, event handlers, modal logic
- `src/render/` — canvas drawing functions, only called from `render()`
- `src/store.js` — state + CONFIG definition
- `src/data/` — static data files (changelog, skins)
- `src/app.js` — init orchestration and event wiring. Only touch for wiring new inits or event bindings. Do NOT duplicate logic already extracted to modules.

## Coding Standards

### Conventions
- **Naming:** camelCase for variables/functions, PascalCase for classes. File names match export name (e.g. `StorageService.js` exports `storageService`).
- **File structure:** One concern per file. Test files co-located as `*.test.js` alongside source.
- **Imports:** ES module `import`/`export`. Use `@` alias for project root imports (e.g. `import { state } from '@/src/store.js'`).
- **CSS:** `src/style.css` is an `@import` index of 8 modules in `src/styles/`. Edit the modules, not the index.

### ESLint Rules
- `no-unused-vars` is **error** — prefix unused params with `_` (`argsIgnorePattern: '^_'`, `varsIgnorePattern: '^_'`).
- `prefer-const` is **error** — never use `let` for variables that aren't reassigned.
- `no-empty` allows `catch {}` (ES2019+) — use bare `catch {}` instead of `catch(e) {}`.
- Lint must have 0 warnings, 0 errors (CI uses `--max-warnings 0`).

### Error Handling
- Use try/catch with `console.error` for logging.
- For async operations, prefer `try/catch` over `.catch()` chains.
- Show user-facing errors via `showError()` in app.js or DOM updates.
- Use bare `catch {}` for non-critical operations where failure is acceptable.

### Async Patterns
- Fetch workflows with cache, timeout, and fallback (see `src/domain/WeatherFetcher.js`).
- Geolocation uses Promise wrapper with timeout (see `getPosition()` in app.js).
- Init functions in app.js are async where needed, serialized in `init()`.

### DOM Manipulation
- Use `document.getElementById()` for known elements, `querySelector`/`querySelectorAll` for dynamic lookups.
- Bottom sheets use `openBottomSheet()`/`closeBottomSheet()` pattern.
- Collapsible sections use `.collapsible-trigger` / `.collapsible` / `.open` pattern.

## Architecture Rules

### Data Flow
1. **Fetch:** `app.js:loadWeather()` → `fetchWeatherData()` (domain) → API via `WeatherService` → raw data in `state.rawForecast`/`state.rawAQI`
2. **Process:** `processData()` (DataProcessor) → `state.hourlyData`, `state.dailyData`, `state.sunData`
3. **Render:** `render()` → tile iteration → `drawTile()` per visible tile → individual render functions
4. **Fixed overlay:** `drawFixedOverlay()` called from `render()` and pulse loop — scrubber labels, stickman, weather zone
5. **Minimap:** `MinimapRenderer` with own cached canvas, auto-switches past/future mode

### Rendering Rules
- Tiled canvas: `TILE_WIDTH` is 1440px (desktop >=600px) or 720px (mobile). Each tile is an independent `<canvas>`.
- Only visible tiles in the viewport are drawn via `drawn` flag.
- On resize (`handleResize`): clear all tiles, recalculate dimensions, redraw.
- `drawFixedOverlay()` has custom label collision detection via `state.labelRects` — reset each frame.
- Theme changes (`toggleTheme`) invalidate all tile caches (`tile.drawn = false`) and re-render.

### PWA
- Detected via `display-mode: standalone` / `navigator.standalone` → adds `pwa-standalone` class to `<html>`.
- SW registration in app.js via `registerSW()` with update callback.
- `checkAppVersion()` compares version.json from network.

### Scroll & Interaction
- Scroll-driven rendering: `scroll` event on `#scroll-container` calls `render()` via `requestAnimationFrame`.
- Minimap click-to-scroll: `minimapRenderer.handleClick()` sets `scrollContainer.scrollLeft`.
- Pointer drag for mouse, touch events for mobile — both fire `state.isDragging` / `render()`.
- Pull-to-refresh: `src/ui/PullToRefresh.js` — touch drag-down gesture.

### View Modes
- Two view modes: minimap (default) and daily cards (`state.isDailyCardsView`).
- Toggled via `toggle-nav-btn`. Persisted as `viewMode` in StorageService.

## Testing Standards

### Unit Tests (Vitest)
- **Framework:** Vitest with jsdom environment.
- **Location:** `*.test.js` files co-located with source files (e.g. `src/store.test.js`, `src/utils/color.test.js`).
- **Coverage:** `passWithNoTests: true` — no minimum coverage threshold, but all code paths should be tested.
- **Command:** `npm test` (vitest run), `npm run test:watch` (vitest watch).

### E2E Tests (Playwright)
- **Suite location:** `tests/e2e/` — Chromium headless, single worker.
- **Mock data:** Deterministic seeded random in `tests/e2e/helpers/mock-data.js`. All Open-Meteo API calls intercepted via `page.route()`.
- **Categories:**
  - `tests/e2e/interaction/` — button clicks, modal open/close, toggle switches
  - `tests/e2e/visual/` — screenshot comparisons (full-page or element-specific)
- **Snapshots:** Stored alongside each spec file (e.g. `tests/e2e/visual/app.spec.js-snapshots/`).
- **Tolerance:** `maxDiffPixelRatio: 0.02` (2%) in playwright.config.ts.
- **Commands:**
  - `npm run test:e2e` — run all tests (compare against stored snapshots)
  - `npm run test:e2e -- --update-snapshots` — run and overwrite snapshots

### Testing Workflow
- When adding new feature: update mock data first, then add tests, then implement.
- When E2E fails after intentional changes: (1) update mock data, (2) add/modify tests, (3) `--update-snapshots`.
- Tests must pass before code is considered complete.

## Spec-Driven Development Rules

### File Locations
- Constitution: `memory/constitution.md`
- Specs: `specs/<relative-path>.md` (e.g. `specs/utils/color.md`, `specs/src/render/MinimapRenderer.md`)
- Plans: `plans/<feature-name>/plan.md` + `plans/<feature-name>/tasks.md`

### SDD Phase Order
1. **Constitution** — verify project principles are current
2. **Specify** — define WHAT, not HOW. Mark ambiguity with `[NEEDS CLARIFICATION]`
3. **Plan** — technical decisions + task breakdown
4. **Implement** — tests first, then code, then verify

### SDD Modes
| Mode | When | Phases |
|------|------|--------|
| `spec` | Existing code, no spec | Constitution (check) → Specify |
| `full` | New feature, user story, or update | Constitution → Specify → Plan → Implement |
| `crawl` | Multiple modules without specs (directory or project-wide) | Scan → Sort → [spec or full per module] |

### Quality Gates
- `[NEEDS CLARIFICATION]` markers must be resolved before planning
- Tests must pass before code is considered complete
- Lint must have 0 warnings, 0 errors
- Typecheck must pass (`tsc --noEmit`)
- Build must succeed (`npm run build`)
- E2E snapshots must match (run `--update-snapshots` after intentional changes)
- Final audit: invoke `@project-auditor` to verify all rules followed

## Agent Workflow Rules

### Pre-Action Checklist (before every task)
1. Read AGENTS.md — all sections before any edit or action
2. Load relevant architecture doc for the file being edited
3. Never commit — `git add` only
4. Significant change? Update CHANGELOG.md, src/data/changelog.js, version in index.html + public/version.json
5. Adding UI strings? Add to both es/en in src/utils/i18n.js
6. Changing user-facing behavior? Update README.md
7. E2E fails after changes? Update mock data → modify tests → --update-snapshots
8. Complex task? Delegate to subagent
9. SDD applies? Check spec-driven-development rules
10. Respect SOLID principles
11. All rendering goes through `render()`
12. Verify code: lint → typecheck → test → e2e
13. After changes: git diff --cached && git diff, then propose commit message
14. Task done? Update memory (MCP server)

### Memory Persistence (MCP Server)
1. On session start: `search_nodes` / `read_graph` to load context
2. On creating components: `create_entities` + `create_relations`
3. On task done: `add_observations` summarizing what was implemented, issues, and next step
4. File/memory conflicts: prioritize memory data, consult user before destructive changes
5. Don't mark "Complete" until memory server is updated

### Subagent Delegation
- Complex tasks (3+ files across dirs, multiple architectural layers) → delegate to subagent
- SDD tasks → `Task(general + sdd-orchestrator)`

### Theme System
- Built-in themes: `default`, `neon`, `pastel`
- Loaded from `public/themes/{id}.json` with fallback to `themes/{id}.json`
- Access via `getThemeColor('key')`, `getThemeIcon('key')`, `getThemeFont('fallback')`
- Chart themes (`state.activeChartTheme`) persisted via StorageService

### Constants (frozen CONFIG)
- `CHART_HEIGHT = 250`
- `MINIMAP_HEIGHT = 80`
- `TILE_WIDTH = 1440` (overridden to 720 on mobile <600px)
- `CACHE_DURATION = 5 * 60 * 1000` (5 minutes)
- `DEFAULT_COORDS = { lat: 40.4167, lon: -3.70325, name: "Madrid" }`
- `PIXELS_PER_MM = 10`
- `PIXELS_PER_HOUR = 60` (desktop) / `50` (mobile <600px) — on `state`, not CONFIG
