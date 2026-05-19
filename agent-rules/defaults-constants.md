### Defaults & Constants

- **`TILE_WIDTH`**: dynamic — `1440px` on desktop (>=600px), `720px` on mobile. Set in app.js `handleResize()`.
- **`PIXELS_PER_HOUR`**: `60` (desktop) / `50` (mobile <600px) — overridden in `handleResize()`.
- **`CONFIG`** (from `src/store.js`, frozen with `Object.freeze()`):
  - `CHART_HEIGHT = 250`
  - `MINIMAP_HEIGHT = 80`
  - `TILE_WIDTH = 1440` (desktop default; overridden to 720 on mobile)
  - `PIXELS_PER_MM = 10`
  - `PIXELS_PER_TEMP = 2.5`
  - `CACHE_DURATION = 5 * 60 * 1000` (5 minutes)
  - `DEFAULT_COORDS = { lat: 40.4167, lon: -3.70325, name: "Madrid, España" }`
  - `PAST_DAYS = 7`, `FORECAST_DAYS = 7`
