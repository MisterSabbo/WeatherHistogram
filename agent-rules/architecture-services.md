### Services & Data Flow

- **WeatherService** (`src/services/WeatherService.js`): Calls Open-Meteo API directly via `fetch()`. Returns `{ forecastData, aqiData }`.
- **WeatherFetcher** (`src/domain/WeatherFetcher.js`): Orchestrates the fetch workflow — calls `weatherService.getWeatherData()`, manages `weatherCache` Map with 5-minute TTL, 15s abort timeout, fallback to expired cache on network error, fallback to mock data if no cache exists. Exposes `fetchWeatherData(pastDays, forecastDays, callbacks)` and `clearWeatherCache()`.
- **DataProcessor** (`src/services/DataProcessor.js`): Transforms raw API data into `state.hourlyData` / `state.dailyData`. Also persists past data to IndexedDB (Year in Pixels feature).
- **StorageService** (`src/services/StorageService.js`): IndexedDB (db: `WeatherHistDB`, stores: `userPreferences`, `historyData`) with localStorage fallback. Access via `storageService.get()` / `.set()`.
- **GeoService**: Geocoding via Open-Meteo and reverse-geocoding via Nominatim.
- **AqiManager**: Exports `getAQIInfo`, `getPollenText`, `getAggregatedPollenLevel`, `getPollenLevelByType` — used for AQI/Pollen display and YIP coloring.
- **FavoritesService, MockData** — supporting services; imported where needed.
- Legacy `src/services/api.js` was removed in Phase 0 (dead code).
