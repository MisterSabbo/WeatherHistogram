# Spec: Refresh/Update Data Flow Fixes

## Purpose

Fix bugs in the pull-to-refresh and clear-cache-and-refresh flows that cause the UI to not update properly after data is re-fetched from the open-meteo API, and add visual toast feedback on successful refresh.

## Scope

This spec covers three data-refresh entry points in `src/app.js` and the guard logic in `src/domain/WeatherFetcher.js`:

| Entry point | File:Line | Status |
|-------------|-----------|--------|
| "Use Current Location" button | `app.js:266-275` | Works correctly — no changes |
| Pull to Refresh (PTR) | `app.js:164-201` | **Bug 1** — `loadWeather()` skipped on geo-search failure |
| "Clear Cache and Refresh" button | `app.js:593-606` | Works (calls `onClearCache` → full reload), but needs toast |
| `fetchWeatherData()` guard | `WeatherFetcher.js:34-35` | **Bug 2** — `isFetching` can get stuck, drops concurrent requests |

## Dependencies

### state
| Property | Access (R/W) | Context |
|-----------|-------------|----------|
| `state.locationName` | read | PTR reads to re-geocode current location |
| `state.lat` | read/write | PTR writes on geo-search success; fetcher reads for cache key |
| `state.lon` | read/write | PTR writes on geo-search success; fetcher reads for cache key |
| `state.isFetching` | read/write | Fetcher guard; initForceRefresh sets it to `true` |
| `state.rawForecast` | write | fetcher stores API response |
| `state.rawAQI` | write | fetcher stores API response |

### CONFIG
| Constant | Context |
|-----------|----------|
| `CONFIG.CACHE_DURATION` | Cache TTL for in-memory weather cache |

### DOM
| Element | Access type | Context |
|----------|---------------|----------|
| `#app-wrapper` | classList | PTR adds/removes `loading` class |
| `#error-msg` | style.display | PTR hides error message |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `./store.js` | `state`, `CONFIG` | State and config access |
| `./domain/WeatherFetcher.js` | `fetchWeatherData`, `clearWeatherCache` | Data fetching + cache |
| `./services/GeoService.js` | `geoService.searchLocation` | Geocode location name on PTR |
| `./ui/PullToRefresh.js` | `initPullToRefresh` | Touch pull-to-refresh gesture |
| `./utils/pwa.js` | `clearCacheAndReload` | Clear cache and full page reload |
| `./utils/i18n.js` | `t` | Internationalized strings |

## Public API

No new public API. This spec modifies existing internal functions only.

## Behavior

### Bug 1: PTR geo-search failure silently drops `loadWeather()`

**Current behavior (broken):**
The PTR `onRefresh` callback wraps both `geoService.searchLocation()` and `loadWeather()` in a single `try/catch`. If the geo-search throws, the catch block logs the error but `loadWeather()` is never called. The tiles were already cleared (lines 168-181), so the user sees blank canvases with no way to recover without reloading.

**Required behavior:**
1. `loadWeather()` must ALWAYS be called, regardless of whether `geoService.searchLocation()` succeeds, fails, or is skipped (no `originalLocation`).
2. If geo-search fails, the existing `state.lat`/`state.lon` values are used unchanged.
3. The `try/catch` must wrap only the `geoService.searchLocation()` call, not `loadWeather()`.

**Pseudocode:**
```
try {
    if (originalLocation) {
        const results = await geoService.searchLocation(originalLocation, 1);
        if (results.length > 0) {
            state.lat = results[0].latitude;
            state.lon = results[0].longitude;
            state.locationName = results[0].name + (results[0].admin1 ? `, ${results[0].admin1}` : "");
        }
    }
} catch (e) {
    console.error('PTR geo-search failed, using existing coordinates:', e);
}
// loadWeather() is ALWAYS called here, outside the try/catch
await loadWeather();
```

### Bug 2: `state.isFetching` guard drops concurrent requests and can get stuck

**Current behavior (broken):**
```js
if (state.isFetching) return;  // Silent return, no try/finally
state.isFetching = true;
```
When `fetchWeatherData()` is called while a previous fetch is in progress:
- The new call returns immediately without doing anything.
- The `finally` block (line 82) is never reached because the `return` is before the `try`.
- `state.isFetching` remains `true` until page reload.
- Any subsequent calls also silently fail, creating a permanent stuck state.

**Required behavior:**
1. When `fetchWeatherData()` is called while `state.isFetching` is `true`, the previous in-flight request must be aborted via its `AbortController`.
2. The new request must then proceed normally.
3. `state.isFetching` must never get stuck as `true`.

