# Spec: `src/services/AqiManager.js`

## Purpose
Air quality (AQI) classification and pollen level management. Provides AQI level classification, pollen level thresholds by species, aggregated pollen levels, and associated colors and descriptive texts.

## Dependencies

No state, CONFIG or DOM dependencies.

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../utils/i18n.js` | `t` | localized AQI and pollen level texts |

## Public API

### `export function getAQIInfo(aqi: number|null): { text: string, rec: string, val: number }`

**Description:** Classifies an AQI value into level 1-6 with localized text and recommendation.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `aqi` | `number\|null` | US AQI value or null |

**Return:** `{ text: string, rec: string, val: number }`

**Mutates state:** No

**Notes:** When `aqi` is `null`, returns `{ text: '--', rec: '' }` without `val`.

### `export function getPollenLevelByType(type: string, raw: number): number`

**Description:** Returns level 0-4 for a specific pollen type according to the thresholds in `POLLEN_THRESHOLDS`.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `type` | `string` | Pollen type key (alder, birch, grass, mugwort, olive, ragweed) |
| `raw` | `number` | Raw pollen count |

**Return:** `number` (0-4)

**Mutates state:** No

### `export function getAggregatedPollenLevel(pollenDetails: Object): number`

**Description:** Returns the maximum pollen level across all known pollen types.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `pollenDetails` | `Object` | Object with per-type pollen counts |

**Return:** `number` (0-4)

**Mutates state:** No

### `export function getPollenColor(level: number): string`

**Description:** Returns a CSS color string for a given pollen level.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `level` | `number` | Pollen level 0-4 |

**Return:** `string` (CSS color)

**Mutates state:** No

### `export function getPollenText(val: number, pollenDetails: Object): string`

**Description:** Descriptive localized text for pollen level. If `pollenDetails` is provided, uses aggregated level. Otherwise uses `val` with generic thresholds.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `val` | `number` | Raw pollen value (used when no details) |
| `pollenDetails` | `Object` | Per-type pollen details (optional) |

**Return:** `string`

**Mutates state:** No

## Behavior

1. **AQI classification** (getAQIInfo):
   - `aqi === null` → `{ text: '--', rec: '' }`
   - `≤50` → level 1, `≤100` → level 2, `≤150` → level 3, `≤200` → level 4, `≤300` → level 5, `>300` → level 6
   - Text and recommendation from i18n keys `aqiLevel.{level}.t` and `aqiLevel.{level}.r`
   - Return value always includes `val` (the raw input) except for null input

2. **Pollen thresholds by species** (POLLEN_THRESHOLDS):
   - alder: [15, 75, 250], birch: [15, 80, 300], grass: [10, 50, 250], mugwort: [10, 50, 150], olive: [50, 200, 500], ragweed: [10, 50, 150]

3. **getPollenLevelByType**: raw ≤ 0 or falsy → 0. If type not in thresholds, returns 1 if raw > 0 else 0. Otherwise compares against threshold array: `< t[0]` → 1, `< t[1]` → 2, `< t[2]` → 3, `≥ t[2]` → 4

4. **getAggregatedPollenLevel**: maximum level across all POLLEN_THRESHOLDS keys; 0 if pollenDetails is null/undefined

5. **getPollenColor**: level 0 → `var(--text-secondary)`, ≤1 → `#a3e635`, ≤2 → `#fbbf24`, >2 → `#ef4444`

6. **getPollenText**: two modes:
   - With `pollenDetails`: uses `getAggregatedPollenLevel` → returns from i18n `pollenLevels.{none,low,moderate,high,veryHigh}`
   - Without `pollenDetails`: uses `val` directly: null/undefined → `'--'`, 0 → none, ≤10 → low, ≤50 → moderate, ≤100 → high, >100 → veryHigh

## Edge Cases

| Input | Expected behavior |
|-------|------------------------|
| `aqi = null` | `{ text: '--', rec: '' }` |
| `raw = null/undefined` | `getPollenLevelByType` returns 0 |
| `pollenDetails = null` | `getAggregatedPollenLevel` returns 0 |
| `type` not in `POLLEN_THRESHOLDS` | Returns 1 if raw > 0, otherwise 0 |
| `val = null` in getPollenText (no details) | Returns `'--'` |

## Test Scenarios

1. **Good AQI:** 30 → level 1, text "Buena"/"Good"
2. **Hazardous AQI:** 350 → level 6, text "Peligrosa"/"Hazardous"
3. **AQI null:** returns text `'--'`, no val
4. **Pollen level by species:** alder=100 → between 75 and 250 → level 3
5. **Aggregated pollen level:** maximum among species
6. **Pollen color:** level 0 → secondary, level 4 → red
7. **Pollen text without details:** val=20 → "Moderado"/"Moderate"

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
| 2026-06-02 | Spec update to match code — added return val behavior for null AQI, detailed pollen thresholds and color behavior | SDD |
