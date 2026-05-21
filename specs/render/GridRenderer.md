# Spec: `src/render/GridRenderer.js`

## Propósito
Renderiza la cuadrícula del histograma (líneas horizontales de temperatura, línea de cero grados, nombres de día, ejes X con horas).

## Dependencias

### state
| Propiedad | Acceso | Contexto |
|-----------|--------|----------|
| `state.hourlyData` | read | drawDayNames, drawAxes |

### Módulos internos
| Módulo | Export usado | Para qué |
|--------|-------------|----------|
| `../store.js` | `state` | acceso |
| `../theme.js` | `getThemeColor`, `getThemeFont` | colores/fuente |
| `../utils/math.js` | `normalizeY` | Y |
| `../utils/time.js` | `formatHour` | etiquetas hora |

## API Pública

### `export function drawGrid(ctx: CanvasRenderingContext2D, viewX: number, viewW: number, h: number, styles: Object, PIXELS_PER_HOUR: number): void`

**Descripción:** Dibuja líneas horizontales cada 10°C (-20 a 40) + línea de 0°C discontinua.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `ctx` | `CanvasRenderingContext2D` | Contexto del canvas |
| `viewX` | `number` | Inicio X del viewport |
| `viewW` | `number` | Ancho del viewport |
| `h` | `number` | Alto del canvas |
| `styles` | `Object` | Estilos del tema |
| `PIXELS_PER_HOUR` | `number` | Píxeles por hora |

**Metadatos:** Mutates state: No, Async: No

### `export function drawDayNames(ctx: CanvasRenderingContext2D, viewX: number, viewW: number, h: number, styles: Object, PIXELS_PER_HOUR: number): void`

**Descripción:** Dibuja nombres de día grandes y semitransparentes.

**Metadatos:** Mutates state: No, Async: No

### `export function drawAxes(ctx: CanvasRenderingContext2D, viewX: number, viewW: number, h: number, styles: Object, PIXELS_PER_HOUR: number, CHART_HEIGHT: number): void`

**Descripción:** Dibuja etiquetas de hora con tick marks, saltando sunrise/sunset.

| Parámetro adicional | Tipo | Descripción |
|---------------------|------|-------------|
| `CHART_HEIGHT` | `number` | Alto del canvas del histograma |

**Metadatos:** Mutates state: No, Async: No

## Comportamiento

1. `drawGrid`: línea sólida #e0e0e0 para temperaturas, discontinua [4,4] para 0°C
2. `drawDayNames`: texto grande (80px), centrado en cada día, opacidad 0.15
3. `drawAxes`: etiquetas de hora con tick de 8px, evita superposición con marcadores de sol/sombra (<25px)

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `ctx = null` / `undefined` | No lanza error |
| `state.hourlyData` vacío | `drawDayNames` y `drawAxes` no dibujan nada |
| `viewX` / `viewW` negativos | No dibuja nada visible, no lanza error |
| `h = 0` | No dibuja líneas (altura cero) |
| Etiquetas de hora solapadas con sunrise/sunset (< 25px) | Skip de etiqueta, evita colisión |
| `styles` sin propiedades de color | Usa valores por defecto, no lanza error |

## Escenarios de test

1. **No lanza excepción con datos simulados:** Llama `drawGrid` con datos mock, no lanza error
2. **No lanza con hourlyData vacío:** `state.hourlyData = []`, los sub-módulos no dibujan nada
3. **No lanza con ctx = null/undefined:** Contexto nulo, no lanza error
4. **Línea de 0°C:** Se dibuja discontinua [4,4] en Y correspondiente
5. **Colisión de labels de hora:** Etiquetas cerca de sunrise/sunset se saltan
6. **Nombres de día:** Texto centrado correctamente por día

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
