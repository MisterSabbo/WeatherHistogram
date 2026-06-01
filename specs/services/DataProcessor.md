# Spec: `src/services/DataProcessor.js`

## Purpose
Processes raw API data (forecast + AQI), transforms to internal state format, calculates daily data, and persists history in IndexedDB.

## Dependencies

### state
| Property | Access (R/W) | Context |
|-----------|-------------|----------|
| `state.timezone` | write | processData |
| `state.sunData` | read/write | processData |
| `state.dailyData` | write | processData |
| `state.hourlyData` | write | processData |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../store.js` | `state` | state access |
| `../utils/i18n.js` | `getLocale` | date formatting |
| `../ui/DailyCards.js` | `generateDailyCards` | render daily cards |
| `./StorageService.js` | `storageService` | persist history |

## Public API

### `export function processData(forecastData: Object, aqiData: Object, centerOnCurrentTime: Function): void`

**Description:** Processes forecast and AQI data, updates state, generates daily cards and persists history.

## Behavior

1. Validates that `forecastData.hourly.time` and `aqiData.hourly.time` exist
2. Validates timezone with `Intl.DateTimeFormat`, fallback to UTC
3. Processes daily data: sunrise/sunset, dailyData array
4. Processes hourly data: temp, precip, wind, clouds, UV, AQI, pollen, isNight
5. Sorts hourlyData by ascending time
6. Adds AQI and pollen to dailyData by day
7. Recalculates daily precipTotal as sum of hourly data
8. Calls `generateDailyCards(centerOnCurrentTime)`
9. Persists history in IndexedDB (past days only)
10. `saveHistoryData` merge preserves extra fields (like `notes`) because it only adds new days with Set-based dedup — never overwrites existing `daily[]` entries

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `forecastData` without hourly | Throws Error |
| `aqiData` without hourly | Throws Error |
| Invalid timezone | Fallback to UTC |
| Single day data | No "past" data → does not persist |
| No hourly data | Processes nothing, does not persist |

## Test Scenarios

1. **Valid data:** hourlyData populated correctly with expected fields
2. **Invalid timezone:** fallback to UTC
3. **Incomplete data without hourly:** throws Error
4. **IsNight detection:** uses API is_day, fallback to sunrise/sunset
5. **History saved:** past data persisted in storageService
6. **Empty DailyData:** does not process, does not persist

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
