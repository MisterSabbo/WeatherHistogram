### Install & Run

- **Install & run:** `npm install` then `npm run dev` (Vite on port 3000). Production: `npm run build`.
- **`npm run clean`** runs `rm -rf dist` — **fails on Windows**. Use `Remove-Item -Recurse -Force dist` instead.
- **Entry point:** `src/app.js` — orchestrator that imports all modules. Initialization is split into ~28 named functions (`initStorage`, `initCanvas`, `initTheme`, `initLanguage`, `initViewMode`, etc.). Only touch this file for wiring new init functions or event bindings.
- **Extracted modules** (do not duplicate logic in app.js):
  - `src/domain/WeatherFetcher.js` — fetch workflow with cache, timeout, fallback
  - `src/ui/TopPanel.js` — updates header metrics DOM
  - `src/ui/PullToRefresh.js` — pull-to-refresh gesture handling
  - `src/render/OverlayRenderer.js` — scrubber labels, weather zone, UV block
  - `src/utils/thresholds.js` — dynamic Y-axis limits
- **State store:** `src/store.js` exports a single mutable `state` object and a frozen `CONFIG` constant. No events, no pub/sub — every module reads/writes `state` directly.
