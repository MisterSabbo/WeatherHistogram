### Rendering & Canvas Architecture

- **Tiled canvas rendering:** The main chart is split into 1440px-wide tiles (`const TILE_WIDTH = 1440` in app.js). Each tile is an independent `<canvas>`. Only visible tiles in the viewport are drawn; off-screen tiles are skipped via the `drawn` flag.
- **Three canvas layers** in `#chart-area`:
  1. `main-canvas` — tile canvases (background, grid, weather phenomena, metrics)
  2. `fixed-overlay-canvas` — scrubber labels, NOW indicator, stickman overlay (redrawn every scroll frame)
  3. `stickman-canvas` — animated stickman figure
- **Minimap** (`minimap-canvas`) has its own cached render (`minimapCacheCanvas`) and auto-switches between "past" and "future" mode based on viewport position relative to current time.
- **All rendering goes through `render()`** which iterates tiles and calls `drawTile()`. Never draw to tile canvases outside this function.
- **Render modules** live in `src/render/`: `GridRenderer`, `MetricsRenderer`, `AtmosphereRenderer`, `BackgroundRenderer`, `StickmanRenderer`.
