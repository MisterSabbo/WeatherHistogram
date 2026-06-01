# Spec: `src/render/MoonRenderer.js`

## Purpose
Draws a crescent moon icon on the canvas with glow.

## Dependencies

No external dependencies.

## Public API

### `export function drawMoon(ctx: CanvasRenderingContext2D, x: number, y: number, moonColor: string, glowColor: string): void`

**Description:** Draws crescent moon with radial glow.

| Parameter | Type | Description |
|-----------|------|-------------|
| `ctx` | `CanvasRenderingContext2D` | Canvas context |
| `x` | `number` | Center X position |
| `y` | `number` | Center Y position |
| `moonColor` | `string` | Moon color (e.g. `'#90caf9'`) |
| `glowColor` | `string` | Glow color (e.g. `'rgba(144,202,249,0.2)'`) |

**Metadata:**
- Mutates state: No
- Async: No

## Behavior

1. Radial glow (40px extra) with color `rgba(144, 202, 249, 0.2)`
2. Moon: arc from 0.2π to 1.8π with quadratic curve
3. Shadow blur 10px with glowColor

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `ctx = null` / `undefined` | Does not throw (ctx calls fail) |
| `x` / `y` negative | Draws outside canvas, does not throw |
| `moonColor` / `glowColor` empty | Uses empty string as color (does not throw, but drawing invisible) |
| `ctx` without `createRadialGradient` | Glow not drawn, `fill()` fails silently |
| `shadowBlur` not supported | Moon drawn without glow, does not throw |

## Test Scenarios

1. **Does not throw with valid parameters:** Calls `drawMoon` with valid colors and position, does not throw
2. **Does not throw with ctx = null/undefined:** Null context, does not throw
3. **Does not throw with negative coordinates:** `x = -10`, `y = -10`, does not throw
4. **Glow drawing:** `createRadialGradient` produces visible glow effect
5. **Invalid colors:** `moonColor = ''`, does not throw

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
