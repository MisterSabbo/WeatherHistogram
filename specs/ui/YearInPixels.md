# Spec: `src/ui/YearInPixels.js`

## Purpose
Annual "Year in Pixels" visualization with monthly grid (12×31) of historical weather data, moods, and health conditions (cold/allergies), with day detail, notes, moods and conditions editing. Includes save highlight animation, mini confirmation toast, and two-tab legend (Cell/State).

## Dependencies

### state
| Property | Access (R/W) | Context |
|-----------|-------------|----------|
| `state.theme` | read | light mode color variants in getColorForParam |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../services/StorageService.js` | `storageService` | getHistory, updateDayNotes, updateDayMoods, updateDayData, init, db, historyStoreName |
| `../utils/i18n.js` | `t` | translations |
| `../services/AqiManager.js` | `getPollenLevelByType`, `getAggregatedPollenLevel` | pollen levels |
| `../utils/color.js` | `getTextColorForBg` | adaptive text color by background luminance |
| `../store.js` | `state` | theme |

### DOM elements
| Element | Access type | Context |
|----------|---------------|----------|
| `#year-in-pixels-btn` | getElementById + click | initYearInPixels |
| `#yip-modal` | getElementById + classList `.open` | initYearInPixels, closeYipModal |
| `#yip-modal-backdrop` | getElementById + classList `.open` | initYearInPixels, closeYipModal |
| `#yip-modal-scroll-content` | getElementById | scroll guard for drag, scrollTop reset |
| `#close-yip-modal-btn` | getElementById + click | initYearInPixels |
| `#yip-location-chips` | getElementById + innerHTML | initYearInPixels, initYipLocationScroll |
| `#yip-param-display` | getElementById + click + textContent | initYearInPixels, populateParamSheet |
| `#yip-delete-loc-btn` | getElementById + click | initYearInPixels |
| `#yip-grid-container` | getElementById | renderYIPGrid |
| `#yip-param-options-container` | getElementById | populateParamSheet |
| `#yip-detail-date` | getElementById textContent | openYIPDetail |
| `#yip-detail-desc` | getElementById textContent | openYIPDetail |
| `#yip-detail-metrics` | getElementById innerHTML | openYIPDetail |
| `#yip-detail-notes-section` | getElementById style.display | openYIPDetail |
| `#yip-detail-notes-input` | getElementById value/placeholder | openYIPDetail, saveDayDetail |
| `#yip-detail-save-btn` | getElementById clone + onclick | openYIPDetail |
| `#yip-detail-clear-btn` | getElementById clone + onclick | openYIPDetail |
| `#yip-detail-cancel-btn` | getElementById clone + onclick | openYIPDetail |
| `#yip-detail-saved-msg` | getElementById style.display | openYIPDetail |
| `#yip-detail-saved-toast` | getElementById textContent + classList | saveDayDetail |
| `#yip-toast` | getElementById textContent + classList + style.display | showErrorToast |
| `#yip-detail-moods-section` | getElementById style.display | openYIPDetail |
| `#yip-moods-selector` | getElementById innerHTML, querySelectorAll .active | openYIPDetail, saveDayMoods, saveDayDetail |
| `#yip-detail-conditions-section` | getElementById style.display | openYIPDetail |
| `#yip-cold-toggle` | getElementById classList | openYIPDetail, saveDayDetail |
| `#yip-allergies-toggle` | getElementById classList | openYIPDetail, saveDayDetail |
| `#yip-detail-sheet` | getElementById | openYIPDetail |
| `#yip-detail-sheet-scroll-content` | getElementById scrollTop reset | openYIPDetail |
| `#yip-sheet-backdrop` | getElementById | openYIPDetail |
| `#yip-location-dots` | getElementById innerHTML | updateYipScrollUI |
| `#yip-legend-content` | getElementById innerHTML | renderLegendTabs |
| `#confirm-title` | getElementById textContent | showConfirm |
| `#confirm-message` | getElementById textContent | showConfirm |
| `#confirm-cancel-btn` | getElementById clone + onclick | showConfirm |
| `#confirm-ok-btn` | getElementById clone + onclick | showConfirm |
| `#confirm-modal` | openBottomSheet | showConfirm |
| `#confirm-sheet-backdrop` | openBottomSheet | showConfirm |

## Module global variables

