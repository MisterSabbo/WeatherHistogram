# Tasks: Minimap Palette Auto-Update

## Execution Order

Tasks must be executed in order. Parallel tasks marked with `[P]`.

### Phase 1: Fix `onPaletteChange` callback

- [ ] Add `minimapRenderer.draw(state, { PIXELS_PER_HOUR })` after `render()` in the `onPaletteChange` callback — `src/app.js:94-99` — after the change, the callback should call `invalidateCache()`, `render()`, then `draw()`

### Phase 2: Fix chart theme selector handler

- [ ] Add `minimapRenderer.draw(state, { PIXELS_PER_HOUR })` after `render()` in the chart theme selector click handler — `src/app.js:525-534` — after the change, the handler should call `invalidateCache()`, `render()`, then `draw()`, then close the bottom sheet

### Phase 3: Verification

- [ ] `npm run lint` — 0 warnings, 0 errors
- [ ] `npm run typecheck` — clean
- [ ] `npm test` — all tests pass
- [ ] `npm run test:e2e` — all E2E tests pass
- [ ] Stage changes: `git add src/app.js specs/atmospheric-palette-selector.md specs/render/MinimapRenderer.md`
