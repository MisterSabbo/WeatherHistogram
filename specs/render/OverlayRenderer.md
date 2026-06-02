# Spec: `src/render/OverlayRenderer.js`

## Purpose
Renders the fixed overlay layer: scrubber data interpolation, data tooltips with collision, weather zone DOM updates (stickman, SPF, AQI, pollen), and UV block.

## Dependencies

### state
| Property | Access (R/W) | Context |
|-----------|-------------|----------|
| `state.theme` | read | updateWeatherZone |
| `state.stickmanThresholds` | read | updateWeatherZone |
| `state.skinType` | read | updateWeatherZone |

### DOM
| Element | Access type | Context |
|----------|---------------|----------|
| `#summary-icon-dom` | getElementById | updateWeatherZone |
| `#stickman-canvas` | getElementById | updateWeatherZone |
| `#aqi-warning-icon` | getElementById | updateWeatherZone |
| `#pollen-warning-icon` | getElementById | updateWeatherZone |
| `#spf-info-container` | getElementById | updateWeatherZone |
| `#spf-value-text` | getElementById | updateWeatherZone |
| `#risk-icons-row` | getElementById | updateWeatherZone |
| `#animated-weather-zone` | getElementById | updateWeatherZone |
| `#uv-active-block` | getElementById | updateUVBlock |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../utils/color.js` | `hexToRgb` | convert hex colors to RGB |
| `../theme.js` | `getThemeColor`, `getThemeFont` | colors/font |
| `../services/AqiManager.js` | `getAggregatedPollenLevel`, `getPollenColor` | pollen data |

## Public API

### `export function interpolateScrubberData(d1, d2, progress): Object`

**Description:** Cubic bezier interpolation for clouds and precipProb, linear for temp and apparent.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `d1` | `Object` | Previous data point |
| `d2` | `Object` | Next data point |
| `progress` | `number` | Progress between 0 and 1 |

**Returns:** `{ temp: number, apparent: number, clouds: number, precipProb: number }`

**Mutates state:** No

**Async:** No

### `export function getWeatherIconName(weatherCode): string`

**Description:** Converts WMO weather code to Material Symbols icon name. Fallback: `'clear_day'`.

**Mutates state:** No

**Async:** No

### `export function updateWeatherZone(currentData, state, deps): void`

**Description:** Updates DOM elements: summary icon, stickman canvas, AQI warning, pollen warning, SPF suggestion, risk icons row visibility, animated weather zone z-index.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `currentData` | `Object` | Current hour weather data |
| `state` | `Object` | App state (stickmanThresholds, skinType) |
| `deps` | `Object` | `{ haloColor, isDark, walkPhase, drawStickman }` |

**Mutates state:** Yes (updates DOM)

**Async:** No

### `export function drawScrubberPoint(fixedOverlayCtx, y, color, value, unit, options): void`

**Description:** Draws scrubber data point with label on the fixed overlay canvas. Includes collision detection with existing labels.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `fixedOverlayCtx` | `CanvasRenderingContext2D` | Overlay canvas context |
| `y` | `number` | Y position of the data point |
| `color` | `string` | Color for point and label |
| `value` | `string|number|null` | Value to display (skipped if null or 0) |
| `unit` | `string` | Unit suffix (e.g. `'°'`, `'%'`)) |
| `options` | `Object` | `{ shape, icon, secondaryText, secondaryColor, secondaryIcon, drawX, h, w, labelRects }` |

**Mutates state:** Yes (pushes to `labelRects` array)

**Async:** No

### `export function updateUVBlock(d1, index, fixedOverlayCanvas, PIXELS_PER_HOUR): void`

**Description:** Updates the `#uv-active-block` DOM element with UV level text, color, and absolute position.

**Mutates state:** Yes (updates DOM)

**Async:** No

## Behavior

1. **interpolateScrubberData:** Uses binary search to invert cubic bezier for t at given progress (max 10 iterations), then uses smoothstep `t²(3-2t)` for clouds/precipProb bezier interpolation; linear interpolation for temp and apparent
2. **getWeatherIconName:** `clear_day` for code 0, `cloud` for 1-3, `foggy` for 45/48, `rainy` for 51-67/80-82, `ac_unit` for 71-77/85/86, `thunderstorm` for 95+
3. **updateWeatherZone:** Updates DOM: summary icon text+color+shadow, stickman (clears canvas, calls drawStickman), pollen warning (display/color based on aggregated level >= 2), AQI warning (display/color for AQI >= 101, 4 tiers), SPF suggestion (display based on UV >= 3 or UV > 0 with skinType <= 2), risk icons row visibility, animated weather zone z-index (21 if >2 icons, 15 otherwise)
4. **drawScrubberPoint:** Draws shape at (drawX, y) — circle r=4, diamond 5px, or square 6×6; draws background rectangle with rounding `[0,6,6,6]`; collision detection with labelRects up to 20 attempts, prefers horizontal shift past "now" button, vertical shift otherwise (reverses direction if near bottom); background blends color with white via `scrubber.bgLightMix`
5. **updateUVBlock:** Abs-positions the UV block DOM div over the canvas at `index * PIXELS_PER_HOUR` with width = PIXELS_PER_HOUR; background blended 80% white + 20% UV color

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `ctx = null` / `undefined` in drawScrubberPoint | Does not throw |
| `d1 = d2` (same point) | interp returns d1 values (progress 0) |
| `progress < 0` / `> 1` | Interpolates out of range, not clamped |
| `weatherCode = -1` | getWeatherIconName returns `'clear_day'` (default) |
| Value = 0 or null | Label not drawn, only point |
| Label collision with 20+ attempts | Label at last attempted position |
| `updateWeatherZone` without DOM elements | Does not throw (null checked) |
| UV 0 or night | UV block hidden |

## Test Scenarios

1. **Does not throw with mock data:** Calls functions with mock data, does not throw
2. **Does not throw with empty hourlyData:** Does not throw
3. **Does not throw with ctx = null/undefined:** Null context in drawScrubberPoint, does not throw
4. **Scrubber interpolation:** interpolateScrubberData(d1, d2, 0.5) returns interpolated values
5. **WMO icon name:** getWeatherIconName(0) → `'clear_day'`, getWeatherIconName(95) → `'thunderstorm'`
6. **Label collision:** Labels repositioned up to 20 attempts

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
