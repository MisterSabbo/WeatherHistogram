# Spec: `src/ui/BottomSheet.js`

## Purpose
Modal bottom sheet system with swipe-to-dismiss, stacking z-index, and close callbacks.

## Dependencies

### DOM
| Element | Access type | Context |
|----------|---------------|----------|
| `[sheetId]` | getElementById | openBottomSheet |
| `[backdropId]` | getElementById (default `'pill-sheet-backdrop'`) | openBottomSheet |

## Public API

### `export function initBottomSheets(): void`

**Description:** Resets internal sheet state (clears `_activeSheets`, `_sheetIdCounter`, `_onSheetCloseCallbacks`).

**Parameters:** None

**Return:** `void`

**Mutates state:** Yes (internal module state)

**Async:** No

### `export function onSheetClose(sheetId, callback): void`

**Description:** Registers a callback invoked when a specific sheet closes.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `sheetId` | `string` | Sheet ID to observe |
| `callback` | `Function` | Function called on close |

**Return:** `void`

**Mutates state:** Yes (`_onSheetCloseCallbacks` map)

**Async:** No

### `export function openBottomSheet(sheetId, backdropId?, scrollElementId?): Function`

**Description:** Opens a sheet with increasing z-index and swipe-to-dismiss. Returns a `closeSheet` function, or no-op if elements not found.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `sheetId` | `string` | Sheet element ID |
| `backdropId` | `string` | Backdrop element ID (default `'pill-sheet-backdrop'`) |
| `scrollElementId` | `string` | Scroll element ID for scroll guard |

**Return:** `Function` — call to close the sheet

**Mutates state:** Yes (CSS classes, z-index, inline styles, event listeners)

**Async:** No

### `export function closeBottomSheet(sheetId, backdropId?): void`

**Description:** Closes a sheet by invoking the stored close function for that backdrop.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `sheetId` | `string` | Sheet ID |
| `backdropId` | `string` | Backdrop ID (default `'pill-sheet-backdrop'`) |

**Return:** `void`

**Mutates state:** Yes (calls closeSheet which modifies DOM and state)

**Async:** No

### `export function confirmButtonClone(id, onClick): void`

**Description:** Replaces a button element with a clone to strip previous event listeners, then assigns `onclick`. Avoids listener accumulation on reused buttons in bottom sheets.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `id` | `string` | Button element ID |
| `onClick` | `Function` | Click handler |

**Return:** `void`

**Mutates state:** Yes (DOM replacement)

## Behavior

1. **Z-index stacking:** Sheet gets `7000 + depth * 100`, backdrop gets `6999 + depth * 100`. Depth is auto-incrementing `_sheetIdCounter`.
2. **Swipe-to-dismiss:** Uses pointer events (pointerdown → pointermove → pointerup). Falls back to touch events on `touchcancel`.
3. **Close threshold:** Drag down >100px triggers close; otherwise sheet snaps back (`translateY(0)`) with cubic-bezier transition (0.32, 0.72, 0, 1).
4. **Scroll guard:** If `scrollElementId` is provided, drag is blocked when `scrollElement.scrollTop > 0`.
5. **Backdrop click:** Closes the sheet via `backdrop.onclick`.
6. **Single active sheet per backdrop:** `_activeSheets[backdropId]` ensures only one active sheet per backdrop. Opening a new sheet with the same backdrop closes the previous one.
7. **Pointer to touch fallback chain:** If `pointercancel` fires while dragging, `touchFallback` is set and subsequent touchmove events are handled directly. Uses `usingTouch` flag to avoid double-handling.
8. **Close callbacks:** `_onSheetCloseCallbacks.get(sheetId)?.()` invoked when sheet closes.

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `sheetId` does not exist in DOM | Returns no-op function, does not throw |
| `backdropId` does not exist | Returns no-op function, does not throw |
| `scrollElementId` does not exist | Swipe-to-dismiss without scroll guard |
| Multiple sheets same backdropId | Only one active sheet per backdropId — previous is closed |
| Calling `closeBottomSheet` without having opened | Does not throw, does nothing |
| `touchcancel` during drag | Falls back to touch events for the remainder of the gesture |

## Test Scenarios

1. **Initializes without errors with DOM elements present:** `initBottomSheets` does not throw
2. **Does not throw if DOM elements are missing:** IDs do not exist
3. **Exports expected functions:** `initBottomSheets`, `openBottomSheet`, `closeBottomSheet`, `onSheetClose` are functions
4. **Open and close sheet:** `openBottomSheet('test')` + `closeBottomSheet('test')` without errors
5. **Swipe-to-dismiss:** Drag >100px closes the sheet
6. **Multiple sheets same backdrop:** Only one active sheet per backdropId
7. **Scroll guard:** If `scrollElement` has `scrollTop > 0`, drag is blocked
8. **Default backdropId:** Default is `'pill-sheet-backdrop'` (not `'{sheetId}-backdrop'`)

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-06-02 | Fixed default backdropId to `'pill-sheet-backdrop'`, added touch-fallback chain, documented _sheetIdCounter instead of _depth | SDD |
| 2026-05-28 | Fixed-handle pattern standardized in all sheets + scrollElementId update | SDD |
| 2026-05-21 | Initial spec | SDD |
