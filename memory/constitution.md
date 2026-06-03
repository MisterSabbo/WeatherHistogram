# WeatherHistogram — Agent Constitution

> **Version:** 3.0
> **Last Updated:** 2026-06-03
> **Status:** Ratified
> **Supersedes:** All prior agent-rules/ files as the authoritative reference; this constitution is the single governing document. Agent-rules files remain as boot-time instructions (loaded via opencode.json) and may contain operational specifics not duplicated here.
>
> This constitution is the supreme governing document for all AI agents operating within the WeatherHistogram project. Every action, decision, and output must comply with its clauses. In case of conflict, this constitution takes precedence over all other project documentation.

---

## Preamble

This constitution establishes the principles, rules, and procedures that govern all AI agent activity within the WeatherHistogram project. It is designed to ensure consistency, quality, security, and maintainability across all contributions. The constitution shall be interpreted in good faith, with an emphasis on the spirit rather than just the letter of its clauses.

---

## Article I: Core Principles

These principles are **immutable**. They may only be amended through the constitutional amendment process (Article XII).

### I-A. Vanilla JS SPA (No Framework Rule)

No JavaScript frameworks, libraries, or build-time dependencies beyond Vite are permitted. The project uses vanilla HTML/CSS/JS with JSDoc type annotations (`checkJs: true`, `strict: false`). The `@` import alias maps to the project root.

### I-B. Single Mutable State

All application state resides in a single mutable `state` object exported from `src/store.js`. Constants are defined in a frozen `CONFIG` object. No event system, pub/sub, or reactive framework is used — modules read and write `state` directly.

### I-C. Rendering Pipeline Integrity

All canvas drawing must go through the centralized `render()` function. No module may draw directly to tile canvases outside this function. The three canvas layers (`main-canvas` tiles, `fixed-overlay-canvas`, `stickman-canvas`) and the minimap must only be drawn through established render functions.

### I-D. PWA First

The application is designed as a Progressive Web App. Service worker (`sw.js`) uses cache-first for static assets and stale-while-revalidate for other resources. API calls (Open-Meteo, OpenStreetMap, fonts.googleapis/gstatic) and `/version.json` must not be intercepted. An offline fallback must exist at `./offline.html`.

### I-E. Internationalization (i18n)

All user-facing UI strings must support both Spanish (`es`) and English (`en`) locales. Strings are added to `src/utils/i18n.js` in both languages. HTML uses `data-i18n`, `data-i18n-title`, and `data-i18n-placeholder` attributes. JavaScript uses the `t('key')` function.

### I-F. Repository Language (English-Only)

All repository files — including code identifiers, comments, commit messages, documentation, configuration files, and asset naming — must be written in English. The only exceptions are explicit locale translation files (e.g., i18n entries, locale-specific JSON, or translated documentation variants).

### I-G. Change Tracking & Versioning

All significant changes must be recorded in:
- `CHANGELOG.md` (human-readable markdown)
- `src/data/changelog.js` (embedded JS data consumed by the app)
- `index.html` (`#app-version-label`)
- `public/version.json` (machine-readable version)

Versioning follows Semver `X.Y.Z`. A letter suffix (e.g., `1.2.3a`) indicates trivial changes and resets when `X`, `Y`, or `Z` increments.

### I-H. Spec-Driven Development (SDD)

All behavior-changing work begins with a specification. The SDD lifecycle has four phases: **Constitution → Specify → Plan → Implement**. Bug fixes that are a single line with no behavior change may skip SDD; everything else requires it.

### I-I. Security & Privacy

- **No secrets in code.** API keys, tokens, passwords, or credentials must never be committed to the repository.
- **User geolocation** requires explicit user consent via the browser Permissions API.
- **IndexedDB/localStorage data** is limited to user preferences and cached weather history. No analytics, tracking, or telemetry is permitted.
- **Content Security Policy** headers must be maintained and not weakened.
- **Third-party scripts** (CDNs) must be pinned to specific versions and loaded over HTTPS.

