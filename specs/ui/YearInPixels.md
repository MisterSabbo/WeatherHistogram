# Spec: `src/ui/YearInPixels.js`

## Propósito
Visualización anual tipo "Year in Pixels" con grid mensual (12×31) de datos históricos meteorológicos, estado de ánimo, y condiciones de salud (resfriado/alergias), con detalle por día, edición de notas, moods y condiciones. Incluye animación de highlight tras guardar y mini toast de confirmación.

## Dependencias

### DOM (elementos HTML esperados)
| Elemento | Tipo de acceso | Contexto |
|----------|---------------|----------|
| `#year-in-pixels-btn` | getElementById + click | initYearInPixels |
| `#yip-modal` | getElementById + classList.add/remove `.open` | initYearInPixels, close |
| `#yip-modal-backdrop` | getElementById + classList.add/remove `.open` | initYearInPixels, close (backdrop click) |
| `#yip-modal-drag-handle` | getElementById + pointer events | initYearInPixels (mobile swipe-to-dismiss) |
| `#yip-modal-scroll-content` | getElementById scrollTop reset | initYearInPixels (scroll guard for drag) |
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
| `#yip-detail-clear-btn` | getElementById clone + onclick | openYIPDetail |
| `#yip-detail-cancel-btn` | getElementById clone + onclick | openYIPDetail |
| `#yip-detail-saved-msg` | getElementById style.display | openYIPDetail, saveDayDetail |
| `#yip-toast` | getElementById style.display + textContent | showErrorToast |
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
| `.yip-condition-dot` (CSS) | `width/height: 7px`, `border-radius: 50%`, `border: 1.5px solid #fff` (dark) / `rgba(0,0,0,0.25)` (light) | year-in-pixels.css |
| `#yip-legend-content` | getElementById innerHTML | renderLegendTabs, renderLegend, renderStateTabContent |
| `.yip-legend-footer` | Fixed bottom container (querySelector) | HTML structure — outside scroll area |
| `.yip-legend-tabs` | Tab bar with pagination dots (querySelector) | HTML structure — below legend content |
| `.yip-tab-label` | Clickable tab label | Tab switching (cell/state) |
| `.yip-legend-dot` | Pagination dot (● active, ○ inactive) | Tab switch indicator |
| `#yip-saved-toast` | getElementById style.display + textContent + classList | saveDayDetail, openYIPDetail |

### Módulos internos
| Módulo | Export usado | Para qué |
|--------|-------------|----------|
| `../services/StorageService.js` | `storageService` | getHistory, updateDayNotes, updateDayMoods, init, db, historyStoreName |
| `../utils/i18n.js` | `t` | Traducción de textos |
| `../services/AqiManager.js` | `getPollenLevelByType`, `getAggregatedPollenLevel` | Niveles de polen |
| `../utils/color.js` | `getTextColorForBg` | Color de texto adaptativo por luminancia del fondo |
| `../store.js` | `state` | Estado global (se lee `state.theme` para variantes de color en light mode) |

