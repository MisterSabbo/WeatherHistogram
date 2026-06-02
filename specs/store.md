# Spec: `src/store.js`

## Purpose
Global mutable state and frozen configuration (CONFIG) of the application.

## Dependencies

No internal dependencies.

## Public API

### `export const CONFIG: Object` (frozen)

**Description:** Global configuration frozen with `Object.freeze()`.

| Constant | Value | Description |
|-----------|-------|-------------|
| `CHART_HEIGHT` | 250 | Height of the histogram canvas |
| `MINIMAP_HEIGHT` | 80 | Height of the minimap |
| `DEFAULT_COORDS` | `{ lat: 40.4167, lon: -3.70325, name: "Madrid" }` | Default coordinates |
| `CACHE_DURATION` | 300000 (5 min) | Data cache duration |
| `TILE_WIDTH` | 1440 | Tile width in pixels (desktop) |
| `PIXELS_PER_MM` | 10 | Pixels per mm of precipitation |

### `export function getDPR(): number`

**Description:** Returns `devicePixelRatio`, capped at maximum 2.

**Parameters:** None

**Return:** `number` (1–2)

**Mutates state:** No

**Async:** No

### `export const state: Object` (mutable)

**Description:** Global mutable state object with properties for data, UI, configuration.

| Property | Type | Default | Description |
|-----------|------|---------|-------------|
| `lat` | number|null | null | Current latitude |
| `lon` | number|null | null | Current longitude |
| `locationName` | string | "Cargando..." | Location name |
| `hourlyData` | Array | [] | Processed hourly data |
| `dailyData` | Array | [] | Processed daily data |
| `sunData` | Object | {} | Sunrise/sunset by date |
| `hoverX` | number|null | null | Hover/scrubber X position |
| `isFetching` | boolean | false | Fetch in progress flag |
| `dpr` | number | getDPR() | Device pixel ratio |
| `theme` | string | 'dark' | Current theme |
| `timezone` | string | 'UTC' | Timezone |
| `rawForecast` | Object|null | null | Raw forecast |
| `rawAQI` | Object|null | null | Raw AQI |
| `isDragging` | boolean | false | Drag in progress |
| `startX` | number | 0 | Initial drag X |
| `scrollLeft` | number | 0 | Initial scroll left |
| `activeChartTheme` | string | 'default' | Chart theme |
| `isDailyCardsView` | boolean | false | Daily cards view |
| `themeConfig` | Object|null | null | Loaded theme config |
| `PIXELS_PER_HOUR` | number | 60/50 | Pixels per hour (responsive: 60 on desktop, 50 on mobile <600px) |
| `stickmanThresholds` | Object | {cold:10, hot:30, wind:45, clouds:60} | Stickman thresholds |
| `skinType` | number | 2 | Fitzpatrick skin type |

## Behavior

1. **CONFIG frozen:** `Object.freeze(CONFIG)` protects the configuration from mutations.
2. **Mutable state:** `state` is modified directly from any module.
3. **Safe getDPR():** uses `window.devicePixelRatio || 1` to avoid NaN, capped at 2 via `Math.min`.
4. **Responsive PIXELS_PER_HOUR:** set at module evaluation time based on `window.innerWidth < 600`.

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `devicePixelRatio` undefined | `getDPR()` returns 1 (`window.devicePixelRatio \|\| 1` fallback) |
| `devicePixelRatio` > 2 | `getDPR()` returns 2 (Math.min cap) |
| `window.innerWidth` < 600 | `PIXELS_PER_HOUR` initializes to 50 |
| `window.innerWidth` = 0 (headless/test) | `PIXELS_PER_HOUR` uses desktop branch (60) |
| `Object.freeze(CONFIG)` fails (strict mode disabled) | CONFIG remains modifiable |
| `state.lat`/`state.lon` set to `null` | Application in no-location state, uses DEFAULT_COORDS as fallback |
| `state.hourlyData` mutated externally | No protection, inconsistent data |
| `state.theme` set to unsupported value | Invalid theme, colors may fail |

## Test Scenarios

1. **CONFIG frozen:** `Object.isFrozen(CONFIG) === true`
2. **CONFIG correct values:** constants have expected values
3. **state default values:** properties initialized correctly
4. **getDPR():** returns value between 1 and 2
5. **Responsive PIXELS_PER_HOUR:** initialized according to window.innerWidth

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
| 2026-06-02 | Fix locationName default to "Cargando..."; remove TILE_WIDTH edge case (overridden in app.js, not store.js) | SDD |