| Variable | Type | Initial | Context |
|----------|------|---------|---------|
| `selectedLocation` | `string \| null` | `null` | Active location among chips |
| `selectedParam` | `string` | `'maxTemp'` | Active visualization parameter |
| `_closeSheet` | `Function \| undefined` | `undefined` | Callback to close param sheet |
| `_closeDetailSheet` | `Function \| undefined` | `undefined` | Callback to close detail sheet |
| `_closeYipModal` | `Function \| null` | `null` | Callback to close YIP modal (set in initYearInPixels) |
| `_yipDragState` | `object \| null` | `null` | Internal drag state `{ startY, currentY, isDragging }` |
| `_yipScrollInit` | `boolean` | `false` | Flag to initialize chip scrolling once |
| `_yipScrollListenersAttached` | `boolean` | `false` | Flag to avoid duplicating scroll listeners |
| `_yipTheme` | `string` | `'dark'` | Cache of `state.theme` set at renderYIPGrid start |
| `_activeLegendTab` | `string` | `'cell'` | Active legend tab: 'cell' or 'state' |
| `_legendTabListenersAttached` | `boolean` | `false` | Flag to avoid duplicating tab listeners |
| `cachedHistory` | `object \| null` | `null` | Loaded history cache for re-render on param change |
| `_toastTimer` | `number \| null` | `null` | Error toast auto-dismiss timer |

## Constants

| Constant | Value | Context |
|----------|-------|---------|
| `MOODS` | `[{ id, emoji, labelKey, color }, ...]` (6 moods) | saveDayMoods, renderYIPGrid, openYIPDetail, getColorForParam, renderLegend |
| `DOT_COLORS` | `{ notes: '#60a5fa', mood: '#fbbf24', cold: '#ef4444', allergies: '#22c55e' }` | renderYIPGrid (dots), renderStateTabContent |
| `SKIN_TYPES` | `['I', 'II', 'III', 'IV', 'V', 'VI']` | (from SpfModal, not here) |
| `SKIN_BASE_MINS` | `[67, 100, 200, 300, 400, 600]` | (from SpfModal, not here) |

## Public API — Exported

### `export function initYearInPixels(): void`

**Description:** Initializes the Year in Pixels — looks up DOM elements, registers event listeners for open/close, location selection, parameter selector, and location deletion. On open: lists all IndexedDB keys as location chips, loads data for first or previously selected location.

**Metadata:**
- Mutates state: No (uses module variables)
- Async: No

### `export function renderYIPGrid(history, param): void`

**Description:** Renders the 12×31 grid. Each cell is colored by parameter value via `getColorForParam()`. Shows dot indicators for non-weather states. Renders legend with cell/state tabs. Future cells get `.future` class, past-no-data cells get `.past-no-data` class.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `history` | `object \| null` | Object with `daily[]` |
| `param` | `string` | Parameter identifier |

**Metadata:**
- Mutates state: No (modifies DOM)
- Async: No

### `export function saveDayNote(data, locationName): Promise<void>`

**Description:** Saves note text to storage via `storageService.updateDayNotes()`.

### `export function saveDayMoods(data, locationName): Promise<void>`

**Description:** Saves selected moods to storage via `storageService.updateDayMoods()`.

### `export function saveDayDetail(data, locationName): Promise<void>`

**Description:** Unified save — reads notes textarea, active moods, cold/allergies toggles. Persists via `storageService.updateDayData()`. On success: updates cachedHistory, re-renders grid, applies highlight flash on saved cell, shows "✓ Saved" mini toast, closes detail sheet. On failure: shows error toast, sheet stays open.

### `export function openYIPDetail(data, dateStr, locationName?): void`

**Description:** Opens detail bottom sheet for a day. Resets scrollTop on `#yip-detail-sheet-scroll-content`. Populates date, weather description, metrics (precip, wind, AQI, pollen species breakdown), notes textarea, mood multi-select, cold/allergies toggles. Clones Save/Clear/Cancel buttons to remove previous listeners.

### `export function updateYipScrollUI(): void`

**Description:** Updates `#yip-location-dots` pagination — active dot corresponds to chip nearest the center of the visible area. Only shown when overflow exists.

### `export function closeYipModal(): void`

**Description:** Closes YIP — removes `.open` class from modal and backdrop, resets drag state.

## Internal functions

