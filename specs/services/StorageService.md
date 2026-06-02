# Spec: `src/services/StorageService.js`

## Purpose
Persistence service using IndexedDB (primary) with silent fallback to localStorage. Provides generic key-value storage for user preferences, plus structured history storage and per-day mutation methods.

## Dependencies

No state, CONFIG, DOM or internal module dependencies.

## Public API

### `export class StorageService`

### `async init(): Promise<void>`

**Description:** Opens IndexedDB connection (`WeatherHistDB`, version 2). Creates `userPreferences` and `historyData` object stores if they do not exist. Idempotent — returns immediately if `this.db` is already set.

### `async get(key: string, defaultValue?: any): Promise<any>`

**Description:** Reads a value from `userPreferences` store. Falls back to localStorage (key prefix `weatherhist_`) if IndexedDB fails. Returns `defaultValue` on any error or missing key.

### `async set(key: string, value: any): Promise<void>`

**Description:** Writes a value to `userPreferences` store. Falls back to localStorage if IndexedDB fails.

### `async getHistory(locationName: string): Promise<{ hourly: Array, daily: Array }>`

**Description:** Reads history for a location from `historyData` store. Returns `{ hourly: [], daily: [] }` if it does not exist or on error.

### `async setHistory(locationName: string, pastData: Object): Promise<void>`

**Description:** Saves history for a location to `historyData` store. Silently fails if IndexedDB is unavailable.

### `async updateDayNotes(locationName: string, dayTimestamp: number, notes: string|null|undefined): Promise<boolean>`

**Description:** Updates notes for a specific day. Finds daily entry by `d.time === dayTimestamp`. Creates a new day entry (`{ time: dayTimestamp }`) if it does not exist. If `notes` is truthy, assigns `d.notes = notes`. If falsy (`""`, `null`, `undefined`), removes the `notes` key. Returns `true` on success, `false` on error.

### `async updateDayMoods(locationName: string, dayTimestamp: number, moods: string[]|null|undefined): Promise<boolean>`

**Description:** Updates moods for a specific day. Finds daily entry by `d.time === dayTimestamp`. Creates a new day entry if it does not exist. If `moods && moods.length > 0`, assigns `d.moods = moods`. Otherwise removes the `moods` key. Returns `true` on success, `false` on error.

### `async updateDayConditions(locationName: string, dayTimestamp: number, conditions: { cold: boolean, allergies: boolean }): Promise<boolean>`

**Description:** Updates health conditions (cold/allergies) for a specific day. Finds daily entry by `d.time === dayTimestamp`. Creates a new day entry if it does not exist. If `conditions.cold` is truthy, sets `d.cold = true`; otherwise removes the `cold` key. Same pattern for `conditions.allergies`. Returns `true` on success, `false` on error.

### `async updateDayData(locationName: string, dayTimestamp: number, fields: Object): Promise<boolean>`

**Description:** Batch update for a specific day. Finds daily entry by `d.time === dayTimestamp`. Creates a new day entry if it does not exist. Iterates `fields` keys: assigns value if not `undefined`, removes key if `undefined`. Single read+write avoids race conditions compared to calling individual update methods. Returns `true` on success, `false` on error.

### `export const storageService: StorageService` (singleton)

## Behavior

1. `init`: Idempotent — only opens connection if `this.db === null`
2. `get`/`set`: Silent fallback to localStorage with `weatherhist_` key prefix if IndexedDB fails
3. `getHistory`: Returns `{ hourly: [], daily: [] }` if location not found or on error
4. `setHistory`: Silently fails if IndexedDB unavailable
5. All `updateDay*` methods: Create a new day entry if not found (never reject — behavior is "upsert")
6. All `updateDay*` methods: Remove the relevant key when the value is falsy/empty

## Edge Cases

| Condition | Expected behavior |
|-----------|------------------------|
| IndexedDB not available | Fallback to localStorage |
| `get` for non-existent key | Returns defaultValue |
| `set` with circular/JSON value | JSON.stringify fails → error silently caught in localStorage fallback |
| `getHistory` without data | `{ hourly: [], daily: [] }` |
| `init` called multiple times | Only opens once |
| `updateDayNotes` with text | Assigns `d.notes = notes`, persists |
| `updateDayNotes` with empty string | Removes `notes` key, persists |
| `updateDayNotes` non-existent day | Creates new `{ time: dayTimestamp }`, sets `notes`, persists |
| `updateDayMoods` with array | Assigns `d.moods = moods`, persists |
| `updateDayMoods` with empty array | Removes `moods` key, persists |
| `updateDayMoods` non-existent day | Creates new `{ time: dayTimestamp }`, persists without moods if empty |
| `updateDayConditions` cold=true, allergies=false | Assigns `d.cold = true`, removes `allergies` key, persists |
| `updateDayConditions` cold=false, allergies=true | Removes `cold` key, assigns `d.allergies = true`, persists |
| `updateDayConditions` both false | Removes both keys, persists |
| `updateDayConditions` non-existent day | Creates new `{ time: dayTimestamp }`, applies conditions |
| `updateDayData` with multiple fields | Assigns all in a single write, no race condition |
| `updateDayData` with field=undefined | Removes that key from the daily object |
| `updateDayData` non-existent day | Creates new `{ time: dayTimestamp, ...fields }` |

## Test Scenarios

1. **get/set:** writes and reads correctly
2. **Default value:** get of non-existent key returns default
3. **Empty getHistory:** returns `{ hourly: [], daily: [] }`
4. **getHistory with data:** returns saved data
5. **Idempotent init:** called multiple times does not recreate DB
6. **localStorage fallback:** if IndexedDB fails, uses localStorage
7. **Singleton:** storageService is a unique instance
8. **updateDayNotes existing day:** finds the day, assigns notes, persists, returns `true`
9. **updateDayNotes non-existent day:** creates new day, assigns notes, persists, returns `true`
10. **updateDayNotes empty notes:** removes key and persists
11. **updateDayNotes API exposed:** storageService has `updateDayNotes` method
12. **updateDayMoods existing day:** finds the day, assigns moods, persists, returns `true`
13. **updateDayMoods non-existent day:** creates new day, persists, returns `true`
14. **updateDayMoods empty moods:** removes key and persists
15. **updateDayMoods API exposed:** storageService has `updateDayMoods` method
16. **updateDayConditions existing day:** finds the day, applies conditions, persists, returns `true`
17. **updateDayConditions non-existent day:** creates new day, applies conditions, persists, returns `true`
18. **updateDayConditions both false:** removes keys and persists
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
| 2026-06-02 | Spec update to match code — all updateDay* methods create new day if not found (upsert behavior), corrected return value descriptions | SDD |
