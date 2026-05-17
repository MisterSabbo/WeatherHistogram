### Services & Data Flow

- **WeatherService** (`src/services/WeatherService.js`): Calls Open-Meteo API directly via `fetch()`. Returns `{ forecastData, aqiData }`.
- **DataProcessor** (`src/services/DataProcessor.js`): Transforms raw API data into `state.hourlyData` / `state.dailyData`. Also persists past data to IndexedDB (Year in Pixels feature).
- **StorageService** (`src/services/StorageService.js`): IndexedDB (db: `WeatherHistDB`, stores: `userPreferences`, `historyData`) with localStorage fallback. Access via `storageService.get()` / `.set()`.
- **GeoService**: Geocoding via Open-Meteo and reverse-geocoding via Nominatim.
- **AqiManager, FavoritesService, MockData** — supporting services; imported where needed.
- **`src/services/api.js`** (`WeatherAPI` class) exists but is **not imported anywhere** — the active API code is in `WeatherService.js`.
