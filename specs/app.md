# Spec: `src/app.js`

## Purpose
Main application orchestrator. Initializes ~29 functions, handles rendering (tiled canvas), scroll/drag events, resize, initial data loading, and PWA lifecycle (SW registration, update toasts).

## Dependencies

### state
| Property | Access (R/W) | Context |
|-----------|-------------|----------|
| `state.skinType` | read/write | initStorage, initSkinCards, initStickmanSliders |
| `state.stickmanThresholds` | read/write | initStorage, initStickmanSliders |
| `state.activeChartTheme` | read/write | initStorage, initThemeSelector |
| `state.isDailyCardsView` | read/write | initStorage, initViewMode |
| `state.theme` | read/write | toggleTheme, initTheme, drawFixedOverlay |
| `state.lat, state.lon, state.locationName` | read/write | useMyLocation, loadWeather, initModals |
| `state.hourlyData` | read/write | render, loadWeather, drawFixedOverlay, drawTile |
| `state.isDragging, state.startX, state.scrollLeft` | read/write | initScrollEvents |
| `state.hoverX` | read/write | initScrollEvents |
| `state.isFetching` | read/write | initForceRefresh, initClearData |
| `state.rawForecast, state.rawAQI` | read | initLanguage |
| `state.dailyData` | read | initViewMode |
| `state.dpr` | read/write | handleResize |
| `state.labelRects` | read/write | drawFixedOverlay |
| `state.locationName` | read | initPullToRefresh |

### CONFIG
| Constant | Context |
|-----------|----------|
| `CONFIG.MINIMAP_HEIGHT` | module-level constant |
| `CONFIG.DEFAULT_COORDS` | useMyLocation fallback |
| `CONFIG.TILE_WIDTH` | handleResize (tile dimensions) |
| `CONFIG.PIXELS_PER_MM` | drawTile (precipitation bar height) |

### DOM
| Element | Access type | Context |
|----------|---------------|----------|
| `#minimap-canvas` | getElementById | initCanvas |
| `#fixed-overlay-canvas` | getElementById | initCanvas |
| `#scroll-container` | getElementById | initCanvas, initScrollEvents, snapScroll, etc. |
| `#canvas-wrapper` | getElementById | handleResize, initUvBlock |
| `#app-wrapper` | classList | loadWeather, useMyLocation, initPullToRefresh, initLoadingTimeout |
| `#error-msg` | style.display | loadWeather, showError |
| `#location-name` | innerText | updateLocationUI |
| `#theme-toggle` | getElementById | initCanvas, initTheme |
| `#minimap-container` | getElementById | initViewMode, initMinimapEvents |
| `#daily-cards-container` | getElementById | initViewMode |
| `#toggle-nav-btn` | getElementById | initViewMode |
| `#floating-now-btn` | getElementById | initNowButton, updateNowButtonPosition |
| `#now-indicator`, `#past-shadow` | getElementById | updateNowButtonPosition |
| Various `.collapsible-trigger`, `.lang-card`, `.skin-card`, `.theme-option` | querySelector/event | initCollapsibleSections, initLanguage, initSkinCards, initThemeSelector |
| `#pollen-warning-icon`, `#aqi-warning-icon` | getElementById | initPollenAqiIcons |
| `#btn-info`, `#info-modal` | getElementById | initInfoModal |
| `#settings-theme-toggle` | getElementById | initTheme |
| `#confirm-title/msg/cancel-btn/ok-btn` | getElementById | showConfirm |
| `#force-refresh-btn`, `#clear-data-btn` | getElementById | initForceRefresh, initClearData |
| `#alerts-container`, `#alerts-tooltip` | getElementById | initAlertsContainer |
| `#uv-active-block` | getElementById | initUvBlock, drawFixedOverlay |
| `.location-group` | querySelector | initLocationTooltip |
| `#main-current-location-btn` | getElementById | initLocationButton |
| `#animated-weather-zone` | getElementById | drawFixedOverlay |
| `#minimap-viewport` | getElementById | initCanvas |
| `.top-panel-metrics`, `#metrics-dots` | querySelector | initScrollIndicator |
| `#theme-select-trigger`, `#theme-current-label/swatch`, `#theme-options-container` | getElementById | initThemeSelector |
| `#pollen-modal`, `#aqi-modal` | getElementById | initPollenAqiIcons |

