# Spec: `src/ui/YearInPixels.js`

## Purpose
Annual "Year in Pixels" visualization with monthly grid (12×31) of historical weather data, moods, and health conditions (cold/allergies), with day detail, notes, moods and conditions editing. Includes save highlight animation and mini confirmation toast.

## Dependencies

### DOM (expected HTML elements)
| Element | Access type | Context |
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

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../services/StorageService.js` | `storageService` | getHistory, updateDayNotes, updateDayMoods, init, db, historyStoreName |
| `../utils/i18n.js` | `t` | Text translation |
| `../services/AqiManager.js` | `getPollenLevelByType`, `getAggregatedPollenLevel` | Pollen levels |
| `../utils/color.js` | `getTextColorForBg` | Adaptive text color by background luminance |
| `../store.js` | `state` | Global state (reads `state.theme` for light mode color variants) |

### Internal functions (not exported)
| Function | Description |
|---------|-------------|
| `highlightYIPCell(time)` | Finds `.yip-day-cell[data-time="${time}"]` in the DOM, adds `.yip-highlight-flash` class for 1s (combined CSS animation: box-shadow + scale + outline with `var(--accent-precip)`, 1s). Light/dark mode: opacity 0.5 vs 0.3 |
| `renderLegendTabs(param)` | Renders legend content according to `_activeLegendTab` ('cell' or 'state') in `#yip-legend-content`. If tab='cell' delegates to `renderLegend()`; if 'state' delegates to `renderStateTabContent()`. Registers event listeners on `.yip-tab-label` and `.yip-legend-dot` (only if not already registered). Always syncs `.active` class on dots |
| `renderStateTabContent(container)` | Renders 4 condition dots (notes=blue, mood=gold, cold=red, allergies=green) with translated labels. Each dot is a 7px circle with `border-radius: 50%` and the color from `DOT_COLORS` |
| `showErrorToast(message)` | Shows `#yip-toast` with the message, auto-dismiss after 3s with fade out. Uses `_toastTimer` to avoid multiple timers |
| `closeYipModal()` | Closes YIP by removing `.open` class from `#yip-modal` and `#yip-modal-backdrop`. Also cancels ongoing drag if exists. Called from × button, backdrop click, drag-to-dismiss and location deletion |
| `_initYipModalDrag()` | Initializes pointer events on `#yip-modal-drag-handle` for swipe-to-dismiss. Only active on mobile (<768px). Drag can start from fixed header elements (`.yip-modal-drag-handle`, `.yip-modal-header`, `.yip-modal-fields-bar`) even when scrollable content is scrolled. Only touches inside `#yip-modal-scroll-content` respect the scroll guard (scrollTop > 0 blocks drag). Close threshold >100px |

### Module global variables (not `state`)
| Variable | Type | Initial | Usage |
|----------|------|---------|-----|
| `cachedHistory` | `object\|null` | `null` | Stores loaded history for re-render when changing param |
| `selectedLocation` | `string\|null` | `null` | Active location selected among chips |
| `selectedParam` | `string` | `'maxTemp'` | Active parameter (maxTemp, minTemp, precip, windMax, gustMax, aqi, pollen, pollen_*, mood, cold, allergies) |
| `_closeSheet` | `function\|undefined` | `undefined` | Callback to close param sheet |
| `_closeDetailSheet` | `function\|undefined` | `undefined` | Callback to close detail sheet |
| `_yipScrollInit` | `boolean` | `false` | Flag to initialize chip scrolling once |
| `_yipScrollListenersAttached` | `boolean` | `false` | Flag to avoid duplicating scroll listeners |
| `_closeYipModal` | `function\|null` | `null` | Callback to close YIP modal programmatically (set in initYearInPixels) |
| `_yipDragState` | `object\|null` | `null` | Internal drag-to-dismiss state: `{ startY, currentY, isDragging }` |
| `cardBgColor` | `string` | computed in renderYIPGrid | Resolved `--card-bg` CSS variable, used for adaptive text color in cells without data |
| `_activeLegendTab` | `string` | `'cell'` | Active legend tab. `'cell'` shows the color scale of the current parameter; `'state'` shows the 4 condition dots (notes, mood, cold, allergies). Changed by clicking `.yip-tab-label` or `.yip-legend-dot` |
| `_yipTheme` | `string` | `'dark'` | Cache of active theme (`state.theme`), set at the start of `renderYIPGrid()`. Used by `getColorForParam()` to return light-mode adapted color variants. Read once per render (~365 state.theme accesses avoided) |

