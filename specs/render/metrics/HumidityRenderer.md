# Spec: `src/render/metrics/HumidityRenderer.js`

## Propósito
Renderiza una línea de humedad discontinua sobre el canvas del histograma.

## Dependencias

### state
| Propiedad | Acceso | Contexto |
|-----------|--------|----------|
| `state.hourlyData` | read | drawHumidity |

### Módulos internos
| Módulo | Export usado | Para qué |
|--------|-------------|----------|
| `../../store.js` | `state` | acceso |
| `../../theme.js` | `getThemeColor` | color de línea |

## API Pública

### `export function drawHumidity(ctx: CanvasRenderingContext2D, viewX: number, viewW: number, h: number, styles: Object, PIXELS_PER_HOUR: number): void`

**Descripción:** Dibuja línea de humedad discontinua sobre el histograma.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `ctx` | `CanvasRenderingContext2D` | Contexto del canvas |
| `viewX` | `number` | Inicio X del viewport |
| `viewW` | `number` | Ancho del viewport |
| `h` | `number` | Alto del canvas |
| `styles` | `Object` | Estilos del tema (usa `humidityLine`) |
| `PIXELS_PER_HOUR` | `number` | Píxeles por hora |

**Metadatos:**
- Mutates state: No
- Async: No

## Comportamiento

1. Renderiza solo datos visibles (viewX a viewX+viewW) con buffer de ±5 horas
2. Línea discontinua `[5, 5]` con color del tema `humidityLine`
3. Y = `h - (h * (d.humidity / 100))`, X = `i * PIXELS_PER_HOUR`
4. Line width = 1

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `ctx = null` / `undefined` | No lanza error |
| `state.hourlyData` vacío | No dibuja nada, retorna sin error |
| `state.hourlyData` con 1 solo punto | No dibuja línea (necesita al menos 2 puntos) |
| `h = 0` | Línea en Y=0, no lanza error |
| `viewX` / `viewW` negativos | No dibuja nada visible |
| `styles` sin `humidityLine` | Usa `''` como color, línea invisible |

## Escenarios de test

1. **No lanza excepción con datos simulados:** Llama `drawHumidity` con datos mock, no lanza error
2. **No lanza con hourlyData vacío:** `state.hourlyData = []`, no lanza error
3. **No lanza con ctx = null/undefined:** Contexto nulo, no lanza error
4. **Humedad 0%:** Línea en `y = h` (parte inferior)
5. **Humedad 100%:** Línea en `y = 0` (parte superior)
6. **Un solo punto:** `hourlyData` con 1 punto, no dibuja línea

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
