# Spec: `src/render/GridRenderer.js`

## Purpose
Renders the histogram grid (horizontal temperature lines, zero degree line, day names, X axes with hour labels).

## Dependencies

### state
| Property | Access (R/W) | Context |
|-----------|-------------|----------|
| `state.hourlyData` | read | drawDayNames, drawAxes |
| `state.sunData` | read | drawAxes (sunrise/sunset collision) |

### CONFIG
| Constant | Context |
|-----------|----------|
| `CONFIG.PIXELS_PER_HOUR` | drawDayNames, drawAxes (position) |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../store.js` | `state` | access |
| `../theme.js` | `getThemeColor`, `getThemeFont` | colors/font |
| `../utils/math.js` | `normalizeY` | Y coordinate mapping |
| `../utils/time.js` | `formatHour` | hour label formatting |

## Public API

### `export function drawGrid(ctx, viewX, viewW, h): void`

**Description:** Draws horizontal temperature grid lines every 10°C (-20 to 40) + dashed 0°C line.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `ctx` | `CanvasRenderingContext2D` | Canvas context |
| `viewX` | `number` | Viewport X start |
| `viewW` | `number` | Viewport width |
| `h` | `number` | Canvas height |

**Mutates state:** No

**Async:** No

### `export function drawDayNames(ctx, viewX, viewW, h, styles, PIXELS_PER_HOUR): void`

**Description:** Draws large semi-transparent day names (80px, 15% opacity) centered on each calendar day.

**Mutates state:** No

**Async:** No

### `export function drawAxes(ctx, viewX, viewW, h, styles, PIXELS_PER_HOUR): void`

**Description:** Draws hour labels with tick marks, skipping labels that overlap with sunrise/sunset markers (< 25px).

**Mutates state:** No

**Async:** No

## Behavior

1. **drawGrid:** Solid `#e0e0e0` lines for temperatures -20 to 40 every 10°C; dashed `[4,4]` zero line at 0°C using `getThemeColor('zeroLine')`; ends by setting strokeStyle to `rgba(0,0,0,0.08)`
2. **drawDayNames:** Large text (900 weight, 80px), uses `getThemeFont()`, opacity 0.15; finds first day start at `localHour === 0` going backwards; centers text at midpoint of each data day
3. **drawAxes:** Hour labels with 8px tick at top, `formatHour(d.localHour)`, avoids overlap with sunrise/sunset markers (< 25px); white shadow for legibility; uses `getThemeColor('xAxisLabel')` for label color

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `ctx = null` / `undefined` | Does not throw |
| `state.hourlyData` empty | `drawDayNames` and `drawAxes` draw nothing |
| `viewX` / `viewW` negative | Draws outside viewport, does not throw |
| `h = 0` | Does not draw lines (zero height) |
| Hour labels overlapping with sunrise/sunset (< 25px) | Label skipped, avoids collision |
| `styles` without color properties | Uses default values, does not throw |

## Test Scenarios

1. **Does not throw with mock data:** Calls `drawGrid` with mock data, does not throw
2. **Does not throw with empty hourlyData:** `state.hourlyData = []`, sub-modules draw nothing
3. **Does not throw with ctx = null/undefined:** Null context, does not throw
4. **0°C line:** Drawn dashed [4,4] at corresponding Y
5. **Hour label collision:** Labels near sunrise/sunset are skipped
6. **Day names:** Text correctly centered per day

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
