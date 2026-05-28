# Spec: `src/ui/YearInPixels.js`

## Propósito
Visualización anual tipo "Year in Pixels" con grid mensual (12×31) de datos históricos meteorológicos, estado de ánimo, y condiciones de salud (resfriado/alergias), con detalle por día, edición de notas, moods y condiciones.

## Dependencias

### DOM (elementos HTML esperados)
| Elemento | Tipo de acceso | Contexto |
|----------|---------------|----------|
| `#year-in-pixels-btn` | getElementById + click | initYearInPixels |
| `#yip-modal` | getElementById + style.display | initYearInPixels, close |
| `#close-yip-modal-btn` | getElementById + click | initYearInPixels |
| `#yip-location-chips` | getElementById | initYearInPixels, initYipLocationScroll, updateYipScrollUI |
| `#yip-param-display` | getElementById + click | initYearInPixels, populateParamSheet |
| `#yip-delete-loc-btn` | getElementById + click | initYearInPixels |
| `#yip-grid-container` | getElementById | renderYIPGrid |
| `#yip-legend` | getElementById | renderYIPGrid, renderLegend |
| `#yip-param-sheet` | getElementById | populateParamSheet |
| `#yip-detail-date` | getElementById textContent | openYIPDetail |
| `#yip-detail-desc` | getElementById textContent | openYIPDetail |
| `#yip-detail-metrics` | getElementById innerHTML | openYIPDetail |
| `#yip-detail-notes-section` | getElementById style.display | openYIPDetail |
| `#yip-detail-notes-input` | getElementById value | openYIPDetail, saveDayNote, saveDayDetail |
| `#yip-detail-save-btn` | getElementById clone + onclick | openYIPDetail |
| `#yip-detail-cancel-btn` | getElementById clone + onclick | openYIPDetail |
| `#yip-detail-saved-msg` | getElementById style.display | openYIPDetail, saveDayDetail |
| `#yip-detail-moods-section` | getElementById style.display | openYIPDetail |
| `#yip-moods-selector` | getElementById innerHTML | openYIPDetail, saveDayMoods, saveDayDetail |
| `#yip-detail-sheet` | openBottomSheet | openYIPDetail |
| `#yip-sheet-backdrop` | openBottomSheet | openYIPDetail |
| `#yip-detail-sheet-drag-handle` | getElementById (fixed, non-scrolling) | HTML structure |
| `.yip-sheet-scroll-content` | child div of sheet, `overflow-y: auto` | HTML structure |
| `#yip-location-dots` | getElementById innerHTML | updateYipScrollUI |
| `#confirm-title` | getElementById textContent | showConfirm |
| `#confirm-message` | getElementById textContent | showConfirm |
| `#confirm-cancel-btn` | getElementById clone + onclick | showConfirm |
| `#confirm-ok-btn` | getElementById clone + onclick | showConfirm |
| `#confirm-modal` | openBottomSheet | showConfirm |
| `#confirm-sheet-backdrop` | openBottomSheet | showConfirm |
| `#yip-detail-conditions-section` | getElementById style.display | openYIPDetail |
| `#yip-conditions-selector` | getElementById innerHTML | openYIPDetail, saveDayDetail |
| `#yip-cold-toggle` | getElementById classList.add/remove | openYIPDetail |
| `#yip-allergies-toggle` | getElementById classList.add/remove | openYIPDetail |
| `.yip-chip` | querySelectorAll | loadLocationData, updateYipScrollUI |
| `.yip-day-cell` | createElement | renderYIPGrid |
| `.yip-month-block` | createElement | renderYIPGrid |
| `.yip-dot-container` | createElement (inside cell) | renderYIPGrid |
| `.yip-condition-dot` | createElement (inside cell) | renderYIPGrid |

### Módulos internos
| Módulo | Export usado | Para qué |
|--------|-------------|----------|
| `../services/StorageService.js` | `storageService` | getHistory, updateDayNotes, updateDayMoods, init, db, historyStoreName |
| `../utils/i18n.js` | `t` | Traducción de textos |
| `../services/AqiManager.js` | `getPollenLevelByType`, `getAggregatedPollenLevel` | Niveles de polen |

