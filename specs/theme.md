# Spec: `src/theme.js`

## Purpose
Chart theme management: loading JSON theme files, accessing colors/icons/fonts, and DOM updates.

## Dependencies

### state
| Property | Access | Context |
|-----------|--------|----------|
| `state.themeConfig` | read/write | all functions |
| `state.theme` | read | applyThemeDOM via getComputedStyle |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `./store.js` | `state` | access |

## Public API

- `getThemeColor(path, fallbackColor)` — navigates `state.themeConfig.colors` with nested path
- `getThemeIcon(path, fallbackIcon)` — navigates `state.themeConfig.icons`
- `getThemeFont(size?)` — returns theme font with optional size
- `async loadChartTheme(themeId)` — loads JSON theme (primary: `./themes/{id}.json`, fallback: `./public/themes/{id}.json`)
- `applyThemeDOM()` — applies font-family, theme-color meta, header icons

## Behavior

1. `getThemeColor`/`getThemeIcon`: dot-separated path, fallback if not found
2. `loadChartTheme`: tries primary → fallback → hardcoded fallback
3. `applyThemeDOM`: updates `body.style.fontFamily`, `meta[theme-color]`, `.material-symbols-outlined` icons in header

## Edge Cases

| Condition | Expected behavior |
|-----------|------------------------|
| themeConfig null | getThemeColor returns fallback |
| Non-existent path | Returns fallback |
| Theme not found primary or fallback | Uses hardcoded fallback |
| Meta tag does not exist | applyThemeDOM does not throw |

## Test Scenarios

1. **getThemeColor with path:** returns theme color
2. **getThemeColor without config:** returns fallback
3. **getThemeColor invalid path:** returns fallback
4. **getThemeIcon:** returns icon or fallback
5. **getThemeFont:** returns font with/without size
6. **loadChartTheme with valid theme:** state.themeConfig updated

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
