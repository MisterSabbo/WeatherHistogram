### Build & Config

- **Vite** (`vite.config.ts`): standard ESM, base `'./'`, `@` alias to root.
- **ESLint** (`eslint.config.js`): `npm run lint` checks `src/`. Config uses `@eslint/js` recommended rules + `globals` for browser/ES2022.
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
