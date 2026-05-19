### Key Interactions an Agent Might Miss

- **Pull-to-refresh:** Handled by `src/ui/PullToRefresh.js`. Touch drag-down gesture resets `weatherCache`, clears tile canvases, then reloads data via `loadWeather()`. Disabled when modals or search overlay are open.
- **Scroll-driven rendering:** The `scroll` event on `#scroll-container` calls `render()` throttled via `requestAnimationFrame`. This is the only way the main chart updates during scroll.
- **Label collision avoidance:** `drawFixedOverlay()` has a custom collision-detection system (`state.labelRects`) for scrubber labels. Reset each frame.
- **BottomSheet swipe-to-dismiss:** `openBottomSheet()` in `src/ui/BottomSheet.js` uses pointer events (with touch fallback for Android pointercancel). Swipe-down on the sheet body closes it when the scrollable content is at the top (`scrollTop === 0`). Z-index is managed dynamically via a monotonically increasing counter.
- **Settings panel:** Responsive — bottom sheet on mobile (<768px), right-side sliding panel on desktop (>=768px). Uses CSS `translateY`/`translateX` with media queries.
- **Collapsible sections:** Fototipo and Umbrales sections in settings are independently collapsible via `.collapsible-trigger` click handlers.
- **Language switch confirmation:** Changing language triggers a `showConfirm()` dialog before applying translations and re-rendering.
- **Minimap auto-switch:** `updateMinimapViewport()` auto-toggles `minimapMode` between `'past'` and `'future'` based on viewport center crossing the current-time split index.
- **Service Worker** (`sw.js`): Cache-first for static assets, stale-while-revalidate for others. API calls (open-meteo, openstreetmap) are deliberately not intercepted.
- **IndexedDB migration** (app.js init): Legacy localStorage keys are migrated to IndexedDB on first load, then old keys are deleted.
- **PWA standalone detection:** At init, checks `display-mode: standalone` / `navigator.standalone` and adds `pwa-standalone` class to `<html>`.
- **View mode toggle:** `toggle-nav-btn` switches between minimap and daily cards view. Persisted as `viewMode` in StorageService.
