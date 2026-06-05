# Spec: Cielo Mediterráneo Color Palette Implementation

## Purpose

Replace the current muted/dark color palette with a vibrant, natural palette inspired by Mediterranean skies, and remove unused humidity rendering code to clean up dead code.

## Scope

This specification covers two areas:

1. **Code Cleanup**: Remove unused humidity rendering (`HumidityRenderer.js` and all references)
2. **Palette Implementation**: Update all renderers and theme JSON files with the "Cielo Mediterráneo" color palette

## Dependencies

### state

| Property | Access (R/W) | Context |
|-----------|-------------|----------|
| `state.hourlyData` | read | All renderers read hourly data for drawing |
| `state.theme` | read | BackgroundRenderer, PrecipProbabilityRenderer, WindRenderer, MinimapRenderer check theme |
| `state.themeConfig` | read | All renderers use `getThemeColor()` which reads themeConfig |
| `state.sunData` | read | BackgroundRenderer reads sun data for sunrise/sunset |
| `state.dpr` | read | MinimapRenderer uses device pixel ratio |

### CONFIG

| Constant | Context |
|-----------|----------|
| (none specific) | Renderers use local PIXELS_PER_HOUR parameter |

### DOM

| Element | Access type | Context |
|----------|---------------|----------|
| `#minimap-container` | querySelector | MinimapRenderer calculates scroll position |

### Internal modules

| Module | Export used | Purpose |
|--------|-------------|----------|
| `src/store.js` | `state` | Mutable application state |
| `src/theme.js` | `getThemeColor`, `getThemeIcon`, `getThemeFont` | Theme color/icon/font access |
| `src/utils/math.js` | `normalizeY` | Temperature/Y normalization |
| `src/utils/time.js` | `getSplitIndex` | Minimap past/future split |
| `src/utils/i18n.js` | `getLocale` | Sun marker localization |
| `src/render/MoonRenderer.js` | `drawMoon` | Moon rendering (BackgroundRenderer) |
| `src/render/SunMarkers.js` | `drawSunMarkersOnCanvas` | Sun marker rendering |

---

## Area 1: Code Cleanup — Remove Unused Humidity Rendering

### Files to Delete

| File | Reason |
|------|--------|
| `src/render/metrics/HumidityRenderer.js` | Defined but never called from main render pipeline |
| `specs/render/metrics/HumidityRenderer.md` | Spec for deleted module |

### Files to Modify

| File | Change |
|------|--------|
| `src/render/MetricsRenderer.js` | Remove `export { drawHumidity }` line |
| `src/render/__render_tests.test.js` | Remove `drawHumidity` re-export test (lines 141-146) |
| `src/render/metrics/__metrics_tests.test.js` | Remove `HumidityRenderer` describe block (lines 42-56) |
| `src/theme.js` | Remove `humidityLine` from fallback themeConfig object |
| `public/themes/default.json` | Remove `"humidityLine"` key from `colors` |
| `public/themes/neon.json` | Remove `"humidityLine"` key from `colors` |
| `public/themes/pastel.json` | Remove `"humidityLine"` key from `colors` |

### Notes

- The `humidity` property in `state.hourlyData` entries (set by `DataProcessor.js`) is NOT removed — it remains available for potential future use (e.g., YIP parameter display, tooltips)
- `src/utils/thresholds.js` humidity case is NOT removed — it's used by YIP and other systems
- The `relative_humidity_2m` API field is NOT removed from weather data fetching

---

## Area 2: Cielo Mediterráneo Color Palette

### Complete Palette Definition

#### Backgrounds & Atmosphere

| Element | Color | Notes |
|---------|-------|-------|
| Day BG | `#E8F4FD` | Light sky blue |
| Night BG | `#1A2744` | Deep blue |
| Night overlay | `rgba(26, 39, 68, 0.15)` | Semi-transparent night |
| Sunrise/Sunset gradient | `#FFDDBA` | Soft peach |

#### Clouds (Dynamic by Density)

| Density | Color |
|---------|-------|
| Thin clouds | `rgba(180, 210, 235, 0.45)` |
| Medium clouds | `rgba(140, 180, 210, 0.55)` |
| Dense clouds | `rgba(100, 145, 180, 0.65)` |

