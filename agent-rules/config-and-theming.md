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

### Theme & i18n

- **Themes** (`src/theme.js`): Loaded from `themes/{id}.json` first, fallback to `public/themes/{id}.json`. Built-in: `default`, `neon`, `pastel`. `getThemeColor('key')` to access. `toggleTheme()` flips `state.theme` between `'dark'`/`'light'`.
- **Theme selector:** Bottom sheet in settings with color swatch preview. `loadChartTheme(id)` updates `state.activeChartTheme`, persists via `storageService`, triggers re-render.
- **`applyThemeDOM()`** updates theme-color meta tag, body font-family, metric icons via `getThemeIcon()`.
- **i18n** (`src/utils/i18n.js`): Two languages (es/en). `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` in HTML translated via `applyTranslations()`. JS: `t('key')`. Persisted via `setLanguage()`/`getLanguage()`.
