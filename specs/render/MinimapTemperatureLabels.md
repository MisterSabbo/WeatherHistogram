# Spec: `src/render/MinimapTemperatureLabels.js`

## Purpose

Detect local temperature extrema (peaks and valleys) in the minimap temperature curve and render value labels with intelligent filtering and collision avoidance, so users can read exact temperatures at the curve's turning points directly on the minimap.

## Dependencies

### state
| Property | Access (R/W) | Context |
|----------|-------------|---------|
| `state.themeConfig` | read | label font resolution via `getThemeFont()` |

### CONFIG
| Constant | Context |
|----------|---------|
| *(none)* | All dimensional parameters are received as arguments |

### DOM
| Element | Access type | Context |
|---------|-------------|---------|
| *(none)* | Renders to a provided CanvasRenderingContext2D | — |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|---------|
| `../utils/math.js` | `normalizeY` | Convert temperature value to canvas Y-coordinate |
| `../theme.js` | `getThemeColor` | Resolve theme-aware colors for labels |
| `../theme.js` | `getThemeFont` | Resolve theme font family for label text |

## Public API

### `class MinimapTemperatureLabels`

Encapsulates the detection and drawing of temperature extrema labels on the minimap.

---

### `constructor()`

**Description:** Creates a new label renderer instance with fixed internal configuration.

**Parameters:** None. All configuration is hardcoded:
- Temperature significance threshold: `3` °C
- Minimum pixels between labels: `40` px
- Temperature range for Y normalization: `-20` to `40` °C

**Mutates state:** No

---

### `draw(ctx: CanvasRenderingContext2D, data: Array<object>, width: number, height: number, step: number): void`

**Description:** Detects local temperature extrema in `data` and renders labels on the minimap. Must be called after the temperature curve has been stroked on the cache canvas.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `ctx` | `CanvasRenderingContext2D` | The 2D context of the minimap cache canvas (already scaled by DPR) |
| `data` | `Array<{temp: number}>` | The minimap data slice (past or future) |
| `width` | `number` | Canvas client width in CSS pixels |
| `height` | `number` | Minimap height in CSS pixels (typically `CONFIG.MINIMAP_HEIGHT` = 80) |
| `step` | `number` | Horizontal pixels per data point (`width / data.length`) |

**Mutates state:** No (only draws to the canvas context)

