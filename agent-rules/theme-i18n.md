### Theme & i18n

- **Themes** (`src/theme.js`): Loaded from `public/themes/{default,neon,pastel}.json`. Theme colors accessed via `getThemeColor('key')`. The theme toggle button calls `toggleTheme()` which flips `state.theme` between `'dark'` / `'light'`.
- **i18n** (`src/utils/i18n.js`): Two languages (es/en). Strings marked with `data-i18n` in HTML are translated via `applyTranslations()`. Get strings in JS with `t('key')`.
