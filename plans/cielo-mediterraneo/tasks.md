# Tasks: Cielo Mediterráneo Color Palette Implementation

## Execution Order
Tasks must be executed in order. Parallel tasks marked with `[P]`.

### Phase 1: Humidity Cleanup
- [ ] Delete `src/render/metrics/HumidityRenderer.js` — unused renderer module
- [ ] Delete `specs/render/metrics/HumidityRenderer.md` — spec for deleted module
- [ ] Remove `drawHumidity` re-export from `src/render/MetricsRenderer.js` — line 1
- [ ] Remove `HumidityRenderer` describe block (lines 42-59) from `src/render/metrics/__metrics_tests.test.js`
- [ ] Remove `drawHumidity` re-export test (lines 141-146) from `src/render/__render_tests.test.js`
- [ ] Remove `humidityLine` from theme fallback in `src/theme.js` (line 48, inside the `colors` object)
- [ ] Remove `"humidityLine"` key from `public/themes/default.json`
- [ ] Remove `"humidityLine"` key from `public/themes/neon.json`
- [ ] Remove `"humidityLine"` key from `public/themes/pastel.json`
- [ ] Run `npm run lint && npm run typecheck && npm test` — verify no broken imports

### Phase 2: Theme JSON Updates
- [ ] Update `public/themes/default.json` — replace palette values with Cielo Mediterráneo colors
- [ ] Update `public/themes/neon.json` — replace palette values with Cielo Mediterráneo colors
- [ ] Update `public/themes/pastel.json` — replace palette values with Cielo Mediterráneo colors
- [ ] Update fallback `colors` object in `src/theme.js` `loadChartTheme()` — match new palette

### Phase 3: Renderer Palette Updates
- [ ] `[P]` Update `src/render/CloudRenderer.js` — replace grayscale luma with blue density palette
- [ ] `[P]` Update `src/render/PrecipProbabilityRenderer.js` — replace hardcoded rain/snow/thunder colors, remove `isDark` conditionals
- [ ] `[P]` Update `src/render/AtmosphereRenderer.js` — update precipitation bar colors, remove `isDark` conditionals
- [ ] `[P]` Update `src/render/BackgroundRenderer.js` — update gust colors, night overlay gradient, sun glow, sun marker
- [ ] `[P]` Update `src/render/metrics/WindRenderer.js` — update wind arrow/gust colors
- [ ] `[P]` Update `src/render/metrics/TemperatureRenderer.js` — update temp line, apparent temp, wet overlay, glow
- [ ] `[P]` Update `src/render/MinimapRenderer.js` — update day/night BG, clouds, zero line, temp line, precip colors

### Phase 4: Verification
- [ ] Run `npm run lint` — 0 warnings, 0 errors
- [ ] Run `npm run typecheck` — clean
- [ ] Run `npm test` — all tests pass
- [ ] Run `npm run test:e2e` — all E2E tests pass
- [ ] Run `npx playwright test --update-snapshots` — regenerate visual baselines if colors changed
- [ ] Run `npm run build` — production build succeeds
- [ ] Update `CHANGELOG.md` + `src/data/changelog.js` + version in `index.html` + `public/version.json`
