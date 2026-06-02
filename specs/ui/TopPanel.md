# Spec: `src/ui/TopPanel.js`

## Purpose
Updates the top panel with interpolated weather data based on scroll position: temperature, wind (with arrow rotation and color), AQI (text, icon color, radar chart), pollen (text, icon color, radar chart), precipitation, clouds, current time display, weather alerts, and weather description.

## Dependencies

### state
| Property | Access (R/W) | Context |
|-----------|-------------|----------|
| `state.hourlyData` | read | interpolation |
| `state.timezone` | read | time formatting |
| `state.locationName` | read | tooltip text |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../store.js` | `state` | access |
| `../theme.js` | `getThemeIcon` | theme-aware icon names |
| `../utils/i18n.js` | `t`, `getLocale` | translation |
| `../utils/time.js` | `formatTooltipTime` | time display formatting |
| `../utils/weather.js` | `getWeatherDescription` | weather code to text |
| `../services/AqiManager.js` | `getAQIInfo`, `getPollenText`, `getAggregatedPollenLevel`, `getPollenColor` | AQI/pollen display data |
| `../utils/AlertEngine.js` | `generateAlerts`, `renderAlerts` | weather alerts |
| `./AqiRadar.js` | `drawAQIRadar` | AQI radar canvas draw |
| `./PollenRadar.js` | `drawPollenRadar` | pollen radar canvas draw |

## Public API

### `export function updateTopPanel(options): void`

**Description:** Updates all top panel DOM elements with interpolated data based on `scrollLeft + 60` position.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `options` | `Object` | Config |
| `options.scrollContainer` | `HTMLElement` | Container with horizontal scroll |
| `options.PIXELS_PER_HOUR` | `number` | Pixels per hour for index calculation |

**Return:** `void`

**Mutates state:** Yes (extensive DOM updates: innerHTML, textContent, inline styles, CSS classes)

**Async:** No

## Behavior

1. **Index calculation:** `floatIndex = (scrollLeft + 60) / PIXELS_PER_HOUR`. Between data points, linear interpolation across: temp, apparent, wind, windDir, clouds, precip, precipProb.
2. **Non-interpolated fields:** aqi, aqiDetails, pollen, pollenDetails, weatherCode taken from the floor-index hour (d1).
3. **Boundary case:** At the last data point, no interpolation — uses the last entry directly (clamped via `Math.max(0, Math.min(length-1, Math.round(floatIndex)))`).
4. **Deduplication:** Compares `lastTopPanelData` (JSON.stringify) against current data to skip redundant updates.
5. **Temperature:** Displayed in `#val-temp` as integer + `°C`.
6. **Apparent temperature:** Displayed in `#val-apparent` with `emoji_people` icon.
7. **Wind:** Speed in `#val-wind` with `km/h` unit. Arrow in `#wind-arrow` rotated by `windDir + 180` degrees. Arrow and compass border colored based on temp: blue (<10°C), red (>28°C), default otherwise.
8. **AQI:** Text in `#val-aqi .aqi-text` via `getAQIInfo()`. Header icon `#header-aqi-icon` colored by AQI range (green <50, yellow <100, orange <150, red <200, purple <300, dark pink 300+). AQI header info (`#aqi-header-info`, `#aqi-modal-header-info`) rendered with value badge, text, and recommendation.
9. **AQI Radar:** Canvas `#aqi-radar` and `#aqi-modal-radar` drawn via `drawAQIRadar()` inside `requestAnimationFrame`.
10. **Pollen:** Text in `#val-pollen .pollen-text` via `getPollenText()`. Header icon colored via `getPollenColor(getAggregatedPollenLevel())`.
11. **Pollen Radar:** Canvas `#pollen-radar` and `#pollen-modal-radar` drawn via `drawPollenRadar()` inside `requestAnimationFrame`.
12. **Precipitation/Clouds:** Displayed with theme icons.
13. **Time display:** Computed from `state.hourlyData[0].time + (activeX / PIXELS_PER_HOUR) * 3600000`. Formatted via `formatTooltipTime()` — shows time main + date sub with "Hoy" prefix if today.
14. **Alerts:** `generateAlerts(state.hourlyData, index)` → `renderAlerts()`.
15. **Weather summary:** `#weather-summary` and `#tt-summary` updated via `getWeatherDescription()`.
16. **Scroll indicator:** Calls `window.updateScrollIndicator()` if defined.
17. **Location tooltip:** `#tt-location` updated with `state.locationName`.

## Module variables

| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `lastTopPanelData` | `Object` | `{}` | Caches previous data for deduplication via JSON.stringify |

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `state.hourlyData` empty | Returns without modifying DOM |
| `scrollContainer` null | Throws (no guard) |
| `PIXELS_PER_HOUR` = 0 | Invalid index — floatIndex is Infinity, clamped by Math.min |
| Panel DOM elements missing | `innerHTML` assignment on null fails silently |
| Same position as previous call | Skipped by JSON.stringify comparison |
| AQI/Pollen radar canvas missing | `drawAQIRadar` / `drawPollenRadar` return without drawing |
| Interpolation at last data point | Uses the last entry directly (no interpolation) |

## Test Scenarios

1. **Does not throw with valid options:** `updateTopPanel` with mock options
2. **Does not throw with empty hourlyData:** `state.hourlyData = []`
3. **Exports expected functions:** `updateTopPanel` is a function
4. **Same position as previous:** Skip by JSON.stringify comparison
5. **Wind arrow color by temperature:** Blue for <10°C, red for >28°C
6. **AQI header icon color by range:** Colors by AQI thresholds

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-06-02 | Removed stickmanThresholds and skinType (not read), added wind arrow rotation + color by temp, AQI/pollen header icon colors, lastTopPanelData dedup cache, requestAnimationFrame for radar draws, scrollIndicator call, location tooltip | SDD |
| 2026-05-21 | Initial spec | SDD |
