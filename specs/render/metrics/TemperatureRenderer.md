# Spec: `src/render/metrics/TemperatureRenderer.js`

## Purpose
Renders the temperature line, apparent temperature, shadows and weather effects on the histogram canvas.

## Dependencies

### state
| Property | Access | Context |
|-----------|--------|----------|
| `state.hourlyData` | read | drawTemperature |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../../store.js` | `state` | access |
| `../../theme.js` | `getThemeColor`, `getThemeFont` | colors |
| `../../utils/math.js` | `normalizeY` | calculate Y |

## Public API

### `export function drawTemperature(ctx: CanvasRenderingContext2D, viewX: number, viewW: number, h: number, styles: Object, PIXELS_PER_HOUR: number): void`

**Description:** Draws base temperature line (red), dotted apparent temperature line, shadows and effects.

| Parameter | Type | Description |
|-----------|------|-------------|
| `ctx` | `CanvasRenderingContext2D` | Canvas context |
| `viewX` | `number` | Viewport X start |
| `viewW` | `number` | Viewport width |
| `h` | `number` | Canvas height |
| `styles` | `Object` | Theme styles |
| `PIXELS_PER_HOUR` | `number` | Pixels per hour |

**Metadata:**
- Mutates state: No
- Async: No

## Behavior

1. Base line: red (`tempLine`), width 3, with dots at each hour
2. Apparent temperature: dotted line `[4,4]` blue if colder, orange if warmer
3. Difference >= 1°C between temp and apparent → draws shaded area between both
4. Dynamic effects: solar glow on clear sky, cloud shadow, blue overlay on rain, white on snow, yellow on storm
5. Temperature labels at each point with glow if clouds/rain

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `ctx = null` / `undefined` | Does not throw |
| `state.hourlyData` empty | Draws nothing |
| `state.hourlyData` with < 2 points | Cannot draw line, does not draw |
| `d.temp = null` / `undefined` for some points | Skip that point, discontinuous line |
| `d.apparent === d.temp` (difference < 1°C) | Does not draw dotted apparent line |
| `h = 0` | All Y = 0, does not throw |
| Extreme temperatures (>50°C or <-30°C) | Y out of range, label is drawn |

## Test Scenarios

1. **Does not throw with mock data:** Calls `drawTemperature` with mock data, does not throw
2. **Does not throw with empty hourlyData:** `state.hourlyData = []`, does not throw
3. **Does not throw with ctx = null/undefined:** Null context, does not throw
4. **Base temperature line:** Normal temp draws red line with dots
5. **Different apparent temperature:** `apparent != temp` (≥1°C), draws dotted line and shaded area
6. **Extreme temperature:** `temp > 50°C` or `temp < -30°C`, label visible

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
