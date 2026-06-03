# Tasks: Minimap Temperature Labels

## Execution Order
Tasks must be executed in order. Parallel tasks marked with `[P]`.

### Phase 1: Core Module
- [ ] **Update `MinimapTemperatureLabels` class** — `src/render/MinimapTemperatureLabels.js`
  - Constructor with hardcoded config (significanceThreshold=5, minPixelsBetweenLabels=40, tempRange min=-20 max=40)
  - `draw(ctx, data, width, height, step)` method with defensive guard (`!ctx` or `data.length < 3` → return)
  - Local extrema detection (max/min with plateau: first of equal consecutive values)
  - Significance filter: walk extrema list, keep first; then keep each where |temp - lastKept.temp| ≥ threshold
  - Label positioning: peaks above (yOffset=-4), valleys below (yOffset=+5), textAlign center
  - Adaptive flip: if peak label Y < 4, draw below point with top baseline; if valley label Y > height-4, draw above with bottom baseline
  - Boundary clamping: Y clamped to [4, height-4]
  - Collision detection: track `lastDrawnX`, skip if `x - lastDrawnX < 40px`
  - Visual: font `bold 9px ${getThemeFont()}`, color `getThemeColor('tempLine', '#d32f2f')` for both peaks and valleys, shadow halo (white, blur 3)
  - Save/restore ctx state

### Phase 2: Integration
- [ ] **Wire into `MinimapRenderer`** — `src/render/MinimapRenderer.js`
  - Add import: `import { MinimapTemperatureLabels } from './MinimapTemperatureLabels.js'`
  - In constructor: `this.tempLabelRenderer = new MinimapTemperatureLabels()`
  - In `draw()`: insert call between UV indicator bars and "now" indicator line

### Phase 3: Tests `[P]`
- [ ] **Update unit tests** — `src/render/MinimapTemperatureLabels.test.js`
  - Test 13 scenarios from spec: basic peaks/valleys, filtered noise, flat line, short data, plateau, collision skipping, boundary clamping, edge extrema, empty data, two extrema, zero°C crossing, negative temperatures, adaptive flip for extreme peaks
  - Update expected Y values for new offsets (-4/+5 instead of -10/+12)
  - Add test for adaptive flip: verify peak near top edge draws below with textBaseline='top'
  - Mock `normalizeY`, `getThemeColor`, `getThemeFont` (follow existing test pattern from `MinimapRenderer.test.js`)
  - Verify `fillText` called with correct labels (e.g. `"22°"`, `"-3°"`, `"0°"`)
  - Verify `save`/`restore` called

### Phase 4: Verification
- [ ] `npm run lint` — 0 warnings, 0 errors
- [ ] `npm run typecheck` — passes
- [ ] `npm test` — all tests pass (existing + new)
- [ ] `npm run build` — succeeds
