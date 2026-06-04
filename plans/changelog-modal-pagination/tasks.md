# Tasks: Changelog Modal Pagination

## Execution Order

Tasks must be executed in order. Parallel tasks marked with `[P]`.

### Phase 1: i18n & CSS Foundation

- [ ] `[P]` Add i18n keys for changelog pagination — `src/utils/i18n.js` — Add `config.changelogLoading`, `config.changelogCaughtUp`, `config.changelogLoadError`, `config.changelogRetry` to both `es` and `en` sections. Verify with `npm run lint`.

- [ ] `[P]` Add changelog CSS classes — `src/styles/modals.css` — Add all 14 new classes: `.changelog-block-enter`, `.changelog-loading`, `.changelog-caught-up`, `.changelog-sentinel`, `.changelog-error`, `.changelog-entry`, `.changelog-entry-major`, `.changelog-entry-marker`, `.changelog-entry-content`, `.changelog-entry-header`, `.changelog-entry-tag`, `.changelog-entry-title`, `.changelog-entry-desc`. Match existing inline style values from current `ChangelogModal.js`. Verify with `npm run lint`.

### Phase 2: Core Pagination Logic

- [ ] Refactor ChangelogModal.js to paginated rendering — `src/ui/ChangelogModal.js` — Implement:
  - `PAGE_SIZE = 10` constant
  - Module-level state: `observer`, `sentinel`, `isLoading`, `currentIndex`
  - `createEntryElement(item, index)` — builds `<li>` with CSS classes (no inline styles)
  - `createBlock(startIndex, count)` — returns `DocumentFragment` of entries
  - `createSentinel()` — invisible `<li>` for IntersectionObserver
  - `createLoadingIndicator()` — `<li>` with `aria-live="polite"` and localized text
  - `createCaughtUpIndicator()` — end-of-list `<li>`
  - `createErrorMessage(retryCallback)` — error `<li>` with retry link
  - `renderInitialBlock()` — renders first 10 entries + sentinel + observer setup
  - `loadNextBlock()` — loads next 10 entries with 150ms delay, loading indicator, block fade-in
  - `showChangelogModal()` — manages observer lifecycle (connect on open, disconnect on close)
  - Keep `openChangelogDetail()` unchanged
  - Keep `initChangelog()` unchanged
  - Verify: `npm run lint && npm run typecheck`

### Phase 3: Tests

- [ ] Expand unit tests for pagination — `src/ui/ChangelogModal.test.js` — Add tests for:
  - Initial 10 entries rendered (mock 15 entries)
  - Sentinel present after initial render
  - Load more on intersection (mock IntersectionObserver)
  - All caught up indicator after all entries loaded
  - ≤10 entries: no sentinel, no observer
  - Single version mode: 1 entry, no sentinel
  - Error recovery: sentinel restored, error message shown
  - Loading indicator shown during load
  - CSS classes applied (no inline styles)
  - Observer disconnected on close
  - Update existing tests to work with new DOM structure
  - Verify: `npm test`

### Phase 4: E2E & Snapshots

- [ ] Update E2E tests and snapshots — `tests/e2e/` — Update existing changelog E2E tests to account for 10-entry initial render. Regenerate all changelog-related snapshots with `npx playwright test --update-snapshots`. Verify: `npm run test:e2e`

### Phase 5: Verification

- [ ] Full verification suite — Run in order:
  - `npm run lint` — 0 warnings, 0 errors
  - `npm run typecheck` — clean
  - `npm test` — all tests pass
  - `npm run test:e2e` — all E2E tests pass
  - `npm run build` — production build succeeds

### Phase 6: Changelog & Version

- [ ] Update changelog and version — `CHANGELOG.md`, `src/data/changelog.js`, `index.html` (`#app-version-label`), `public/version.json` — Add entry for paginated changelog feature. Follow existing version pattern.

- [ ] Stage changes — `git add` all modified files. Do NOT commit. Present diff to user for review.
