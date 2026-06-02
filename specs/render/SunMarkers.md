# Spec: `src/render/SunMarkers.js`

## Purpose
Draws sunrise and sunset markers on the histogram canvas with formatted time labels.

## Dependencies

### state
| Property | Access (R/W) | Context |
|-----------|-------------|----------|
| `state.hourlyData` | read | get startTime |
| `state.sunData` | read | sunrise/sunset per date |
| `state.timezone` | read | time formatting |

### CONFIG
| Constant | Context |
|-----------|----------|
| `CONFIG.PIXELS_PER_HOUR` | drawSunMarkersOnCanvas (position) |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../store.js` | `state` | access |
| `../theme.js` | `getThemeFont` | font |
| `../utils/i18n.js` | `getLocale` | locale for time formatting |

## Public API

### `export function drawSunMarkersOnCanvas(ctx, viewX, viewW, h, PIXELS_PER_HOUR): void`

**Description:** Draws sunrise (arrow up) and sunset (arrow down) markers with formatted time.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `ctx` | `CanvasRenderingContext2D` | Canvas context |
| `viewX` | `number` | Viewport X start |
| `viewW` | `number` | Viewport width |
| `h` | `number` | Canvas height |
| `PIXELS_PER_HOUR` | `number` | Pixels per hour |

**Mutates state:** No

**Async:** No

## Behavior

1. For each date in `state.sunData`, draws sunrise and sunset markers
2. Marker: semicircle (180°) with 5 rays + arrow indicator (up for sunrise, down for sunset); drawn with white outline (4px) + colored fill (2px, `#666666`)
3. Time formatted with `toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit', timeZone: state.timezone })`
4. Time label drawn below marker with white stroke then `#666666` fill for legibility
5. Skip entire marker if outside viewport ±50px
6. Uses `getThemeFont()` for font
7. Does nothing if `state.hourlyData` is empty

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `ctx = null` / `undefined` | Does not throw |
| `state.hourlyData` empty | Returns without drawing |
| `state.sunData` empty (`{}`) | No dates to iterate, draws nothing |
| Marker outside viewport (±50px) | Skipped, not drawn |
| `PIXELS_PER_HOUR = 0` | Infinite X position, does not throw |
| `h = 0` | Markers at Y=0, does not throw |

## Test Scenarios

1. **Does not throw with mock data:** Calls with mock data, does not throw
2. **Does not throw with empty hourlyData:** `state.hourlyData = []`, does not throw
3. **Does not throw with ctx = null/undefined:** Null context, does not throw
4. **Markers outside viewport:** Sunrise/sunset outside ±50px, not drawn
5. **Empty SunData:** `state.sunData = {}`, draws nothing
6. **Correct time format:** Time formatted with `toLocaleTimeString`

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
