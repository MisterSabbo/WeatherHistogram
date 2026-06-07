# Tasks: Atmospheric Palette Redesign 2026

## Execution Order
Tasks must be executed in order. Parallel tasks marked with `[P]`.

### Phase 1: Palette Definitions
- [ ] `1` Update `classic` palette values to Realista spec — `src/data/atmosphericPalettes.js` — All colors replaced per spec table (daySky: `#87CEEB`, daySun: `#FFD700`, nightFill: `#1A2744` kept, etc.). Classic ID stays `classic`.
- [ ] `2` Rename `warm` → `vivid` with new palette values — `src/data/atmosphericPalettes.js` — Rename object key from `warm` to `vivid`, update `id` field, replace all color values with intense saturated spec values (purple-night `#1A0533`, saturated blues, etc.). Keep `original` palette unchanged.
- [ ] `3` Rename `cold` → `pastel` with new palette values — `src/data/atmosphericPalettes.js` — Rename object key from `cold` to `pastel`, update `id` field, replace all color values with soft pastel spec values (lavender night `#2E2252`, soft blues, etc.). Update icons.
- [ ] `4` Update `ATMOSPHERIC_PALETTES` frozen object — `src/data/atmosphericPalettes.js` — Replace `warm` key with `vivid`, replace `cold` key with `pastel`. Verify `classic` and `original` remain at correct positions.

### Phase 2: i18n
- [ ] `5` Update palette i18n strings — `src/utils/i18n.js` — Change `atmoPaletteClassic` es: "Realista", en: "Realistic". Replace `atmoPaletteWarm` → `atmoPaletteVivid` es: "Vívida", en: "Vivid". Replace `atmoPaletteCold` → `atmoPalettePastel` es: "Pastel", en: "Pastel". Remove old `atmoPaletteWarm`/`atmoPaletteCold` keys.

### Phase 3: Migration Logic
- [ ] `6` Add old-ID migration in `initStorage()` — `src/app.js` — After reading `'atmosphericPalette'` from StorageService, if the value is `'warm'` or `'cold'`, log a warning, set `state.activeAtmosphericPalette = 'classic'`, and persist `'classic'` back to storage. This handles the one-time upgrade path for users with the old IDs.

### Phase 4: E2E Tests [P]
- [ ] `[P]` `7` Update interaction E2E test — `tests/e2e/interaction/atmo-palette.spec.js` — Change `data-value="warm"` → `data-value="vivid"`, `data-value="cold"` → `data-value="pastel"`. Update expected label text: "Cálida" → "Vívida", "Fría" → "Pastel". Verify 4 palette options still display.
- [ ] `[P]` `8` Update visual E2E test — `tests/e2e/visual/atmo-palette.spec.js` — Change `data-value="warm"` → `data-value="vivid"`, `data-value="cold"` → `data-value="pastel"`. Update snapshot filenames from `atmo-palette-warm.png` → `atmo-palette-vivid.png`, `atmo-palette-cold.png` → `atmo-palette-pastel.png`.

### Phase 5: Changelog & Version
- [ ] `9` Update CHANGELOG.md — `CHANGELOG.md` — Document palette redesign: new Realista colors, Vívida (replaces Cálida), Pastel (replaces Fría), migration path for old IDs.
- [ ] `10` Update changelog.js — `src/data/changelog.js` — Add matching embedded changelog entry.
- [ ] `11` Bump version — `index.html` + `public/version.json` — Increment minor version.

### Phase 6: Verification
- [ ] `12` Run lint — `npm run lint` — 0 warnings, 0 errors
- [ ] `13` Run typecheck — `npm run typecheck` — Clean
- [ ] `14` Run unit tests — `npm test` — All tests pass
- [ ] `15` Regenerate E2E snapshots — `npx playwright test --update-snapshots` — All visual snapshots regenerated with new palette colors
- [ ] `16` Run E2E tests — `npm run test:e2e` — All tests pass
- [ ] `17` Run build — `npm run build` — Production build succeeds
