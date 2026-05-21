# Spec: `src/services/WeatherService.js`

## Propósito
Cliente HTTP para las APIs de Open-Meteo (forecast y air quality). Construye URLs y realiza fetch paralelo.

## Dependencias

Sin dependencias internas.

## API Pública

### `export class WeatherService`

### `constructor(baseURLForecast?: string, baseURLAQI?: string)`

**Descripción:** URLs base configurables (default: Open-Meteo).

### `async getWeatherData(lat: number, lon: number, pastDays: number, forecastDays: number, signal: AbortSignal): Promise<{ forecastData: Object, aqiData: Object }>`

**Descripción:** Fetch paralelo a forecast y AQI APIs con timeout via AbortSignal.

## Comportamiento

1. Construye URLs con todos los parámetros horarios y diarios necesarios
2. Usa `Promise.all` para fetch paralelo
3. Parámetros forecast: temperature_2m, apparent_temperature, precipitation, precipitation_probability, cloudcover, wind_speed_10m, wind_gusts_10m, wind_direction_10m, weather_code, relative_humidity_2m, surface_pressure, uv_index, visibility, is_day
4. Parámetros AQI: us_aqi, european_aqi, pm10, pm2_5, nitrogen_dioxide, ozone, alder_pollen, birch_pollen, grass_pollen, mugwort_pollen, olive_pollen, ragweed_pollen
5. Verifica `response.ok` y `forecastData.error` / `aqiData.error`
6. Cache header: `cache: 'reload'`

## Casos borde

| Condición | Comportamiento esperado |
|-----------|------------------------|
| API retorna 4xx/5xx | Lanza Error con status codes |
| API retorna error interno | Lanza Error con `forecastData.reason` |
| AbortSignal abortada | fetch lanza AbortError |
| Red caída | fetch lanza TypeError |

## Escenarios de test

1. **URL construida correctamente:** contiene lat, lon, past_days, forecast_days
2. **Forecast URL:** contiene todos los parámetros horarios
3. **AQI URL:** contiene parámetros de polen
4. **Error API:** response no ok → lanza Error
5. **Error interno:** forecastData.error true → lanza Error
6. **Singleton:** weatherService es instancia única

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
