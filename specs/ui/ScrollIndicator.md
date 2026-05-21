# Spec: `src/ui/ScrollIndicator.js`

## Propósito
Indicadores de scroll horizontal (flechas izquierda/derecha) con paginación por dots y animación de descubrimiento.

## Dependencias

Sin dependencias externas.

## API Pública

### `export function updateScrollIndicator(metricsContainer: HTMLElement, scrollIndLeft: HTMLElement, scrollIndRight: HTMLElement, metricsDots: HTMLElement): void`

**Descripción:** Actualiza visibilidad de flechas y dots según posición de scroll.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `metricsContainer` | `HTMLElement` | Contenedor con scroll horizontal |
| `scrollIndLeft` | `HTMLElement` | Flecha izquierda |
| `scrollIndRight` | `HTMLElement` | Flecha derecha |
| `metricsDots` | `HTMLElement` | Contenedor de dots de paginación |

**Metadatos:**
- Mutates state: Sí (modifica display de elementos DOM)
- Async: No

### `export function initScrollIndicator(metricsContainer: HTMLElement, scrollIndLeft: HTMLElement, scrollIndRight: HTMLElement, metricsDots: HTMLElement): void`

**Descripción:** Inicializa indicadores con auto-discovery animation.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `metricsContainer` | `HTMLElement` | Contenedor con scroll horizontal |
| `scrollIndLeft` | `HTMLElement` | Flecha izquierda |
| `scrollIndRight` | `HTMLElement` | Flecha derecha |
| `metricsDots` | `HTMLElement` | Contenedor de dots |

**Metadatos:**
- Mutates state: Sí (registra event listeners scroll + resize)
- Async: No

## Comportamiento

1. Muestra flecha derecha si hay overflow y no está al final
2. Muestra flecha izquierda si hay overflow y no está al inicio
3. Dots: `totalPages = ceil(scrollWidth / clientWidth)`, `currentPage = round(scrollLeft / pageWidth)`
4. Si totalPages > 1, añade contador "N/total"
5. Discovery animation: primer overflow → 3 bounces de la flecha derecha

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `metricsContainer = null` / `undefined` | No lanza error (parámetros opcionales en práctica) |
| Container sin overflow (`scrollWidth <= clientWidth`) | Flechas ocultas, dots vacíos |
| Container con `scrollWidth = 0` | No muestra flechas ni dots |
| `totalPages = 0` | No añade contador "N/total" |
| Discovery animation ya reproducida | No reproduce animación de nuevo |
| Resize del viewport | `initScrollIndicator` recalcula visibilidad |

## Escenarios de test

1. **Se inicializa sin errores con elementos DOM presentes:** `initScrollIndicator` con elementos válidos, no lanza error
2. **No lanza si faltan elementos DOM en el documento:** Parámetros null/undefined, no lanza error
3. **Exporta las funciones esperadas:** `initScrollIndicator`, `updateScrollIndicator` son funciones
4. **Sin overflow:** `scrollWidth <= clientWidth`, flechas ocultas
5. **Con overflow:** Flechas visibles según posición de scroll
6. **Discovery animation:** Primer overflow reproduce 3 bounces

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
