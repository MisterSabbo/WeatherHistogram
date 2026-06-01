# Spec: `src/domain/WeatherFetcher.js`

## Purpose
Weather data fetching orchestrator with in-memory cache, fallback to mock data and error handling.

## Dependencies

### state
| Property | Access (R/W) | Context |
|-----------|-------------|----------|
| `state.lat` | read | fetchWeatherData |
| `state.lon` | read | fetchWeatherData |
| `state.isFetching` | read/write | guard against duplicate fetch |
| `state.rawForecast` | write | cache data |
| `state.rawAQI` | write | cache data |
| `state.locationName` | write | add '*' if API fails |

### CONFIG
| Constant | Context |
|-----------|----------|
| `CONFIG.CACHE_DURATION` | cache duration (5 min) |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../store.js` | `state`, `CONFIG` | access |
| `../services/WeatherService.js` | `weatherService` | fetch |
| `../services/MockData.js` | `generateMockData` | fallback |
| `../services/DataProcessor.js` | `processData` | process data |

## Public API

### `export function clearWeatherCache(): void`

**Description:** Clears the in-memory cache.

### `export async function fetchWeatherData(pastDays: number, forecastDays: number, callbacks: Object): Promise<void>`

**Description:** Fetch with cache, fallback to expired data, fallback to mock data.

**Callbacks:**
- `onResize` — for resizing
- `onUpdateLocationUI` — for updating location UI
- `onCenterOnCurrentTime` — for centering on current time

## Behavior

1. Cache by key `lat,lon,pastDays,forecastDays` with CACHE_DURATION duration
2. If valid cache exists, use it and return
3. If `state.isFetching` is true, do nothing (guard against double fetch)
4. 15s timeout with AbortController
5. If API fails but cache exists (expired), use expired data and mark location with '*'
6. If API fails and no cache, generate mock data
7. Always executes `processData` and `onResize` at the end

## Edge Cases

| Condition | Expected behavior |
|-----------|------------------------|
| Valid cache | Uses cache, does not fetch |
| `isFetching = true` | Does not start new fetch |
| API timeout (15s) | Aborts fetch, uses fallback |
| API fails + expired cache | Uses expired cache, marks location with '*' |
| API fails + no cache | Generates mock data, location = "None" |

## Test Scenarios

1. **Cache hit:** returns cached data without fetch
2. **Cache miss:** performs real fetch
3. **Duplicate fetch:** isFetching prevents second fetch
4. **API fails + cache:** uses expired data
5. **API fails + no cache:** generates mock data
6. **clearWeatherCache:** empties the Map

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
