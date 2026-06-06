# Tasks: Refresh Data Flows

## Execution Order

Tasks must be executed in order. Parallel tasks marked with `[P]`.

### Phase 1: Data Layer Fix (WeatherFetcher.js)

- [ ] Add module-level `activeController` variable and abort-on-concurrent logic to `src/domain/WeatherFetcher.js` — Lines 8, 35-37, 60-62, 91-96 — Verify: concurrent calls abort previous, `state.isFetching` resets to `false` after each call

### Phase 2: PTR Flow Restructure (app.js)

- [ ] Restructure PTR `onRefresh` try/catch in `src/app.js` so `loadWeather()` is called outside the try/catch — Lines 186-198 — Verify: `loadWeather()` executes even when `geoService.searchLocation()` throws
- [ ] Add `showRefreshToast()` call after `loadWeather()` in PTR success path — Line 199 — Verify: toast appears after successful refresh

### Phase 3: Toast UI (parallel)

- [P] Add `<div id="refresh-toast">` element to `index.html` near existing toast elements — Line ~1586
- [P] Add `.refresh-toast` CSS class to `src/styles/controls.css` following `.yip-toast` pattern — Lines 281-301
- [P] Add `config.dataUpdated` i18n string to `src/utils/i18n.js` in both `es` and `en` — Lines 17, 279

### Phase 4: Toast Function (app.js)

- [ ] Add `showRefreshToast()` function to `src/app.js` — Lines 1330-1340 — Verify: toast shows text from `t('config.dataUpdated')`, auto-hides after 2s with fade-out

### Phase 5: Verification

- [ ] `npm run lint` — 0 warnings, 0 errors
- [ ] `npm run typecheck` — clean
- [ ] `npm run build` — production build succeeds
- [ ] `npm test` — unit tests pass
- [ ] `npm run test:e2e` — E2E tests pass
- [ ] Update changelog if significant change detected

### Phase 6: Snapshot Regeneration

- [ ] If visual changes detected: `npx playwright test --update-snapshots` — stage updated PNGs
