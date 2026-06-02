# Spec: `src/ui/ConfirmModal.js`

## Purpose
Unified confirm dialog using bottom sheet. Replaces two duplicate implementations in `app.js` and `YearInPixels.js`.

## Dependencies

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|---------|
| `./BottomSheet.js` | `openBottomSheet` | open bottom sheet |

### DOM
| Element | Access type | Context |
|---------|-------------|---------|
| `#confirm-title` | textContent | showConfirm |
| `#confirm-message` | textContent | showConfirm |
| `#confirm-cancel-btn` | cloneNode + onclick | showConfirm |
| `#confirm-ok-btn` | cloneNode + onclick | showConfirm |
| `#confirm-modal` | openBottomSheet | showConfirm |
| `#confirm-sheet-backdrop` | openBottomSheet | showConfirm |
| `#confirm-sheet-scroll-content` | openBottomSheet | showConfirm |

## Public API

### `export function showConfirm(title, message): Promise<boolean>`

**Description:** Opens a confirm bottom sheet. Clones buttons to avoid duplicate listeners. Resolves `true` on OK, `false` on Cancel.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `title` | `string` | Title text for `#confirm-title` |
| `message` | `string` | Body text for `#confirm-message` |

**Return:** `Promise<boolean>`

**Mutates state:** No (DOM text + openBottomSheet)

**Async:** Yes (Promise-based)

## Implementation

```
function showConfirm(title, message):
  populate #confirm-title, #confirm-message
  clone OK and Cancel buttons to strip previous listeners
  assign onclick handlers (OK → resolve(true), Cancel → resolve(false))
  call openBottomSheet('confirm-modal', 'confirm-sheet-backdrop', 'confirm-sheet-scroll-content')
  both handlers call closeFn before resolving
```

## Behavior

1. **Button cloning:** Both buttons are replaced via `parentNode.replaceChild(cloneNode(true), ...)` to strip accumulated event listeners from previous calls.
2. **Close before resolve:** The close function is called before resolving the promise, ensuring the sheet is dismissed before the caller acts on the result.
3. **Reentry:** Each call creates fresh button references, so multiple sequential calls work correctly.

## Edge Cases

| Input | Expected behavior |
|-------|-------------------|
| `#confirm-title` does not exist | Returns false, no error |
| Rapid double-click on OK | First click closes + resolves true; second click finds stale button reference silently |

## Test Scenarios

1. **Calls openBottomSheet** with correct sheetId, backdropId, scrollElementId
2. **Resolves true** when OK is clicked
3. **Resolves false** when Cancel is clicked
4. **Clones buttons** to strip previous listeners (button refs differ after call)
5. **Does not throw** if DOM elements are missing

## Change History

| Date | Change | Author |
|------|--------|--------|
| 2026-06-02 | Initial spec | SDD |
