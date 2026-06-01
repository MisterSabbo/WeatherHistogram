# Spec: `src/ui/DailyCards.js`

## Purpose
Generates and updates daily forecast cards below the minimap/daily view.

## Dependencies

### state
| Property | Access | Context |
|-----------|--------|----------|
| `state.dailyData` | read | generateDailyCards |
| `state.hourlyData` | read | updateActiveDailyCard |
| `state.PIXELS_PER_HOUR` | read | scroll calculations |
| `state.timezone` | read | date formatting |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../store.js` | `state`, `CONFIG` | access |
| `../theme.js` | `getThemeIcon` | icons |
| `../utils/i18n.js` | `getLocale` | locale |

## Public API

### `export function getWeatherIconSVG(code: number): string`

**Description:** Converts WMO code to SVG icon HTML.

| Parameter | Type | Description |
|-----------|------|-------------|
| `code` | `number` | WMO weather code (0-99) |

**Metadata:**
- Mutates state: No
- Async: No

### `export function generateDailyCards(centerOnCurrentTimeCallback: Function): void`

**Description:** Generates daily forecast cards from `state.dailyData`.

| Parameter | Type | Description |
|-----------|------|-------------|
| `centerOnCurrentTimeCallback` | `Function` | Callback to center scroll on current hour |

**Metadata:**
- Mutates state: Yes (modifies cards container DOM)
- Async: No

### `export function updateActiveDailyCard(): void`

**Description:** Marks the active day according to scroll position.

| Parameter | Type | Description |
|-----------|------|-------------|
| — | — | No parameters (uses `state` directly) |

**Metadata:**
- Mutates state: Yes (modifies CSS classes in DOM)
- Async: No

## Behavior

1. `generateDailyCards`: creates cards with day, date, icon, temp max/min
2. Card click: scroll to noon of that day (hour 12), smooth if today
3. Past days: class 'past-day' + history icon
4. `updateActiveDailyCard`: uses scrollLeft + 60 to determine active day, sets `--arrow-pos` according to day progress
5. Auto scroll of cards container if active day is out of view

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `state.dailyData` empty | Does not generate any card, does not throw |
| `state.hourlyData` empty | `updateActiveDailyCard` returns without changes |
| Container DOM does not exist | Does not throw |
| `centerOnCurrentTimeCallback` is not a function | Does not throw, ignores callback |
| `getWeatherIconSVG(-1)` (invalid code) | Returns default icon `clear_day` |
| Day out of visible range | Auto scroll of container if active day is out of view |

## Test Scenarios

1. **Initializes without errors with DOM elements present:** `generateDailyCards` with DOM present, does not throw
2. **Does not throw if DOM elements are missing:** Container DOM absent, does not throw
3. **Exports expected functions:** `getWeatherIconSVG`, `generateDailyCards`, `updateActiveDailyCard` are functions
4. **SVG icon by WMO code:** `getWeatherIconSVG(0)` returns sunny SVG
5. **Empty daily data:** `state.dailyData = []`, does not generate any card
6. **Card click:** Scroll to noon of selected day

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
