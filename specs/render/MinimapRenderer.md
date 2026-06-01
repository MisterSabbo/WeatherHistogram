# Spec: `src/render/MinimapRenderer.js`

## Purpose
Renders the minimap (reduced histogram view with past/future mode), viewport selector, and click handling for navigation.

## Dependencies

### state
| Property | Access | Context |
|-----------|--------|----------|
| `state.hourlyData` | read | draw, updateViewport |
| `state.dpr` | read | draw |
| `state.theme` | read | colors |
| `state.sunData` | read | not used directly |

### CONFIG via parameter
| Constant | Context |
|-----------|----------|
| `config.PIXELS_PER_HOUR` | position calculations |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../utils/time.js` | `getSplitIndex` | split past/future |
| `../theme.js` | `getThemeColor`, `getThemeFont` | colors/font |
| `../utils/math.js` | `normalizeY` | temperature Y |

## Public API

### `export class MinimapRenderer`

#### `constructor(options: Object)`

**Description:** Initializes the minimap renderer.

| Parameter | Type | Description |
|-----------|------|-------------|
| `options.canvas` | `HTMLCanvasElement` | Minimap canvas |
| `options.ctx` | `CanvasRenderingContext2D` | Canvas context |
| `options.viewportEl` | `HTMLElement` | Viewport selector element |
| `options.scrollContainer` | `HTMLElement` | Scroll container |
| `options.centerOnCurrentTime` | `Function` | Callback to center on current time |
| `options.updateNowButtonPosition` | `Function` | Callback to update now button |
| `options.minimapHeight` | `number` | Minimap height |

**Metadata:** Mutates state: Yes (class internal state), Async: No

#### `invalidateCache(): void`

**Description:** Clears the cacheCanvas.

**Metadata:** Mutates state: Yes (clears cache), Async: No

#### `setMode(mode: string, isUserInteraction: boolean, state: Object, config: Object): void`

**Description:** Changes past/future mode.

**Metadata:** Mutates state: Yes (internal mode), Async: No

#### `updateViewport(state: Object, config: Object): void`

**Description:** Updates viewport selector position.

**Metadata:** Mutates state: Yes (viewportEl.style), Async: No

#### `handleClick(clientX: number, state: Object, config: Object): number`

**Description:** Calculates target scrollLeft from minimap click.

**Metadata:** Mutates state: No, Async: No

#### `setCanvasSize(state: Object): void`

**Description:** Resizes minimap canvas.

**Metadata:** Mutates state: Yes (canvas dimensions), Async: No

#### `draw(state: Object, config: Object): void`

**Description:** Renders minimap with cache.

**Metadata:** Mutates state: No (uses cacheCanvas), Async: No

## Behavior

1. Two modes: 'past' (splitIndex → 0) and 'future' (splitIndex → end)
2. Auto-switch between modes based on scroll position
3. Cache in cacheCanvas to avoid redrawing on every scroll
4. Auto-switch disabled during manual drag (isDragging)
5. Renders: background, night, date labels, 0°C line, clouds, precipitation, probability, temperature, UV, now line

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `state.hourlyData` empty | `draw` returns without drawing |
| `config.PIXELS_PER_HOUR = 0` | Invalid position calculations, does not throw |
| `handleClick` with `clientX` negative | Calculates scrollLeft < 0, clamped to 0 |
| `canvas = null` in constructor | Does not throw (constructor does not validate) |
| `setCanvasSize` with `state.dpr = 0` | Canvas sized to 0 |
| `invalidateCache` without having drawn | Does not throw |
| Auto-switch disabled during drag | Does not change mode even if scroll changes |
| Invalid mode (neither 'past' nor 'future') | `setMode` does not update correctly |

## Test Scenarios

1. **Does not throw with mock data:** Instantiates `MinimapRenderer` and calls `draw` with mock data, does not throw
2. **Does not throw with empty hourlyData:** `state.hourlyData = []`, `draw` returns without drawing
3. **Does not throw with ctx = null/undefined:** Null canvas in constructor, does not throw
4. **Past/future mode change:** `setMode` correctly changes display mode
5. **Viewport update:** `updateViewport` reflects current scroll
6. **Minimap click:** `handleClick` returns correct scrollLeft

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
