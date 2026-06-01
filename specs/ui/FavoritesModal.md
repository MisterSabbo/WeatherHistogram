# Spec: `src/ui/FavoritesModal.js`

## Purpose
Favorite locations management modal with list, alias editing, reordering and deletion.

## Dependencies

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../services/FavoritesService.js` | `favoritesService` | data |
| `../store.js` | `state` | not used directly (via callbacks) |
| `../utils/i18n.js` | `t` | translation |

## Public API

### `export function initFavoritesModal(onSelect: Function): void`

**Description:** Initializes the favorites modal.

| Parameter | Type | Description |
|-----------|------|-------------|
| `onSelect` | `Function` | Callback `(lat, lon, name)` when selecting a location |

**Metadata:**
- Mutates state: No
- Async: No

## Behavior

1. Button `#map-favorites-btn` opens modal with favorites list
2. Edit mode: rename alias (prompt modal), delete (confirmation), reorder (↑↓)
3. Non-edit mode: click on favorite → `onSelect(lat, lon, originName)`
4. `renderFavorites()` async: loads from service, builds DOM cards
5. Prompt modal clones buttons to avoid duplicate listeners

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| Button `#map-favorites-btn` does not exist | Does not throw, does not register listener |
| `favoritesService.load()` returns `null` / `undefined` | Shows "no favorites" message |
| `onSelect` is not a function | Does not throw, ignores callback |
| Empty favorites list (`[]`) | Shows empty message |
| Edit alias with empty value | Does not update, keeps previous alias |

## Test Scenarios

1. **Initializes without errors with DOM elements present:** `initFavoritesModal` with button present, does not throw
2. **Does not throw if DOM elements are missing:** Button `#map-favorites-btn` absent, does not throw
3. **Exports expected functions:** `initFavoritesModal` is a function
4. **Empty favorites list:** `favoritesService.load()` returns `[]`, shows empty message
5. **Favorite selection:** Click on favorite calls `onSelect(lat, lon, name)`
6. **Alias editing:** Empty value keeps previous alias

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
