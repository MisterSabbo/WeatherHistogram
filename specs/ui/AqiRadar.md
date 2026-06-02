# Spec: `src/ui/AqiRadar.js`

## Purpose
Draws an air quality radar (radial chart with 4 pollutants) on a canvas and renders pollutant details in a separate HTML element.

## Dependencies

### state
| Property | Access (R/W) | Context |
|-----------|-------------|----------|
| `state.theme` | read | label shadow color |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../store.js` | `state` | theme access |

## Public API

### `export function drawAQIRadar(data, targetId?, detailsId?): void`

**Description:** Draws 4-axis diamond radar with PM10, PM2.5, O3, NO2 normalized values.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `data` | `Object` | Object with `aqiDetails: { pm10, pm2_5, ozone, nitrogen_dioxide }` |
| `targetId` | `string` | Canvas element ID (default `'aqi-radar'`) |
| `detailsId` | `string` | Details element ID (default `'aqi-details'`) |

**Return:** `void`

**Mutates state:** No

**Async:** No

## Behavior

1. 4-axis diamond reference grid with 3 concentric polygons (radius 60, divided into 3 rings)
2. Axis lines drawn from center to each corner
3. Labels (PM10, PM2.5, O3, NO2) positioned outside the diamond with text shadow based on theme
4. Semi-transparent red (`rgba(239,68,68,0.6)`) data polygon filled and stroked with `#ef4444`
5. Details rendered as innerHTML in the target element — each pollutant shown as `name: val.toFixed(1) µg/m³`
6. Canvas cleared each call with `clearRect`
7. Font: `bold 9px Inter`, fill: `var(--text-primary)`, aligned center/middle

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `data = null` / `undefined` | Returns without drawing, no throw |
| `targetId` does not exist in DOM | Returns without drawing, no throw |
| Canvas 2D context not available | Returns without drawing, no throw |
| `aqiDetails` missing or undefined | Returns without drawing |
| All pollutant values 0 | Polygon drawn at center (all normalized to 0) |
| Pollutant value exceeds max | Clamped to `radius` via `Math.min(radius, val/max * radius)` |
| Negative pollutant values | Treated as 0 via `\|\| 0` |

## Test Scenarios

1. **Canvas does not exist:** Does not throw
2. **Without aqiDetails:** Returns without drawing
3. **Four axes:** PM10, PM2.5, O3, NO2
4. **Data area:** Polygon of normalized values
5. **Details formatting:** Values shown with `toFixed(1)` and `µg/m³` unit

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-06-02 | Corrected "circle" → "polygon reference grid", added detail formatting (toFixed(1)), added pollutant max clamping | SDD |
| 2026-05-21 | Initial spec | SDD |
