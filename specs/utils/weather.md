# Spec: `src/utils/weather.js`

## Propósito
Función simple que traduce códigos WMO a descripciones textuales del tiempo.

## Dependencias

### Módulos internos
| Módulo | Export usado | Para qué |
|--------|-------------|----------|
| `./i18n.js` | `t` | Traducir código WMO |

## API Pública

### `export function getWeatherDescription(code: number): string`

**Descripción:** Retorna la descripción textual para un código WMO de Open-Meteo.

**Parámetros:**
| Nombre | Tipo | Descripción |
|--------|------|-------------|
| `code` | `number` | Código WMO (0-99) |

**Retorno:** `string`

**Mutates state:** No

**Async:** No

## Comportamiento

1. Busca `t('weatherCodes.' + code)` 
2. Si no encuentra, retorna `t('weatherCodes.unknown')`

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `code = 0` | `t('weatherCodes.0')` → `'Despejado'` / `'Clear'` |
| `code = 999` (inexistente) | `t('weatherCodes.999')` → retorna `'weatherCodes.999'`, luego fallback a `t('weatherCodes.unknown')` |

## Escenarios de test

1. **Código conocido:** `getWeatherDescription(0)` retorna traducción de "Despejado"/"Clear"
2. **Código desconocido:** `getWeatherDescription(999)` retorna traducción de "Desconocido"/"Unknown"
3. **Código null/undefined:** `t('weatherCodes.' + null)` = `t('weatherCodes.null')` → fallback a unknown

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
