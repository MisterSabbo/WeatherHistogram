# Spec: `src/data/skins.js`

## Propósito
Datos de fototipos de piel (Fitzpatrick) y función para determinar si se necesita protección solar.

## Dependencias

Sin dependencias internas.

## API Pública

### `export const SKIN_TYPES: Array<{ id: number, labelKey: string, uvThreshold: number }>`

**Descripción:** Los 6 fototipos Fitzpatrick con su umbral UV a partir del cual necesitan protección.

### `export const DEFAULT_SKIN_TYPE: number` (= 2)

### `export function getSkinType(id: number): { id: number, labelKey: string, uvThreshold: number }`

**Descripción:** Busca un fototipo por ID. Retorna tipo II (índice 1) como fallback.

### `export function needsSunProtection(skinType: number, uvIndex: number): boolean`

**Descripción:** Determina si un fototipo necesita protección solar dado el índice UV.

## Comportamiento

1. `SKIN_TYPES`: I=threshold 1, II=2, III=3, IV=4, V=5, VI=6
2. `getSkinType`: si no encuentra, retorna `SKIN_TYPES[1]` (tipo II)
3. `needsSunProtection`: `uvIndex > 0 && skin.uvThreshold <= uvIndex`

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `getSkinType(0)` (no existe) | Retorna tipo II |
| `getSkinType(7)` (fuera de rango) | Retorna tipo II |
| `needsSunProtection(2, 0)` | false (UV=0) |
| `needsSunProtection(1, 1)` | true (I necesita con UV≥1) |

## Escenarios de test

1. **getSkinType existente:** ID 1 retorna tipo I con threshold 1
2. **getSkinType inexistente:** ID 0 retorna tipo II
3. **Protección necesaria:** Skin II con UV 3 → true
4. **Protección no necesaria:** Skin II con UV 1 → false
5. **UV cero:** Siempre false
6. **Default:** DEFAULT_SKIN_TYPE = 2

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
