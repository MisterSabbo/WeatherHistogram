# Spec: `src/ui/PollenRadar.js`

## Purpose
Draws a pollen radar (hexagonal radial chart with 6 plant species) on a canvas and renders species details in a separate HTML element.

## Dependencies

### state
| Property | Access (R/W) | Context |
|-----------|-------------|----------|
| `state.theme` | read | label shadow color |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../store.js` | `state` | theme access |
| `../utils/i18n.js` | `t` | localized species names and noData fallback |

## Public API

### `export function drawPollenRadar(data, targetId?, detailsId?): void`

**Description:** Draws 6-axis hexagonal radar with alder, birch, grass, mugwort, olive, ragweed normalized values.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `data` | `Object` | Object with `pollenDetails: { alder, birch, grass, mugwort, olive, ragweed }` |
| `targetId` | `string` | Canvas element ID (default `'pollen-radar'`) |
| `detailsId` | `string` | Details element ID (default `'pollen-details'`) |

**Return:** `void`

**Mutates state:** No

**Async:** No

## Behavior

1. 6-axis hexagonal reference grid with 3 concentric hexagons (radius 55, divided into 3 rings)
2. Axis lines drawn from center to each vertex
3. Labels (via `t()` keys: `pollen.alder`, `pollen.birch`, `pollen.grass`, `pollen.mugwort`, `pollen.olive`, `pollen.ragweed`) positioned outside the hexagon with text shadow. Y-axis adjustment for labels at indices 1,5 (shifted up) and 2,4 (shifted down) to avoid overlap.
4. Semi-transparent yellow (`rgba(234,179,8,0.6)`) data polygon filled and stroked with `#eab308`
5. Details rendered as innerHTML — each species shown as `name: val.toFixed(1)` if `val` is truthy, or `name: t('pollen.noData')` if null/0
6. Canvas cleared each call with `clearRect`
7. Font: `bold 9px Inter`, fill: `var(--text-primary)`, aligned center/middle
8. Negative values clamped to 0 via `Math.max(0, p.val)`

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `data = null` / `undefined` | Returns without drawing, no throw |
| `targetId` does not exist in DOM | Returns without drawing, no throw |
| Canvas 2D context not available | Returns without drawing, no throw |
| `pollenDetails` missing | Returns without drawing |
| All pollen values 0 | Polygon drawn at center (all normalized to 0) |
| Negative pollen values | Clamped to 0 via `Math.max(0, val)` |
| Label overlap at adjacent indices | Y-adjusted to avoid collisions (1,5 up; 2,4 down) |

## Test Scenarios

1. **Initializes without errors with valid data:** `drawPollenRadar` with mock data
2. **Does not throw with data = null/undefined:** Returns without drawing
3. **Exports expected functions:** `drawPollenRadar` is a function
4. **Canvas does not exist:** Returns without error
5. **Pollen values at 0:** Polygon drawn at center
6. **Negative values:** Clamped to 0, does not throw
7. **Details with noData:** Shows `t('pollen.noData')` for missing/zero values

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-06-02 | Added radius=55, label Y-axis adjustment (indices 1,5 and 2,4), toFixed(1) / noData fallback for details, Math.max(0, val) for negative clamping | SDD |
| 2026-05-21 | Initial spec | SDD |
