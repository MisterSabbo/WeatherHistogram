# Spec: `src/render/metrics/WindRenderer.js`

## Propósito
Renderiza indicadores de dirección de viento en el canvas del histograma.

## Dependencias

### state
| Propiedad | Acceso | Contexto |
|-----------|--------|----------|
| `state.hourlyData` | read | drawWind |
| `state.theme` | read | colores |

### Módulos internos
| Módulo | Export usado | Para qué |
|--------|-------------|----------|
| `../../store.js` | `state` | acceso |
| `../../theme.js` | `getThemeColor`, `getThemeIcon` | colores e íconos |

## API Pública

### `export function drawWind(ctx: CanvasRenderingContext2D, viewX: number, viewW: number, h: number, styles: Object, PIXELS_PER_HOUR: number): void`

**Descripción:** Dibuja flechas de dirección de viento cada 3 horas con color según temperatura.

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

1. Renderiza cada 3 horas (localHour % 3 === 0)
2. Flecha rotada según `d.windDir + 180` grados
3. Color del viento según temperatura: <10°C → azul, >28°C → rojo
4. Si viento >40 km/h con temp entre 10-28°C → color fuerte
5. Usa icono del tema si existe, si no dibuja flecha con path

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `ctx = null` / `undefined` | No lanza error |
| `state.hourlyData` vacío | No dibuja nada |
| `windDir = undefined` en punto | Rotación con NaN, no lanza error |
| `d.temp = undefined` | Color por defecto (no azul/rojo) |
| `viewX` / `viewW` negativos | No dibuja nada visible |
| `styles` sin icono de viento | Dibuja path por defecto (flecha simple) |

## Escenarios de test

1. **No lanza excepción con datos simulados:** Llama `drawWind` con datos mock, no lanza error
2. **No lanza con hourlyData vacío:** `state.hourlyData = []`, no lanza error
3. **No lanza con ctx = null/undefined:** Contexto nulo, no lanza error
4. **Rotación de flecha:** `windDir = 90` rota la flecha correctamente
5. **Color por temperatura:** `temp < 10°C` → azul, `temp > 28°C` → rojo
6. **Intervalo de 3 horas:** Solo dibuja en `localHour % 3 === 0`

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
