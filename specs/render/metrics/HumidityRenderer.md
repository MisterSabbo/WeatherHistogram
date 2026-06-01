# Spec: `src/render/metrics/HumidityRenderer.js`

## Purpose
Renders a dashed humidity line on the histogram canvas.

## Dependencies

### state
| Property | Access | Context |
|-----------|--------|----------|
| `state.hourlyData` | read | drawHumidity |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../../store.js` | `state` | access |
| `../../theme.js` | `getThemeColor` | line color |

## Public API

### `export function drawHumidity(ctx: CanvasRenderingContext2D, viewX: number, viewW: number, h: number, styles: Object, PIXELS_PER_HOUR: number): void`

**Description:** Draws dashed humidity line on the histogram.

| Parameter | Type | Description |
|-----------|------|-------------|
| `ctx` | `CanvasRenderingContext2D` | Canvas context |
| `viewX` | `number` | Viewport X start |
| `viewW` | `number` | Viewport width |
| `h` | `number` | Canvas height |
| `styles` | `Object` | Theme styles (uses `humidityLine`) |
| `PIXELS_PER_HOUR` | `number` | Pixels per hour |

**Metadata:**
- Mutates state: No
- Async: No

## Behavior

1. Renders only visible data (viewX to viewX+viewW) with ±5 hour buffer
2. Dashed line `[5, 5]` with theme color `humidityLine`
3. Y = `h - (h * (d.humidity / 100))`, X = `i * PIXELS_PER_HOUR`
4. Line width = 1

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `ctx = null` / `undefined` | Does not throw |
| `state.hourlyData` empty | Draws nothing, returns without error |
| `state.hourlyData` with only 1 point | Does not draw line (needs at least 2 points) |
| `h = 0` | Line at Y=0, does not throw |
| `viewX` / `viewW` negative | Draws nothing visible |
| `styles` without `humidityLine` | Uses `''` as color, invisible line |

## Test Scenarios

1. **Does not throw with mock data:** Calls `drawHumidity` with mock data, does not throw
2. **Does not throw with empty hourlyData:** `state.hourlyData = []`, does not throw
3. **Does not throw with ctx = null/undefined:** Null context, does not throw
4. **0% humidity:** Line at `y = h` (bottom)
5. **100% humidity:** Line at `y = 0` (top)
6. **Single point:** `hourlyData` with 1 point, does not draw line

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
