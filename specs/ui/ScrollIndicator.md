# Spec: `src/ui/ScrollIndicator.js`

## Purpose
Manages the horizontal scroll overlay for metrics in the top panel: gradient fade indicators at the edges and dot pagination with chevron icons, plus `touch-action: pan-x` prevention for accidental vertical scroll.

## Dependencies

No external dependencies.

## Public API

### `export function updateMetricsOverlay(metricsContainer: HTMLElement, metricsDots: HTMLElement): void`

**Description:** Updates gradient overlay visibility and pagination dots + chevrons based on scroll position.

| Parameter | Type | Description |
|-----------|------|-------------|
| `metricsContainer` | `HTMLElement` | Container with horizontal scroll (`.top-panel-metrics`) |
| `metricsDots` | `HTMLElement` | Pagination container (`#metrics-dots`) |

**Side effects:**
- Toggles `.gradient-left-visible` / `.gradient-right-visible` classes on `metricsContainer`
- Renders dot spans with `.metric-dot` / `.active` classes inside `metricsDots`
- Renders chevron spans (`.metric-chevron .material-symbols-outlined`) left/right when pages exist on that side
- Renders `.metric-page-counter` (`N/total`) when `totalPages > 1`
- Shows/hides `metricsDots` based on overflow

**Metadata:**
- Mutates state: Yes (modifies DOM classes and innerHTML)
- Async: No

### `export function initScrollIndicator(metricsContainer: HTMLElement, metricsDots: HTMLElement): void`

**Description:** Registers scroll + resize listeners that call `updateMetricsOverlay` on every event.

| Parameter | Type | Description |
|-----------|------|-------------|
| `metricsContainer` | `HTMLElement` | Container with horizontal scroll |
| `metricsDots` | `HTMLElement` | Pagination dots container |

**Side effects:**
- Adds `scroll` event listener (passive) on `metricsContainer`
- Adds `resize` event listener on `window`
- Sets `window.updateScrollIndicator` to the bound handler (for external callers like `TopPanel.js`)
- Runs an initial update after 1000ms

**Metadata:**
- Mutates state: Yes (registers event listeners, sets global reference)
- Async: No

## Behavior

1. If `scrollWidth > clientWidth` (overflow exists):
   - Shows right gradient (`.gradient-right-visible`) when `scrollLeft + clientWidth < scrollWidth - 5` (not at end)
   - Shows left gradient (`.gradient-left-visible`) when `scrollLeft > 5` (not at start)
   - Calculates `totalPages = Math.max(1, Math.ceil(scrollWidth / clientWidth))`
   - Calculates `currentPage = Math.round(scrollLeft / pageWidth)`
   - Renders dots: `<span class="metric-dot">` for each page, `.active` on current
   - Renders `chevron_left` when `currentPage > 0`
   - Renders `chevron_right` when `currentPage < totalPages - 1`
   - Renders page counter `(currentPage+1)/totalPages` when `totalPages > 1`
2. If no overflow: hides `#metrics-dots`, removes gradient visibility classes

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `metricsContainer = null` / `undefined` | Does not throw (parameters optional in practice) |
| Container without overflow (`scrollWidth <= clientWidth`) | Gradients hidden, dots empty |
| Container with `scrollWidth = 0` | No gradients, no dots |
| Single page (`totalPages = 1`) | No chevrons, no counter, only one dot |
| `metricsDots = null` | Gradient classes still toggle, pagination skipped |
| Viewport resize | `initScrollIndicator` recalculates on resize event |

## Test Scenarios

1. **Shows right gradient + chevron when overflow and not at end:** `scrollWidth > clientWidth`, `scrollLeft = 0`, right gradient visible, right chevron visible, left hidden
2. **Hides right gradient + chevron when at end:** `scrollLeft` near end, right gradient hidden, right chevron hidden
3. **Shows left gradient + chevron when not at start:** `scrollLeft > 5`, left gradient visible, left chevron visible
4. **Hides left gradient + chevron when at start:** `scrollLeft = 0`, left hidden
5. **Clears dots when no overflow:** `scrollWidth <= clientWidth`, dots innerHTML empty, display none
6. **Does not crash when metricsDots is null:** gradient classes still toggle
7. **Chevrons rendered correctly at middle page:** `scrollLeft` in middle, both chevrons visible
8. **No chevrons when totalPages <= 1:** no overflow, no chevrons

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
| 2026-06-01 | Refactored: removed arrow indicators and discovery animation, added gradient overlays + chevron pagination + touch-action | Ticket 006 |
