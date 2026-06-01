# Spec: `src/services/MockData.js`

## Purpose
Generates simulated weather data for offline testing or when the API fails.

## Dependencies

No internal dependencies.

## Public API

### `export function generateMockData(pastDays: number, forecastDays: number): { forecastData: Object, aqiData: Object }`

**Description:** Generates complete mock data (forecast + AQI) with structure compatible with Open-Meteo.

## Behavior

1. Generates `totalHours = (pastDays + forecastDays) * 24` hours of data
2. Temperature: sinusoidal (20 ± 10°C) with 24h period
3. Precipitation: ~20% probability with random value 0-5mm
4. Clouds: random 0-100%
5. Wind: random 0-10 km/h, gusts 0-15 km/h
6. AQI: random 0-50
7. Daily data: sunrise 6:00, sunset 18:00

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `pastDays=0` | Only generates forecastDays |
| `pastDays=7, forecastDays=7` | 336 hours of data |
| All AQI data 0 | Pollen always 0 |

## Test Scenarios

1. **Structure:** returns object with `forecastData` and `aqiData`
2. **Number of hours:** `(pastDays + forecastDays) * 24`
3. **Required fields:** forecast has hourly with temperature_2m, etc.
4. **AQI has hourly with us_aqi:** field present
5. **Daily data:** contains sunrise/sunset

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
