# Spec: `src/ui/TopPanel.js`

## Purpose
Updates the top panel with interpolated weather data based on scroll position: temperature, wind, AQI, pollen, precipitation, clouds, time, alerts.

## Dependencies

### state
| Property | Access | Context |
|-----------|--------|----------|
| `state.hourlyData` | read | interpolation |
| `state.timezone` | read | time format |
| `state.theme` | read | colors |
| `state.stickmanThresholds` | read | wind threshold |
| `state.skinType` | read | not direct |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../store.js` | `state` | access |
| `../theme.js` | `getThemeIcon` | icons |
| `../utils/i18n.js` | `t`, `getLocale` | translation |
| `../utils/time.js` | `formatTooltipTime` | time |
| `../utils/weather.js` | `getWeatherDescription` | description |
| `../services/AqiManager.js` | `getAQIInfo`, `getPollenText`, `getAggregatedPollenLevel`, `getPollenColor` | AQI/pollen |
| `../utils/AlertEngine.js` | `generateAlerts`, `renderAlerts` | alerts |
| `./AqiRadar.js` | `drawAQIRadar` | AQI radar |
| `./PollenRadar.js` | `drawPollenRadar` | pollen radar |

## Public API

### `export function updateTopPanel(options: { scrollContainer: HTMLElement, PIXELS_PER_HOUR: number }): void`

**Description:** Updates the top panel DOM with interpolated data based on scrollLeft + 60.

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `Object` | Configuration options |
| `options.scrollContainer` | `HTMLElement` | Container with horizontal scroll |
| `options.PIXELS_PER_HOUR` | `number` | Pixels per hour for index calculation |

**Metadata:**
- Mutates state: Yes (updates top panel DOM)
- Async: No

## Behavior

1. Interpolates data between hourlyData[index] and [index+1] based on progress
2. Updates: temp, apparent, wind (with color by temp), AQI (text + icon + radar), pollen (text + icon + radar), precip, precipProb, clouds, time (with isToday), alerts, weather summary, location tooltip
3. Skip if current state equals previous state (JSON.stringify comparison)
4. requestAnimationFrame for AQI/Pollen radar draw

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `state.hourlyData` empty | Does not interpolate, returns without modifying DOM |
| `scrollContainer = null` / `undefined` | Does not throw |
| `PIXELS_PER_HOUR = 0` | Invalid index calculation, does not throw |
| Panel DOM elements absent | `document.getElementById` returns `null`, `innerHTML` fails silently |
| `state` same as previous call | Skip by `JSON.stringify` comparison |
| Interpolation between same index | Equal values without interpolation |
| AQI/Pollen radar without canvas | `drawAQIRadar` / `drawPollenRadar` do not throw |

## Test Scenarios

1. **Initializes without errors with valid options:** `updateTopPanel` with mock options, does not throw
2. **Does not throw with empty hourlyData:** `state.hourlyData = []`, does not throw
3. **Exports expected functions:** `updateTopPanel` is a function
4. **Null ScrollContainer:** `scrollContainer = null`, does not throw
5. **Same position as previous:** Skip by JSON.stringify comparison
6. **Missing DOM elements:** `document.getElementById` returns null for some elements

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
