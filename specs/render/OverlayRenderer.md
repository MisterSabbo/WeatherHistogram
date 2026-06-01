# Spec: `src/render/OverlayRenderer.js`

## Purpose
Renders the fixed overlay layer: scrubber, data tooltips, weather zone updates (stickman, SPF, AQI, pollen).

## Dependencies

### state
| Property | Access | Context |
|-----------|--------|----------|
| `state.hourlyData` | read | updateUVBlock |
| `state.theme` | read | colors |
| `state.stickmanThresholds` | read | updateWeatherZone |
| `state.skinType` | read | updateWeatherZone |
| `state.labelRects` | read/write | drawScrubberPoint |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../utils/color.js` | `hexToRgb` | convert colors |
| `../theme.js` | `getThemeColor`, `getThemeIcon`, `getThemeFont` | colors/icons |
| `../services/AqiManager.js` | `getAggregatedPollenLevel`, `getPollenColor` | pollen |

## Public API

### `export function interpolateScrubberData(d1: Object, d2: Object, progress: number): Object`

**Description:** Cubic hermite interpolation for temp, apparent, clouds, precipProb.

| Parameter | Type | Description |
|-----------|------|-------------|
| `d1` | `Object` | Previous data point |
| `d2` | `Object` | Next data point |
| `progress` | `number` | Progress between 0 and 1 |

**Metadata:** Mutates state: No, Async: No

### `export function getWeatherIconName(weatherCode: number): string`

**Description:** Converts WMO code to Material icon name.

**Metadata:** Mutates state: No, Async: No

### `export function updateWeatherZone(currentData: Object, state: Object, deps: Object): void`

**Description:** Updates DOM: icon, stickman, AQI, pollen, SPF, risk icons.

**Metadata:** Mutates state: Yes (updates DOM), Async: No

### `export function drawScrubberPoint(fixedOverlayCtx: CanvasRenderingContext2D, y: number, color: string, value: string, unit: string, options: Object): void`

**Description:** Draws point + label on overlay with collision detection.

**Metadata:** Mutates state: Yes (state.labelRects), Async: No

### `export function updateUVBlock(d1: Object, index: number, fixedOverlayCanvas: HTMLCanvasElement, PIXELS_PER_HOUR: number): void`

**Description:** Updates UV block in DOM.

**Metadata:** Mutates state: Yes (updates DOM), Async: No

## Behavior

1. `interpolateScrubberData`: cubic bezier for clouds and precipProb, linear for temp
2. `getWeatherIconName`: clear_day (default), cloud (1-3), foggy (45/48), rainy (51-67/80-82), ac_unit (71-77/85/86), thunderstorm (95+)
3. `updateWeatherZone`: updates DOM icon, stickman, AQI/pollen/SPF warning icons, risk icons row
4. `drawScrubberPoint`: detects collision with other labels, repositions with up to 20 attempts
5. `updateUVBlock`: DOM div absolutely positioned over canvas

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `ctx = null` / `undefined` in `drawScrubberPoint` | Does not throw |
| `d1 = d2` (same point) | `interpolateScrubberData` returns `d1` (progress 0) |
| `progress < 0` / `> 1` | Interpolates out of range, not clamped |
| `weatherCode = -1` | `getWeatherIconName` returns `'clear_day'` (default) |
| `state.hourlyData` with only 1 point | `updateUVBlock` works with index 0 |
| Label collision with 20+ attempts | Label drawn at last attempted position |
| `updateWeatherZone` without DOM elements | Does not throw |
| `fixedOverlayCtx` without `measureText` | `drawScrubberPoint` fails on collision |

## Test Scenarios

1. **Does not throw with mock data:** Calls functions with mock data, does not throw
2. **Does not throw with empty hourlyData:** `state.hourlyData = []`, does not throw
3. **Does not throw with ctx = null/undefined:** Null context in `drawScrubberPoint`, does not throw
4. **Scrubber interpolation:** `interpolateScrubberData(d1, d2, 0.5)` returns interpolated values
5. **WMO icon name:** `getWeatherIconName(0)` → `'clear_day'`, `getWeatherIconName(95)` → `'thunderstorm'`
6. **Label collision:** Labels repositioned up to 20 attempts

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
