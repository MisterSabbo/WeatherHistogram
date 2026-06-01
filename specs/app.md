# Spec: `src/app.js`

## Purpose
Main application orchestrator. Initializes ~28 functions, handles rendering (tiled canvas), scroll/drag events, resize, and initial data loading.

## Dependencies

### state
| Property | Access | Context |
|-----------|--------|----------|
| `state.*` | read/write | entire app |

### CONFIG
| Constant | Context |
|-----------|----------|
| `CONFIG.CHART_HEIGHT` | render |
| `CONFIG.MINIMAP_HEIGHT` | minimap |
| `CONFIG.DEFAULT_COORDS` | geolocation fallback |
| `CONFIG.CACHE_DURATION` | fetch |

### Internal modules
Virtually all project modules are imported.

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

No public exports; the module executes on import.

### Main internal functions

| Function | Description | Mutates state | Async |
|---------|-------------|:---:|:---:|
| `init()` | Main async that executes all initializations | Yes | Yes |
| `useMyLocation(force?)` | Loads saved location or geolocation | Yes | Yes |
| `loadWeather()` | Fetch + render | Yes | Yes |
| `render()` | Draws visible tiles + minimap + top panel + overlay | Yes | No |
| `drawTile(tile)` | Draws an individual tile | No | No |
| `drawFixedOverlay()` | Draws scrubber overlay, labels, now button | Yes | No |
| `handleResize()` | Resizes everything | Yes | No |
| `centerOnCurrentTime(behavior?)` | Scrolls to current time | Yes | No |
| `toggleTheme()` | Toggles dark/light theme | Yes | No |
| `updateLocationUI()` | Updates location DOM | Yes | No |
| `updateNowButtonPosition()` | Positions floating "now" button | Yes | No |
| `showError(msg)` | Shows error in DOM | Yes | No |

### Child init functions (~28)

| Function | Mutates state | Async |
|---------|:---:|:---:|
| `initStorage()` | Yes | Yes |
| `initPwaDetection()` | No | No |
| `initNetworkStatus()` | Yes | No |
| `initPullToRefresh()` | Yes | No |
| `initTouchPrevention()` | Yes | No |
| `initSpfModal()` | Yes | No |
| `initPollenAqiIcons()` | Yes | No |
| `initCanvas()` | Yes | No |
| `initModals()` | Yes | No |
| `initLocationButton()` | Yes | No |
| `initUvBlock()` | Yes | No |
| `initLocationTooltip()` | Yes | No |
| `initAlertsContainer()` | Yes | No |
| `initTheme()` | Yes | No |
| `initCollapsibleSections()` | Yes | No |
| `initNowButton()` | Yes | No |
| `initInfoModal()` | Yes | No |
| `initLanguage()` | Yes | No |
| `initThemeSelector()` | Yes | No |
| `initStickmanSliders()` | Yes | No |
| `initSkinCards()` | Yes | No |
| `initForceRefresh()` | Yes | No |
| `initClearData()` | Yes | No |
| `initLoadingTimeout()` | Yes | No |
| `initViewMode()` | Yes | No |
| `initMinimapEvents()` | Yes | No |
| `initScrollEvents()` | Yes | No |
| `initScrollIndicator()` | Yes | No |
| `startPulseLoop()` | Yes | No |

## Behavior

1. Sequential initialization on `DOMContentLoaded`
2. Tile rendering with 1 tile buffer on each side
3. Scroll render via requestAnimationFrame
4. Scrubber overlay with subpixel interpolation and label collision detection
5. Responsive resize: changes PIXELS_PER_HOUR and TILE_WIDTH according to viewport
6. **Tile canvases with willReadFrequently**: `handleResize()` creates contexts with `{ willReadFrequently: true }` to force CPU rendering on problematic GPUs (Mali-G76). Fallback to `getContext('2d')` without options if the hint is not supported.
7. **Exact tile width (no overlap)**: Each tile is created with exact `TILE_WIDTH` (without `+1`). The 1px overlap was reverted because the real solution (software rendering) eliminates the root cause.
8. **Snap scroll to integer**: When scroll ends (`scrollend`, `mouseup`, `touchend`) `scrollLeft` is rounded to integer to prevent sub-pixel artifacts in tile composition.
9. **drawTile without destination-out**: Only `clearRect()` to clear canvas.

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| Fetch fails (network error) | `loadWeather` catches error, shows `showError`, `isFetching=false` |
| `state.hourlyData` empty on render | `render()` draws nothing, returns without error |
| Incomplete data (no `sunData`, no `dailyData`) | Graceful degradation: some sections are not rendered |
| `window.innerWidth` < 600 | `handleResize` changes `PIXELS_PER_HOUR` to 50 and `TILE_WIDTH` to 720 |
| `devicePixelRatio` undefined | Fallback to 1 in DPR calculations |
| `init()` called before `DOMContentLoaded` | Listeners may not attach (not controlled) |
| Resize during ongoing render | `handleResize` interrupts and recreates tiles |
| Very fast scroll | Render throttle via `requestAnimationFrame`, frames are skipped |
| Multiple clicks on "now" | `centerOnCurrentTime` executes multiple times (no debounce) |
| Mali-G76 GPU with multiple canvas composition | `getContext('2d', { willReadFrequently: true })` forces CPU rendering; does not depend on CSS. Tiles without overlap (exact TILE_WIDTH). Snap scroll to integer to avoid sub-pixel artifacts |
| Canvas with alpha on resize | `handleResize` creates contexts without alpha to avoid artifacts on alternating tiles |

## Test Scenarios

1. **Does not throw with mock data:** `render()` with mock data, does not throw
2. **Does not throw with empty hourlyData:** `state.hourlyData = []`, `render()` returns without error
3. **Does not throw with DOMContentLoaded:** `init()` executes without errors
4. **Fetch fails:** `loadWeather` catches error, `isFetching = false`
5. **Responsive resize:** `window.innerWidth < 600` changes PIXELS_PER_HOUR and TILE_WIDTH
6. **Fast scroll:** Render throttle via requestAnimationFrame without errors
7. **Simple canvas clearing:** `drawTile()` applies only `clearRect(0, 0, w, h)` without `destination-out`, does not throw
8. **Canvas with willReadFrequently on resize:** `handleResize()` passes `{ willReadFrequently: true }` to `getContext('2d')`; if not supported, fallback to `getContext('2d')` without options
9. **Exact tile width in handleResize:** `canvas.width = TILE_WIDTH * state.dpr`, `canvas.style.width = TILE_WIDTH + 'px'`, and `canvasWrapper.style.width = totalWidth + 'px'` (without +1, overlap reverted)

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
| 2026-05-27 | Bugfix Mali-G76 v1: robust canvas cleaning, remove alpha in tile canvases, reset compositing | SDD |
| 2026-05-27 | Bugfix Mali-G76 v2 (spec-update): fixes real root cause — GPU layer composition. CSS 3D props only on fixed-overlay-canvas, tile canvases with 1px overlap, revert destination-out. | SDD |
| 2026-05-27 | Bugfix Mali-G76 v3 (spec-update): fixes REAL root cause — Mali-G76 GPU driver. Software rendering via `willReadFrequently: true`. Revert 1px overlap. Snap scroll to integer. image-rendering: auto. Previous fixes v1.10.0c (destination-out) and v1.10.0d (CSS 3D layers) are marked as superseded. | SDD |
