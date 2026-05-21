# Spec: `src/render/SunMarkers.js`

## Propósito
Dibuja marcadores de salida y puesta de sol en el canvas con hora formateada.

## Dependencias

### state
| Propiedad | Acceso | Contexto |
|-----------|--------|----------|
| `state.hourlyData` | read | obtener startTime |
| `state.sunData` | read | sunrise/sunset por fecha |
| `state.timezone` | read | formateo |

### Módulos internos
| Módulo | Export usado | Para qué |
|--------|-------------|----------|
| `../store.js` | `state` | acceso |
| `../theme.js` | `getThemeFont` | fuente |
| `../utils/i18n.js` | `getLocale` | locale |

## API Pública

### `export function drawSunMarkersOnCanvas(ctx: CanvasRenderingContext2D, viewX: number, viewW: number, h: number, PIXELS_PER_HOUR: number): void`

**Descripción:** Dibuja marcadores de salida y puesta de sol.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `ctx` | `CanvasRenderingContext2D` | Contexto del canvas |
| `viewX` | `number` | Inicio X del viewport |
| `viewW` | `number` | Ancho del viewport |
| `h` | `number` | Alto del canvas |
| `PIXELS_PER_HOUR` | `number` | Píxeles por hora |

**Metadatos:**
- Mutates state: No
- Async: No

## Comportamiento

1. Para cada fecha en sunData, dibuja sunrise y sunset markers
2. Marker: semicírculo con rayos + flecha arriba (sunrise) o abajo (sunset)
3. Hora formateada con toLocaleTimeString
4. Skip si fuera del viewport (±50px)

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `ctx = null` / `undefined` | No lanza error |
| `state.hourlyData` vacío | No dibuja, retorna sin error |
| `state.sunData` vacío (`{}`) | No hay sunrise/sunset, no dibuja nada |
| Marcador fuera del viewport (±50px) | Skip, no dibuja |
| `PIXELS_PER_HOUR = 0` | Posición X infinita, no lanza error |
| `h = 0` | Marcadores en Y=0, no lanza error |

## Escenarios de test

1. **No lanza excepción con datos simulados:** Llama `drawSunMarkersOnCanvas` con datos mock, no lanza error
2. **No lanza con hourlyData vacío:** `state.hourlyData = []`, no lanza error
3. **No lanza con ctx = null/undefined:** Contexto nulo, no lanza error
4. **Marcadores fuera de viewport:** Sunrise/sunset fuera de ±50px, no se dibujan
5. **SunData vacío:** `state.sunData = {}`, no dibuja nada
6. **Formato de hora correcto:** Hora formateada con `toLocaleTimeString`

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
