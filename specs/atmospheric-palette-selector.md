# Spec: Atmospheric Color Palette Selector

## Purpose

Allow users to select from predefined color palettes that control all atmospheric event colors in the main histogram (day/night sky, clouds, rain, snow, thunder, precipitation probability) while keeping the existing chart theme system untouched.

## Dependencies

### state

| Property | Access (R/W) | Context |
|-----------|-------------|----------|
| `state.activeAtmosphericPalette` | read / write | Renderers read this to determine which color palette to apply; `initAtmosphericPaletteSelector` writes it on selection change |

### CONFIG

| Constant | Context |
|-----------|----------|
| (none) | This feature does not introduce new CONFIG constants. All palette values are self-contained in the palette definition module. |

### DOM

| Element | Access type | Context |
|----------|---------------|----------|
| `#atmo-palette-select-trigger` | querySelector / click | Opens the palette bottom sheet selector |
| `#atmo-palette-current-label` | querySelector / textContent | Shows the currently selected palette name |
| `#atmo-palette-current-swatch` | querySelector / style.background | Shows a composite swatch of the current palette |
| `#atmo-palette-options-container` | querySelector / innerHTML | Container for dynamically generated palette option cards |
| `#atmo-palette-select-sheet` | (existing bottom sheet pattern) | Bottom sheet container for palette options |
| `#atmo-palette-sheet-backdrop` | (existing bottom sheet pattern) | Backdrop for the palette bottom sheet |

### Internal modules

| Module | Export used | Purpose |
|--------|-------------|----------|
| `./store.js` | `state` | Read/write `activeAtmosphericPalette` |
| `./services/StorageService.js` | `storageService` | Persist and retrieve palette selection |
| `./utils/i18n.js` | `t` | Localized UI strings |
| `./app.js` | `render`, `tiles`, `minimapRenderer` | Trigger re-render on palette change |

## Public API

### `ATMOSPHERIC_PALETTES`

**Description:** A frozen object containing all predefined palette definitions. Each palette is keyed by an ID string and contains named color values for every atmospheric element.

**Type:** `Record<string, AtmosphericPalette>`

**Palette shape:**

```
{
  id: string,              // e.g. 'classic'
  name: string,            // Display name, e.g. 'Clásico'
  icon: string,            // Emoji or Material icon identifier
  colors: {
    daySky: string,         // Hex, e.g. '#fff2c0'
    daySun: string,         // Hex, sun fill color
    daySunRay: string,      // Hex, sun ray color
    nightFill: string,      // Hex, solid night background e.g. '#1A2744'
    nightTransitionMid: string, // Hex, mid-gradient stop e.g. '#FFDDBA'
    nightShadowColor: string,   // RGBA string for night shadow overlay
    cloudFill: {            // Object with density tiers
      light: { r: number, g: number, b: number, a: number },
      medium: { r: number, g: number, b: number, a: number },
      heavy: { r: number, g: number, b: number, a: number }
    },
    cloudStroke: {          // Object with density tiers (same shape as cloudFill, no alpha)
      light: { r: number, g: number, b: number },
      medium: { r: number, g: number, b: number },
      heavy: { r: number, g: number, b: number }
    },
    cloudLayers: Array<{ offset: number, width: number, color: string }>, // 5-layer stroke config
    rainBar: string,        // RGBA, e.g. 'rgba(30,130,190,0.45)'
    rainStroke: string,     // RGBA, e.g. 'rgba(30,130,190,0.80)'
    rainShadow: string,     // RGBA, e.g. 'rgba(30,130,190,0.4)'
    snowBar: string,        // RGBA, e.g. 'rgba(180,200,220,0.40)'
    snowStroke: string,     // RGBA, e.g. 'rgba(180,200,220,0.80)'
    snowFlake: string,      // RGBA, snowflake stroke color
    snowShadow: string,     // RGBA, snowflake shadow
    thunderBar: string,     // RGBA, e.g. 'rgba(80,70,150,0.40)'
    thunderStroke: string,  // RGBA, e.g. 'rgba(80,70,150,0.80)'
    thunderBolt: string,    // Hex, lightning bolt color e.g. '#FDE047'
    thunderBoltShadow: string, // RGBA, bolt glow
    precipProbRain: { r: number, g: number, b: number }, // RGB for rain probability area
    precipProbSnow: { r: number, g: number, b: number }, // RGB for snow probability area
    precipProbThunder: { r: number, g: number, b: number } // RGB for thunder probability area
  }
}
```

