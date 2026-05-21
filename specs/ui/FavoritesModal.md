# Spec: `src/ui/FavoritesModal.js`

## Propósito
Modal de gestión de ubicaciones favoritas con lista, edición de alias, reordenación y eliminación.

## Dependencias

### Módulos internos
| Módulo | Export usado | Para qué |
|--------|-------------|----------|
| `../services/FavoritesService.js` | `favoritesService` | datos |
| `../store.js` | `state` | no usado directamente (vía callbacks) |
| `../utils/i18n.js` | `t` | traducción |

## API Pública

### `export function initFavoritesModal(onSelect: Function): void`

**Descripción:** Inicializa el modal de favoritos.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `onSelect` | `Function` | Callback `(lat, lon, name)` al seleccionar ubicación |

**Metadatos:**
- Mutates state: No
- Async: No

## Comportamiento

1. Botón `#map-favorites-btn` abre modal con lista de favoritos
2. Modo edición: renombrar alias (prompt modal), eliminar (confirmación), reordenar (↑↓)
3. Modo no edición: click en favorito → `onSelect(lat, lon, originName)`
4. `renderFavorites()` async: carga desde service, construye cards DOM
5. Prompt modal clona botones para evitar listeners duplicados

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| Botón `#map-favorites-btn` no existe | No lanza error, no registra listener |
| `favoritesService.load()` retorna `null` / `undefined` | Muestra mensaje "no hay favoritos" |
| `onSelect` no es función | No lanza error, ignora callback |
| Lista de favoritos vacía (`[]`) | Muestra mensaje vacío |
| Editar alias con valor vacío | No actualiza, mantiene alias anterior |

## Escenarios de test

1. **Se inicializa sin errores con elementos DOM presentes:** `initFavoritesModal` con botón presente, no lanza error
2. **No lanza si faltan elementos DOM en el documento:** Botón `#map-favorites-btn` ausente, no lanza error
3. **Exporta las funciones esperadas:** `initFavoritesModal` es función
4. **Lista vacía de favoritos:** `favoritesService.load()` retorna `[]`, muestra mensaje vacío
5. **Selección de favorito:** Click en favorito llama `onSelect(lat, lon, name)`
6. **Edición de alias:** Valor vacío mantiene alias anterior

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