### `function canDragFrom(target): boolean`
Checks if a touch/pointer event target is a valid drag origin: `.yip-modal-drag-handle`, `.yip-modal-header` (not buttons), `.yip-modal-fields-bar` (not interactive elements).

### `function _initYipModalDrag(): void`
Registers pointer events on `#yip-modal` and touch events on `#yip-modal-scroll-content` for swipe-to-dismiss. Drag >100px closes modal. Scroll guard: if `scrollContent.scrollTop > 0`, drag is not initiated from scroll content.

### `function loadLocationData(locationName): Promise<void>`
Loads history from storageService and calls `renderYIPGrid()`. Updates `cachedHistory`.

### `function populateParamSheet(): void`
Renders parameter selector bottom sheet with grouped categories (temp, precip, wind, AQI, pollen, mood, health). On selection, updates `selectedParam`, re-renders grid, closes sheet.

### `function getColorForParam(param, value): string`
Color mapping for all parameters with range-based colors. Light mode adapts specific pastel colors.

### `function renderLegend(param, container): void`
Renders color scale legend for the active parameter.

### `function renderLegendTabs(param): void`
Renders legend content in `#yip-legend-content` according to `_activeLegendTab`. Handles tab switching via event delegation on `.yip-legend-tabs`.

### `function renderStateTabContent(container): void`
Renders 4 condition dots with labels (notes, mood, cold, allergies).

### `function highlightYIPCell(time): void`
Finds `.yip-day-cell[data-time]` in DOM and applies `.yip-highlight-flash` class for 1 second.

### `function showErrorToast(message): void`
Shows `#yip-toast` with error message, auto-dismiss after 3s.

### `function showConfirm(title, message): Promise<boolean>`
Shows confirmation modal using `openBottomSheet` with OK/Cancel. Clones buttons to avoid duplicate listeners. Resolves `true` on OK, `false` on Cancel.

## Behavior

1. **Initialization (idempotent):** If `#year-in-pixels-btn` missing, returns without error.
2. **Responsive modal:** `.open` class controls visibility (not `style.display`). Desktop centered, mobile as bottom sheet.
3. **Drag-to-dismiss:** `_initYipModalDrag` — drag from handle/header/fields bar >100px closes.
4. **Scroll guard:** From `#yip-modal-scroll-content`, drag only if `scrollTop === 0`.
5. **Location chips:** Click to switch location, dots pagination via `updateYipScrollUI`.
6. **Grid rendering:** 12 month blocks, each with day-of-week headers (Monday-start), 31 day cells colored by parameter.
7. **Parameter selector:** Grouped categories, current param marked with check icon.
8. **Delete location:** With confirmation dialog.
9. **Delete month:** Per-month delete button with confirmation.
10. **Dot indicator system:** Up to 3 visible dots on cells (notes/mood/cold/allergies), +N badge for extras.
11. **Detail sheet:** Resets scrollTop, populates weather + editable fields.
12. **Unified save:** Note + moods + conditions persisted together.
13. **Save feedback:** Highlight flash + mini toast + auto-close.
14. **Error toast:** Sheet stays open for retry.
15. **Clear button:** Empties all fields without saving.
16. **Legend tabs:** "Cell" (parameter colors) / "State" (condition dots).
17. **Confirmations:** Cloned buttons prevent listener accumulation.

## Edge Cases

| Input | Expected behavior |
|-------|-------------------|
| `#year-in-pixels-btn` does not exist | Returns without error |
| History is null or empty | Shows "no history" message |
| history.daily has data from previous year | Filtered (current year only) |
| Invalid param in getColorForParam | Returns `var(--grid-color)` |
| 4+ non-weather states active | 2 dots + badge |
| saveDayDetail ok=false | Error toast, sheet stays open |
| saveDayDetail exception | Error toast, sheet stays open |
| Future cell | `.future` class, no color, no onclick |
| Past-no-data cell | `.past-no-data` class, day number visible |
| Light mode | Adapted color variants in getColorForParam |
| _yipTheme not set | Defaults to 'dark' (safe) |

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-06-02 | Removed MOOD_EMOJI_MAP (not in code — emoji is inline in MOODS), fixed drag handle reference (class `.yip-modal-drag-handle` not ID), fixed scrollTop reset on `#yip-detail-sheet-scroll-content` not `#yip-detail-sheet`, added _toastTimer, confirmed drag origin via canDragFrom() | SDD |
| (prior history retained) | | |
