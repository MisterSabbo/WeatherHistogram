# Plan: Atmospheric Palette Redesign 2026

## Spec Reference
`specs/atmospheric-palette-selector.md` (2026-06-07)

## Scope
Update existing palette definitions, i18n, migration logic, and E2E tests to reflect the 2026-06-07 redesign. The architecture, UI, storage, and renderer integration from the original implementation remain unchanged — only palette color values, IDs, display names, and related strings change.

## Current State vs Target

| Aspect | Current (code) | Target (spec) |
|--------|---------------|---------------|
| `classic` palette values | Warm cream tones (`#fff2c0` sky) | Realistic sky blue (`#87CEEB`), golden sun (`#FFD700`) |
| `classic` display name (es) | "Clásica" | "Realista" |
| `classic` display name (en) | "Classic" | "Realistic" |
| `warm` palette | ID: `warm`, amber tones | ID: `vivid`, saturated purple-night, intense colors |
| `cold` palette | ID: `cold`, icy blue tones | ID: `pastel`, soft pastel tones |
| `original` palette | Exists and correct | Unchanged |
| i18n keys | `atmoPaletteWarm`, `atmoPaletteCold` | `atmoPaletteVivid`, `atmoPalettePastel` (old keys removed) |
| Migration | None for old IDs | Old `warm`/`cold` in localStorage → fallback to `classic` |
| E2E tests | Reference `data-value="warm"` / `data-value="cold"` | Update to `data-value="vivid"` / `data-value="pastel"` |

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| `classic` ID kept for backward compat | Keep ID as `classic` | No migration needed for existing users who had `classic` stored. Display name changes to "Realista"/"Realistic" via i18n only. |
| `warm` → `vivid` ID change | New ID `vivid` | Palette values are completely different (not just a rename). Old `warm` ID in storage must be handled via migration fallback. |
| `cold` → `pastel` ID change | New ID `pastel` | Same rationale as `vivid`. Old `cold` ID in storage must be handled via migration fallback. |
| Storage migration strategy | Fallback to `classic` on unknown ID | Existing `getAtmosphericColorFallback()` already falls back to classic on unknown key. Need to add explicit handling in `initStorage()` to correct the stored value when old IDs are detected. |

## Architecture

No new modules. Changes confined to existing files:

- **`src/data/atmosphericPalettes.js`** — update `classic` palette values, rename `warm`→`vivid` with new values, rename `cold`→`pastel` with new values, keep `original` unchanged
- **`src/utils/i18n.js`** — rename i18n keys: `atmoPaletteClassic` text, replace `atmoPaletteWarm`→`atmoPaletteVivid`, replace `atmoPaletteCold`→`atmoPalettePastel`
- **`src/app.js`** — add migration logic in `initStorage()` to handle old `warm`/`cold` stored IDs
- **`tests/e2e/interaction/atmo-palette.spec.js`** — update `data-value` selectors and expected text assertions
- **`tests/e2e/visual/atmo-palette.spec.js`** — update `data-value` selectors and snapshot names

## Data flow

```
App load (migration path)
  → initStorage() reads 'atmosphericPalette' from StorageService
  → if stored ID is 'warm' or 'cold':
      → state.activeAtmosphericPalette = 'classic'
      → storageService.set('atmosphericPalette', 'classic')  // correct storage
      → console.warn('Migrated old palette ID: ' + oldId + ' → classic')
  → else: state.activeAtmosphericPalette = stored ID or 'classic'

Palette change (UI)
  → User clicks palette card
  → state.activeAtmosphericPalette = new ID ('vivid', 'pastel', etc.)
  → storageService.set('atmosphericPalette', ID)
  → invalidate tiles + minimap → render()
```

## Files to Change

| File | Action | Description |
|------|--------|-------------|
| `src/data/atmosphericPalettes.js` | **modify** | Update `classic` values to Realista spec; rename `warm`→`vivid` with new values; rename `cold`→`pastel` with new values; update `ATMOSPHERIC_PALETTES` object keys |
| `src/utils/i18n.js` | **modify** | Update `atmoPaletteClassic` text (es: "Realista", en: "Realistic"); replace `atmoPaletteWarm`→`atmoPaletteVivid`; replace `atmoPaletteCold`→`atmoPalettePastel` |
| `src/app.js` | **modify** | Add migration logic in `initStorage()` for old `warm`/`cold` IDs → correct to `classic` and persist the correction |
| `tests/e2e/interaction/atmo-palette.spec.js` | **modify** | Update `data-value` selectors (`warm`→`vivid`, `cold`→`pastel`); update expected label text assertions |
| `tests/e2e/visual/atmo-palette.spec.js` | **modify** | Update `data-value` selectors; update snapshot filenames |
| `CHANGELOG.md` | **modify** | Document palette redesign |
| `src/data/changelog.js` | **modify** | Add embedded changelog entry |
| `index.html` | **modify** | Update `#app-version-label` version |
| `public/version.json` | **modify** | Update version |

## Dependencies

- No new dependencies
- Same internal dependencies as original implementation: `store.js` (state), `StorageService.js` (persistence), `i18n.js` (translations), `app.js` (init + re-render)

## Risk Areas

| Risk | Severity | Mitigation |
|------|----------|------------|
| `warm`/`cold` ID change breaks existing users | Medium | Migration logic in `initStorage()` detects old IDs and silently corrects to `classic`. Old `warm`/`cold` snapshots will need regeneration. |
| `classic` palette value change surprises existing users | Medium | Spec mandates this — the new "Realistic" palette replaces the old warm-toned classic. E2E visual snapshots will update accordingly. |
| i18n key removal (`atmoPaletteWarm`, `atmoPaletteCold`) breaks UI if referenced elsewhere | Low | Grep confirms these keys are only used in `index.html`, `atmosphericPalettes.js`, and the i18n file itself. The palette module dynamically generates keys from palette IDs, so removing old definitions while keeping `atmoPaletteVivid`/`atmoPalettePastel` is safe. |
| Original palette values unchanged | None | Confirmed matching between current code and spec. |

## Verification

1. `npm run lint && npm run typecheck && npm test` — must pass
2. `npx playwright test --update-snapshots` — regenerate all palette-related snapshots
3. `npm run test:e2e` — interaction tests must pass with updated selectors/text
