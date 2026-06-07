# Plan: Minimap Palette Auto-Update

## Spec Reference

- `specs/atmospheric-palette-selector.md` — bugfix section (lines 337-345)
- `specs/render/MinimapRenderer.md` — behavior rule 8 (line 97)

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Fix location | `src/app.js` callbacks | Both `onPaletteChange` and chart theme selector handlers already call `invalidateCache()` + `render()` but omit `draw()` |
| Fix approach | Add `minimapRenderer.draw(state, { PIXELS_PER_HOUR })` after `render()` | Matches the pattern used in `toggleTheme()` (line 943), `loadWeather()` (line 909), `handleResize()` (line 1312), and language change handler (line 473) |
| No changes to `MinimapRenderer` | Internal behavior unchanged | `draw()` already reads `getAtmosphericColor()` correctly; it just wasn't being called |

## Architecture

### Root Cause

`render()` (`src/app.js:999-1017`) calls `minimapRenderer.updateViewport()` which only positions the viewport indicator — it does **not** redraw the minimap canvas content. When `invalidateCache()` sets `cacheCanvas = null`, the next `draw()` would recreate it, but `draw()` is never called.

### Callers of `minimapRenderer.draw()` (existing, correct)

| Location | Trigger |
|----------|---------|
| `src/app.js:473` | Language change |
| `src/app.js:691` | View mode switch (daily cards → minimap) |
| `src/app.js:909` | `loadWeather()` |
| `src/app.js:943` | `toggleTheme()` |
| `src/app.js:1312` | `handleResize()` |

### Callers that are missing `draw()` (bug)

| Location | Trigger |
|----------|---------|
| `src/app.js:94-99` | `onPaletteChange` callback |
| `src/app.js:525-534` | Chart theme selector click handler |

## Files to Change

| File | Action | Description |
|------|--------|-------------|
| `src/app.js` | modify | Add `minimapRenderer.draw(state, { PIXELS_PER_HOUR })` after `render()` in two callbacks |

## Dependencies

- `MinimapRenderer.draw()` — already implemented, no changes needed
- `getAtmosphericColor()` — already consumed by `MinimapRenderer.draw()`, no changes needed

## Risk Areas

- **None.** This is a single-line addition per callback, following an established pattern used by 5 other callers. No behavioral change to any module's internal logic.