### Variables globales de módulo (no `state`)
| Variable | Tipo | Inicial | Uso |
|----------|------|---------|-----|
| `cachedHistory` | `object\|null` | `null` | Almacena history cargada para re-render al cambiar param |
| `selectedLocation` | `string\|null` | `null` | Ubicación activa seleccionada entre chips |
| `selectedParam` | `string` | `'maxTemp'` | Parámetro activo (maxTemp, minTemp, precip, windMax, gustMax, aqi, pollen, pollen_*, mood, cold, allergies) |
| `_closeSheet` | `function\|undefined` | `undefined` | Callback para cerrar el param sheet |
| `_closeDetailSheet` | `function\|undefined` | `undefined` | Callback para cerrar el detail sheet |
| `_yipScrollInit` | `boolean` | `false` | Flag para inicializar scroll de chips una sola vez |
| `_yipScrollListenersAttached` | `boolean` | `false` | Flag para evitar duplicar listeners de scroll |

### Constantes internas
| Constante | Valor | Contexto |
|-----------|-------|----------|
| `MOODS` | Array de 6 objetos `{ id, emoji, labelKey, color }` | saveDayMoods, renderYIPGrid, openYIPDetail, getColorForParam, renderLegend |
| `MOOD_EMOJI_MAP` | Mapa de `id → emoji` | renderYIPGrid (icono emoji en celda) |
| `DOT_COLORS` | Mapa `{ notes: '#60a5fa', mood: '#fbbf24', cold: '#ef4444', allergies: '#22c55e' }` | renderYIPGrid (dots) |

### Nuevos parámetros
| Parámetro | Color sí | Color no |
|-----------|----------|----------|
| `cold` | `#eab308` (yellow) | `var(--grid-color)` |
| `allergies` | `#22c55e` (green) | `var(--grid-color)` |

## API Pública

### `export function initYearInPixels(): void`

**Descripción:** Inicializa el modal Year in Pixels. Busca elementos DOM, registra event listeners para abrir modal desde `#year-in-pixels-btn`, cerrar desde `#close-yip-modal-btn` y click fuera del modal, borrar ubicación desde `#yip-delete-loc-btn`, y abrir selector de parámetro desde `#yip-param-display`. Al abrir modal, lista ubicaciones guardadas en IndexedDB como chips y carga datos de la primera/activa.

**Metadatos:**
- Mutates state: No (usa variables de módulo: `selectedLocation`, `_closeSheet`, `_yipScrollInit`)
- Async: No

### `export function renderYIPGrid(history: object|null, param: string): void`

**Descripción:** Renderiza el grid anual (12 meses × 31 días) en `#yip-grid-container`. Asigna color a cada celda según el valor del parámetro. Muestra iconos de nota y mood si existen. Si no hay history, muestra mensaje "sin historial".

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `history` | `object\|null` | Objeto con array `daily[]` de datos históricos |
| `param` | `string` | Identificador del parámetro a visualizar |

**Metadatos:**
- Mutates state: No (modifica DOM directamente)
- Async: No

### `export function saveDayNote(data: object, locationName: string): Promise<void>`

**Descripción:** Lee `#yip-detail-notes-input`, llama `storageService.updateDayNotes(locationName, data.time, value)`. Si éxito, actualiza `data.notes` y muestra mensaje "guardado".

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `data` | `object` | Objeto del día (`data.time` usado como key) |
| `locationName` | `string` | Nombre de la ubicación |

**Metadatos:**
- Mutates state: No (modifica DOM + objeto data en memoria)
- Async: Sí (await storageService.updateDayNotes)

### `export function saveDayMoods(data: object, locationName: string): Promise<void>`

**Descripción:** Lee moods activos del DOM (`#yip-moods-selector .yip-mood-btn.active`), construye array de mood ids, llama `storageService.updateDayMoods(loc, data.time, selectedMoods)`. Si éxito, actualiza `data.moods` y muestra mensaje.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `data` | `object` | Objeto del día |
| `locationName` | `string` | Nombre de la ubicación |

**Metadatos:**
- Mutates state: No (modifica DOM + objeto data en memoria)
- Async: Sí (await storageService.updateDayMoods)

### `export function saveDayDetail(data: object, locationName: string): Promise<void>`

