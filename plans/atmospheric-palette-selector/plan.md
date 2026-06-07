# Plan: Atmospheric Palette Selector

## Spec Reference
`specs/atmospheric-palette-selector.md`

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Palette data location | `src/data/atmosphericPalettes.js` | Follows existing `src/data/` pattern for static data (skins.js, changelog.js). All palette definitions in one file makes tuning trivial. |
| Color accessor pattern | `getAtmosphericColor(key)` as a module export | Mirrors `getThemeColor(key)` pattern in `theme.js` — familiar API, dot-notation path traversal, fallback to classic palette. |
| UI selector pattern | Card-based bottom sheet selector | Matches existing `initThemeSelector()` pattern in app.js — clickable cards with swatch, label, and active indicator. Reuses `openBottomSheet`/`closeBottomSheet`. |
| State property | `state.activeAtmosphericPalette` (string ID) | Follows the same pattern as `state.activeChartTheme`. Single string, no nested objects. |
| Persistence key | `'atmosphericPalette'` in StorageService | Consistent with `'chartTheme'` key pattern. |
| Renderer integration | Replace hardcoded colors with `getAtmosphericColor()` calls | Each renderer (AtmosphereRenderer, CloudRenderer, PrecipProbabilityRenderer, BackgroundRenderer, MinimapRenderer) already has color values inline — replace them with palette lookups. |
| Classic palette values | Extract current hardcoded values exactly | Ensures zero visual change for default users. The classic palette IS the current behavior. |

## Architecture

### New modules
- **`src/data/atmosphericPalettes.js`** — frozen `ATMOSPHERIC_PALETTES` object + `getAtmosphericColor(key)` function + `initAtmosphericPaletteSelector()` UI init
  - Exports: `ATMOSPHERIC_PALETTES`, `getAtmosphericColor`, `initAtmosphericPaletteSelector`
  - Palette definitions are self-contained; classic palette mirrors all current hardcoded values from renderers

### Modified modules
- **`src/store.js`** — add `activeAtmosphericPalette: 'classic'` to `state`
- **`src/app.js`** — import `initAtmosphericPaletteSelector`, call it during init; import palette state during storage init to load persisted selection; trigger re-render on palette change
- **`src/render/AtmosphereRenderer.js`** — replace hardcoded rain/snow/thunder colors with `getAtmosphericColor()` calls
- **`src/render/CloudRenderer.js`** — replace hardcoded cloud fill/stroke RGB values with palette lookups
- **`src/render/PrecipProbabilityRenderer.js`** — replace hardcoded probability area colors with palette lookups
- **`src/render/BackgroundRenderer.js`** — replace hardcoded sky, night, and sun colors with palette lookups
- **`src/render/MinimapRenderer.js`** — replace hardcoded sky/night colors with palette lookups
- **`src/utils/i18n.js`** — add `config.atmoPaletteTitle`, `config.atmoPaletteClassic`, `config.atmoPaletteWarm`, `config.atmoPaletteCold`, and any other palette names in `es`/`en`
- **`index.html`** — add palette selector DOM in Appearance section (below theme selector) + palette bottom sheet + backdrop

### Data flow
```
App load
  → initStorage() reads 'atmosphericPalette' from StorageService
  → state.activeAtmosphericPalette = stored ID or 'classic'
  → initAtmosphericPaletteSelector() renders UI, binds handlers

Palette change
  → User clicks palette card in bottom sheet
  → state.activeAtmosphericPalette = new ID
  → storageService.set('atmosphericPalette', ID)
  → tiles.forEach(t => t.drawn = false)  // invalidate all caches
  → minimapRenderer.invalidateCache()
  → render()                            // re-draw everything
  → closeBottomSheet()                   // dismiss sheet
```

### Key algorithms
- **`getAtmosphericColor(key)`**: splits key by `.`, traverses `ATMOSPHERIC_PALETTES[state.activeAtmosphericPalette].colors`, falls back to `classic` palette if key not found
- **Palette swatch generation**: composite swatch shows 4-5 key colors (sky, rain, snow, etc.) as horizontal gradient strips

## Files to Change

| File | Action | Description |
|------|--------|-------------|
| `src/data/atmosphericPalettes.js` | **create** | Palette definitions + `getAtmosphericColor()` + `initAtmosphericPaletteSelector()` |
| `src/store.js` | **modify** | Add `activeAtmosphericPalette: 'classic'` to state object |
| `src/app.js` | **modify** | Import palette module; load persisted palette in `initStorage()`; call `initAtmosphericPaletteSelector()` in init sequence |
| `src/render/AtmosphereRenderer.js` | **modify** | Import `getAtmosphericColor`; replace hardcoded rain/snow/thunder colors |
| `src/render/CloudRenderer.js` | **modify** | Import `getAtmosphericColor`; replace hardcoded cloud fill/stroke RGB values |
| `src/render/PrecipProbabilityRenderer.js` | **modify** | Import `getAtmosphericColor`; replace hardcoded probability area colors |
| `src/render/BackgroundRenderer.js` | **modify** | Import `getAtmosphericColor`; replace hardcoded sky/night/sun colors |
| `src/render/MinimapRenderer.js` | **modify** | Import `getAtmosphericColor`; replace hardcoded sky/night colors in minimap |
| `src/utils/i18n.js` | **modify** | Add palette-related UI strings in `es` and `en` |
| `index.html` | **modify** | Add palette selector row + bottom sheet + backdrop in settings |
| `tests/e2e/helpers/mock-data.js` | **modify** | Add mock data for palette-related scenarios if needed |
| `tests/e2e/interaction/atmo-palette-selector.test.js` | **create** | E2E tests for palette selection, persistence, re-render |
| `tests/e2e/visual/atmo-palette-selector.test.js` | **create** | Visual tests comparing palette variants |
| `CHANGELOG.md` | **modify** | Document new feature |
| `src/data/changelog.js` | **modify** | Add changelog entry |
| `index.html` | **modify** | Update `#app-version-label` version |
| `public/version.json` | **modify** | Update version |

## Dependencies

### Internal
- `src/store.js` — state object (must add `activeAtmosphericPalette`)
- `src/services/StorageService.js` — persistence via `get`/`set`
- `src/utils/i18n.js` — `t()` function for localized strings
- `src/ui/BottomSheet.js` — `openBottomSheet`/`closeBottomSheet` for selector UI
- `src/app.js` — init orchestration, `render()`, `tiles`, `minimapRenderer`

### External
- None (no new packages needed)

## Risk Areas

| Risk | Severity | Mitigation |
|------|----------|------------|
| Renderer color replacements break visual appearance | Medium | Classic palette values must be extracted exactly from current hardcoded values. Run visual E2E tests to confirm zero delta for default palette. |
| Minimap cache invalidation | Low | Must call `minimapRenderer.invalidateCache()` on palette change — same pattern as theme switching. |
| CloudRenderer complex gradient logic | Medium | Cloud fill uses density-tiered RGB objects — palette must provide matching structure. Test all density tiers. |
| Performance (getAtmosphericColor called per draw) | Low | Palette lookup is O(1) per call (flat object traversal). No measurable overhead vs hardcoded values. |
| IndexedDB blocked fallback | Low | Spec handles this — falls back to 'classic', UI still renders. |
| Palette + theme independence | Low | Palette affects atmospheric colors only; chart theme affects getThemeColor() lookups. No cross-contamination by design. |
