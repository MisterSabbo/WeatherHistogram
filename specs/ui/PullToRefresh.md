# Spec: `src/ui/PullToRefresh.js`

## Purpose
Touch pull-to-refresh with visual indicator, icon rotation, and overlay detection that prevents PTR when modals/sheets are open.

## Dependencies

### DOM
| Element | Access type | Context |
|----------|---------------|----------|
| `#ptr-icon` | getElementById + dataset + style.transform | rotation, spinning animation |
| `#ptr-indicator` | getElementById + style.transform | visibility/position |
| `#app-wrapper` | getElementById + style.transform | push-down effect |
| Overlay selectors | querySelectorAll | hasOverlayOpen guard |

## Module variables

| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `_ptrStartY` | `number` | `0` | Touch start Y coordinate |
| `_ptrStartX` | `number` | `0` | Touch start X coordinate |
| `_ptrDist` | `number` | `0` | Current pull distance |
| `_isRefreshing` | `boolean` | `false` | Refresh in progress flag |
| `_onRefreshCallback` | `Function \| null` | `null` | Callback to execute on refresh |

## Public API

### `export function initPullToRefresh(options?): { destroy: Function }`

**Description:** Initializes pull-to-refresh with touch event listeners.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `options` | `Object` | (optional) Configuration |
| `options.onRefresh` | `Function` | Async callback, must return Promise |

**Return:** `{ destroy: Function }` — removes all event listeners and resets state

**Mutates state:** Yes (registers document-level touch events, modifies indicator DOM)

**Async:** No

## Internal functions

### `function hasOverlayOpen(): boolean`

Checks if any modal/sheet overlay is open by querying the `OVERLAY_SELECTOR` CSS string. SELECTOR includes: `.yip-sheet-backdrop.open`, `#info-modal[style*="display: flex"]`, `#favorites-modal[style*="display: flex"]`, `#map-location-modal[style*="display: flex"]`, `#prompt-modal[style*="display: flex"]`, `#changelog-modal.open`, `#yip-modal.open`.

### `function resetUI(): void`

Resets PTR indicator to hidden state: clears spinning animation, stops spin interval, transitions indicator to `translateY(-100%)` and app-wrapper to `translateY(0)` with 0.3s ease-out.

## Behavior

1. **Touch start (`touchstart`):** Only activates with exactly 1 finger and no open overlays. Ignores touches inside `#search-results`. Records start X and Y.
2. **Touch move (`touchmove`):** Compares X and Y delta — if horizontal movement exceeds vertical, cancels PTR. If pulling down (`currentY > startY`), prevents default scroll and translates the indicator and app-wrapper. Visual distance: `Math.min(75, dist / 2.5)`. Icon rotates proportionally up to 360° at 75px with opacity fade-in.
3. **Touch end (`touchend`):** If `_ptrDist > 60` and `_onRefreshCallback` exists and not already refreshing: shows spinning animation (360° every 500ms via `setInterval`), pushes app-wrapper down 75px, sets `_isRefreshing = true`, calls `_onRefreshCallback().finally(resetUI)`. Otherwise simply resets UI.
4. **Horizontal scroll detection:** If `|currentX - startX| > |currentY - startY|`, the pull is cancelled — resets all positions and returns.
5. **Refresh callback** must return a Promise. On resolve/reject, UI resets via `resetUI()`.

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `options = null` / `undefined` | Initializes without callback, returns `{ destroy }` |
| `onRefresh` not a function | Initializes, on pull does nothing |
| DOM elements missing | No-op (reads element, guards with if checks), does not throw |
| Touch inside `#search-results` | Ignores, does not start PTR |
| 2+ fingers | Ignores |
| Horizontal scroll | Cancels PTR, resets position |
| Overlay open (modal/sheet) | Ignores PTR |
| `destroy()` called twice | Second call is no-op (removeEventListener on non-existent is safe) |
| Spinning during refresh | Interval cleared on `resetUI()`, guard checks `dataset.spinning !== 'true'` |

## Test Scenarios

1. **Initializes without errors with options:** `initPullToRefresh({ onRefresh })`
2. **Does not throw if DOM elements are missing:** Elements absent
3. **Exports expected functions:** `initPullToRefresh` exported and returns `{ destroy }`
4. **Without options:** `initPullToRefresh()` without parameters
5. **Touch with 2+ fingers:** Ignores
6. **Destroy called twice:** Second call is no-op
7. **Horizontal drag cancels PTR:** X diff > Y diff resets
8. **Overlay open prevents PTR:** hasOverlayOpen returns true

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-06-02 | Added OVERLAY_SELECTOR, resetUI internal function, horizontal scroll detection, search-results exclusion, spinning animation via setInterval | SDD |
| 2026-05-21 | Initial spec | SDD |
