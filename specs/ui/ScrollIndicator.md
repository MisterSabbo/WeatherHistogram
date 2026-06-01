# Spec: `src/ui/ScrollIndicator.js`

## Purpose
Horizontal scroll indicators (left/right arrows) with dot pagination and discovery animation.

## Dependencies

No external dependencies.

## Public API

### `export function updateScrollIndicator(metricsContainer: HTMLElement, scrollIndLeft: HTMLElement, scrollIndRight: HTMLElement, metricsDots: HTMLElement): void`

**Description:** Updates arrow and dot visibility based on scroll position.

| Parameter | Type | Description |
|-----------|------|-------------|
| `metricsContainer` | `HTMLElement` | Container with horizontal scroll |
| `scrollIndLeft` | `HTMLElement` | Left arrow |
| `scrollIndRight` | `HTMLElement` | Right arrow |
| `metricsDots` | `HTMLElement` | Pagination dots container |

**Metadata:**
- Mutates state: Yes (modifies display of DOM elements)
- Async: No

### `export function initScrollIndicator(metricsContainer: HTMLElement, scrollIndLeft: HTMLElement, scrollIndRight: HTMLElement, metricsDots: HTMLElement): void`

**Description:** Initializes indicators with auto-discovery animation.

| Parameter | Type | Description |
|-----------|------|-------------|
| `metricsContainer` | `HTMLElement` | Container with horizontal scroll |
| `scrollIndLeft` | `HTMLElement` | Left arrow |
| `scrollIndRight` | `HTMLElement` | Right arrow |
| `metricsDots` | `HTMLElement` | Dots container |

**Metadata:**
- Mutates state: Yes (registers scroll + resize event listeners)
- Async: No

## Behavior

1. Shows right arrow if there is overflow and not at the end
2. Shows left arrow if there is overflow and not at the start
3. Dots: `totalPages = ceil(scrollWidth / clientWidth)`, `currentPage = round(scrollLeft / pageWidth)`
4. If totalPages > 1, adds "N/total" counter
5. Discovery animation: first overflow → 3 bounces of the right arrow

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `metricsContainer = null` / `undefined` | Does not throw (parameters optional in practice) |
| Container without overflow (`scrollWidth <= clientWidth`) | Arrows hidden, dots empty |
| Container with `scrollWidth = 0` | Does not show arrows or dots |
| `totalPages = 0` | Does not add "N/total" counter |
| Discovery animation already played | Does not replay animation |
| Viewport resize | `initScrollIndicator` recalculates visibility |

## Test Scenarios

1. **Initializes without errors with DOM elements present:** `initScrollIndicator` with valid elements, does not throw
2. **Does not throw if DOM elements are missing:** Null/undefined parameters, does not throw
3. **Exports expected functions:** `initScrollIndicator`, `updateScrollIndicator` are functions
4. **Without overflow:** `scrollWidth <= clientWidth`, arrows hidden
5. **With overflow:** Arrows visible according to scroll position
6. **Discovery animation:** First overflow plays 3 bounces

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
