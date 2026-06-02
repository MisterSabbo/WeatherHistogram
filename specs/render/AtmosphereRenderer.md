# Spec: `src/render/AtmosphereRenderer.js`

## Purpose
Renders precipitation (rain, snow, storm) on the histogram canvas. Re-exports CloudRenderer and PrecipProbabilityRenderer.

## Dependencies

### state
| Property | Access (R/W) | Context |
|-----------|-------------|----------|
| `state.hourlyData` | read | drawPrecipitation |
| `state.theme` | read | drawPrecipitation (snow color selection) |

### CONFIG
| Constant | Context |
|-----------|----------|
| `CONFIG.PIXELS_PER_MM` | drawPrecipitation (bar height) |
| `CONFIG.PIXELS_PER_HOUR` | drawPrecipitation (position) |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../store.js` | `state` | access |
| `../theme.js` | `getThemeColor` | colors |
| `./CloudRenderer.js` | `drawClouds` | re-export |
| `./PrecipProbabilityRenderer.js` | `drawPrecipitationProbability` | re-export |

## Public API

### `export function drawPrecipitation(ctx, viewX, viewW, h, styles, PIXELS_PER_HOUR, PIXELS_PER_MM): void`

**Description:** Draws precipitation bars with icons according to type (rain, snow, storm).

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `ctx` | `CanvasRenderingContext2D` | Canvas context |
| `viewX` | `number` | Viewport X start |
| `viewW` | `number` | Viewport width |
| `h` | `number` | Canvas height |
| `styles` | `Object` | Theme styles (unused directly) |
| `PIXELS_PER_HOUR` | `number` | Pixels per hour |
| `PIXELS_PER_MM` | `number` | Pixels per mm of precipitation |

**Mutates state:** No

**Async:** No

**Private helpers:**
- `drawRain(ctx, x, bw, barY, strokeColor, idx)` — raindrops via Material icon `water_drop`, white stroke + colored fill with shadow
- `drawSnow(ctx, x, bw, barY)` — snowflakes (black stroke + white stroke, 4 per bar)
- `drawThunder(ctx, x, bw, barY)` — lightning bolts (black stroke + yellow glow), 2 per bar

## Behavior

1. Semi-transparent vertical gradient bar per hour with precipitation > 0
2. Bar height = `d.precip * PIXELS_PER_MM`, capped at 90% of canvas height
3. Fill gradient: base color at 100% opacity blends to 40% over 30px from top
4. Stroke gradient: base color at 50% opacity blends to 100% over 30px, drawn on left/right edges
5. Weather type detection via WMO codes and internal icon overlays
6. Snow codes: `[71, 73, 75, 77, 85, 86]` — snowflakes, white/light base color depending on theme
7. Storm codes: `[95, 96, 99]` — lightning bolts, purple base color
8. Fallback: rain drops (water_drop icon, 3 per bar with jitter)
9. If bar exceeds max height, draws zigzag overflow indicator at the cap
10. Gradient uses `rgba(R, G, B, Math.max(0.1, A * 0.4))` for semi-transparent top blend

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `ctx = null` / `undefined` | Does not throw |
| `state.hourlyData` empty | For loop has no iterations, draws nothing |
| `PIXELS_PER_MM = 0` | Bar height = 0, draws nothing |
| `viewX` / `viewW` negative | Iterates unexpected indices, does not throw |
| `d.precip = 0` | Skips bar for that hour |
| Unrecognized weatherCode | Treated as rain by default |

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
