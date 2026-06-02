# Spec: `src/ui/ChangelogModal.js`

## Purpose
Changelog modal with visual timeline, expandable detail bottom sheet, and entrance animations.

## Dependencies

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../data/changelog.js` | `changelogData` | version data |
| `../utils/i18n.js` | `t` | translation |
| `./BottomSheet.js` | `openBottomSheet` | modal and detail sheet |

## Public API

### `export function showChangelogModal(version?, onUpdate?): void`

**Description:** Opens the changelog modal as a bottom sheet. Shows a specific version with update button, or all versions.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `version` | `string` | Specific version to highlight (omit to show all) |
| `onUpdate` | `Function` | Async callback triggered on "update" button click |

**Return:** `void`

**Mutates state:** Yes (DOM manipulation: innerHTML, textContent, style changes)

**Async:** No

### `export function initChangelog(onBeforeOpen?): void`

**Description:** Attaches click handler to `#open-changelog-link` with double-click guard (`isChangelogLoading` flag).

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `onBeforeOpen` | `Function` | Optional callback invoked before opening the modal |

**Return:** `void`

**Mutates state:** Yes (registers event listener, manages `isChangelogLoading` flag)

**Async:** No

## Internal functions

### `function openChangelogDetail(item): void`

**Description:** Opens a detail bottom sheet (`#changelog-detail-sheet`) for a specific changelog item, showing full change list or default placeholder text.

### `function renderChangelogData(changelogData, version, listEl, closeBtn, updateBtn, onUpdate): void`

**Description:** Renders the timeline list with staggered fadeInUp animation, circular markers (major=blue, patch=gray), clickable items, and properly wires close/update buttons. Opens the modal bottom sheet.

## Behavior

1. **Timeline rendering:** Each item has a circular marker (major version = `var(--accent-temp)`, patch = `var(--grid-color)`) and a card with type tag (Major/Patch), version title, and first change description preview (2-line clamp).
2. **Staggered animation:** `fadeInUp` CSS animation with `index * 0.1s` delay. After animation ends, inline style is set to `opacity:1; transform:none; animation:none`.
3. **Detail view:** Click on a timeline item → `openChangelogDetail` → bottom sheet with full list. If no changes, shows default "minor fixes" text.
4. **Version-specific mode:** If `version` is provided, shows update button (`onUpdate` callback), marks the version item with a blue unread dot, and sets title from i18n key `config.changelogTitle`.
5. **All versions mode:** If no version, shows all items, hides update container, title from `config.changelogTitleAll`.
6. **initChangelog:** Sets up click on `#open-changelog-link` with guard against rapid double-clicks (`isChangelogLoading` flag).

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `version` is `undefined` | Shows full timeline without highlighted version, hides update button |
| `changelogData` empty | Renders an empty list |
| `#open-changelog-link` does not exist | `initChangelog` returns without registering listener |
| Double-click on link | Guarded by `isChangelogLoading` flag |
| `onBeforeOpen` not a function | Called anyway (no-op if undefined) |
| DOM elements for detail sheet missing | `openChangelogDetail` may fail silently |

## Test Scenarios

1. **Initializes without errors with DOM elements present:** `initChangelog` with link present
2. **Does not throw if DOM elements are missing:** Link absent
3. **Exports expected functions:** `showChangelogModal`, `initChangelog` are functions
4. **Modal with specific version:** `showChangelogModal('1.0.0')` opens with highlighted version and update button
5. **Modal without version:** `showChangelogModal()` shows full timeline, no update button
6. **Double-click guard:** Rapid clicks do not trigger multiple opens

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-06-02 | Added internal functions `openChangelogDetail` and `renderChangelogData`, detail sheet behavior, double-click guard, animation cleanup | SDD |
| 2026-05-21 | Initial spec | SDD |
