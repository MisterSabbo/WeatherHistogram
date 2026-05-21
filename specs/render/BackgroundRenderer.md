# Spec: `src/render/BackgroundRenderer.js`

## Propósito
Renderiza fondos, fenómenos meteorológicos (viento, estrellas, UV, sol, noche) en el canvas.

## Dependencias

### state
| Propiedad | Acceso | Contexto |
|-----------|--------|----------|
| `state.hourlyData` | read | todas las funciones |
| `state.sunData` | read | drawSunnyBackground, drawNightOverlay |
| `state.theme` | read | drawPrecipitation (via Atmosphere) |

### Módulos internos
| Módulo | Export usado | Para qué |
|--------|-------------|----------|
| `../store.js` | `state` | acceso |
| `../theme.js` | `getThemeColor` | colores |
| `../utils/color.js` | `hexToRgb` | convertir colores |
| `./MoonRenderer.js` | `drawMoon` | luna |
| `./SunMarkers.js` | `drawSunMarkersOnCanvas` | re-export |

## API Pública

### `export function drawWeatherPhenomena(ctx: CanvasRenderingContext2D, viewX: number, viewW: number, h: number, PIXELS_PER_HOUR: number): void`

**Descripción:** Dibuja iconos de ráfagas de viento.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `ctx` | `CanvasRenderingContext2D` | Contexto del canvas |
| `viewX` | `number` | Inicio X del viewport |
| `viewW` | `number` | Ancho del viewport |
| `h` | `number` | Alto del canvas |
| `PIXELS_PER_HOUR` | `number` | Píxeles por hora |

**Metadatos:** Mutates state: No, Async: No

### `export function drawStarrySky(ctx: CanvasRenderingContext2D, viewX: number, viewW: number, h: number, PIXELS_PER_HOUR: number): void`

**Descripción:** Dibuja estrellas en horas nocturnas.

**Metadatos:** Mutates state: No, Async: No

### `export function drawUVSegments(ctx: CanvasRenderingContext2D, viewX: number, viewW: number, h: number, PIXELS_PER_HOUR: number): void`

**Descripción:** Dibuja barras UV con código de colores.

**Metadatos:** Mutates state: No, Async: No

### `export function drawSunnyBackground(ctx: CanvasRenderingContext2D, viewX: number, viewW: number, h: number, styles: Object, drawSunIcon: Function, PIXELS_PER_HOUR: number): void`

**Descripción:** Dibuja fondo amarillo con icono de sol en horas diurnas.

**Metadatos:** Mutates state: No, Async: No

### `export function drawNightOverlay(ctx: CanvasRenderingContext2D, viewX: number, viewW: number, h: number, PIXELS_PER_HOUR: number): void`

**Descripción:** Dibuja transiciones día-noche y luna.

**Metadatos:** Mutates state: No, Async: No

### `export function drawNightShadow(ctx: CanvasRenderingContext2D, viewX: number, viewW: number, h: number, PIXELS_PER_HOUR: number): void`

**Descripción:** Dibuja sombra nocturna oscura.

**Metadatos:** Mutates state: No, Async: No

## Comportamiento

1. **Wind gusts:** >35km/h → iconos, >50 → más grandes, >70 → rojos
2. **Stars:** pseudo-aleatorias con seed, 12 por hora nocturna
3. **UV:** barra de 6px en top, colores según nivel
4. **Night:** gradientes de transición día-noche, sombra `rgba(0,0,20,0.15)`

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `ctx = null` / `undefined` | No lanza error |
| `state.hourlyData` vacío | No dibuja nada en ninguna función |
| Todas las horas `isNight = true` | `drawStarrySky` dibuja en todo el rango, `drawNightOverlay` cubre todo |
| Todas las horas `isNight = false` | No hay estrellas ni overlay nocturno |
| Viento < 35 km/h | No dibuja iconos de ráfaga |
| UV = 0 en todos los puntos | No dibuja segmentos UV |
| `viewX` / `viewW` fuera de rango | No dibuja nada visible |

## Escenarios de test

1. **No lanza excepción con datos simulados:** Llama cada función con datos mock, no lanza error
2. **No lanza con hourlyData vacío:** `state.hourlyData = []`, no lanza error
3. **No lanza con ctx = null/undefined:** Contexto nulo en cada función, no lanza error
4. **Ráfagas de viento:** WindSpeed > 35/50/70 km/h dibuja iconos progresivos
5. **Estrellas nocturnas:** `isNight = true` en todas las horas, dibuja estrellas en todo el rango
6. **Transición día-noche:** Mezcla de horas diurnas y nocturnas, gradientes correctos

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