---

## Article II: Agent Conduct Rules

### II-A. Never Commit Directly

Agents must **never** execute `git commit`. Changes are staged with `git add` only. If asked to commit, the agent must inform the user that commits are disabled and explain the staging-only policy. This applies even if the user explicitly says "yes" to a plan — the agent must ask specifically for commit authorization before proceeding.

### II-B. Pre-Action Checklist

Before every task, agents must verify in order:

1. **Read AGENTS.md** — all sections before any edit or action
2. **Load relevant architecture doc** — see "Read on demand" table in AGENTS.md
3. **Never commit** — `git add` only
4. **Significant change?** (adds/removes files, modifies `src/app.js`, refactors architecture) → Update changelog and version
5. **Adding UI strings?** → Add to both `es`/`en` in `src/utils/i18n.js`
6. **Changing user-facing behavior?** → Update README.md
7. **E2E fails after intentional changes?** → Update mock data → modify tests → `--update-snapshots`
8. **Complex task?** (3+ files across dirs, multiple architectural layers) → Delegate to subagent
9. **SDD applies?** → Check SDD mode; trivial bugfix → skip; else → `Task(general + sdd-orchestrator)`
10. **Respect SOLID** — SRP, OCP, LSP, ISP, DIP
11. **All rendering goes through `render()`**
12. **Verify code** → `npm run lint && npm run typecheck && npm test && npm run test:e2e`
13. **After changes** → `git diff --cached && git diff`, then propose commit message
14. **Task done?** → Update memory (MCP server)
15. **Final audit** → Invoke `@project-auditor` to verify all rules followed

### II-C. Subagent Delegation

- **Complex tasks** (3+ files across multiple directories, multiple architectural layers) must be delegated to an appropriate subagent.
- **SDD tasks** must use `Task(general + sdd-orchestrator)`.
- **Brainstorming/ideation** must use the `feature-brainstorming` skill via the brainstorm-initiator agent.
- **Feature tickets** must use the `feature-ticket-creator` skill via the story-ticket-launcher agent.
- If uncertain which subagent is appropriate, ask the user.

### II-D. Skill Loading Protocol

Before responding, evaluate if a skill should be loaded:

| If the user says... | Load skill |
|---|---|
| New feature, enhancement, bugfix, refactor, or any change request | `feature-ticket-creator` |
| Create or edit a skill | `writing-skills` |
| Spec-Driven Development | `sdd-orchestrator` |
| Brainstorm/idea generation | `feature-brainstorming` |
| PWA issues on iOS | `ios-pwa-compatibility` |
| PWA issues on Android | `android-web-compatibility` |
| PWA compliance audit | `auditing-pwa-deployment` |
| PWA dual-mode verification | `ensure-pwa-dual-mode` |
| Mobile-first design audit | `dev-mobile-first` |
| Frontend design/UI creation | `frontend-design` |

### II-E. Authority & Autonomy

Agents operate with the following decision-making hierarchy:

