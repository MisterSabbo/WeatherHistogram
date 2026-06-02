# Spec: `src/render/metrics/HumidityRenderer.js`

## Purpose
Draws the humidity line (dashed) on the histogram canvas.

## Dependencies

### state
| Property | Access (R/W) | Context |
|-----------|-------------|----------|
| `state.hourlyData` | read | drawHumidity |

### CONFIG
| Constant | Context |
|-----------|----------|
| `CONFIG.PIXELS_PER_HOUR` | drawHumidity (position) |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../../store.js` | `state` | access |
| `../../theme.js` | `getThemeColor` | line color |

## Public API

### `export function drawHumidity(ctx, viewX, viewW, h, styles, PIXELS_PER_HOUR): void`

**Description:** Draws a dashed humidity line from 0–100% mapped to 0–h height.

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

1. Draws a single dashed `[5,5]` polyline connecting all hourly humidity values
2. Y = `h - (h * (d.humidity / 100))` — 0% at bottom, 100% at top
3. Color from `getThemeColor('humidityLine', 'rgba(0, 188, 212, 0.3)')`
4. Line width: 1px
5. Resets line dash to `[]` after drawing

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `ctx = null` / `undefined` | Does not throw |
| `state.hourlyData` empty | No iterations, draws nothing |
| `d.humidity = undefined` | Y = NaN, line segment not drawn |
| `viewX` / `viewW` negative | Iterates unexpected indices, does not throw |

## Test Scenarios

1. **Does not throw with mock data:** Calls drawHumidity with mock data, does not throw
2. **Does not throw with empty hourlyData:** `state.hourlyData = []`, does not throw
3. **Does not throw with ctx = null/undefined:** Null context, does not throw
4. **Full humidity:** All values 100, line at top of canvas
5. **Zero humidity:** All values 0, line at bottom

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
