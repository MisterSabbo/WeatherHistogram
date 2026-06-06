# Plan: Refresh Data Flows

## Spec Reference

`specs/refresh-data-flows.md`

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Abort previous fetch on concurrent call | Module-level `activeController` + `AbortController` | Matches existing pattern in WeatherFetcher.js; prevents stuck `isFetching` state |
| PTR try/catch scope | Wrap only `geoService.searchLocation()`, not `loadWeather()` | Ensures tiles always get data even on geo-search failure |
| Toast pattern | DOM element + CSS class + `requestAnimationFrame` + `setTimeout` | Follows existing `.yip-toast` pattern in YearInPixels.js |
| Toast text i18n | `config.dataUpdated` key in both `es`/`en` | Follows existing i18n conventions |

## Architecture

### Data flow (fixed PTR)

```
PTR gesture triggered
  → clear tiles + show loading text
  → try { geoService.searchLocation() } catch { log error }
  → await loadWeather()              ← ALWAYS runs, outside try/catch
    → fetchWeatherData()
      → if isFetching && activeController → abort previous
      → new AbortController → set as activeController
      → fetch with signal
      → finally: reset isFetching + activeController only if ours
  → showRefreshToast()               ← success path only
```

### Concurrency model

```
Call 1: activeController = A, isFetching = true
Call 2: A.abort() → AbortError caught → return (no error path)
        activeController = B, isFetching = true
        ... fetch completes ...
        finally: activeController === B → isFetching = false
```

### Toast lifecycle

```
showRefreshToast()
  → display: block
  → requestAnimationFrame → add .visible (opacity 0→1, 0.3s)
  → setTimeout(2000ms) → remove .visible (opacity 1→0)
  → setTimeout(300ms) → display: none
```

## Files to Change

| File | Action | Description |
|------|--------|-------------|
| `src/domain/WeatherFetcher.js` | modify | Add module-level `activeController`, abort previous on concurrent call, fix `finally` guard |
| `src/app.js` (PTR `onRefresh`) | modify | Restructure try/catch so `loadWeather()` always runs; add toast after success |
| `src/utils/i18n.js` | modify | Add `config.dataUpdated` to both `es` and `en` |
| `index.html` | modify | Add `<div id="refresh-toast">` element |
| `src/styles/controls.css` | modify | Add `.refresh-toast` CSS following `.yip-toast` pattern |

## Dependencies

| Module | Dependency |
|--------|-----------|
| `src/app.js` | `WeatherFetcher.fetchWeatherData`, `WeatherFetcher.clearWeatherCache`, `GeoService.searchLocation`, `i18n.t` |
| `src/domain/WeatherFetcher.js` | `state`, `CONFIG`, `WeatherService`, `processData` |
| Toast | `index.html` DOM element, `controls.css` styles |

## Risk Areas

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Race condition: multiple rapid PTR gestures | Each triggers abort + new fetch; only last result matters | `activeController` check in `finally` ensures only the winner resets `isFetching` |
| AbortError from timeout vs. our abort | Both produce `AbortError` name | Distinguish via `activeController !== controller` check (already implemented) |
| Toast shown during loading state | Confusing UX | Toast only shown in success path (after `loadWeather()` resolves) |
| Cache hit returns synchronously | `isFetching` never set to `true` | Cache path returns before the abort guard — no conflict |

## Verification

After implementation, run in order:
```bash
npm run lint          # 0 warnings, 0 errors
npm run typecheck     # clean
npm run build         # production build succeeds
npm test              # unit tests pass
npm run test:e2e      # E2E tests pass
```
