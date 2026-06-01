# Spec: `relative/path/to/module.js`

## Purpose
One line describing what this module does and why it exists.

## Dependencies

### state
| Property | Access (R/W) | Context |
|-----------|-------------|----------|
| `state.xxx` | read / write | function where used |

### CONFIG
| Constant | Context |
|-----------|----------|
| `CONFIG.XXX` | function where used |

### DOM
| Element | Access type | Context |
|----------|---------------|----------|
| `#element-id` | querySelector / event | function where used |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `./foo.js` | `barFunction` | ... |

## Public API

### `export function functionName(param1: type, param2: type): returnType`

**Description:** What it does.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `param1` | `string` | Description |

**Return:** `{ r: number, g: number, b: number } | null`

**Mutates state:** No / Yes (properties: ...)

**Async:** No / Yes (awaits: ...)

### `export const CONSTANT = value`

**Description:** What it is for.

---

## Behavior

1. **Rule 1:** Description (e.g.: "If input has no #, it is added automatically")
2. **Rule 2:** ...
3. **Rule 3:** ...

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `null` | Returns `null` |
| `''` (empty string) | Returns `null` |
| Value out of range | ... |

## Test Scenarios

1. **Normal case:** Input `X` → output `Y`
2. **Without # prefix:** Input `"ff0000"` → output `{ r: 255, g: 0, b: 0 }`
3. **3-digit shorthand:** Input `"#fff"` → output `{ r: 255, g: 255, b: 255 }`
4. **Invalid input:** Input `"xyz"` → output `null`
5. **Null input:** Input `null` → output `null`
6. **Empty input:** Input `""` → output `null`

## Change History

| Date | Change | Author |
|-------|--------|-------|
| YYYY-MM-DD | Initial spec | SDD |
