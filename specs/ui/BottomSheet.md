# Spec: `src/ui/BottomSheet.js`

## Purpose
Modal bottom sheet system with swipe-to-dismiss, stacking z-index, and close callbacks.

## Dependencies

### DOM
| Element | Access type | Context |
|----------|---------------|----------|
| elements by dynamic ID | getElementById | openBottomSheet |
| `[id]-backdrop` | getElementById | backdrops |

## Public API

### `export function initBottomSheets(): void`

**Description:** Resets internal sheet state.

| Parameter | Type | Description |
|-----------|------|-------------|
| — | — | No parameters |

**Metadata:**
- Mutates state: Yes (internal state `_activeSheets`, `_depth`)
- Async: No

### `export function onSheetClose(sheetId: string, callback: Function): void`

**Description:** Registers callback when a sheet closes.

| Parameter | Type | Description |
|-----------|------|-------------|
| `sheetId` | `string` | Sheet ID to observe |
| `callback` | `Function` | Function to execute on close |

**Metadata:**
- Mutates state: Yes (internal callback registry)
- Async: No

### `export function openBottomSheet(sheetId: string, backdropId?: string, scrollElementId?: string): Function`

**Description:** Opens sheet with increasing z-index and swipe-to-dismiss. Returns no-op function if elements do not exist.

| Parameter | Type | Description |
|-----------|------|-------------|
| `sheetId` | `string` | Sheet element ID |
| `backdropId?` | `string` | Backdrop ID (default `'{sheetId}-backdrop'`) |
| `scrollElementId?` | `string` | Scroll element ID for guard |

**Metadata:**
- Mutates state: Yes (CSS classes, z-index, events)
- Async: No

### `export function closeBottomSheet(sheetId: string, backdropId?: string): void`

**Description:** Closes a sheet and cleans up events.

| Parameter | Type | Description |
|-----------|------|-------------|
| `sheetId` | `string` | Sheet ID to close |
| `backdropId?` | `string` | Backdrop ID |

**Metadata:**
- Mutates state: Yes (CSS classes, events, callbacks)
- Async: No

## Behavior

1. Dynamic z-index: 7000 + depth * 100 for sheet, 6999 + depth * 100 for backdrop
2. Swipe-to-dismiss with pointer events and touch fallback
3. Close threshold: >100px of drag
4. Scroll guard: if scrollElement has scrollTop > 0, does not drag
5. Backdrop click closes sheet
6. `_activeSheets` by backdropId: only one active sheet per backdrop
7. **Fixed-handle pattern (standard in all sheets):**
   - The sheet has `overflow-y: hidden` and contains only the drag handle + a scroll wrapper
   - The scroll wrapper (`.yip-sheet-scroll-content`) is a flex container with `flex: 1; overflow-y: auto`
   - `scrollElementId` must point to the scroll wrapper, not the sheet
   - This ensures the drag handle is always visible and does not scroll with the content
   - The scroll guard reads `scrollTop` from the scroll wrapper, not the sheet (whose `scrollTop` is always 0)

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `sheetId` does not exist in DOM | Returns no-op function, does not throw |
| `backdropId` does not exist | Creates default backdropId `{sheetId}-backdrop`, if it does not exist does not throw |
| `scrollElementId` does not exist | Swipe-to-dismiss without scroll guard |
| `scrollElementId` exists but sheet has `overflow-y: hidden` | Scroll guard uses `scrollTop` of scrollElement, not the sheet — the drag handle stays fixed at top and does not scroll with content |
| Calling `closeBottomSheet` without having opened | Does not throw, does not modify anything |
| Multiple sheets same backdropId | Only one active sheet per backdropId |
| Pointer events not available | Fallback to touch events |

## Test Scenarios

1. **Initializes without errors with DOM elements present:** Full DOM, `initBottomSheets` does not throw
2. **Does not throw if DOM elements are missing:** IDs do not exist, does not throw
3. **Exports expected functions:** `initBottomSheets`, `openBottomSheet`, `closeBottomSheet`, `onSheetClose` are functions
4. **Open and close sheet:** `openBottomSheet('test')` + `closeBottomSheet('test')` without errors
5. **Swipe-to-dismiss:** Drag >100px closes the sheet
6. **Multiple sheets same backdrop:** Only one active sheet per backdropId
7. **Scroll guard with scroll wrapper:** If the sheet has an internal scroll wrapper (`.yip-sheet-scroll-content`) and `scrollElementId` points to it, swipe-to-dismiss only works when content is at the top (`scrollTop === 0`)
8. **Drag handle always visible:** In sheets with `overflow-y: hidden` and scroll wrapper, the drag handle does not scroll with content

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-28 | Fixed-handle pattern standardized in all sheets + scrollElementId update | SDD |
| 2026-05-21 | Initial spec | SDD |
