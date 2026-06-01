# Spec: `src/render/CloudRenderer.js`

## Purpose
Renders cloud cover as a shaded area with smooth path on the canvas.

## Dependencies

### state
| Property | Access | Context |
|-----------|--------|----------|
| `state.hourlyData` | read | drawClouds |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../store.js` | `state` | access |

## Public API

### `export function drawClouds(ctx: CanvasRenderingContext2D, viewX: number, viewW: number, h: number, styles: Object, PIXELS_PER_HOUR: number): void`

**Description:** Draws cloud area with horizontal gradient, multiple contour layers and border line.

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

1. Renders points `(x, i*PPH)` and `y = h - (h * (clouds/100))`
2. Smooth path with bezierCurveTo (control points at midpoint x)
3. Horizontal gradient: luma = `255 - (clouds/100) * 115` per point
4. 5 contour layers with progressive offset and width
5. Border line with glow

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `ctx = null` / `undefined` | Does not throw |
| `state.hourlyData` with < 2 points | Does not draw (needs at least 2 points for bezier) |
| `state.hourlyData` empty | Draws nothing |
| `viewX` negative | Draws with negative offset, does not throw |
| `h = 0` | Draws nothing (zero height) |
| `clouds = 100` at all points | Minimum luma (140), full coverage |
| `clouds = 0` at all points | Maximum luma (255), transparent area |

## Test Scenarios

1. **Does not throw with mock data:** Calls `drawClouds` with mock data, does not throw
2. **Does not throw with empty hourlyData:** `state.hourlyData = []`, does not throw
3. **Does not throw with ctx = null/undefined:** Null context, does not throw
4. **0% coverage:** `clouds = 0` at all points, transparent area
5. **100% coverage:** `clouds = 100` at all points, minimum luma
6. **Less than 2 points:** `hourlyData` with 1 point, does not draw bezier

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