### Internal modules

**State & config**
| Module | Export used | Purpose |
|--------|-------------|----------|
| `./store.js` | `state, CONFIG, getDPR` | State + frozen config |
| `./services/StorageService.js` | `storageService` | Persistent storage (IndexedDB) |
| `./theme.js` | `getThemeColor, getThemeIcon, getThemeFont, loadChartTheme` | Theme loading and color access |
| `./utils/i18n.js` | `setLanguage, getLanguage, applyTranslations, t` | Internationalization |
| `./utils/pwa.js` | `registerSW, handleInstallPrompt, showUpdateToast, checkAppVersion, clearCacheAndReload` | Service worker + install/update |
| `./utils/time.js` | `dateToX` | Date-to-pixel-x conversion |
| `./utils/math.js` | `normalizeY` | Value-to-pixel-y normalization |

**Services & domain**
| Module | Export used | Purpose |
|--------|-------------|----------|
| `./services/GeoService.js` | `geoService` | Geocoding/reverse geocoding |
| `./services/DataProcessor.js` | `processData` | Raw data → display data transformation |
| `./domain/WeatherFetcher.js` | `fetchWeatherData, clearWeatherCache` | Data fetching + cache |

**UI**
| Module | Export used | Purpose |
|--------|-------------|----------|
| `./ui/DailyCards.js` | `generateDailyCards, updateActiveDailyCard` | Daily forecast cards |
| `./ui/ChangelogModal.js` | `showChangelogModal, initChangelog` | Changelog display |
| `./ui/MapSelector.js` | `initMapModal` | Geo map modal |
| `./ui/FavoritesModal.js` | `initFavoritesModal` | Favorites management |
| `./ui/YearInPixels.js` | `initYearInPixels` | Year-in-pixels view |
| `./ui/BottomSheet.js` | `openBottomSheet, closeBottomSheet` | Bottom sheet controller |
| `./ui/ScrollIndicator.js` | `initScrollIndicator` | Scroll indicator dots |
| `./ui/TopPanel.js` | `updateTopPanel` | Top metrics panel |
| `./ui/PullToRefresh.js` | `initPullToRefresh` | Pull-to-refresh |
| `./ui/SpfModal.js` | `initSpfModal` | SPF modal |
| `./ui/TooltipManager.js` | `initTooltipManager` | Tooltip system |

**Render**
| Module | Export used | Purpose |
|--------|-------------|----------|
| `./render/MetricsRenderer.js` | `drawWind, drawTemperature` | Wind + temperature lines |
| `./render/AtmosphereRenderer.js` | `drawClouds, drawPrecipitation, drawPrecipitationProbability` | Atmosphere layers |
| `./render/GridRenderer.js` | `drawGrid, drawDayNames, drawAxes` | Grid, day labels, axes |
| `./render/BackgroundRenderer.js` | `drawWeatherPhenomena, drawStarrySky, drawUVSegments, drawSunMarkersOnCanvas, drawSunnyBackground, drawNightOverlay, drawNightShadow` | Full background stack |
| `./render/StickmanRenderer.js` | `drawStickman` | Stickman character |
| `./render/OverlayRenderer.js` | `interpolateScrubberData, updateWeatherZone, drawScrubberPoint, updateUVBlock` | Scrubber overlay |
| `./render/MinimapRenderer.js` | `MinimapRenderer` | Minimap renderer class |

## Mali-G76 GPU Driver Bug (Redmi Note 10S)

### Root cause (discovery v1.10.0e)

The Mali-G76 chipset in the Redmi Note 10S has a bug in the **GPU compositing pipeline for multiple 2D canvases**. When the browser attempts to compose several adjacent 2D `<canvas>` elements using the GPU (hardware-accelerated compositing), the Mali-G76 driver produces visual artifacts:

- **Vertical seam lines** between canvas tiles (1px sub-pixel gap)
- **Opaque translucent layers**: clouds and night shadows render as solid blocks
- **Clipped temperature line** at canvas boundaries (steps)
- **Truncated weather icons** at tile edges
- **Alternating pattern**: canvas yes / canvas no

