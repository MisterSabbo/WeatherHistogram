# Spec: `src/render/MinimapRenderer.js`

## Purpose
Renders the minimap (reduced histogram view with past/future mode), viewport selector, and click handling for navigation.

## Dependencies

### state
| Property | Access (R/W) | Context |
|-----------|-------------|----------|
| `state.hourlyData` | read | draw, updateViewport, handleClick, setCanvasSize |
| `state.dpr` | read | draw, setCanvasSize |
| `state.theme` | read | draw (past overlay, colors) |
| `state.sunData` | read | not used directly |

### CONFIG (via parameter)
| Constant | Context |
|-----------|----------|
| `config.PIXELS_PER_HOUR` | updateViewport, handleClick |

### DOM
| Element | Access type | Context |
|----------|---------------|----------|
| `#minimap-container` | getElementById | updateViewport (scrolling) |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../utils/time.js` | `getSplitIndex` | split past/future data |
| `../theme.js` | `getThemeColor`, `getThemeFont` | colors/font |
| `../utils/math.js` | `normalizeY` | temperature Y |

## Public API

### `export class MinimapRenderer`

#### `constructor(options)`

**Description:** Initializes the minimap renderer with canvas, context, viewport selector, scroll container, callbacks, and height.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `options.canvas` | `HTMLCanvasElement` | Minimap canvas |
| `options.ctx` | `CanvasRenderingContext2D` | Canvas context |
| `options.viewportEl` | `HTMLElement` | Viewport selector element |
| `options.scrollContainer` | `HTMLElement` | Scroll container |
| `options.centerOnCurrentTime` | `Function` | Callback to center on current time |
| `options.updateNowButtonPosition` | `Function` | Callback to update now button |
| `options.minimapHeight` | `number` | Minimap height |

**Mutates state:** Yes (internal properties)

**Async:** No

#### `invalidateCache(): void`

**Description:** Sets `cacheCanvas = null` to force redraw on next `draw()`.

#### `setMode(mode, isUserInteraction, state, config): void`

**Description:** Changes past/future mode. If user interaction, scrolls to appropriate position (future → center on current time, past → scrollLeft=0). Re-caches and re-draws if mode changed.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `mode` | `string` | `'past'` or `'future'` |
| `isUserInteraction` | `boolean` | Whether triggered by user |
| `state` | `Object` | App state |
| `config` | `Object` | Config |

#### `updateViewport(state, config): void`

**Description:** Updates viewport selector position and auto-switches mode based on scroll center (past mode if center < splitIndex, future if center >= splitIndex). Auto-switch disabled during drag.

#### `handleClick(clientX, state, config): number`

**Description:** Calculates target scrollLeft from minimap click position, clamped to ratio [0,1].

#### `setCanvasSize(state): void`

**Description:** Resizes minimap canvas to parent width × minimapHeight, scaled by DPR. Uses `state.dpr`.

#### `draw(state, config): void`

**Description:** Renders minimap to cacheCanvas then blits to main canvas. Calls `updateViewport` at end.

## Behavior

1. Two modes: `'past'` (indices 0 to splitIndex) and `'future'` (splitIndex to end)
2. Auto-switch between modes based on scroll center position relative to splitIndex
3. Auto-switch disabled during manual drag (`isDragging === true`)
4. Renders to offscreen `cacheCanvas` to avoid redrawing on every scroll
5. Rendered layers (bottom to top): yellow background `#fffde7`, night `minimapNightFill` (default `#e7b9f7`) fill, date labels with day number, 0°C dashed line, cloud fill + stroke, precipitation bars (color-coded by snow/storm), precipitation probability fill + stroke, temperature line (red, 1.8px), UV indicator bars at top, "now" red vertical line + dot, past mode dark overlay
6. Date labels: shown at `localHour === 0` (or first entry), format `localDayShort DD/MM`, bold 9px, with collision avoidance
7. Minimap night fill uses `minimapNightFill` from the active atmospheric palette (default `#e7b9f7` across all palettes), independent of `nightFill` used by the main chart background

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `state.hourlyData` empty | `draw` returns without drawing |
| `config.PIXELS_PER_HOUR = 0` | Invalid position calculations, does not throw |
| `handleClick` with `clientX` negative | Ratio clamped to 0, scrollLeft = -containerW/2 |
| `canvas = null` in constructor | Does not throw |
| `setCanvasSize` with `state.dpr = 0` | Canvas sized to 0 |
| `invalidateCache` without having drawn | Does not throw |
| Auto-switch disabled during drag | Does not change mode even if scroll changes |

## Test Scenarios

1. **Does not throw with mock data:** Instantiates `MinimapRenderer` and calls `draw` with mock data, does not throw
2. **Does not throw with empty hourlyData:** `state.hourlyData = []`, `draw` returns without drawing
3. **Does not throw with ctx = null/undefined:** Null canvas in constructor, does not throw
4. **Past/future mode change:** `setMode` correctly changes display mode
5. **Viewport update:** `updateViewport` reflects current scroll
6. **Minimap click:** `handleClick` returns correct scrollLeft
7. **Night color from palette:** When `draw` renders night hours, the fill color is `getAtmosphericColor('minimapNightFill')` from the active palette

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
| 2026-06-07 | Night color now uses `minimapNightFill` from atmospheric palette (configurable per palette, default `#e7b9f7`) | SDD |
