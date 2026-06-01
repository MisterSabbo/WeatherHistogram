# Spec: `src/services/GeoService.js`

## Purpose
Geocoding and reverse geocoding using Open-Meteo and Nominatim. Includes queue with rate limiting for reverse geocoding.

## Dependencies

No internal dependencies.

## Public API

### `export class GeoService`

### `async searchLocation(query: string, count?: number): Promise<Array>`

**Description:** Searches locations by name using Open-Meteo geocoding API.

### `async reverseGeocode(lat: number, lon: number): Promise<string>`

**Description:** Reverse geocode using Nominatim with queue and rate limiting (2s between calls).

### `export const geoService: GeoService` (singleton)

## Behavior

1. `searchLocation`: fetch from `geocoding-api.open-meteo.com/v1/search`
2. `reverseGeocode`: queue with 2-second rate limiting
3. Only keeps the most recent request in the queue (discards previous with reject)
4. `reverseGeocode` builds name from `data.address` (city/town/village, county, state, country)
5. If no address, returns "Current location"

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| API does not respond | Error propagated |
| Spammed calls to reverseGeocode | Only the last one is processed, previous ones are cancelled |
| address without city/town/village | Uses county as first component |
| Empty address | Returns "Current location" |
| Empty query | API may return error |

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