### Internal constants
| Constant | Value | Context |
|-----------|-------|----------|
| `MOODS` | Array of 6 objects `{ id, emoji, labelKey, color }` | saveDayMoods, renderYIPGrid, openYIPDetail, getColorForParam, renderLegend |
| `MOOD_EMOJI_MAP` | Map of `id → emoji` | renderYIPGrid (emoji icon in cell) |
| `DOT_COLORS` | Map `{ notes: '"'"'#60a5fa'"'"', mood: '"'"'#fbbf24'"'"', cold: '"'"'#ef4444'"'"', allergies: '"'"'#22c55e'"'"' }` | renderYIPGrid (dots — size 7px with border 1.5px), renderStateTabContent |

### New parameters
| Parameter | Color yes | Color no |
|-----------|----------|----------|
| `cold` | `#eab308` (yellow) | `var(--grid-color)` |
| `allergies` | `#22c55e` (green) | `var(--grid-color)` |

## Public API

### `export function initYearInPixels(): void`

**Description:** Initializes the responsive Year in Pixels modal/bottom sheet. Looks up DOM elements, registers event listeners to open from `#year-in-pixels-btn`, close from `#close-yip-modal-btn`, backdrop click and swipe-to-dismiss on drag handle (mobile). Deletes location from `#yip-delete-loc-btn`, and opens parameter selector from `#yip-param-display`.

**Responsive behavior:**
- **Desktop (≥768px)**: centered modal with `transform: scale`, backdrop with fade. Close with × button or backdrop click.
- **Mobile (<768px)**: bottom sheet occupying ≥95dvh with `transform: translateY(100%)` → `.open` → `translateY(0)`. Close with drag handle (pointer events, >100px closes), backdrop click, or × button.
- Visibility is controlled via `.open` class on `#yip-modal` and `#yip-modal-backdrop` (not `style.display`).

On open, lists saved locations from IndexedDB as chips and loads data from the first/active one.

**Metadata:**
- Mutates state: No (uses module variables: `selectedLocation`, `_closeSheet`, `_yipScrollInit`, `_closeYipModal`)
- Async: No

### `export function renderYIPGrid(history: object|null, param: string): void`

**Description:** Renders the annual grid (12 months × 31 days) in `#yip-grid-container`. Assigns color to each cell according to parameter value. Applies adaptive text color to `.yip-day-number` based on cell background luminance: for cells with data uses the color assigned by `getColorForParam`; for cells without data (past-no-data, future) uses resolved `--card-bg`. Text color is calculated with `getTextColorForBg` (weighted luminance, returns `#1a1a1a` if light background, `#ffffff` if dark background). Shows note and mood icons if they exist. If no history, shows "no history" message.

| Parameter | Type | Description |
|-----------|------|-------------|
| `history` | `object\|null` | Object with `daily[]` array of historical data |
| `param` | `string` | Parameter identifier to visualize |

**Metadata:**
- Mutates state: No (modifies DOM directly)
- Async: No

### `export function saveDayNote(data: object, locationName: string): Promise<void>`

**Description:** Reads `#yip-detail-notes-input`, calls `storageService.updateDayNotes(locationName, data.time, value)`. On success, updates `data.notes` and shows "saved" message.

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `object` | Day object (`data.time` used as key) |
| `locationName` | `string` | Location name |

**Metadata:**
- Mutates state: No (modifies DOM + data object in memory)
- Async: Yes (await storageService.updateDayNotes)

### `export function saveDayMoods(data: object, locationName: string): Promise<void>`

**Description:** Reads active moods from DOM (`#yip-moods-selector .yip-mood-btn.active`), builds mood ids array, calls `storageService.updateDayMoods(loc, data.time, selectedMoods)`. On success, updates `data.moods` and shows message.

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `object` | Day object |
| `locationName` | `string` | Location name |

