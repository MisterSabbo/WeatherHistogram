# Spec: `src/ui/YearInPixels.js`

## Propósito
Visualización anual tipo "Year in Pixels" con grid mensual de datos históricos: temperatura, precipitación, viento, AQI, polen, estado de ánimo.

## Dependencias

### state
| Propiedad | Acceso | Contexto |
|-----------|--------|----------|
| `state.theme` | read | no usado directamente |

### Módulos internos
| Módulo | Export usado | Para qué |
|--------|-------------|----------|
| `../services/StorageService.js` | `storageService` | historial, persistir estados de ánimo (`updateDayMoods`) |
| `../theme.js` | `getThemeColor` | colores |
| `../utils/i18n.js` | `t` | traducción |
| `../services/AqiManager.js` | `getPollenLevelByType`, `getAggregatedPollenLevel` | polen |

### Constantes internas
| Constante | Valor | Contexto |
|-----------|-------|----------|
| `MOODS` | Array de 6 objetos `{ id, emoji, labelKey, color }` | `saveDayMoods`, `renderYIPGrid`, `openYIPDetail` |
| `MOOD_EMOJI_MAP` | Mapa de `id → emoji` | `renderYIPGrid` (icono en celda) |

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
- `saveDayMoods(data, locationName)` — guarda estados de ánimo del día vía `storageService.updateDayMoods`
- `getColorForParam(param, value)` — color según valor
- `renderLegend(param, legendContainer)` — leyenda de colores
- `showConfirm(title, message)` — confirm dialog

## Comportamiento

1. Botón `#year-in-pixels-btn` abre modal con chips de ubicaciones guardadas
2. Grid 12×31 con colores por parámetro (temp, precip, wind, AQI, polen, mood)
3. Click en celda → detail sheet con métricas del día
4. Param sheet con categorías agrupadas (incluye categoría "Estado de Ánimo" con parámetro `mood`)
5. Delete location y delete month data con confirmación
6. Paginación por dots en chips de ubicación
7. **Parámetro `mood`**: cuando `param === 'mood'`, las celdas se colorean con el color del primer mood del día (o gris si no hay moods). La leyenda muestra los 6 colores de mood.
8. **Icono de mood en celda**: si `data.moods?.length > 0`, la celda muestra el emoji del primer mood como icono (similar al icono `sticky_note_2` para notas). Si hay tanto moods como notas, se muestran ambos iconos.
9. **Detail sheet — selector de moods**:
   - Layout: **Grid 2 columnas** (`grid-template-columns: 1fr 1fr`) con gap de 8px
   - Cada botón `.yip-mood-btn`:
     - Tiene estilo de píldora: `border-radius: 10px`, padding `10px 12px`, border `1.5px solid var(--grid-color)`
     - JS le asigna `style.setProperty('--mood-color', mood.color)` con su color único
     - Contiene: `emoji + texto + <span class="yip-mood-check material-symbols-outlined">check</span>`
   - Estado **`.active`**:
     - `background: var(--mood-color)`
     - `color: #fff`
     - `border-color: var(--mood-color)`
     - El icono check aparece (`opacity: 1`), alineado a la derecha con `margin-left: auto`
   - Botones de acción: `.yip-moods-save-btn` y `.yip-moods-cancel-btn` con estilo similar a la sección de notas
   - Funcionalidad: multi-select toggle (clic marca/desmarca), Botón "Guardar" persiste vía `saveDayMoods`
10. `saveDayMoods`: lee los moods seleccionados del DOM, construye array de mood ids activos, llama `storageService.updateDayMoods(locationName, data.time, moods)`. Si éxito, actualiza `data.moods` en memoria y muestra mensaje "guardado". Modalidad multi-select (pueden seleccionarse varios moods para un mismo día).

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
| Celda con `data.moods` no vacío | La celda muestra el emoji del primer mood como icono |
| Celda sin `data.moods` | Sin icono de mood |
| Celda con `data.moods` y `data.notes` | Ambos iconos visibles (mood emoji + sticky_note_2) |
| `param === 'mood'` con `data.moods` existente | Celda coloreada con el color del primer mood |
| `param === 'mood'` con `data.moods` vacío/ausente | Celda gris (color por defecto) |
| `param === 'mood'` con `data.moods` multi-select | Solo el primer mood determina el color de celda |
| `saveDayMoods` con un mood seleccionado | Persiste array con un elemento, mensaje confirmación |
| `saveDayMoods` con ningún mood seleccionado | Persiste array vacío (elimina key moods) |
| `saveDayMoods` sin datos del día | No persiste, retorna sin cambios |
| Detail sheet mood toggles | Cada toggle es independiente, multi-select permitido |

## Escenarios de test

1. **Se inicializa sin errores con elementos DOM presentes:** `initYearInPixels` con botón presente, no lanza error
2. **No lanza si faltan elementos DOM en el documento:** Botón `#year-in-pixels-btn` ausente, no lanza error
3. **Exporta las funciones esperadas:** `initYearInPixels`, `saveDayMoods` son funciones exportadas
4. **Sin historial guardado:** `storageService` vacío, muestra mensaje sin error
5. **Parámetro inválido en color:** `getColorForParam('invalid', value)` retorna gris
6. **Valor null/undefined en color:** Trata como 0
7. **openYIPDetail con data.notes:** textarea poblado con el contenido de la nota
8. **openYIPDetail sin data.notes:** textarea vacío
9. **saveDayNote con texto:** llama storageService.updateDayNotes, nota se guarda
10. **saveDayNote con texto vacío:** storageService.updateDayNotes llamado con string vacío
11. **renderYIPGrid con día que tiene notes:** celda contiene clase `has-notes` e icono `sticky_note_2`
12. **renderYIPGrid con día sin notes:** celda no tiene icono ni clase `has-notes`
13. **renderYIPGrid con param='mood' y día con moods:** celda coloreada con el color del primer mood
14. **renderYIPGrid con param='mood' y día sin moods:** celda gris
15. **renderYIPGrid con día que tiene moods:** celda muestra emoji del primer mood como icono
16. **renderYIPGrid con día que tiene moods + notes:** celda muestra ambos iconos
17. **openYIPDetail con data.moods:** mood toggles muestran los moods activos seleccionados
18. **openYIPDetail sin data.moods:** mood toggles todos desmarcados
19. **saveDayMoods con moods seleccionados:** llama storageService.updateDayMoods con array de ids, data.moods actualizado en memoria
20. **saveDayMoods sin moods seleccionados:** llama storageService.updateDayMoods con array vacío, key moods eliminada de data
21. **Param sheet incluye categoría mood:** `populateParamSheet` renderiza opción "Estado de Ánimo" con parámetro `mood`
22. **getColorForParam('mood', ...):** retorna color según primer mood o gris por defecto
23. **getColorForParam('mood', null/undefined):** retorna gris
24. **renderLegend('mood', ...):** muestra 6 entradas de color con emoji/label de cada mood

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
| 2026-05-21 | Añadido `saveDayNote`, `openYIPDetail` acepta tercer parámetro | SDD |
| 2026-05-21 | Añadido icono visual en celdas con notas (`has-notes` class + `sticky_note_2`) | SDD |
| 2026-05-21 | Añadido parámetro `mood` al YIP: grid coloreado por mood, icono emoji en celdas, selector multi-mood en detail sheet, función `saveDayMoods` | SDD |
| 2026-05-21 | **Rediseño visual del mood selector**: grid 2 columnas, botones tipo píldora con `--mood-color`, check icon en estado activo, fondo de color cuando `.active` | SDD |