### Funciones internas (no exportadas)
| Función | Descripción |
|---------|-------------|
| `highlightYIPCell(time)` | Busca `.yip-day-cell[data-time="${time}"]` en el DOM, añade clase `.yip-highlight-flash` por 1s (animación CSS combinada: box-shadow + scale + outline con `var(--accent-precip)`, 1s). Light/dark mode: opacity 0.5 vs 0.3 |
| `renderLegendTabs(param)` | Renderiza el contenido de la leyenda según `_activeLegendTab` ('cell' o 'state') en `#yip-legend-content`. Si tab='cell' delega en `renderLegend()`; si 'state' delega en `renderStateTabContent()`. Registra event listeners en `.yip-tab-label` y `.yip-legend-dot` (solo si no están ya registrados). Siempre sincroniza la clase `.active` de los dots |
| `renderStateTabContent(container)` | Renderiza 4 dots de condición (notes=azul, mood=oro, cold=rojo, allergies=verde) con labels traducidos. Cada dot es un círculo de 7px con `border-radius: 50%` y el color de `DOT_COLORS` |
| `showErrorToast(message)` | Muestra `#yip-toast` con el mensaje, auto-dismiss tras 3s con fade out. Usa `_toastTimer` para evitar múltiples timers |
| `closeYipModal()` | Cierra el YIP quitando clase `.open` de `#yip-modal` y `#yip-modal-backdrop`. También cancela drag en curso si existe. Se llama desde botón ×, backdrop click, drag-to-dismiss y borrado de ubicación |
| `_initYipModalDrag()` | Inicializa pointer events en `#yip-modal-drag-handle` para swipe-to-dismiss. Solo activo en mobile (<768px). Guard: si `#yip-modal-scroll-content.scrollTop > 0`, no arrastra. Umbral de cierre >100px |

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
| `_closeYipModal` | `function\|null` | `null` | Callback para cerrar el YIP modal programáticamente (seteada en initYearInPixels) |
| `_yipDragState` | `object\|null` | `null` | Estado interno del drag-to-dismiss: `{ startY, currentY, isDragging }` |
| `cardBgColor` | `string` | computada en renderYIPGrid | Resolved `--card-bg` CSS variable, usada para adaptive text color en celdas sin datos |
| `_activeLegendTab` | `string` | `'cell'` | Tab activo de la leyenda fija. `'cell'` muestra la escala de colores del parámetro actual; `'state'` muestra los 4 dots de condición (notes, mood, cold, allergies). Se cambia al hacer click en `.yip-tab-label` o `.yip-legend-dot` |
| `_yipTheme` | `string` | `'dark'` | Cache del tema activo (`state.theme`), establecido al inicio de `renderYIPGrid()`. Usado por `getColorForParam()` para devolver variantes de color adaptadas al modo claro. Se lee una vez por render (~365 accesos a state.theme evitados) |

### Constantes internas
| Constante | Valor | Contexto |
|-----------|-------|----------|
| `MOODS` | Array de 6 objetos `{ id, emoji, labelKey, color }` | saveDayMoods, renderYIPGrid, openYIPDetail, getColorForParam, renderLegend |
| `MOOD_EMOJI_MAP` | Mapa de `id → emoji` | renderYIPGrid (icono emoji en celda) |
| `DOT_COLORS` | Mapa `{ notes: '#60a5fa', mood: '#fbbf24', cold: '#ef4444', allergies: '#22c55e' }` | renderYIPGrid (dots — tamaño 7px con border 1.5px), renderStateTabContent |

### Nuevos parámetros
| Parámetro | Color sí | Color no |
|-----------|----------|----------|
| `cold` | `#eab308` (yellow) | `var(--grid-color)` |
| `allergies` | `#22c55e` (green) | `var(--grid-color)` |

## API Pública

### `export function initYearInPixels(): void`

**Descripción:** Inicializa el modal/bottom sheet responsive del Year in Pixels. Busca elementos DOM, registra event listeners para abrir desde `#year-in-pixels-btn`, cerrar desde `#close-yip-modal-btn`, click en backdrop y swipe-to-dismiss en drag handle (mobile). Borra ubicación desde `#yip-delete-loc-btn`, y abre selector de parámetro desde `#yip-param-display`.

**Comportamiento responsive:**
- **Desktop (≥768px)**: modal centrado con `transform: scale`, backdrop con fade. Cierre con botón × o click en backdrop.
- **Mobile (<768px)**: bottom sheet que ocupa ≥95dvh con `transform: translateY(100%)` → `.open` → `translateY(0)`. Cierre con drag handle (pointer events, >100px cierra), backdrop click, o botón ×.
- La visibilidad se controla mediante clase `.open` en `#yip-modal` y `#yip-modal-backdrop` (no `style.display`).

Al abrir, lista ubicaciones guardadas en IndexedDB como chips y carga datos de la primera/activa.

**Metadatos:**
- Mutates state: No (usa variables de módulo: `selectedLocation`, `_closeSheet`, `_yipScrollInit`, `_closeYipModal`)
- Async: No

