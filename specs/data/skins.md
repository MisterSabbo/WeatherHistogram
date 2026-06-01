# Spec: `src/data/skins.js`

## Purpose
Fitzpatrick skin phototype data and function to determine if sun protection is needed.

## Dependencies

No internal dependencies.

## Public API

### `export const SKIN_TYPES: Array<{ id: number, labelKey: string, uvThreshold: number }>`

**Description:** The 6 Fitzpatrick phototypes with their UV threshold from which they need protection.

### `export const DEFAULT_SKIN_TYPE: number` (= 2)

### `export function getSkinType(id: number): { id: number, labelKey: string, uvThreshold: number }`

**Description:** Looks up a phototype by ID. Returns type II (index 1) as fallback.

### `export function needsSunProtection(skinType: number, uvIndex: number): boolean`

**Description:** Determines if a phototype needs sun protection given the UV index.

## Behavior

1. `SKIN_TYPES`: I=threshold 1, II=2, III=3, IV=4, V=5, VI=6
2. `getSkinType`: if not found, returns `SKIN_TYPES[1]` (type II)
3. `needsSunProtection`: `uvIndex > 0 && skin.uvThreshold <= uvIndex`

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `getSkinType(0)` (does not exist) | Returns type II |
| `getSkinType(7)` (out of range) | Returns type II |
| `needsSunProtection(2, 0)` | false (UV=0) |
| `needsSunProtection(1, 1)` | true (I needs with UV≥1) |

## Test Scenarios

1. **Existing getSkinType:** ID 1 returns type I with threshold 1
2. **Non-existent getSkinType:** ID 0 returns type II
3. **Protection needed:** Skin II with UV 3 → true
4. **Protection not needed:** Skin II with UV 1 → false
5. **UV zero:** Always false
6. **Default:** DEFAULT_SKIN_TYPE = 2

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