**Descripción:** Función unificada que lee el textarea de notas (`#yip-detail-notes-input`), los moods activos (`#yip-moods-selector .yip-mood-btn.active`), y las condiciones de salud (`#yip-cold-toggle.active`, `#yip-allergies-toggle.active`), persiste todo en una sola operación vía `storageService.updateDayData()` para evitar race conditions, muestra feedback "✓ Guardado" en `#yip-detail-saved-msg`, y cierra el detail sheet tras 1 segundo.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `data` | `object` | Objeto del día (`data.time` usado como key) |
| `locationName` | `string` | Nombre de la ubicación |

**Metadatos:**
- Mutates state: No (modifica DOM + objeto data en memoria + cierra sheet)
- Async: Sí (await storageService.updateDayData)

### `export function openYIPDetail(data: object, dateStr: string, locationName?: string): void`

**Descripción:** Abre detail sheet para un día específico. Resetea `scrollTop` del sheet a 0 para que el contenido siempre aparezca al inicio. Puebla fecha, descripción (temp max/min), métricas (precip, wind, AQI, polen), sección de notas (textarea), selector de moods (multi-select toggle), y sección de condiciones de salud (botones toggle "Cold" y "Allergies"). Enlaza botón "Guardar" → `saveDayDetail` y "Cancelar" → cierre inmediato del sheet. Usa `window.openBottomSheet` para mostrar `#yip-detail-sheet`. Clona botones para eliminar listeners previos. Guarda `_closeDetailSheet` del `openBottomSheet` para cierre programático.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `data` | `object` | Objeto del día con tempMax, tempMin, precipTotal, windMax, gustMax, aqi, pollenDetails, notes, moods |
| `dateStr` | `string` | Fecha formateada (ej. "15 Enero 2026") |
| `locationName?` | `string` | Opcional. Defaults a `selectedLocation` |

**Metadatos:**
- Mutates state: No (modifica DOM, llama window.openBottomSheet)
- Async: No
- Scroll: Resetea `scrollTop = 0` en `#yip-detail-sheet` al inicio

### `export function updateYipScrollUI(): void`

**Descripción:** Actualiza `#yip-location-dots` con dots de paginación 1:1 con los chips de ubicación. El dot activo corresponde al chip más cercano al centro del viewport del contenedor. Solo muestra dots si hay overflow (scrollWidth > clientWidth).

**Metadatos:**
- Mutates state: No (modifica DOM)
- Async: No

## Comportamiento

