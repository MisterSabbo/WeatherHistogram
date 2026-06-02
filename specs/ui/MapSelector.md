# Spec: `src/ui/MapSelector.js`

## Purpose
Location selection modal with Leaflet map, geocoding search with debounce, current location via geolocation API, marker popup with "Go" and "Favorite" actions, and automatic favorites modal when favorites exist.

## Dependencies

### state
| Property | Access (R/W) | Context |
|-----------|-------------|----------|
| `state.lat` | read | initial map center |
| `state.lon` | read | initial map center |
| `state.locationName` | read | initial marker label |

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `../store.js` | `state` | access |
| `../services/GeoService.js` | `geoService` | reverseGeocode, searchLocation |
| `../utils/i18n.js` | `t` | translation |
| *dynamic* | `favoritesService` | dynamic import on first use |

### External DOM
| Element | Access type | Context |
|----------|---------------|----------|
| `#map-location-modal` | getElementById + style.display | initMapModal |
| `#open-location-modal-btn` | getElementById + click | initMapModal |
| `#close-map-modal-btn` | getElementById + click | initMapModal |
| `#map-current-location-btn` | getElementById + click | initMapModal |
| `#map-toggle-search-btn` | getElementById + click | initMapModal |
| `#map-search-overlay` | getElementById + style.display | search UI |
| `#map-search-input` | getElementById + value | search input |
| `#close-map-search-btn` | getElementById + click | search close |
| `#map-search-suggestions` | getElementById + style.display + innerHTML | search results |
| `#leaflet-map` | `L.map` constructor | Leaflet map container |
| `L` | global variable | Leaflet library |

## Module variables

| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `map` | `L.Map \| null` | `null` | Leaflet map instance |
| `currentMarker` | `L.Marker \| null` | `null` | Current marker on map |
| `searchTimeout` | `number \| null` | `null` | Debounce timeout ID |

## Public API

### `export function initMapModal(onLocationSelected): void`

**Description:** Initializes the map modal with Leaflet map, search, geolocation, and favorites integration.

**Parameters:**
| Name | Type | Description |
|--------|------|-------------|
| `onLocationSelected` | `Function` | Callback `(lat, lon, name)` when user clicks "Go" on marker |

**Return:** `void`

**Mutates state:** Yes (registers event listeners, creates Leaflet map, modifies DOM)

**Async:** No

## Internal functions

### `function placeMarker(lat, lon, nameLabel): void`

**Description:** Places or updates a marker at the given coordinates with a popup containing location name, coordinates, "Go" button, and "Favorite" (bookmark) button. If `nameLabel` is the loading string, buttons are disabled. "Favorite" safely imports `favoritesService` dynamically.

### `async function resolveLocationName(lat, lon): void`

**Description:** Reverse geocodes coordinates via `geoService.reverseGeocode()`. Updates the marker popup name and re-enables buttons. Guards against stale markers by checking coordinates match. On error, sets name to "Ubicación Seleccionada" if error is not "Cancelled".

### `async function fetchMapSuggestions(query): void`

**Description:** Searches locations via `geoService.searchLocation(query, 5)`. Renders results with flag emoji, admin parts, and inline "bookmark" button for quick favorite add. On click of a result, centers map on that location and places a marker. Touch feedback (background highlight) for mobile.

## Behavior

1. **Opening:** Click `#open-location-modal-btn` → shows modal. Auto-opens favorites modal if user has saved favorites (via `#map-favorites-btn` click). Initializes Leaflet map on first open with `setTimeout(100ms)` for DOM visibility.
2. **Map init:** Leaflet without zoom control, adds `zoomControl: { position: 'bottomleft' }`. Tile layer from OpenStreetMap. Centers on `[state.lat, state.lon]` with zoom: 10 if lat exists, 2 otherwise.
3. **Map click:** Places marker and resolves location name via reverse geocode.
4. **Search:** 500ms debounce on input (min 2 chars). Results show name in bold with flag emoji, admin1 and country as secondary text. Each result has an inline bookmark button. On result click → map centers at 10 zoom, places marker, closes search overlay.
5. **Current location:** Uses `navigator.geolocation.getCurrentPosition()` with `{ timeout: 30000, enableHighAccuracy: false, maximumAge: 60000 }`. Shows loader spinner during acquisition.
6. **Marker popup:** Has "Go" button (enables `onLocationSelected`) and bookmark button (dynamically imports `favoritesService.add()`). Both disabled during loading state. Bookmark shows check_circle feedback on success.

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| `state.lat` / `state.lon` `null` | Map centered on Madrid defaults (40.4167, -3.70325) with zoom 2 |
| `L` (Leaflet) not available globally | Leaflet error (no try-catch) |
| Geolocation denied | Shows alert, does not throw |
| Search without results | Suggestions box hidden, no throw |
| Reverse geocode fails | Marker shows "Ubicación Seleccionada" |
| Stale marker after async resolve | Guards against stale marker by checking coordinates |
| Re-opening modal | Map invalidates size and re-centers |

## Test Scenarios

1. **Initializes without errors with DOM elements present:** `initMapModal` with DOM
2. **Does not throw if DOM elements are missing:** Expected behavior per edge cases
3. **Exports expected functions:** `initMapModal` is a function
4. **Geolocation denied:** Shows alert, does not throw
5. **Search without results:** Suggestions hidden
6. **Null coordinates:** Map centered on Madrid with zoom 2
7. **Favorites auto-open:** If favorites exist on modal open, favorites modal opens automatically

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-06-02 | Added search overlay elements, resolveLocationName details, geolocation options, search suggestion favorites, flag emoji, touch feedback, favorites auto-open on modal start | SDD |
| 2026-05-21 | Initial spec | SDD |
