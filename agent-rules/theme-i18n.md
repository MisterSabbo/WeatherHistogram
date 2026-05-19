### Theme & i18n

- **Themes** (`src/theme.js`): Loaded from `themes/{id}.json` first, with fallback to `public/themes/{id}.json`. Built-in themes: `default`, `neon`, `pastel`. Theme colors accessed via `getThemeColor('key')`. The theme toggle button calls `toggleTheme()` which flips `state.theme` between `'dark'` / `'light'`.
- **Theme selector:** Bottom sheet in settings with color swatch preview for each chart theme. Selecting a theme calls `loadChartTheme(id)`, updates `state.activeChartTheme`, persists via `storageService.set('chartTheme', id)`, and triggers a re-render of all tiles.
- **`applyThemeDOM()`** updates theme-color meta tag, body font-family, and header metric icons (precip, prob, cloud, AQI, pollen) via `getThemeIcon()`.
- **i18n** (`src/utils/i18n.js`): Two languages (es/en). Strings marked with `data-i18n` or `data-i18n-title` / `data-i18n-placeholder` in HTML are translated via `applyTranslations()`. Get strings in JS with `t('key')`. Language is persisted via `setLanguage()` / `getLanguage()`.
