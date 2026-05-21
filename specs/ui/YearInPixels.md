# Spec: `src/ui/YearInPixels.js`

## Propósito
Visualización anual tipo "Year in Pixels" con grid mensual de datos históricos: temperatura, precipitación, viento, AQI, polen.

## Dependencias

### state
| Propiedad | Acceso | Contexto |
|-----------|--------|----------|
| `state.theme` | read | no usado directamente |

### Módulos internos
| Módulo | Export usado | Para qué |
|--------|-------------|----------|
| `../services/StorageService.js` | `storageService` | historial |
| `../theme.js` | `getThemeColor` | colores |
| `../utils/i18n.js` | `t` | traducción |
| `../services/AqiManager.js` | `getPollenLevelByType`, `getAggregatedPollenLevel` | polen |

## API Pública

### `export function initYearInPixels(): void`

**Descripción:** Inicializa el modal Year in Pixels.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| — | — | Sin parámetros |

**Metadatos:**
- Mutates state: Sí (registra event listeners, modifica DOM)
- Async: No

### Funciones privadas
- `loadLocationData(locationName)` — carga historial y renderiza
- `populateParamSheet()` — sheet selector de parámetro
- `renderYIPGrid(history, param)` — renderiza grid anual
- `openYIPDetail(data, dateStr, locationName?)` — detalle de día (tercer parámetro opcional, defaults a `selectedLocation`)
- `saveDayNote(data, locationName)` — guarda nota del día vía `storageService.updateDayNotes`
- `getColorForParam(param, value)` — color según valor
- `renderLegend(param, legendContainer)` — leyenda de colores
- `showConfirm(title, message)` — confirm dialog

## Comportamiento

1. Botón `#year-in-pixels-btn` abre modal con chips de ubicaciones guardadas
2. Grid 12×31 con colores por parámetro (temp, precip, wind, AQI, polen)
3. Click en celda → detail sheet con métricas del día
4. Param sheet con categorías agrupadas
5. Delete location y delete month data con confirmación
6. Paginación por dots en chips de ubicación

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `#year-in-pixels-btn` no existe | `initYearInPixels` no lanza error, no registra listener |
| `storageService` sin historial | Muestra mensaje "sin historial" |
| `history` vacío para ubicación | Grid sin celdas, no lanza error |
| Parámetro inválido en `getColorForParam` | Retorna color por defecto (gris) |
| Valor `null`/`undefined` en `getColorForParam` | Trata como 0 |
| `showConfirm` con cancelación | No ejecuta acción destructiva |
| Múltiples ubicaciones sin datos | Chips visibles pero grid vacío para cada una |
| `openYIPDetail` con `data.notes` no vacío | Textarea se puebla con el contenido de `data.notes` |
| `openYIPDetail` sin `data.notes` | Textarea vacío |
| `saveDayNote` con texto | Llama `storageService.updateDayNotes`, muestra mensaje "guardado" |
| `saveDayNote` con texto vacío | Llama `updateDayNotes` con string vacío (borra la key `notes`) |
| Celda con `data.notes` existente | La celda tiene clase `has-notes` e icono `sticky_note_2` en esquina superior derecha |
| Celda sin `data.notes` | Sin icono, sin clase `has-notes` |

## Escenarios de test

1. **Se inicializa sin errores con elementos DOM presentes:** `initYearInPixels` con botón presente, no lanza error
2. **No lanza si faltan elementos DOM en el documento:** Botón `#year-in-pixels-btn` ausente, no lanza error
3. **Exporta las funciones esperadas:** `initYearInPixels` es función
4. **Sin historial guardado:** `storageService` vacío, muestra mensaje sin error
5. **Parámetro inválido en color:** `getColorForParam('invalid', value)` retorna gris
6. **Valor null/undefined en color:** Trata como 0
7. **openYIPDetail con data.notes:** textarea poblado con el contenido de la nota
8. **openYIPDetail sin data.notes:** textarea vacío
9. **saveDayNote con texto:** llama storageService.updateDayNotes, nota se guarda
10. **saveDayNote con texto vacío:** storageService.updateDayNotes llamado con string vacío
11. **renderYIPGrid con día que tiene notes:** celda contiene clase `has-notes` e icono `sticky_note_2`
12. **renderYIPGrid con día sin notes:** celda no tiene icono ni clase `has-notes`

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
| 2026-05-21 | Añadido `saveDayNote`, `openYIPDetail` acepta tercer parámetro | SDD |
| 2026-05-21 | Añadido icono visual en celdas con notas (`has-notes` class + `sticky_note_2`) | SDD |
