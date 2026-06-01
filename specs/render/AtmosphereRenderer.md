# Spec: `src/render/AtmosphereRenderer.js`

## Purpose
Renders precipitation (rain, snow, storm) on the histogram canvas. Re-exports CloudRenderer and PrecipProbabilityRenderer.

## Dependencies

### state
| Property | Access | Context |
|-----------|--------|----------|
| `state.hourlyData` | read | drawPrecipitation |
| `state.theme` | read | colors |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../store.js` | `state` | access |
| `../theme.js` | `getThemeColor` | colors |
| `./CloudRenderer.js` | `drawClouds` | re-export |
| `./PrecipProbabilityRenderer.js` | `drawPrecipitationProbability` | re-export |

## Public API

### `export function drawPrecipitation(ctx: CanvasRenderingContext2D, viewX: number, viewW: number, h: number, styles: Object, PIXELS_PER_HOUR: number, PIXELS_PER_MM: number): void`

**Description:** Draws precipitation bars with icons according to type (rain, snow, storm).

| Parameter | Type | Description |
|-----------|------|-------------|
| `ctx` | `CanvasRenderingContext2D` | Canvas context |
| `viewX` | `number` | Viewport X start |
| `viewW` | `number` | Viewport width |
| `h` | `number` | Canvas height |
| `styles` | `Object` | Theme styles |
| `PIXELS_PER_HOUR` | `number` | Pixels per hour |
| `PIXELS_PER_MM` | `number` | Pixels per mm of precipitation |

**Metadata:**
- Mutates state: No
- Async: No

**Private sub-functions:**
- `drawRain(ctx, x, bw, barY, strokeColor, idx)` — raindrops
- `drawSnow(ctx, x, bw, barY)` — snowflakes
- `drawThunder(ctx, x, bw, barY)` — lightning bolts

## Behavior

1. Semi-transparent vertical gradient bar
2. Bar height = `d.precip * PIXELS_PER_MM` (max 90% of height)
3. Snow codes: [71,73,75,77,85,86]; storm: [95,96,99]
4. If bar exceeds max height, draws zigzag overflow indicator
5. Gradient uses base color with 40% opacity blend

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `ctx = null` / `undefined` | Does not throw (no try-catch, but draw does not execute) |
| `state.hourlyData` empty | Draws nothing, returns without error |
| `PIXELS_PER_MM = 0` | Bar with height 0, draws nothing |
| `viewX` / `viewW` negative | Draws outside viewport, does not throw |
| `d.precip = 0` | Does not draw bar for that hour |
| Unrecognized weatherCode | Treats as rain by default |

## Test Scenarios

1. **Does not throw with mock data:** Calls `drawPrecipitation` with mock data, does not throw
2. **Does not throw with empty hourlyData:** `state.hourlyData = []`, does not throw
3. **Does not throw with ctx = null/undefined:** Null context, does not throw
4. **Snow codes:** WeatherCode [71,73,75,77,85,86] draws snowflakes
5. **Storm codes:** WeatherCode [95,96,99] draws lightning bolts
6. **Bar overflow:** Precipitation exceeding max height draws zigzag

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
