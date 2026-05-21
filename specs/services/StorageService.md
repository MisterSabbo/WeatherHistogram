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

### `async updateDayNotes(locationName: string, dayTimestamp: number, notes: string): Promise<boolean>`

**Descripción:** Actualiza las notas de un día específico en el historial de una ubicación. Busca la entrada diaria donde `d.time === dayTimestamp`, asigna `d.notes = notes` (o elimina la key si `notes` es string vacío), y persiste con `setHistory`. Retorna `true` si encontró el día y actualizó, `false` si no lo encontró.

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
| `updateDayNotes` sin datos del día | Retorna `false` |
| `updateDayNotes` con notes vacío | Elimina la key `notes` del objeto daily |
| `updateDayNotes` con notes texto | Asigna `d.notes = notes` y persiste |

## Escenarios de test

1. **get/set:** escribe y lee correctamente
2. **Default value:** get de clave inexistente retorna default
3. **getHistory vacío:** retorna `{ hourly: [], daily: [] }`
4. **getHistory con datos:** retorna los datos guardados
5. **init idempotente:** llamado múltiples veces no recrea DB
6. **Fallback localStorage:** si IndexedDB falla, usa localStorage
7. **Singleton:** storageService es instancia única
8. **updateDayNotes día existente:** encuentra el día, asigna notas, persiste, retorna `true`
9. **updateDayNotes día inexistente:** retorna `false`
10. **updateDayNotes notes vacío:** elimina key y persiste
11. **updateDayNotes API expuesta:** storageService tiene método `updateDayNotes`

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
| 2026-05-21 | Añadido `updateDayNotes` para notas personales YIP | SDD |
