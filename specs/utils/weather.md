# Spec: `src/utils/weather.js`

## Purpose
Simple function that translates WMO codes to textual weather descriptions.

## Dependencies

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `./i18n.js` | `t` | Translate WMO code |

## Public API

### `export function getWeatherDescription(code: number): string`

**Description:** Returns the textual description for an Open-Meteo WMO code.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `code` | `number` | WMO code (0-99) |

**Return:** `string`

**Mutates state:** No

**Async:** No

## Behavior

1. Looks up `t('weatherCodes.' + code)` 
2. If not found, returns `t('weatherCodes.unknown')`

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `code = 0` | `t('weatherCodes.0')` => `'Clear'` |
| `code = 999` (non-existent) | `t('weatherCodes.999')` => returns `'weatherCodes.999'`, then fallback to `t('weatherCodes.unknown')` |

## Test Scenarios

1. **Known code:** `getWeatherDescription(0)` returns translation of "Clear"
2. **Unknown code:** `getWeatherDescription(999)` returns translation of "Unknown"
3. **Null/undefined code:** `t('weatherCodes.' + null)` = `t('weatherCodes.null')` => fallback to unknown

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
