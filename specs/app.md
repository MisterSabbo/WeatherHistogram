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

## Mali-G76 GPU Driver Bug (Redmi Note 10S)

### Causa raíz (descubrimiento v1.10.0e)

El chipset Mali-G76 del Redmi Note 10S tiene un bug en el pipeline de **GPU compositing de múltiples canvases 2D**. Cuando el navegador intenta componer varios elementos `<canvas>` 2D adyacentes usando la GPU (hardware-accelerated compositing), el driver del Mali-G76 produce artefactos visuales:

- **Líneas de costura verticales** entre canvases tiles (1px gap sub-pixel)
- **Capas translúcidas opacas**: nubes y sombras nocturnas se renderizan como bloques sólidos
- **Línea de temperatura cortada** en límites de canvas (escalones)
- **Iconos climáticos truncados** en bordes de tile
- **Patrón alternante**: canvas sí / canvas no

### Intentos de fix previos (incorrectos)

| Versión | Hipótesis | Solución | Resultado |
|---------|-----------|----------|-----------|
| v1.10.0c | Alpha compositing | `destination-out` + `source-over` en `drawTile()`, canvas sin alpha | Falló |
| v1.10.0d | CSS 3D layers | CSS 3D props solo en overlay, overlap 1px, `translateZ(0)` en wrapper | Falló — la causa raíz REAL es el driver GPU |

Ambos intentos asumían problemas de configuración (alpha channel, CSS 3D layers) cuando el bug real está en el **driver de GPU del dispositivo**: el Mali-G76 no compone correctamente múltiples canvases 2D por hardware.

### Solución implementada (v1.10.0e)

1. **Software rendering forzado**: Todos los tile canvases se crean con `canvas.getContext('2d', { willReadFrequently: true })`. Esta opción indica al navegador que el canvas será leído con frecuencia, lo que fuerza el renderizado por CPU (software rendering) en lugar de usar la GPU. En navegadores que no soporten el hint, se usa el fallback `canvas.getContext('2d')`.

2. **CSS `image-rendering: auto`**: Los tile canvases usan `image-rendering: auto` en lugar de `pixelated`, ya que el renderizado por CPU maneja correctamente el suavizado de imágenes.

3. **Snap scroll a entero**: Se añade un bloque de snap-to-integer-position al finalizar el scroll (`scrollend`, `mouseup`, `touchend`) para prevenir que posiciones sub-pixel causen artefactos en la composición de tiles durante el scroll suave.

4. **Revertir overlap 1px**: Se elimina el overlap de 1px entre tiles (introducido en v1.10.0d) porque ya no es necesario — el software rendering elimina la causa raíz. Los tiles vuelven a `TILE_WIDTH` exacto.

### Contexto de canvas

- **Tile canvases** (creados en `handleResize`): `canvas.getContext('2d', { willReadFrequently: true })` con fallback a `canvas.getContext('2d')`. Sin `{ alpha: true }`. Renderizado por CPU.
- **Limpieza de tile canvas** (en `drawTile`): solo `ctx.clearRect(0, 0, w, h);`.
- **`minimapCanvas` y `fixedOverlayCanvas`** (en `initCanvas`): usan `{ alpha: true }` porque overlays necesitan transparencia.
- **`#canvas-wrapper > canvas`**: ya no necesita `will-change: auto` o `backface-visibility` específicos, pero se mantienen como defensa pasiva.

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
6. **Tile canvases con willReadFrequently**: `handleResize()` crea contextos con `{ willReadFrequently: true }` para forzar renderizado por CPU en GPUs problemáticas (Mali-G76). Fallback a `getContext('2d')` sin opciones si el hint no es soportado.
7. **Tile width exacto (sin overlap)**: Cada tile se crea con `TILE_WIDTH` exacto (sin `+1`). El overlap 1px fue revertido porque la solución real (software rendering) elimina la causa raíz.
8. **Snap scroll a entero**: Al finalizar scroll (`scrollend`, `mouseup`, `touchend`) se redondea `scrollLeft` a entero para prevenir artefactos sub-pixel en composición de tiles.
9. **drawTile sin destination-out**: Solo `clearRect()` para limpiar canvas.

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| Fetch falla (network error) | `loadWeather` captura error, muestra `showError`, `isFetching=false` |
| `state.hourlyData` vacío al renderizar | `render()` no dibuja nada, retorna sin error |
| Datos incompletos (sin `sunData`, sin `dailyData`) | Graceful degradation: algunas secciones no se renderizan |
| `window.innerWidth` < 600 | `handleResize` cambia `PIXELS_PER_HOUR` a 50 y `TILE_WIDTH` a 720 |
| `devicePixelRatio` no definido | Fallback a 1 en cálculos de DPR |
| `init()` llamado antes de `DOMContentLoaded` | Listeners pueden no attacharse (no controlado) |
| Resize durante renderizado en curso | `handleResize` interrumpe y recrea tiles |
| Scroll muy rápido | Render throttle via `requestAnimationFrame`, frames se saltan |
| Múltiples clicks en "now" | `centerOnCurrentTime` se ejecuta múltiples veces (no hay debounce) |
| GPU Mali-G76 con composición de múltiples canvases | `getContext('2d', { willReadFrequently: true })` fuerza renderizado por CPU; no depende de CSS. Tiles sin overlap (exact TILE_WIDTH). Snap scroll a entero para evitar artefactos sub-pixel |
| Canvas con alpha en resize | `handleResize` crea contextos sin alpha para evitar artefactos en tiles alternos |

## Escenarios de test

1. **No lanza excepción con datos simulados:** `render()` con datos mock, no lanza error
2. **No lanza con hourlyData vacío:** `state.hourlyData = []`, `render()` retorna sin error
3. **No lanza con DOMContentLoaded:** `init()` se ejecuta sin errores
4. **Fetch falla:** `loadWeather` captura error, `isFetching = false`
5. **Resize responsive:** `window.innerWidth < 600` cambia PIXELS_PER_HOUR y TILE_WIDTH
6. **Scroll rápido:** Render throttle via requestAnimationFrame sin errores
7. **Canvas clearing simple:** `drawTile()` aplica solo `clearRect(0, 0, w, h)` sin `destination-out`, sin lanzar error
8. **Canvas con willReadFrequently en resize:** `handleResize()` pasa `{ willReadFrequently: true }` a `getContext('2d')`; si no soportado, fallback a `getContext('2d')` sin opciones
9. **Tile width exacto en handleResize:** `canvas.width = TILE_WIDTH * state.dpr`, `canvas.style.width = TILE_WIDTH + 'px'`, y `canvasWrapper.style.width = totalWidth + 'px'` (sin +1, revertido overlap)

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
| 2026-05-27 | Bugfix Mali-G76 v1: limpieza robusta canvas, remove alpha en tile canvases, reset compositing | SDD |
| 2026-05-27 | Bugfix Mali-G76 v2 (spec-update): corrige causa raíz real — GPU layer composition. CSS 3D props solo en fixed-overlay-canvas, tile canvases con overlap 1px, revert destination-out. | SDD |
| 2026-05-27 | Bugfix Mali-G76 v3 (spec-update): corrige causa raíz REAL — driver GPU Mali-G76. Software rendering via `willReadFrequently: true`. Revert overlap 1px. Snap scroll a entero. image-rendering: auto. Los fixes previos v1.10.0c (destination-out) y v1.10.0d (CSS 3D layers) se marcan como superseded. | SDD |
