# Plan: Cielo Mediterráneo Color Palette Implementation

## Spec Reference
`specs/cielo-mediterraneo.md`

## Technical Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Delete HumidityRenderer | Remove file + all references | Unused in render pipeline; dead code cleanup before palette work |
| Replace hardcoded colors | Direct hex/rgba literals in renderer files | Spec defines exact values per element; theme JSON serves as runtime override only |
| Remove `isDark` conditionals in PrecipProbabilityRenderer & AtmosphereRenderer | Use explicit palette colors | Palette is theme-independent per spec; simplifies code |
| Update theme.js fallback object | Mirror new palette values | Ensures fallback when no theme JSON is loaded |
| Update all 3 theme JSONs uniformly | Same key structure, identical color values | Consistent baseline; individual themes can diverge later |

## Architecture
- **Area 1 (Cleanup):** Delete `src/render/metrics/HumidityRenderer.js` + `specs/render/metrics/HumidityRenderer.md`. Remove export from `MetricsRenderer.js`. Remove `humidityLine` from theme fallback + all 3 JSONs. Remove related test blocks.
- **Area 2 (Palette):** Update hardcoded color values in 7 renderer files (`CloudRenderer.js`, `PrecipProbabilityRenderer.js`, `AtmosphereRenderer.js`, `BackgroundRenderer.js`, `WindRenderer.js`, `TemperatureRenderer.js`, `MinimapRenderer.js`) and the theme fallback in `theme.js`. Update 3 theme JSON files with new palette keys.

## Files to Change
| File | Action | Description |
|------|--------|-------------|
| `src/render/metrics/HumidityRenderer.js` | delete | Unused renderer |
| `specs/render/metrics/HumidityRenderer.md` | delete | Spec for deleted module |
| `src/render/MetricsRenderer.js` | modify | Remove `drawHumidity` re-export |
| `src/render/__render_tests.test.js` | modify | Remove `drawHumidity` test (lines 141-146) |
| `src/render/metrics/__metrics_tests.test.js` | modify | Remove `HumidityRenderer` describe block (lines 42-59) |
| `src/theme.js` | modify | Update fallback `colors` object: remove `humidityLine`, update palette values |
| `public/themes/default.json` | modify | Remove `humidityLine`, update palette keys |
| `public/themes/neon.json` | modify | Remove `humidityLine`, update palette keys |
| `public/themes/pastel.json` | modify | Remove `humidityLine`, update palette keys |
| `src/render/CloudRenderer.js` | modify | Replace grayscale luma with blue density-based palette |
| `src/render/PrecipProbabilityRenderer.js` | modify | Replace hardcoded rain/snow/thunder colors; remove `isDark` |
| `src/render/AtmosphereRenderer.js` | modify | Update precipitation bar colors; remove `isDark` |
| `src/render/BackgroundRenderer.js` | modify | Update gust colors, night overlay gradient, sun glow, sun marker |
| `src/render/metrics/WindRenderer.js` | modify | Update wind arrow/gust colors via theme keys |
| `src/render/metrics/TemperatureRenderer.js` | modify | Update temperature line, apparent temp, wet overlay, glow colors |
| `src/render/MinimapRenderer.js` | modify | Update day/night BG, clouds, zero line, temp line, precip colors |

## Dependencies
- **Internal:** `src/store.js` (state), `src/theme.js` (getThemeColor), `src/utils/math.js` (normalizeY)
- **External:** None

## Risk Areas
- **E2E snapshot drift:** All visual tests will produce different screenshots → must run `npx playwright test --update-snapshots`
- **Theme divergence:** neon/pastel currently have unique palettes; overwriting with Cielo Mediterráneo values removes their identity. Consider whether neon/pastel should retain their own colors (spec says "all three theme files need" the same updates — follow spec)
- **Fallback object in theme.js:** Must match new palette exactly or runtime fallback colors will be stale
