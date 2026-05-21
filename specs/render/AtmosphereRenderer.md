# Spec: `src/render/AtmosphereRenderer.js`

## Propósito
Renderiza precipitación (lluvia, nieve, tormenta) en el canvas del histograma. Re-exporta CloudRenderer y PrecipProbabilityRenderer.

## Dependencias

### state
| Propiedad | Acceso | Contexto |
|-----------|--------|----------|
| `state.hourlyData` | read | drawPrecipitation |
| `state.theme` | read | colores |

### Módulos internos
| Módulo | Export usado | Para qué |
|--------|-------------|----------|
| `../store.js` | `state` | acceso |
| `../theme.js` | `getThemeColor` | colores |
| `./CloudRenderer.js` | `drawClouds` | re-export |
| `./PrecipProbabilityRenderer.js` | `drawPrecipitationProbability` | re-export |

## API Pública

### `export function drawPrecipitation(ctx: CanvasRenderingContext2D, viewX: number, viewW: number, h: number, styles: Object, PIXELS_PER_HOUR: number, PIXELS_PER_MM: number): void`

**Descripción:** Dibuja barras de precipitación con iconos según tipo (lluvia, nieve, tormenta).

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `ctx` | `CanvasRenderingContext2D` | Contexto del canvas |
| `viewX` | `number` | Inicio X del viewport |
| `viewW` | `number` | Ancho del viewport |
| `h` | `number` | Alto del canvas |
| `styles` | `Object` | Estilos del tema |
| `PIXELS_PER_HOUR` | `number` | Píxeles por hora |
| `PIXELS_PER_MM` | `number` | Píxeles por mm de precipitación |

**Metadatos:**
- Mutates state: No
- Async: No

**Sub-funciones privadas:**
- `drawRain(ctx, x, bw, barY, strokeColor, idx)` — gotas de agua
- `drawSnow(ctx, x, bw, barY)` — copos de nieve
- `drawThunder(ctx, x, bw, barY)` — rayos

## Comportamiento

1. Barra con gradiente vertical semitransparente
2. Alto de barra = `d.precip * PIXELS_PER_MM` (máx 90% del alto)
3. Códigos nieve: [71,73,75,77,85,86]; tormenta: [95,96,99]
4. Si barra excede altura máxima, dibuja zigzag indicador de overflow
5. Gradiente usa color base con mezcla al 40% de opacidad

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `ctx = null` / `undefined` | No lanza error (no hay try-catch, pero draw no se ejecuta) |
| `state.hourlyData` vacío | No dibuja nada, retorna sin error |
| `PIXELS_PER_MM = 0` | Barra con altura 0, no dibuja nada |
| `viewX` / `viewW` negativos | Dibuja fuera del viewport, no lanza error |
| `d.precip = 0` | No dibuja barra para esa hora |
| Código weatherCode no reconocido | Trata como lluvia por defecto |

## Escenarios de test

1. **No lanza excepción con datos simulados:** Llama `drawPrecipitation` con datos mock, no lanza error
2. **No lanza con hourlyData vacío:** `state.hourlyData = []`, no lanza error
3. **No lanza con ctx = null/undefined:** Contexto nulo, no lanza error
4. **Códigos de nieve:** WeatherCode [71,73,75,77,85,86] dibuja copos de nieve
5. **Códigos de tormenta:** WeatherCode [95,96,99] dibuja rayos
6. **Overflow de barra:** Precipitación que excede altura máxima dibuja zigzag

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
