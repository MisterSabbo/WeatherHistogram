### Build & Config

- **Vite** (`vite.config.ts`): standard ESM, base `'./'`, `@` alias to root.
- **ESLint** (`eslint.config.js`): `npm run lint` checks `src/`. Config uses `@eslint/js` recommended rules + `globals` for browser/ES2021.
  - `no-unused-vars` is **error** (not warn) — prefix unused params with `_` to suppress (`argsIgnorePattern: '^_'`, `varsIgnorePattern: '^_'`).
  - `prefer-const` is **error** — never use `let` for variables that aren't reassigned.
  - `no-empty` allows `catch {}` (ES2019+) — use bare `catch {}` instead of `catch(e) {}` when the error is unused.
- **TypeScript JSDoc** (`tsconfig.json`): `checkJs: true` for incremental type-checking via JSDoc annotations. `npm run typecheck` to verify.
- **Vitest** (`vitest.config.js`): jsdom environment for unit tests. `npm test` / `npm test:watch`.
- **Playwright** (`playwright.config.ts`): E2E tests in `tests/e2e/`. `npm run test:e2e` starts dev server automatically on port 3000 and runs all tests.
- **package.json scripts:**
  - `dev` — Vite dev server (port 3000)
  - `build` — production build
  - `preview` — Vite preview of built output
  - `clean` — removes `dist/` (Unix only; use `Remove-Item` on Windows)
  - `lint` — ESLint on `src/`
  - `typecheck` — TypeScript JSDoc check
  - `test` — Vitest unit tests
  - `test:watch` — Vitest in watch mode
  - `test:e2e` — Playwright E2E tests
