# Spec: `src/utils/math.js`

## Propósito
Función matemática para normalizar valores al sistema de coordenadas del canvas del histograma.

## Dependencias

Sin dependencias internas.

## API Pública

### `export function normalizeY(val: number, min: number, max: number, height: number): number`

**Descripción:** Mapea un valor `val` dentro del rango `[min, max]` a una coordenada Y en píxeles dentro de la altura `height`, con un padding del 10% en cada extremo y ocupando el 80% central.

**Parámetros:**
| Nombre | Tipo | Descripción |
|--------|------|-------------|
| `val` | `number` | Valor a normalizar |
| `min` | `number` | Valor mínimo del rango |
| `max` | `number` | Valor máximo del rango |
| `height` | `number` | Altura total en píxeles |

**Retorno:** `number` — coordenada Y (0 = arriba)

**Mutates state:** No

**Async:** No

## Comportamiento

1. Calcula `norm = (val - min) / (max - min)`
2. `result = height - (norm * height * 0.8) - (height * 0.1)`
3. `min` y `max` no se validan; si `min === max`, división por cero produce Infinity/NaN

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `val = min` | Retorna `height * 0.9` (abajo con padding) |
| `val = max` | Retorna `height * 0.1` (arriba con padding) |
| `val` fuera de rango | Coordenada fuera del rango [0.1*height, 0.9*height] |
| `min === max` | División por cero → NaN |

## Escenarios de test

1. **Valor mínimo:** `normalizeY(0, 0, 100, 200)` = 180
2. **Valor máximo:** `normalizeY(100, 0, 100, 200)` = 20
3. **Valor intermedio:** `normalizeY(50, 0, 100, 200)` = 100
4. **Valor fuera de rango (por debajo):** `normalizeY(-50, 0, 100, 200)` = 260
5. **Valor fuera de rango (por encima):** `normalizeY(150, 0, 100, 200)` = -60

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
