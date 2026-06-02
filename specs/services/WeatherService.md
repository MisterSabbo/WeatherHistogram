# Spec: `src/services/WeatherService.js`

## Purpose
HTTP client for Open-Meteo APIs (forecast and air quality). Builds URLs with all required parameters and performs parallel fetch requests. Configurable base URLs for testing.

## Dependencies

No state, CONFIG, DOM or internal module dependencies.

## Public API

### `export class WeatherService`

### `constructor(baseURLForecast?: string, baseURLAQI?: string)`

**Description:** Configurable base URLs. Defaults to Open-Meteo production endpoints.

| Parameter | Default |
|-----------|---------|
| `baseURLForecast` | `https://api.open-meteo.com/v1/forecast` |
| `baseURLAQI` | `https://air-quality-api.open-meteo.com/v1/air-quality` |

### `async getWeatherData(lat: number, lon: number, pastDays: number, forecastDays: number, signal: AbortSignal): Promise<{ forecastData: Object, aqiData: Object }>`

**Description:** Parallel fetch to forecast and AQI APIs. Both requests share the same AbortSignal for timeout/cancellation.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `lat` | `number` | Latitude |
| `lon` | `number` | Longitude |
| `pastDays` | `number` | Past days to include |
| `forecastDays` | `number` | Forecast days to include |
| `signal` | `AbortSignal` | Shared abort signal for both requests |

**Return:** `{ forecastData: Object, aqiData: Object }`

**Mutates state:** No

**Async:** Yes (awaits: `Promise.all` of two fetches, then JSON parsing)

## Behavior

1. **URL construction:**
   - Forecast URL includes: `latitude`, `longitude`, `hourly` (temperature_2m, apparent_temperature, precipitation, precipitation_probability, cloudcover, wind_speed_10m, wind_gusts_10m, wind_direction_10m, weather_code, relative_humidity_2m, surface_pressure, uv_index, visibility, is_day), `daily` (sunrise, sunset, weather_code, temperature_2m_max, temperature_2m_min, precipitation_sum, wind_speed_10m_max, wind_gusts_10m_max, apparent_temperature_max), `timezone=auto`, `past_days`, `forecast_days`, `timeformat=unixtime`
   - AQI URL includes: `latitude`, `longitude`, `hourly` (us_aqi, european_aqi, pm10, pm2_5, nitrogen_dioxide, ozone, alder_pollen, birch_pollen, grass_pollen, mugwort_pollen, olive_pollen, ragweed_pollen), `timezone=auto`, `past_days`, `forecast_days`, `timeformat=unixtime`

2. Both URLs are fetched in parallel via `Promise.all` with `cache: 'reload'` and the shared `AbortSignal`

3. **Error handling:**
   - If either response is not OK, throws `Error` with status codes
   - If either response body contains `.error === true`, throws `Error` with `.reason` (or fallback message)

4. Returns `{ forecastData, aqiData }` as parsed JSON objects

## Edge Cases

| Condition | Expected behavior |
|-----------|------------------------|
| API returns 4xx/5xx | Throws Error with status codes: `"API Response Error: forecast={status}, aqi={status}"` |
| API returns internal error | Throws Error with `forecastData.reason` or `aqiData.reason` |
| AbortSignal aborted | AbortController aborts → fetch throws `AbortError` |
| Network down | fetch throws `TypeError` |

## Test Scenarios

1. **URL built correctly:** contains lat, lon, past_days, forecast_days
2. **Forecast URL:** contains all hourly and daily parameters
3. **AQI URL:** contains all AQI and pollen parameters
4. **API Error:** response not ok → throws Error with status codes
5. **Internal error:** `forecastData.error` is true → throws Error with reason
6. **Singleton:** weatherService is a unique instance
7. **Parallel fetch:** both requests use `Promise.all`
8. **timeformat=unixtime:** both URLs include this parameter

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
| 2026-06-02 | Spec update to match code — added daily parameters, cache:reload, timeformat=unixtime, error message format | SDD |
