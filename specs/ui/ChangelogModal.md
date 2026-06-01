# Spec: `src/ui/ChangelogModal.js`

## Purpose
Changelog modal with visual timeline, expandable detail, and entrance animations.

## Dependencies

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../data/changelog.js` | `changelogData` | data |
| `../utils/i18n.js` | `t` | translation |
| `./BottomSheet.js` | `openBottomSheet` | modal |

## Public API

### `export function showChangelogModal(version?: string, onUpdate?: Function): void`

**Description:** Opens changelog with or without specific version.

| Parameter | Type | Description |
|-----------|------|-------------|
| `version?` | `string` | Specific version to show (if omitted, shows all) |
| `onUpdate?` | `Function` | Callback on "update" click |

**Metadata:**
- Mutates state: No
- Async: No

### `export function initChangelog(onBeforeOpen?: Function): void`

**Description:** Initializes changelog open link.

| Parameter | Type | Description |
|-----------|------|-------------|
| `onBeforeOpen?` | `Function` | Callback before opening the modal |

**Metadata:**
- Mutates state: Yes (registers event listener)
- Async: No

## Behavior

1. Vertical timeline with circular markers (major = blue, patch = gray)
2. Staggered fadeInUp animation by index
3. Click on item → `openChangelogDetail` → bottom sheet with full change list
4. If specific version is present, shows update button
5. `initChangelog` attaches click to `#open-changelog-link` with guard against double click

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `version` empty / `undefined` | Shows full timeline without highlighted version |
| `onBeforeOpen` is not a function | Does not throw, ignores callback |
| Element `#open-changelog-link` does not exist | `initChangelog` does not throw, does not register listener |
| `changelogData` empty | Shows timeline without items |
| Double click on link | Guard against double event registration |

## Test Scenarios

1. **Initializes without errors with DOM elements present:** `initChangelog` with link present, does not throw
2. **Does not throw if DOM elements are missing:** Link `#open-changelog-link` absent, does not throw
3. **Exports expected functions:** `showChangelogModal`, `initChangelog` are functions
4. **Modal with specific version:** `showChangelogModal('1.0.0')` opens with highlighted version
5. **Modal without version:** `showChangelogModal()` shows full timeline
6. **Double click on link:** Guard against double event registration

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
