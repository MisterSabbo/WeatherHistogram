# Plan: Changelog Modal Pagination

## Spec Reference
`specs/ui/ChangelogModal.md`

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Pagination strategy | IntersectionObserver with sentinel element | Native browser API, no dependencies, works on all modern browsers. Spec mandates this approach. |
| Page size | 10 entries per block | Per spec. Balances initial render cost with scroll depth. |
| Observer rootMargin | `0px 0px 200px 0px` | Per spec. Triggers load 200px before sentinel enters viewport, providing smooth UX. |
| Animation | Block-level fade-in via `.changelog-block-enter` CSS class | Per spec. Simpler than per-item stagger, lower layout thrashing. |
| Inline style removal | Replace all `style.*` assignments with CSS class toggles | Per spec. Improves maintainability and enables CSS-based theming. |
| Error handling | try/catch in observer callback, sentinel restoration + retry link | Per spec. Graceful degradation without breaking the modal. |
| Fallback for old browsers | Render all entries immediately if IntersectionObserver unavailable | Per spec edge case. Ensures functionality on very old browsers. |
| Loading guard | `isLoading` boolean flag | Per spec. Prevents concurrent load triggers from rapid scrolling. |

## Architecture

### Module Changes

**`src/ui/ChangelogModal.js`** — Major refactor:
- Add `PAGE_SIZE = 10` constant
- Add module-level state: `observer`, `sentinel`, `isLoading`, `currentIndex`
- New helper: `createEntryElement(item, index)` — builds a single `<li>` with CSS classes
- New helper: `createBlock(startIndex, count)` — builds a `DocumentFragment` of entries
- New helper: `createSentinel()` — creates the observer trigger element
- New helper: `createLoadingIndicator()` — creates the loading `<li>`
- New helper: `createCaughtUpIndicator()` — creates the end-of-list `<li>`
- New helper: `createErrorMessage()` — creates error state with retry link
- Refactor `renderChangelogData()` → split into `renderInitialBlock()` and `loadNextBlock()`
- Refactor `showChangelogModal()` to manage observer lifecycle (connect on open, disconnect on close)
- Keep `openChangelogDetail()` unchanged (detail sheet behavior is out of scope)

**`src/styles/modals.css`** — Add changelog CSS classes:
- `.changelog-block-enter` — opacity transition for block fade-in
- `.changelog-loading` — loading state styling
- `.changelog-caught-up` — end-of-list styling
- `.changelog-sentinel` — zero-height invisible element
- `.changelog-error` — error state with retry link
- `.changelog-entry` — base entry styles (replaces inline styles on `<li>`)
- `.changelog-entry-major` — accent marker variant for `.0` versions
- `.changelog-entry-marker` — timeline dot
- `.changelog-entry-content` — card wrapper
- `.changelog-entry-header` — flex row
- `.changelog-entry-tag` — badge
- `.changelog-entry-title` — version text
- `.changelog-entry-desc` — description text

**`src/utils/i18n.js`** — Add 4 new keys in both `es` and `en`:
- `config.changelogLoading`
- `config.changelogCaughtUp`
- `config.changelogLoadError`
- `config.changelogRetry`

### Data Flow

```
showChangelogModal(version?, onUpdate?)
  ├─ version provided → renderSingleVersion() [no pagination]
  └─ no version → renderInitialBlock()
       → render first 10 entries
       → createSentinel()
       → createObserver() watching sentinel
       → onIntersection():
            hide sentinel → show loading → wait 150ms
            → append next 10 via DocumentFragment
            → remove loading → re-show sentinel (or show "caught up")
            → block fade-in via .changelog-block-enter
```

### Observer Lifecycle

```
showChangelogModal() → connect observer
closeSheet()         → disconnect observer, reset state
```

## Files to Change

| File | Action | Description |
|------|--------|-------------|
| `src/ui/ChangelogModal.js` | modify | Refactor to paginated rendering with IntersectionObserver, replace inline styles with CSS classes |
| `src/styles/modals.css` | modify | Add 14 new CSS classes for changelog entry styling and pagination indicators |
| `src/utils/i18n.js` | modify | Add 4 new i18n keys (es + en) for loading, caught-up, error, retry |
| `src/ui/ChangelogModal.test.js` | modify | Expand tests to cover pagination, sentinel, observer lifecycle, error handling, CSS classes |

## Dependencies

### Internal modules
- `../data/changelog.js` — `changelogData` (existing, no changes)
- `../utils/i18n.js` — `t` (needs new keys)
- `./BottomSheet.js` — `openBottomSheet` (existing, no changes)

### External packages
- None (IntersectionObserver is a browser API)

## Risk Areas

| Risk | Mitigation |
|------|------------|
| Observer double-triggering rapid scrolls | `isLoading` guard flag; hide sentinel before loading |
| Modal closed mid-load | Disconnect observer on close; reset all state on next open |
| IntersectionObserver not supported | Feature detection; fallback to rendering all entries |
| CSS class names conflict with existing styles | All classes are changelog-specific (`.changelog-*` prefix) |
| Existing E2E snapshots break | All changelog snapshots must be regenerated (modal now shows 10 entries initially) |
| Memory leak from observer | Always disconnect in close handler; use module-level cleanup |
