# Spec: `src/render/metrics/WindRenderer.js`

## Purpose
Draws wind direction arrows every 3 hours on the histogram canvas.

## Dependencies

### state
| Property | Access (R/W) | Context |
|-----------|-------------|----------|
| `state.hourlyData` | read | drawWind |
| `state.theme` | read | wind color selection |

### CONFIG
| Constant | Context |
|-----------|----------|
| `CONFIG.PIXELS_PER_HOUR` | drawWind (position) |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../../store.js` | `state` | access |
| `../../theme.js` | `getThemeColor`, `getThemeIcon` | colors/icon |

## Public API

### `export function drawWind(ctx, viewX, viewW, h, styles, PIXELS_PER_HOUR): void`

**Description:** Draws wind direction arrows (rotated icons or arrow shapes) every 3 hours.

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

1. Draws wind direction indicator only at hours where `d.localHour % 3 === 0`
2. Position: center of hour tile at Y=35 (top of chart)
3. Arrow is rotated by `(d.windDir + 180) * PI / 180` degrees (wind direction + 180 to show where wind is going)
4. If `getThemeIcon('windDirection')` returns a Material icon, uses that (stroke + fill); otherwise draws an arrow polygon (point-up triangle with notch)
5. Color logic:
   - If `d.temp < 10`: wind color from `getThemeColor('wind.cold', '#3b82f6')` (blue)
   - If `d.temp > 28`: wind color from `getThemeColor('wind.hot', '#ef4444')` (red)
   - If `d.wind > 40` and temp between 10-28: strong wind color (dark red/light red based on theme)
   - Default: normal wind color based on theme (dark/light)
6. White shadow `rgba(255, 255, 255, 0.8)` at 4px blur for readability
7. Icon/arrow has a dark stroke outline for contrast

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `ctx = null` / `undefined` | Does not throw |
| `state.hourlyData` empty | No iterations, draws nothing |
| `d.windDir = undefined` | Rotation = NaN, arrow not visible |
| `d.localHour % 3 !== 0` | Skips that hour |
| `viewX` / `viewW` negative | Iterates unexpected indices, does not throw |

## Test Scenarios

1. **Does not throw with mock data:** Calls drawWind with mock data, does not throw
2. **Does not throw with empty hourlyData:** `state.hourlyData = []`, does not throw
3. **Does not throw with ctx = null/undefined:** Null context, does not throw
4. **Every 3 hours:** Only hours where localHour % 3 === 0 have arrows
5. **Cold temp color:** temp < 10, arrow is blue
6. **Hot temp color:** temp > 28, arrow is red

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
