# Spec: `src/services/StorageService.js`

## Propósito
Servicio de persistencia con IndexedDB y fallback a localStorage.

## Dependencias

Sin dependencias internas.

## API Pública

### `export class StorageService`

### `async init(): Promise<void>`

**Descripción:** Abre conexión a IndexedDB (DB: "WeatherHistDB", versión 2). Crea object stores "userPreferences" y "historyData" si no existen.

### `async get(key: string, defaultValue?: any): Promise<any>`

**Descripción:** Lee un valor. Fallback a localStorage si IndexedDB falla.

### `async set(key: string, value: any): Promise<void>`

**Descripción:** Escribe un valor. Fallback a localStorage si IndexedDB falla.

### `async getHistory(locationName: string): Promise<{ hourly: Array, daily: Array }>`

**Descripción:** Obtiene historial de una ubicación. Retorna `{ hourly: [], daily: [] }` si no existe.

### `async setHistory(locationName: string, pastData: Object): Promise<void>`

**Descripción:** Guarda historial de una ubicación.

### `export const storageService: StorageService` (singleton)

## Comportamiento

1. `init`: idempotente (solo abre si `this.db === null`)
2. `get`/`set`: fallback silencioso a localStorage si IndexedDB falla
3. `getHistory`: si no existe, retorna objeto vacío
4. `setHistory`: falla silenciosamente si IndexedDB no está disponible

## Casos borde

| Condición | Comportamiento esperado |
|-----------|------------------------|
| IndexedDB no disponible | Fallback a localStorage |
| `get` de clave inexistente | Retorna defaultValue |
| `set` con valor circular | JSON.stringify falla → error en localStorage |
| `getHistory` sin datos | `{ hourly: [], daily: [] }` |
| `init` llamado múltiples veces | Solo abre una vez |

## Escenarios de test

1. **get/set:** escribe y lee correctamente
2. **Default value:** get de clave inexistente retorna default
3. **getHistory vacío:** retorna `{ hourly: [], daily: [] }`
4. **getHistory con datos:** retorna los datos guardados
5. **init idempotente:** llamado múltiples veces no recrea DB
6. **Fallback localStorage:** si IndexedDB falla, usa localStorage
7. **Singleton:** storageService es instancia única

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
