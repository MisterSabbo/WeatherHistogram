# Tasks: Atmospheric Palette Selector

## Execution Order
Tasks must be executed in order. Parallel tasks marked with `[P]`.

### Phase 1: Data Layer & State
- [ ] `1` Add `activeAtmosphericPalette: 'classic'` to state — `src/store.js` — State has new property, defaults to `'classic'`
- [ ] `2` Create palette definitions module — `src/data/atmosphericPalettes.js` — Exports `ATMOSPHERIC_PALETTES` (frozen object with `classic`, `warm`, `cold` palettes) and `getAtmosphericColor(key)` function. Classic palette values match current hardcoded renderer values exactly. Includes `initAtmosphericPaletteSelector()` for UI.

### Phase 2: Renderer Integration [P]
- [ ] `[P]` `3` Replace hardcoded colors in AtmosphereRenderer — `src/render/AtmosphereRenderer.js` — Import `getAtmosphericColor`; replace rain bar/stroke, snow bar/stroke/flake, thunder bar/stroke/bolt colors with palette lookups. Classic palette output must match previous hardcoded values identically.
- [ ] `[P]` `4` Replace hardcoded colors in CloudRenderer — `src/render/CloudRenderer.js` — Import `getAtmosphericColor`; replace cloud fill RGB objects (light/medium/heavy) and cloud stroke RGB objects with palette lookups. Cloud layer colors remain as palette sub-objects.
- [ ] `[P]` `5` Replace hardcoded colors in PrecipProbabilityRenderer — `src/render/PrecipProbabilityRenderer.js` — Import `getAtmosphericColor`; replace probability area fill/stroke RGB values (rain, snow, thunder) with palette lookups.
- [ ] `[P]` `6` Replace hardcoded colors in BackgroundRenderer — `src/render/BackgroundRenderer.js` — Import `getAtmosphericColor`; replace sky color, sun fill/ray, night fill, night transition mid, and night shadow colors with palette lookups.
- [ ] `[P]` `7` Replace hardcoded colors in MinimapRenderer — `src/render/MinimapRenderer.js` — Import `getAtmosphericColor`; replace sky/night background colors in minimap drawing with palette lookups.

### Phase 3: App Init & Persistence
- [ ] `8` Load persisted palette in initStorage — `src/app.js` — In `initStorage()`, read `'atmosphericPalette'` from StorageService, set `state.activeAtmosphericPalette`. Also handle localStorage migration for legacy key if present.
- [ ] `9` Call initAtmosphericPaletteSelector in init sequence — `src/app.js` — Import `initAtmosphericPaletteSelector` from palette module, call it in `init()` after theme selector init. Ensure `tiles`, `minimapRenderer`, `render` are accessible.

### Phase 4: UI — DOM & Bottom Sheet
- [ ] `10` Add palette selector DOM in index.html — `index.html` — Add palette selector row below theme selector in Appearance section (clickable row with label, current name, swatch, chevron). Add palette bottom sheet + backdrop after theme-select-sheet.
- [ ] `11` Add i18n strings — `src/utils/i18n.js` — Add keys: `config.atmoPaletteTitle` ("Paleta atmosférica" / "Atmospheric palette"), `config.atmoPaletteClassic` ("Clásico" / "Classic"), `config.atmoPaletteWarm` ("Cálida" / "Warm"), `config.atmoPaletteCold` ("Fría" / "Cold"), and `config.atmoPaletteSelectTitle` ("Seleccionar paleta" / "Select palette").

### Phase 5: E2E Tests
- [ ] `12` Add E2E interaction test — `tests/e2e/interaction/atmo-palette-selector.test.js` — Test: open palette selector, click a palette, verify state updates, verify re-render occurs, verify persistence across reload.
- [ ] `13` Add E2E visual test — `tests/e2e/visual/atmo-palette-selector.test.js` — Visual comparison of chart with non-default palette applied. Update mock data in `tests/e2e/helpers/mock-data.js` if needed.

### Phase 6: Changelog & Version
- [ ] `14` Update CHANGELOG.md — `CHANGELOG.md` — Add entry for atmospheric palette selector feature.
- [ ] `15` Update changelog.js — `src/data/changelog.js` — Add matching embedded changelog entry.
- [ ] `16` Bump version — `index.html` + `public/version.json` — Increment minor version (new feature).

### Phase 7: Verification
- [ ] `17` Run lint — `npm run lint` — 0 warnings, 0 errors
- [ ] `18` Run typecheck — `npm run typecheck` — Clean
- [ ] `19` Run unit tests — `npm test` — All tests pass
- [ ] `20` Run E2E tests — `npm run test:e2e` — All tests pass
- [ ] `21` Run build — `npm run build` — Production build succeeds
- [ ] `22` Update snapshots — `npx playwright test --update-snapshots` — Visual snapshots regenerated with new palette colors
