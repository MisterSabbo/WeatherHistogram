# Spec: `src/ui/TooltipManager.js`

## Purpose
Tooltip management for desktop (hover on >=600px) and bottom sheets for mobile (click on <600px) for metrics and location elements.

## Dependencies

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `./BottomSheet.js` | `openBottomSheet` | metric modals on mobile |

### DOM
| Element | Access type | Context |
|----------|---------------|----------|
| `.info-icon` | querySelectorAll | hover (desktop) |
| `.location-group` | querySelectorAll | hover/click |
| `.data-value` | querySelectorAll | mobile click |
| `.custom-tooltip` | querySelector (inside container) | show/hide |
| `#location-name` | getElementById | isLocationTruncated check |
| `#weather-summary` | getElementById | isLocationTruncated check |

## Module constants

| Constant | Value | Context |
|----------|-------|---------|
| `METRIC_MODALS` | `{ 'val-aqi': 'aqi-modal', 'aqi-tooltip': 'aqi-modal', 'val-pollen': 'pollen-modal', 'pollen-tooltip': 'pollen-modal' }` | maps metric container IDs to sheet IDs for mobile modal opens |

## Internal functions

### `function getTooltipContainer(el): HTMLElement | null`

If `el` has class `info-icon`, returns the closest `.data-value` ancestor. Otherwise returns `el` as-is.

### `function getTooltip(el): HTMLElement | null`

Gets the tooltip container, then finds `.custom-tooltip` child.

### `function isLocationTruncated(): boolean`

Checks if `#location-name` or `#weather-summary` have `scrollWidth > clientWidth`.

### `function closeAllTooltips(): void`

Resets all `.custom-tooltip` elements: clears `display`, `position`, `top`, `left`, `transform`, `zIndex` inline styles.

## Public API

### `export function showTooltip(el): void`

**Description:** Shows the tooltip for the given element. For location-group, only shows if text is truncated.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `el` | `HTMLElement` | Element whose tooltip to show |

**Return:** `void`

**Mutates state:** Yes (modifies tooltip display/position)

**Async:** No

### `export function hideTooltip(el): void`

**Description:** Hides the tooltip for the given element.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `el` | `HTMLElement` | Element whose tooltip to hide |

**Return:** `void`

**Mutates state:** Yes (modifies tooltip display)

**Async:** No

### `export function initTooltipManager(): void`

**Description:** Registers hover events (desktop, >=600px) on `.info-icon` and `.location-group`. Registers click events (mobile, <600px) on `.data-value` and `.location-group`. Adds global click listener on mobile to close all tooltips.

**Parameters:** None

**Return:** `void`

**Mutates state:** Yes (registers event listeners, sets `_initialized` flag)

**Async:** No

## Behavior

1. **Desktop hover (>=600px):** `mouseenter`/`mouseleave` on `.info-icon` and `.location-group` toggle tooltip visibility.
2. **Mobile click (<600px):** Click on `.data-value` with an `id` in `METRIC_MODALS` → closes all tooltips, opens the mapped bottom sheet with `scrollElementId` pattern: `sheetId.replace('-modal', '-sheet') + '-scroll-content'`. Click on other `.data-value` or `.location-group` → toggles tooltip.
3. **Location tooltip:** Only shown if text is truncated (overflow detected via `scrollWidth > clientWidth`).
4. **Mobile tooltip positioning:** Fixed position, `top: rect.bottom + 10px`, centered horizontally (`left: 50%; transform: translateX(-50%)`), `z-index: 9999`.
5. **Global click (mobile):** Click anywhere on document closes all tooltips.
6. **Guarded by `_initialized`:** `initTooltipManager` runs only once.

## Edge Cases

| Input | Expected behavior |
|--------|------------------------|
| `el = null` / `undefined` | `showTooltip` / `hideTooltip` do not throw (getTooltip returns null, early return) |
| Selector matches no elements | `initTooltipManager` does not register events for empty node list |
| Element without `.custom-tooltip` child | `showTooltip` returns without changes |
| Desktop (>600px) click | Only hover behavior; click handler returns early |
| Location without overflow | Does not show tooltip |
| Mobile global click with non-existent tooltip | `closeAllTooltips` iterates empty list, does nothing |
| Metric container without METRIC_MODALS mapping | Falls through to tooltip toggle behavior |

## Test Scenarios

1. **Initializes without errors with DOM elements present:** `initTooltipManager` with DOM
2. **Does not throw if DOM elements are missing:** Selectors without elements
3. **Exports expected functions:** `initTooltipManager`, `showTooltip`, `hideTooltip`
4. **Tooltip with null element:** `showTooltip(null)` does not throw
5. **Desktop hover:** `window.innerWidth >= 600`, hover on info-icon
6. **Mobile click opens modal:** Click on metric with METRIC_MODALS mapping opens bottom sheet

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-06-02 | Added METRIC_MODALS mapping, internal functions (getTooltipContainer, getTooltip, isLocationTruncated, closeAllTooltips), _initialized guard, scrollElementId pattern for mobile modals | SDD |
| 2026-05-28 | Added scrollElementId pattern to openBottomSheet in mobile click | SDD |
| 2026-05-21 | Initial spec | SDD |