1. **Inicialización**: `initYearInPixels` es idempotente — si `#year-in-pixels-btn` no existe, retorna sin error
2. **Apertura de modal**: Al hacer click en `#year-in-pixels-btn`, obtiene todas las keys de IndexedDB, renderiza chips de ubicación, y carga datos de la primera ubicación (o la seleccionada previamente)
3. **Selección de ubicación**: Click en chip → selecciona ubicación, carga su history, re-renderiza grid
4. **Grid mensual**: 12 bloques `.yip-month-block`, cada uno con cabeceras de día (Monday-start), celdas `.yip-day-cell` con color según valor del parámetro, número de día visible, y **dot indicator system** para estados no meteorológicos
5. **Color por parámetro**: `getColorForParam` asigna colores según rangos definidos para cada tipo de parámetro (temp, precip, wind, AQI, pollen, mood, cold, allergies)
6. **Celdas future**: días posteriores al actual tienen clase `future` (opacidad reducida), sin color ni click
7. **Click en celda**: abre detail sheet con métricas del día, notas editables, selector multi-mood, y toggles de condiciones de salud (cold/allergies)
8. **Selector de parámetro**: `populateParamSheet` renderiza bottom sheet con categorías agrupadas (temp, precip, wind, AQI, pollen, mood, health). Al seleccionar, actualiza `selectedParam`, re-renderiza grid y cierra sheet
9. **Borrar ubicación**: `#yip-delete-loc-btn` con confirmación → elimina key completa de IndexedDB
10. **Borrar datos de mes**: botón delete en cada mes → filtra daily/hourly del mes y persiste
11. **Paginación por dots (`updateYipScrollUI`)**: dots 1:1 con chips, dot activo = chip más visible cerca del centro, oculto si no hay overflow, actualizado en scroll/resize/MutationObserver
12. **Detail sheet — notas**: textarea editable. Sin botón individual — la nota se guarda junto con los moods y condiciones mediante el botón unificado
13. **Detail sheet — moods**: grid 2 columnas de botones tipo píldora con multi-select toggle. Sin botón individual — se guarda junto con nota y condiciones
14. **Detail sheet — condiciones de salud**: dos botones toggle "🤧 Cold" y "🌿 Allergies" en sección `#yip-detail-conditions-section`. Al hacer click, toggle clase `active`. Los botones se poblan desde `data.cold` y `data.allergies`. Sin botón individual — se guarda junto con nota y moods
15. **Detail sheet — guardar unificado**: botón "Guardar" clonado en `openYIPDetail` → llama `saveDayDetail`, que persiste nota + moods + conditions en paralelo vía `storageService.updateDayNotes` + `updateDayMoods` + `updateDayConditions`, muestra feedback "✓ Guardado" en `#yip-detail-saved-msg`, y cierra el sheet automáticamente tras 1 segundo
16. **Detail sheet — cancelar unificado**: botón "Cancelar" clonado en `openYIPDetail` → cierra el sheet inmediatamente sin persistir cambios (usa `_closeDetailSheet`)
17. **Confirmaciones**: `showConfirm` usa `window.openBottomSheet` para mostrar modal de confirmación, clonando botones OK/Cancel para eliminar listeners previos
18. **Dot indicator system**: Cada `.yip-day-cell` con estado no meteorológico (has-notes, has-mood, cold, allergies) muestra micro-dots (4px círculos) al fondo de la celda, debajo del day number. Colores fijos/semánticos: notes=#60a5fa (azul), mood=#fbbf24 (amarillo), cold=#ef4444 (rojo), allergies=#22c55e (verde). Máximo 3 dots visibles; si hay más de 3 estados, se muestran los primeros 3 y un "…" (ellipsis). Los dots reemplazan los iconos individuales antiguos (.yip-mood-icon, .yip-note-icon). Los dots son siempre visibles independientemente del parámetro activo
19. **Grid coloring por cold/allergies**: Cuando `selectedParam === 'cold'`, las celdas se colorean `#eab308` (yellow) si `data.cold === true`, o `var(--grid-color)` si no. Cuando `selectedParam === 'allergies'`, se colorean `#22c55e` (green) si `data.allergies === true`, o `var(--grid-color)` si no. La leyenda muestra 2 pasos: sí/no
20. **Popup de toggles en detail sheet**: `openYIPDetail` lee `data.cold` y `data.allergies`, aplica clase `active` a los botones correspondientes. `saveDayDetail` lee el estado de `#yip-cold-toggle.active` y `#yip-allergies-toggle.active`, construye objeto `conditions = { cold: boolean, allergies: boolean }`, y persiste vía `storageService.updateDayConditions`

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `#year-in-pixels-btn` no existe | `initYearInPixels` retorna sin error, no registra listeners |
| `#yip-modal` no existe | `initYearInPixels` retorna sin error |
| `history` es `null` o `history.daily` vacío | Muestra mensaje "Sin historial para mostrar" |
| `history.daily` tiene datos de año anterior | Se filtran (solo año actual se renderiza) |
| Parámetro inválido en `getColorForParam` | Retorna `var(--grid-color)` |
| Valor `null`/`undefined` en `getColorForParam` | Se evalúa en condicionales (tratado como 0 o falsy) |
| `param === 'mood'` sin moods en el día | Celda gris (`var(--grid-color)`) |
| `param === 'mood'` con moods multi-select | Solo el primer mood determina color de celda |
| `data.notes` undefined/null | Textarea vacío, sin dot azul en celda |
| `data.moods` undefined/null | Sin dot amarillo en celda |
| `data.cold` undefined/null | Cold toggle sin clase `active`, sin dot rojo en celda |
| `data.allergies` undefined/null | Allergies toggle sin clase `active`, sin dot verde en celda |
| `data.cold === true` | Cold toggle con clase `active`, dot rojo visible en celda |
| `data.allergies === true` | Allergies toggle con clase `active`, dot verde visible en celda |
| 4+ estados no meteorológicos activos | Solo primeros 3 dots + "…" (ellipsis) |
| 0 estados no meteorológicos | Sin dots, sin yip-dot-container |
| `saveDayNote` con texto vacío | `storageService.updateDayNotes` llamado con string vacío |
| `saveDayMoods` sin moods seleccionados | Array vacío persistido (elimina key moods) |
| `openYIPDetail` con `data` null/undefined | Retorna sin hacer nada |
| `openYIPDetail` después de scroll en otro día | `sheet.scrollTop` se resetea a 0 al abrir |
| Drag handle con contenido corto (sin scroll) | Drag handle visible, swipe-to-dismiss funciona |
| Drag handle con contenido largo (scroll) | Drag handle fijo arriba, contenido scrolla debajo |
| `param === 'cold'` con cold=true en día | Celda amarilla (#eab308) |
| `param === 'cold'` sin cold | Celda gris (var(--grid-color)) |
| `param === 'allergies'` con allergies=true | Celda verde (#22c55e) |
| `param === 'allergies'` sin allergies | Celda gris (var(--grid-color)) |
| `populateParamSheet` sin `#yip-param-sheet` en DOM | Retorna sin hacer nada |
| `updateYipScrollUI` sin `#yip-location-chips` o `#yip-location-dots` | Retorna sin hacer nada |
| `updateYipScrollUI` con 0 chips | dotsContainer se vacía |
| `updateYipScrollUI` sin overflow (scrollWidth <= clientWidth) | dotsContainer se vacía |
| `showConfirm` cancelado | Resuelve `false`, no ejecuta acción destructiva |
| `storageService.init()` falla | Error no capturado (propaga) |
| `storageService.getHistory(locationName)` retorna null | `cachedHistory = null`, renderYIPGrid muestra "sin historial" |
| Botón save/cancel clickeado múltiples veces | Clonación de nodos elimina listeners previos, evitando duplicados |
| `saveDayDetail` con textarea vacío y sin moods | Persiste texto vacío con updateDayNotes y array vacío con updateDayMoods |
| `saveDayDetail` con `#yip-detail-save-btn` o `#yip-detail-cancel-btn` ausentes | openYIPDetail skip bindings, no lanza error |
| `_closeDetailSheet` undefined al hacer cancel | No lanza error (if guardado) |
| `window.openBottomSheet` no definido | Fallback: `_closeSheet = undefined` o `resolve(confirm(message))` |

## Escenarios de test

1. **initYearInPixels sin elementos DOM**: `#year-in-pixels-btn` ausente, no lanza error
2. **initYearInPixels con elementos DOM**: elementos presentes, registra listeners sin error
3. **Exporta todas las funciones**: `initYearInPixels`, `renderYIPGrid`, `saveDayNote`, `saveDayMoods`, `saveDayDetail`, `openYIPDetail`, `updateYipScrollUI` son funciones
4. **renderYIPGrid con history null**: container muestra mensaje "Sin historial"
5. **renderYIPGrid con history.daily vacío**: container muestra mensaje "Sin historial"
6. **renderYIPGrid con datos del año actual**: grid tiene 12 month-blocks con celdas coloreadas
7. **renderYIPGrid celda con notas**: celda tiene clase `has-notes` e icono `sticky_note_2`
8. **renderYIPGrid celda sin notas**: celda sin clase `has-notes`, sin icono
9. **renderYIPGrid celda con moods**: celda tiene clase `has-mood` y emoji del primer mood
10. **renderYIPGrid celda sin moods**: celda sin clase `has-mood`, sin emoji
11. **renderYIPGrid param='mood' con moods**: celda coloreada con color del primer mood
12. **renderYIPGrid param='mood' sin moods**: celda gris (color por defecto)
13. **renderYIPGrid celda future**: celda con clase `future`, sin color, sin onclick
14. **renderYIPGrid celda con datos**: celda tiene onclick que abre detail
15. **getColorForParam con parámetro inválido**: retorna `var(--grid-color)`
16. **getColorForParam con mood**: retorna color del mood o gris si no existe
17. **openYIPDetail con data.notes**: textarea poblado con contenido de la nota
18. **openYIPDetail sin data.notes**: textarea vacío
19. **openYIPDetail con data.moods**: mood toggles muestran moods activos
20. **openYIPDetail sin data.moods**: todos los mood toggles desmarcados
21. **openYIPDetail resetea scrollTop a 0**: abre sheet, scrollTop debe ser 0
22. **openYIPDetail con data null**: retorna sin error, no modifica DOM
22. **saveDayNote con texto**: llama `storageService.updateDayNotes` con el texto, muestra mensaje
23. **saveDayNote con texto vacío**: llama `storageService.updateDayNotes` con string vacío
24. **saveDayMoods con moods seleccionados**: llama `storageService.updateDayMoods` con array de ids
25. **saveDayMoods sin moods seleccionados**: llama `storageService.updateDayMoods` con array vacío
26. **saveDayDetail con nota y moods**: llama updateDayNotes + updateDayMoods en paralelo, muestra feedback, cierra sheet tras 1s
27. **Param sheet incluye categoría mood**: `populateParamSheet` renderiza opción mood
28. **renderLegend para cada tipo de parámetro**: renderiza steps correctos para temp, precip, wind, AQI, pollen, mood
29. **updateYipScrollUI con 0 chips**: dotsContainer se vacía
30. **updateYipScrollUI con N chips sin overflow**: dotsContainer se vacía
31. **updateYipScrollUI con N chips con overflow**: renderiza N dots
32. **updateYipScrollUI — dot activo cambia con scroll**: dot del chip más visible tiene clase `active`
33. **Cabeceras de día por mes**: cada month-block tiene `.yip-month-day-headers` con 7 hijos
34. **Cabeceras orden Monday-start**: `days.short` reordenado `[1,2,3,4,5,6,0]`
35. **Day number visible en cada celda**: toda celda `.yip-day-cell` contiene `.yip-day-number`
36. **initYipLocationScroll**: registra scroll, resize, MutationObserver solo una vez
37. **showConfirm resuelve true/false**: OK → true, Cancel → false
38. **showConfirm sin window.openBottomSheet**: fallback a `confirm()`
39. **Param sheet incluye categoría Health**: `populateParamSheet` renderiza opciones cold y allergies bajo categoría health
40. **renderYIPGrid param='cold' con día cold**: celda amarilla #eab308
41. **renderYIPGrid param='cold' sin cold**: celda gris var(--grid-color)
42. **renderYIPGrid param='allergies' con allergies**: celda verde #22c55e
43. **renderYIPGrid param='allergies' sin allergies**: celda gris var(--grid-color)
44. **renderYIPGrid dot system — 1 estado**: 1 dot del color correspondiente
45. **renderYIPGrid dot system — 3 estados**: 3 dots, uno por cada color
46. **renderYIPGrid dot system — 4+ estados**: primeros 3 dots + "…"
47. **renderYIPGrid dot system — sin estados**: sin dots, sin yip-dot-container
48. **renderYIPGrid dot system — colores fijos**: notes=#60a5fa, mood=#fbbf24, cold=#ef4444, allergies=#22c55e
49. **renderYIPGrid dot system — no hay iconos antiguos**: sin .yip-mood-icon ni .yip-note-icon
50. **openYIPDetail con data.cold=true**: cold toggle tiene clase active
51. **openYIPDetail sin data.cold**: cold toggle sin active
52. **openYIPDetail con data.allergies=true**: allergies toggle tiene clase active
53. **openYIPDetail sin data.allergies**: allergies toggle sin active
54. **saveDayDetail persiste conditions**: llama storageService.updateDayConditions con { cold, allergies }
55. **saveDayDetail con cold y allergies activos**: conditions = { cold: true, allergies: true }
56. **saveDayDetail sin cold ni allergies**: conditions = { cold: false, allergies: false }
57. **renderLegend para cold**: 2 pasos: color amarillo + "Sí" / gris + "No"
58. **renderLegend para allergies**: 2 pasos: color verde + "Sí" / gris + "No"

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-27 | Spec retro — mapeo completo del código actual (sin state/theme, con variables de módulo) | SDD |
| 2026-05-28 | Añadidas condiciones de salud (cold/allergies), dot indicator system, categoría Health en param sheet, toggles en detail sheet | SDD |
| 2026-05-28 | Drag handle fijo con scroll wrapper + scrollTop reset al abrir detail sheet | SDD |
