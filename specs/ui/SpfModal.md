# Spec: `src/ui/SpfModal.js`

## Purpose
SPF modal showing UV index, risk level, time until burn based on skin type, and sunscreen recommendation.

## Dependencies

### state
| Property | Access (R/W) | Context |
|-----------|-------------|----------|
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

**Parameters:** None

**Return:** `void`

**Mutates state:** Yes (closes bottom sheet)

**Async:** No

### `export function openSpfSheet(): void`

**Description:** Opens modal with current UV data read from `#spf-info-container.dataset.uv`. Populates risk level, burn time, and SPF recommendation.

**Parameters:** None (reads DOM and `state.skinType`)

**Return:** `void`

**Mutates state:** Yes (modifies DOM elements, opens bottom sheet)

**Async:** No

### `export function initSpfModal(): void`

**Description:** Registers close callback via `onSheetClose('spf-modal', closeSpfSheet)`, attaches click handler on `#spf-info-container` to open the SPF sheet, and click handler on `#spf-settings-btn` to close SPF and open the settings/info sheet.

**Parameters:** None

**Return:** `void`

**Mutates state:** Yes (registers event listeners and close callback)

**Async:** No

## Constants

| Constant | Value | Context |
|-----------|-------|----------|
| `SKIN_TYPES` | `['I', 'II', 'III', 'IV', 'V', 'VI']` | skin type labels |
| `SKIN_BASE_MINS` | `[67, 100, 200, 300, 400, 600]` | base minutes to burn per skin type |

## Behavior

1. **UV risk levels:** <3 Low (#22c55e), 3-5 Moderado (#eab308), 6-7 Alto (#f97316), 8-10 Muy Alto (#ef4444), 11+ Extremo (#a855f7).
2. **Burn time:** `SKIN_BASE_MINS[skinType-1] / uv`, rounded. If >120 minutes, displays `> 120`. If uv=0, displays `--`.
3. **SPF recommendation:** UV≥8 → `SPF 50+`, UV≥6 → `SPF 50`, UV≥3 → `SPF 30+`, UV>0 + skinType ≤ 2 → `SPF 15`, otherwise `--`.
4. **openSpfSheet:** Opens bottom sheet `'spf-modal'` with `scrollElementId = 'spf-sheet-scroll-content'`.
5. **initSpfModal:** Registers `onSheetClose` callback, `click` on `#spf-info-container` to open SPF, `click` on `#spf-settings-btn` to close SPF and open info modal (`openBottomSheet('info-modal', 'info-sheet-backdrop', 'info-sheet-content')`).

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `#spf-info-container` without dataset.uv | `parseFloat('0')` → uv=0, all calculations safe |
| `state.skinType` out of range (< 1 or > 6) | `SKIN_BASE_MINS[skinType-1]` is `undefined`, timeToBurn = NaN, does not throw (displays `--`) |
| UV = 0 | Risk "Low", timeToBurn = 0 → displayed as `--`, SPF not recommended (`--`) |
| `#spf-settings-btn` does not exist | `initSpfModal` does not throw, partial event registration |
| DOM elements inside SPF sheet missing | innerText assignment may fail silently |

## Test Scenarios

1. **Initializes without errors with DOM elements present:** `initSpfModal` with DOM
2. **Does not throw if DOM elements are missing:** SPF elements absent
3. **Exports expected functions:** `initSpfModal`, `openSpfSheet`, `closeSpfSheet`
4. **UV = 0:** Risk "Low", burn time `--`, SPF `--`
5. **SkinType out of range:** Does not throw
6. **SPF settings button:** Closes SPF and opens info sheet
7. **onSheetClose registration:** `closeSpfSheet` called when SPF modal closes externally

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-06-02 | Added spf-settings-btn behavior, onSheetClose registration, -- display for 0/NaN burn time | SDD |
| 2026-05-28 | Added scrollElementId to openSpfSheet (spf-sheet-scroll-content) | SDD |
| 2026-05-21 | Initial spec | SDD |
