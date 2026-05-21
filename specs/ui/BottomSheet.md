# Spec: `src/ui/BottomSheet.js`

## Propósito
Sistema de bottom sheets modales con swipe-to-dismiss, stacking z-index, y callbacks de cierre.

## Dependencias

### DOM
| Elemento | Tipo de acceso | Contexto |
|----------|---------------|----------|
| elementos por ID dinámicos | getElementById | openBottomSheet |
| `[id]-backdrop` | getElementById | backdrops |

## API Pública

### `export function initBottomSheets(): void`

**Descripción:** Reinicia estado interno de sheets.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| — | — | Sin parámetros |

**Metadatos:**
- Mutates state: Sí (estado interno `_activeSheets`, `_depth`)
- Async: No

### `export function onSheetClose(sheetId: string, callback: Function): void`

**Descripción:** Registra callback al cerrar un sheet.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `sheetId` | `string` | ID del sheet a observar |
| `callback` | `Function` | Función a ejecutar al cerrarse |

**Metadatos:**
- Mutates state: Sí (registro interno de callbacks)
- Async: No

### `export function openBottomSheet(sheetId: string, backdropId?: string, scrollElementId?: string): Function`

**Descripción:** Abre sheet con z-index creciente y swipe-to-dismiss. Retorna función no-op si elementos no existen.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `sheetId` | `string` | ID del elemento sheet |
| `backdropId?` | `string` | ID del backdrop (default `'{sheetId}-backdrop'`) |
| `scrollElementId?` | `string` | ID del elemento con scroll para guard |

**Metadatos:**
- Mutates state: Sí (clases CSS, z-index, eventos)
- Async: No

### `export function closeBottomSheet(sheetId: string, backdropId?: string): void`

**Descripción:** Cierra un sheet y limpia eventos.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `sheetId` | `string` | ID del sheet a cerrar |
| `backdropId?` | `string` | ID del backdrop |

**Metadatos:**
- Mutates state: Sí (clases CSS, eventos, callbacks)
- Async: No

## Comportamiento

1. Z-index dinámico: 7000 + depth * 100 para sheet, 6999 + depth * 100 para backdrop
2. Swipe-to-dismiss con pointer events y touch fallback
3. Umbral de cierre: >100px de arrastre
4. Scroll guard: si scrollElement tiene scrollTop > 0, no arrastra
5. Backdrop click cierra sheet
6. `_activeSheets` por backdropId: solo un sheet activo por backdrop

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `sheetId` no existe en DOM | Retorna función no-op, no lanza error |
| `backdropId` no existe | Crea backdropId por defecto `{sheetId}-backdrop`, si no existe no lanza error |
| `scrollElementId` no existe | Swipe-to-dismiss sin scroll guard |
| Llamar `closeBottomSheet` sin haber abierto | No lanza error, no modifica nada |
| Múltiples sheets mismo backdropId | Solo un sheet activo por backdropId |
| Pointer events no disponibles | Fallback a touch events |

## Escenarios de test

1. **Se inicializa sin errores con elementos DOM presentes:** DOM completo, `initBottomSheets` no lanza error
2. **No lanza si faltan elementos DOM en el documento:** IDs no existen, no lanza error
3. **Exporta las funciones esperadas:** `initBottomSheets`, `openBottomSheet`, `closeBottomSheet`, `onSheetClose` son funciones
4. **Abrir y cerrar sheet:** `openBottomSheet('test')` + `closeBottomSheet('test')` sin errores
5. **Swipe-to-dismiss:** Arrastre >100px cierra el sheet
6. **Múltiples sheets mismo backdrop:** Solo un sheet activo por backdropId

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
