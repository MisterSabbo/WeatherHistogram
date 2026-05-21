# Spec: `src/render/PrecipProbabilityRenderer.js`

## Propósito
Renderiza la probabilidad de precipitación como área sombreada con iconos en el canvas.

## Dependencias

### state
| Propiedad | Acceso | Contexto |
|-----------|--------|----------|
| `state.hourlyData` | read | drawPrecipitationProbability |
| `state.theme` | read | modo dark/light |

### Módulos internos
| Módulo | Export usado | Para qué |
|--------|-------------|----------|
| `../store.js` | `state` | acceso |

## API Pública

### `export function drawPrecipitationProbability(ctx: CanvasRenderingContext2D, viewX: number, viewW: number, h: number, styles: Object, PIXELS_PER_HOUR: number): void`

**Descripción:** Dibuja probabilidad de precipitación como área sombreada con iconos.

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

1. Path suave bezierCurveTo de probabilidad
2. Gradiente horizontal por tipo de precipitación (lluvia azul, nieve gris, tormenta púrpura)
3. Iconos aleatorios de lluvia/nieve/tormenta dentro del área
4. Borde inferior con gradiente

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `ctx = null` / `undefined` | No lanza error |
| `state.hourlyData` con < 2 puntos | No dibuja (necesita al menos 2 puntos para bezier) |
| `state.hourlyData` vacío | No dibuja nada |
| Todos `precipProb = 0` | No dibuja path ni iconos |
| `precipProb = 100` en todos los puntos | Área completa coloreada |
| `viewX` negativo | Dibuja offset negativo, no lanza error |

## Escenarios de test

1. **No lanza excepción con datos simulados:** Llama `drawPrecipitationProbability` con datos mock, no lanza error
2. **No lanza con hourlyData vacío:** `state.hourlyData = []`, no lanza error
3. **No lanza con ctx = null/undefined:** Contexto nulo, no lanza error
4. **Probabilidad 0%:** `precipProb = 0` en todos los puntos, no dibuja path
5. **Probabilidad 100%:** `precipProb = 100` en todos, área completa coloreada
6. **Menos de 2 puntos:** `hourlyData` con 1 punto, no dibuja bezier

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
