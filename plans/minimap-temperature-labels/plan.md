# Plan: Minimap Temperature Labels

## Spec Reference
`specs/render/MinimapTemperatureLabels.md`

## Technical Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Module location | New `src/render/MinimapTemperatureLabels.js` | Follows existing pattern (each render concern in its own file under `src/render/`) |
| Class API | `constructor()` + `draw(ctx, data, width, height, step)` | Matches spec — no constructor args, all config is internal |
| Extrema detection | Full scan with plateau detection | First point of plateau is chosen as extremum; handles edge indices |
| Significance filter | Walk sorted extrema, cumulative diff from previous kept | Guarantees threshold is relative to last *shown* label, not raw neighbor |
| Shadow halo | `ctx.shadowColor='white'`, `ctx.shadowBlur=3` | Matches spec; ensures legibility over red line, precip bars, or clouds |
| Color scheme | Unified: `getThemeColor('tempLine', '#d32f2f')` for both peaks and valleys | Uses temperature curve color for consistency |
| Integration | Owned by `MinimapRenderer` internally | No wiring in `app.js`; constructor creates it, `draw()` calls it |

## Architecture

### New module: `src/render/MinimapTemperatureLabels.js`
- `class MinimapTemperatureLabels` with internal constants:
  - `#significanceThreshold = 5` (°C)
  - `#minPixelsBetweenLabels = 40` (px)
  - `#tempRange = { min: -20, max: 40 }` (°C)
- `draw()` method:
  1. Guard: if `!ctx` or `data.length < 3` → return
  2. Set unified `tempLine` color for all labels
  3. Detect local extrema (max/min with plateau handling)
  4. Filter by significance (cumulative diff ≥ 5°C)
  5. Filter by collision (x distance ≥ 40px)
  6. Position labels close to curve: peaks -4px above (bottom baseline), valleys +5px below (top baseline); adaptive flip for extreme Y positions
  7. Draw labels with shadow halo
  8. Save/restore ctx

### Modified module: `src/render/MinimapRenderer.js`
- Import `MinimapTemperatureLabels` at top
- In constructor: `this.tempLabelRenderer = new MinimapTemperatureLabels()`
- In `draw()`: insert call between UV bars (line 274) and "now" indicator (line 276)

## Files to Change
| File | Action | Description |
|------|--------|-------------|
| `src/render/MinimapTemperatureLabels.js` | **Create** | New class for extrema detection + label rendering |
| `src/render/MinimapTemperatureLabels.test.js` | **Create** | Unit tests for all 12 scenarios + edge cases |
| `src/render/MinimapRenderer.js` | **Modify** | Instantiate and wire the label renderer into `draw()` |

## Dependencies
- Internal: `src/utils/math.js` → `normalizeY`; `src/theme.js` → `getThemeColor`, `getThemeFont`
- None external

## Risk Areas
- **None.** This is a pure visual addition with no state mutation, no data fetching, and no breaking changes. The cache canvas already invalidates on data/theme changes so labels auto-refresh.
