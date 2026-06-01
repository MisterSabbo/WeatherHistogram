# Spec: `src/utils/color.js`

## Purpose
Converts color strings (hex, rgb, rgba) to `{ r, g, b }` objects with decimal values.

## Dependencies

### state
None.

### CONFIG
None.

### DOM
None.

### Internal modules
None.

## Public API

### `export function hexToRgb(hex: string): { r: number, g: number, b: number }`

**Description:** Converts a color string (hex with/without #, 3-digit shorthand, rgb/rgba) to an object with red, green and blue components in decimal (0-255). For invalid inputs returns `{ r: 0, g: 0, b: 0 }`.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `hex` | `string` | Color string in hex format (`#ff0000`, `ff0000`, `#f00`), rgb(`255,0,0`) or rgba(`255,0,0,0.5`) |

**Return:** `{ r: number, g: number, b: number }` — integer values between 0-255.

**Mutates state:** No

**Async:** No

---

### `export function getTextColorForBg(bgColor: string): string`

**Description:** Given a background color (hex, rgb, rgba), calculates the relative luminance using the weighted formula `0.299*R + 0.587*G + 0.114*B` and returns the text color with best contrast: `#1a1a1a` (dark) for light backgrounds (luminance > 0.5) or `#ffffff` (white) for dark backgrounds (luminance ≤ 0.5). Useful for adaptive text color in Year in Pixels grids.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `bgColor` | `string` | Background color in hex (`#ffffff`, `fff`), rgb or rgba |

**Return:** `string` — `'#1a1a1a'` or `'#ffffff'` based on background luminance.

**Mutates state:** No

**Async:** No

---

## Behavior

1. **Non-string input:** If `hex` is not a string, returns `{ r: 0, g: 0, b: 0 }`.
2. **rgba/rgb format:** If the string starts with `rgba` or `rgb`, extracts the first 3 numbers via regex and assigns to r, g, b.
3. **Hex format with #:** Removes the `#` and parses hex pairs.
4. **Hex format without #:** Parses hex pairs directly.
5. **3-digit shorthand:** Detects 1-digit per component pattern and expands each digit (e.g. `#f00` → `r = 0xff` = 255).
6. **6-digit format:** Parses 2-digit hex pairs normally.
7. **Invalid input:** If no format matches, returns `{ r: 0, g: 0, b: 0 }`.

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `null` | Returns `{ r: 0, g: 0, b: 0 }` |
| `123` (number) | Returns `{ r: 0, g: 0, b: 0 }` |
| `''` (empty string) | Returns `{ r: 0, g: 0, b: 0 }` |
| `'xyz'` (invalid) | Returns `{ r: 0, g: 0, b: 0 }` |
| `'#f00'` (shorthand) | Returns `{ r: 255, g: 0, b: 0 }` |
| `'ff0000'` (without #) | Returns `{ r: 255, g: 0, b: 0 }` |
| `'rgba(100, 150, 200, 0.5)'` | Returns `{ r: 100, g: 150, b: 200 }` |
| `'rgb(100, 150, 200)'` | Returns `{ r: 100, g: 150, b: 200 }` |

## Test Scenarios

1. **Full hex with #:** Input `'#ff0000'` → output `{ r: 255, g: 0, b: 0 }`
2. **3-digit shorthand:** Input `'#f00'` → output `{ r: 255, g: 0, b: 0 }`
3. **Without # prefix:** Input `'ff0000'` → output `{ r: 255, g: 0, b: 0 }`
4. **Green color:** Input `'#00ff00'` → output `{ r: 0, g: 255, b: 0 }`
5. **Blue color:** Input `'#0000ff'` → output `{ r: 0, g: 0, b: 255 }`
6. **rgba string:** Input `'rgba(100, 150, 200, 0.5)'` → output `{ r: 100, g: 150, b: 200 }`
7. **rgb string:** Input `'rgb(100, 150, 200)'` → output `{ r: 100, g: 150, b: 200 }`
8. **Invalid input:** Input `'not-a-color'` → output `{ r: 0, g: 0, b: 0 }`
9. **Non-string input:** Input `123` (number) → output `{ r: 0, g: 0, b: 0 }`
10. **Null input:** Input `null` → output `{ r: 0, g: 0, b: 0 }`
11. **Empty string:** Input `''` → output `{ r: 0, g: 0, b: 0 }`
12. **getTextColorForBg white background:** Input `'#ffffff'` → output `'#1a1a1a'`
13. **getTextColorForBg black background:** Input `'#000000'` → output `'#ffffff'`
14. **getTextColorForBg with rgb:** Input `'rgb(255, 255, 255)'` → output `'#1a1a1a'`

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec (retro) | SDD |
| 2026-05-21 | Fix: `startsWith('rgba')` → `startsWith('rgb')` to support `rgb(...)` format without alpha | SDD |
| 2026-05-28 | Ticket 001: Added `getTextColorForBg` for adaptive text color in YIP | SDD |
