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

1. Calls `t('weatherCodes.' + code)` 
2. Uses `||` fallback: if the result is falsy, returns `t('weatherCodes.unknown')`
3. Since `t()` returns the input key (a truthy string) for unmapped keys, the `||` fallback to `unknown` is only reached when `t()` returns an empty string or falsy value — which never happens with current `t()` implementation

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `code = 0` | `t('weatherCodes.0')` => `'Clear'` (ES) / `'Despejado'` (EN) |
| `code = 999` (non-existent) | `t('weatherCodes.999')` returns `'weatherCodes.999'` (truthy) => `getWeatherDescription` returns `'weatherCodes.999'` |
| `null` / `undefined` | `t('weatherCodes.null')` returns `'weatherCodes.null'` (truthy) => returns `'weatherCodes.null'` |

## Test Scenarios

1. **Known code:** `getWeatherDescription(0)` returns translation of "Clear"
2. **Unknown code:** `getWeatherDescription(999)` returns `'weatherCodes.999'` (the key itself, since `t` returns the key for missing lookups)
3. **Null code:** `getWeatherDescription(null)` returns `'weatherCodes.null'`

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
| 2026-06-02 | Updated edge cases: `||` fallback never reaches `unknown` because `t()` returns truthy key string | SDD |
