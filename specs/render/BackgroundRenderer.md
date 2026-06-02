# Spec: `src/render/BackgroundRenderer.js`

## Purpose
Renders background decorative layers: wind gust icons, stars, UV segments, sun background, night overlay/shadow, and moon.

## Dependencies

### state
| Property | Access (R/W) | Context |
|-----------|-------------|----------|
| `state.hourlyData` | read | all functions |
| `state.sunData` | read | drawSunnyBackground, drawNightOverlay |

### CONFIG
| Constant | Context |
|-----------|----------|
| `CONFIG.PIXELS_PER_HOUR` | all functions (position) |
| `CONFIG.CHART_HEIGHT` | all functions (via h parameter) |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../store.js` | `state` | access |
| `../theme.js` | `getThemeColor` | UV segment colors |
| `./MoonRenderer.js` | `drawMoon` | moon in night overlay |
| `./SunMarkers.js` | `drawSunMarkersOnCanvas` | re-export |

## Public API

### `export function drawWeatherPhenomena(ctx, viewX, viewW, h, PIXELS_PER_HOUR): void`

**Description:** Draws wind gust warning icons when gusts exceed thresholds.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `ctx` | `CanvasRenderingContext2D` | Canvas context |
| `viewX` | `number` | Viewport X start |
| `viewW` | `number` | Viewport width |
| `h` | `number` | Canvas height |
| `PIXELS_PER_HOUR` | `number` | Pixels per hour |

**Mutates state:** No

**Async:** No

### `export function drawStarrySky(ctx, viewX, viewW, h, PIXELS_PER_HOUR): void`

**Description:** Draws pseudo-random stars during night hours (12 per night hour, up to 85% height).

**Mutates state:** No

**Async:** No

### `export function drawUVSegments(ctx, viewX, viewW, h, PIXELS_PER_HOUR): void`

**Description:** Draws UV index color bars at top of chart (6px tall) for hours with UV > 0 and not night.

**Mutates state:** No

**Async:** No

### `export function drawSunnyBackground(ctx, viewX, viewW, h, styles, drawSunIcon, PIXELS_PER_HOUR): void`

**Description:** Fills entire canvas with `#fffde7` yellow and optionally draws sun icons at solar noon.

**Mutates state:** No

**Async:** No

### `export function drawNightOverlay(ctx, viewX, viewW, h, PIXELS_PER_HOUR): void`

**Description:** Draws purple day-night transition gradients and moon at sunset→sunrise midpoint.

**Mutates state:** No

**Async:** No

### `export function drawNightShadow(ctx, viewX, viewW, h, PIXELS_PER_HOUR): void`

**Description:** Draws dark night shadow overlay `rgba(0, 0, 20, 0.15)` with gradient transitions.

**Mutates state:** No

**Async:** No

### Private: `drawSun(ctx, x, y, sunColor, rayColor): void`

**Description:** Draws a decorative sun with radial glow gradient, 12 rays, and shadow.

## Behavior

1. **Wind gusts:** `d.gusts > 35` km/h → sequential wind gust icons (arcs + lines) with white base stroke + colored stroke overlay; `> 50` → larger icon with third arc; `> 70` → red color + fourth arc
2. **Stars:** Pseudo-random seeded RNG (`Math.sin(seed * 9.9898) * 43758.5453`), 12 per night hour, opacity 0.2–1.0, size 0.5–2.0px, positioned within the hour tile
3. **UV segments:** 6px bar at top, colors by level (low: `#4caf50`, moderate: `#fbc02d`, high: `#f57c00`, veryHigh: `#d32f2f`, extreme: `#7b1fa2`); only drawn when `d.uv > 0 && !d.isNight`
4. **Sunny background:** `#fffde7` fill across full viewport; sun drawn at solar noon midpoint per date; sun has radial glow (50px extra), 12 rays, and yellow fill with shadow
5. **Night overlay:** Three-phase per hour — transition in (day→purple gradient), solid `#e9d5ff`, transition out (purple→day gradient); moon drawn at midpoint between current sunset and next sunrise using `drawMoon`
6. **Night shadow:** Dark overlay `rgba(0, 0, 20, 0.15)` with same three-phase gradient pattern as night overlay but using dark semi-transparent color

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `ctx = null` / `undefined` | Does not throw |
| `state.hourlyData` empty | All functions return without drawing |
| All hours `isNight = true` | Stars across entire range, night overlay/shadow covers everything |
| All hours `isNight = false` | No stars, no night overlay/shadow, no moon |
| Wind < 35 km/h | Does not draw gust icons |
| UV = 0 at all points | Does not draw UV segments |
| `viewX` / `viewW` out of range | Draws nothing visible |
| `state.sunData` empty | No sun icon in sunny background, no moon in night overlay |

## Test Scenarios

1. **Does not throw with mock data:** Calls each function with mock data, does not throw
2. **Does not throw with empty hourlyData:** `state.hourlyData = []`, does not throw
3. **Does not throw with ctx = null/undefined:** Null context in each function, does not throw
4. **Wind gusts:** WindSpeed > 35/50/70 km/h draws progressive icons
5. **Night stars:** `isNight = true` in all hours, draws stars over entire range
6. **Day-night transition:** Mix of day and night hours, correct gradients + moon

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