### Previous fix attempts (incorrect)

| Version | Hypothesis | Solution | Result |
|---------|-----------|----------|-----------|
| v1.10.0c | Alpha compositing | `destination-out` + `source-over` in `drawTile()`, canvas without alpha | Failed |
| v1.10.0d | CSS 3D layers | CSS 3D props only on overlay, overlap 1px, `translateZ(0)` on wrapper | Failed — the REAL root cause is the GPU driver |

Both attempts assumed configuration issues (alpha channel, CSS 3D layers) when the actual bug is in the **device's GPU driver**: the Mali-G76 does not correctly compose multiple 2D canvases by hardware.

### Implemented solution (v1.10.0e)

1. **Forced software rendering**: All tile canvases are created with `canvas.getContext('2d', { willReadFrequently: true })`. This option tells the browser the canvas will be read frequently, forcing CPU rendering instead of GPU. In browsers that don't support the hint, the fallback `canvas.getContext('2d')` is used.

2. **CSS `image-rendering: auto`**: Tile canvases use `image-rendering: auto` instead of `pixelated`, since CPU rendering correctly handles image smoothing.

3. **Snap scroll to integer**: A snap-to-integer-position block is added when scroll ends (`scrollend`, `mouseup`, `touchend`) to prevent sub-pixel positions from causing artifacts in tile composition during smooth scrolling.

4. **Revert 1px overlap**: The 1px overlap between tiles (introduced in v1.10.0d) is removed because it is no longer necessary — software rendering eliminates the root cause. Tiles return to exact `TILE_WIDTH`.

### Canvas context

- **Tile canvases** (created in `handleResize`): `canvas.getContext('2d', { willReadFrequently: true })` with fallback to `canvas.getContext('2d')`. Without `{ alpha: true }`. CPU rendering.
- **Tile canvas clearing** (in `drawTile`): only `ctx.clearRect(0, 0, w, h);`.
- **`minimapCanvas` and `fixedOverlayCanvas`** (in `initCanvas`): use `{ alpha: true }` because overlays need transparency.
- **`#canvas-wrapper > canvas`**: no longer needs specific `will-change: auto` or `backface-visibility`, but they are kept as passive defense.

## Public API

No public exports; the module executes on import. Two globals are leaked: `window.openBottomSheet` (line 1371) for inline error button use.

### Main internal functions

| Function | Description | Mutates state | Async |
|---------|-------------|:---:|:---:|
| `init()` | Main async that executes all initializations | Yes | Yes |
| `snapScroll()` | Rounds scrollLeft to integer on scroll end | No | No |
| `useMyLocation(force?)` | Loads saved location or geolocation | Yes | Yes |
| `loadWeather()` | Fetch + render | Yes | Yes |
| `getPosition()` | Geolocation with timeout wrapper | No | Returns Promise |
| `toggleTheme()` | Toggles dark/light theme | Yes | No |
| `updateLocationUI()` | Updates location DOM + saves to storage | Yes | No |
| `render()` | Draws visible tiles + minimap + top panel + overlay | No | No |
| `drawTile(tile)` | Draws an individual tile | No | No |
| `drawFixedOverlay()` | Draws scrubber overlay, labels, now button | Yes | No |
| `handleResize()` | Resizes everything | Yes | No |
| `centerOnCurrentTime(behavior?)` | Scrolls to current time | No | No |
| `updateNowButtonPosition()` | Positions floating "now" button | No | No |
| `showError(msg)` | Shows error in DOM | No | No |
| `showConfirm(title, msg, onOk)` | Opens confirm bottom sheet, clones buttons | No | No |
| `updateTopPanel()` | Delegates to TopPanel | No | No |
| `onClearCache()` | Clears weather cache + IndexedDB + reload | Yes | Yes |

### Child init functions (~29)