**Rendering constraints:**
- Must save/restore `ctx` state (so no side effects on caller's canvas state)
- Must not draw outside `[0, width] × [0, height]`

---

## Behavior

### 1. Extrema Detection

First, all temperatures are **rounded** via `Math.round(d.temp)` (stored as `temps` array), so detection operates on the same integer values displayed in labels.

A point `temps[i]` is a **local maximum** when:
- `i === 0` AND `temps[i] >= temps[i+1]` (first point is a maximum if it starts higher than the next)
- `i === data.length - 1` AND `temps[i] >= temps[i-1]` (last point)
- `temps[i] > temps[i-1]` AND `temps[i] >= temps[i+1]` (interior point)

A point `temps[i]` is a **local minimum** when:
- `i === 0` AND `temps[i] <= temps[i+1]`
- `i === data.length - 1` AND `temps[i] <= temps[i-1]`
- `temps[i] < temps[i-1]` AND `temps[i] <= temps[i+1]`

For **plateaus** (equal consecutive values): the first point of the plateau is chosen as the extremum.

### 2. Significance Filter (Threshold)

After detecting all local extrema, filter them using a **significance threshold** of `3` °C:

- Walk through the ordered list of detected extrema.
- The first extremum is always kept.
- For each subsequent extremum, compare its temperature against the **previous raw extremum** (not the last kept):
  - If `|currentTemp - prevRawTemp| ≥ 3` → **kept**.
  - If `< 3` AND the previous extremum was also **skipped** → **auto-kept** (prevents cascade effect).
  - If `< 3` AND the previous extremum was **kept** → **skipped**.
- `prevRawTemp` is always updated after each extremum (regardless of keep/skip).
- This eliminates micro-fluctuations while preventing cascade skipping.

**Example:** Given temperatures `[10, 15, 14, 16, 11, 18]`:
- Raw extrema: min(10, first, kept), max(15, diff 5 ≥ 3, kept), max(16, diff 1 < 3 & prev kept → skipped), min(11, diff 5 ≥ 3 from raw prev 16, kept), max(18, diff 7 ≥ 3 from raw prev 11, kept)
- Result: labels at 10°C, 15°C, 11°C, 18°C (4 labels — no cascade)

### 3. Label Format

Each label is drawn using the already-rounded temperature:
```
ex.temp + '°'
```
Example: `"22°"`, `"-3°"`, `"0°"`

### 4. Label Positioning

Labels are positioned close to the temperature curve:

- **Peaks (maxima):** normally drawn above the curve point (Y offset: `-4` pixels from the point's Y coordinate) with `textBaseline: 'bottom'`
- **Valleys (minima):** normally drawn below the curve point (Y offset: `+5` pixels from the point's Y coordinate) with `textBaseline: 'top'`
- **Text alignment:** `center` (horizontal), so the label is centered above/below the extremum point

**Adaptive flip:** If the preferred Y position for a peak falls below `4` (too close to the top edge), the label flips to draw **below** the point with `textBaseline: 'top'` and Y = `yRaw + 4`. Similarly, if the preferred Y position for a valley exceeds `height - 4` (too close to the bottom), the label flips to draw **above** the point with `textBaseline: 'bottom'` and Y = `yRaw - 4`. This ensures labels remain fully visible at extreme temperatures.

**Boundary clamping:** If the calculated Y position (after adaptive flip adjustment) still goes outside `[4, height-4]`, clamp it:
- If `y < 4` → set `y = 4`
- If `y > height - 4` → set `y = height - 4`

### 5. Collision Detection

After significance filtering and deduplication, perform a per-type collision check to prevent overlapping labels:

- Track `lastDrawnMaxX` and `lastDrawnMinX` independently (both initialised to `-Infinity`).
- For each significant extremum, compute its X position: `x = index * step`.
- If extremum is a **max**: check `x - lastDrawnMaxX < 40` px → skip.
- If extremum is a **min**: check `x - lastDrawnMinX < 40` px → skip.
- Otherwise, draw the label and update the corresponding tracker (`lastDrawnMaxX` or `lastDrawnMinX`).

Since peaks naturally draw above the curve and valleys below, alternating max/min labels don't visually collide even when close horizontally. Same-type collision only occurs when two maxima (or two minima) are within 40px.

### 6. Visual Styling

| Property | Value |
|----------|-------|
| Font | `bold 9px ${getThemeFont()}` (same size as date labels) |
| Fill style | `getThemeColor('tempLine', '#d32f2f')` for both peaks and valleys (matches the temperature curve color) |
| Text align | `'center'` |
| Text baseline | `'bottom'` for peaks (default, above point); `'top'` for valleys (default, below point); flips on adaptive repositioning |
| Shadow (for legibility) | A white/light halo: `ctx.shadowColor = 'white'`, `ctx.shadowBlur = 3`, then draw fillText. Then reset shadow. |

The shadow halo ensures labels are readable even when drawn over the red temperature line, precipitation bars, or cloud areas.

### 7. Deduplicate Same-Type Extrema

After significance filtering, consecutive same-type extrema may occur (e.g., two maxima when temperature rises, plateaus, and rises again without a valley). These are collapsed:

- Walk through the filtered list and compare each extremum with the previous one.
- If both are `max`: keep the one with the **higher** temperature.
- If both are `min`: keep the one with the **lower** temperature.
- If types differ: keep both.

This prevents displaying intermediate peaks on a rising trend — only the actual highest/lowest point is labeled.

**Example:** `[min(9), max(17), max(20)]` → collapses to `[min(9), max(20)]` (only the higher max is kept).

### 8. Integration With MinimapRenderer

The label drawing is called from `MinimapRenderer.draw()` **after** the past overlay (so labels are visible in past mode). Insertion point after the past overlay block and before the outer `ctx.restore()`.

Pseudo-insertion point in `MinimapRenderer.draw()`:
```
// Past overlay block
this.tempLabelRenderer.draw(ctx, minimapData, w, h, step);
// Outer ctx.restore()
```

`MinimapRenderer` instantiates `MinimapTemperatureLabels` **internally** in its constructor with no arguments:

```js
this.tempLabelRenderer = new MinimapTemperatureLabels();
```

No changes are required in `app.js` for wiring — the label renderer is created and owned by `MinimapRenderer`.

### 9. Cache Invalidation

Temperature labels are drawn on the cache canvas and do not require additional invalidation beyond what MinimapRenderer already handles. They are re-drawn whenever the minimap cache is invalidated (on data change, theme change, language change).

## Edge Cases

| Scenario | Expected behavior |
|----------|-------------------|
| `data.length < 3` | No extrema can be reliably detected; draw nothing |
| All temperatures identical (flat line) | Detection finds no significant extrema; draw nothing |
| Single extremum significant | Draw one label at that point |
| All extrema within threshold | First kept, subsequent may be auto-kept if previous was skipped |
| Extremum at first data point | Label drawn at x=0 with boundary clamping for Y |
| Extremum at last data point | Label drawn at x=(last*step) with boundary clamping |
| Very high temperature (near 40°C range max) | normalizeY places it near y=0; adaptive flip moves label below the curve point with textBaseline=top |
| Very low temperature (near -20°C range min) | normalizeY places it near y=height; adaptive flip moves label above the curve point |
| Two significant extrema closer than 40px | If same type → second skipped; if alternating types → both drawn |
| Data with rapid oscillations | Significance filter removes most noise; auto-keep prevents cascade skipping |
| `ctx` is null or undefined | Silently return (defensive guard) |
| DPR scaling | The `ctx` passed in is already DPR-scaled by the caller (MinimapRenderer scales its cache canvas context before calling this method) |
| Rising trend without valley | DeduplicateSameType collapses consecutive same-type extrema, keeping only the more extreme |
| Two identical-temp minima (same type) | DeduplicateSameType keeps only the first (or whichever has the lower temp, equal so first) |

## Test Scenarios

1. **Basic peaks and valleys:** Input `[10, 15, 10, 20, 10]` with threshold `3` → raw extrema: max(15, diff from 10 = 5 ≥ 3, kept), min(10, diff from 15 = 5 ≥ 3, kept), max(20, diff from 10 = 10 ≥ 3, kept), min(10, diff from 20 = 10 ≥ 3, kept). Labels at all four extrema.
2. **Filtered noise:** Input `[10, 11, 12, 11, 10, 20, 10]` with threshold `3` → raw extrema: max(12, diff from 10 = 2 < 3 → skipped, prev skipped auto-keep applies to next), min(10 at i=4, prev was skipped → auto-kept), max(20, diff from 10 = 10 ≥ 3, kept), min(10 at i=6, diff from 20 = 10 ≥ 3, kept). DeduplicateSameType collapses the two mins (both 10°C) → labels at 10°C, 20°C, 10°C.
3. **Flat line:** Input `[20, 20, 20, 20]` → no significant extrema → no labels drawn
4. **Short data:** Input `[15, 16]` (length < 3) → no labels drawn
5. **Plateau handling:** Input `[10, 15, 15, 15, 10]` → peak detected at index 1 (first of plateau) → label at 15°C
6. **Collision (per-type):** Alternating [10, 30, 10, 30, 10, 30, 10] with step ≈ 28.6px → all 7 labels drawn (alternating types never collide). Two separated maxima at same type only collide if < 40px apart.
7. **Boundary clamping:** Extremum at y=2 → label clamped to y=4
8. **Edge extrema:** Input `[20, 15, 10]` → max at index 0 (20°C), min at index 2 (10°C) → both labeled
9. **Empty data:** `data = []` → no labels drawn, no errors
10. **Two extrema:** Input `[10, 20, 10]` with threshold `3` → raw extrema: max(20, diff from 10 = 10 ≥ 3, kept), min(10, diff from 20 = 10 ≥ 3, kept). Labels at 20°C and 10°C.
11. **zero °C crossing:** Input contains a peak at exactly 0°C → label `"0°"` drawn
12. **Negative temperatures:** Input contains valley at -5°C → label `"-5°"` drawn
13. **Adaptive flip for extreme peaks:** Input contains a peak at 38°C (near range max) → `normalizeY` returns ~2.7 → offset -4 would give -1.3 < 4 → flips to below point with `textBaseline='top'`, Y clamped to `min(height-4, 2.7+4)` = 6.7
14. **Rising trend without valley:** Input `[9, 10, 13, 14, 16, 17, 17, 17, 18, 19, 20]` → raw extrema: min(9), max(17), max(20) → same-type dedup collapses to [min(9), max(20)]. Labels at 9°C and 20°C only.

## Change History

| Date | Change | Author |
|------|--------|--------|
| 2026-06-03 | v3 — Threshold 5→3°C, auto-keep on prev skip, per-type collision, deduplicateSameType, Math.round in detection, labels after past overlay | SDD |
| 2026-06-03 | v2 — Unified tempLine color, reduced offsets to -4/+5, added adaptive flip for extreme Y | SDD |
| 2026-06-03 | Initial spec | SDD |
