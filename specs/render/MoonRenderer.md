# Spec: `src/render/MoonRenderer.js`

## Purpose
Draws a crescent moon icon on the canvas with radial glow.

## Dependencies

No external dependencies — pure canvas drawing function.

## Public API

### `export function drawMoon(ctx, x, y, moonColor, glowColor): void`

**Description:** Draws crescent moon with radial glow.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `ctx` | `CanvasRenderingContext2D` | Canvas context |
| `x` | `number` | Center X position |
| `y` | `number` | Center Y position |
| `moonColor` | `string` | Moon fill color (e.g. `'#f5f5f5'`) |
| `glowColor` | `string` | Glow shadow color (e.g. `'#90caf9'`) |

**Mutates state:** No

**Async:** No

## Behavior

1. Radial glow: `createRadialGradient(x, y, radius, x, y, radius + 40)` with `rgba(144, 202, 249, 0.2)` at center fading to `rgba(144, 202, 249, 0)` at edge
2. Moon crescent shape: arc from `0.2 * Math.PI` to `1.8 * Math.PI` (radius 20), closed with `quadraticCurveTo` through right midpoint
3. Moon fill uses `moonColor` parameter
4. Shadow: `shadowBlur = 10` with `shadowColor = glowColor`

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `ctx = null` / `undefined` | Does not throw |
| `x` / `y` negative | Draws outside canvas, does not throw |
| `moonColor` / `glowColor` empty | Uses empty string as color (invisible, does not throw) |
| `ctx` without `createRadialGradient` | Glow not drawn, fills silently |

## Test Scenarios

1. **Does not throw with valid parameters:** Calls `drawMoon` with valid colors and position, does not throw
2. **Does not throw with ctx = null/undefined:** Null context, does not throw
3. **Does not throw with negative coordinates:** `x = -10`, `y = -10`, does not throw
4. **Glow drawing:** `createRadialGradient` produces visible glow effect around moon
5. **Invalid colors:** `moonColor = ''`, does not throw

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