1. **Act autonomously** when:
   - Following established patterns (adding a function to an existing module that matches the module's conventions)
   - Making trivial formatting/style fixes
   - Running standard verification commands
   - Updating changelogs and versions following the established pattern

2. **Ask the user before acting** when:
   - The task affects the project architecture (adding/removing files, modifying `src/app.js`)
   - A decision could break backward compatibility
   - Multiple valid approaches exist with no clear precedent
   - The user's request is ambiguous or underspecified
   - A security or privacy concern arises
   - The task involves external service API changes
   - Adding new dependencies (project has none beyond Vite and dev dependencies)

3. **Escalate to a human** when:
   - The constitutional amendment process is needed (Article XII)
   - A policy decision beyond the project scope is required
   - The task involves legal, ethical, or compliance issues
   - User asks to modify the constitution itself (refuse and direct to amendment process)

---

## Article III: Architecture & Code Standards

### III-A. Module Boundaries & Responsibilities

| Directory | Responsibility | Constraints |
|-----------|---------------|-------------|
| `src/utils/` | Pure functions, no side effects | Must NOT access `state` or DOM |
| `src/services/` | Async I/O (fetch, IndexedDB, localStorage) | May read/write `state` |
| `src/domain/` | Business logic, orchestrates services | Coordinates services, manages cache |
| `src/ui/` | DOM manipulation, event handlers, modals | May read/write `state`, must NOT render to canvas |
| `src/render/` | Canvas drawing functions | Only called from `render()`, must NOT manipulate DOM |
| `src/store.js` | State + CONFIG definition | Standalone, no imports from project |
| `src/data/` | Static data files (changelog, skins) | Standalone, no imports from project |
| `src/app.js` | Init orchestration and event wiring | Only touch for wiring new inits or event bindings. Do NOT duplicate logic extracted to modules |

### III-B. Naming Conventions

- **Variables/Functions:** camelCase
- **Classes:** PascalCase
- **Files:** Match the primary export name (e.g., `StorageService.js` exports `storageService`)
- **Test files:** `*.test.js` co-located alongside source (e.g., `src/store.test.js`)
- **Spec files:** `specs/<relative-path>.md` (e.g., `src/utils/color.js` → `specs/utils/color.md`)

### III-C. Imports

- ES module `import`/`export` syntax only
- Use `@` alias for project root imports (e.g., `import { state } from '@/src/store.js'`)
- Group imports: internal (`src/`) first, then external (npm), then globals/browser APIs
- No circular dependencies

### III-D. CSS Architecture

- `src/style.css` is an `@import` index of 8 modules in `src/styles/`
- Edit the individual modules, not the index
- CSS `@import` order (from `src/style.css`): `variables.css` → `controls.css` → `layout.css` → `daily-cards.css` → `minimap.css` → `year-in-pixels.css` → `modals.css` → `animations.css`

### III-E. ESLint Rules (enforced, must be 0 warnings, 0 errors)

| Rule | Setting | Notes |
|------|---------|-------|
| `no-unused-vars` | `error` | Prefix unused params with `_` |
| `prefer-const` | `error` | Never use `let` for non-reassigned variables |
| `no-var` | `error` | Always use `const`/`let` |
| `no-undef` | `error` | All globals must be declared |
| `no-empty` | `error` | Allows `catch {}` (ES2019+) — use bare `catch {}` instead of `catch(e) {}` |
| CI gate | `--max-warnings 0` | Any warning or error fails CI |

### III-F. Error Handling

- Use `try/catch` with `console.error` for logging
- For async operations, prefer `try/catch` over `.catch()` chains
- Show user-facing errors via `showError()` in app.js or DOM updates
- Use bare `catch {}` for non-critical operations where failure is acceptable (e.g., optional data fetching)
- Network requests: implement timeout (15s), cache fallback, and mock data fallback patterns (see `WeatherFetcher.js`)

### III-G. Constants (from frozen CONFIG in src/store.js)

| Constant | Default Value | Notes |
|----------|---------------|-------|
| `CHART_HEIGHT` | 250 | Pixels |
| `MINIMAP_HEIGHT` | 80 | Pixels |
| `TILE_WIDTH` | 1440 | Overridden to 720 on mobile (<600px) |
| `PIXELS_PER_MM` | 10 | Precipitation scaling |
| `CACHE_DURATION` | 300000 (5 min) | Weather data cache TTL |
| `DEFAULT_COORDS` | `{lat: 40.4167, lon: -3.70325, name: "Madrid"}` | Fallback location |
| `PIXELS_PER_HOUR` | 60 (desktop) / 50 (mobile) | On `state`, not CONFIG (dynamic) |
| `getDPR()` | `Math.min(window.devicePixelRatio || 1, 2)` | Exported from `src/store.js`; caps at 2 for canvas resolution |

- `.nvmrc` specifies **Node.js 24** — must be used for development and CI

### III-H. DOM Manipulation Patterns

- Use `document.getElementById()` for known static elements
- Use `querySelector`/`querySelectorAll` for dynamic lookups
- Bottom sheets use `openBottomSheet()`/`closeBottomSheet()` pattern
- Collapsible sections use `.collapsible-trigger` / `.collapsible` / `.open` pattern
- All inline styles should be CSS variables (`var(--bg-color)`) or minimal dynamic values
- Do not add explanatory comments to code — let the code speak for itself

### III-I. Year in Pixels (YIP) System

- **Purpose:** Per-day mood tracking, health conditions (cold/allergies), personal notes, and weather parameter visualization in a calendar grid
- **Module:** `src/ui/YearInPixels.js` — exports `initYearInPixels`, `renderYIPGrid`, `saveDayNote`, `saveDayMoods`, `saveDayDetail`, `openYIPDetail`, `updateYipScrollUI`, `closeYipModal`
- **Moods:** 6 predefined states (happy/😊, neutral/😐, sad/😢, angry/😠, anxious/😰, tired/😴) with distinct colors; multi-select per day
- **Health conditions:** Cold (🤧) and Allergies (🌿) — boolean toggles per day, persisted via `StorageService.updateDayConditions()`
- **Notes:** Free-text per day, persisted via `StorageService.updateDayNotes()`
- **Unified persistence:** `StorageService.updateDayData()` saves all fields (notes, moods, cold, allergies) atomically
- **Grid rendering:** 12 monthly blocks with 7-column day grids per month; scroll-snapping per month on mobile (`scroll-snap-type: y mandatory` on `.yip-modal-scroll-content`)
- **Parameters displayed:** Temperature (max/min/apparent), Precipitation, Wind (max/gusts), AQI, Pollen (6 species: alder, birch, grass, mugwort, olive, ragweed), Mood, Health (cold, allergies)
- **Legend:** Two-tab system — Cell tab (parameter color scale) and State tab (condition dots: blue=notes, gold=mood, red=cold, green=allergies)
- **DOM elements:** `#yip-modal`, `#yip-modal-backdrop`, `#yip-modal-scroll-content`, `#yip-grid-container`, `#yip-location-chips`, `#yip-param-display`, `#yip-detail-sheet`, `#yip-sheet-backdrop`, `#yip-detail-sheet-scroll-content`, `#yip-cold-toggle`, `#yip-allergies-toggle`
- **Location management:** Horizontal chip selector with pagination dots; delete location or individual month data via IndexedDB
- **CSS:** Dedicated module at `src/styles/year-in-pixels.css` — responsive: bottom sheet on mobile (<768px, ≥95dvh, border-radius top), centered modal on desktop (scale animation)
- **Drag-to-dismiss:** Pointer events with 100px threshold; swipe-down gesture on scroll content when `scrollTop === 0`
- **Storage:** IndexedDB object store `historyData` via `StorageService` — methods: `getHistory()`, `setHistory()`, `updateDayNotes()`, `updateDayMoods()`, `updateDayConditions()`, `updateDayData()`

---

## Article IV: Testing & Verification Requirements

### IV-A. Verification Order

All code changes must be verified in this exact order:

```bash
npm run lint          # 0 warnings, 0 errors
npm run typecheck     # tsc --noEmit - clean
npm test              # All tests pass
npm run test:e2e      # All E2E tests pass (snapshot comparisons)
```

For non-trivial changes, also verify:
```bash
npm run build         # Production build succeeds
```

### IV-B. Unit Tests (Vitest + jsdom)

- **Framework:** Vitest with jsdom environment
- **Location:** `*.test.js` files co-located with source files
- **Coverage:** `passWithNoTests: true` — no minimum coverage threshold, but all code paths should be tested
- **Pattern:** Each spec scenario → one `it(...)` block
- **Mocks:** Use `vi.fn()` for functions, `page.route()` for E2E API interception
- **DOM tests:** Set up HTML in `beforeEach` blocks
- **Async tests:** Mock `fetch` with `vi.fn()`

### IV-C. E2E Tests (Playwright)

- **Suite location:** `tests/e2e/` — Chromium headless, single worker
- **Mock data:** Deterministic seeded random in `tests/e2e/helpers/mock-data.js`
- **API interception:** All Open-Meteo API calls intercepted via `page.route()` — tests never hit the real network
- **Categories:**
  - `tests/e2e/interaction/` — button clicks, modal open/close, toggle switches
  - `tests/e2e/visual/` — screenshot comparisons (full-page or element-specific)
- **Snapshots:** Stored alongside each spec file in `{testFileDir}/{testFileName}-snapshots/{arg}{ext}`
- **Tolerance:** `maxDiffPixelRatio: 0.07` (7%) in `playwright.config.ts`
- **When adding features:** Update mock data first → add/modify tests → `--update-snapshots` → commit both tests and generated PNGs

### IV-D. Quality Gates

Before any task is considered complete:

- [ ] `npm run lint` — 0 warnings, 0 errors
- [ ] `npm run typecheck` — clean
- [ ] `npm test` — all tests pass
- [ ] `npm run test:e2e` — all E2E tests pass
- [ ] `npm run build` — production build succeeds
- [ ] `[NEEDS CLARIFICATION]` markers resolved (if SDD mode was `full`)
- [ ] Changelog + version updated (if significant change)
- [ ] i18n strings added to both `es`/`en` (if UI strings changed)
- [ ] README.md updated (if user-facing behavior changed)
- [ ] No git commits made (only staged files)
- [ ] SOLID principles respected
- [ ] `@project-auditor` invoked and passed

---

## Article V: Spec-Driven Development (SDD) Rules

### V-A. SDD Phase Order

```
Constitution → Specify → Plan → Implement
```

### V-B. Mode Detection

| Mode | When | Phases |
|------|------|--------|
| `spec` | Code exists, no spec | Constitution (verify) → Specify |
| `full` | New feature, user story, or code update | Constitution → Specify → Plan → Implement |
| `crawl` | Multiple modules without specs (directory or project-wide) | Scan → Sort → [spec or full per module] |

### V-C. File Locations

| Artifact | Path |
|----------|------|
| Constitution | `memory/constitution.md` |
| Specs | `specs/<relative-path>.md` (e.g., `specs/utils/color.md`) |
| Plans | `plans/<feature-name>/plan.md` |
| Tasks | `plans/<feature-name>/tasks.md` |

### V-D. Specification Rules

- Specs define **WHAT**, not **HOW** — no implementation details
- Ambiguities marked with `[NEEDS CLARIFICATION: question]` must be resolved before planning
- Specs must document: public API, dependencies, state access, DOM dependencies, business logic, edge cases, and test scenarios

### V-E. Plan Rules

- Plans must include: technical decisions with rationale, architecture, files to change, dependencies, risks
- Tasks must be ordered and actionable with acceptance criteria
- Parallel tasks marked with `[P]`

### V-F. Implementation Rules

- Write tests first, then implement
- Follow the spec exactly (exports, signatures, return types)
- No explanatory comments in code
- Verify after each task, run full verification suite after all tasks

---

## Article VI: Memory & Knowledge Management (MCP)

### VI-A. Session Start

On session start, agents must load context from the memory graph:
1. `search_nodes` to find relevant entities
2. `read_graph` to understand existing relationships

### VI-B. Creating Entities

When creating or modifying components:
1. `create_entities` for each module with observations (exports, dependencies, state access, key behaviors)
2. `create_relations` for each import relationship (direction: importer → imported)

### VI-C. Task Completion

On task completion:
1. `add_observations` to relevant entities summarizing what was implemented
2. Note any issues encountered and next steps
3. Do not mark "Complete" until memory server is updated

### VI-D. Conflict Resolution

If file content conflicts with memory data:
1. Prioritize memory data (it reflects the latest decisions)
2. Consult the user before making destructive changes
3. Do not overwrite memory without user confirmation

---

## Article VII: Theme & Configuration Rules

### VII-A. Theme System

- Built-in chart themes: `default`, `neon`, `pastel`
- Themes loaded from `./themes/{id}.json` with fallback to `./public/themes/{id}.json`
- Access via `getThemeColor('key')`, `getThemeIcon('key')`, `getThemeFont('fallback')`
- Dark/light mode toggle persists `state.theme` via StorageService
- Chart theme (`state.activeChartTheme`) persists via StorageService

### VII-B. Theme Changes

When changing theme:
1. Call `loadChartTheme(id)` to load and apply
2. Persist via `storageService.set()`
3. Set all tile `drawn = false` to invalidate caches
4. Trigger re-render via `render()`

---

## Article VIII: PWA & Deployment Rules

### VIII-A. Manifest & Standalone Mode

- **Manifest:** `manifest.json` includes `display_override: ['standalone']` for robust standalone mode on Android Chrome
- **Detection:** PWA standalone mode detected via `display-mode: standalone` or `navigator.standalone`; add `pwa-standalone` class to `<html>` element

### VIII-B. Service Worker

- SW registered in `app.js` via `registerSW()` with update callback
- Cache-first for static assets (JS, CSS, HTML, fonts)
- Stale-while-revalidate for other resources
- API calls and `/version.json` must NOT be intercepted
- Offline fallback at `./offline.html`

### VIII-C. Version Checking

`checkAppVersion()` fetches `/version.json` from network and compares against running version. If different, prompt user to update.

### VIII-D. GitHub Pages Compatibility

- Build output must use relative paths (`base: './'` in Vite config)
- SPA routing: no server-side URL rewriting needed (single page app)
- Offline.html must work as standalone fallback

---

## Article IX: Data Flow & Rendering Rules

### IX-A. Data Flow Pipeline

```
app.js:loadWeather()
  → fetchWeatherData() (domain/WeatherFetcher)
    → WeatherService.getWeatherData() (API call)
    → raw data → state.rawForecast / state.rawAQI
  → processData() (DataProcessor)
    → state.hourlyData[] / state.dailyData[] / state.sunData
  → render() triggered
    → iterate visible tiles → drawTile() per uncached tile
    → drawFixedOverlay() (scrubber labels, stickman, weather zone)
    → MinimapRenderer.render()
```

### IX-B. Rendering Rules

1. **All drawing** goes through `render()` — never draw to tile canvases outside it
2. **Tiled canvas:** `TILE_WIDTH` is 1440px (desktop) or 720px (mobile). Each tile is an independent `<canvas>`
3. **Only visible tiles** in the viewport are drawn via `drawn` flag
4. **On resize** (`handleResize`): clear all tiles, recalculate dimensions, redraw
5. **`drawFixedOverlay()`** has custom label collision detection via `state.labelRects` — reset each frame
6. **Theme changes** invalidate all tile caches (`tile.drawn = false`) and re-render
7. **Scroll-driven rendering:** `scroll` on `#scroll-container` calls `render()` via `requestAnimationFrame`
8. **Minimap** has its own cached rendering, auto-switches past/future mode based on viewport position

---

## Article X: Interaction & UI Rules

### X-A. Scroll & Navigation

- Scroll on `#scroll-container` triggers `render()` via `requestAnimationFrame` (debounced)
- Minimap click-to-scroll: `MinimapRenderer.handleClick()` sets `scrollContainer.scrollLeft`
- Pointer drag for mouse, touch events for mobile — both set `state.isDragging` and trigger `render()`
- Floating "Now" button appears when scrolled away from current time position
- Pull-to-refresh: `PullToRefresh.js` with touch drag-down gesture, 80px threshold
- **Navigation API back-prevention:** `window.navigation` `navigate` event intercepts `traverse` type when `window._preventBackNav` is set (triggered on `#scroll-container` scroll, cleared after 400ms idle) — prevents accidental browser back/forward gestures during chart scrolling

### X-B. View Modes

- Two view modes: minimap (default) and daily cards (`state.isDailyCardsView`)
- Toggled via `toggle-nav-btn`. Persisted as `viewMode` in StorageService

### X-C. Bottom Sheets

- Swipe-to-dismiss with velocity detection
- Dynamic z-index stacking for multiple overlays
- Pointer events with touch fallback
- Scroll-top guard: swipe-down closes when `scrollTop === 0`
- Three modal backdrops: `pill-sheet-backdrop`, `info-sheet-backdrop`, `.yip-sheet-backdrop`

---

## Article XI: Enforcement & Violations

### XI-A. Compliance Officer Role

The `sdd-constitution` agent in `.opencode/agents/sdd-constitution.md` serves as the constitutional compliance officer. Its responsibilities:

1. When presented with a policy question, action, or plan, analyze against constitutional clauses
2. Provide a clear verdict: **compliant**, **non-compliant**, or **ambiguous**, with detailed reasoning
3. If non-compliant, suggest specific modifications to achieve compliance
4. If ambiguous, identify the uncertainty and recommend seeking clarification or updating the constitution
5. Always cite specific clauses supporting the analysis
6. Be proactive in identifying potential issues before they become problems
7. Do not exceed authority; escalate to humans for policy changes

### XI-B. Violation Severity

| Severity | Definition | Consequence |
|----------|------------|-------------|
| **Critical** | Security/privacy violation, secrets in code, destructive data loss | Immediate halt, escalate to human |
| **Major** | Architectural rule violation, rendering outside render(), committed changes | Must be fixed before any further work |
| **Minor** | Style inconsistency, missed changelog update, missed i18n string | Fix before task marked complete |
| **Suggestion** | Pattern improvement, optimization opportunity | Document for future consideration |

### XI-C. Audit Protocol

1. Before any task is marked complete, invoke `@project-auditor` (`.opencode/agents/project-auditor.md`)
2. The auditor checks: git state, changelog/version, i18n, README, no commits, SOLID principles
3. Report all findings — violations must be fixed, suggestions may be deferred
4. Only after audit passes may the task be considered complete

### XI-D. Retry Policy

- Phase failures in SDD: max 2 retries per phase
- Same failure after 2 retries → abort and report to user
- User may skip a gate or provide manual fix

---

## Article XII: Constitutional Amendment Process

### XII-A. Proposal

Any agent or human may propose a constitutional amendment by:
1. Drafting the proposed change with rationale
2. Identifying which clauses are affected
3. Assessing impact on existing rules and project state

### XII-B. Review

1. The proposed amendment must be reviewed by a human maintainer
2. Impact analysis must consider: backward compatibility, rule conflicts, enforcement feasibility
3. All affected clauses must be re-verified for internal consistency

### XII-C. Ratification

1. Amendment takes effect only after:
   - Human maintainer approval
   - Update to `memory/constitution.md` with new version
   - Changelog entry documenting the amendment
   - Broadcast to all active agents (via memory graph update)

### XII-D. Refusal

Agents must refuse direct requests to modify the constitution and instead direct the requester to this amendment process.

---

## Article XIII: Final Provisions

### XIII-A. Interpretation

Where multiple interpretations of a clause exist:
1. The interpretation that best serves the project's long-term health prevails
2. Precedent from previous decisions should guide interpretation
3. When in doubt, consult the human maintainer

### XIII-B. Severability

If any clause of this constitution is found invalid or unenforceable, the remaining clauses remain in full force and effect.

### XIII-C. Supremacy

This constitution is the supreme governing document. In case of conflict between this constitution and any other project documentation (including AGENTS.md, agent-rules files, or README.md), this constitution prevails.

---

*Ratified by project maintainer on 2026-06-03. This constitution replaces memory/constitution.md v2 as the single governing document for AI agent activity in the WeatherHistogram project. Agent-rules files remain as boot-time instructions with operational specifics.*
