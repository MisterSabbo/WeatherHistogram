# Spec: `src/render/StickmanRenderer.js`

## Purpose
Renders an animated stickman with weather-adaptive reactions (heat, cold, rain, snow, wind, night, sun).

## Dependencies

No external dependencies — pure canvas drawing function.

## Public API

### `export function drawStickman(ctx, x, y, walkPhase, apparentTemp, precCode, isWindy, isDarkTheme, isNight, thresholds, precipAmt, clouds): void`

**Description:** Draws animated stickman with weather reactions.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `ctx` | `CanvasRenderingContext2D` | Canvas context |
| `x` | `number` | X position |
| `y` | `number` | Y position |
| `walkPhase` | `number` | Animation phase (0-1) for walk cycle |
| `apparentTemp` | `number` | Apparent temperature in °C |
| `precCode` | `number` | WMO precipitation code |
| `isWindy` | `boolean` | Whether strong wind is active |
| `isDarkTheme` | `boolean` | Whether dark theme is active |
| `isNight` | `boolean` | Whether it is night |
| `thresholds` | `Object` | Thresholds `{ cold: number, hot: number, wind: number, clouds: number }` |
| `precipAmt` | `number` | Precipitation amount (mm) |
| `clouds` | `number` | Cloud cover (0-100) |

**Mutates state:** No

**Async:** No

## Behavior

1. **Inverted halo:** Black in dark theme, white in light theme, 6px blur
2. **Color:** Stroke `#e2e8f0` (dark) / `#1e293b` (light), 2.5px line width
3. **Walk animation:** Sinusoidal leg/arm swing (`Math.PI / 4` max), two steps per phase, vertical bounce via `abs(sin(phase * 4π)) * 1.5`
4. **Wind lean:** Rotates context by `π/10` radians when windy
5. **Drawing order:** Back leg → back arm → body/head → front leg → front arm → accessories
6. **Reactions:**
   - **Hot** (`apparentTemp >= thresholds.hot`): Reddish face `#fca5a5` with red border
   - **Cold** (`apparentTemp <= thresholds.cold`): Red scarf + crossed arms (rubbing body), unless snowing (arms swing normally with gloves)
   - **Rain** (precip > 0 and not snow): Umbrella (blue canopy `#0288d1`), forward arm holds handle
   - **Snow** (WMO 71-77, 85, 86): Purple boots `#8b5cf6` on both legs + purple gloves on both arms; arms swing normally
   - **Sunny day** (!isNight && clouds < threshold): Sunglasses (right lens + earpiece)
   - **Night:** Floating "zzz" text above head, animated with walk phase offset
   - **Windy** (`isWindy = true`): Wind lines (2 horizontal lines with time-based scrolling phase)
7. Head is always white (except hot) with `shadowBlur = 0` to avoid halo effect on face

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `ctx = null` / `undefined` | Does not throw |
| `walkPhase` outside [0, 1] | Distorted animation (sin still works), does not throw |
| `apparentTemp = Infinity` / `-Infinity` | Does not throw, extreme condition |
| `thresholds` incomplete (no `cold`/`hot`) | Comparison with `undefined`, does not throw |
| `isNight && isWindy && precip > 0` | Multiple combined reactions drawn (umbrella, wind lines, zzz) |
| `clouds = undefined` | Treated as undefined in comparison, does not throw |

## Test Scenarios

1. **Does not throw with valid parameters:** Calls drawStickman with mock data, does not throw
2. **Does not throw with ctx = null/undefined:** Null context, does not throw
3. **Heat reaction:** apparentTemp > thresholds.hot, red face
4. **Cold reaction:** apparentTemp < thresholds.cold, scarf + crossed arms
5. **Rain reaction:** Active precipitation code, umbrella
6. **Multiple combined reactions:** Night + wind + rain simultaneously

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
