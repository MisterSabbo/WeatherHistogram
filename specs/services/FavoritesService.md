# Spec: `src/services/FavoritesService.js`

## Propósito
Servicio para gestionar ubicaciones favoritas con persistencia en IndexedDB vía StorageService.

## Dependencias

### Módulos internos
| Módulo | Export usado | Para qué |
|--------|-------------|----------|
| `./StorageService.js` | `storageService` | persistencia |

## API Pública

### `export class FavoritesService`

### `new FavoritesService(): FavoritesService`

**Descripción:** Inicializa con caché vacía.

### `async load(): Promise<Array>`

**Descripción:** Carga favoritos desde storage.

### `async save(): Promise<void>`

**Descripción:** Persiste caché a storage.

### `async add(lat, lon, originalName): Promise<void>`

**Descripción:** Añade favorito si no existe ya (por coordenadas con tolerancia 0.001).

### `async remove(index): Promise<void>`

### `async updateAlias(index, alias): Promise<void>`

### `async reorder(oldIndex, newIndex): Promise<void>`

### `async clear(): Promise<void>`

### `export const favoritesService: FavoritesService` (singleton)

## Comportamiento

1. `load`/`save` se llaman internamente en cada operación mutante
2. `add` verifica duplicados con tolerancia 0.001 en lat/lon
3. `reorder` no hace nada si newIndex fuera de rango
4. `clear` vacía la caché y persiste

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `add` con ubicación existente | No duplica |
| `remove` con índice inválido | splice con índice inválido → error o nada |
| `reorder` con índices fuera de rango | No hace nada |
| Storage falla | Error propagado al caller |

## Escenarios de test

1. **Add nuevo favorito:** se añade y persiste
2. **Add duplicado:** no se añade
3. **Remove:** elimina y persiste
4. **Reorder:** cambia orden y persiste
5. **Clear:** vacía lista y persiste
6. **Singleton:** favoritesService es instancia única

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