**Metadata:**
- Mutates state: No (modifies DOM + data object in memory)
- Async: Yes (await storageService.updateDayMoods)

### `export function saveDayDetail(data: object, locationName: string): Promise<void>`

**Description:** Unified function that reads the notes textarea (`#yip-detail-notes-input`), active moods (`#yip-moods-selector .yip-mood-btn.active`), and health conditions (`#yip-cold-toggle.active`, `#yip-allergies-toggle.active`), persists everything in a single operation via `storageService.updateDayData()` to avoid race conditions. On success: updates `data` in memory (includes push to `cachedHistory.daily` if `data.time` does not exist — past-no-data case), re-renders grid via `renderYIPGrid(cachedHistory, selectedParam)`, applies highlight flash (`.yip-highlight-flash` class 1s) on the saved cell with combined effect (box-shadow + scale + outline), shows mini toast "✓ Saved" in `#yip-saved-toast` with fade in/out (2s auto-dismiss), and closes the detail sheet with a brief delay (next frame via `requestAnimationFrame`). If fails (ok=false or exception): shows error toast in `#yip-toast` with `t('"'"'config.yipSaveError'"'"')` and does not close the sheet (allows retry).

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `object` | Day object (`data.time` used as key) |
| `locationName` | `string` | Location name |

**Metadata:**
- Mutates state: No (modifies DOM + data object in memory + closes sheet)
- Async: Yes (await storageService.updateDayData)

### `export function openYIPDetail(data: object, dateStr: string, locationName?: string): void`

**Description:** Opens detail sheet for a specific day. Resets sheet `scrollTop` to 0 so content always appears at the top. Populates date, description (temp max/min), metrics (precip, wind, AQI, pollen), notes section (textarea), mood selector (multi-select toggle), and health conditions section ("Cold" and "Allergies" toggle buttons). Binds "Save" button → `saveDayDetail`, "Clear" button → empties notes textarea, deactivates all moods and cold/allergies toggles (without closing sheet), and "Cancel" → immediate sheet close. Uses `window.openBottomSheet` to show `#yip-detail-sheet`. Clones buttons to remove previous listeners. Stores `_closeDetailSheet` from `openBottomSheet` for programmatic close.

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `object` | Day object with tempMax, tempMin, precipTotal, windMax, gustMax, aqi, pollenDetails, notes, moods |
| `dateStr` | `string` | Formatted date (e.g. "15 January 2026") |
| `locationName?` | `string` | Optional. Defaults to `selectedLocation` |

**Metadata:**
- Mutates state: No (modifies DOM, calls window.openBottomSheet)
- Async: No
- Scroll: Resets `scrollTop = 0` on `#yip-detail-sheet` at start

### `export function updateYipScrollUI(): void`

**Description:** Updates `#yip-location-dots` with pagination dots 1:1 with location chips. The active dot corresponds to the chip closest to the center of the container viewport. Only shows dots if there is overflow (scrollWidth > clientWidth).

**Metadata:**
- Mutates state: No (modifies DOM)
- Async: No

## Behavior

