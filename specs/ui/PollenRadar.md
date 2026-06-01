# Spec: `src/ui/PollenRadar.js`

## Purpose
Draws a pollen radar (hexagonal radial chart with 6 species) on a canvas.

## Dependencies

### state
| Property | Access | Context |
|-----------|--------|----------|
| `state.theme` | read | shadow |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../store.js` | `state` | access |
| `../utils/i18n.js` | `t` | species names |

## Public API

### `export function drawPollenRadar(data: Object, targetId?: string, detailsId?: string): void`

**Description:** Draws hexagonal pollen radar with 6 species.

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `Object` | Data with `pollenDetails: { alder, birch, grass, mugwort, olive, ragweed }` |
| `targetId?` | `string` | Canvas ID (default `'pollen-radar'`) |
| `detailsId?` | `string` | Details element ID (default `'pollen-details'`) |

**Metadata:**
- Mutates state: No
- Async: No

## Behavior

1. 6 hexagonal axes (alder, birch, grass, mugwort, olive, ragweed)
2. 3 concentric reference hexagons
3. Semi-transparent yellow data area
4. Labels with shadow, Y adjustment to avoid overlap
5. Details in separate HTML element

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `data = null` / `undefined` | Does not throw, returns without drawing |
| `targetId` does not exist in DOM | Does not throw, returns without drawing |
| `pollenDetails` with values 0 | Draws polygon at center (all normalized to 0) |
| `pollenDetails` with negative values | Treats as 0, does not throw |
| Canvas 2D context not available | Does not throw, returns without drawing |
| Overlapping labels | Y adjustment to avoid collisions |

## Test Scenarios

1. **Initializes without errors with valid data:** `drawPollenRadar` with mock data, does not throw
2. **Does not throw with data = null/undefined:** Null data, does not throw
3. **Exports expected functions:** `drawPollenRadar` is a function
4. **Canvas does not exist:** `targetId` does not exist in DOM, returns without error
5. **Pollen values at 0:** Polygon drawn at center
6. **Negative values:** Treated as 0, does not throw

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
