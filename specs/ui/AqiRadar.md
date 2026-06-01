# Spec: `src/ui/AqiRadar.js`

## Purpose
Draws an air quality radar (radial chart with 4 pollutants) on a canvas.

## Dependencies

### state
| Property | Access | Context |
|-----------|--------|----------|
| `state.theme` | read | label shadow |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../store.js` | `state` | access |

## Public API

### `export function drawAQIRadar(data, targetId?, detailsId?): void`

**Description:** Draws radar with PM10, PM2.5, O3, NO2.

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `Object` | Data with `aqiDetails: { pm10, pm2_5, ozone, nitrogen_dioxide }` |
| `targetId?` | `string` | Canvas ID to draw on (default `'aqi-radar'`) |
| `detailsId?` | `string` | Details element ID (default `'aqi-details'`) |

**Metadata:**
- Mutates state: No
- Async: No

## Behavior

1. 4 axes in diamond/square shape
2. 3 concentric reference circles
3. Semi-transparent red data area
4. Labels with shadow based on theme
5. Details in separate HTML element

## Test Scenarios

1. **Canvas does not exist:** does not throw
2. **Without aqiDetails:** returns without drawing
3. **Four axes:** PM10, PM2.5, O3, NO2
4. **Data area:** polygon of normalized values

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `data = null` / `undefined` | Does not throw, returns without drawing |
| `targetId` does not exist in DOM | Does not throw, returns without drawing |
| `aqiDetails` with values 0 | Draws polygon at center (all normalized to 0) |
| `aqiDetails` with negative values | Treats as 0, does not throw |
| Canvas 2D context not available (`null`) | Does not throw, returns without drawing |

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