1. **Initialization**: initYearInPixels is idempotent — if #year-in-pixels-btn does not exist, returns without error
2. **Responsive opening**: On click of #year-in-pixels-btn, gets all IndexedDB keys, renders location chips, and loads data from the first location (or previously selected). Then adds .open class to #yip-modal and #yip-modal-backdrop. On desktop (≥768px) the modal appears centered with scale animation; on mobile (<768px) the panel slides up from below as a ≥95dvh bottom sheet.
3. **Drag-to-dismiss (mobile)**: _initYipModalDrag() registers pointer events on #yip-modal-drag-handle. Drag down >100px closes the modal. Uses pointerdown/pointermove/pointerup with touch fallback. Same logic as openBottomSheet(). Drag can start from fixed header elements (.yip-modal-drag-handle, .yip-modal-header, .yip-modal-fields-bar) even when scrollable content is scrolled.
4. **Scroll guard (mobile)**: Inside #yip-modal-scroll-content, if scrollTop > 0 the drag is not initiated — content scrolls normally. This avoids the "scroll vs swipe" conflict. Fixed header elements (.yip-modal-drag-handle, .yip-modal-header, .yip-modal-fields-bar) have 	ouch-action: none in CSS and can initiate drag regardless of scroll.
5. **Unified close**: closeYipModal() removes .open class from #yip-modal and #yip-modal-backdrop. Called from: × button, backdrop click, drag-to-dismiss, and location deletion.
6. **Location selection**: Click on chip → selects location, loads its history, re-renders grid
7. **Monthly grid**: 12 blocks .yip-month-block, each with day headers (Monday-start), cells .yip-day-cell with color according to parameter value, visible day number, and **dot indicator system** for non-weather states
8. **Color by parameter**: getColorForParam assigns colors according to ranges defined for each parameter type (temp, precip, wind, AQI, pollen, mood, cold, allergies). In light mode (state.theme === 'light'), problematic pastel colors are replaced with 1-2 tone darker/saturated variants to maintain sufficient contrast on light background. The _yipTheme cache (set in enderYIPGrid) avoids reading state.theme 365+ times per render.
9. **Future cells**: days after the current day have uture class (reduced opacity), no color or click
10. **Cell click**: opens detail sheet with day metrics, editable notes, multi-mood selector, and health condition toggles (cold/allergies)
11. **Parameter selector**: populateParamSheet renders bottom sheet with grouped categories (temp, precip, wind, AQI, pollen, mood, health). On selection, updates selectedParam, re-renders grid and closes sheet
12. **Delete location**: #yip-delete-loc-btn with confirmation → removes entire key from IndexedDB
13. **Delete month data**: delete button on each month → filters month daily/hourly and persists
14. **Dot pagination (updateYipScrollUI)**: dots 1:1 with chips, active dot = most visible chip near center, hidden if no overflow, updated on scroll/resize/MutationObserver
15. **Detail sheet — notes**: editable textarea. No individual button — the note is saved together with moods and conditions via the unified button
16. **Detail sheet — moods**: 2-column grid of pill-type buttons with multi-select toggle. No individual button — saved together with note and conditions
17. **Detail sheet — health conditions**: two toggle buttons with emoji in #yip-detail-conditions-section. On click, toggle ctive class. Buttons populated from data.cold and data.allergies. No individual button — saved together with note and moods
18. **Detail sheet — unified save**: Cloned "Save" button in openYIPDetail → calls saveDayDetail, which persists note + moods + conditions via storageService.updateDayData(). On success: updates data in memory, adds data to cachedHistory.daily if not present (past-no-data), re-renders grid with enderYIPGrid(cachedHistory, selectedParam), applies highlight flash on cell (.yip-highlight-flash class for 1s with combined box-shadow + scale + outline effect using ar(--accent-precip)), shows mini toast in #yip-saved-toast with fade in/out (2s auto-dismiss), and closes sheet automatically (next frame). If fails: shows error toast in #yip-toast and does not close sheet (allows retry)
19. **Detail sheet — unified cancel**: Cloned "Cancel" button in openYIPDetail → immediately closes sheet without persisting changes (uses _closeDetailSheet)
20. **Detail sheet — Clear button**: Cloned "Clear" button in openYIPDetail → empties #yip-detail-notes-input.value, deactivates all .yip-mood-btn.active, deactivates .yip-cold-toggle.active and .yip-allergies-toggle.active. Does not close sheet. Does not auto-persist. Save after Clear with all fields empty persists undefined in all fields (equivalent to deleting the day data)
21. **Highlight flash**: Successful saveDayDetail → highlightYIPCell(data.time) looks for cell in the re-rendered DOM and applies .yip-highlight-flash class for 1s (combined CSS animation with box-shadow + scale + outline). Variable intensity: opacity 0.5 in light mode, 0.3 in dark mode. The class is automatically removed when the animation completes
22. **Error toast**: saveDayDetail fails (ok=false or exception) → shows #yip-toast with destructive style, auto-dismiss after 3s with fade out. Sheet remains open for user to retry
23. **Confirmations**: showConfirm uses window.openBottomSheet to show confirmation modal, cloning OK/Cancel buttons to remove previous listeners
24. **Dot indicator system**: Each .yip-day-cell with non-weather state shows micro-dots (7px circles with 1.5px solid border) at the bottom of the cell, below the day number. Fixed/semantic colors: notes=blue, mood=yellow, cold=red, allergies=green. Dot border is white in dark mode and semi-transparent in light mode. Maximum 3 visible elements: if 1-3 states dots only; if 4+ states, 2 dots + badge. Dots replace old individual icons. Always visible regardless of active parameter
25. **Grid coloring for cold/allergies**: When selectedParam === 'cold', cells colored yellow if data.cold === true, or default color if not. When selectedParam === 'allergies', cells colored green if data.allergies === true, or default color if not. Legend shows 2 steps: yes/no
26. **Toggle popup in detail sheet**: openYIPDetail reads data.cold and data.allergies, applies ctive class to corresponding buttons. saveDayDetail reads toggle states and persists conditions
27. **Fixed legend footer**: The legend has been moved outside #yip-modal-scroll-content to a .yip-legend-footer container fixed at the bottom of the modal. Does not scroll with the grid. Contains dynamic content and tab bar.
28. **Two legend tabs**: .yip-legend-tabs contains two rows: "Cell" (active parameter) and "State" (conditions). Active dot shows with accent color and 1.4x scale. Inactive dot shows in gray.
29. **"Cell" tab**: Shows the same color scale as enderLegend(), based on selectedParam.
30. **"State" tab**: Shows 4 colored dots with labels: Notes (blue), Mood (gold), Cold (red), Allergies (green).
31. **Dot synchronization in tabs**: enderLegendTabs always updates the .active class on dots based on _activeLegendTab.

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| #year-in-pixels-btn does not exist | initYearInPixels returns without error, no listeners |
| #yip-modal does not exist | initYearInPixels returns without error |
| Mobile (<768px) with drag >100px | Closes modal (closeYipModal) |
| Mobile with drag <100px | Sheet returns to initial position |
| Mobile with scrollTop >0 in scroll-content | Drag not initiated from scrollContent, content scrolls. Header elements drag works |
| Backdrop click | Closes modal via onclick |
| history is 
ull or empty | Shows "No history to display" message |
| history.daily has data from previous year | Filtered (only current year rendered) |
| Invalid parameter in getColorForParam | Returns ar(--grid-color) |
| 
ull/undefined value in getColorForParam | Evaluated in conditionals (treated as 0 or falsy) |
| param === 'mood' without moods | Gray cell |
| data.notes undefined/null | Empty textarea, no blue dot |
| data.moods undefined/null | No yellow dot |
| data.cold undefined/null | Cold toggle without active, no red dot |
| data.allergies undefined/null | Allergies toggle without active, no green dot |
| 4+ non-weather states active | 2 dots + badge |
| Dot in light mode on light background | Semi-transparent border separates dot from background |
| Dot in dark mode on dark background | White border separates dot from background |
| 0 non-weather states | No dots, no yip-dot-container |
| saveDayNote with empty text | storageService.updateDayNotes called with empty string |
| saveDayMoods without moods | Empty array persisted (removes moods key) |
| openYIPDetail with null data | Returns without doing anything |
| Drag handle with short/long content | Works correctly, handle fixed at top |
| param === 'cold' with cold=true | Yellow cell |
| param === 'cold' without cold | Gray cell |
| param === 'allergies' with allergies=true | Green cell |
| param === 'allergies' without allergies | Gray cell |
| populateParamSheet without sheet DOM | Returns without doing anything |
| updateYipScrollUI without chips/dots | Returns without doing anything |
| showConfirm cancelled | Resolves false, no destructive action |
| saveDayDetail with empty fields | Persists all undefined (deletes day data) |
| saveDayDetail ok=false | Shows error toast, sheet stays open |
| saveDayDetail with exception | Catches error, shows toast, sheet stays open |
| Clear button with existing data | Empties form without saving |
| highlightYIPCell without cell in DOM | Does not throw |
| Save/cancel clicked multiple times | Node cloning prevents duplicate listeners |
| Light mode cell with light background | Dark text for contrast |
| Light mode cell with dark background | Light text for contrast |
| Past-no-data cell | Day-number color based on card background |
| Future cell | Day-number color based on card background |
| _yipTheme not set | Uses default dark mode (safe) |
| Click on active tab | No-op |
| Param change with "State" tab active | State tab stays, content unchanged |
| Param change with "Cell" tab active | Cell tab re-renders with new scale |

