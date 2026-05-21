# Spec: `src/utils/dom.js`

## Propósito
Utilidades de DOM. Actualmente expone solo un `debounce` para limitar la frecuencia de ejecución de funciones.

## Dependencias

Sin dependencias internas ni de estado/DOM.

## API Pública

### `export function debounce(fn: Function, delay?: number): Function`

**Descripción:** Crea una versión "debounced" de la función `fn` que retrasa su ejecución hasta que hayan pasado `delay` ms desde la última invocación.

**Parámetros:**
| Nombre | Tipo | Descripción |
|--------|------|-------------|
| `fn` | `Function` | Función a debouncear |
| `delay` | `number` | Milisegundos de espera (default: 150) |

**Retorno:** `Function` función wrapper que agrupa llamadas

**Mutates state:** No

**Async:** No

## Comportamiento

1. Cada llamada a la función retornada reinicia el timer
2. La función original se ejecuta con el `this` y los argumentos de la última llamada
3. Si no se provee `delay`, usa 150ms

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| Llamadas consecutivas rápidas | Solo se ejecuta la última después del delay |
| `delay = 0` | Se ejecuta en el siguiente tick (setTimeout 0) |
| Sin argumentos extra | La función interna se llama sin argumentos |

## Escenarios de test

1. **Debounce básico:** llamada rápida 3 veces, solo se ejecuta 1 vez tras el delay
2. **Delay personalizado:** delay=500, espera 500ms antes de ejecutar
3. **Contexto this:** el `this` del llamante se preserva
4. **Argumentos:** los argumentos de la última llamada se pasan a fn

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
