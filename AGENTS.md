Always perform a list_directory of the root folder at the start of a project to index the environment.
## Core Workflow

- **Install & run:** `npm install` then `npm run dev` (Vite on port 3000). Production build: `npm run build`.
- **Entry point:** `src/app.js` — all initialization, event wiring, rendering loop, and state live here. It is the only file that should be touched for wiring changes.
- **State store:** `src/store.js` exports a single mutable `state` object and a `CONFIG` constant. Every module reads from / writes to `state` directly — no events, no pub/sub.

## Rendering & Canvas Architecture

- **Tiled canvas rendering:** The main chart is split into 1440px-wide tiles (`TILE_WIDTH` in `app.js:39`). Each tile is an independent `<canvas>`. Only tiles visible in the scroll viewport are drawn; off-screen tiles are skipped via the `drawn` flag.
- **Three canvas layers** exist in `index.html` inside `#chart-area`:
  1. `main-canvas` — tile canvases (background, grid, weather phenomena, metrics)
  2. `fixed-overlay-canvas` — scrubber labels, NOW indicator, stickman (drawn every scroll frame)
  3. `stickman-canvas` — animated stickman figure
- **Minimap** (`minimap-canvas`) has its own cached render (`minimapCacheCanvas`) and auto-switches between "past" and "future" mode based on scroll position.
- **All rendering must go through `render()`** (app.js:1347) which iterates tiles and calls `drawTile()`. Never draw to tile canvases outside this function.

## Services & Data Flow

- **Weather API** (`src/services/api.js`): `WeatherAPI` class wraps Open-Meteo endpoints. Returns raw JSON. The singleton `weatherApiLayer` is used by `WeatherService`.
- **WeatherService** (`src/services/WeatherService.js`): Calls `WeatherAPI`, returns structured data.
- **DataProcessor** (`src/services/DataProcessor.js`): Transforms raw API data into `state.hourlyData` / `state.dailyData`. Called from `app.js:processData()`.
- **StorageService** (`src/services/StorageService.js`): IndexedDB (db: `WeatherHistDB`, stores: `userPreferences`, `historyData`) with localStorage fallback. All persistent state goes through `storageService.get()` / `.set()`.
- **AqiManager, FavoritesService, GeoService, MockData** — supporting services; imported where needed.

## UI Components (all in `src/ui/`)

| File | Purpose |
|---|---|
| `DailyCards.js` | Daily forecast cards view + `generateDailyCards()` |
| `AqiRadar.js` | Canvas radar chart for AQI |
| `PollenRadar.js` | Canvas radar chart for pollen |
| `MapSelector.js` | Leaflet map modal for location search |
| `FavoritesModal.js` | Favorites list modal |
| `YearInPixels.js` | Year-in-pixels overview widget |

## Theme & i18n

- **Themes** (`src/theme.js`): Loaded from `public/themes/{default,neon,pastel}.json`. Theme colors accessed via `getThemeColor('key')`. The theme toggle button calls `toggleTheme()` which flips `state.theme` between `'dark'` / `'light'`.
- **i18n** (`src/utils/i18n.js`): Two languages (es/en). Strings marked with `data-i18n` in HTML are translated via `applyTranslations()`. Get strings in JS with `t('key')`.

## Key Interactions an Agent Might Miss

- **Pull-to-refresh:** Touch event handlers in `app.js` lines 138-288 implement mobile pull-to-refresh. The gesture resets `weatherCache`, clears tile canvases, then reloads data.
- **Scroll-driven rendering:** The `scroll` event on `#scroll-container` (line 1025) calls `render()` throttled via `requestAnimationFrame`. This is the only way the main chart updates during scroll.
- **Label collision avoidance:** `drawFixedOverlay()` (line 1661) has a custom collision-detection system (`state.labelRects`) for scrubber labels. Reset each frame at line 2021.
- **Minimap auto-switch:** `updateMinimapViewport()` auto-toggles `minimapMode` between `'past'` and `'future'` based on viewport center crossing the current-time split index.
- **Service Worker** (`sw.js`): Cache-first for static assets, stale-while-revalidate for others. API calls (open-meteo, openstreetmap) are deliberately not intercepted.
- **IndexedDB migration** (app.js:99-123): Legacy localStorage keys are migrated to IndexedDB on first load, then old keys are deleted.

## Important Defaults & Constants

- `TILE_WIDTH = 1440` (px) — hardcoded in app.js:39
- `PIXELS_PER_HOUR = 60` (desktop) / `50` (mobile <600px) — overridden in `handleResize()` at line 2467
- `CHART_HEIGHT = 250`, `MINIMAP_HEIGHT = 80` — from `CONFIG` in store.js
- `CACHE_DURATION = 5 * 60 * 1000` (5 min) — from `CONFIG` in store.js
- Default location: Madrid (`lat: 40.4167, lon: -3.70325`) — from `CONFIG.DEFAULT_COORDS`

## Build & Config

- **Vite** (`vite.config.ts`): no special config visible; standard ESM.
- **No test framework, no linter, no type checker** in this repo. Tests would need to be added.
- **package.json scripts:** `dev`, `build`, `preview`, `clean`.

## Memory Persistence Rules
To ensure project continuity across sessions, you must strictly adhere to the following rules using the `memory` MCP server:

1. **Initial Synchronization**: At the start of every session or whenever the task context shifts, execute `search_nodes` or `read_graph` to retrieve previously recorded architectural decisions, current progress, and active blockers.
2. **Entity Recording**: Every time a new logic is defined, a key library is installed, or a major component is created, register it using `create_entities`.
3. **Relationship Mapping**: Connect new features with existing ones using `create_relations` to maintain an up-to-date dependency graph of the project.
4. **Closing Summary**: Upon completing a task or before ending the interaction, use `add_observations` to summarize:
    - What has been implemented.
    - Any issues encountered and their resolutions.
    - The exact "Next Step" for the following session.
5. **Memory Overrides**: If local files (filesystem) conflict with the recorded "design intent" in memory, prioritize the memory data and consult the user before making destructive changes.
6. **Self-Correction**: Do not mark a task as "Complete" until the memory server has been updated with the latest session insights.
