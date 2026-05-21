# Spec: `src/ui/AqiRadar.js`

## Propósito
Dibuja un radar de calidad del aire (gráfico radial con 4 contaminantes) en un canvas.

## Dependencias

### state
| Propiedad | Acceso | Contexto |
|-----------|--------|----------|
| `state.theme` | read | sombra de etiquetas |

### Módulos internos
| Módulo | Export usado | Para qué |
|--------|-------------|----------|
| `../store.js` | `state` | acceso |

## API Pública

### `export function drawAQIRadar(data, targetId?, detailsId?): void`

**Descripción:** Dibuja radar con PM10, PM2.5, O3, NO2.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `data` | `Object` | Datos con `aqiDetails: { pm10, pm2_5, ozone, nitrogen_dioxide }` |
| `targetId?` | `string` | ID del canvas donde dibujar (default `'aqi-radar'`) |
| `detailsId?` | `string` | ID del elemento de detalles (default `'aqi-details'`) |

**Metadatos:**
- Mutates state: No
- Async: No

## Comportamiento

1. 4 ejes en diamante/cuadrado
2. 3 círculos concéntricos de referencia
3. Área de datos roja semitransparente
4. Etiquetas con sombra según tema
5. Detalles en elemento HTML aparte

## Escenarios de test

1. **Canvas no existe:** no lanza error
2. **Sin aqiDetails:** retorna sin dibujar
3. **Cuatro ejes:** PM10, PM2.5, O3, NO2
4. **Área de datos:** polígono de valores normalizados

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `data = null` / `undefined` | No lanza error, retorna sin dibujar |
| `targetId` no existe en DOM | No lanza error, retorna sin dibujar |
| `aqiDetails` con valores 0 | Dibuja polígono en centro (todos normalizados a 0) |
| `aqiDetails` con valores negativos | Trata como 0, no lanza error |
| Canvas 2D context no disponible (`null`) | No lanza error, retorna sin dibujar |

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
