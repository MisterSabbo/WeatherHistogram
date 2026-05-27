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

## GPU Layer Composition (Mali-G76)

### Causa raíz (descubrimiento v1.10.0d)

El CSS global en `src/styles/layout.css` aplicaba `will-change: transform`, `backface-visibility: hidden`, y `transform-style: preserve-3d` a TODOS los `<canvas>`. Esto convertía cada tile canvas en una capa 3D independiente en la GPU. En Mali-G76 (Redmi Note 10S), componer texturas 3D adyacentes introduce:

- **Líneas de costura verticales** entre canvases tiles (1px gap sub-pixel)
- **Capas translúcidas opacas**: nubes y sombras nocturnas se renderizan como bloques sólidos
- **Línea de temperatura cortada** en límites de canvas (escalones)
- **Iconos climáticos truncados** en bordes de tile
- **Patrón alternante**: canvas sí / canvas no

### Solución implementada

1. **CSS específico**: Las propiedades 3D (`will-change: transform`, `backface-visibility`, `transform-style: preserve-3d`) se aplican SOLO a `#fixed-overlay-canvas`. Los tile canvases (`#canvas-wrapper > canvas`) usan `will-change: auto`, `backface-visibility: visible`, `transform-style: flat`, e `image-rendering: pixelated`. Esto evita que cada tile sea una capa 3D independiente.

2. **`#canvas-wrapper` con `translateZ(0)`**: Se añade `transform: translateZ(0)` al wrapper para promover SOLO una capa GPU (el wrapper completo), no cada tile individual.

3. **Overlap de 1px**: Cada tile canvas se crea con `style.width = TILE_WIDTH + 1` para solapar 1px con el tile vecino, eliminando la línea de costura sub-pixel. `canvas.width` se escala con DPR: `(TILE_WIDTH + 1) * state.dpr`.

4. **Revertir drawTile**: Se elimina el bloque `destination-out` + `source-over` (fix incorrecto de v1.10.0c). Solo queda `ctx.clearRect(0, 0, w, h);`. El contexto 2D se mantiene sin `{ alpha: true }`.

### Contexto de canvas

- **Tile canvases** (creados en `handleResize`): `canvas.getContext('2d')` sin `{ alpha: true }`. Sin canal alpha para evitar artefactos en GPUs problemáticas.
- **Limpieza de tile canvas** (en `drawTile`): solo `ctx.clearRect(0, 0, w, h);`. El `destination-out` fill fue eliminado porque no soluciona el bug real (era síntoma, no causa).
- **`minimapCanvas` y `fixedOverlayCanvas`** (en `initCanvas`): usan `{ alpha: true }` porque overlays necesitan transparencia.

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
6. **Tile canvases sin alpha**: `handleResize()` crea contextos sin `{ alpha: true }` para evitar problemas de compositing en GPUs problemáticas
7. **Tile overlap 1px**: Cada tile se crea con `TILE_WIDTH + 1` para solapar bordes y eliminar costuras sub-pixel en GPUs Mali-G76
8. **Sin propiedades 3D en tile canvases**: Los tile canvases no tienen `will-change: transform` ni `transform-style: preserve-3d` — esas propiedades solo están en `#fixed-overlay-canvas` para evitar capas GPU independientes por tile
9. **drawTile sin destination-out**: Solo `clearRect()` para limpiar canvas; el fix `destination-out` de v1.10.0c se revirtió (no solucionaba la causa raíz)

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
| GPU Mali-G76 con composición 3D | CSS no debe aplicar `transform-style: preserve-3d` a tile canvases; `#canvas-wrapper` usa `translateZ(0)` para capa GPU única; tiles se solapan 1px para ocultar costuras |
| Canvas con alpha en resize | `handleResize` crea contextos sin alpha para evitar artefactos en tiles alternos |

## Escenarios de test

1. **No lanza excepción con datos simulados:** `render()` con datos mock, no lanza error
2. **No lanza con hourlyData vacío:** `state.hourlyData = []`, `render()` retorna sin error
3. **No lanza con DOMContentLoaded:** `init()` se ejecuta sin errores
4. **Fetch falla:** `loadWeather` captura error, `isFetching = false`
5. **Resize responsive:** `window.innerWidth < 600` cambia PIXELS_PER_HOUR y TILE_WIDTH
6. **Scroll rápido:** Render throttle via requestAnimationFrame sin errores
7. **Canvas clearing simple:** `drawTile()` aplica solo `clearRect(0, 0, w, h)` sin `destination-out`, sin lanzar error
8. **Canvas sin alpha en resize:** `handleResize()` crea contextos sin `{ alpha: true }`, el canvas se renderiza correctamente
9. **Tile overlap 1px en handleResize:** `canvas.style.width = (TILE_WIDTH + 1) + 'px'` y `canvasWrapper.style.width = (totalWidth + 1) + 'px'`

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
| 2026-05-27 | Bugfix Mali-G76 v1: limpieza robusta canvas, remove alpha en tile canvases, reset compositing | SDD |
| 2026-05-27 | Bugfix Mali-G76 v2 (spec-update): corrige causa raíz real — GPU layer composition. CSS 3D props solo en fixed-overlay-canvas, tile canvases con overlap 1px, revert destination-out. | SDD |
