# Spec: `src/services/DataProcessor.js`

## Propósito
Procesa los datos crudos de la API (forecast + AQI), los transforma al formato interno del state, calcula datos diarios, y persiste el historial en IndexedDB.

## Dependencias

### state
| Propiedad | Acceso (R/W) | Contexto |
|-----------|-------------|----------|
| `state.timezone` | write | processData |
| `state.sunData` | read/write | processData |
| `state.dailyData` | write | processData |
| `state.hourlyData` | write | processData |

### Módulos internos
| Módulo | Export usado | Para qué |
|--------|-------------|----------|
| `../store.js` | `state` | acceso al estado |
| `../utils/i18n.js` | `getLocale` | formato de fechas |
| `../ui/DailyCards.js` | `generateDailyCards` | renderizar daily cards |
| `./StorageService.js` | `storageService` | persistir historial |

## API Pública

### `export function processData(forecastData: Object, aqiData: Object, centerOnCurrentTime: Function): void`

**Descripción:** Procesa datos de forecast y AQI, actualiza state, genera daily cards y persiste historial.

## Comportamiento

1. Valida que `forecastData.hourly.time` y `aqiData.hourly.time` existan
2. Valida zona horaria con `Intl.DateTimeFormat`, fallback a UTC
3. Procesa datos diarios: sunrise/sunset, dailyData array
4. Procesa datos horarios: temp, precip, wind, clouds, UV, AQI, polen, isNight
5. Ordena hourlyData por tiempo ascendente
6. Agrega AQI y polen a dailyData por día
7. Recalcula precipTotal diario como suma de datos horarios
8. Llama a `generateDailyCards(centerOnCurrentTime)`
9. Persiste historial en IndexedDB (solo días pasados)

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `forecastData` sin hourly | Lanza Error |
| `aqiData` sin hourly | Lanza Error |
| Timezone inválida | Fallback a UTC |
| Datos de un solo día | No hay datos "pasados" → no persiste |
| Sin datos horarios | No procesa nada, no persiste |

## Escenarios de test

1. **Datos válidos:** hourlyData se puebla correctamente con campos esperados
2. **Timezone inválida:** fallback a UTC
3. **Datos incompletos sin hourly:** lanza Error
4. **IsNight detection:** usa is_day de API, fallback a sunrise/sunset
5. **Historial guardado:** datos pasados se persisten en storageService
6. **DailyData vacío:** no procesa, no persiste

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
