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

### `async updateDayMoods(locationName: string, dayTimestamp: number, moods: string[]): Promise<boolean>`

**Descripción:** Actualiza los estados de ánimo de un día específico en el historial de una ubicación. Busca la entrada diaria donde `d.time === dayTimestamp`, asigna `d.moods = moods` (o elimina la key si `moods` es un array vacío), y persiste con `setHistory`. Retorna `true` si encontró el día y actualizó, `false` si no lo encontró.

### `async updateDayConditions(locationName: string, dayTimestamp: number, conditions: Object): Promise<boolean>`

**Descripción:** Actualiza los estados de salud (cold/allergies) de un día específico en el historial de una ubicación. Busca la entrada diaria donde `d.time === dayTimestamp`, asigna `d.cold = conditions.cold` (booleano) y `d.allergies = conditions.allergies` (booleano), y persiste con `setHistory`. Si `conditions.cold` es `false`, elimina la key `cold`. Si `conditions.allergies` es `false`, elimina la key `allergies`. Retorna `true` si éxito, `false` si error.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `locationName` | `string` | Nombre de la ubicación |
| `dayTimestamp` | `number` | Timestamp del día |
| `conditions` | `Object` | `{ cold: boolean, allergies: boolean }` |

**Metadatos:**
- Async: Sí (await setHistory)

### `async updateDayData(locationName: string, dayTimestamp: number, fields: Object): Promise<boolean>`

**Descripción:** Batch update — persiste múltiples campos de un día en una sola operación de lectura+escritura, evitando race conditions. Cada key en `fields` se asigna como propiedad del día; si el valor es `undefined`, se elimina la key. Crea una nueva entrada si el día no existe.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `locationName` | `string` | Nombre de la ubicación |
| `dayTimestamp` | `number` | Timestamp del día |
| `fields` | `Object` | `{ notes?, moods?, cold?, allergies?, ... }` |

**Metadatos:**
- Async: Sí (await getHistory + setHistory)

### `export const storageService: StorageService` (singleton)

## Comportamiento

1. `init`: idempotente (solo abre si `this.db === null`)
2. `get`/`set`: fallback silencioso a localStorage si IndexedDB falla
3. `getHistory`: si no existe, retorna objeto vacío
4. `setHistory`: falla silenciosamente si IndexedDB no está disponible
5. `updateDayMoods`: mismo patrón que `updateDayNotes` — busca día por timestamp, asigna o elimina key `moods`, persiste con `setHistory`

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
| `updateDayMoods` sin datos del día | Retorna `false` |
| `updateDayMoods` con moods vacío | Elimina la key `moods` del objeto daily |
| `updateDayMoods` con moods array | Asigna `d.moods = moods` y persiste |
| `updateDayMoods` con moods null/undefined | Elimina la key `moods` del objeto daily |
| `updateDayConditions` con cold=true, allergies=false | Asigna `d.cold = true`, elimina key `allergies`, persiste |
| `updateDayConditions` con cold=false, allergies=true | Elimina key `cold`, asigna `d.allergies = true`, persiste |
| `updateDayConditions` con cold=false, allergies=false | Elimina keys `cold` y `allergies`, persiste |
| `updateDayConditions` sin datos del día (day no existe) | Crea nuevo día `{ time: dayTimestamp, cold: true, allergies: true }` |
| `updateDayConditions` con día existente | Encuentra día, actualiza condiciones, persiste |
| `updateDayData` con múltiples fields | Asigna todos en una sola escritura, sin race condition |
| `updateDayData` con field=undefined | Elimina esa key del objeto daily |
| `updateDayData` día inexistente | Crea nueva entrada `{ time: dayTimestamp, ...fields }` |

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
12. **updateDayMoods día existente:** encuentra el día, asigna moods array, persiste, retorna `true`
13. **updateDayMoods día inexistente:** retorna `false`
14. **updateDayMoods moods vacío:** elimina key y persiste
15. **updateDayMoods API expuesta:** storageService tiene método `updateDayMoods`
**updateDayConditions día existente:** encuentra el día, asigna cold=true/allergies=true, persiste, retorna `true`
**updateDayConditions día inexistente:** retorna `false`
**updateDayConditions cold=false, allergies=false:** elimina keys y persiste
**updateDayConditions API expuesta:** storageService tiene método `updateDayConditions`
**updateDayData día existente:** batch update — asigna todos los fields en una sola operación, persiste, retorna `true`
**updateDayData día inexistente:** crea nuevo día, asigna fields, persiste, retorna `true`
**updateDayData con field=undefined:** elimina esa key del día
**updateDayData API expuesta:** storageService tiene método `updateDayData`

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
| 2026-05-21 | Añadido `updateDayNotes` para notas personales YIP | SDD |
| 2026-05-21 | Añadido `updateDayMoods` para estados de ánimo YIP | SDD |
| 2026-05-28 | Añadido `updateDayConditions` para cold/allergies tracking YIP | SDD |
| 2026-05-28 | Añadido `updateDayData` batch method para evitar race conditions en saveDayDetail | SDD |
