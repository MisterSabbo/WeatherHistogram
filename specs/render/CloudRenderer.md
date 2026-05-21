# Spec: `src/render/CloudRenderer.js`

## Propósito
Renderiza cobertura de nubes como área sombreada con path suave en el canvas.

## Dependencias

### state
| Propiedad | Acceso | Contexto |
|-----------|--------|----------|
| `state.hourlyData` | read | drawClouds |

### Módulos internos
| Módulo | Export usado | Para qué |
|--------|-------------|----------|
| `../store.js` | `state` | acceso |

## API Pública

### `export function drawClouds(ctx: CanvasRenderingContext2D, viewX: number, viewW: number, h: number, styles: Object, PIXELS_PER_HOUR: number): void`

**Descripción:** Dibuja área de nubes con gradiente horizontal, múltiples capas de contorno y línea de borde.

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

1. Renderiza puntos `(x, i*PPH)` e `y = h - (h * (clouds/100))`
2. Path suave con bezierCurveTo (puntos de control en midpoint x)
3. Gradiente horizontal: luma = `255 - (clouds/100) * 115` por punto
4. 5 capas de contorno con offset y width progresivos
5. Línea de borde con glow

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `ctx = null` / `undefined` | No lanza error |
| `state.hourlyData` con < 2 puntos | No dibuja (necesita al menos 2 puntos para bezier) |
| `state.hourlyData` vacío | No dibuja nada |
| `viewX` negativo | Dibuja offset negativo, no lanza error |
| `h = 0` | No dibuja nada (altura cero) |
| `clouds = 100` en todos los puntos | Luma mínimo (140), cobertura completa |
| `clouds = 0` en todos los puntos | Luma máximo (255), área transparente |

## Escenarios de test

1. **No lanza excepción con datos simulados:** Llama `drawClouds` con datos mock, no lanza error
2. **No lanza con hourlyData vacío:** `state.hourlyData = []`, no lanza error
3. **No lanza con ctx = null/undefined:** Contexto nulo, no lanza error
4. **Cobertura 0%:** `clouds = 0` en todos los puntos, área transparente
5. **Cobertura 100%:** `clouds = 100` en todos los puntos, luma mínimo
6. **Menos de 2 puntos:** `hourlyData` con 1 punto, no dibuja bezier

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