## Test Scenarios

1. **initYearInPixels without DOM elements**: Does not throw
2. **initYearInPixels with DOM elements**: Registers listeners without error
3. **Exports all functions**: All expected functions are exported
4. **renderYIPGrid with null history**: Shows "No history" message
5. **renderYIPGrid with empty data**: Shows "No history" message
6. **renderYIPGrid with current year data**: Grid has 12 month-blocks with colored cells
7. **renderYIPGrid cell with notes**: Cell has notes class and icon
8. **renderYIPGrid cell without notes**: No notes class or icon
9. **renderYIPGrid cell with moods**: Cell has mood class and emoji
10. **renderYIPGrid cell without moods**: No mood class or emoji
11. **renderYIPGrid param='mood' with moods**: Colored with first mood color
12. **renderYIPGrid param='mood' without moods**: Gray cell
13. **renderYIPGrid future cell**: Future class, no color, no onclick
14. **renderYIPGrid cell with data**: Has onclick that opens detail
15. **getColorForParam with invalid param**: Returns default color
16. **openYIPDetail with null data**: Returns without error
17. **openYIPDetail resets scrollTop to 0**: Sheet opens with scrollTop=0
18. **saveDayDetail with note and moods**: Persists via updateDayData, shows toast, re-renders, applies flash, closes sheet
19. **saveDayDetail with ok=false**: Error toast visible, sheet not closed
20. **saveDayDetail with exception**: Error toast visible, sheet not closed
21. **Clear button empties form**: Textarea cleared, moods/conditions deactivated
22. **Celda renderizada con data-time**: Cell has dataset.time attribute
23. **renderYIPGrid dot system**: Correct dots shown based on states
24. **Legend footer does not scroll with grid**: Footer outside scroll content
25. **Tab switch updates active dot**: Active tab dot has active class

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-27 | Spec retro — complete mapping of current code (without state/theme, with module variables) | SDD |
| 2026-05-28 | Added health conditions (cold/allergies), dot indicator system, Health category in param sheet, toggles in detail sheet | SDD |
| 2026-05-28 | Fix button alignment (box-sizing), immediate sheet close (requestAnimationFrame), push past-no-data to cachedHistory after save | SDD |
| 2026-05-28 | Fixed drag handle with scroll wrapper + scrollTop reset on detail sheet open | SDD |
| 2026-05-28 | Immediate visual feedback on save: re-render grid, highlight flash, error toast, Clear button | SDD |
| 2026-05-28 | Ticket 001: Increase day number size and contrast | SDD |
| 2026-05-28 | Ticket 002: More visible dots | SDD |
| 2026-05-28 | Ticket 003: +N badge instead of ellipsis for extra data | SDD |
| 2026-05-28 | Ticket 003b: +N badge shows 2 dots + badge instead of 3 | SDD |
| 2026-05-28 | Ticket 005: Convert YIP modal to full-screen bottom sheet | SDD |
| 2026-05-30 | Ticket 004: More intense highlight + mini toast | SDD |
| 2026-05-30 | Ticket 006: Light mode support in YIP | SDD |
| 2026-05-30 | Ticket 001: Fixed legend with Cell/State tabs | SDD |
| 2026-05-31 | Fix: Drag-to-dismiss from header elements works even with scrolled content | SDD |

## Test scenarios (new — Ticket 001)

75. **renderYIPGrid renders legend inside fixed footer**: Legend outside scroll content
76. **Cell tab active by default**: _activeLegendTab === 'cell' after render
77. **Cell tab shows parameter colors**: Legend contains parameter color steps
78. **State tab shows 4 condition dots**: State tab shows colored dots
79. **State tab dot colors match DOT_COLORS**: Each dot has correct color
80. **Tab switch updates active dot**: Active dot has class, inactive does not
81. **Click on active tab is no-op**: No change on already active tab
82. **Param change re-renders cell tab**: Cell tab updates with new scale
83. **Param change does not affect state tab**: State tab content unchanged
84. **Legend footer does not scroll with grid**: Footer is outside scroll content
