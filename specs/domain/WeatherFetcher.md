# Spec: `src/domain/WeatherFetcher.js`

## Purpose
Weather data fetching orchestrator with in-memory cache, fallback to expired data, fallback to mock data, and error handling.

## Dependencies

### state
| Property | Access (R/W) | Context |
|-----------|-------------|----------|
| `state.lat` | read | fetchWeatherData (cache key) |
| `state.lon` | read | fetchWeatherData (cache key) |
| `state.isFetching` | read/write | guard against duplicate fetch |
| `state.rawForecast` | write | store fetched/fallback data |
| `state.rawAQI` | write | store fetched/fallback data |
| `state.locationName` | write | append '*' on expired fallback; set to 'Ninguna' on mock fallback |

### CONFIG
| Constant | Context |
|-----------|----------|
| `CONFIG.CACHE_DURATION` | cache duration (5 min) |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../store.js` | `state`, `CONFIG` | state/config access |
| `../services/WeatherService.js` | `weatherService` | fetch real data |
| `../services/MockData.js` | `generateMockData` | fallback when no cache |
| `../services/DataProcessor.js` | `processData` | process data into state |

## Public API

### `export function clearWeatherCache(): void`

**Description:** Clears the in-memory cache Map.

### `export async function fetchWeatherData(pastDays: number, forecastDays: number, callbacks: Object): Promise<void>`

**Description:** Fetches weather+AQI data with cache, fallback to expired data, fallback to mock data.

**Callbacks:**
| Name | Type | Purpose |
|------|------|---------|
| `onResize` | `function` | trigger canvas resize after data is ready |
| `onUpdateLocationUI` | `function` | update location display when name changes |
| `onCenterOnCurrentTime` | `function` | scroll chart to current time column |

**Mutates state:** Yes (`state.rawForecast`, `state.rawAQI`, `state.locationName`, `state.isFetching`)

**Async:** Yes (awaits: `weatherService.getWeatherData`)

## Behavior

1. Cache key = `lat,lon,pastDays,forecastDays` with `CACHE_DURATION` validity
2. If valid cache exists, use it immediately without fetching
3. If `state.isFetching` is true, do nothing (guard against concurrent fetches)
4. Set `state.isFetching = true`, create `AbortController` with 15s timeout
5. On success: update cache, assign `rawForecast`/`rawAQI`, run `processData` + `onResize`
6. If API fails but expired cache exists: use expired data, append `*` to `state.locationName`, call `onUpdateLocationUI`, run `processData` + `onResize`
7. If API fails and no cache: generate `MockData`, set `state.locationName = "Ninguna"`, call `onUpdateLocationUI`, run `processData` + `onResize`
8. Always resets `state.isFetching = false` in `finally` block

## Edge Cases

| Condition | Expected behavior |
|-----------|------------------------|
| Valid cache | Uses cache, does not fetch |
| `isFetching = true` | Does not start new fetch |
| API timeout (15s) | Aborts via AbortController, uses fallback |
| API fails + expired cache | Uses expired data, marks location with `*` |
| API fails + no cache | Generates mock data, location = `"Ninguna"` |

## Test Scenarios

1. **Cache hit:** returns cached data without fetch
2. **Cache miss:** performs real fetch
3. **Duplicate fetch:** `isFetching` prevents second fetch
4. **API fails + cache:** uses expired data, location gets `*`
5. **API fails + no cache:** generates mock data, location = `"Ninguna"`
6. **clearWeatherCache:** empties the Map

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
| 2026-06-02 | Spec update to match code — precise locationName values, isFetching reset in finally | SDD |
