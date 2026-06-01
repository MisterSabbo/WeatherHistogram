# Spec: `src/utils/thresholds.js`

## Purpose
Calculates Y limits (min, max, step) for histogram metrics, with padding and rounding to multiples.

## Dependencies

No internal dependencies.

## Public API

### `export function getYLimits(data: Array, metric: string): { min: number, max: number, step: number }`

**Description:** Calculates Y-axis limits for a metric based on data, with 15% padding and rounding.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `data` | `Array` | Data with `metric` field |
| `metric` | `string` | `'temp'`, `'humidity'`, `'wind'`, `'uv'` or other |

**Return:** `{ min: number, max: number, step: number }`

### `function getDefaultLimits(metric: string): { min: number, max: number, step: number }` (private)

## Behavior

1. If `data` empty or without valid values, returns default limits
2. Calculates real min/max, adds 15% padding
3. Rounds `min` down and `max` up according to each metric's step
4. Defaults: `temp: { min: -20, max: 40, step: 10 }`, `humidity: { min: 0, max: 100, step: 20 }`, `wind: { min: 0, max: 100, step: 20 }`, `uv: { min: 0, max: 11, step: 3 }`
5. Others: `{ min: 0, max: 100, step: 10 }`

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `data` empty (`[]`) | Returns defaults |
| `data` all `null` | Filtered => empty array => returns defaults |
| Unknown `metric` | Falls into `default` of switch, which calls `getDefaultLimits` with the original metric |
| Zero range (all values equal) | `range = 1` to avoid division by zero |

## Test Scenarios

1. **Limits with data:** values [10, 20, 30], metric='temp' => rounded min/max
2. **Empty data:** `[]` => returns defaults
3. **All null:** `[null, null]` => returns defaults
4. **Wind with data:** values calculate max rounded to 20
5. **UV with data:** max not less than 11

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
