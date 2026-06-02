# Spec: `src/services/FavoritesService.js`

## Purpose
Service for managing favorite locations (lat, lon, name, alias) with persistence in IndexedDB via StorageService.

## Dependencies

No state, CONFIG or DOM dependencies.

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `./StorageService.js` | `storageService` | IndexedDB persistence |

## Public API

### `export class FavoritesService`

### `new FavoritesService(): FavoritesService`

**Description:** Initializes with empty `this.cache` array.

### `async load(): Promise<Array>`

**Description:** Loads favorites from storage. Updates internal cache. Returns the cache array.

### `async save(): Promise<void>`

**Description:** Persists current cache to storage.

### `async add(lat: number, lon: number, originalName: string): Promise<void>`

**Description:** Adds a favorite if it does not already exist (by coordinates with 0.001 tolerance). Stores `{ lat, lon, originName, alias }` where alias defaults to originalName.

### `async remove(index: number): Promise<void>`

**Description:** Removes a favorite by array index.

### `async updateAlias(index: number, alias: string): Promise<void>`

**Description:** Updates the alias of a favorite at the given index.

### `async reorder(oldIndex: number, newIndex: number): Promise<void>`

**Description:** Moves a favorite from oldIndex to newIndex. Does nothing if newIndex is out of bounds.

### `async clear(): Promise<void>`

**Description:** Empties the favorites list and persists.

### `export const favoritesService: FavoritesService` (singleton)

## Behavior

1. `load` and `save` are called internally by every mutating operation before the actual change, ensuring cache is current
2. `add` checks for duplicates by comparing lat/lon with 0.001 absolute difference tolerance
3. `remove` uses `Array.splice(index, 1)` — if index is invalid, splice does nothing
4. `reorder` does nothing if `newIndex` is `< 0` or `>= this.cache.length`
5. `clear` empties cache and immediately persists

## Edge Cases

| Input | Expected behavior |
|-------|------------------------|
| `add` with existing location | Does not duplicate |
| `remove` with invalid index | splice with out-of-range index → no element removed |
| `reorder` with out of range indices | Does nothing |
| Storage failure | Error propagated to caller |
| `add` with new location | Added to cache and persisted |

## Test Scenarios

1. **Add new favorite:** added and persisted
2. **Add duplicate:** not added
3. **Remove by index:** deletes and persists
4. **Reorder:** changes order and persists
5. **Clear:** empties list and persists
6. **Singleton:** favoritesService is a unique instance
7. **Update alias:** updates alias field for the given index

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
| 2026-06-02 | Spec update to match code — clarified store structure and alias defaults | SDD |