### `export function renderYIPGrid(history: object|null, param: string): void`

**Descripción:** Renderiza el grid anual (12 meses × 31 días) en `#yip-grid-container`. Asigna color a cada celda según el valor del parámetro. Aplica color de texto adaptativo a `.yip-day-number` basado en la luminancia del fondo de celda: para celdas con datos usa el color asignado por `getColorForParam`; para celdas sin datos (past-no-data, future) usa `--card-bg` resuelto. El color de texto se calcula con `getTextColorForBg` (luminancia ponderada, retorna `#1a1a1a` si fondo claro, `#ffffff` si fondo oscuro). Muestra iconos de nota y mood si existen. Si no hay history, muestra mensaje "sin historial".

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

**Descripción:** Función unificada que lee el textarea de notas (`#yip-detail-notes-input`), los moods activos (`#yip-moods-selector .yip-mood-btn.active`), y las condiciones de salud (`#yip-cold-toggle.active`, `#yip-allergies-toggle.active`), persiste todo en una sola operación vía `storageService.updateDayData()` para evitar race conditions. Si éxito: actualiza `data` en memoria (incluye push a `cachedHistory.daily` si `data.time` no existe — caso past-no-data), re-renderiza el grid vía `renderYIPGrid(cachedHistory, selectedParam)`, aplica highlight flash (clase `.yip-highlight-flash` 1s) en la celda guardada con efecto combinado (box-shadow + scale + outline), muestra mini toast "✓ Guardado" en `#yip-saved-toast` con fade in/out (2s auto-dismiss), y cierra el detail sheet con un breve retardo (siguiente frame vía `requestAnimationFrame`). Si falla (ok=false o excepción): muestra error toast en `#yip-toast` con `t('config.yipSaveError')` y no cierra el sheet (permite reintentar).

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `data` | `object` | Objeto del día (`data.time` usado como key) |
| `locationName` | `string` | Nombre de la ubicación |

**Metadatos:**
- Mutates state: No (modifica DOM + objeto data en memoria + cierra sheet)
- Async: Sí (await storageService.updateDayData)

### `export function openYIPDetail(data: object, dateStr: string, locationName?: string): void`

