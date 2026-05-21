# Spec: `src/app.js`

## Propósito
Orquestador principal de la aplicación. Inicializa ~28 funciones, maneja renderizado (tiled canvas), eventos de scroll/drag, resize, y carga inicial de datos.

## Dependencias

### state
| Propiedad | Acceso | Contexto |
|-----------|--------|----------|
| `state.*` | read/write | toda la app |

### CONFIG
| Constante | Contexto |
|-----------|----------|
| `CONFIG.CHART_HEIGHT` | render |
| `CONFIG.MINIMAP_HEIGHT` | minimap |
| `CONFIG.DEFAULT_COORDS` | geolocation fallback |
| `CONFIG.CACHE_DURATION` | fetch |

### Módulos internos
Prácticamente todos los módulos del proyecto son importados.

## API Pública

Sin exports públicos; el módulo se ejecuta al importarse.

### Funciones internas principales

| Función | Descripción | Mutates state | Async |
|---------|-------------|:---:|:---:|
| `init()` | Async principal que ejecuta todas las inicializaciones | Sí | Sí |
| `useMyLocation(force?)` | Carga ubicación guardada o geolocalización | Sí | Sí |
| `loadWeather()` | Fetch + render | Sí | Sí |
| `render()` | Dibuja tiles visibles + minimap + top panel + overlay | Sí | No |
| `drawTile(tile)` | Dibuja un tile individual | No | No |
| `drawFixedOverlay()` | Dibuja scrubber overlay, labels, now button | Sí | No |
| `handleResize()` | Redimensiona todo | Sí | No |
| `centerOnCurrentTime(behavior?)` | Scroll al momento actual | Sí | No |
| `toggleTheme()` | Cambia tema dark/light | Sí | No |
| `updateLocationUI()` | Actualiza DOM de ubicación | Sí | No |
| `updateNowButtonPosition()` | Posiciona botón flotante "now" | Sí | No |
| `showError(msg)` | Muestra error en DOM | Sí | No |

### Funciones init hijas (~28)

| Función | Mutates state | Async |
|---------|:---:|:---:|
| `initStorage()` | Sí | Sí |
| `initPwaDetection()` | No | No |
| `initNetworkStatus()` | Sí | No |
| `initPullToRefresh()` | Sí | No |
| `initTouchPrevention()` | Sí | No |
| `initSpfModal()` | Sí | No |
| `initPollenAqiIcons()` | Sí | No |
| `initCanvas()` | Sí | No |
| `initModals()` | Sí | No |
| `initLocationButton()` | Sí | No |
| `initUvBlock()` | Sí | No |
| `initLocationTooltip()` | Sí | No |
| `initAlertsContainer()` | Sí | No |
| `initTheme()` | Sí | No |
| `initCollapsibleSections()` | Sí | No |
| `initNowButton()` | Sí | No |
| `initInfoModal()` | Sí | No |
| `initLanguage()` | Sí | No |
| `initThemeSelector()` | Sí | No |
| `initStickmanSliders()` | Sí | No |
| `initSkinCards()` | Sí | No |
| `initForceRefresh()` | Sí | No |
| `initClearData()` | Sí | No |
| `initLoadingTimeout()` | Sí | No |
| `initViewMode()` | Sí | No |
| `initMinimapEvents()` | Sí | No |
| `initScrollEvents()` | Sí | No |
| `initScrollIndicator()` | Sí | No |
| `startPulseLoop()` | Sí | No |

## Comportamiento

1. Inicialización secuencial en `DOMContentLoaded`
2. Renderizado por tiles con buffer de 1 tile a cada lado
3. Scroll render vía requestAnimationFrame
4. Scrubber overlay con interpolación subpixel y detección de colisión de labels
5. Resize responsive: cambia PIXELS_PER_HOUR y TILE_WIDTH según viewport

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| Fetch falla (network error) | `loadWeather` captura error, muestra `showError`, `isFetching=false` |
| `state.hourlyData` vacío al renderizar | `render()` no dibuja nada, retorna sin error |
| Datos incompletos (sin `sunData`, sin `dailyData`) | Graceful degradation: algunas secciones no se renderizan |
| `window.innerWidth` < 768 | `handleResize` cambia `PIXELS_PER_HOUR` a 50 y `TILE_WIDTH` a 720 |
| `devicePixelRatio` no definido | Fallback a 1 en cálculos de DPR |
| `init()` llamado antes de `DOMContentLoaded` | Listeners pueden no attacharse (no controlado) |
| Resize durante renderizado en curso | `handleResize` interrumpe y recrea tiles |
| Scroll muy rápido | Render throttle via `requestAnimationFrame`, frames se saltan |
| Múltiples clicks en "now" | `centerOnCurrentTime` se ejecuta múltiples veces (no hay debounce) |

## Escenarios de test

1. **No lanza excepción con datos simulados:** `render()` con datos mock, no lanza error
2. **No lanza con hourlyData vacío:** `state.hourlyData = []`, `render()` retorna sin error
3. **No lanza con DOMContentLoaded:** `init()` se ejecuta sin errores
4. **Fetch falla:** `loadWeather` captura error, `isFetching = false`
5. **Resize responsive:** `window.innerWidth < 768` cambia PIXELS_PER_HOUR y TILE_WIDTH
6. **Scroll rápido:** Render throttle via requestAnimationFrame sin errores

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
