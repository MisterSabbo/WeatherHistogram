# Spec: `src/theme.js`

## Purpose
Chart theme management: loading JSON theme files, accessing colors/icons/fonts, and updating the DOM with theme values.

## Dependencies

### state
| Property | Access (R/W) | Context |
|-----------|-------------|----------|
| `state.themeConfig` | read / write | all functions |

### DOM
| Element | Access type | Context |
|----------|---------------|----------|
| `document.body.style.fontFamily` | write | `applyThemeDOM` |
| `meta[name="theme-color"]` | querySelector + write | `applyThemeDOM` |
| `#val-precip .material-symbols-outlined` | querySelector + write | `applyThemeDOM` |
| `#val-precip-prob .material-symbols-outlined` | querySelector + write | `applyThemeDOM` |
| `#val-clouds .material-symbols-outlined` | querySelector + write | `applyThemeDOM` |
| `#val-aqi .material-symbols-outlined` | querySelector + write | `applyThemeDOM` |
| `#val-pollen .material-symbols-outlined` | querySelector + write | `applyThemeDOM` |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `./store.js` | `state` | theme config access |

## Public API

### `export function getThemeColor(path: string, fallbackColor: string): string`

**Description:** Navigates `state.themeConfig.colors` using a dot-separated path and returns the value. Returns `fallbackColor` if config is missing, path doesn't exist, or value is not a string.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `path` | `string` | Dot-separated path into colors object (e.g. `"uvLevels.low"`) |
| `fallbackColor` | `string` | Fallback color string |

**Return:** `string`

**Mutates state:** No

**Async:** No

### `export function getThemeIcon(path: string, fallbackIcon: string): string`

**Description:** Navigates `state.themeConfig.icons` using a dot-separated path and returns the value. Returns `fallbackIcon` if config is missing, path doesn't exist, or value is not a string.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `path` | `string` | Dot-separated path into icons object (e.g. `"header.precip"`) |
| `fallbackIcon` | `string` | Fallback icon string |

**Return:** `string`

**Mutates state:** No

**Async:** No

### `export function getThemeFont(size: string = ''): string`

**Description:** Returns the configured font family with optional size prefix. Falls back to `'Inter, sans-serif'` if no theme config or no font property.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `size` | `string` | Optional size prefix (e.g. `"16px"`), returns `"16px Inter, sans-serif"` |

**Return:** `string`

**Mutates state:** No

**Async:** No

### `export async function loadChartTheme(themeId: string): Promise<void>`

**Description:** Loads a chart theme JSON file. Tries `./themes/{themeId}.json` first (primary), falls back to `./public/themes/{themeId}.json`. If both fail, loads a hardcoded default theme. Sets `state.themeConfig` on success and calls `applyThemeDOM()`.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `themeId` | `string` | Theme identifier (e.g. `"default"`, `"neon"`, `"pastel"`) |

**Return:** `Promise<void>`

**Mutates state:** Yes (`state.themeConfig`)

**Async:** Yes (awaits: fetch calls)

### `export function applyThemeDOM(): void`

**Description:** Applies the current theme to the DOM: sets font-family on body, updates `meta[name="theme-color"]` content from `--bg-color` CSS variable, and sets Material Symbols icon textContent for 5 header elements (precip, precip-prob, clouds, aqi, pollen).

**Parameters:** None

**Return:** `void`

**Mutates state:** No

**Async:** No

## Behavior

1. **getThemeColor/getThemeIcon:** Use dot-separated path to navigate `state.themeConfig.colors`/`state.themeConfig.icons`. Returns fallback if config is null, any path segment is missing, or final value is not a string.
2. **getThemeFont:** Returns `state.themeConfig.font` with optional size prefix, or `'Inter, sans-serif'` if unavailable.
3. **loadChartTheme:** Three-tier loading: primary URL → fallback URL → hardcoded default object. On success, sets `state.themeConfig` and calls `applyThemeDOM()`.
4. **applyThemeDOM:** Queries DOM elements individually with `querySelector`. Each element is guarded (only updates if element exists). Meta tag is guarded.
5. **Icon mapping:** `header.precip` → `#val-precip`, `header.prob` → `#val-precip-prob`, `header.cloud` → `#val-clouds`, `header.aqi` → `#val-aqi`, `header.allergen` → `#val-pollen`.

## Edge Cases

| Condition | Expected behavior |
|-----------|------------------------|
| `state.themeConfig` is `null` | `getThemeColor`/`getThemeIcon` return fallback |
| `state.themeConfig.colors` is missing | `getThemeColor` returns fallback |
| Path segment not found | Returns fallback |
| Value at path is not a string (e.g. object) | Returns fallback |
| `state.themeConfig.font` missing | `getThemeFont` returns `'Inter, sans-serif'` |
| Both primary and fallback theme URLs fail | Hardcoded default theme object is used |
| Meta tag does not exist | `applyThemeDOM` does not throw (guarded by if-check) |
| Header icon element missing from DOM | `applyThemeDOM` skips that element (guarded by if-check) |

## Test Scenarios

1. **getThemeColor with valid path:** returns theme color value
2. **getThemeColor without config:** returns fallback
3. **getThemeColor invalid path:** returns fallback
4. **getThemeColor value not a string:** returns fallback
5. **getThemeIcon:** returns icon or fallback
6. **getThemeFont:** returns font with/without size
7. **loadChartTheme with valid theme:** `state.themeConfig` updated and `applyThemeDOM` called
8. **loadChartTheme with both URLs failing:** uses hardcoded default

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
| 2026-06-02 | Expanded to full template format; fixed dependency table (removed incorrect `state.theme` reference); added detailed parameter/return/edge case docs | SDD |
