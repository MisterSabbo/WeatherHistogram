# Spec: `src/render/BackgroundRenderer.js`

## Purpose
Renders backgrounds, weather phenomena (wind, stars, UV, sun, night) on the canvas.

## Dependencies

### state
| Property | Access | Context |
|-----------|--------|----------|
| `state.hourlyData` | read | all functions |
| `state.sunData` | read | drawSunnyBackground, drawNightOverlay |
| `state.theme` | read | drawPrecipitation (via Atmosphere) |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../store.js` | `state` | access |
| `../theme.js` | `getThemeColor` | colors |
| `../utils/color.js` | `hexToRgb` | convert colors |
| `./MoonRenderer.js` | `drawMoon` | moon |
| `./SunMarkers.js` | `drawSunMarkersOnCanvas` | re-export |

## Public API

### `export function drawWeatherPhenomena(ctx: CanvasRenderingContext2D, viewX: number, viewW: number, h: number, PIXELS_PER_HOUR: number): void`

**Description:** Draws wind gust icons.

| Parameter | Type | Description |
|-----------|------|-------------|
| `ctx` | `CanvasRenderingContext2D` | Canvas context |
| `viewX` | `number` | Viewport X start |
| `viewW` | `number` | Viewport width |
| `h` | `number` | Canvas height |
| `PIXELS_PER_HOUR` | `number` | Pixels per hour |

**Metadata:** Mutates state: No, Async: No

### `export function drawStarrySky(ctx: CanvasRenderingContext2D, viewX: number, viewW: number, h: number, PIXELS_PER_HOUR: number): void`

**Description:** Draws stars during night hours.

**Metadata:** Mutates state: No, Async: No

### `export function drawUVSegments(ctx: CanvasRenderingContext2D, viewX: number, viewW: number, h: number, PIXELS_PER_HOUR: number): void`

**Description:** Draws UV bars with color coding.

**Metadata:** Mutates state: No, Async: No

### `export function drawSunnyBackground(ctx: CanvasRenderingContext2D, viewX: number, viewW: number, h: number, styles: Object, drawSunIcon: boolean, PIXELS_PER_HOUR: number): void`

**Description:** Draws yellow background with sun icon during daylight hours.

**Metadata:** Mutates state: No, Async: No

### `export function drawNightOverlay(ctx: CanvasRenderingContext2D, viewX: number, viewW: number, h: number, PIXELS_PER_HOUR: number): void`

**Description:** Draws day-night transitions and moon.

**Metadata:** Mutates state: No, Async: No

### `export function drawNightShadow(ctx: CanvasRenderingContext2D, viewX: number, viewW: number, h: number, PIXELS_PER_HOUR: number): void`

**Description:** Draws dark night shadow.

**Metadata:** Mutates state: No, Async: No

## Behavior

1. **Wind gusts:** >35km/h → icons, >50 → larger, >70 → red
2. **Stars:** pseudo-random with seed, 12 per night hour
3. **UV:** 6px bar at top, colors by level
4. **Night:** day-night transition gradients, shadow `rgba(0,0,20,0.15)`

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `ctx = null` / `undefined` | Does not throw |
| `state.hourlyData` empty | Draws nothing in any function |
| All hours `isNight = true` | `drawStarrySky` draws over entire range, `drawNightOverlay` covers everything |
| All hours `isNight = false` | No stars or night overlay |
| Wind < 35 km/h | Does not draw gust icons |
| UV = 0 at all points | Does not draw UV segments |
| `viewX` / `viewW` out of range | Draws nothing visible |

## Test Scenarios

1. **Does not throw with mock data:** Calls each function with mock data, does not throw
2. **Does not throw with empty hourlyData:** `state.hourlyData = []`, does not throw
3. **Does not throw with ctx = null/undefined:** Null context in each function, does not throw
4. **Wind gusts:** WindSpeed > 35/50/70 km/h draws progressive icons
5. **Night stars:** `isNight = true` in all hours, draws stars over entire range
6. **Day-night transition:** Mix of day and night hours, correct gradients

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
