# Spec: `src/ui/FavoritesModal.js`

## Purpose
Favorite locations management modal with list display, alias editing (via prompt modal), deletion, and reordering functionality.

## Dependencies

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../services/FavoritesService.js` | `favoritesService` | load, add, remove, updateAlias, reorder |
| `../utils/i18n.js` | `t` | translation |

### DOM
| Element | Access type | Context |
|----------|---------------|----------|
| `#favorites-modal` | getElementById + style.display | initFavoritesModal |
| `#close-favorites-btn` | getElementById + click | initFavoritesModal |
| `#map-favorites-btn` | getElementById + click | initFavoritesModal (open trigger) |
| `#favorites-list` | getElementById + innerHTML | renderFavorites |
| `#toggle-edit-favorites-btn` | getElementById + innerHTML + onclick | renderFavorites |
| `#prompt-modal` | getElementById + style.display | alias editing |
| `#prompt-input` | getElementById + value | alias editing |
| `#prompt-title` | getElementById + textContent | alias editing |
| `#map-location-modal` | getElementById + style.display | close on select |

## Public API

### `export function initFavoritesModal(onSelect): void`

**Description:** Initializes the favorites modal with edit mode toggle, button wiring, and async render.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `onSelect` | `Function` | Callback `(lat, lon, name)` when selecting a location in non-edit mode |

**Return:** `void`

**Mutates state:** Yes (registers event listeners, manages internal `isEditMode` boolean)

**Async:** No (but renderFavorites is async)

## Behavior

1. **Open trigger:** `#map-favorites-btn` click opens modal (`style.display = 'flex'`) and renders favorites list.
2. **Close:** `#close-favorites-btn` click or backdrop click on `#favorites-modal` hides modal and resets edit mode.
3. **Non-edit mode:** Click on favorite card → closes modal + map modal → calls `onSelect(lat, lon, originName)`.
4. **Edit mode:**
   - **Rename alias:** Click edit icon → shows `#prompt-modal` with pre-filled alias. Clones OK/Cancel buttons to avoid duplicate listeners. On confirm → `favoritesService.updateAlias(index, newAlias)`. Preserves edit mode after re-render.
   - **Delete:** Click delete icon → `favoritesService.remove(index)` → re-render.
   - **Reorder:** Up/down buttons → `favoritesService.reorder(index, index ± 1)` → re-render. First item has up disabled, last has down disabled.
5. **Edit mode toggle:** `#toggle-edit-favorites-btn` button in HTML overlay toggles `isEditMode`. Text changes between "Editar" and "Hecho" with translation support.
6. **Display name logic:** If `fav.alias` exists and differs from `fav.originName`, shows alias as primary name and originName as secondary. Otherwise shows city (first part of originName) as primary and the rest as secondary.
7. **Empty state:** Shows i18n "no favorites" message when favorites list is empty.

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `#map-favorites-btn` does not exist | No event listener registered (optional chaining), does not throw |
| `favoritesService.load()` returns empty array | Shows empty state message |
| `onSelect` not a function | Throws when called (code does not guard) |
| Edit alias with empty/whitespace value | Closes prompt without updating (keeps previous alias) |
| Prompt modal DOM elements missing | Logs error to console, does not throw |
| Reorder at boundaries | Up/down buttons have `disabled` attribute and reduced opacity |

## Test Scenarios

1. **Initializes without errors with DOM elements present:** `initFavoritesModal` with button present
2. **Does not throw if DOM elements are missing:** Button absent
3. **Exports expected functions:** `initFavoritesModal` is a function
4. **Empty favorites list:** Shows empty message
5. **Favorite selection:** Click calls `onSelect(lat, lon, name)`
6. **Alias editing with empty value:** Keeps previous alias
7. **Edit mode toggle:** Toggle button switches between edit and display modes

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-06-02 | Removed state dependency (not imported), added edit mode toggle, reorder buttons, alias editing via prompt modal, isEditMode preservation, display name logic | SDD |
| 2026-05-21 | Initial spec | SDD |
