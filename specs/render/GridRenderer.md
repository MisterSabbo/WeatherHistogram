# Spec: `src/render/GridRenderer.js`

## Purpose
Renders the histogram grid (horizontal temperature lines, zero degree line, day names, X axes with hours).

## Dependencies

### state
| Property | Access | Context |
|-----------|--------|----------|
| `state.hourlyData` | read | drawDayNames, drawAxes |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../store.js` | `state` | access |
| `../theme.js` | `getThemeColor`, `getThemeFont` | colors/font |
| `../utils/math.js` | `normalizeY` | Y |
| `../utils/time.js` | `formatHour` | hour labels |

## Public API

### `export function drawGrid(ctx: CanvasRenderingContext2D, viewX: number, viewW: number, h: number, styles: Object, PIXELS_PER_HOUR: number): void`

**Description:** Draws horizontal lines every 10°C (-20 to 40) + dashed 0°C line.

| Parameter | Type | Description |
|-----------|------|-------------|
| `ctx` | `CanvasRenderingContext2D` | Canvas context |
| `viewX` | `number` | Viewport X start |
| `viewW` | `number` | Viewport width |
| `h` | `number` | Canvas height |
| `styles` | `Object` | Theme styles |
| `PIXELS_PER_HOUR` | `number` | Pixels per hour |

**Metadata:** Mutates state: No, Async: No

### `export function drawDayNames(ctx: CanvasRenderingContext2D, viewX: number, viewW: number, h: number, styles: Object, PIXELS_PER_HOUR: number): void`

**Description:** Draws large semi-transparent day names.

**Metadata:** Mutates state: No, Async: No

### `export function drawAxes(ctx: CanvasRenderingContext2D, viewX: number, viewW: number, h: number, styles: Object, PIXELS_PER_HOUR: number, CHART_HEIGHT: number): void`

**Description:** Draws hour labels with tick marks, skipping sunrise/sunset.

| Additional parameter | Type | Description |
|---------------------|------|-------------|
| `CHART_HEIGHT` | `number` | Height of the histogram canvas |

**Metadata:** Mutates state: No, Async: No

## Behavior

1. `drawGrid`: solid line #e0e0e0 for temperatures, dashed [4,4] for 0°C
2. `drawDayNames`: large text (80px), centered on each day, opacity 0.15
3. `drawAxes`: hour labels with 8px tick, avoids overlap with sun/shadow markers (<25px)

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `ctx = null` / `undefined` | Does not throw |
| `state.hourlyData` empty | `drawDayNames` and `drawAxes` draw nothing |
| `viewX` / `viewW` negative | Draws nothing visible, does not throw |
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
