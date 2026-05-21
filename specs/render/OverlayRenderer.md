# Spec: `src/render/OverlayRenderer.js`

## Propósito
Renderiza la capa de overlay fija: scrubber, tooltips de datos, actualización de weather zone (stickman, SPF, AQI, polen).

## Dependencias

### state
| Propiedad | Acceso | Contexto |
|-----------|--------|----------|
| `state.hourlyData` | read | updateUVBlock |
| `state.theme` | read | colores |
| `state.stickmanThresholds` | read | updateWeatherZone |
| `state.skinType` | read | updateWeatherZone |
| `state.labelRects` | read/write | drawScrubberPoint |

### Módulos internos
| Módulo | Export usado | Para qué |
|--------|-------------|----------|
| `../utils/color.js` | `hexToRgb` | convertir colores |
| `../theme.js` | `getThemeColor`, `getThemeIcon`, `getThemeFont` | colores/iconos |
| `../services/AqiManager.js` | `getAggregatedPollenLevel`, `getPollenColor` | polen |

## API Pública

### `export function interpolateScrubberData(d1: Object, d2: Object, progress: number): Object`

**Descripción:** Interpolación cúbica hermitte para temp, apparent, clouds, precipProb.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `d1` | `Object` | Dato anterior |
| `d2` | `Object` | Dato siguiente |
| `progress` | `number` | Progreso entre 0 y 1 |

**Metadatos:** Mutates state: No, Async: No

### `export function getWeatherIconName(weatherCode: number): string`

**Descripción:** Convierte código WMO a nombre de icono Material.

**Metadatos:** Mutates state: No, Async: No

### `export function updateWeatherZone(currentData: Object, state: Object, deps: Object): void`

**Descripción:** Actualiza DOM: icono, stickman, AQI, polen, SPF, risk icons.

**Metadatos:** Mutates state: Sí (actualiza DOM), Async: No

### `export function drawScrubberPoint(fixedOverlayCtx: CanvasRenderingContext2D, y: number, color: string, value: string, unit: string, options: Object): void`

**Descripción:** Dibuja punto + label en overlay con detección de colisión.

**Metadatos:** Mutates state: Sí (state.labelRects), Async: No

### `export function updateUVBlock(d1: Object, index: number, fixedOverlayCanvas: HTMLCanvasElement, PIXELS_PER_HOUR: number): void`

**Descripción:** Actualiza bloque UV en DOM.

**Metadatos:** Mutates state: Sí (actualiza DOM), Async: No

## Comportamiento

1. `interpolateScrubberData`: cubic bezier para nubes y precipProb, linear para temp
2. `getWeatherIconName`: clear_day (default), cloud (1-3), foggy (45/48), rainy (51-67/80-82), ac_unit (71-77/85/86), thunderstorm (95+)
3. `updateWeatherZone`: actualiza DOM icono, stickman, AQI/polen/SPF warning icons, risk icons row
4. `drawScrubberPoint`: detecta colisión con otros labels, reposiciona con hasta 20 intentos
5. `updateUVBlock`: DOM div posicionado absolutamente sobre el canvas

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `ctx = null` / `undefined` en `drawScrubberPoint` | No lanza error |
| `d1 = d2` (mismo punto) | `interpolateScrubberData` retorna `d1` (progreso 0) |
| `progress < 0` / `> 1` | Interpola fuera de rango, no clamped |
| `weatherCode = -1` | `getWeatherIconName` retorna `'clear_day'` (default) |
| `state.hourlyData` con 1 solo punto | `updateUVBlock` funciona con índice 0 |
| Colisión de labels con 20+ intentos | Label se dibuja en última posición intentada |
| `updateWeatherZone` sin elementos DOM | No lanza error |
| `fixedOverlayCtx` sin `measureText` | `drawScrubberPoint` falla en colisión |

## Escenarios de test

1. **No lanza excepción con datos simulados:** Llama funciones con datos mock, no lanza error
2. **No lanza con hourlyData vacío:** `state.hourlyData = []`, no lanza error
3. **No lanza con ctx = null/undefined:** Contexto nulo en `drawScrubberPoint`, no lanza error
4. **Interpolación scrubber:** `interpolateScrubberData(d1, d2, 0.5)` retorna valores interpolados
5. **Nombre de icono WMO:** `getWeatherIconName(0)` → `'clear_day'`, `getWeatherIconName(95)` → `'thunderstorm'`
6. **Colisión de labels:** Labels se reposicionan hasta 20 intentos

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
