### E2E Testing (Playwright)

- **Suite location:** `tests/e2e/` — Playwright with Chromium headless.
- **Mock data:** Deterministic seeded random (`tests/e2e/helpers/mock-data.js`). All Open-Meteo API calls are intercepted via `page.route()` — tests never hit real network.
- **Data determinism:** `generateMockForecast()` and `generateMockAQI()` use seeded PRNG so screenshots are reproducible across runs.

#### When adding a new feature

1. If the feature requires new or modified API response fields, update `tests/e2e/helpers/mock-data.js` first.
2. Add tests in the appropriate directory:
   - `tests/e2e/interaction/` — for button clicks, modal open/close, toggle switches, etc.
   - `tests/e2e/visual/` — for screenshot comparisons (full-page or element-specific).
3. Run the full suite: `npm run test:e2e` (starts dev server automatically on port 3000).
4. If you added or modified screenshot tests, regenerate snapshots: `npx playwright test --update-snapshots` (Windows: npm intercepts the flag, use npx directly).
5. Commit both test files and generated snapshot images (`*.png` in `tests/e2e/*.spec.js-snapshots/`).

#### Snapshot management

- Reference snapshots are stored alongside each spec file (e.g. `tests/e2e/visual/app.spec.js-snapshots/`).
- A global `maxDiffPixelRatio: 0.02` tolerance is set in `playwright.config.ts` to account for minor rendering variance (font rasterization, GPU output).
- On CI, snapshots are compared against committed references. To update, run locally with `--update-snapshots` and commit the changed PNGs.

#### When modifying visual code

Any change to rendering logic, colors, themes, or CSS can break visual snapshots. After modifying these files, always regenerate baselines:

**Trigger files:** `src/render/**/*.js`, `src/theme.js`, `public/themes/*.json`, `src/styles/*.css`

1. Run `npm run test:e2e` — visual tests will fail with pixel diffs.
2. Regenerate: `npx playwright test --update-snapshots` (Windows: use npx directly).
3. Stage updated PNGs: `git add tests/e2e/**/*-snapshots/*.png` and any root-level `visual/` or `interaction/` snapshot dirs.
4. Verify: `npm run test:e2e` passes clean.

#### Available script

```bash
npm run test:e2e                     # run all tests (compares against stored snapshots)
npx playwright test --update-snapshots  # run and overwrite snapshots (Windows: npm intercepts --flag)
```
