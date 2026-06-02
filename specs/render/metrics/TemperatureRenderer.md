# Spec: `src/render/metrics/TemperatureRenderer.js`

## Purpose
Draws the main temperature line with apparent temperature shading, cloud/wet shadow overlays, thunder effect, and temperature value dots.

## Dependencies

### state
| Property | Access (R/W) | Context |
|-----------|-------------|----------|
| `state.hourlyData` | read | drawTemperature |

### CONFIG
| Constant | Context |
|-----------|----------|
| `CONFIG.PIXELS_PER_HOUR` | drawTemperature (position) |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../../store.js` | `state` | access |
| `../../theme.js` | `getThemeColor`, `getThemeFont` | colors/font |
| `../../utils/math.js` | `normalizeY` | Y coordinate mapping |

## Public API

### `export function drawTemperature(ctx, viewX, viewW, h, styles, PIXELS_PER_HOUR): void`

**Description:** Draws temperature line with apparent temperature shading, shadow overlays, and value markers.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `ctx` | `CanvasRenderingContext2D` | Canvas context |
| `viewX` | `number` | Viewport X start |
| `viewW` | `number` | Viewport width |
| `h` | `number` | Canvas height |
| `styles` | `Object` | Theme styles (unused directly) |
| `PIXELS_PER_HOUR` | `number` | Pixels per hour |

**Mutates state:** No

**Async:** No

## Behavior

1. **Apparent temperature shading:** Fills area between temp and apparent lines when difference >= 1°C — blue `rgba(2, 136, 209, 0.2)` when apparent < temp (feels colder), red `rgba(239, 68, 68, 0.2)` when apparent > temp (feels hotter)
2. **Apparent temperature line:** Dashed `[4,4]` line drawn segment-by-segment only where `|temp - apparent| >= 1`; color is blue if feels colder, orange/red if feels hotter; has conditional glow/shadow effects based on cloud (gray shadow) or wet (cyan glow) conditions
3. **Base temperature line:** 3px solid line across all segments
4. **Segment effects per pair of points:**
   - **Clear/sun segments:** Orange glow shadow on the line (mobile: 20/24px, desktop: 25/30px), double-stroked at night for extra visibility
   - **Cloudy segments:** Dark shadow below + light highlight above + diffuse shadow (8px blur, 4px offsetY)
   - **Wet (rain/snow) segments:** Thick overlay (7px for rain, 5px for snow with dash `[2,4]` and white glow); snow has an additional 2px white inner stroke
   - **Thunder segments:** Animated zigzag electricity line (time-driven phase, `Date.now() / 150`), yellow glow stroke along the temp-apparent area, 15 steps per segment with perpendicular oscillation
5. **Temperature dots & values:** Small circle (r=3) per data point + rounded temperature label above (`Math.round(d.temp) + "°"`); wet/cloudy hours get white shadow on label for readability
6. Y mapping via `normalizeY(value, -20, 40, h)`

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `ctx = null` / `undefined` | Does not throw |
| `state.hourlyData` empty | No iterations, draws nothing |
| `state.hourlyData` with 1 point | Draws no line segments (needs pairs) |
| `d.temp = undefined` | Y = NaN, line segment not drawn |
| `diff < 1` in all segments | Apparent line not drawn, only base temp + dots |
| `viewX` / `viewW` negative | Iterates unexpected indices, does not throw |

## Test Scenarios

1. **Does not throw with mock data:** Calls drawTemperature with mock data, does not throw
2. **Does not throw with empty hourlyData:** `state.hourlyData = []`, does not throw
3. **Does not throw with ctx = null/undefined:** Null context, does not throw
4. **Temp = apparent at all points:** Only base line and dots drawn, no shading
5. **All wet:** All points have precipProb > 15 and temp below prob line, wet overlay drawn
6. **Thunder effect:** Thunder weather codes + wet, animated electricity lines drawn

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