**Descripción:** Abre detail sheet para un día específico. Resetea `scrollTop` del sheet a 0 para que el contenido siempre aparezca al inicio. Puebla fecha, descripción (temp max/min), métricas (precip, wind, AQI, polen), sección de notas (textarea), selector de moods (multi-select toggle), y sección de condiciones de salud (botones toggle "Cold" y "Allergies"). Enlaza botón "Guardar" → `saveDayDetail`, botón "Clear" → vacía notes textarea, desactiva todos los moods y toggles cold/allergies (sin cerrar sheet), y "Cancelar" → cierre inmediato del sheet. Usa `window.openBottomSheet` para mostrar `#yip-detail-sheet`. Clona botones para eliminar listeners previos. Guarda `_closeDetailSheet` del `openBottomSheet` para cierre programático.

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
2. **Apertura responsive**: Al hacer click en `#year-in-pixels-btn`, obtiene todas las keys de IndexedDB, renderiza chips de ubicación, y carga datos de la primera ubicación (o la seleccionada previamente). Luego añade clase `.open` a `#yip-modal` y `#yip-modal-backdrop`. En desktop (≥768px) el modal aparece centrado con scale animation; en mobile (<768px) el panel se desliza desde abajo como bottom sheet ≥95dvh.
3. **Drag-to-dismiss (mobile)**: `_initYipModalDrag()` registra pointer events en `#yip-modal-drag-handle`. Arrastre hacia abajo >100px cuando `scrollTop === 0` cierra el modal. Usa `pointerdown`/`pointermove`/`pointerup` con fallback touch. Misma lógica que `openBottomSheet()`.
4. **Scroll guard (mobile)**: Si `#yip-modal-scroll-content` tiene `scrollTop > 0`, no se inicia el arrastre — el contenido scrolla normalmente. Esto evita el "scroll vs swipe" conflict.
5. **Cierre unificado**: `closeYipModal()` quita clase `.open` de `#yip-modal` y `#yip-modal-backdrop`. Se llama desde: botón ×, backdrop click, drag-to-dismiss, y borrado de ubicación.
3. **Selección de ubicación**: Click en chip → selecciona ubicación, carga su history, re-renderiza grid
4. **Grid mensual**: 12 bloques `.yip-month-block`, cada uno con cabeceras de día (Monday-start), celdas `.yip-day-cell` con color según valor del parámetro, número de día visible, y **dot indicator system** para estados no meteorológicos
5. **Color por parámetro**: `getColorForParam` asigna colores según rangos definidos para cada tipo de parámetro (temp, precip, wind, AQI, pollen, mood, cold, allergies). En modo claro (`state.theme === 'light'`), los colores pastel problemáticos (`#93c5fd`, `#bfdbfe`, `#ccfbf1`, `#5eead4`, `#a3e635`) se sustituyen por variantes 1-2 tonos más oscuras/saturadas para mantener contraste suficiente sobre fondo claro. El cache `_yipTheme` (establecido en `renderYIPGrid`) evita leer `state.theme` 365+ veces por render.
6. **Celdas future**: días posteriores al actual tienen clase `future` (opacidad reducida), sin color ni click
7. **Click en celda**: abre detail sheet con métricas del día, notas editables, selector multi-mood, y toggles de condiciones de salud (cold/allergies)
8. **Selector de parámetro**: `populateParamSheet` renderiza bottom sheet con categorías agrupadas (temp, precip, wind, AQI, pollen, mood, health). Al seleccionar, actualiza `selectedParam`, re-renderiza grid y cierra sheet
9. **Borrar ubicación**: `#yip-delete-loc-btn` con confirmación → elimina key completa de IndexedDB
10. **Borrar datos de mes**: botón delete en cada mes → filtra daily/hourly del mes y persiste
11. **Paginación por dots (`updateYipScrollUI`)**: dots 1:1 con chips, dot activo = chip más visible cerca del centro, oculto si no hay overflow, actualizado en scroll/resize/MutationObserver
12. **Detail sheet — notas**: textarea editable. Sin botón individual — la nota se guarda junto con los moods y condiciones mediante el botón unificado
13. **Detail sheet — moods**: grid 2 columnas de botones tipo píldora con multi-select toggle. Sin botón individual — se guarda junto con nota y condiciones
14. **Detail sheet — condiciones de salud**: dos botones toggle "🤧 Cold" y "🌿 Allergies" en sección `#yip-detail-conditions-section`. Al hacer click, toggle clase `active`. Los botones se poblan desde `data.cold` y `data.allergies`. Sin botón individual — se guarda junto con nota y moods
15. **Detail sheet — guardar unificado**: botón "Guardar" clonado en `openYIPDetail` → llama `saveDayDetail`, que persiste nota + moods + conditions vía `storageService.updateDayData()`. Si éxito: actualiza `data` en memoria, añade `data` a `cachedHistory.daily` si no existe (past-no-data), re-renderiza el grid con `renderYIPGrid(cachedHistory, selectedParam)`, aplica highlight flash en la celda (clase `.yip-highlight-flash` durante 1s con efecto combinado de box-shadow + scale + outline usando `var(--accent-precip)`), muestra mini toast "✓ Guardado" en `#yip-saved-toast` con fade in/out (2s auto-dismiss), y cierra el sheet automáticamente (siguiente frame). Si falla: muestra toast de error en `#yip-toast` con `t('config.yipSaveError')` y no cierra el sheet (permite reintentar)
16. **Detail sheet — cancelar unificado**: botón "Cancelar" clonado en `openYIPDetail` → cierra el sheet inmediatamente sin persistir cambios (usa `_closeDetailSheet`)
17. **Detail sheet — Clear button**: botón "Clear" clonado en `openYIPDetail` → vacía `#yip-detail-notes-input.value`, desactiva todos los `.yip-mood-btn.active`, desactiva `.yip-cold-toggle.active` y `.yip-allergies-toggle.active`. No cierra el sheet. No persiste cambios automáticamente. Guardar tras Clear con todos los campos vacíos persiste `undefined` en todos los campos (equivale a borrar los datos del día)
18. **Highlight flash**: `saveDayDetail` exitoso → `highlightYIPCell(data.time)` busca `.yip-day-cell[data-time="${data.time}"]` en el DOM re-renderizado y aplica clase `.yip-highlight-flash` por 1s (animación CSS combinada: `@keyframes yip-highlight-flash` con box-shadow + `transform: scale(1.15)` + outline usando `var(--accent-precip)` como color). Intensidad variable: opacity 0.5 en modo claro, 0.3 en modo oscuro. La clase se remueve automáticamente al completar la animación
19. **Error toast**: `saveDayDetail` falla (ok=false o excepción) → `showErrorToast(t('config.yipSaveError'))` muestra `#yip-toast` con estilo destructivo (borde rojo), auto-dismiss tras 3s con fade out. El sheet permanece abierto para que el usuario reintente
20. **Confirmaciones**: `showConfirm` usa `window.openBottomSheet` para mostrar modal de confirmación, clonando botones OK/Cancel para eliminar listeners previos
18. **Dot indicator system**: Cada `.yip-day-cell` con estado no meteorológico (has-notes, has-mood, cold, allergies) muestra micro-dots (7px círculos con border 1.5px sólido) al fondo de la celda, debajo del day number. Colores fijos/semánticos: notes=#60a5fa (azul), mood=#fbbf24 (amarillo), cold=#ef4444 (rojo), allergies=#22c55e (verde). El border del dot es blanco (`#fff`) en modo oscuro y semitransparente (`rgba(0,0,0,0.25)`) en modo claro, para separar visualmente el dot del fondo de celda. Máximo 3 elementos visibles: si hay 1-3 estados se muestran dots únicamente (hasta 3); si hay 4+ estados se muestran 2 dots + badge "+N" (ej. "+2", "+3") con fondo semitransparente oscuro y texto blanco en negrita. Los dots reemplazan los iconos individuales antiguos (.yip-mood-icon, .yip-note-icon). Los dots son siempre visibles independientemente del parámetro activo
19. **Grid coloring por cold/allergies**: Cuando `selectedParam === 'cold'`, las celdas se colorean `#eab308` (yellow) si `data.cold === true`, o `var(--grid-color)` si no. Cuando `selectedParam === 'allergies'`, se colorean `#22c55e` (green) si `data.allergies === true`, o `var(--grid-color)` si no. La leyenda muestra 2 pasos: sí/no
20. **Popup de toggles en detail sheet**: `openYIPDetail` lee `data.cold` y `data.allergies`, aplica clase `active` a los botones correspondientes. `saveDayDetail` lee el estado de `#yip-cold-toggle.active` y `#yip-allergies-toggle.active`, construye objeto `conditions = { cold: boolean, allergies: boolean }`, y persiste vía `storageService.updateDayConditions`

