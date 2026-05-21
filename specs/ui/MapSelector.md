# Spec: `src/ui/MapSelector.js`

## Propósito
Modal de selección de ubicación con mapa Leaflet, geocoding por búsqueda, localización actual y favoritos.

## Dependencias

### state
| Propiedad | Acceso | Contexto |
|-----------|--------|----------|
| `state.lat` | read | posición inicial mapa |
| `state.lon` | read | posición inicial mapa |
| `state.locationName` | read | nombre inicial |

### Módulos internos
| Módulo | Export usado | Para qué |
|--------|-------------|----------|
| `../store.js` | `state` | acceso |
| `../services/GeoService.js` | `geoService` | geocoding |
| `../utils/i18n.js` | `t` | traducción |
| *dynamic* | `favoritesService` | favoritos (dynamic import) |

### DOM externos
| Elemento | Tipo de acceso | Contexto |
|----------|---------------|----------|
| `#leaflet-map` | L.map | mapa Leaflet |
| `L` (global) | variable global | Leaflet library |

## API Pública

### `export function initMapModal(onLocationSelected: Function): void`

**Descripción:** Inicializa modal de mapa.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `onLocationSelected` | `Function` | Callback `(lat, lon, name)` al seleccionar ubicación |

**Metadatos:**
- Mutates state: No
- Async: No

## Comportamiento

1. Mapa Leaflet con tileLayer OpenStreetMap, zoomControl en bottomleft
2. Click en mapa → placeMarker + reverseGeocode
3. Búsqueda con debounce 500ms, resultados con flag emoji
4. Botón "Mi Ubicación" con geolocation API
5. Favorites: auto-abre modal de favoritos si hay guardados al abrir mapa
6. Marker popup con botones "Ir" y "Favorito"

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `#map-location-modal` no existe | Lanza TypeError (código no hace null-check en elementos críticos) |
| `L` (Leaflet) no disponible globalmente | Lanza error de Leaflet (no hay try-catch) |
| `state.lat` / `state.lon` `null` | Mapa centrado en coordenadas por defecto (Madrid) con zoom 2 |
| Geolocation denegada | Muestra alerta, no lanza error |
| Búsqueda sin resultados | `suggestionsBox` oculto, no lanza error |
| `onLocationSelected` no es función | Lanza error al hacer clic en "Ir" |

## Escenarios de test

1. **Se inicializa sin errores con elementos DOM presentes:** `initMapModal` con elementos DOM, no lanza error
2. **No lanza si faltan elementos DOM en el documento:** Elementos críticos ausentes, comportamiento esperado según casos borde
3. **Exporta las funciones esperadas:** `initMapModal` es función
4. **Geolocation denegada:** Muestra alerta, no lanza error
5. **Búsqueda sin resultados:** `suggestionsBox` oculto, no lanza error
6. **Coordenadas null:** Mapa centrado en Madrid con zoom 2

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