#### Rain

| Element | Color |
|---------|-------|
| Prob. rain (area fill) | `rgba(30, 144, 200, 0.12)` |
| Prob. rain (stroke line) | `rgba(30, 144, 200, 0.75)` |
| Rain bars (fill) | `rgba(30, 130, 190, 0.45)` |
| Rain bars (stroke) | `rgba(30, 130, 190, 0.80)` |
| Rain drop icon | `#FFFFFF` / `#1E82BE` |

#### Snow

| Element | Color |
|---------|-------|
| Prob. snow (area fill) | `rgba(200, 215, 230, 0.12)` |
| Prob. snow (stroke line) | `rgba(200, 215, 230, 0.75)` |
| Snow bars (fill) | `rgba(180, 200, 220, 0.40)` |
| Snow bars (stroke) | `rgba(180, 200, 220, 0.80)` |
| Snow flake icon | `#FFFFFF` / `rgba(100, 130, 160, 0.8)` |

#### Thunder

| Element | Color |
|---------|-------|
| Prob. thunder (area fill) | `rgba(100, 80, 160, 0.10)` |
| Prob. thunder (stroke line) | `rgba(100, 80, 160, 0.70)` |
| Thunder bars (fill) | `rgba(80, 70, 150, 0.40)` |
| Thunder bars (stroke) | `rgba(80, 70, 150, 0.80)` |
| Lightning bolt icon | `#FDE047` / `rgba(80, 70, 150, 0.8)` |

#### Wind

| Element | Color |
|---------|-------|
| Arrows (normal, day) | `#6B8DAD` |
| Arrows (normal, night) | `#A8C4D8` |
| Arrows (cold, <10°) | `#4A9FD9` |
| Arrows (hot, >28°) | `#E8734A` |
| Gusts normal (35-50) | `#6B8DAD` |
| Gusts strong (50-70) | `#E8734A` |
| Gusts extreme (>70) | `#D94040` |

#### Temperature

| Element | Color |
|---------|-------|
| Temperature line | `#D94040` |
| Apparent temp (cold) | `#4A9FD9` |
| Apparent temp (hot) | `#E8734A` |
| Shadow (rain) | `rgba(30, 144, 200, 0.30)` |
| Shadow (clouds) | `rgba(0, 0, 0, 0.20)` |
| Glow day (sun) | `#FF9F43` |
| Glow night (moon) | `#C8D6E5` |

#### UV Index

| Level | Color |
|-------|-------|
| Low (0-2) | `#4CAF50` |
| Moderate (3-5) | `#FBC02D` |
| High (6-7) | `#F57C00` |
| Very High (8-10) | `#D94040` |
| Extreme (11+) | `#8E44AD` |

#### Other Elements

| Element | Color |
|---------|-------|
| Zero line | `rgba(30, 144, 200, 0.70)` |
| Sun (marker fill) | `#FDD835` |
| Sun (rays) | `#FFF59D` |
| Moon (fill) | `#F5F5F5` |
| Moon (glow) | `rgba(144, 202, 249, 0.20)` |
| Stars | `#FFFFFF` |

#### Minimap

| Element | Color |
|---------|-------|
| Day BG (mini) | `#FEFCF3` |
| Night BG (mini) | `#EDE4F7` |
| Clouds (mini) | `rgba(100, 145, 180, 0.25)` |
| "Now" line | `#EF4444` |

---

## Behavior

### CloudRenderer.js Changes

1. **Replace grayscale luma calculation** with dynamic blue palette based on cloud density
2. **Gradient stops** use density-based colors:
   - Thin clouds (0-33%): `rgba(180, 210, 235, 0.45)`
   - Medium clouds (34-66%): `rgba(140, 180, 210, 0.55)`
   - Dense clouds (67-100%): `rgba(100, 145, 180, 0.65)`
3. **Overlay layers** (offset paths) use white-to-blue tones instead of pure white/gray
4. **Stroke gradient** uses blue-toned gradient instead of gray luma

### PrecipProbabilityRenderer.js Changes

1. **Replace hardcoded rain colors** (`r=2, g=136, b=209`) with new palette:
   - Rain: `rgba(30, 144, 200, ...)` for area/stroke