**Pseudocode:**
```
// Module-level AbortController to track in-flight request
let activeController = null;

if (state.isFetching && activeController) {
    activeController.abort();  // Cancel previous request
}

state.isFetching = true;
const controller = new AbortController();
activeController = controller;
const timeoutId = setTimeout(() => controller.abort(), 15000);

try {
    // ... existing fetch logic ...
} catch (err) {
    // If aborted by us (not by timeout), don't treat as error
    if (err.name === 'AbortError' && controller.signal.aborted) {
        return;  // New request will handle everything
    }
    // ... existing error handling ...
} finally {
    if (activeController === controller) {
        state.isFetching = false;
        activeController = null;
    }
}
```

**Key detail:** The `AbortError` from our own abort (when starting a new request) must not trigger the error-fallback path (expired cache / mock data). It should silently return, since the new request that caused the abort will handle the data.

### Enhancement 3: Visual toast on successful refresh

**Current behavior:** No visual confirmation that data was refreshed. Users cannot distinguish "data looks the same because it's the same forecast" from "data wasn't refreshed at all."

**Required behavior:**
1. After a successful `loadWeather()` completes in the PTR flow, show a brief toast notification.
2. The toast must use the existing toast pattern from `YearInPixels.js` (DOM element + CSS class + timeout).
3. Toast text: "Datos actualizados" (es) / "Data updated" (en).
4. Toast auto-hides after 2 seconds with a fade-out.
5. The clear-cache flow (`initForceRefresh`) triggers a full page reload (`clearCacheAndReload`), so no toast is needed there — the app reloads entirely.

**Toast implementation pattern:**
A new DOM element `#refresh-toast` will be added to `index.html` (near `#update-toast`). The toast is shown by adding the `visible` class and setting `display: block`, hidden by removing the class and setting `display: none` after a timeout.

**CSS:** A new `.refresh-toast` class in `src/styles/controls.css` (or inline in existing toast styles) following the same pattern as `.yip-toast`.

### i18n strings

New strings in `src/utils/i18n.js`:

| Key | es | en |
|-----|----|----|
| `config.dataUpdated` | `"Datos actualizados"` | `"Data updated"` |

## Edge Cases

| Condition | Expected behavior |
|-----------|-------------------|
| PTR geo-search fails (network error) | `loadWeather()` still called with existing `state.lat/lon` |
| PTR geo-search returns empty results | `loadWeather()` called with existing coordinates, no error shown |
| PTR geo-search succeeds | Coordinates updated, then `loadWeather()` called |
| `fetchWeatherData()` called while fetch in progress | Previous request aborted, new request proceeds |
| Previous fetch aborted by timeout AND new request starts | AbortError from timeout is indistinguishable from our abort — both handled gracefully via `activeController` check |
| `fetchWeatherData()` called, previous was cache hit (synchronous path) | Cache hit returns before `isFetching = true` is set, so no conflict |
| Multiple rapid PTR gestures | Each triggers abort + new fetch; only the last one's result matters |
| Toast shown during loading state | Toast appears after `loadWeather()` completes (success path only) |

## Files to Change

| File | Change |
|------|--------|
| `src/domain/WeatherFetcher.js` | Add module-level `activeController`, abort previous on concurrent call, fix `finally` guard |
| `src/app.js` (PTR `onRefresh`) | Restructure try/catch so `loadWeather()` always runs; add toast after success |
| `src/utils/i18n.js` | Add `config.dataUpdated` to both `es` and `en` |
| `index.html` | Add `<div id="refresh-toast">` element |
| `src/styles/controls.css` | Add `.refresh-toast` CSS (or append to existing toast styles) |

## Test Scenarios

1. **PTR geo-search fails → loadWeather still runs:** Mock `geoService.searchLocation` to throw. Verify `loadWeather()` is called and tiles are drawn.
2. **PTR geo-search returns empty → loadWeather uses existing coords:** Mock `searchLocation` to return `[]`. Verify `state.lat/lon` unchanged and `loadWeather()` called.
3. **PTR geo-search succeeds → coordinates updated:** Mock `searchLocation` to return new coords. Verify `state.lat/lon` updated and `loadWeather()` called.
4. **Concurrent fetch aborts previous:** Call `fetchWeatherData()` twice rapidly. Verify first request is aborted, second completes, `state.isFetching` is `false` at end.
5. **isFetching reset after abort:** Start a fetch, abort it via new call, verify `state.isFetching` is `false` after the new call completes.
6. **isFetching not stuck:** Simulate slow fetch + abort. Verify `isFetching` returns to `false`.
7. **Toast shown on successful PTR:** Complete PTR flow, verify `#refresh-toast` becomes visible with correct text.
8. **Toast auto-hides:** Verify toast disappears after ~2 seconds.
9. **Toast not shown on PTR failure:** If `loadWeather()` throws, toast should NOT appear.
10. **i18n:** Verify `t('config.dataUpdated')` returns correct string for both `es` and `en`.

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-06-06 | Initial spec | SDD |
