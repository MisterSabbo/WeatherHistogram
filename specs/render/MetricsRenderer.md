# Spec: `src/render/MetricsRenderer.js`

## Purpose
Barrel re-export for metric renderers (humidity, wind, temperature).

## Dependencies

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `./metrics/HumidityRenderer.js` | `drawHumidity` | re-export |
| `./metrics/WindRenderer.js` | `drawWind` | re-export |
| `./metrics/TemperatureRenderer.js` | `drawTemperature` | re-export |

## Public API

### `export { drawHumidity, drawWind, drawTemperature }`

**Description:** Barrel re-export of metric renderers.

**Metadata:**
- Mutates state: No
- Async: No

## Behavior

1. Barrel module: re-exports `drawHumidity`, `drawWind`, `drawTemperature` from metrics/ modules.
2. Has no logic of its own; all exports are delegated.

## Test Scenarios

1. **Correct exports:** drawHumidity, drawWind, drawTemperature are functions

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| Module imported without calling | Does not throw, exports are functions |
| Any export is `undefined` | Fails when trying to call (not controlled here) |

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
