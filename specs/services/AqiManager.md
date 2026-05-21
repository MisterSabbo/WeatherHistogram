# Spec: `src/services/AqiManager.js`

## Propósito
Gestión de calidad del aire (AQI) y niveles de polen. Proporciona clasificación AQI, niveles de polen por especie y colores asociados.

## Dependencias

### Módulos internos
| Módulo | Export usado | Para qué |
|--------|-------------|----------|
| `../utils/i18n.js` | `t` | Textos de niveles AQI y polen |

## API Pública

### `export function getAQIInfo(aqi: number|null): { text: string, rec: string, val: number }`

**Descripción:** Clasifica un valor AQI en nivel 1-6 con texto y recomendación.

### `export function getPollenLevelByType(type: string, raw: number): number`

**Descripción:** Nivel 0-4 para un tipo de polen según umbrales específicos.

### `export function getAggregatedPollenLevel(pollenDetails: Object): number`

**Descripción:** Nivel máximo entre todos los tipos de polen.

### `export function getPollenColor(level: number): string`

**Descripción:** Color CSS para un nivel de polen.

### `export function getPollenText(val: number, pollenDetails: Object): string`

**Descripción:** Texto descriptivo del nivel de polen.

## Comportamiento

1. AQI: ≤50=1, ≤100=2, ≤150=3, ≤200=4, ≤300=5, >300=6
2. Pollen thresholds por especie definidos en `POLLEN_THRESHOLDS`
3. `getAggregatedPollenLevel`: máximo de todos los tipos
4. `getPollenText`: si hay `pollenDetails`, usa nivel agregado; si no, usa `val` con thresholds genéricos (10/50/100)

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `aqi = null` | `{ text: '--', rec: '' }` |
| `raw = null/undefined` | `getPollenLevelByType` retorna 0 |
| `pollenDetails = null` | `getAggregatedPollenLevel` retorna 0 |
| `type` inexistente en `POLLEN_THRESHOLDS` | Retorna 1 si raw > 0, si no 0 |

## Escenarios de test

1. **AQI bueno:** 30 → level 1, text "Buena"/"Good"
2. **AQI peligroso:** 350 → level 6, text "Peligrosa"/"Hazardous"
3. **AQI null:** retorna texto '--'
4. **Pollen level por especie:** alder=100 → entre 75 y 250 → level 3
5. **Pollen nivel agregado:** máximo entre especies
6. **Pollen color:** level 0 → secondary, level 4 → rojo
7. **Pollen text sin details:** val=20 → "Moderado"

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
