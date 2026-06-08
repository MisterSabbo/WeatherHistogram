---
description: Sync project memory graph
agent: build
---

Escanea TODO el código fuente del proyecto WeatherHistogram (directorio `src/`) y actualiza el grafo de memoria del proyecto para que cualquier contribuyente pueda reconstruir el contexto arquitectónico.

## Pasos obligatorios

### 1. Descubrir archivos
Lista todos los archivos JS del proyecto.

### 2. Leer cada archivo
Lee el contenido de cada archivo encontrado para extraer la información necesaria.

### 3. Extraer entidades por archivo
Para cada archivo, identifica:
- **Imports**: cada `import ... from '...'` — el módulo origen y los símbolos importados
- **Exports nombrados**: `export class X`, `export function X`, `export const X`
- **Default export**: `export default X`
- **Clases locales**: declaraciones `class Nombre` (incluso si no se exportan)
- **Singletons**: patrones `const X = new Clase()`
- **Constantes clave**: `const NOMBRE = valor` (valores literales significativos)

### 4. Leer el grafo existente
Antes de crear nada, lee el grafo de memoria actual con `memory_read_graph` para obtener las entidades y relaciones ya existentes.

### 5. Limpiar el grafo anterior
Si ya existen entidades del grafo previo, elimínalas con `memory_delete_entities` y todas las relaciones con `memory_delete_relations`. Esto garantiza idempotencia: ejecutar el comando varias veces produce el mismo resultado sin duplicados.

### 6. Crear entidades
Usa `memory_create_entities` para crear las siguientes entidades. Cada entidad debe tener:
- `name`: nombre de módulo o entidad (usa notación punto para anidamiento, ej: `services.WeatherService`)
- `entityType`: "module", "class", "singleton" o "documentation"
- `observations`: array de strings con información relevante extraída del código fuente

#### Entidades a crear para cada módulo:
Una entidad por archivo `.js` con path relativo, rol, exports, dependencies y constantes clave.

#### Entidades de arquitectura (tipo "documentation"):
Además de los módulos, crea estas entidades especiales:

**`architecture.data-flow`** — Describe el flujo completo de datos:
- El usuario abre la app → `app.init()` → `storageService.init()` → carga preferencias de IndexedDB
- `init()` usa `geoService` para obtener coordenadas (geolocalización o búsqueda)
- `weatherService.getWeatherData(lat, lon, pastDays, forecastDays)` llama a Open-Meteo (forecast + AQI) con `fetch`
- La respuesta cruda se pasa a `processData(forecastData, aqiData)` que transforma en `state.hourlyData` y `state.dailyData`
- `processData` genera daily cards y guarda historial pasado en `storageService.setHistory()`
- El renderizado se activa por evento `scroll` → `render()` → itera tiles → `drawTile()` por cada tile no dibujado
- El scroll también actualiza `updateTopPanel()`, `drawFixedOverlay()`, y `updateMinimapViewport()`

**`architecture.canvas-layers`** — Las 3 capas de canvas:
1. `main-canvas` — tile canvases (fondo, cuadrícula, fenómenos meteorológicos, métricas)
2. `fixed-overlay-canvas` — etiquetas del scrubber, indicador NOW, stickman (se redibuja cada frame)
3. `stickman-canvas` — figura animada del stickman

**`architecture.tiling`** — Sistema de teselas:
- `TILE_WIDTH = 1440px` (hardcodeado)
- `PIXELS_PER_HOUR = 60` (desktop) o `50` (mobile < 600px)
- Se calcula `numTiles = ceil(totalWidth / TILE_WIDTH)`, y solo se dibujan los tiles visibles en el viewport

**`architecture.minimap`** — El minimap:
- Tiene su propio canvas y `minimapCacheCanvas`
- Auto-switch entre modo `past` y `future` según la posición del scroll respecto al índice de tiempo actual
- Se puede arrastrar para navegar

**`architecture.key-constants`** — Constantes importantes del proyecto (extraer los valores literales del código).

**`architecture.ui-components`** — Componentes UI en `src/ui/`:
- `DailyCards.js` — Vista de tarjetas diarias
- `AqiRadar.js` — Radar de calidad del aire
- `PollenRadar.js` — Radar de polen
- `MapSelector.js` — Modal con mapa Leaflet para búsqueda de ubicación
- `FavoritesModal.js` — Modal para gestionar favoritos
- `YearInPixels.js` — Widget de resumen anual

**`architecture.services`** — Servicios en `src/services/`:
- `api.js` — Clase WeatherAPI que envuelve endpoints de Open-Meteo (forecast, AQI, geocoding). Tiene caché interna por coordenadas
- `WeatherService.js` — Combina forecast + AQI, devuelve datos crudos
- `DataProcessor.js` — Transforma datos crudos, genera daily cards, guarda historial
- `StorageService.js` — Abstracción IndexedDB + localStorage fallback (stores: userPreferences, historyData)
- `GeoService.js` — Geocoding y reverse geocoding con cola de peticiones
- `FavoritesService.js` — CRUD de favoritos persistidos
- `AqiManager.js` — Clasificación AQI y polen en texto legible
- `MockData.js` — Datos simulados como fallback

### 7. Crear relaciones
Usa `memory_create_relations` para crear relaciones entre entidades. El tipo de relación debe ser `imports` para cada dependencia detectada en los statements `import`.

Relaciones de importación típicas (verificar con el código fuente real):
- `app` → `store`, `StorageService`, `theme`, `i18n`, `WeatherService`, `GeoService`, `DataProcessor`, `MockData`, `AqiManager`, `DailyCards`, `FavoritesService`, `MapSelector`, `FavoritesModal`, `YearInPixels`, `MetricsRenderer`, `AtmosphereRenderer`, `GridRenderer`, `BackgroundRenderer`, `StickmanRenderer`
- `DataProcessor` → `store`, `StorageService`, `DailyCards`, `i18n`
- `WeatherService` → `WeatherAPI` (api.js)
- `FavoritesService` → `StorageService`
- `AqiManager` → `i18n`
- `MapSelector` → `GeoService`, `FavoritesService`
- `YearInPixels` → `StorageService`, `theme`, `i18n`
- `app` → cada UI component que inicializa

### 8. Verificar
Al terminar, lee el grafo con `memory_read_graph` para confirmar que todas las entidades y relaciones se crearon correctamente. Reporta el número total de entidades y relaciones.

### Requisitos de calidad:
- **No omitir ningún archivo** de `src/` ni de `src/services/`, `src/ui/`, `src/render/`, `src/utils/`
- **Incluir suficiente contexto** en cada observación para que un nuevo contribuyente entienda qué hace cada módulo y cómo se conecta
- **Las relaciones deben reflejar la dirección real** de los imports en el código
- **El comando debe ser idempotente**: ejecutarlo varias veces no debe duplicar entidades ni relaciones
- Usar el contenido literal del código fuente, no inventar información
