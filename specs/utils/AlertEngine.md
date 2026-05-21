# Spec: `src/utils/AlertEngine.js`

## Propósito
Genera alertas meteorológicas basadas en umbrales (temp, viento, lluvia, UV, nieve) a partir de datos horarios, y las renderiza en el DOM.

## Dependencias

### Módulos internos
| Módulo | Export usado | Para qué |
|--------|-------------|----------|
| `./i18n.js` | `t` | Traducción de textos de alerta |

### DOM
| Elemento | Tipo de acceso | Contexto |
|----------|---------------|----------|
| `#alerts-container` | getElementById / display style | renderAlerts |
| `#alerts-tooltip` | getElementById / innerHTML | renderAlerts |

## API Pública

### `export function generateAlerts(hourlyData: Array, index: number): { alerts: Array, alertLevel: number }`

**Descripción:** Escanea hasta 12 horas desde `index` en `hourlyData` y genera alertas por superación de umbrales. Cada tipo de alerta aparece una sola vez.

**Parámetros:**
| Nombre | Tipo | Descripción |
|--------|------|-------------|
| `hourlyData` | `Array` | Datos horarios con `temp`, `gusts`, `precip`, `uv`, `weatherCode` |
| `index` | `number` | Índice inicial de escaneo |

**Retorno:** `{ alerts: Array<{type, level, msg}>, alertLevel: number }`

**Mutates state:** No

**Async:** No

### `export function renderAlerts(alerts: Array, alertLevel: number): void`

**Descripción:** Renderiza las alertas en el DOM. Muestra contenedor con tooltip si hay alertas; lo oculta si no.

**Parámetros:**
| Nombre | Tipo | Descripción |
|--------|------|-------------|
| `alerts` | `Array` | Lista de alertas de `generateAlerts` |
| `alertLevel` | `number` | Nivel máximo de alerta (1-3) |

**Retorno:** `void`

**Mutates state:** No

**Async:** No

## Comportamiento

1. **Umbrales de temperatura:** `>=38°C` → level 3, `>=35°C` → level 2, `<=-5°C` → level 2
2. **Umbrales de viento:** `>=90km/h` → level 3, `>=70km/h` → level 2
3. **Umbrales de lluvia:** `>=15mm/h` → level 3, `>=8mm/h` → level 2
4. **Umbrales UV:** `>=11` → level 3
5. **Umbrales nieve:** weatherCode en [71,73,75,77,85,86] con precip `>=2mm` → level 2
6. Cada tipo de alerta se emite una sola vez (primer match) gracias a `alertTypes` (Set)
7. `alertLevel` es el máximo nivel encontrado entre todas las alertas
8. `renderAlerts`: si hay alertas, muestra el contenedor y pinta tooltip con color según nivel; si no, oculta contenedor
9. Colores de icono: level 3 → rojo (`#d32f2f`), level 2 → naranja (`#f57c00`), level 1 → amarillo (`#fbc02d`)
10. Punto de alerta: level 3 → `#ef5350`, level 2 → `#ff9800`, level 1 → `#ffca28`

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `hourlyData` vacío | Retorna `{ alerts: [], alertLevel: 0 }` |
| `index` >= `hourlyData.length` | No itera (loop no ejecutado), retorna `{ alerts: [], alertLevel: 0 }` |
| `hourlyData[i]` es null/undefined | Se salta con `continue` |
| `alertContainer` o `alertTooltip` no existen | No hace nada (return temprano) |

## Escenarios de test

1. **Alerta calor extremo:** `temp >= 38` → alerta level 3
2. **Alerta vientos huracanados:** `gusts >= 90` → alerta level 3
3. **Alerta lluvias torrenciales:** `precip >= 15` → alerta level 3
4. **UV extremo:** `uv >= 11` → alerta level 3
5. **Nevada intensa:** weatherCode 73 + precip >= 2 → alerta level 2
6. **Sin alertas:** datos dentro de rangos normales → alerts vacío, level 0
7. **Múltiples alertas:** se generan varios tipos, `alertTypes` evita duplicados
8. **alertLevel máximo:** nivel se calcula como `Math.max` de todas las alertas
9. **renderAlerts con alertas:** se muestra contenedor y se pinta tooltip
10. **renderAlerts sin alertas:** se oculta contenedor

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
