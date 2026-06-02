# Spec: `src/services/DataProcessor.js`

## Purpose
Processes raw API data (forecast + AQI), transforms to internal state format, enriches daily data with AQI/pollen/precip aggregates, generates daily cards, and persists history to IndexedDB.

## Dependencies

### state
| Property | Access (R/W) | Context |
|-----------|-------------|----------|
| `state.timezone` | write | processData (validated and stored) |
| `state.sunData` | read/write | processData (write per-date; read for isNight) |
| `state.dailyData` | read/write | processData (write mapped; read for enrichment) |
| `state.hourlyData` | write (then read) | processData (write; read for daily enrichment) |
| `state.locationName` | read | saveHistoryData (clean name for storage key) |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../store.js` | `state` | state access |
| `../utils/i18n.js` | `getLocale` | date formatting locale |
| `../ui/DailyCards.js` | `generateDailyCards` | render daily cards |
| `./StorageService.js` | `storageService` | persist and retrieve history |

## Public API

### `export function processData(forecastData: Object, aqiData: Object, centerOnCurrentTime: Function): void`

**Description:** Processes forecast and AQI data, updates state, generates daily cards, and persists history to IndexedDB.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `forecastData` | `Object` | Raw forecast API response (Open-Meteo format) |
| `aqiData` | `Object` | Raw AQI API response (Open-Meteo format) |
| `centerOnCurrentTime` | `function` | Callback to center chart on current time |

**Mutates state:** Yes (`state.timezone`, `state.sunData`, `state.dailyData`, `state.hourlyData`)

**Async:** No (but internally calls async `saveHistoryData`)

## Behavior

1. **Validation:** Throws `Error` if `forecastData.hourly.time` or `aqiData.hourly.time` is missing/invalid
2. **Timezone validation:** Uses `Intl.DateTimeFormat` with `timeZone` from API response; fallback to `'UTC'` if invalid. Stores in `state.timezone`
3. **Daily data processing:** Iterates `daily.time`, builds `state.sunData[dateStr] = { sunrise, sunset }` (converted to ms). Builds `state.dailyData` array with fields: time, weatherCode, tempMax, tempMin, precipTotal, windMax, gustMax, apparentMax. Uses `en-CA` locale for date string keys
4. **Hourly data processing:** Iterates `hourly.time`, builds `newHourly` array with fields: time, localHour, localDayName, localDayShort, temp, apparent, precip, precipProb, clouds, wind, windDir, gusts, humidity, pressure, uv, visibility, weatherCode, aqi, aqiDetails (pm10, pm2_5, ozone, nitrogen_dioxide), pollen, pollenDetails (alder, birch, grass, mugwort, olive, ragweed), isNight
5. **isNight detection:** Uses `hourly.is_day[i]` (0=night) if available. Falls back to comparing hour midpoint against `sunData` sunrise/sunset times. In polar regions with no is_day and 0 sunrise/sunset, defaults to `false`
6. **Sorting:** `state.hourlyData` sorted ascending by `time`
7. **Daily enrichment:** For each dailyData entry, computes max AQI, max pollen, per-type max pollenDetails, and sum of hourly precip (replaces the API's `precipTotal`)
8. **Daily cards:** Calls `generateDailyCards(centerOnCurrentTime)`
9. **History persistence:** Calls `saveHistoryData(state)` which:
   - Cleans location name (removes trailing `*`)
   - Skips saving for empty/placeholder names (`Ninguna`, `Desconocido`, `Unknown`)
   - Filters hourly/daily entries to past-only (before today)
   - Merges into existing history using Set-based dedup by timestamp (hourly) and date string (daily) — only appends new entries, never overwrites existing entries (preserving extra fields like `notes`)
   - Filters entries older than 1 year before saving
   - Calls `storageService.setHistory`

## Edge Cases

| Input | Expected behavior |
|-------|------------------------|
| `forecastData` without hourly | Throws Error |
| `aqiData` without hourly | Throws Error |
| Invalid timezone | Fallback to UTC |
| Single day data (no past) | No history persisted |
| Missing daily fields | Defaults to 0 for optional fields |
| Missing is_day and sunData | isNight = false |
| Location name ends with `*` | Stripped before history save |
| Location is `Ninguna`/`Desconocido`/`Unknown` | History not saved |

## Test Scenarios

1. **Valid data:** hourlyData populated correctly with expected fields
2. **Invalid timezone:** fallback to UTC
3. **Incomplete data without hourly:** throws Error
4. **IsNight detection:** uses API is_day, fallback to sunrise/sunset
5. **History saved:** past data persisted in storageService
6. **Empty DailyData:** does not process, does not persist
7. **Daily enrichment:** AQI/pollen/precipTotal recalculated from hourly data
8. **History merge:** Set-based dedup only appends new days, preserves extra fields
9. **1-year cleanup:** entries older than 365 days filtered before save

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
| 2026-06-02 | Spec update to match code — added state.locationName dep, daily enrichment, isNight fallback, 1-year cleanup, saveHistoryData merge behavior | SDD |
