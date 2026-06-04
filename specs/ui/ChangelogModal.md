# Spec: `src/ui/ChangelogModal.js`

## Purpose

Paginate changelog rendering in blocks of 10 entries with auto-load on scroll, eliminating the latency of rendering all ~66+ entries at once when the modal opens.

## Dependencies

### state

| Property | Access (R/W) | Context |
|-----------|-------------|----------|
| — | — | This module does not read or write `state` |

### CONFIG

| Constant | Context |
|-----------|----------|
| — | This module does not use `CONFIG` |

### DOM

| Element | Access type | Context |
|----------|---------------|----------|
| `#changelog-modal` | getElementById | main modal container |
| `#changelog-title` | getElementById | modal title text |
| `#changelog-list` | getElementById | list container (ul) — entries appended here |
| `#changelog-items` | getElementById | outer items container — cleared on open |
| `#changelog-close-btn` | getElementById | close button |
| `#changelog-update-container` | getElementById | update button wrapper (version-specific mode) |
| `#changelog-update-btn` | getElementById | update button |
| `#changelog-detail-sheet` | getElementById | detail view bottom sheet |
| `#changelog-detail-backdrop` | getElementById | detail view backdrop |
| `#changelog-detail-scroll-content` | getElementById | detail view scroll container |
| `#changelog-detail-title` | getElementById | detail view title |
| `#changelog-detail-subtitle` | getElementById | detail view subtitle |
| `#changelog-detail-list` | getElementById | detail view changes list |
| `#changelog-scroll-content` | getElementById | main changelog scroll container (for IntersectionObserver root) |

### Internal modules

| Module | Export used | Purpose |
|--------|-------------|----------|
| `../data/changelog.js` | `changelogData` | Array of changelog entries (embedded, not fetched) |
| `../utils/i18n.js` | `t` | Localized string lookup |
| `./BottomSheet.js` | `openBottomSheet` | Opens bottom sheet with swipe-to-dismiss |

## Public API

### `export function showChangelogModal(version?: string, onUpdate?: () => Promise<void>): void`

**Description:** Opens the changelog modal. If `version` is provided, shows only that version's entry (no pagination). If `version` is `null`/`undefined`, shows full paginated changelog.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `version` | `string \| null` | If set, shows single version detail. If null, shows all versions with pagination. |
| `onUpdate` | `() => Promise<void>` | Called when update button is clicked (version-specific mode only). |

**Return:** `void`

**Mutates state:** No

**Async:** No (the `onUpdate` callback is async but called from a click handler)

### `export function initChangelog(onBeforeOpen?: () => void): void`

**Description:** Wires the `#open-changelog-link` click handler. Calls `showChangelogModal()` on click.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `onBeforeOpen` | `() => void` | Optional callback executed before modal renders (e.g., to hide other UI). |

**Return:** `void`

**Mutates state:** No

**Async:** No

---

## Behavior

### Pagination (full changelog mode — no `version` argument)

1. **Initial render:** Render the first 10 entries from `changelogData` into `#changelog-list`.
2. **Auto-load trigger:** A sentinel `<div>` element is appended after the last rendered entry. An `IntersectionObserver` watches it with `rootMargin: '0px 0px 200px 0px'` (triggers 200px before the sentinel enters the viewport).
3. **On intersection:** When the sentinel becomes visible within the threshold:
   - Hide the sentinel (to prevent double-triggering).
   - Append a "Loading…" indicator (`<li>` with class `changelog-loading`).
   - Wait at least 150ms (minimum perceptible delay).
   - Append the next 10 entries (or remaining if <10 left) using a `DocumentFragment`.
   - Remove the loading indicator.
   - If more entries remain, re-show the sentinel after the newly appended entries.
   - If no more entries remain, replace the sentinel with an "All caught up" / "Estás al día" indicator (class `changelog-caught-up`).
4. **Block animation:** Each block of newly loaded entries fades in as a group via a CSS class `changelog-block-enter` (opacity 0 → 1, no per-item stagger).
5. **Entry animation:** Individual entry stagger animation (`fadeInUp`) is removed. Entries appear with the block fade-in only.

### Single version mode (with `version` argument)

1. Renders only the matching entry (no pagination, no sentinel).
2. Behavior is identical to current implementation — single entry, detail view on click.
3. No "Loading…" or "All caught up" indicators shown.

### DOM construction

1. Each entry `<li>` uses CSS classes instead of inline styles. All inline `style.*` assignments in current `renderChangelogData()` are replaced with CSS class toggles:
   - `.changelog-entry` — base entry styles (position, padding, cursor)
   - `.changelog-entry-major` — accent marker for `.0` versions
   - `.changelog-entry-marker` — timeline dot
   - `.changelog-entry-content` — card background/border
   - `.changelog-entry-header` — flex row for tag + title
   - `.changelog-entry-tag` — Major/Patch badge
   - `.changelog-entry-title` — version number
   - `.changelog-entry-desc` — truncated description
