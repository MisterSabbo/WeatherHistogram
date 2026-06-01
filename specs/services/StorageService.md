# Spec: `src/services/StorageService.js`

## Purpose
Persistence service with IndexedDB and fallback to localStorage.

## Dependencies

No internal dependencies.

## Public API

### `export class StorageService`

### `async init(): Promise<void>`

**Description:** Opens IndexedDB connection (DB: "WeatherHistDB", version 2). Creates "userPreferences" and "historyData" object stores if they do not exist.

### `async get(key: string, defaultValue?: any): Promise<any>`

**Description:** Reads a value. Fallback to localStorage if IndexedDB fails.

### `async set(key: string, value: any): Promise<void>`

**Description:** Writes a value. Fallback to localStorage if IndexedDB fails.

### `async getHistory(locationName: string): Promise<{ hourly: Array, daily: Array }>`

**Description:** Gets history for a location. Returns `{ hourly: [], daily: [] }` if it does not exist.

### `async setHistory(locationName: string, pastData: Object): Promise<void>`

**Description:** Saves history for a location.

### `async updateDayNotes(locationName: string, dayTimestamp: number, notes: string): Promise<boolean>`

**Description:** Updates the notes for a specific day in a location's history. Finds the daily entry where `d.time === dayTimestamp`, assigns `d.notes = notes` (or removes the key if `notes` is an empty string), and persists with `setHistory`. Returns `true` if the day was found and updated, `false` if not found.

### `async updateDayMoods(locationName: string, dayTimestamp: number, moods: string[]): Promise<boolean>`

**Description:** Updates the moods for a specific day in a location's history. Finds the daily entry where `d.time === dayTimestamp`, assigns `d.moods = moods` (or removes the key if `moods` is an empty array), and persists with `setHistory`. Returns `true` if the day was found and updated, `false` if not found.

### `async updateDayConditions(locationName: string, dayTimestamp: number, conditions: Object): Promise<boolean>`

**Description:** Updates health conditions (cold/allergies) for a specific day in a location's history. Finds the daily entry where `d.time === dayTimestamp`, assigns `d.cold = conditions.cold` (boolean) and `d.allergies = conditions.allergies` (boolean), and persists with `setHistory`. If `conditions.cold` is `false`, removes the `cold` key. If `conditions.allergies` is `false`, removes the `allergies` key. Returns `true` on success, `false` on error.

| Parameter | Type | Description |
|-----------|------|-------------|
| `locationName` | `string` | Location name |
| `dayTimestamp` | `number` | Day timestamp |
| `conditions` | `Object` | `{ cold: boolean, allergies: boolean }` |

**Metadata:**
- Async: Yes (await setHistory)

### `async updateDayData(locationName: string, dayTimestamp: number, fields: Object): Promise<boolean>`

**Description:** Batch update — persists multiple fields for a day in a single read+write operation, avoiding race conditions. Each key in `fields` is assigned as a property of the day; if the value is `undefined`, the key is removed. Creates a new entry if the day does not exist.

| Parameter | Type | Description |
|-----------|------|-------------|
| `locationName` | `string` | Location name |
| `dayTimestamp` | `number` | Day timestamp |
| `fields` | `Object` | `{ notes?, moods?, cold?, allergies?, ... }` |

**Metadata:**
- Async: Yes (await getHistory + setHistory)

### `export const storageService: StorageService` (singleton)

## Behavior

1. `init`: idempotent (only opens if `this.db === null`)
2. `get`/`set`: silent fallback to localStorage if IndexedDB fails
3. `getHistory`: if not found, returns empty object
4. `setHistory`: fails silently if IndexedDB is not available
5. `updateDayMoods`: same pattern as `updateDayNotes` — finds day by timestamp, assigns or removes `moods` key, persists with `setHistory`

## Edge Cases

| Condition | Expected behavior |
|-----------|------------------------|
| IndexedDB not available | Fallback to localStorage |
| `get` for non-existent key | Returns defaultValue |
| `set` with circular value | JSON.stringify fails → error in localStorage |
| `getHistory` without data | `{ hourly: [], daily: [] }` |
| `init` called multiple times | Only opens once |
| `updateDayNotes` without day data | Returns `false` |
| `updateDayNotes` with empty notes | Removes the `notes` key from the daily object |
| `updateDayNotes` with notes text | Assigns `d.notes = notes` and persists |
| `updateDayMoods` without day data | Returns `false` |
| `updateDayMoods` with empty moods | Removes the `moods` key from the daily object |
| `updateDayMoods` with moods array | Assigns `d.moods = moods` and persists |
| `updateDayMoods` with moods null/undefined | Removes the `moods` key from the daily object |
| `updateDayConditions` with cold=true, allergies=false | Assigns `d.cold = true`, removes `allergies` key, persists |
| `updateDayConditions` with cold=false, allergies=true | Removes `cold` key, assigns `d.allergies = true`, persists |
| `updateDayConditions` with cold=false, allergies=false | Removes `cold` and `allergies` keys, persists |
| `updateDayConditions` without day data (day does not exist) | Creates new day `{ time: dayTimestamp, cold: true, allergies: true }` |
| `updateDayConditions` with existing day | Finds day, updates conditions, persists |
| `updateDayData` with multiple fields | Assigns all in a single write, no race condition |
| `updateDayData` with field=undefined | Removes that key from the daily object |
| `updateDayData` non-existent day | Creates new entry `{ time: dayTimestamp, ...fields }` |

## Test Scenarios

1. **get/set:** writes and reads correctly
2. **Default value:** get of non-existent key returns default
3. **Empty getHistory:** returns `{ hourly: [], daily: [] }`
4. **getHistory with data:** returns saved data
5. **Idempotent init:** called multiple times does not recreate DB
6. **localStorage fallback:** if IndexedDB fails, uses localStorage
7. **Singleton:** storageService is a unique instance
8. **updateDayNotes existing day:** finds the day, assigns notes, persists, returns `true`
9. **updateDayNotes non-existent day:** returns `false`
10. **updateDayNotes empty notes:** removes key and persists
11. **updateDayNotes API exposed:** storageService has `updateDayNotes` method
12. **updateDayMoods existing day:** finds the day, assigns moods array, persists, returns `true`
13. **updateDayMoods non-existent day:** returns `false`
14. **updateDayMoods empty moods:** removes key and persists
15. **updateDayMoods API exposed:** storageService has `updateDayMoods` method
16. **updateDayConditions existing day:** finds the day, assigns cold=true/allergies=true, persists, returns `true`
17. **updateDayConditions non-existent day:** returns `false`
18. **updateDayConditions cold=false, allergies=false:** removes keys and persists
19. **updateDayConditions API exposed:** storageService has `updateDayConditions` method
20. **updateDayData existing day:** batch update — assigns all fields in a single operation, persists, returns `true`
21. **updateDayData non-existent day:** creates new day, assigns fields, persists, returns `true`
22. **updateDayData with field=undefined:** removes that key from the day
23. **updateDayData API exposed:** storageService has `updateDayData` method

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
| 2026-05-21 | Added `updateDayNotes` for YIP personal notes | SDD |
| 2026-05-21 | Added `updateDayMoods` for YIP moods | SDD |
| 2026-05-28 | Added `updateDayConditions` for YIP cold/allergies tracking | SDD |
| 2026-05-28 | Added `updateDayData` batch method to avoid race conditions in saveDayDetail | SDD |