2. **Replace hardcoded snow colors** (`r=148, g=163, b=184`) with new palette:
   - Snow: `rgba(200, 215, 230, ...)` for area/stroke
3. **Replace hardcoded thunder colors** (`r=94, g=53, b=177`) with new palette:
   - Thunder: `rgba(100, 80, 160, ...)` for area/stroke
4. **Update scattered precipitation icons** (rain drops, snow flakes, lightning) with new palette colors
5. **Remove `isDark` conditional logic** — palette is theme-independent (colors are explicit)

### AtmosphereRenderer.js Changes

1. **Precipitation bars** — update `drawRain`, `drawSnow`, `drawThunder` functions:
   - `drawRain`: Use `rgba(30, 130, 190, 0.45)` fill, `rgba(30, 130, 190, 0.80)` stroke, `#1E82BE` icon
   - `drawSnow`: Use `rgba(180, 200, 220, 0.40)` fill, `rgba(180, 200, 220, 0.80)` stroke, `rgba(100, 130, 160, 0.8)` icon
   - `drawThunder`: Use `rgba(80, 70, 150, 0.40)` fill, `rgba(80, 70, 150, 0.80)` stroke, `#FDE047` icon
2. **Remove `isDark` conditional** in base/stroke color selection — use explicit palette colors
3. **Re-export** `drawClouds` and `drawPrecipitationProbability` unchanged (delegated to their modules)

### BackgroundRenderer.js Changes

1. **Gust colors** — replace hardcoded values with palette:
   - Normal (35-50): `#6B8DAD`
   - Strong (50-70): `#E8734A`
   - Extreme (>70): `#D94040`
2. **Night overlay gradient** — update colors:
   - Day-to-night transition: `#E8F4FD` → `#FFDDBA` → `#1A2744`
   - Solid night: `#1A2744`
3. **Night shadow** — update from `rgba(0, 0, 20, 0.15)` to `rgba(26, 39, 68, 0.15)`
4. **Sun glow** — update from `#fffde7` to `#E8F4FD`
5. **UV segments** — colors remain theme-keyed (no change needed)
6. **Stars** — remain `#FFFFFF` (no change needed)
7. **Sun marker** — update to `#FDD835` fill, `#FFF59D` rays

### WindRenderer.js Changes

1. **Default wind colors** — update via theme keys:
   - `wind.normalLight`: `#6B8DAD`
   - `wind.normalDark`: `#A8C4D8`
   - `wind.cold`: `#4A9FD9`
   - `wind.hot`: `#E8734A`
2. **Strong wind colors** — update via theme keys:
   - `wind.strongDefaultLight`: `#E8734A`
   - `wind.strongDefaultDark`: `#E8734A`

### TemperatureRenderer.js Changes

1. **Temperature line** — update via theme key `tempLine`: `#D94040`
2. **Apparent temperature (cold)** — update from `#0288d1` to `#4A9FD9`
3. **Apparent temperature (hot)** — update hardcoded colors to `#E8734A`
4. **Wet overlay (rain)** — update from `rgba(13, 71, 161, ...)` to `rgba(30, 144, 200, ...)`
5. **Wet overlay (snow)** — update from `rgba(0, 220, 255, ...)` to `rgba(200, 215, 230, ...)`
6. **Cloudy shadow** — keep `rgba(0, 0, 0, 0.20)` (unchanged)
7. **Sun glow** — update from `rgba(255, 140, 0, 1)` to `#FF9F43`
8. **Moon glow** — update from `rgba(255, 255, 255, 1)` to `#C8D6E5`

### MinimapRenderer.js Changes

1. **Day background** — update from `#fffde7` to `#FEFCF3`
2. **Night background** — update from `#f3e8ff` to `#EDE4F7`
3. **Cloud overlay** — update from `rgba(100, 116, 139, ...)` to `rgba(100, 145, 180, ...)`
4. **Zero line** — update from `rgba(2, 136, 209, 0.4)` to `rgba(30, 144, 200, 0.70)`
5. **Temperature line** — update from `#d32f2f` to `#D94040`
6. **Precipitation colors** — update rain/snow/thunder base colors to palette values
7. **"Now" line** — remains `#EF4444` (unchanged)

### Theme JSON Files Changes

All three theme files (`default.json`, `neon.json`, `pastel.json`) need:

