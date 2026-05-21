# Spec: `src/render/metrics/TemperatureRenderer.js`

## Propósito
Renderiza la línea de temperatura, sensación térmica, sombras y efectos climáticos en el canvas del histograma.

## Dependencias

### state
| Propiedad | Acceso | Contexto |
|-----------|--------|----------|
| `state.hourlyData` | read | drawTemperature |

### Módulos internos
| Módulo | Export usado | Para qué |
|--------|-------------|----------|
| `../../store.js` | `state` | acceso |
| `../../theme.js` | `getThemeColor`, `getThemeFont` | colores |
| `../../utils/math.js` | `normalizeY` | calcular Y |

## API Pública

### `export function drawTemperature(ctx: CanvasRenderingContext2D, viewX: number, viewW: number, h: number, styles: Object, PIXELS_PER_HOUR: number): void`

**Descripción:** Dibuja línea base de temperatura (roja), línea punteada de sensación térmica, sombras y efectos.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `ctx` | `CanvasRenderingContext2D` | Contexto del canvas |
| `viewX` | `number` | Inicio X del viewport |
| `viewW` | `number` | Ancho del viewport |
| `h` | `number` | Alto del canvas |
| `styles` | `Object` | Estilos del tema |
| `PIXELS_PER_HOUR` | `number` | Píxeles por hora |

**Metadatos:**
- Mutates state: No
- Async: No

## Comportamiento

1. Línea base: roja (`tempLine`), width 3, con puntos en cada hora
2. Sensación térmica: línea punteada `[4,4]` azul si más fría, naranja si más cálida
3. Diferencia >= 1°C entre temp y apparent → dibuja área sombreada entre ambas
4. Efectos dinámicos: glow solar en cielo despejado, sombra en nubes, overlay azul en lluvia, blanco en nieve, amarillo en tormenta
5. Etiquetas de temperatura en cada punto con glow si hay nubes/lluvia

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `ctx = null` / `undefined` | No lanza error |
| `state.hourlyData` vacío | No dibuja nada |
| `state.hourlyData` con < 2 puntos | No puede trazar línea, no dibuja |
| `d.temp = null` / `undefined` para algunos puntos | Skip de ese punto, línea discontinua |
| `d.apparent === d.temp` (diferencia < 1°C) | No dibuja línea punteada de sensación térmica |
| `h = 0` | Todas las Y = 0, no lanza error |
| Temperaturas extremas (>50°C o <-30°C) | Y fuera de rango, etiqueta se dibuja |

## Escenarios de test

1. **No lanza excepción con datos simulados:** Llama `drawTemperature` con datos mock, no lanza error
2. **No lanza con hourlyData vacío:** `state.hourlyData = []`, no lanza error
3. **No lanza con ctx = null/undefined:** Contexto nulo, no lanza error
4. **Línea de temperatura base:** Temp normal dibuja línea roja con puntos
5. **Sensación térmica diferente:** `apparent != temp` (≥1°C), dibuja línea punteada y área sombreada
6. **Temperatura extrema:** `temp > 50°C` o `temp < -30°C`, etiqueta visible

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