2. Each block is built via `DocumentFragment` and appended in a single DOM operation.

### Sentinel and loading indicators

- **Sentinel element:** `<li class="changelog-sentinel" aria-hidden="true"></li>` — invisible, zero-height, used only for IntersectionObserver.
- **Loading indicator:** `<li class="changelog-loading" role="status" aria-live="polite">{t('config.changelogLoading')}</li>` — visible spinner or text.
- **Caught-up indicator:** `<li class="changelog-caught-up">{t('config.changelogCaughtUp')}</li>` — static text, no sentinel after it.

### Error handling

- The `IntersectionObserver` callback wraps all DOM manipulation in `try/catch`.
- On error: remove loading indicator, restore the sentinel, show error message in the loading indicator's position with a "Retry" link (class `changelog-error`).
- Retry re-invokes the load logic for the same block.

### Accessibility

- `aria-live="polite"` on the loading indicator announces new content to screen readers.
- Sentinel has `aria-hidden="true"`.
- No other accessibility changes (out of scope).

### CSS additions (in `src/styles/modals.css`)

New classes:
- `.changelog-block-enter` — opacity transition for block fade-in
- `.changelog-loading` — loading state styling
- `.changelog-caught-up` — end-of-list styling
- `.changelog-sentinel` — zero-height invisible element
- `.changelog-error` — error state with retry link
- `.changelog-entry` — replaces inline styles on `<li>`
- `.changelog-entry-major` — accent marker variant
- `.changelog-entry-marker` — timeline dot
- `.changelog-entry-content` — card wrapper
- `.changelog-entry-header` — flex row
- `.changelog-entry-tag` — badge
- `.changelog-entry-title` — version text
- `.changelog-entry-desc` — description text

### i18n additions

New keys in `src/utils/i18n.js`:

| Key | `es` | `en` |
|-----|------|------|
| `config.changelogLoading` | `Cargando más cambios…` | `Loading more changes…` |
| `config.changelogCaughtUp` | `Estás al día` | `All caught up` |
| `config.changelogLoadError` | `Error al cargar. Reintenta.` | `Load error. Retry.` |
| `config.changelogRetry` | `Reintentar` | `Retry` |

---

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `changelogData` has ≤10 entries | Render all entries, no sentinel, no observer |
| `changelogData` is empty | Render empty state (existing behavior — no entries) |
| `version` is provided (single mode) | Render only that entry, no pagination |
| `version` not found in data | Render empty entry with empty changes array |
| Scroll to bottom with <10 remaining | Render remaining entries, then show "All caught up" |
| Observer fires multiple times before block loads | Guard flag (`isLoading`) prevents concurrent loads |
| Modal closed mid-load | Observer disconnected on close; sentinel state reset on next open |
| `IntersectionObserver` not supported (very old browsers) | Fallback: render all entries immediately (no pagination) |

## Test Scenarios

### Unit tests (Vitest, `src/ui/ChangelogModal.test.js`)

1. **Initial 10 entries rendered:** Mock `changelogData` with 15 entries → open modal → assert `#changelog-list` has 10 `<li>` children (excluding sentinel).
2. **Sentinel present:** After initial render, assert `.changelog-sentinel` exists in the DOM.
3. **Load more on intersection:** Mock `IntersectionObserver` to fire callback → assert 20 entries rendered (or 15 if total is 15).
4. **All caught up:** After all entries loaded, assert `.changelog-caught-up` exists and `.changelog-sentinel` does not.
5. **≤10 entries:** Mock 5 entries → assert 5 rendered, no sentinel, no observer.
6. **Single version mode:** Call `showChangelogModal('1.15.0')` → assert 1 entry rendered, no sentinel.
7. **Error recovery:** Mock observer callback to throw → assert sentinel restored and error message shown.
8. **Loading indicator shown:** During load, assert `.changelog-loading` exists (at least briefly).
9. **CSS classes applied:** Assert entries use `.changelog-entry`, `.changelog-entry-content`, etc. (no inline styles).
10. **Observer disconnected on close:** Open modal, then close → assert observer is disconnected.

### E2E tests (Playwright)

1. **Changelog opens with 10 entries:** Open changelog modal → screenshot shows ~10 entries (not all).
2. **Scroll to load more:** Scroll to bottom of changelog → screenshot shows additional entries loaded.
3. **Single version mode unchanged:** Open changelog with version → screenshot matches existing baseline.
4. **Snapshot regeneration:** All existing changelog E2E snapshots must be regenerated (modal now shows 10 entries initially).

---

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-06-04 | Initial spec — paginated changelog with infinite scroll auto-load | SDD |
