# Spec: `src/ui/PullToRefresh.js`

## Purpose
Implements touch pull-to-refresh with visual indicator, icon rotation and detection of open overlays.

## Dependencies

### DOM
| Element | Access type | Context |
|----------|---------------|----------|
| `#ptr-icon` | getElementById | rotation |
| `#ptr-indicator` | getElementById | animation |
| `#app-wrapper` | getElementById | transform |
| Overlay selectors | querySelectorAll | hasOverlayOpen |

## Public API

### `export function initPullToRefresh(options?: { onRefresh?: Function }): { destroy: Function }`

**Description:** Initializes pull-to-refresh with callbacks.

| Parameter | Type | Description |
|-----------|------|-------------|
| `options?` | `Object` | Configuration options |
| `options.onRefresh?` | `Function` | Async callback executed on pull. Must return Promise. |

**Return:** `{ destroy: Function }` — object with `destroy()` method to clean up listeners.

**Metadata:**
- Mutates state: Yes (configures event listeners, manipulates indicator DOM)
- Async: No

## Behavior

1. Only on touchstart with 1 finger, without open overlays
2. Ignores if touch starts inside `#search-results`
3. Distinguishes horizontal vs vertical scroll (ignores if X diff > Y diff)
4. Visual distance: `min(75, dist/2.5)`, activation threshold: 60px
5. Icon rotates proportionally up to 360° at 75px
6. On release: if dist > 60px, spinning animation + calls `onRefresh`
7. `onRefresh` must return Promise; on completion, resets UI

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `options = null` / `undefined` | Initializes without callback, returns `{ destroy }` |
| `onRefresh` is not a function | Initializes without callback, does not throw |
| DOM elements (`#ptr-icon`, `#ptr-indicator`) do not exist | Does not throw, PTR non-functional |
| Touch inside `#search-results` | Ignores, does not start PTR |
| Touch with 2+ fingers | Ignores, only 1 finger |
| `destroy()` called twice | Does not throw, second call is no-op |

## Test Scenarios

1. **Initializes without errors with options:** `initPullToRefresh({ onRefresh })`, does not throw
2. **Does not throw if DOM elements are missing:** Elements `#ptr-icon`, `#ptr-indicator` absent, does not throw
3. **Exports expected functions:** `initPullToRefresh` exported and returns `{ destroy }`
4. **Without options:** `initPullToRefresh()` without parameters, returns `{ destroy }`
5. **Touch with 2+ fingers:** Ignores, does not start PTR
6. **Destroy called twice:** Second call is no-op

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
