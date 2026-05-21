# Spec: `src/render/MetricsRenderer.js`

## Propósito
Barrel re-export para los renderers de métricas (humedad, viento, temperatura).

## Dependencias

### Módulos internos
| Módulo | Export usado | Para qué |
|--------|-------------|----------|
| `./metrics/HumidityRenderer.js` | `drawHumidity` | re-export |
| `./metrics/WindRenderer.js` | `drawWind` | re-export |
| `./metrics/TemperatureRenderer.js` | `drawTemperature` | re-export |

## API Pública

### `export { drawHumidity, drawWind, drawTemperature }`

**Descripción:** Barrel re-export de renderers de métricas.

**Metadatos:**
- Mutates state: No
- Async: No

## Comportamiento

1. Módulo barrel: re-exporta `drawHumidity`, `drawWind`, `drawTemperature` desde los módulos de metrics/.
2. No tiene lógica propia; todos los exports son delegados.

## Escenarios de test

1. **Exports correctos:** drawHumidity, drawWind, drawTemperature son funciones

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| Módulo importado sin llamar | No lanza error, exports son funciones |
| Cualquier export es `undefined` | Falla al intentar llamar (no controlado aquí) |

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
