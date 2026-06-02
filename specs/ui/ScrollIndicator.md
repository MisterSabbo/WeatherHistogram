# Spec: `src/ui/ScrollIndicator.js`

## Purpose
Manages the horizontal scroll overlay for metrics in the top panel: gradient fade indicators at the edges, dot pagination with chevron icons, and page counter.

## Dependencies

No external dependencies.

## Public API

### `export function updateMetricsOverlay(metricsContainer, metricsDots): void`

**Description:** Updates gradient overlay visibility and pagination dots + chevrons + page counter based on scroll position.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `metricsContainer` | `HTMLElement` | Container with horizontal scroll (`.top-panel-metrics`) |
| `metricsDots` | `HTMLElement` | Pagination container (`#metrics-dots`) |

**Return:** `boolean` — `true` if container has overflow, `false` otherwise

**Mutates state:** Yes (toggles CSS classes on `#top-panel`, modifies innerHTML)

**Async:** No

### `export function initScrollIndicator(metricsContainer, metricsDots): Function`

**Description:** Registers scroll + resize listeners and sets `window.updateScrollIndicator` to the bound handler.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `metricsContainer` | `HTMLElement` | Container with horizontal scroll |
| `metricsDots` | `HTMLElement` | Pagination dots container |

**Return:** `Function` — the bound handler function

**Mutates state:** Yes (registers event listeners, sets global reference)

**Async:** No

## Behavior

1. **Overflow detection:** If `scrollWidth > clientWidth`, indicators are shown. Otherwise: hides `metricsDots`, removes gradient classes.
2. **Gradient classes:** Toggles `.gradient-right-visible` on `#top-panel` when overflow exists and not at end (`scrollLeft + clientWidth < scrollWidth - 5`). Toggles `.gradient-left-visible` when not at start (`scrollLeft > 5`).
3. **Page calculation:** `totalPages = Math.max(1, Math.ceil(scrollWidth / pageWidth))`. `currentPage` is the page whose start is closest to `scrollLeft`.
4. **Dots:** One `.metric-dot` per page. `.active` class on current page.
5. **Chevrons:** `.metric-chevron-left` shown when `hasOverflow && !isAtStart`. `.metric-chevron-right` shown when `hasOverflow && !isAtEnd`.
6. **Page counter:** `<span class="metric-page-counter">` rendered as `(currentPage+1)/totalPages` when `totalPages > 1`.
7. **initScrollIndicator:** Adds passive scroll listener on container, resize listener on window, sets `window.updateScrollIndicator = fn`, runs initial update after 1000ms.

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `metricsContainer = null` / `undefined` | Throws (no guard) |
| Container without overflow | Gradients hidden, dots empty, display none |
| `scrollWidth = 0` | No gradients, no dots, no throw |
| Single page (`totalPages = 1`) | No chevrons, no counter, only one dot |
| `metricsDots = null` | Gradient classes still toggle, pagination skipped |
| Viewport resize | `initScrollIndicator` recalculates |

## Test Scenarios

1. **Shows right gradient + chevron when not at end:** `scrollLeft = 0`, overflow exists
2. **Hides right gradient + chevron when at end:** `scrollLeft` near end
3. **Shows left gradient + chevron when not at start:** `scrollLeft > 5`
4. **Hides left gradient + chevron at start:** `scrollLeft = 0`
5. **Clears dots when no overflow:** `scrollWidth <= clientWidth`
6. **Does not crash when metricsDots null:** Gradient classes still toggle
7. **Chevrons at middle page:** Both chevrons visible
8. **No chevrons when `totalPages <= 1`:** Single page, no chevrons

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-06-02 | Fixed return type of initScrollIndicator (returns fn not void), added page counter details | SDD |
| 2026-05-21 | Initial spec | SDD |
