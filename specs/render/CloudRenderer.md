# Spec: `src/render/CloudRenderer.js`

## Purpose
Renders cloud cover as a shaded area with smooth bezier path, contour layers, and border line on the canvas.

## Dependencies

### state
| Property | Access (R/W) | Context |
|-----------|-------------|----------|
| `state.hourlyData` | read | drawClouds |

### CONFIG
| Constant | Context |
|-----------|----------|
| `CONFIG.PIXELS_PER_HOUR` | drawClouds (position) |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../store.js` | `state` | access |

## Public API

### `export function drawClouds(ctx, viewX, viewW, h, styles, PIXELS_PER_HOUR): void`

**Description:** Draws cloud area with horizontal per-point gradient, multiple contour layers with progressive offsets, and a border line with glow.

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

1. Renders points at `(i * PIXELS_PER_HOUR, h - (h * (d.clouds / 100)))`
2. Smooth path using `bezierCurveTo` with control points at midpoint x between consecutive points
3. Closed fill path from first point top → go down to bottom → across → up to last point top → close
4. Fill is clipped to the cloud path, then filled with horizontal per-point gradient
5. Gradient luma per point: `255 - (d.clouds / 100) * 115`, giving darker values for higher clouds
6. 5 decorative contour layers drawn with progressive vertical offsets (5, 12, 25, 45, 65px), widths (4, 8, 15, 22, 30px), and decreasing opacity (0.3 → 0.03)
7. Border line: horizontal per-point gradient with luma `230 - (d.clouds / 100) * 110`, 2.5px width, shadow glow `rgba(255, 255, 255, 0.4)` at 8px blur, offset 1px down
8. Needs at least 2 data points to draw (bezier requires 2+ points)

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `ctx = null` / `undefined` | Does not throw |
| `state.hourlyData` with < 2 points | Returns early without drawing |
| `state.hourlyData` empty | Returns early without drawing |
| `viewX` negative | Draws with negative offset, does not throw |
| `h = 0` | All points at y=0, draws nothing visible |
| `clouds = 100` at all points | Minimum luma (140), full coverage |
| `clouds = 0` at all points | Maximum luma (255), very light area |

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
