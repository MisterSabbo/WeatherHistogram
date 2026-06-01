# Spec: `src/render/SunMarkers.js`

## Purpose
Draws sunrise and sunset markers on the canvas with formatted time.

## Dependencies

### state
| Property | Access | Context |
|-----------|--------|----------|
| `state.hourlyData` | read | get startTime |
| `state.sunData` | read | sunrise/sunset by date |
| `state.timezone` | read | formatting |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../store.js` | `state` | access |
| `../theme.js` | `getThemeFont` | font |
| `../utils/i18n.js` | `getLocale` | locale |

## Public API

### `export function drawSunMarkersOnCanvas(ctx: CanvasRenderingContext2D, viewX: number, viewW: number, h: number, PIXELS_PER_HOUR: number): void`

**Description:** Draws sunrise and sunset markers.

| Parameter | Type | Description |
|-----------|------|-------------|
| `ctx` | `CanvasRenderingContext2D` | Canvas context |
| `viewX` | `number` | Viewport X start |
| `viewW` | `number` | Viewport width |
| `h` | `number` | Canvas height |
| `PIXELS_PER_HOUR` | `number` | Pixels per hour |

**Metadata:**
- Mutates state: No
- Async: No

## Behavior

1. For each date in sunData, draws sunrise and sunset markers
2. Marker: semicircle with rays + arrow up (sunrise) or down (sunset)
3. Time formatted with toLocaleTimeString
4. Skip if outside viewport (±50px)

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `ctx = null` / `undefined` | Does not throw |
| `state.hourlyData` empty | Does not draw, returns without error |
| `state.sunData` empty (`{}`) | No sunrise/sunset, draws nothing |
| Marker outside viewport (±50px) | Skip, does not draw |
| `PIXELS_PER_HOUR = 0` | Infinite X position, does not throw |
| `h = 0` | Markers at Y=0, does not throw |

## Test Scenarios

1. **Does not throw with mock data:** Calls `drawSunMarkersOnCanvas` with mock data, does not throw
2. **Does not throw with empty hourlyData:** `state.hourlyData = []`, does not throw
3. **Does not throw with ctx = null/undefined:** Null context, does not throw
4. **Markers outside viewport:** Sunrise/sunset outside ±50px, not drawn
5. **Empty SunData:** `state.sunData = {}`, draws nothing
6. **Correct time format:** Time formatted with `toLocaleTimeString`

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
