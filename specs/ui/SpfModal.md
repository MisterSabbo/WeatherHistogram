# Spec: `src/ui/SpfModal.js`

## Purpose
SPF modal showing UV risk, time until burn and sunscreen recommendation according to skin type.

## Dependencies

### state
| Property | Access | Context |
|-----------|--------|----------|
| `state.skinType` | read | burn time calculation |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../store.js` | `state` | access |
| `../utils/i18n.js` | `t` | translation |
| `./BottomSheet.js` | `openBottomSheet`, `closeBottomSheet`, `onSheetClose` | modal |

## Public API

### `export function closeSpfSheet(): void`

**Description:** Closes the SPF modal.

| Parameter | Type | Description |
|-----------|------|-------------|
| — | — | No parameters |

**Metadata:**
- Mutates state: Yes (closes bottom sheet)
- Async: No

### `export function openSpfSheet(): void`

**Description:** Opens modal with current UV data from `#spf-info-container.dataset.uv`.

| Parameter | Type | Description |
|-----------|------|-------------|
| — | — | No parameters (reads DOM and `state.skinType`) |

**Metadata:**
- Mutates state: No
- Async: No

### `export function initSpfModal(): void`

**Description:** Initializes SPF modal events.

| Parameter | Type | Description |
|-----------|------|-------------|
| — | — | No parameters |

**Metadata:**
- Mutates state: Yes (registers event listeners)
- Async: No

## Behavior

1. Reads UV from `#spf-info-container.dataset.uv`
2. Risk: <3 low, 3-5 moderate, 6-7 high, 8-10 very high, 11+ extreme
3. Time until burn: `SKIN_BASE_MINS[skinType-1] / uv`
4. Recommended SPF: UV≥8 → 50+, UV≥6 → 50, UV≥3 → 30+, UV>0 + skin≤2 → 15
5. `openSpfSheet` opens bottom sheet 'spf-modal' with `scrollElementId='spf-sheet-scroll-content'`
6. `initSpfModal`: attaches click to `#spf-info-container` and `#spf-settings-btn`

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `#spf-info-container` without dataset.uv | `openSpfSheet` reads `undefined`, calculations NaN, does not throw |
| `state.skinType` out of range (< 1 or > 6) | `SKIN_BASE_MINS[skinType-1]` is `undefined`, does not throw |
| SPF DOM elements do not exist | `openSpfSheet`/`closeSpfSheet` do not throw |
| UV = 0 | Risk "Low", time until burn = Infinity, SPF not recommended |
| `#spf-settings-btn` does not exist | `initSpfModal` does not throw, partial event registration |

## Test Scenarios

1. **Initializes without errors with DOM elements present:** `initSpfModal` with DOM elements, does not throw
2. **Does not throw if DOM elements are missing:** SPF elements absent, does not throw
3. **Exports expected functions:** `initSpfModal`, `openSpfSheet`, `closeSpfSheet` are functions
4. **UV = 0:** Risk "Low", time until burn Infinity
5. **SkinType out of range:** < 1 or > 6, does not throw
6. **Without dataset.uv:** `#spf-info-container` without uv attribute, NaN-safe calculations

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-28 | Added scrollElementId to openSpfSheet (spf-sheet-scroll-content) for fixed-handle pattern | SDD |
| 2026-05-21 | Initial spec | SDD |
