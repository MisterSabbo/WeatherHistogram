# Spec: `src/utils/math.js`

## Purpose
Mathematical function for normalizing values to the histogram canvas coordinate system.

## Dependencies

No internal dependencies.

## Public API

### `export function normalizeY(val: number, min: number, max: number, height: number): number`

**Description:** Maps a value `val` within the range `[min, max]` to a Y coordinate in pixels within `height`, with 10% padding on each end and occupying the central 80%.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `val` | `number` | Value to normalize |
| `min` | `number` | Range minimum |
| `max` | `number` | Range maximum |
| `height` | `number` | Total height in pixels |

**Return:** `number` — Y coordinate (0 = top)

**Mutates state:** No

**Async:** No

## Behavior

1. Calculates `norm = (val - min) / (max - min)`
2. `result = height - (norm * height * 0.8) - (height * 0.1)`
3. `min` and `max` are not validated; if `min === max`, division by zero produces Infinity/NaN

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `val = min` | Returns `height * 0.9` (bottom with padding) |
| `val = max` | Returns `height * 0.1` (top with padding) |
| `val` out of range | Coordinate outside range [0.1*height, 0.9*height] |
| `min === max` | Division by zero => NaN |

## Test Scenarios

1. **Minimum value:** `normalizeY(0, 0, 100, 200)` = 180
2. **Maximum value:** `normalizeY(100, 0, 100, 200)` = 20
3. **Intermediate value:** `normalizeY(50, 0, 100, 200)` = 100
4. **Value out of range (below):** `normalizeY(-50, 0, 100, 200)` = 260
5. **Value out of range (above):** `normalizeY(150, 0, 100, 200)` = -60

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
