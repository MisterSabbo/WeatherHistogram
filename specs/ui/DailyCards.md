# Spec: `src/ui/DailyCards.js`

## Purpose
Generates and updates daily forecast cards below the minimap/daily view, with click-to-scroll and active-day tracking.

## Dependencies

### state
| Property | Access (R/W) | Context |
|-----------|-------------|----------|
| `state.dailyData` | read | generateDailyCards |
| `state.hourlyData` | read | card click, updateActiveDailyCard |
| `state.PIXELS_PER_HOUR` | read | scroll calculations |
| `state.timezone` | read | date formatting |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../store.js` | `state` | access |
| `../theme.js` | `getThemeIcon` | theme-aware icon mapping |
| `../utils/i18n.js` | `getLocale` | locale-aware date formatting |

## Public API

### `export function getWeatherIconSVG(code): string`

**Description:** Converts WMO weather code to a Material Symbols icon string.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `code` | `number` | WMO weather code (0–99) |

**Return:** `string` — HTML `<span>` with the Material Symbols icon name

**Mutates state:** No

**Async:** No

### `export function generateDailyCards(centerOnCurrentTimeCallback): void`

**Description:** Generates daily forecast cards from `state.dailyData` in `#daily-cards-container`.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `centerOnCurrentTimeCallback` | `Function` | Callback to center chart on current hour (used when clicking "today" card) |

**Return:** `void`

**Mutates state:** Yes (modifies DOM: creates cards in container, attaches event listeners)

**Async:** No

### `export function updateActiveDailyCard(): void`

**Description:** Marks the active day card based on scroll position. Updates `--arrow-pos` CSS variable and auto-scrolls the card container if the active card is out of view.

**Parameters:** None (reads `state` directly)

**Return:** `void`

**Mutates state:** Yes (toggles `.active` class, sets CSS custom properties, may scroll container)

**Async:** No

## Module variables

| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `lastActiveDateStr` | `string` | `''` | Caches last active date string to skip heavy layout operations when day hasn't changed |

## Behavior

1. **Card generation:** Each card shows weekday (short, uppercase), date, weather icon, temp max/min. Past days get `.past-day` class and a `history` icon.
2. **Today detection:** Matches current locale date string against `state.dailyData` entries. Past days are those before today's index.
3. **Card click — Today:** Calls `centerOnCurrentTimeCallback('smooth')`.
4. **Card click — Other day:** Finds the noon hour (`localHour === 12`) for that day in `state.hourlyData`. If no exact noon found, falls back to first hour of that day + 12 indices. Scrolls `#scroll-container` to that position (`index * PIXELS_PER_HOUR - 60`).
5. **Active day tracking:** `updateActiveDailyCard` uses `scrollLeft + 60` divided by `PIXELS_PER_HOUR` to get a floating hour index. Uses `floatIndex` for exact day progress (`(localHour + fraction) / 24`). Sets `--arrow-pos` as percentage.
6. **Auto-scroll cards container:** If the active card's bounding rect is outside the container's visible area, scrolls to center the card (`instant` behavior).
7. **Optimization:** Uses `lastActiveDateStr` to skip DOM operations when the active day hasn't changed.

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `state.dailyData` empty | No cards generated, no throw |
| `state.hourlyData` empty | `updateActiveDailyCard` returns without changes |
| Container `#daily-cards-container` does not exist | `generateDailyCards` / `updateActiveDailyCard` return without changes |
| `getWeatherIconSVG(-1)` (unknown code) | Returns default icon `clear_day` |
| No exact noon hour for a day | Falls back to first hour index + 12, clamped to array bounds |
| Card container display is 'none' | `updateActiveDailyCard` returns early without processing |

## Test Scenarios

1. **Initializes without errors with DOM elements present:** `generateDailyCards` with DOM present
2. **Does not throw if DOM elements are missing:** Container absent
3. **Exports expected functions:** `getWeatherIconSVG`, `generateDailyCards`, `updateActiveDailyCard`
4. **SVG icon by WMO code:** `getWeatherIconSVG(0)` returns sunny icon
5. **Empty daily data:** `state.dailyData = []`, no cards generated
6. **Card click scrolls to noon:** Click on a day scrolls to noon position
7. **Fallback when no exact noon:** Uses `firstIndex + 12` as target

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-06-02 | Removed CONFIG dependency (not imported), added lastActiveDateStr cache, noon fallback logic, floatIndex for day progress | SDD |
| 2026-05-21 | Initial spec | SDD |
