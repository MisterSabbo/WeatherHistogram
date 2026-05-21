# Spec: `src/data/changelog.js`

## Propósito
Datos embebidos del changelog de la aplicación, con todas las versiones y sus cambios.

## Dependencias

Sin dependencias internas.

## API Pública

### `export const changelogData: Array<{ version: string, changes: Array<string> }>`

**Descripción:** Array ordenado de versiones (de más reciente a más antigua). Cada entrada contiene `version` (semver con posible sufijo letra) y `changes` (lista de descripciones de cambios).

## Comportamiento

1. Datos estáticos, no mutables
2. Version format: `X.Y.Z` o `X.Y.Z` + letra (a-g)
3. Sin lógica de negocio

## Casos borde

| Condición | Comportamiento esperado |
|-----------|------------------------|
| Array vacío | No hay cambios registrados |
| Versión con 0 cambios | `changes: []` |

## Escenarios de test

1. **Estructura:** cada entrada tiene `version` (string) y `changes` (array)
2. **Orden:** más reciente primero
3. **No vacío:** al menos una entrada
4. **Changes son strings:** cada change es un string no vacío

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
