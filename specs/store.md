# Spec: `src/store.js`

## Propósito
Estado global mutable y configuración congelada (CONFIG) de la aplicación.

## Dependencias

Sin dependencias internas.

## API Pública

### `export const CONFIG: Object` (congelado)

**Descripción:** Configuración global congelada con `Object.freeze()`.

| Constante | Valor | Descripción |
|-----------|-------|-------------|
| `CHART_HEIGHT` | 250 | Alto del canvas del histograma |
| `MINIMAP_HEIGHT` | 80 | Alto del minimap |
| `DEFAULT_COORDS` | `{ lat: 40.4167, lon: -3.70325, name: "Madrid" }` | Coordenadas por defecto |
| `CACHE_DURATION` | 300000 (5 min) | Duración de caché de datos |
| `TILE_WIDTH` | 1440 | Ancho de tile en píxeles (desktop) |
| `PIXELS_PER_MM` | 10 | Píxeles por mm de precipitación |

### `export function getDPR(): number`

**Descripción:** Retorna `devicePixelRatio`, limitado a máximo 2.

### `export const state: Object` (mutable)

**Descripción:** Objeto de estado global mutable con propiedades para datos, UI, configuración.

| Propiedad | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `lat` | number|null | null | Latitud actual |
| `lon` | number|null | null | Longitud actual |
| `locationName` | string | "Cargando..." | Nombre de ubicación |
| `hourlyData` | Array | [] | Datos horarios procesados |
| `dailyData` | Array | [] | Datos diarios procesados |
| `sunData` | Object | {} | Sunrise/sunset por fecha |
| `hoverX` | number|null | null | Posición X del hover/scrubber |
| `isFetching` | boolean | false | Flag de fetch en curso |
| `dpr` | number | getDPR() | Device pixel ratio |
| `theme` | string | 'dark' | Tema actual |
| `timezone` | string | 'UTC' | Zona horaria |
| `rawForecast` | Object|null | null | Forecast crudo |
| `rawAQI` | Object|null | null | AQI crudo |
| `isDragging` | boolean | false | Drag en curso |
| `startX` | number | 0 | X inicial de drag |
| `scrollLeft` | number | 0 | Scroll left inicial |
| `activeChartTheme` | string | 'default' | Tema de gráficas |
| `isDailyCardsView` | boolean | false | Vista daily cards |
| `themeConfig` | Object|null | null | Config de tema cargada |
| `PIXELS_PER_HOUR` | number | 60/50 | Píxeles por hora (responsive) |
| `stickmanThresholds` | Object | {cold:10, hot:30, wind:45, clouds:60} | Umbrales stickman |
| `skinType` | number | 2 | Fototipo Fitzpatrick |

## Comportamiento

1. **CONFIG congelado:** `Object.freeze(CONFIG)` protege la configuración de mutaciones.
2. **Estado mutable:** `state` se modifica directamente desde cualquier módulo.
3. **getDPR() seguro:** usa `window.devicePixelRatio || 1` para evitar NaN.
4. **PIXELS_PER_HOUR responsive:** cambia según `window.innerWidth`.

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `devicePixelRatio` no definido | `getDPR()` retorna 1 (`window.devicePixelRatio \|\| 1` fallback) |
| `window.innerWidth` < 768 | `PIXELS_PER_HOUR` cambia a 50, `TILE_WIDTH` cambia a 720 |
| `window.innerWidth` = 0 (headless/test) | `PIXELS_PER_HOUR` usa rama desktop (60/1440) |
| `Object.freeze(CONFIG)` falla (modo estricto desactivado) | CONFIG sigue siendo modificable |
| `state.lat`/`state.lon` set a `null` | Aplicación en estado sin ubicación, usa DEFAULT_COORDS como fallback |
| `state.hourlyData` mutado externamente | No hay protección, datos inconsistentes |
| `state.theme` set a valor no soportado | Tema inválido, colores pueden fallar |

## Escenarios de test

1. **CONFIG congelado:** `Object.isFrozen(CONFIG) === true`
2. **CONFIG valores correctos:** constantes tienen valores esperados
3. **state valores default:** propiedades inicializadas correctamente
4. **getDPR():** retorna valor entre 1 y 2
5. **PIXELS_PER_HOUR responsive:** cambia según window.innerWidth

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
