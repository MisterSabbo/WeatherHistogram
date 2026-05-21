# Spec: `src/utils/thresholds.js`

## Propósito
Calcula límites Y (min, max, step) para métricas del histograma, con padding y redondeo a múltiplos.

## Dependencias

Sin dependencias internas.

## API Pública

### `export function getYLimits(data: Array, metric: string): { min: number, max: number, step: number }`

**Descripción:** Calcula los límites del eje Y para una métrica basada en los datos, con padding del 15% y redondeo.

**Parámetros:**
| Nombre | Tipo | Descripción |
|--------|------|-------------|
| `data` | `Array` | Datos con campo `metric` |
| `metric` | `string` | `'temp'`, `'humidity'`, `'wind'`, `'uv'` u otro |

**Retorno:** `{ min: number, max: number, step: number }`

### `function getDefaultLimits(metric: string): { min: number, max: number, step: number }` (privada)

## Comportamiento

1. Si `data` vacío o sin valores válidos, retorna límites default
2. Calcula min/max reales, añade padding del 15%
3. Redondea `min` hacia abajo y `max` hacia arriba según step de cada métrica
4. Defaults: `temp: { min: -20, max: 40, step: 10 }`, `humidity: { min: 0, max: 100, step: 20 }`, `wind: { min: 0, max: 100, step: 20 }`, `uv: { min: 0, max: 11, step: 3 }`
5. Otros: `{ min: 0, max: 100, step: 10 }`

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `data` vacío (`[]`) | Retorna defaults |
| `data` con todos `null` | Filtrados → array vacío → retorna defaults |
| `metric` desconocida | Entra en `default` del switch, que llama a `getDefaultLimits` con `'temp'`? No, llama con la métrica original |
| Rango 0 (todos valores iguales) | `range = 1` para evitar división por cero |

## Escenarios de test

1. **Límites con datos:** valores [10, 20, 30], metric='temp' → min/max redondeados
2. **Datos vacíos:** `[]` → retorna defaults
3. **Todos null:** `[null, null]` → retorna defaults
4. **Wind con datos:** valores calculan max redondeado a 20
5. **UV con datos:** max no menor a 11

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
