# Spec: `src/data/changelog.js`

## Purpose
Embedded changelog data for the application, with all versions and their changes.

## Dependencies

No internal dependencies.

## Public API

### `export const changelogData: Array<{ version: string, changes: Array<string> }>`

**Description:** Array of versions ordered newest to oldest. Each entry contains `version` (semver with possible letter suffix) and `changes` (list of change descriptions).

## Behavior

1. Static, non-mutable data
2. Version format: `X.Y.Z` or `X.Y.Z` + letter (a-g)
3. No business logic

## Edge Cases

| Condition | Expected Behavior |
|-----------|-------------------|
| Empty array | No changes recorded |
| Version with 0 changes | `changes: []` |

## Test Scenarios

1. **Structure:** each entry has `version` (string) and `changes` (array)
2. **Order:** newest first
3. **Non-empty:** at least one entry
4. **Changes are strings:** each change is a non-empty string

## Change History

| Date | Change | Author |
|------|--------|--------|
| 2026-05-21 | Initial spec | SDD |
