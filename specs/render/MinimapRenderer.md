# Spec: `src/render/MinimapRenderer.js`

## Propósito
Renderiza el minimap (vista reducida del histograma con modo past/future), viewport selector, y manejo de clics para navegación.

## Dependencias

### state
| Propiedad | Acceso | Contexto |
|-----------|--------|----------|
| `state.hourlyData` | read | draw, updateViewport |
| `state.dpr` | read | draw |
| `state.theme` | read | colores |
| `state.sunData` | read | no usado directamente |

### CONFIG vía parámetro
| Constante | Contexto |
|-----------|----------|
| `config.PIXELS_PER_HOUR` | cálculos de posición |

### Módulos internos
| Módulo | Export usado | Para qué |
|--------|-------------|----------|
| `../utils/time.js` | `getSplitIndex` | dividir pasado/futuro |
| `../theme.js` | `getThemeColor`, `getThemeFont` | colores/fuente |
| `../utils/math.js` | `normalizeY` | Y de temperatura |

## API Pública

### `export class MinimapRenderer`

#### `constructor(options: Object)`

**Descripción:** Inicializa el renderer del minimap.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `options.canvas` | `HTMLCanvasElement` | Canvas del minimap |
| `options.ctx` | `CanvasRenderingContext2D` | Contexto del canvas |
| `options.viewportEl` | `HTMLElement` | Elemento viewport selector |
| `options.scrollContainer` | `HTMLElement` | Contenedor con scroll |
| `options.centerOnCurrentTime` | `Function` | Callback para centrar en hora actual |
| `options.updateNowButtonPosition` | `Function` | Callback para actualizar botón now |
| `options.minimapHeight` | `number` | Alto del minimap |

**Metadatos:** Mutates state: Sí (estado interno de la clase), Async: No

#### `invalidateCache(): void`

**Descripción:** Limpia el cacheCanvas.

**Metadatos:** Mutates state: Sí (limpia caché), Async: No

#### `setMode(mode: string, isUserInteraction: boolean, state: Object, config: Object): void`

**Descripción:** Cambia modo past/future.

**Metadatos:** Mutates state: Sí (modo interno), Async: No

#### `updateViewport(state: Object, config: Object): void`

**Descripción:** Actualiza posición del viewport selector.

**Metadatos:** Mutates state: Sí (viewportEl.style), Async: No

#### `handleClick(clientX: number, state: Object, config: Object): number`

**Descripción:** Calcula scrollLeft target desde clic en minimap.

**Metadatos:** Mutates state: No, Async: No

#### `setCanvasSize(state: Object): void`

**Descripción:** Redimensiona canvas del minimap.

**Metadatos:** Mutates state: Sí (canvas dimensions), Async: No

#### `draw(state: Object, config: Object): void`

**Descripción:** Renderiza minimap con caché.

**Metadatos:** Mutates state: No (usa cacheCanvas), Async: No

## Comportamiento

1. Dos modos: 'past' (splitIndex → 0) y 'future' (splitIndex → end)
2. Auto-switch entre modos basado en posición del scroll
3. Caché en cacheCanvas para evitar redibujar en cada scroll
4. Auto-switch deshabilitado durante drag manual (isDragging)
5. Renderiza: fondo, noche, etiquetas de fecha, línea 0°C, nubes, precipitación, probabilidad, temperatura, UV, now line

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `state.hourlyData` vacío | `draw` retorna sin dibujar |
| `config.PIXELS_PER_HOUR = 0` | Cálculos de posición inválidos, no lanza error |
| `handleClick` con `clientX` negativo | Calcula scrollLeft < 0, clamped a 0 |
| `canvas = null` en constructor | No lanza error (constructor no valida) |
| `setCanvasSize` con `state.dpr = 0` | Canvas dimensionado a 0 |
| `invalidateCache` sin haber dibujado | No lanza error |
| Auto-switch deshabilitado durante drag | No cambia modo aunque scroll cambie |
| Modo inválido (ni 'past' ni 'future') | `setMode` no actualiza correctamente |

## Escenarios de test

1. **No lanza excepción con datos simulados:** Instancia `MinimapRenderer` y llama `draw` con datos mock, no lanza error
2. **No lanza con hourlyData vacío:** `state.hourlyData = []`, `draw` retorna sin dibujar
3. **No lanza con ctx = null/undefined:** Canvas nulo en constructor, no lanza error
4. **Cambio de modo past/future:** `setMode` cambia correctamente el modo de visualización
5. **Actualización de viewport:** `updateViewport` refleja scroll actual
6. **Clic en minimap:** `handleClick` retorna scrollLeft correcto

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