| Function | Mutates state | Async |
|---------|:---:|:---:|
| `initStorage()` | Yes | Yes |
| `initPwaDetection()` | No | No |
| `initNetworkStatus()` | No | No |
| `initPullToRefresh()` | Yes | No |
| `initTouchPrevention()` | No | No |
| `initSpfModal()` | No | No |
| `initPollenAqiIcons()` | No | No |
| `initCanvas()` | Yes | No |
| `initModals()` | Yes | No |
| `initLocationButton()` | No | No |
| `initUvBlock()` | No | No |
| `initLocationTooltip()` | No | No |
| `initAlertsContainer()` | No | No |
| `initTheme()` | Yes | No |
| `initCollapsibleSections()` | No | No |
| `initNowButton()` | No | No |
| `initInfoModal()` | Yes | No |
| `initLanguage()` | Yes | No |
| `initThemeSelector()` | Yes | Yes (loads theme JSON) |
| `initStickmanSliders()` | Yes | No |
| `initSkinCards()` | Yes | No |
| `initForceRefresh()` | No | No |
| `initClearData()` | No | No |
| `initLoadingTimeout()` | No | No |
| `initViewMode()` | Yes | No |
| `initMinimapEvents()` | No | No |
| `initScrollEvents()` | Yes | No |
| `initScrollIndicator()` | No | No |
| `startPulseLoop()` | No | No |

## Behavior

1. **Sequential init on DOMContentLoaded**: `init()` runs all child init functions in order, then `useMyLocation()` → `startPulseLoop()`.
2. **Legacy migration**: `initStorage()` migrates old `localStorage` keys to IndexedDB, then deletes them.
3. **Tile rendering with 1-tile buffer**: `render()` draws tiles from `startTile - 1` to `endTile + 1` to avoid blanks during fast scrolling.
4. **Scroll render via rAF**: `scroll` event throttled through `requestAnimationFrame`; each frame calls `drawFixedOverlay()` + `render()` + `updateActiveDailyCard()`.
5. **PWA detection**: `initPwaDetection()` adds `.pwa-standalone` class to `<html>` in standalone mode.
6. **Network status**: `.app-offline` class toggled on `<html>` based on `navigator.onLine`.
7. **Touch prevention**: `touchstart` with >1 finger and `gesturestart` are prevented.
8. **Scrubber overlay with collision detection**: `drawFixedOverlay()` renders temperature, apparent temperature, gusts, precipitation, probability, clouds, UV. Labels avoid colliding via `state.labelRects` (pre-populated with UV block and "now" button).
9. **Zero-degree marker**: `drawFixedOverlay()` renders a 0°C label + icon + dotted line at y=0 on the fixed overlay (left 60px strip).
10. **Responsive resize**: `handleResize()` re-reads `window.innerWidth`, sets `PIXELS_PER_HOUR` (50/60) and `TILE_WIDTH` (720/1440). Recreates all tile canvases.
11. **`willReadFrequently`**: Tile canvases use `{ willReadFrequently: true }` to force CPU rendering (Mali-G76 workaround). Fallback to plain `getContext('2d')` if unsupported.
12. **Exact tile width (no overlap)**: Each tile is created at exact `TILE_WIDTH` (1px overlap removed in v1.10.0e).
13. **Snap scroll to integer**: After scroll ends (`scrollend`, `mouseup`, `touchend`) `scrollLeft` is rounded to prevent sub-pixel composition artifacts.
14. **`drawTile` uses only `clearRect`**: No `destination-out` compositing — only `ctx.clearRect(0, 0, w, h)`.
15. **15-layer drawTile pipeline**: `drawSunnyBackground` → `drawNightOverlay` → `drawNightShadow` → `drawStarrySky` → `drawGrid` → `drawDayNames` → `drawClouds` → `drawUVSegments` → `drawPrecipitation` → `drawPrecipitationProbability` → `drawWeatherPhenomena` → `drawWind` → `drawTemperature` → `drawSunMarkersOnCanvas` → `drawAxes`.
16. **Pulse loop**: `startPulseLoop()` continuously calls `drawFixedOverlay()` via rAF for scrubber label updates.
17. **Pull-to-refresh**: `initPullToRefresh()` delegates to external module; on refresh re-geocodes current location name, clears tiles cache, then calls `loadWeather()`.
18. **View mode toggle**: `initViewMode()` switches between minimap and daily cards view, persisted in storage.
19. **Theme selector**: `initThemeSelector()` loads theme JSON files, renders theme options, applies selection immediately.
20. **SW lifecycle**: `registerSW()` sets up SW; `onUpdate` callback shows an update toast; `checkAppVersion()` shows changelog modal.
21. **Back-navigation prevention**: Scroll events set `window._preventBackNav = true` for 400ms; `navigation.addEventListener('navigate')` intercepts back-navigation during that window.
22. **Daily cards drag**: `initViewMode()` adds `pointerdown/move/up` handlers for mouse-based horizontal drag on the daily cards container.

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| Fetch fails (network error) | `loadWeather` catches error, calls `showError`, `isFetching=false` |
| `state.hourlyData` empty on render | `render()` returns immediately without drawing |
| Incomplete data (no `sunData`, no `dailyData`) | Graceful degradation: sections not rendered |
| `window.innerWidth` < 600 | `PIXELS_PER_HOUR=50`, `TILE_WIDTH=720` |
| `devicePixelRatio` undefined | `getDPR()` returns 1 as fallback |
| `init()` called before `DOMContentLoaded` | Listeners may not attach (not controlled) |
| Resize during ongoing render | `handleResize` interrupts and recreates tiles |
| Very fast scroll | Render throttled via rAF, frames are skipped |
| Multiple clicks on "now" | `centerOnCurrentTime` executes multiple times (no debounce) |
| Mali-G76 GPU with multiple canvas composition | `willReadFrequently: true` forces CPU rendering; no overlap; snap scroll to integer |
| Geolocation denied/times out | Falls back to `DEFAULT_COORDS` (Madrid), proceeds normally |
| `willReadFrequently` not supported | Falls back to `canvas.getContext('2d')` without options |
| Old localStorage keys present | Migrated to IndexedDB on first load, then deleted |
| `navigation` API unavailable | Back-nav prevention skipped gracefully (optional API) |