1. **Remove** `"humidityLine"` key
2. **Update** `"tempLine"` to `#D94040`
3. **Update** `"precipBar"` to `rgba(30, 130, 190, 0.45)`
4. **Update** `"precipProbArea"` to `rgba(30, 144, 200, 0.12)`
5. **Update** `"cloudsArea"` to `rgba(100, 145, 180, 0.25)`
6. **Update** `"wind.normalLight"` to `#6B8DAD`
7. **Update** `"wind.normalDark"` to `#A8C4D8`
8. **Update** `"wind.cold"` to `#4A9FD9`
9. **Update** `"wind.hot"` to `#E8734A`
10. **Update** `"wind.strongDefaultLight"` to `#E8734A`
11. **Update** `"wind.strongDefaultDark"` to `#E8734A`
12. **Update** `"gusts.normal"` to `#6B8DAD`
13. **Update** `"gusts.strong"` to `#E8734A`
14. **Update** `"gusts.extreme"` to `#D94040`
15. **Update** `"uvLevels.veryHigh"` to `#D94040`
16. **Update** `"uvLevels.extreme"` to `#8E44AD`
17. **Update** `"zeroLine"` to `rgba(30, 144, 200, 0.70)`
18. **Update** `"zeroLineIcon"` to `#1E82BE`

### theme.js Fallback Object

Update the hardcoded fallback object in `loadChartTheme()` to match the new palette.

---

## Edge Cases

| Input | Expected behavior |
|-------|-------------------|
| No theme loaded (fallback) | Uses hardcoded palette values from theme.js fallback object |
| Theme with missing keys | `getThemeColor()` returns the second argument (fallback color) |
| Empty `hourlyData` | All renderers return early without drawing |
| All-night or all-day data | Background renders correctly for single-period data |
| Extreme cloud values (0% or 100%) | Cloud renderer clamps to palette boundaries |
| Mixed precipitation types | Each hour's weather code determines which palette subset applies |

---

## Test Scenarios

### Area 1: Humidity Cleanup

1. **MetricsRenderer exports**: Import `MetricsRenderer.js` → does NOT export `drawHumidity`
2. **Theme files**: Read all three JSON files → no `humidityLine` key present
3. **theme.js fallback**: Fallback object does NOT contain `humidityLine`
4. **No broken imports**: `npm run lint` passes with 0 errors
5. **No type errors**: `npm run typecheck` passes

### Area 2: Palette Implementation

6. **CloudRenderer density**: Cloud fill uses blue-toned gradient, not gray
7. **PrecipProbabilityRenderer rain**: Rain area fill uses `rgba(30, 144, 200, ...)`
8. **PrecipProbabilityRenderer snow**: Snow area fill uses `rgba(200, 215, 230, ...)`
9. **PrecipProbabilityRenderer thunder**: Thunder area fill uses `rgba(100, 80, 160, ...)`
10. **AtmosphereRenderer rain bars**: Fill `rgba(30, 130, 190, 0.45)`, stroke `rgba(30, 130, 190, 0.80)`
11. **AtmosphereRenderer snow bars**: Fill `rgba(180, 200, 220, 0.40)`, stroke `rgba(180, 200, 220, 0.80)`
12. **AtmosphereRenderer thunder bars**: Fill `rgba(80, 70, 150, 0.40)`, stroke `rgba(80, 70, 150, 0.80)`
13. **BackgroundRenderer gusts**: Normal `#6B8DAD`, strong `#E8734A`, extreme `#D94040`
14. **BackgroundRenderer night overlay**: Uses `rgba(26, 39, 68, 0.15)`
15. **WindRenderer arrows**: Day `#6B8DAD`, night `#A8C4D8`, cold `#4A9FD9`, hot `#E8734A`
16. **TemperatureRenderer line**: `#D94040`
17. **MinimapRenderer day BG**: `#FEFCF3`
18. **MinimapRenderer night BG**: `#EDE4F7`
19. **Theme JSON consistency**: All three themes have identical key structure (only color values differ)
20. **Full verification**: `npm run lint && npm run typecheck && npm test && npm run test:e2e` all pass

---

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-06-05 | Initial spec — Cielo Mediterráneo palette + humidity cleanup | SDD |
