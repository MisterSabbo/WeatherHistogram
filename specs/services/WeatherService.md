# Spec: `src/services/WeatherService.js`

## Purpose
HTTP client for Open-Meteo APIs (forecast and air quality). Builds URLs and performs parallel fetch.

## Dependencies

No internal dependencies.

## Public API

### `export class WeatherService`

### `constructor(baseURLForecast?: string, baseURLAQI?: string)`

**Description:** Configurable base URLs (default: Open-Meteo).

### `async getWeatherData(lat: number, lon: number, pastDays: number, forecastDays: number, signal: AbortSignal): Promise<{ forecastData: Object, aqiData: Object }>`

**Description:** Parallel fetch to forecast and AQI APIs with timeout via AbortSignal.

## Behavior

1. Builds URLs with all necessary hourly and daily parameters
2. Uses `Promise.all` for parallel fetch
3. Forecast parameters: temperature_2m, apparent_temperature, precipitation, precipitation_probability, cloudcover, wind_speed_10m, wind_gusts_10m, wind_direction_10m, weather_code, relative_humidity_2m, surface_pressure, uv_index, visibility, is_day
4. AQI parameters: us_aqi, european_aqi, pm10, pm2_5, nitrogen_dioxide, ozone, alder_pollen, birch_pollen, grass_pollen, mugwort_pollen, olive_pollen, ragweed_pollen
5. Verifies `response.ok` and `forecastData.error` / `aqiData.error`
6. Cache header: `cache: 'reload'`

## Edge Cases

| Condition | Expected behavior |
|-----------|------------------------|
| API returns 4xx/5xx | Throws Error with status codes |
| API returns internal error | Throws Error with `forecastData.reason` |
| AbortSignal aborted | fetch throws AbortError |
| Network down | fetch throws TypeError |

## Test Scenarios

1. **URL built correctly:** contains lat, lon, past_days, forecast_days
2. **Forecast URL:** contains all hourly parameters
3. **AQI URL:** contains pollen parameters
4. **API Error:** response not ok → throws Error
5. **Internal error:** forecastData.error true → throws Error
6. **Singleton:** weatherService is a unique instance

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
