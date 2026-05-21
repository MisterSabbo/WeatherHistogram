# Spec: `src/render/MoonRenderer.js`

## Propósito
Dibuja un icono de luna creciente en el canvas con glow.

## Dependencias

Sin dependencias externas.

## API Pública

### `export function drawMoon(ctx: CanvasRenderingContext2D, x: number, y: number, moonColor: string, glowColor: string): void`

**Descripción:** Dibuja luna creciente con glow radial.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `ctx` | `CanvasRenderingContext2D` | Contexto del canvas |
| `x` | `number` | Posición X del centro |
| `y` | `number` | Posición Y del centro |
| `moonColor` | `string` | Color de la luna (ej. `'#90caf9'`) |
| `glowColor` | `string` | Color del glow (ej. `'rgba(144,202,249,0.2)'`) |

**Metadatos:**
- Mutates state: No
- Async: No

## Comportamiento

1. Glow radial (40px adicionales) con color `rgba(144, 202, 249, 0.2)`
2. Luna: arco de 0.2π a 1.8π con curva cuadrática
3. Shadow blur 10px con glowColor

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `ctx = null` / `undefined` | No lanza error (llamadas a ctx fallan) |
| `x` / `y` negativos | Dibuja fuera del canvas, no lanza error |
| `moonColor` / `glowColor` vacíos | Usa string vacío como color (no lanza error, pero dibujo invisible) |
| `ctx` sin `createRadialGradient` | Glow no se dibuja, `fill()` falla silenciosamente |
| `shadowBlur` no soportado | Luna se dibuja sin glow, no lanza error |

## Escenarios de test

1. **No lanza excepción con parámetros válidos:** Llama `drawMoon` con colores y posición válidos, no lanza error
2. **No lanza con ctx = null/undefined:** Contexto nulo, no lanza error
3. **No lanza con coordenadas negativas:** `x = -10`, `y = -10`, no lanza error
4. **Dibujo de glow:** `createRadialGradient` produce efecto glow visible
5. **Colores inválidos:** `moonColor = ''`, no lanza error

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
