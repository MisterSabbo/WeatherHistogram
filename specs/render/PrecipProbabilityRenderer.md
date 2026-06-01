# Spec: `src/render/PrecipProbabilityRenderer.js`

## Purpose
Renders precipitation probability as a shaded area with icons on the canvas.

## Dependencies

### state
| Property | Access | Context |
|-----------|--------|----------|
| `state.hourlyData` | read | drawPrecipitationProbability |
| `state.theme` | read | dark/light mode |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../store.js` | `state` | access |

## Public API

### `export function drawPrecipitationProbability(ctx: CanvasRenderingContext2D, viewX: number, viewW: number, h: number, styles: Object, PIXELS_PER_HOUR: number): void`

**Description:** Draws precipitation probability as a shaded area with icons.

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

1. Smooth bezierCurveTo probability path
2. Horizontal gradient by precipitation type (rain blue, snow gray, storm purple)
3. Random rain/snow/storm icons within the area
4. Bottom border with gradient

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `ctx = null` / `undefined` | Does not throw |
| `state.hourlyData` with < 2 points | Does not draw (needs at least 2 points for bezier) |
| `state.hourlyData` empty | Draws nothing |
| All `precipProb = 0` | Does not draw path or icons |
| `precipProb = 100` at all points | Full colored area |
| `viewX` negative | Draws with negative offset, does not throw |

## Test Scenarios

1. **Does not throw with mock data:** Calls `drawPrecipitationProbability` with mock data, does not throw
2. **Does not throw with empty hourlyData:** `state.hourlyData = []`, does not throw
3. **Does not throw with ctx = null/undefined:** Null context, does not throw
4. **0% probability:** `precipProb = 0` at all points, does not draw path
5. **100% probability:** `precipProb = 100` at all, full colored area
6. **Less than 2 points:** `hourlyData` with 1 point, does not draw bezier

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
