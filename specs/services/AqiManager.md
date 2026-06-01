# Spec: `src/services/AqiManager.js`

## Purpose
Air quality (AQI) and pollen level management. Provides AQI classification, pollen levels by species and associated colors.

## Dependencies

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../utils/i18n.js` | `t` | AQI and pollen level texts |

## Public API

### `export function getAQIInfo(aqi: number|null): { text: string, rec: string, val: number }`

**Description:** Classifies an AQI value into level 1-6 with text and recommendation.

### `export function getPollenLevelByType(type: string, raw: number): number`

**Description:** Level 0-4 for a pollen type according to specific thresholds.

### `export function getAggregatedPollenLevel(pollenDetails: Object): number`

**Description:** Maximum level among all pollen types.

### `export function getPollenColor(level: number): string`

**Description:** CSS color for a pollen level.

### `export function getPollenText(val: number, pollenDetails: Object): string`

**Description:** Descriptive text for pollen level.

## Behavior

1. AQI: ≤50=1, ≤100=2, ≤150=3, ≤200=4, ≤300=5, >300=6
2. Pollen thresholds by species defined in `POLLEN_THRESHOLDS`
3. `getAggregatedPollenLevel`: maximum of all types
4. `getPollenText`: if `pollenDetails` exists, uses aggregated level; otherwise uses `val` with generic thresholds (10/50/100)

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `aqi = null` | `{ text: '--', rec: '' }` |
| `raw = null/undefined` | `getPollenLevelByType` returns 0 |
| `pollenDetails = null` | `getAggregatedPollenLevel` returns 0 |
| `type` not in `POLLEN_THRESHOLDS` | Returns 1 if raw > 0, otherwise 0 |

## Test Scenarios

1. **Good AQI:** 30 → level 1, text "Buena"/"Good"
2. **Hazardous AQI:** 350 → level 6, text "Peligrosa"/"Hazardous"
3. **AQI null:** returns text '--'
4. **Pollen level by species:** alder=100 → between 75 and 250 → level 3
5. **Aggregated pollen level:** maximum among species
6. **Pollen color:** level 0 → secondary, level 4 → red
7. **Pollen text without details:** val=20 → "Moderado"

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
