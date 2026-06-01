# Spec: `src/utils/time.js`

## Purpose
Time-to-coordinate conversion utilities for the histogram and date formatting.

## Dependencies

No internal dependencies.

## Public API

### `export function dateToX(time: number, startTime: number, pixelsPerHour: number): number`

**Description:** Converts a timestamp ms to X coordinate in pixels.

### `export function getCurrentTimeX(startTime: number, pixelsPerHour: number): number`

**Description:** X coordinate of the current time.

### `export function formatHour(hour: number): string`

**Description:** Formats hour (0-23) to 2-digit string.

### `export function formatDay(date: Date, locale: string): string`

**Description:** Formats date to "MON, 15 JAN" in uppercase.

### `export function getSplitIndex(startTime: number, maxIndex?: number): number`

**Description:** Index of the current hour in the hourly data array.

### `export function formatTooltipTime(date: Date, locale: string, timezone: string): { timeStr: string, dateStr: string, isToday: boolean }`

**Description:** Formats date for tooltip with local time and "today" detection.

## Behavior

1. `dateToX`: `((time - startTime) / 3600000) * pixelsPerHour`
2. `getSplitIndex`: floor of hours from startTime, clamped to `[0, maxIndex]`
3. `formatHour`: padStart(2, '0')
4. `formatDay`: toLocaleString with weekday:'short', day:'numeric', month:'short' => toUpperCase
5. `formatTooltipTime`: `isToday` compares day/month/year; uses `toLocaleTimeString` with timezone

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `startTime = 0` in `getSplitIndex` | Returns 0 |
| `maxIndex = null` | Does not clamp the result |
| `date` out of range | `toLocaleTimeString` may fail; works in modern browsers |
| `hour = 0` | Returns `'00'` |
| `hour = 23` | Returns `'23'` |

## Test Scenarios

1. **dateToX:** 1 hour difference => returns pixelsPerHour
2. **getSplitIndex:** current time within range => correct index
3. **getSplitIndex with startTime=0:** returns 0
4. **formatHour:** 5 => `'05'`, 12 => `'12'`
5. **formatDay:** correct format with locale
6. **formatTooltipTime:** correct return structure

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