## Test Scenarios

1. **Does not throw with mock data:** `render()` with mock data, does not throw
2. **Does not throw with empty hourlyData:** `state.hourlyData = []`, `render()` returns without error
3. **Does not throw with DOMContentLoaded:** `init()` executes without errors
4. **Fetch fails:** `loadWeather` catches error, `isFetching = false`
5. **Responsive resize:** `window.innerWidth < 600` changes PIXELS_PER_HOUR to 50 and TILE_WIDTH to 720
6. **Fast scroll:** Render throttle via requestAnimationFrame without errors
7. **Simple canvas clearing:** `drawTile()` applies only `clearRect(0, 0, w, h)` without `destination-out`, does not throw
8. **Canvas with willReadFrequently on resize:** `handleResize()` passes `{ willReadFrequently: true }` to `getContext('2d')`; if not supported, fallback to `getContext('2d')` without options
9. **Exact tile width in handleResize:** `canvas.width = TILE_WIDTH * state.dpr`, `canvas.style.width = TILE_WIDTH + 'px'`, and `canvasWrapper.style.width = totalWidth + 'px'` (without +1, overlap reverted)
10. **Geolocation timeout:** `getPosition()` rejects after 4s timeout
11. **Legacy localStorage migration:** Old keys detected → migrated to IndexedDB → old keys deleted

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
| 2026-05-27 | Bugfix Mali-G76 v1: robust canvas cleaning, remove alpha in tile canvases, reset compositing | SDD |
| 2026-05-27 | Bugfix Mali-G76 v2 (spec-update): fixes real root cause — GPU layer composition. CSS 3D props only on fixed-overlay-canvas, tile canvases with 1px overlap, revert destination-out. | SDD |
| 2026-05-27 | Bugfix Mali-G76 v3 (spec-update): fixes REAL root cause — Mali-G76 GPU driver. Software rendering via `willReadFrequently: true`. Revert 1px overlap. Snap scroll to integer. image-rendering: auto. Previous fixes v1.10.0c (destination-out) and v1.10.0d (CSS 3D layers) are marked as superseded. | SDD |
| 2026-06-02 | Spec update: match current code. Fix init count (~28→~29), add DOM/internal module tables, add missing functions (snapScroll, getPosition, showConfirm, updateTopPanel, onClearCache), correct `render` async (No), update CONFIG deps (remove CHART_HEIGHT, CACHE_DURATION; add TILE_WIDTH, PIXELS_PER_MM), add SW lifecycle, back-nav prevention, daily cards drag, legacy migration edge cases. | SDD |
