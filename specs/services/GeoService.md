# Spec: `src/services/GeoService.js`

## Purpose
Geocoding (search by name) and reverse geocoding (coordinates to address) using Open-Meteo Geocoding and Nominatim APIs. Includes request queue with rate limiting for reverse geocoding.

## Dependencies

No state, CONFIG, DOM or internal module dependencies.

## Public API

### `export class GeoService`

### `new GeoService(): GeoService`

**Description:** Initializes base URLs, `lastReverseCall` timestamp, `reverseQueue` array, and `isProcessingQueue` flag.

### `async searchLocation(query: string, count?: number): Promise<Array>`

**Description:** Searches locations by name using Open-Meteo geocoding API. Returns `data.results` or empty array.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `query` | `string` | — | Location name |
| `count` | `number` | 1 | Max number of results |

### `async reverseGeocode(lat: number, lon: number): Promise<string>`

**Description:** Reverse geocode using Nominatim with queue and rate limiting (2s between calls). Returns a constructed location name string.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `lat` | `number` | Latitude |
| `lon` | `number` | Longitude |

**Return:** `Promise<string>` — constructed location name

### `export const geoService: GeoService` (singleton)

## Behavior

1. `searchLocation`: Fetch from `geocoding-api.open-meteo.com/v1/search` with `name`, `count`, `language=es`, `format=json` params. Propagates fetch errors.
2. `reverseGeocode` implements a queue (`reverseQueue`):
   - Only the most recent request is kept; previous queued requests are rejected with `"Cancelled"`
   - Enforces 2-second minimum interval between calls
   - Builds name from `data.address`: concatenates `city/town/village`, `county`, `state`, `country`
   - If no address components found, returns `"Ubicación actual"` (Spanish for "Current location")
   - Queue processing is guarded by `isProcessingQueue` flag to prevent concurrent processing
3. `_processQueue` is the internal queue processor that handles the async loop with delay

## Edge Cases

| Input | Expected behavior |
|-------|------------------------|
| API unavailable | Error propagated to caller |
| Spammed calls to reverseGeocode | Only the last one is processed; previous ones rejected with "Cancelled" |
| address without city/town/village | Uses county as first component |
| Empty address result | Returns `"Ubicación actual"` |
| Empty query | API may return empty results |

## Test Scenarios

1. **searchLocation with query:** returns array of results
2. **searchLocation error:** fetch fails → throws error
3. **reverseGeocode:** returns constructed name
4. **Queue rate limiting:** waits 2s between calls
5. **Queue cancellation:** spammed call cancels previous
6. **Singleton:** geoService is a unique instance

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
| 2026-06-02 | Spec update to match code — added _processQueue, isProcessingQueue guard, Spanish default text | SDD |
