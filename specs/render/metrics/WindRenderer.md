# Spec: `src/render/metrics/WindRenderer.js`

## Purpose
Renders wind direction indicators on the histogram canvas.

## Dependencies

### state
| Property | Access | Context |
|-----------|--------|----------|
| `state.hourlyData` | read | drawWind |
| `state.theme` | read | colors |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../../store.js` | `state` | access |
| `../../theme.js` | `getThemeColor`, `getThemeIcon` | colors and icons |

## Public API

### `export function drawWind(ctx: CanvasRenderingContext2D, viewX: number, viewW: number, h: number, styles: Object, PIXELS_PER_HOUR: number): void`

**Description:** Draws wind direction arrows every 3 hours with color based on temperature.

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

1. Renders every 3 hours (localHour % 3 === 0)
2. Arrow rotated according to `d.windDir + 180` degrees
3. Wind color based on temperature: <10°C → blue, >28°C → red
4. If wind >40 km/h with temp between 10-28°C → strong color
5. Uses theme icon if exists, otherwise draws arrow with path

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `ctx = null` / `undefined` | Does not throw |
| `state.hourlyData` empty | Draws nothing |
| `windDir = undefined` at point | Rotation with NaN, does not throw |
| `d.temp = undefined` | Default color (not blue/red) |
| `viewX` / `viewW` negative | Draws nothing visible |
| `styles` without wind icon | Draws default path (simple arrow) |

## Test Scenarios

1. **Does not throw with mock data:** Calls `drawWind` with mock data, does not throw
2. **Does not throw with empty hourlyData:** `state.hourlyData = []`, does not throw
3. **Does not throw with ctx = null/undefined:** Null context, does not throw
4. **Arrow rotation:** `windDir = 90` rotates arrow correctly
5. **Color by temperature:** `temp < 10°C` → blue, `temp > 28°C` → red
6. **3-hour interval:** Only draws at `localHour % 3 === 0`

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
