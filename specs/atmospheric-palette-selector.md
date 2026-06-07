# Spec: Atmospheric Color Palette Selector

## Purpose

Allow users to select from predefined color palettes that control all atmospheric event colors in the main histogram (day/night sky, clouds, rain, snow, thunder, precipitation probability) while keeping the existing chart theme system untouched.

**2026-06-07 redesign:** Palettes were renamed and recolored to improve visual quality, contrast on mobile, and thematic coherence:

| Current ID | New ID | New Name (es) | New Name (en) | Change |
|---|---|---|---|---|
| `classic` | `classic` (unchanged) | Realista | Realistic | Renamed only; internal ID kept for localStorage backward compat |
| `original` | `original` (unchanged) | Original | Original | Unchanged |
| `warm` | `vivid` | Vívida | Vivid | Renamed + recolored for intense saturation |
| `cold` | `pastel` | Pastel | Pastel | Renamed + recolored for soft pastel tones |

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
  name: string,            // Display name, e.g. 'Realista'
  icon: string,            // Emoji or Material icon identifier
  colors: {
    daySky: string,         // Hex, e.g. '#87CEEB'
    daySun: string,         // Hex, sun fill color
    daySunRay: string,      // Hex, sun ray color
    nightFill: string,      // Hex, solid night background e.g. '#1A2744'
    nightTransitionMid: string, // Hex, mid-gradient stop e.g. '#FFDDBA'
    nightShadowColor: string,   // RGBA string for night shadow overlay
    minimapNightFill: string,   // Hex, minimap night area (palette-specific since 2026-06-07)
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

2. **Default palette is `classic`** (display name: "Realista" / "Realistic") — the replacement for the original hardcoded colors. Users who never change the setting see the new realistic atmospheric colors.

3. **Palette selection persists** via `StorageService` under the key `'atmosphericPalette'`. On app load, the stored palette ID is read and applied to `state.activeAtmosphericPalette` before first render.

4. **Palette change triggers full re-render** — all tile `drawn` flags are set to `false`, the minimap cache is invalidated, and `render()` is called. This follows the same pattern as theme switching.

5. **UI placement** — the palette selector appears in the Appearance section of the settings bottom sheet, directly below the existing chart theme selector. It uses the same card-based selection pattern as the theme selector (clickable cards in a bottom sheet).

6. **Palette option cards** show: an icon/emoji, the palette name, and a small horizontal swatch strip previewing 4-5 key colors (sky, rain, snow, etc.).

7. **The existing chart theme system is untouched** — `state.activeChartTheme`, `loadChartTheme()`, and all theme JSON files remain exactly as they are. Atmospheric palettes are a separate, orthogonal system.

8. **Renderers consume palette colors** by calling `getAtmosphericColor(key)` instead of using hardcoded values. Each renderer is updated to read from the active palette for its specific colors.

9. **Palette values use a flat, readable structure** — RGB objects for computed colors (clouds, probability areas where alpha is applied dynamically), and RGBA strings for direct-use colors (bars, strokes). This makes manual tuning straightforward.

10. **i18n** — palette names are translated in both `es` and `en` via the `t()` function. Keys follow the pattern `config.atmoPalette{Id}` (capitalised first letter, e.g. `config.atmoPaletteClassic`, `config.atmoPaletteVivid`).

## Available Palettes

### `classic` — Realista / Realistic

A realistic natural-color palette — the default. Replaces the old `classic` palette's warm cream tones with true-to-life atmospheric colors.

| Key | Value | Rationale |
|---|---|---|
| daySky | `#87CEEB` | Realistic clear sky blue |
| daySun | `#FFD700` | Realistic golden sun |
| daySunRay | `#FFF3B0` | Soft golden glow |
| nightFill | `#1A2744` | Realistic deep navy |
| nightTransitionMid | `#7a91c2` | Soft blue-gray sunset transition |
| minimapNightFill | `#f8e4ff` | Soft lavender night |
| nightShadowColor | `rgba(26, 39, 68, 0.15)` | Natural shadow |
| nightShadowColorTransparent | `rgba(26, 39, 68, 0)` | |
| cloudFill.light | `{ r: 220, g: 225, b: 240, a: 0.65 }` | Light blue-gray clouds |
| cloudFill.medium | `{ r: 195, g: 205, b: 225, a: 0.75 }` | Medium blue-gray clouds |
| cloudFill.heavy | `{ r: 170, g: 180, b: 210, a: 0.85 }` | Heavy blue-gray clouds |
| cloudStroke.light | `{ r: 200, g: 210, b: 230 }` | |
| cloudStroke.medium | `{ r: 175, g: 185, b: 210 }` | |
| cloudStroke.heavy | `{ r: 150, g: 160, b: 190 }` | |
| cloudLayers | 5-layer blue-gray cloud layers matching cloudFill/cloudStroke | |
| rainBar | `rgba(30, 130, 190, 0.45)` | Realistic blue |
| rainStroke | `rgba(30, 130, 190, 0.80)` | |
| rainShadow | `rgba(30, 130, 190, 0.4)` | |
| snowBar | `rgba(180, 200, 220, 0.40)` | Realistic icy white |
| snowStroke | `rgba(180, 200, 220, 0.80)` | |
| snowFlake | `rgba(100, 130, 160, 0.8)` | |
| snowShadow | `rgba(200, 215, 230, 0.8)` | |
| thunderBar | `rgba(80, 70, 150, 0.40)` | Reasonable purple |
| thunderStroke | `rgba(80, 70, 150, 0.80)` | |
| thunderBolt | `#FDE047` | |
| thunderBoltShadow | `rgba(253, 224, 71, 0.8)` | |
| precipProbRain | `{ r: 30, g: 144, b: 200 }` | |
| precipProbSnow | `{ r: 200, g: 215, b: 230 }` | |
| precipProbThunder | `{ r: 100, g: 80, b: 160 }` | |

**Night character:** Realistic deep navy (`#1A2744`) with soft blue-gray sunset transition (`#7a91c2`).

---

### `original` — Original

The original palette as initially shipped with the app. Used for visual regression testing and for users who prefer the old look. **Completely unchanged.**

Refer to the original palette definition in `src/data/atmosphericPalettes.js` for exact values.

**Night character:** Purple-night (`#2D1B4D`) with lavender transition.

---

### `vivid` — Vívida / Vivid

A saturated variation of Original with boosted contrast and intensity across all atmospheric elements. Golden warm sky, deep purple night, and punchier precipitation colors.

| Key | Value | Rationale |
|---|---|---|
| daySky | `#FFD699` | Saturated warm golden sky (boosted from Original's cream) |
| daySun | `#FFA000` | Deep amber-gold sun (more saturated gold) |
| daySunRay | `#FFD54F` | Bright golden glow |
| nightFill | `#1A0033` | Deep saturated purple-night |
| nightTransitionMid | `#C060D0` | Vibrant malva transition |
| minimapNightFill | `#D080F0` | Saturated lavender (brighter night) |
| nightShadowColor | `rgba(26, 0, 51, 0.20)` | Matches deeper night fill, slightly stronger |
| nightShadowColorTransparent | `rgba(26, 0, 51, 0)` | Matches deeper night fill |
| cloudFill.light | `{ r: 215, g: 220, b: 245, a: 0.55 }` | More saturated blue-gray, higher opacity |
| cloudFill.medium | `{ r: 190, g: 200, b: 230, a: 0.65 }` | |
| cloudFill.heavy | `{ r: 165, g: 175, b: 215, a: 0.75 }` | |
| cloudStroke.light | `{ r: 195, g: 205, b: 235 }` | |
| cloudStroke.medium | `{ r: 170, g: 180, b: 215 }` | |
| cloudStroke.heavy | `{ r: 145, g: 155, b: 195 }` | |
| cloudLayers | RGBA values adjusted to match new saturated blue-gray cloud colors | |
| rainBar | `rgba(25, 130, 210, 0.50)` | More saturated blue, higher opacity |
| rainStroke | `rgba(25, 130, 210, 0.85)` | |
| rainShadow | `rgba(25, 130, 210, 0.45)` | |
| snowBar | `rgba(200, 220, 240, 0.45)` | Brighter white |
| snowStroke | `rgba(200, 220, 240, 0.85)` | |
| snowFlake | `rgba(130, 160, 200, 0.8)` | More saturated blue |
| snowShadow | `rgba(210, 225, 245, 0.8)` | Brighter shadow |
| thunderBar | `rgba(90, 60, 170, 0.45)` | More saturated purple |
| thunderStroke | `rgba(90, 60, 170, 0.85)` | |
| thunderBolt | `#FFD600` | Brighter yellow |
| thunderBoltShadow | `rgba(255, 214, 0, 0.8)` | |
| precipProbRain | `{ r: 25, g: 130, b: 210 }` | More saturated blue |
| precipProbSnow | `{ r: 200, g: 220, b: 240 }` | Brighter icy |
| precipProbThunder | `{ r: 90, g: 60, b: 170 }` | More saturated purple |

**Night character:** Deep saturated purple-night (`#1A0033`) with vibrant malva transition (`#C060D0`).

---

### `pastel` — Pastel

Very soft, cool-toned pastels throughout. Designed for a gentle, low-contrast visual experience.

| Key | Value | Rationale |
|---|---|---|
| daySky | `#D6E8F7` | Soft pastel blue |
| daySun | `#FFF2CC` | Soft pastel yellow |
| daySunRay | `#FFF8E7` | Creamy white glow |
| nightFill | `#2E2252` | Soft deep lavender (less harsh than navy) |
| nightTransitionMid | `#D4C4E8` | Soft malva/purple transition |
| minimapNightFill | `#C8B8E8` | Soft pastel lavender |
| nightShadowColor | `rgba(46, 34, 82, 0.12)` | Softer shadow matching night fill |
| nightShadowColorTransparent | `rgba(46, 34, 82, 0)` | |
| cloudFill.light | `{ r: 195, g: 200, b: 215, a: 0.35 }` | Very soft blue-gray |
| cloudFill.medium | `{ r: 175, g: 180, b: 200, a: 0.45 }` | |
| cloudFill.heavy | `{ r: 155, g: 160, b: 185, a: 0.55 }` | |
| cloudStroke.light | `{ r: 180, g: 185, b: 200 }` | |
| cloudStroke.medium | `{ r: 160, g: 165, b: 185 }` | |
| cloudStroke.heavy | `{ r: 140, g: 145, b: 170 }` | |
| cloudLayers | RGBA values adjusted to use soft blue-gray tones matching new cloud colors | |
| rainBar | `rgba(140, 180, 220, 0.55)` | Soft pastel blue, higher opacity for contrast |
| rainStroke | `rgba(140, 180, 220, 0.80)` | |
| rainShadow | `rgba(140, 180, 220, 0.4)` | |
| snowBar | `rgba(210, 215, 235, 0.50)` | White-lavender soft |
| snowStroke | `rgba(210, 215, 235, 0.80)` | |
| snowFlake | `rgba(180, 190, 215, 0.8)` | |
| snowShadow | `rgba(225, 230, 245, 0.8)` | |
| thunderBar | `rgba(120, 100, 180, 0.50)` | Soft purple pastel |
| thunderStroke | `rgba(120, 100, 180, 0.80)` | |
| thunderBolt | `#E8D5F5` | Pale lavender-yellow |
| thunderBoltShadow | `rgba(232, 213, 245, 0.7)` | |
| precipProbRain | `{ r: 140, g: 180, b: 220 }` | Soft pastel blue |
| precipProbSnow | `{ r: 210, g: 215, b: 235 }` | Soft icy |
| precipProbThunder | `{ r: 120, g: 100, b: 180 }` | Soft purple |

**Night character:** Soft deep lavender (`#2E2252`) with malva/purple transition.

## Design Decisions

### Internal ID for Realista: `classic` kept for backward compatibility

The "Clásica" palette was renamed to "Realista" (es) / "Realistic" (en). Two options were considered for the internal ID:

| Option | Pros | Cons |
|---|---|---|
| Change ID to `realista` | Name matches semantics; clean slate | Breaks localStorage for all existing users — users who had `classic` stored would fall back to default on upgrade |
| Keep ID as `classic` | Backward compatible — no data loss; no migration code needed | Internal ID no longer matches display name |

**Decision:** Keep the internal ID as `classic`. The display name shown in the UI is "Realista" / "Realistic", but the stored key remains `classic`. This avoids a breaking change for existing users and eliminates the need for a migration path.

The `getAtmosphericColor()` fallback logic references `ATMOSPHERIC_PALETTES.classic` by ID, which remains valid.

### Contrast on mobile

- **Pastel palette** uses higher opacity on precipitation bars (0.50–0.55 vs 0.40–0.45 in classic) to maintain visibility on small screens where subtle pastel tones may otherwise wash out.
- **Vívida palette** increases opacity (0.50 for rain, 0.45 for snow, 0.45 for thunder) combined with more saturated color values for a punchy, high-contrast look.
- **Realista palette** keeps original opacity values (0.40–0.50 range), relying on its more saturated sky colors for visual distinction.

### Layering harmony

Colors are designed so each layer (sky → clouds → precip → probability) stays visually distinct, even with semi-transparency stacking. The ordering of layers (bottom to top) on the chart is:

1. Sky gradient (daySky / nightFill)
2. Night shadow overlay
3. Clouds (fill + stroke + layers)
4. Precipitation bars + strokes (rain, snow, thunder)
5. Precipitation probability area

Each palette was tuned so that these layers remain separable — for example, pastel clouds use enough gray to not blend into the pastel sky, and vivid rain bars use enough opacity to punch through the cloud layer.

### Night fills

Each palette has a distinct night character that matches its overall theme:

| Palette | Night Fill | Character |
|---|---|---|
| Realista | `#1A2744` | Realistic deep navy |
| Original | `#2D1B4D` | Purple-night |
| Vívida | `#1A0033` | Deep saturated purple-night |
| Pastel | `#2E2252` | Soft deep lavender |

### `minimapNightFill` is now palette-specific

Previously, the minimap night fill was a shared value across palettes (all used `#e7b9f7`). Now each palette defines its own `minimapNightFill` so the minimap reflects the same color character:

| Palette | minimapNightFill |
|---|---|
| Realista | `#f8e4ff` — soft lavender matching realistic navy night |
| Original | `#e7b9f7` — unchanged (original purple) |
| Vívida | `#D080F0` — saturated lavender matching deep purple night |
| Pastel | `#C8B8E8` — soft pastel lavender matching lavender night |

### Minimap must re-render on palette change

The `onPaletteChange` callback must explicitly call `minimapRenderer.draw()` after invalidating the cache and calling `render()`. The `render()` function only calls `minimapRenderer.updateViewport()` (which updates the viewport indicator position) but does **not** call `minimapRenderer.draw()` (which redraws the minimap canvas content). Without the explicit `draw()` call, the minimap retains stale pixel data from the previous palette.

**Root cause of the bug:** The `onPaletteChange` callback at `src/app.js:94-99` calls `minimapRenderer.invalidateCache()` and `render()`, but `render()` only calls `minimapRenderer.updateViewport()`. The cache is invalidated (set to `null`) but never redrawn because `draw()` is not called. The minimap canvas retains old pixel data until a resize or data reload forces a redraw.

**Fix:** Add `minimapRenderer.draw(state, { PIXELS_PER_HOUR })` after `render()` in the `onPaletteChange` callback.

**Same bug exists in chart theme selector:** The chart theme click handler at `src/app.js:525-534` has the same pattern — `invalidateCache()` + `render()` without `draw()`. The fix should also be applied there for consistency.

## What Does NOT Change

- Original palette stays exactly as-is (unchanged ID, values, and display name)
- `getAtmosphericColor()` function behavior
- `initAtmosphericPaletteSelector()` function
- The palette UI/selector component
- Storage/persistence mechanism (key `'atmosphericPalette'`, StorageService)
- Chart theme system (orthogonal, unaffected)
- Palette shape/structure in `ATMOSPHERIC_PALETTES`
- `MinimapRenderer.draw()` internal behavior — it already reads `getAtmosphericColor()` correctly; it just needs to be called

## Edge Cases

| Input / Situation | Expected behavior |
|---------|------------------------|
| No palette stored in IndexedDB | Defaults to `'classic'` — the new Realista palette |
| Invalid palette ID in storage | Falls back to `'classic'`, logs warning, corrects storage value |
| StorageService unavailable (IndexedDB blocked) | Falls back to `'classic'`, palette selector UI still renders but selection is not persisted |
| Palette changed while data is loading | Palette is applied immediately to `state`; next render cycle uses new colors |
| Theme (dark/light) changed after palette | Both systems are independent; palette colors are applied regardless of theme mode |
| Chart theme changed after palette | Both systems are independent; chart theme affects `getThemeColor()` lookups, palette affects atmospheric-specific colors |
| Old `'warm'` ID in localStorage (after rename to `'vivid'`) | Fallback logic treats unknown IDs as invalid → defaults to `'classic'`, logs warning, corrects storage. One-time migration cost for users who had `warm` stored. |
| Old `'cold'` ID in localStorage (after rename to `'pastel'`) | Same as above — defaults to `'classic'`, logs warning, corrects storage. |
| Palette changed while minimap is in past mode | Minimap redraws with new colors in past mode; overlay color remains from chart theme, unaffected by palette change |
| Palette changed while minimap is in future mode | Minimap redraws with new colors in future mode |

## Test Scenarios

1. **Default state:** App loads with no stored palette → `state.activeAtmosphericPalette === 'classic'` → atmospheric colors match the new Realista palette values exactly
2. **Palette selection:** User clicks "Vívida" → `state.activeAtmosphericPalette === 'vivid'` → all atmospheric elements (sky, clouds, precip bars, probability areas) reflect new vivid colors on next render
3. **Persistence:** User selects "Pastel" palette → reloads app → palette is still "Pastel" (loaded from IndexedDB as `'pastel'`)
4. **Invalid stored value:** IndexedDB contains `'nonexistent'` → app defaults to `'classic'`, storage is corrected
5. **Old ID migration:** IndexedDB contains `'warm'` or `'cold'` (pre-rename IDs) → app defaults to `'classic'`, warning logged, storage corrected
6. **Palette + theme independence:** User selects "Pastel" palette while on "neon" chart theme → both apply independently; chart elements use neon theme, atmospheric elements use Pastel colors
7. **Re-render on change:** Switching palette invalidates all tile caches → scrolling the chart shows new colors everywhere
8. **Minimap reflects palette:** After palette change, minimap re-renders with new atmospheric colors (including palette-specific `minimapNightFill`) — this requires `minimapRenderer.draw()` to be called in the `onPaletteChange` callback
9. **UI reflects current palette:** Opening settings shows correct palette name and swatch highlighted as active
10. **i18n consistency:** Switching language to English shows "Realistic", "Original", "Vivid", "Pastel"; switching to Spanish shows "Realista", "Original", "Vívida", "Pastel"
11. **Minimap palette change in past mode:** User scrolls minimap to past mode → changes palette → minimap redraws with new colors, remaining in past mode
12. **Minimap palette change in future mode:** User scrolls minimap to future mode → changes palette → minimap redraws with new colors, remaining in future mode

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-06-06 | Initial spec | SDD |
| 2026-06-07 | Palette redesign: renamed `classic`→Realista (ID kept), `warm`→`vivid`, `cold`→`pastel`. Added full color value tables for all palettes. Documented contrast strategy, layering harmony, night character, and `minimapNightFill` palette-specific design decisions. Added old-ID migration edge cases. Updated test scenarios to reflect new names. | SDD |
| 2026-06-07 | Bugfix spec: Documented minimap auto-update on palette change. Root cause: `onPaletteChange` callback invalidates cache and calls `render()`, but `render()` only calls `updateViewport()` — not `draw()`. Fix: add `minimapRenderer.draw(state, { PIXELS_PER_HOUR })` after `render()`. Same bug exists in chart theme selector at line 525-534. Added test scenarios 11-12 for past/future mode palette changes. | SDD |