**Mutates state:** No

**Async:** No

### `getAtmosphericColor(key: string): string | object`

**Description:** Returns the current color value for the given atmospheric element key from the active palette. Falls back to the `classic` palette if the key is not found.

**Parameters:**

| Name | Type | Description |
|--------|------|-------------|
| `key` | `string` | Dot-notation path into `colors`, e.g. `'rainBar'`, `'cloudFill.light'` |

**Return:** The color value (string or object depending on key)

**Mutates state:** No

**Async:** No

### `initAtmosphericPaletteSelector(): void`

**Description:** Initializes the palette selector UI in the settings panel. Loads persisted selection from StorageService, binds click handlers, and updates the active palette on selection change. Triggers full re-render on palette switch.

**Mutates state:** Yes (properties: `activeAtmosphericPalette`)

**Async:** Yes (awaits: `storageService.get`, `storageService.set`)

## Behavior

1. **Palette definitions are centralized** in a single file (`src/data/atmosphericPalettes.js`) to make color tuning trivial — adjust values in one place without touching renderer logic.

2. **Default palette is `classic`** — identical to current hardcoded colors. Users who never change the setting see zero visual difference.

3. **Palette selection persists** via `StorageService` under the key `'atmosphericPalette'`. On app load, the stored palette ID is read and applied to `state.activeAtmosphericPalette` before first render.

4. **Palette change triggers full re-render** — all tile `drawn` flags are set to `false`, the minimap cache is invalidated, and `render()` is called. This follows the same pattern as theme switching.

5. **UI placement** — the palette selector appears in the Appearance section of the settings bottom sheet, directly below the existing chart theme selector. It uses the same card-based selection pattern as the theme selector (clickable cards in a bottom sheet).

6. **Palette option cards** show: an icon/emoji, the palette name, and a small horizontal swatch strip previewing 4-5 key colors (sky, rain, snow, etc.).

7. **The existing chart theme system is untouched** — `state.activeChartTheme`, `loadChartTheme()`, and all theme JSON files remain exactly as they are. Atmospheric palettes are a separate, orthogonal system.

8. **Renderers consume palette colors** by calling `getAtmosphericColor(key)` instead of using hardcoded values. Each renderer is updated to read from the active palette for its specific colors.

9. **Palette values use a flat, readable structure** — RGB objects for computed colors (clouds, probability areas where alpha is applied dynamically), and RGBA strings for direct-use colors (bars, strokes). This makes manual tuning straightforward.

10. **i18n** — palette names are translated in both `es` and `en` via the `t()` function. New keys added under `config.atmoPalette*`.

## Edge Cases

| Input / Situation | Expected behavior |
|---------|------------------------|
| No palette stored in IndexedDB | Defaults to `'classic'` — current hardcoded colors, no visual change |
| Invalid palette ID in storage | Falls back to `'classic'`, logs warning, corrects storage value |
| StorageService unavailable (IndexedDB blocked) | Falls back to `'classic'`, palette selector UI still renders but selection is not persisted |
| Palette changed while data is loading | Palette is applied immediately to `state`; next render cycle uses new colors |
| Theme (dark/light) changed after palette | Both systems are independent; palette colors are applied regardless of theme mode |
| Chart theme changed after palette | Both systems are independent; chart theme affects `getThemeColor()` lookups, palette affects atmospheric-specific colors |

## Test Scenarios

1. **Default state:** App loads with no stored palette → `state.activeAtmosphericPalette === 'classic'` → atmospheric colors match current hardcoded values exactly
2. **Palette selection:** User clicks a non-classic palette → `state.activeAtmosphericPalette` updates → all atmospheric elements (sky, clouds, precip bars, probability areas) reflect new colors on next render
3. **Persistence:** User selects "Cálida" palette → reloads app → palette is still "Cálida" (loaded from IndexedDB)
4. **Invalid stored value:** IndexedDB contains `'nonexistent'` → app defaults to `'classic'`, storage is corrected
5. **Palette + theme independence:** User selects "Fría" palette while on "neon" chart theme → both apply independently; chart elements use neon theme, atmospheric elements use Fría colors
6. **Re-render on change:** Switching palette invalidates all tile caches → scrolling the chart shows new colors everywhere
7. **Minimap reflects palette:** After palette change, minimap re-renders with new atmospheric colors
8. **UI reflects current palette:** Opening settings shows correct palette name and swatch highlighted as active

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-06-06 | Initial spec | SDD |
