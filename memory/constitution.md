# WeatherHistogram Constitution

## Core Principles

### I. Vanilla JS SPA
No frameworks. Vite + vanilla HTML/CSS/JS. JSDoc types with `checkJs: true`, `strict: false`. `@` alias maps to project root.

### II. State Management
Single mutable `state` object + frozen `CONFIG` in `src/store.js`. No events/pub-sub — modules read/write `state` directly.

### III. Rendering Pipeline
All drawing goes through `render()`. Never draw to tile canvases outside this function. Three canvas layers in `#chart-area`.

### IV. Test-First for SDD
When using Spec-Driven Development, tests are written before implementation code. Each spec scenario maps to one test case.

### V. PWA First
Service worker with cache-first for static assets, stale-while-revalidate for others. API calls deliberately not intercepted. Offline fallback at `./offline.html`.

### VI. i18n
All UI strings added to both `es` and `en` in `src/utils/i18n.js`.

### VII. Change Tracking
Changelog updated in `CHANGELOG.md` + `src/data/changelog.js` + version bumped in `index.html` + `public/version.json`. Semver `X.Y.Z`; letter suffix for trivial changes.

### VIII. Module Boundaries
- `src/utils/` — pure functions, no side effects, no state access
- `src/services/` — async I/O (fetch, localStorage), read/write state
- `src/domain/` — business logic, orchestrates services
- `src/ui/` — DOM manipulation, event handlers
- `src/render/` — canvas drawing, only called from `render()`
- `src/store.js` — state + CONFIG definition
- `src/app.js` — init orchestration and event wiring

## Spec-Driven Development Rules

### File Locations
- Specs: `specs/<relative-path>.md` (e.g. `specs/utils/color.md`)
- Plans: `plans/<feature-name>/plan.md` + `tasks.md`
- Constitution: `memory/constitution.md`

### SDD Phase Order
1. **Constitution** — verify project principles are current
2. **Specify** — define WHAT, not HOW. Mark ambiguity with `[NEEDS CLARIFICATION]`
3. **Plan** — technical decisions + task breakdown
4. **Implement** — tests first, then code, then verify

### Quality Gates
- `[NEEDS CLARIFICATION]` markers must be resolved before planning
- Tests must pass before code is considered complete
- Lint must have 0 warnings, 0 errors
- Typecheck must pass
- Build must succeed
