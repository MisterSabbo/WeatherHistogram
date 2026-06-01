# Spec: `src/utils/AlertEngine.js`

## Purpose
Generates weather alerts based on thresholds (temp, wind, rain, UV, snow) from hourly data, and renders them in the DOM.

## Dependencies

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `./i18n.js` | `t` | Alert text translation |

### DOM
| Element | Access type | Context |
|----------|---------------|----------|
| `#alerts-container` | getElementById / display style | renderAlerts |
| `#alerts-tooltip` | getElementById / innerHTML | renderAlerts |

## Public API

### `export function generateAlerts(hourlyData: Array, index: number): { alerts: Array, alertLevel: number }`

**Description:** Scans up to 12 hours from `index` in `hourlyData` and generates alerts for threshold exceedances. Each alert type appears only once.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `hourlyData` | `Array` | Hourly data with `temp`, `gusts`, `precip`, `uv`, `weatherCode` |
| `index` | `number` | Initial scan index |

**Return:** `{ alerts: Array<{type, level, msg}>, alertLevel: number }`

**Mutates state:** No

**Async:** No

### `export function renderAlerts(alerts: Array, alertLevel: number): void`

**Description:** Renders alerts in the DOM. Shows container with tooltip if alerts exist; hides it if not.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `alerts` | `Array` | Alert list from `generateAlerts` |
| `alertLevel` | `number` | Maximum alert level (1-3) |

**Return:** `void`

**Mutates state:** No

**Async:** No

## Behavior

1. **Temperature thresholds:** `>=38°C` → level 3, `>=35°C` → level 2, `<=-5°C` → level 2
2. **Wind thresholds:** `>=90km/h` → level 3, `>=70km/h` → level 2
3. **Rain thresholds:** `>=15mm/h` → level 3, `>=8mm/h` → level 2
4. **UV thresholds:** `>=11` → level 3
5. **Snow thresholds:** weatherCode in [71,73,75,77,85,86] with precip `>=2mm` → level 2
6. Each alert type is emitted only once (first match) thanks to `alertTypes` (Set)
7. `alertLevel` is the maximum level found among all alerts
8. `renderAlerts`: if alerts exist, shows container and paints tooltip with color based on level; if not, hides container
9. Icon colors: level 3 → red (`#d32f2f`), level 2 → orange (`#f57c00`), level 1 → yellow (`#fbc02d`)
10. Alert dot: level 3 → `#ef5350`, level 2 → `#ff9800`, level 1 → `#ffca28`

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `hourlyData` empty | Returns `{ alerts: [], alertLevel: 0 }` |
| `index` >= `hourlyData.length` | Does not iterate, returns `{ alerts: [], alertLevel: 0 }` |
| `hourlyData[i]` is null/undefined | Skipped with `continue` |
| `alertContainer` or `alertTooltip` does not exist | Does nothing (early return) |

## Test Scenarios

1. **Extreme heat alert:** `temp >= 38` → alert level 3
2. **Hurricane wind alert:** `gusts >= 90` → alert level 3
3. **Torrential rain alert:** `precip >= 15` → alert level 3
4. **Extreme UV:** `uv >= 11` → alert level 3
5. **Heavy snow:** weatherCode 73 + precip >= 2 → alert level 2
6. **No alerts:** data within normal ranges → empty alerts, level 0
7. **Multiple alerts:** various types generated, `alertTypes` prevents duplicates
8. **Maximum alert level:** level calculated as `Math.max` of all alerts
9. **renderAlerts with alerts:** container shown and tooltip painted
10. **renderAlerts without alerts:** container hidden

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
