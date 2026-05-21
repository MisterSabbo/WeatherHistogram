# Spec: `src/domain/WeatherFetcher.js`

## Propósito
Orquestador de fetching de datos meteorológicos con caché en memoria, fallback a datos mock y manejo de errores.

## Dependencias

### state
| Propiedad | Acceso (R/W) | Contexto |
|-----------|-------------|----------|
| `state.lat` | read | fetchWeatherData |
| `state.lon` | read | fetchWeatherData |
| `state.isFetching` | read/write | guard contra fetch duplicado |
| `state.rawForecast` | write | cachear datos |
| `state.rawAQI` | write | cachear datos |
| `state.locationName` | write | añadir '*' si falla API |

### CONFIG
| Constante | Contexto |
|-----------|----------|
| `CONFIG.CACHE_DURATION` | duración de caché (5 min) |

### Módulos internos
| Módulo | Export usado | Para qué |
|--------|-------------|----------|
| `../store.js` | `state`, `CONFIG` | acceso |
| `../services/WeatherService.js` | `weatherService` | fetch |
| `../services/MockData.js` | `generateMockData` | fallback |
| `../services/DataProcessor.js` | `processData` | procesar datos |

## API Pública

### `export function clearWeatherCache(): void`

**Descripción:** Limpia la caché en memoria.

### `export async function fetchWeatherData(pastDays: number, forecastDays: number, callbacks: Object): Promise<void>`

**Descripción:** Fetch con caché, fallback a datos expirados, fallback a mock data.

**Callbacks:**
- `onProcessData` — para procesar datos
- `onResize` — para redimensionar
- `onUpdateLocationUI` — para actualizar UI de ubicación
- `onCenterOnCurrentTime` — para centrar en tiempo actual

## Comportamiento

1. Caché por clave `lat,lon,pastDays,forecastDays` con duración CACHE_DURATION
2. Si hay caché válida, la usa y retorna
3. Si `state.isFetching` true, no hace nada (guarda contra doble fetch)
4. Timeout de 15s con AbortController
5. Si API falla pero hay caché (expirada), usa datos expirados y marca ubicación con '*'
6. Si API falla y no hay caché, genera mock data
7. Siempre ejecuta `processData` y `onResize` al final

## Casos borde

| Condición | Comportamiento esperado |
|-----------|------------------------|
| Caché válida | Usa caché, no hace fetch |
| `isFetching = true` | No inicia nuevo fetch |
| API timeout (15s) | Aborta fetch, usa fallback |
| API falla + caché expirada | Usa caché expirada, marca ubicación con '*' |
| API falla + sin caché | Genera mock data, ubicación = "Ninguna" |

## Escenarios de test

1. **Caché hit:** retorna datos cacheados sin fetch
2. **Caché miss:** hace fetch real
3. **Fetch duplicado:** isFetching previene segundo fetch
4. **API falla + caché:** usa datos expirados
5. **API falla + sin caché:** genera mock data
6. **clearWeatherCache:** vacía el Map

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
