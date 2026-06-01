# Spec: `src/ui/TooltipManager.js`

## Purpose
Tooltip management for desktop (hover) and bottom sheets for mobile (click) on metrics and location.

## Dependencies

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `./BottomSheet.js` | `openBottomSheet` | metric modals with scrollElementId |

### DOM
| Element | Access type | Context |
|----------|---------------|----------|
| `.info-icon` | querySelectorAll | hover/click |
| `.location-group` | querySelectorAll | hover/click |
| `.data-value` | querySelectorAll | mobile click |
| `.custom-tooltip` | querySelectorAll | show/hide |

## Public API

### `export function showTooltip(el: HTMLElement): void`

**Description:** Shows tooltip, centered on mobile.

| Parameter | Type | Description |
|-----------|------|-------------|
| `el` | `HTMLElement` | Element that triggers the tooltip |

**Metadata:**
- Mutates state: Yes (modifies tooltip display/position)
- Async: No

### `export function hideTooltip(el: HTMLElement): void`

**Description:** Hides tooltip.

| Parameter | Type | Description |
|-----------|------|-------------|
| `el` | `HTMLElement` | Element whose tooltip to hide |

**Metadata:**
- Mutates state: Yes (modifies tooltip display)
- Async: No

### `export function initTooltipManager(): void`

**Description:** Initializes hover (desktop) and click (mobile) events for tooltips.

| Parameter | Type | Description |
|-----------|------|-------------|
| — | — | No parameters |

**Metadata:**
- Mutates state: Yes (registers event listeners)
- Async: No

## Behavior

1. Desktop (>=600px): hover on .info-icon and .location-group
2. Mobile (<600px): click on .data-value → opens modal if it has METRIC_MODALS mapping, with scrollElementId = `_sheetId.replace('-modal', '-sheet') + '-scroll-content'` (e.g., aqi-modal → aqi-sheet-scroll-content)
3. Location group: only shows tooltip if there is overflow (truncated text)
4. Global click on mobile closes all tooltips
5. Tooltip on mobile: position fixed, horizontally centered, below the element

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `el = null` / `undefined` | `showTooltip` / `hideTooltip` do not throw |
| `.info-icon` / `.location-group` do not exist | `initTooltipManager` does not register events for those selectors |
| Element without `.custom-tooltip` associated | `showTooltip` does not find tooltip, does not throw |
| Desktop (>600px) with touch click | Hover behavior, ignores click |
| Location without overflow (non-truncated text) | Does not show tooltip |
| Mobile global click closes non-existent tooltip | Does not throw |

## Test Scenarios

1. **Initializes without errors with DOM elements present:** `initTooltipManager` with DOM elements, does not throw
2. **Does not throw if DOM elements are missing:** Selectors without elements, does not throw
3. **Exports expected functions:** `initTooltipManager`, `showTooltip`, `hideTooltip` are functions
4. **Tooltip with null element:** `showTooltip(null)` does not throw
5. **Desktop hover:** `window.innerWidth >= 600`, hover on info-icon
6. **Mobile click:** `window.innerWidth < 600`, click on data-value

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-28 | Added scrollElementId pattern to openBottomSheet in mobile click (naming: -modal → -sheet) | SDD |
| 2026-05-21 | Initial spec | SDD |
