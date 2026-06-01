# Spec: `src/render/StickmanRenderer.js`

## Purpose
Renders an animated stickman with weather reactions (heat, cold, rain, snow, wind, night, sun).

## Dependencies

No external dependencies.

## Public API

### `export function drawStickman(ctx: CanvasRenderingContext2D, x: number, y: number, walkPhase: number, apparentTemp: number, precCode: number, isWindy: boolean, isDarkTheme: boolean, isNight: boolean, thresholds: Object, precipAmt: number, clouds: number): void`

**Description:** Draws animated stickman with weather reactions.

| Parameter | Type | Description |
|-----------|------|-------------|
| `ctx` | `CanvasRenderingContext2D` | Canvas context |
| `x` | `number` | X position |
| `y` | `number` | Y position |
| `walkPhase` | `number` | Animation phase (0-1) |
| `apparentTemp` | `number` | Apparent temperature in °C |
| `precCode` | `number` | WMO precipitation code |
| `isWindy` | `boolean` | If strong wind |
| `isDarkTheme` | `boolean` | Dark theme active |
| `isNight` | `boolean` | Is night |
| `thresholds` | `Object` | Thresholds `{ cold, hot, wind, clouds }` |
| `precipAmt` | `number` | Precipitation amount |
| `clouds` | `number` | Cloud cover (0-100) |

**Metadata:**
- Mutates state: No
- Async: No

## Behavior

1. Animated walk with sinusoidal phase (legs, arms, bounce)
2. Reactions: heat → red face, cold → scarf + crossed arms, rain → umbrella, snow → purple boots/gloves, wind → lines + lean, night → zzz, sun → sunglasses
3. `walkPhase` controls animation cycle (0-1)
4. Inverted halo based on theme (black in dark, white in light)

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `ctx = null` / `undefined` | Does not throw |
| `walkPhase` outside [0, 1] | Distorted animation, does not throw |
| `apparentTemp = Infinity` / `-Infinity` | Does not throw, extreme condition |
| `thresholds` incomplete (no `cold`/`hot`) | Comparison with `undefined`, does not throw |
| `isNight && isWindy && precip > 0` | Multiple combined reactions |
| `clouds = undefined` | Treated as 0 in comparison with threshold |

## Test Scenarios

1. **Does not throw with valid parameters:** Calls `drawStickman` with mock data, does not throw
2. **Does not throw with ctx = null/undefined:** Null context, does not throw
3. **Heat reaction:** `apparentTemp > thresholds.hot`, red face
4. **Cold reaction:** `apparentTemp < thresholds.cold`, scarf + crossed arms
5. **Rain reaction:** Active precipitation code, umbrella
6. **Multiple combined reactions:** Night + wind + rain simultaneously

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
