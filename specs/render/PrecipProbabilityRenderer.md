# Spec: `src/render/PrecipProbabilityRenderer.js`

## Purpose
Renders precipitation probability as a shaded area with random weather icons on the canvas.

## Dependencies

### state
| Property | Access (R/W) | Context |
|-----------|-------------|----------|
| `state.hourlyData` | read | drawPrecipitationProbability |
| `state.theme` | read | dark/light mode (opacity/color) |

### CONFIG
| Constant | Context |
|-----------|----------|
| `CONFIG.PIXELS_PER_HOUR` | drawPrecipitationProbability (position) |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../store.js` | `state` | access |

## Public API

### `export function drawPrecipitationProbability(ctx, viewX, viewW, h, styles, PIXELS_PER_HOUR): void`

**Description:** Draws precipitation probability as a smooth bezier-filled area with random weather icons (rain lines, snowflakes, thunder bolts) inside the area.

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

1. Builds points from hourly data: y = `h - (h * (d.precipProb / 100))`
2. Needs at least 1 point with `precipProb > 0` and at least 2 total points to draw
3. Smooth bezier curve using `bezierCurveTo` with control points at midpoint x (same y as endpoints)
4. Closed fill path from top curve to bottom of canvas
5. Fill is clipped to the fill path, then filled with horizontal per-point gradient
6. Gradient colors: rain blue `(2, 136, 209)`, snow gray `(148, 163, 184)`, storm purple `(94, 53, 177)` based on WMO code; opacity 0.15 (dark) / 0.08 (light)
7. Random weather icons scattered within the area (clipped, opacity 0.2 dark / 0.15 light):
   - Snow (`ac_unit` icon) for codes [71,73,75,77,85,86]
   - Thunder (`bolt` icon) for codes [95,96,99], only 1 per row
   - Rain (angled line segments) for all other prob>0 areas
   - 4 icons per data point, seeded pseudo-random positioning
8. Bottom border: horizontal per-point gradient stroke along the bezier curve, 1.5px width, opacity 0.8 (dark) / 0.7 (light)

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `ctx = null` / `undefined` | Does not throw |
| `state.hourlyData` with < 2 points | Returns early (needs 2+ for bezier) |
| `state.hourlyData` empty | Returns early |
| All `precipProb = 0` | `hasProb = false`, returns early |
| `precipProb = 100` at all points | Full colored area from top to bottom |
| `viewX` negative | Draws with negative offset, does not throw |

## Test Scenarios

1. **Does not throw with mock data:** Calls with mock data, does not throw
2. **Does not throw with empty hourlyData:** `state.hourlyData = []`, does not throw
3. **Does not throw with ctx = null/undefined:** Null context, does not throw
4. **0% probability:** `precipProb = 0` at all points, does not draw path
5. **100% probability:** `precipProb = 100` at all, full colored area
6. **Less than 2 points:** `hourlyData` with 1 point, does not draw bezier

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