21. **Legend footer fijo**: La leyenda se ha movido fuera de `#yip-modal-scroll-content` a un contenedor `.yip-legend-footer` fijo en la parte inferior del modal. No scrolla con la cuadrícula. Contiene `#yip-legend-content` (contenido dinámico) y `.yip-legend-tabs` (barra de tabs con dots de paginación).

22. **Dos tabs de leyenda**: `.yip-legend-tabs` contiene dos filas de dot + label: "Celda" (parámetro activo) y "Estado" (condiciones). El dot activo muestra ● con color accent y escala 1.4x (misma convención que `.yip-dot.active`). El dot inactivo muestra ○ en gris (`var(--grid-color)`). Click en el dot o el label cambia `_activeLegendTab` y re-renderiza `#yip-legend-content`.

23. **Tab "Celda"**: Muestra la misma escala de colores que `renderLegend()` actual, basada en `selectedParam`. Se actualiza reactivamente al cambiar de parámetro (porque `renderYIPGrid` llama a `renderLegendTabs`).

24. **Tab "Estado"**: Muestra 4 dots coloreados (7px círculos) con labels: Notes (azul #60a5fa), Mood (oro #fbbf24), Cold (rojo #ef4444), Allergies (verde #22c55e). Los dots usan el mismo estilo que `.yip-condition-dot` pero no tienen border (son standalone, no sobre fondo de celda).

25. **Sincronización de dots en tabs**: `renderLegendTabs` siempre actualiza la clase `.active` en los dots `.yip-legend-dot` basado en `_activeLegendTab`. El dot del tab activo recibe clase `active` (● accent, scale 1.4x). El dot del tab inactivo no tiene clase `active` (○ gris, escala normal).

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `#year-in-pixels-btn` no existe | `initYearInPixels` retorna sin error, no registra listeners |
| `#yip-modal` no existe | `initYearInPixels` retorna sin error |
| Mobile (<768px) con drag >100px | Cierra modal (closeYipModal) |
| Mobile con drag <100px | Sheet vuelve a posición inicial (translateY(0)) |
| Mobile con scrollTop >0 en scroll-content | Drag no se inicia, contenido scrolla normalmente |
| Resize de desktop a mobile con modal abierto | Comportamiento no cambia hasta cerrar/reabrir (no hay listener dinámico) |
| Backdrop click en desktop | backdrop onclick → closeYipModal() |
| Backdrop click en mobile | #yip-modal-backdrop.onclick → closeYipModal() |
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
| 4+ estados no meteorológicos activos | Solo primeros 2 dots + badge "+N" (ej. "+2" para 4 estados) |
| Dot en modo claro sobre fondo claro (ej. dot azul #60a5fa sobre celda #bfdbfe) | Border semitransparente `rgba(0,0,0,0.25)` separa visualmente el dot del fondo |
| Dot en modo oscuro sobre fondo oscuro | Border blanco `#fff` separa visualmente el dot del fondo |
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
| `saveDayDetail` con textarea vacío y sin moods | Persiste notes:undefined, moods:undefined (equivale a borrar datos previos) |
| `saveDayDetail` con `#yip-detail-save-btn` o `#yip-detail-cancel-btn` ausentes | openYIPDetail skip bindings, no lanza error |
| `saveDayDetail` exitoso sin `cachedHistory` | No lanza error, skip grid re-render |
| `saveDayDetail` ok=false | Muestra toast error, no cierra sheet |
| `saveDayDetail` con excepción | Captura error, muestra toast error, no cierra sheet |
| Clear button con datos existentes | Vacía form sin guardar, sheet permanece abierto |
| Clear button + Save (todos campos vacíos) | updateDayData con todos undefined (borra datos del día) |
| `highlightYIPCell` sin celda en DOM | No lanza error (querySelector retorna null) |
| `#yip-saved-toast` no existe en DOM | saveDayDetail no muestra mini toast, cierra sheet igualmente |
| `#yip-saved-toast` sin animación CSS definida | Aparece/desaparece sin fade (fallback funcional) |
| `yip-toast` no existe en DOM | showErrorToast retorna sin error |
| `data.time` como string o número | dataset.time se guarda como string (coerción automática) |
| `_closeDetailSheet` undefined al hacer cancel | No lanza error (if guardado) |
| Mini toast timer overlap (guardar múltiples veces rápido) | Timer previo se limpia, nuevo toast reemplaza |
| `saveDayDetail` con `data.time` no existente en `cachedHistory.daily` (past-no-data synthetic) | Se añade `data` a `cachedHistory.daily` tras `updateDayData` exitoso, re-render incluye la celda |
| `saveDayDetail` con `cachedHistory` null/undefined | No lanza error (skip re-render y push), close vía requestAnimationFrame |
| `window.openBottomSheet` no definido | Fallback: `_closeSheet = undefined` o `resolve(confirm(message))` |
| Celda completed con fondo claro (ej. `#fde047`, `#bfdbfe`) | day-number color = `#1a1a1a` (texto oscuro sobre fondo claro) |
| Celda completed con fondo oscuro (ej. `#1d4ed8`, `#dc2626`) | day-number color = `#ffffff` (texto claro sobre fondo oscuro) |
| Celda past-no-data en dark mode (--card-bg = `#313338`) | day-number color = `#ffffff` sobre fondo oscuro del card |
| Celda past-no-data en light mode (--card-bg = `#ffffff`) | day-number color = `#1a1a1a` sobre fondo claro del card |
| Celda future | day-number color basado en `--card-bg` (misma lógica que past-no-data) |
| Modo claro — celda con temp 10-15° (#93c5fd) | `getColorForParam` retorna `#60a5fa` (variante más oscura) |
| Modo claro — celda con precip <2mm (#bfdbfe) | `getColorForParam` retorna `#93c5fd` (variante más oscura) |
| Modo claro — celda con wind <10 km/h (#ccfbf1) | `getColorForParam` retorna `#5eead4` (variante más oscura) |
| Modo claro — celda con wind 10-20 km/h (#5eead4) | `getColorForParam` retorna `#14b8a6` (variante más oscura) |
| Modo claro — celda con pollen level 1 (#a3e635) | `getColorForParam` retorna `#65a30d` (variante más oscura/saturada) |
| Modo claro — dot badge sobre fondo claro | `background: rgba(0,0,0,0.2)`, `color: #1a1a1a` (CSS override) |
| `_yipTheme` no establecido (getColorForParam llamado fuera de renderYIPGrid) | Usa valor por defecto `'dark'`, se comporta como modo oscuro (seguro) |
| `#yip-legend-content` ausente | renderLegendTabs retorna sin error, no modifica DOM |
| `.yip-legend-dot` / `.yip-tab-label` ausentes | renderLegendTabs renderiza contenido pero no registra tabs (fallback funcional) |
| Click en tab activo | No hace nada (no cambia `_activeLegendTab`, no re-renderiza) |
| Cambio de parámetro con tab "Estado" activo | Tab "Estado" permanece activo, su contenido no cambia (es independiente del parámetro) |
| Cambio de parámetro con tab "Celda" activo | Tab "Celda" se re-renderiza con la nueva escala de colores |

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
26. **saveDayDetail con nota y moods**: llama updateDayData con todos los campos, muestra mini toast "✓ Guardado" en `#yip-saved-toast` con fade in/out (2s auto-dismiss), re-renderiza grid, aplica highlight flash 1s con efecto combinado, cierra sheet (requestAnimationFrame)
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
46. **renderYIPGrid dot system — 4+ estados**: primeros 2 dots + badge "+N" con clase `.yip-dot-badge` y texto `+2`, `+3`, etc.
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
59. **saveDayDetail re-renderiza grid tras éxito**: renderYIPGrid llamado después de updateDayData exitoso
60. **saveDayDetail highlight flash en celda**: celda con data.time correspondiente recibe clase yip-highlight-flash durante 1s con efecto combinado box-shadow + scale + outline usando var(--accent-precip)
61. **saveDayDetail con ok=false**: toast visible con mensaje de error, sheet no se cierra
62. **saveDayDetail con excepción**: toast visible con mensaje de error, sheet no se cierra
63. **Clear button vacía textarea**: notesInput.value = '' tras click
64. **Clear button desactiva moods**: todos .yip-mood-btn.active pierden clase active
65. **Clear button desactiva cold/allergies**: toggles pierden clase active
66. **Celda renderizada con data-time attribute**: .yip-day-cell tiene dataset.time igual al time del dayData
67. **saveDayDetail past-no-data (synthetic dayData)**: push data a cachedHistory.daily sí no existe tras update exitoso, re-render incluye celda
68. **saveDayDetail past-no-data highlight**: highlightYIPCell encuentra celda en DOM tras re-render porque cachedHistory ya contiene el día
69. **renderYIPGrid celda completed con fondo claro**: `.yip-day-number` color = `#1a1a1a` (getTextColorForBg retorna oscuro)
70. **renderYIPGrid celda completed con fondo oscuro**: `.yip-day-number` color = `#ffffff` (getTextColorForBg retorna claro)
71. **renderYIPGrid celda past-no-data/future**: `.yip-day-number` color basado en `--card-bg` resuelto

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-27 | Spec retro — mapeo completo del código actual (sin state/theme, con variables de módulo) | SDD |
| 2026-05-28 | Añadidas condiciones de salud (cold/allergies), dot indicator system, categoría Health en param sheet, toggles en detail sheet | SDD |
| 2026-05-28 | Fix alineación botones (box-sizing), cierre sheet inmediato (requestAnimationFrame), push past-no-data a cachedHistory tras save | SDD |
| 2026-05-28 | Drag handle fijo con scroll wrapper + scrollTop reset al abrir detail sheet | SDD |
| 2026-05-28 | Inmediato visual feedback en save: re-render grid, highlight flash, error toast, Clear button | SDD |
| 2026-05-28 | Ticket 001: Aumentar tamaño y contraste de números de día — font-size 8→11px, weight 500→700, color adaptativo por luminancia, eliminado text-shadow | SDD |
| 2026-05-28 | Ticket 002: Dots más visibles — tamaño 4px→7px, añadido border 1.5px sólido (#fff dark / rgba(0,0,0,0.25) light) | SDD |
| 2026-05-28 | Ticket 003: Badge +N en vez de elipsis para datos extra — reemplazado "…" por badge numérico con fondo semitransparente oscuro | SDD |
| 2026-05-28 | Ticket 003b: Badge +N muestra 2 dots + badge en vez de 3 dots + badge — máximo 3 elementos por celda | SDD |
| 2026-05-28 | Ticket 005: Convertir modal YIP en bottom sheet full-screen — responsive (desktop centered, mobile bottom sheet ≥95dvh), drag-to-dismiss, grid cell min-width 32→38px, gap 4→5px | SDD |
| 2026-05-30 | Ticket 004: Highlight más intenso (combinado box-shadow + scale + outline con `var(--accent-precip)`, 1s, light 0.5 / dark 0.3) + mini toast `#yip-saved-toast` en lugar de inline saved-msg | SDD |
| 2026-05-30 | Ticket 006: Soporte de modo claro en YIP — `getColorForParam()` con variantes light para colores pastel (#93c5fd, #bfdbfe, #ccfbf1, #5eead4, #a3e635), cache `_yipTheme` (establecido en renderYIPGrid, leído en getColorForParam), variable CSS `--yip-day-number-color` en `[data-theme="light"]`, override `.yip-dot-badge` en light mode | SDD |
| 2026-05-30 | Ticket 001: Leyenda fija con tabs Celda/Estado — HTML reestructurado, renderLegendTabs + renderStateTabContent, i18n, tests | SDD |

## Test scenarios (new — Ticket 001)

75. **renderYIPGrid renders legend inside fixed footer**: `#yip-legend-content` está fuera de `#yip-modal-scroll-content`, dentro de `.yip-legend-footer`
76. **Cell tab active by default**: `_activeLegendTab` === `'cell'` tras renderYIPGrid
77. **Cell tab shows parameter colors**: `#yip-legend-content` contiene steps de color para el parámetro actual
78. **State tab shows 4 condition dots**: al hacer click en tab "Estado", `#yip-legend-content` contiene 4 dots coloreados: notes (azul), mood (oro), cold (rojo), allergies (verde)
79. **State tab dot colors match DOT_COLORS**: cada dot tiene `background-color` igual al valor de `DOT_COLORS`
80. **Tab switch updates active dot**: dot del tab activo tiene clase `.active`, dot inactivo no
81. **Click on active tab is no-op**: `_activeLegendTab` no cambia al hacer click en tab ya activo
82. **Param change re-renders cell tab**: tras cambiar parámetro, tab "Celda" muestra nueva escala
83. **Param change does not affect state tab**: tab "Estado" mantiene su contenido tras cambio de parámetro
84. **Legend footer does not scroll with grid**: `.yip-legend-footer` está fuera de `#yip-modal-scroll-content`
