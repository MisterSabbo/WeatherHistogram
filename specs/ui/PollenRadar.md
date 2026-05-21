# Spec: `src/ui/PollenRadar.js`

## Propósito
Dibuja un radar de polen (gráfico radial hexagonal con 6 especies) en un canvas.

## Dependencias

### state
| Propiedad | Acceso | Contexto |
|-----------|--------|----------|
| `state.theme` | read | sombra |

### Módulos internos
| Módulo | Export usado | Para qué |
|--------|-------------|----------|
| `../store.js` | `state` | acceso |
| `../utils/i18n.js` | `t` | nombres de especies |

## API Pública

### `export function drawPollenRadar(data: Object, targetId?: string, detailsId?: string): void`

**Descripción:** Dibuja radar de polen hexagonal con 6 especies.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `data` | `Object` | Datos con `pollenDetails: { alder, birch, grass, mugwort, olive, ragweed }` |
| `targetId?` | `string` | ID del canvas (default `'pollen-radar'`) |
| `detailsId?` | `string` | ID del elemento de detalles (default `'pollen-details'`) |

**Metadatos:**
- Mutates state: No
- Async: No

## Comportamiento

1. 6 ejes hexagonales (alder, birch, grass, mugwort, olive, ragweed)
2. 3 hexágonos concéntricos de referencia
3. Área de datos amarilla semitransparente
4. Etiquetas con sombra, ajuste de Y para evitar solapamiento
5. Detalles en elemento HTML aparte

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `data = null` / `undefined` | No lanza error, retorna sin dibujar |
| `targetId` no existe en DOM | No lanza error, retorna sin dibujar |
| `pollenDetails` con valores 0 | Dibuja polígono en centro (todos normalizados a 0) |
| `pollenDetails` con valores negativos | Trata como 0, no lanza error |
| Canvas 2D context no disponible | No lanza error, retorna sin dibujar |
| Etiquetas solapadas | Ajuste de Y para evitar colisiones |

## Escenarios de test

1. **Se inicializa sin errores con datos válidos:** `drawPollenRadar` con datos mock, no lanza error
2. **No lanza con data = null/undefined:** Datos nulos, no lanza error
3. **Exporta las funciones esperadas:** `drawPollenRadar` es función
4. **Canvas no existe:** `targetId` no existe en DOM, retorna sin error
5. **Valores de polen a 0:** Polígono dibujado en centro
6. **Valores negativos:** Tratados como 0, no lanza error

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
