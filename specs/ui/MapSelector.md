# Spec: `src/ui/MapSelector.js`

## Purpose
Location selection modal with Leaflet map, geocoding by search, current location and favorites.

## Dependencies

### state
| Property | Access | Context |
|-----------|--------|----------|
| `state.lat` | read | initial map position |
| `state.lon` | read | initial map position |
| `state.locationName` | read | initial name |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../store.js` | `state` | access |
| `../services/GeoService.js` | `geoService` | geocoding |
| `../utils/i18n.js` | `t` | translation |
| *dynamic* | `favoritesService` | favorites (dynamic import) |

### External DOM
| Element | Access type | Context |
|----------|---------------|----------|
| `#leaflet-map` | L.map | Leaflet map |
| `L` (global) | global variable | Leaflet library |

## Public API

### `export function initMapModal(onLocationSelected: Function): void`

**Description:** Initializes map modal.

| Parameter | Type | Description |
|-----------|------|-------------|
| `onLocationSelected` | `Function` | Callback `(lat, lon, name)` when selecting a location |

**Metadata:**
- Mutates state: No
- Async: No

## Behavior

1. Leaflet map with OpenStreetMap tileLayer, zoomControl in bottomleft
2. Click on map → placeMarker + reverseGeocode
3. Search with 500ms debounce, results with flag emoji
4. "My Location" button with geolocation API
5. Favorites: auto-opens favorites modal if any saved when opening map
6. Marker popup with "Go" and "Favorite" buttons

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `#map-location-modal` does not exist | Throws TypeError (code does not null-check critical elements) |
| `L` (Leaflet) not available globally | Leaflet error (no try-catch) |
| `state.lat` / `state.lon` `null` | Map centered on default coordinates (Madrid) with zoom 2 |
| Geolocation denied | Shows alert, does not throw |
| Search without results | `suggestionsBox` hidden, does not throw |
| `onLocationSelected` is not a function | Throws error when clicking "Go" |

## Test Scenarios

1. **Initializes without errors with DOM elements present:** `initMapModal` with DOM elements, does not throw
2. **Does not throw if DOM elements are missing:** Critical elements absent, expected behavior per edge cases
3. **Exports expected functions:** `initMapModal` is a function
4. **Geolocation denied:** Shows alert, does not throw
5. **Search without results:** `suggestionsBox` hidden, does not throw
6. **Null coordinates:** Map centered on Madrid with zoom 2

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
