# Spec: `src/render/StickmanRenderer.js`

## Propósito
Renderiza un stickman animado con reacciones climáticas (calor, frío, lluvia, nieve, viento, noche, sol).

## Dependencias

Sin dependencias externas.

## API Pública

### `export function drawStickman(ctx: CanvasRenderingContext2D, x: number, y: number, walkPhase: number, apparentTemp: number, precCode: number, isWindy: boolean, isDarkTheme: boolean, isNight: boolean, thresholds: Object, precipAmt: number, clouds: number): void`

**Descripción:** Dibuja stickman animado con reacciones climáticas.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `ctx` | `CanvasRenderingContext2D` | Contexto del canvas |
| `x` | `number` | Posición X |
| `y` | `number` | Posición Y |
| `walkPhase` | `number` | Fase de animación (0-1) |
| `apparentTemp` | `number` | Temperatura aparente en °C |
| `precCode` | `number` | Código WMO de precipitación |
| `isWindy` | `boolean` | Si hay viento fuerte |
| `isDarkTheme` | `boolean` | Tema oscuro activo |
| `isNight` | `boolean` | Es de noche |
| `thresholds` | `Object` | Umbrales `{ cold, hot, wind, clouds }` |
| `precipAmt` | `number` | Cantidad de precipitación |
| `clouds` | `number` | Cobertura de nubes (0-100) |

**Metadatos:**
- Mutates state: No
- Async: No

## Comportamiento

1. Caminata animada con fase sinusoidal (piernas, brazos, bounce)
2. Reacciones: calor → cara roja, frío → bufanda + brazos cruzados, lluvia → paraguas, nieve → botas/guantes púrpura, viento → líneas + inclinación, noche → zzz, sol → gafas de sol
3. `walkPhase` controla ciclo de animación (0-1)
4. Halo invertido según tema (negro en dark, blanco en light)

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `ctx = null` / `undefined` | No lanza error |
| `walkPhase` fuera de [0, 1] | Animación distorsionada, no lanza error |
| `apparentTemp = Infinity` / `-Infinity` | No lanza error, condición extrema |
| `thresholds` incompleto (sin `cold`/`hot`) | Comparación con `undefined`, no lanza error |
| `isNight && isWindy && precip > 0` | Múltiples reacciones combinadas |
| `clouds = undefined` | Tratado como 0 en comparación con threshold |

## Escenarios de test

1. **No lanza excepción con parámetros válidos:** Llama `drawStickman` con datos mock, no lanza error
2. **No lanza con ctx = null/undefined:** Contexto nulo, no lanza error
3. **Reacción de calor:** `apparentTemp > thresholds.hot`, cara roja
4. **Reacción de frío:** `apparentTemp < thresholds.cold`, bufanda + brazos cruzados
5. **Reacción de lluvia:** Código de precipitación activo, paraguas
6. **Múltiples reacciones combinadas:** Noche + viento + lluvia simultáneamente

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
