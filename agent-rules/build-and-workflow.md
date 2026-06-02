### Install & Run

- **Install & run:** `npm install` then `npm run dev` (Vite on port 3000). Production: `npm run build`.
- **`npm run clean`** runs `rm -rf dist` — **fails on Windows**. Use `Remove-Item -Recurse -Force dist` instead.
- **Entry point:** `src/app.js` — orchestrator that imports all modules. Initialization is split into ~28 named functions (`initStorage`, `initCanvas`, `initTheme`, `initLanguage`, `initViewMode`, etc.). Only touch this file for wiring new init functions or event bindings.
- **Extracted modules** (do not duplicate logic in app.js):
  - `src/domain/WeatherFetcher.js` — fetch workflow with cache, timeout, fallback
  - `src/ui/TopPanel.js` — updates header metrics DOM
  - `src/ui/PullToRefresh.js` — pull-to-refresh gesture handling
  - `src/render/OverlayRenderer.js` — scrubber labels, weather zone, UV block
  - `src/utils/thresholds.js` — dynamic Y-axis limits
- **State store:** `src/store.js` exports a single mutable `state` object and a frozen `CONFIG` constant. No events, no pub/sub — every module reads/writes `state` directly.

### Build & Config

- **Vite** (`vite.config.ts`): standard ESM, base `'./'`, `@` alias to root.
- **ESLint** (`eslint.config.js`): `npm run lint` checks `src/`. 
  - `no-unused-vars` is **error** — prefix unused params with `_` (`argsIgnorePattern: '^_'`, `varsIgnorePattern: '^_'`).
  - `prefer-const` is **error** — never use `let` for variables that aren't reassigned.
  - `no-empty` allows `catch {}` (ES2019+) — use bare `catch {}` instead of `catch(e) {}`.
- **TypeScript JSDoc** (`tsconfig.json`): `checkJs: true` for incremental type-checking. `npm run typecheck` to verify.
- **Vitest** (`vitest.config.js`): jsdom environment. `npm test` / `npm test:watch`.
- **Playwright** (`playwright.config.ts`): E2E in `tests/e2e/`. `npm run test:e2e` auto-starts dev on port 3000.

#### package.json scripts

| Script | Purpose |
|--------|---------|
| `dev` | Vite dev server (port 3000) |
| `build` | Production build |
| `preview` | Vite preview of built output |
| `clean` | `rm -rf dist` (fails on Windows; use `Remove-Item -Recurse -Force dist`) |
| `lint` | ESLint on `src/` |
| `typecheck` | TypeScript JSDoc check |
| `test` | Vitest unit tests |
| `test:watch` | Vitest watch mode |
| `test:e2e` | Playwright E2E tests |
