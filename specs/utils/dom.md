# Spec: `src/utils/dom.js`

## Purpose
DOM utilities. Currently exposes only a `debounce` to limit function execution frequency.

## Dependencies

No internal or state/DOM dependencies.

## Public API

### `export function debounce(fn: Function, delay?: number): Function`

**Description:** Creates a "debounced" version of `fn` that delays its execution until `delay` ms have passed since the last invocation.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `fn` | `Function` | Function to debounce |
| `delay` | `number` | Wait milliseconds (default: 150) |

**Return:** `Function` wrapper function that batches calls

**Mutates state:** No

**Async:** No

## Behavior

1. Each call to the returned function resets the timer
2. The original function executes with the `this` and arguments of the last call
3. If no `delay` is provided, uses 150ms

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| Fast consecutive calls | Only the last one executes after the delay |
| `delay = 0` | Executes on the next tick (setTimeout 0) |
| No extra arguments | The inner function is called without arguments |

## Test Scenarios

1. **Basic debounce:** 3 rapid calls, only executes 1 time after delay
2. **Custom delay:** delay=500, waits 500ms before executing
3. **Context this:** caller `this` is preserved
4. **Arguments:** last call arguments are passed to fn

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
