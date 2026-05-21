# Spec: `src/ui/TopPanel.js`

## Propósito
Actualiza el panel superior con datos meteorológicos interpolados según la posición del scroll: temperatura, viento, AQI, polen, precipitación, nubes, hora, alertas.

## Dependencias

### state
| Propiedad | Acceso | Contexto |
|-----------|--------|----------|
| `state.hourlyData` | read | interpolación |
| `state.timezone` | read | formato hora |
| `state.theme` | read | colores |
| `state.stickmanThresholds` | read | wind threshold |
| `state.skinType` | read | no directo |

### Módulos internos
| Módulo | Export usado | Para qué |
|--------|-------------|----------|
| `../store.js` | `state` | acceso |
| `../theme.js` | `getThemeIcon` | iconos |
| `../utils/i18n.js` | `t`, `getLocale` | traducción |
| `../utils/time.js` | `formatTooltipTime` | hora |
| `../utils/weather.js` | `getWeatherDescription` | descripción |
| `../services/AqiManager.js` | `getAQIInfo`, `getPollenText`, `getAggregatedPollenLevel`, `getPollenColor` | AQI/polen |
| `../utils/AlertEngine.js` | `generateAlerts`, `renderAlerts` | alertas |
| `./AqiRadar.js` | `drawAQIRadar` | radar AQI |
| `./PollenRadar.js` | `drawPollenRadar` | radar polen |

## API Pública

### `export function updateTopPanel(options: { scrollContainer: HTMLElement, PIXELS_PER_HOUR: number }): void`

**Descripción:** Actualiza el DOM del top panel con datos interpolados según scrollLeft + 60.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `options` | `Object` | Opciones de configuración |
| `options.scrollContainer` | `HTMLElement` | Contenedor con scroll horizontal |
| `options.PIXELS_PER_HOUR` | `number` | Píxeles por hora para cálculo de índice |

**Metadatos:**
- Mutates state: Sí (actualiza DOM del top panel)
- Async: No

## Comportamiento

1. Interpola datos entre hourlyData[index] y [index+1] según progreso
2. Actualiza: temp, apparent, wind (con color por temp), AQI (texto + icono + radar), polen (texto + icono + radar), precip, precipProb, clouds, hora (con isToday), alertas, weather summary, location tooltip
3. Skip si el estado actual es igual al anterior (JSON.stringify comparison)
4. requestAnimationFrame para AQI/Pollen radar draw

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `state.hourlyData` vacío | No interpola, retorna sin modificar DOM |
| `scrollContainer = null` / `undefined` | No lanza error |
| `PIXELS_PER_HOUR = 0` | Cálculo de índice inválido, no lanza error |
| Elementos DOM del panel ausentes | `document.getElementById` retorna `null`, `innerHTML` falla silenciosamente |
| `state` igual que llamada anterior | Skip por `JSON.stringify` comparison |
| Interpolación entre mismo índice | Valores iguales sin interpolación |
| AQI/Pollen radar sin canvas | `drawAQIRadar` / `drawPollenRadar` no lanzan error |

## Escenarios de test

1. **Se inicializa sin errores con opciones válidas:** `updateTopPanel` con opciones mock, no lanza error
2. **No lanza con hourlyData vacío:** `state.hourlyData = []`, no lanza error
3. **Exporta las funciones esperadas:** `updateTopPanel` es función
4. **ScrollContainer null:** `scrollContainer = null`, no lanza error
5. **Misma posición que anterior:** Skip por JSON.stringify comparison
6. **Elementos DOM ausentes:** `document.getElementById` retorna null para algunos elementos

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
