# Spec: `src/services/MockData.js`

## Purpose
Generates simulated weather and AQI data with structure compatible with Open-Meteo API responses. Used as fallback when the real API is unreachable and no cache is available.

## Dependencies

No state, CONFIG, DOM or internal module dependencies.

## Public API

### `export function generateMockData(pastDays: number, forecastDays: number): { forecastData: Object, aqiData: Object }`

**Description:** Generates complete mock dataset (forecast + AQI) matching Open-Meteo structure.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `pastDays` | `number` | Number of past days to include |
| `forecastDays` | `number` | Number of forecast days to include |

**Return:** `{ forecastData: Object, aqiData: Object }`

**Mutates state:** No

**Async:** No

## Behavior

1. Generates `totalHours = (pastDays + forecastDays) * 24` hours of data starting from `now - pastDays * 86400` seconds
2. **Hourly forecast fields generated:** time, temperature_2m, apparent_temperature, precipitation, precipitation_probability, cloudcover, wind_speed_10m, wind_gusts_10m, wind_direction_10m, weather_code (always 0), relative_humidity_2m (always 50), surface_pressure (always 1013), uv_index (always 0), visibility (always 10000)
3. **Daily forecast fields declared but only time/sunrise/sunset are populated:** time, sunrise (6:00), sunset (18:00), weather_code (empty), temperature_2m_max (empty), temperature_2m_min (empty)
4. **AQI hourly fields generated:** time, european_aqi (random 0-50), pm10, pm2_5, nitrogen_dioxide, ozone, alder_pollen, birch_pollen, grass_pollen, mugwort_pollen, olive_pollen, ragweed_pollen (all zero)
5. **Temperature:** sinusoidal 20±10°C with 24h period
6. **Precipitation:** ~20% probability, random 0-5mm
7. **Clouds:** random 0-100%
8. **Wind:** random 0-10 km/h, gusts 0-15 km/h, direction 0-360°
9. **Note:** `us_aqi` is NOT generated (DataProcessor reads this field → mock data always yields null AQI)
10. **Time format:** Unix timestamps (seconds)

## Edge Cases

| Input | Expected behavior |
|-------|------------------------|
| `pastDays=0` | Only generates forecast days |
| `pastDays=7, forecastDays=7` | 336 hours of data |
| All AQI data 0 | Pollen always 0 |

## Test Scenarios

1. **Structure:** returns object with `forecastData` and `aqiData`
2. **Number of hours:** `(pastDays + forecastDays) * 24`
3. **Required fields:** forecast has hourly with temperature_2m, precipitation, etc.
4. **AQI has hourly with european_aqi:** field present (not us_aqi)
5. **Daily data:** contains time, sunrise, sunset (populated); other daily fields are empty arrays

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
| 2026-06-02 | Spec update to match code — corrected us_aqi → european_aqi, added exact field lists, noted empty daily fields | SDD |
