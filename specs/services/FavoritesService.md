# Spec: `src/services/FavoritesService.js`

## Purpose
Service for managing favorite locations with persistence in IndexedDB via StorageService.

## Dependencies

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `./StorageService.js` | `storageService` | persistence |

## Public API

### `export class FavoritesService`

### `new FavoritesService(): FavoritesService`

**Description:** Initializes with empty cache.

### `async load(): Promise<Array>`

**Description:** Loads favorites from storage.

### `async save(): Promise<void>`

**Description:** Persists cache to storage.

### `async add(lat, lon, originalName): Promise<void>`

**Description:** Adds a favorite if it does not already exist (by coordinates with 0.001 tolerance).

### `async remove(index): Promise<void>`

### `async updateAlias(index, alias): Promise<void>`

### `async reorder(oldIndex, newIndex): Promise<void>`

### `async clear(): Promise<void>`

### `export const favoritesService: FavoritesService` (singleton)

## Behavior

1. `load`/`save` are called internally on each mutating operation
2. `add` checks for duplicates with 0.001 latitude/longitude tolerance
3. `reorder` does nothing if newIndex is out of range
4. `clear` empties cache and persists

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `add` with existing location | Does not duplicate |
| `remove` with invalid index | splice with invalid index → error or nothing |
| `reorder` with out of range indices | Does nothing |
| Storage fails | Error propagated to caller |

## Test Scenarios

1. **Add new favorite:** added and persisted
2. **Add duplicate:** not added
3. **Remove:** deletes and persists
4. **Reorder:** changes order and persists
5. **Clear:** empties list and persists
6. **Singleton:** favoritesService is a unique instance

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
