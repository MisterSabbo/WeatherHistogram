Always perform a list_directory of the root folder at the start of a project to index the environment.

## Core Workflow

- **Install & run:** `npm install` then `npm run dev` (Vite on port 3000). Production: `npm run build`.
- **`npm run clean`** runs `rm -rf dist` — **fails on Windows**. Use `Remove-Item -Recurse -Force dist` instead.
- **Entry point:** `src/app.js` — all initialization, event wiring, rendering loop, and state. Only touch this file for wiring changes.
- **State store:** `src/store.js` exports a single mutable `state` object and a `CONFIG` constant. No events, no pub/sub — every module reads/writes `state` directly.

## Rendering & Canvas Architecture

- **Tiled canvas rendering:** The main chart is split into 1440px-wide tiles (`const TILE_WIDTH = 1440` in app.js). Each tile is an independent `<canvas>`. Only visible tiles in the viewport are drawn; off-screen tiles are skipped via the `drawn` flag.
- **Three canvas layers** in `#chart-area`:
  1. `main-canvas` — tile canvases (background, grid, weather phenomena, metrics)
  2. `fixed-overlay-canvas` — scrubber labels, NOW indicator, stickman overlay (redrawn every scroll frame)
  3. `stickman-canvas` — animated stickman figure
- **Minimap** (`minimap-canvas`) has its own cached render (`minimapCacheCanvas`) and auto-switches between "past" and "future" mode based on viewport position relative to current time.
- **All rendering goes through `render()`** which iterates tiles and calls `drawTile()`. Never draw to tile canvases outside this function.
- **Render modules** live in `src/render/`: `GridRenderer`, `MetricsRenderer`, `AtmosphereRenderer`, `BackgroundRenderer`, `StickmanRenderer`.

## Services & Data Flow

- **WeatherService** (`src/services/WeatherService.js`): Calls Open-Meteo API directly via `fetch()`. Returns `{ forecastData, aqiData }`.
- **DataProcessor** (`src/services/DataProcessor.js`): Transforms raw API data into `state.hourlyData` / `state.dailyData`. Also persists past data to IndexedDB (Year in Pixels feature).
- **StorageService** (`src/services/StorageService.js`): IndexedDB (db: `WeatherHistDB`, stores: `userPreferences`, `historyData`) with localStorage fallback. Access via `storageService.get()` / `.set()`.
- **GeoService**: Geocoding via Open-Meteo and reverse-geocoding via Nominatim.
- **AqiManager, FavoritesService, MockData** — supporting services; imported where needed.
- **`src/services/api.js`** (`WeatherAPI` class) exists but is **not imported anywhere** — the active API code is in `WeatherService.js`.

## UI Components

All in `src/ui/`: `DailyCards.js` (forecast cards), `AqiRadar.js` / `PollenRadar.js` (canvas radar charts), `MapSelector.js` (Leaflet map modal), `FavoritesModal.js`, `YearInPixels.js`.

## Theme & i18n

- **Themes** (`src/theme.js`): Loaded from `public/themes/{default,neon,pastel}.json`. Theme colors accessed via `getThemeColor('key')`. The theme toggle button calls `toggleTheme()` which flips `state.theme` between `'dark'` / `'light'`.
- **i18n** (`src/utils/i18n.js`): Two languages (es/en). Strings marked with `data-i18n` in HTML are translated via `applyTranslations()`. Get strings in JS with `t('key')`.

## Key Interactions an Agent Might Miss

- **Pull-to-refresh:** Touch event handlers in `app.js` implement mobile pull-to-refresh. The gesture resets `weatherCache`, clears tile canvases, then reloads data.
- **Scroll-driven rendering:** The `scroll` event on `#scroll-container` calls `render()` throttled via `requestAnimationFrame`. This is the only way the main chart updates during scroll.
- **Label collision avoidance:** `drawFixedOverlay()` has a custom collision-detection system (`state.labelRects`) for scrubber labels. Reset each frame.
- **Minimap auto-switch:** `updateMinimapViewport()` auto-toggles `minimapMode` between `'past'` and `'future'` based on viewport center crossing the current-time split index.
- **Service Worker** (`sw.js`): Cache-first for static assets, stale-while-revalidate for others. API calls (open-meteo, openstreetmap) are deliberately not intercepted.
- **IndexedDB migration** (app.js init): Legacy localStorage keys are migrated to IndexedDB on first load, then old keys are deleted.
- **PWA standalone detection:** At init, checks `display-mode: standalone` / `navigator.standalone` and adds `pwa-standalone` class to `<html>`.
- **View mode toggle:** `toggle-nav-btn` switches between minimap and daily cards view. Persisted as `viewMode` in StorageService.

## Defaults & Constants

- `TILE_WIDTH = 1440` (px) — hardcoded in app.js
- `PIXELS_PER_HOUR = 60` (desktop) / `50` (mobile <600px) — overridden in `handleResize()`
- `CHART_HEIGHT = 250`, `MINIMAP_HEIGHT = 80` — from `CONFIG` in store.js
- `CACHE_DURATION = 5 * 60 * 1000` (5 min) — from `CONFIG` in store.js
- Default location: Madrid (`lat: 40.4167, lon: -3.70325`) — from `CONFIG.DEFAULT_COORDS`

## Build & Config

- **Vite** (`vite.config.ts`): standard ESM, base `'./'`, `@` alias to root.
- **No test framework, no linter, no type checker** in this repo. Tests would need to be added.
- **package.json scripts:** `dev`, `build`, `preview`, `clean`.

## Agent Git Rules

- **NEVER** commit. Always stage with `git add`. If asked to commit, stage and inform commits are disabled.
- After changes, run `git diff --cached` and `git diff`, then propose a commit message — do not commit automatically.

## Memory Persistence (MCP server)

1. On session start: `search_nodes` / `read_graph` to load context.
2. On creating components: `create_entities` + `create_relations`.
3. On task done: `add_observations` summarizing what was implemented, issues, and next step.
4. File/memory conflicts: prioritize memory data, consult user before destructive changes.
5. Don't mark "Complete" until memory server is updated.

## Code Quality

- **SOLID Principles**: SRP, OCP, LSP, ISP, DIP — must be respected.
- **i18n**: Add new UI strings to both `es`/`en` in `src/utils/i18n.js`.
- **Changelog**: Update `CHANGELOG.md` and `public/changelog.json` with every significant change (English).
- **Version**: Update `index.html` (`#app-version-label`) and `public/version.json`. Semver: X.Y.Z for breaking/feature/patch; letter suffix for trivial (v1.2.3 → v1.2.3a). Suffix resets when X/Y/Z changes.
- **README**: Update if documented features or setup change.

## Subagent Consideration

Before responding, evaluate if a subagent (`explore`, `general`, `android-web-adaptor`, `ios-pwa-reviewer`, `mobile-first-reviewer`, `pwa-auditor`, `pwa-dual-mode-verifier`, `docs-writer`, `skill-creator`) is better suited. If uncertain, ask the user.