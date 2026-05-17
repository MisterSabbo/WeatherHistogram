### Key Interactions an Agent Might Miss

- **Pull-to-refresh:** Touch event handlers in `app.js` implement mobile pull-to-refresh. The gesture resets `weatherCache`, clears tile canvases, then reloads data.
- **Scroll-driven rendering:** The `scroll` event on `#scroll-container` calls `render()` throttled via `requestAnimationFrame`. This is the only way the main chart updates during scroll.
- **Label collision avoidance:** `drawFixedOverlay()` has a custom collision-detection system (`state.labelRects`) for scrubber labels. Reset each frame.
- **Minimap auto-switch:** `updateMinimapViewport()` auto-toggles `minimapMode` between `'past'` and `'future'` based on viewport center crossing the current-time split index.
- **Service Worker** (`sw.js`): Cache-first for static assets, stale-while-revalidate for others. API calls (open-meteo, openstreetmap) are deliberately not intercepted.
- **IndexedDB migration** (app.js init): Legacy localStorage keys are migrated to IndexedDB on first load, then old keys are deleted.
- **PWA standalone detection:** At init, checks `display-mode: standalone` / `navigator.standalone` and adds `pwa-standalone` class to `<html>`.
- **View mode toggle:** `toggle-nav-btn` switches between minimap and daily cards view. Persisted as `viewMode` in StorageService.
