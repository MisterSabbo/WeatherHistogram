### Rendering & Canvas Architecture

- **Tiled canvas rendering:** The main chart is split into tiles. Tile width is dynamic: `1440px` on desktop (>=600px viewport), `720px` on mobile. Each tile is an independent `<canvas>`. Only visible tiles in the viewport are drawn; off-screen tiles are skipped via the `drawn` flag.
- **Three canvas layers** in `#chart-area`:
  1. `main-canvas` — tile canvases (background, grid, weather phenomena, metrics)
  2. `fixed-overlay-canvas` — scrubber labels, NOW indicator, stickman overlay (redrawn every scroll frame)
  3. `stickman-canvas` — animated stickman figure
- **Minimap** (`minimap-canvas`) has its own cached render (`minimapCacheCanvas`) and auto-switches between "past" and "future" mode based on viewport position relative to current time.
- **All rendering goes through `render()`** which iterates tiles and calls `drawTile()`. Never draw to tile canvases outside this function.
- **Render modules** live in `src/render/`:
  - `BackgroundRenderer` — sunny background, night overlay/shadow, starry sky, weather phenomena, UV segments, sun markers
  - `GridRenderer` — grid lines, day names, axes
  - `AtmosphereRenderer` — clouds, precipitation, precipitation probability
  - `MetricsRenderer` — delegates to `metrics/TemperatureRenderer`, `metrics/HumidityRenderer`, `metrics/WindRenderer`
  - `OverlayRenderer` — scrubber labels (`drawScrubberPoint`), weather zone (`updateWeatherZone`), UV block (`updateUVBlock`), cloud interpolation (`interpolateScrubberData`)
  - `MinimapRenderer` — minimap with past/future modes, click-to-scroll, cache invalidation
  - `StickmanRenderer` — animated stickman
  - `CloudRenderer`, `MoonRenderer`, `PrecipProbabilityRenderer`, `SunMarkers` — supporting renders

### Key Interactions

- **Pull-to-refresh:** `src/ui/PullToRefresh.js`. Touch drag-down resets `weatherCache`, clears tile canvases, reloads via `loadWeather()`. Disabled when modals or search overlay are open.
- **Scroll-driven rendering:** `scroll` on `#scroll-container` calls `render()` via `requestAnimationFrame`. Only way tiles update during scroll.
- **Label collision avoidance:** `drawFixedOverlay()` has custom collision detection (`state.labelRects`). Reset each frame.
- **BottomSheet swipe-to-dismiss:** Pointer events with touch fallback. Swipe-down closes when `scrollTop === 0`. Dynamic z-index via counter.
- **Settings panel:** Bottom sheet on mobile (<768px), sliding panel on desktop (>=768px). CSS `translateY`/`translateX` with media queries.
- **Collapsible sections:** Fototipo and Umbrales in settings via `.collapsible-trigger`.
- **Language switch:** Triggers `showConfirm()` before applying translations and re-render.
- **Minimap auto-switch:** `updateMinimapViewport()` toggles `minimapMode` between `'past'`/`'future'` based on viewport center vs current-time split.
- **Service Worker** (`sw.js`): Cache-first for static assets, stale-while-revalidate for others. API calls (open-meteo, openstreetmap) deliberately not intercepted.
- **IndexedDB migration** (app.js init): Legacy localStorage keys migrated on first load.
- **PWA standalone detection:** Checks `display-mode: standalone` / `navigator.standalone`, adds `pwa-standalone` class to `<html>`.
- **View mode toggle:** `toggle-nav-btn` switches minimap/daily cards. Persisted as `viewMode` in StorageService.
