# Spec: `src/services/MockData.js`

## Propósito
Genera datos meteorológicos simulados para pruebas offline o cuando la API falla.

## Dependencias

Sin dependencias internas.

## API Pública

### `export function generateMockData(pastDays: number, forecastDays: number): { forecastData: Object, aqiData: Object }`

**Descripción:** Genera datos mock completos (forecast + AQI) con estructura compatible con Open-Meteo.

## Comportamiento

1. Genera `totalHours = (pastDays + forecastDays) * 24` horas de datos
2. Temperatura: sinusoidal (20 ± 10°C) con periodo de 24h
3. Precipitación: ~20% de probabilidad con valor aleatorio 0-5mm
4. Nubes: aleatorio 0-100%
5. Viento: aleatorio 0-10 km/h, ráfagas 0-15 km/h
6. AQI: aleatorio 0-50
7. Datos diarios: sunrise 6:00, sunset 18:00

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `pastDays=0` | Solo genera forecastDays |
| `pastDays=7, forecastDays=7` | 336 horas de datos |
| Datos AQI todos 0 | Polen siempre 0 |

## Escenarios de test

1. **Estructura:** retorna objeto con `forecastData` y `aqiData`
2. **Cantidad de horas:** `(pastDays + forecastDays) * 24`
3. **Campos requeridos:** forecast tiene hourly con temperature_2m, etc.
4. **AQI tiene hourly con us_aqi:** campo presente
5. **Daily data:** contiene sunrise/sunset

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
