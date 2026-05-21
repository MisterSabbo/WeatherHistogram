# Spec: `src/ui/DailyCards.js`

## Propósito
Genera y actualiza las tarjetas de pronóstico diario debajo del minimap/daily view.

## Dependencias

### state
| Propiedad | Acceso | Contexto |
|-----------|--------|----------|
| `state.dailyData` | read | generateDailyCards |
| `state.hourlyData` | read | updateActiveDailyCard |
| `state.PIXELS_PER_HOUR` | read | scroll calculations |
| `state.timezone` | read | formato fechas |

### Módulos internos
| Módulo | Export usado | Para qué |
|--------|-------------|----------|
| `../store.js` | `state`, `CONFIG` | acceso |
| `../theme.js` | `getThemeIcon` | iconos |
| `../utils/i18n.js` | `getLocale` | locale |

## API Pública

### `export function getWeatherIconSVG(code: number): string`

**Descripción:** Convierte código WMO a HTML de icono SVG.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `code` | `number` | Código meteorológico WMO (0-99) |

**Metadatos:**
- Mutates state: No
- Async: No

### `export function generateDailyCards(centerOnCurrentTimeCallback: Function): void`

**Descripción:** Genera tarjetas de pronóstico diario desde `state.dailyData`.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `centerOnCurrentTimeCallback` | `Function` | Callback para centrar scroll en hora actual |

**Metadatos:**
- Mutates state: Sí (modifica DOM de cards container)
- Async: No

### `export function updateActiveDailyCard(): void`

**Descripción:** Marca el día activo según posición de scroll.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| — | — | Sin parámetros (usa `state` directamente) |

**Metadatos:**
- Mutates state: Sí (modifica clases CSS en DOM)
- Async: No

## Comportamiento

1. `generateDailyCards`: crea cards con día, fecha, icono, temp max/min
2. Card click: scroll a mediodía de ese día (hora 12), smooth si hoy
3. Días pasados: clase 'past-day' + icono history
4. `updateActiveDailyCard`: usa scrollLeft + 60 para determinar día activo, setea `--arrow-pos` según progreso del día
5. Scroll automático de cards container si el día activo está fuera de vista

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `state.dailyData` vacío | No genera ninguna card, no lanza error |
| `state.hourlyData` vacío | `updateActiveDailyCard` retorna sin cambios |
| Container DOM no existe | No lanza error |
| `centerOnCurrentTimeCallback` no es función | No lanza error, ignora callback |
| `getWeatherIconSVG(-1)` (código inválido) | Retorna icono por defecto `clear_day` |
| Día fuera del rango visible | Scroll automático del container si el día activo está fuera de vista |

## Escenarios de test

1. **Se inicializa sin errores con elementos DOM presentes:** `generateDailyCards` con DOM presente, no lanza error
2. **No lanza si faltan elementos DOM en el documento:** Container DOM ausente, no lanza error
3. **Exporta las funciones esperadas:** `getWeatherIconSVG`, `generateDailyCards`, `updateActiveDailyCard` son funciones
4. **Icono SVG por código WMO:** `getWeatherIconSVG(0)` retorna SVG de soleado
5. **Datos diarios vacíos:** `state.dailyData = []`, no genera ninguna card
6. **Click en card:** Scroll a mediodía del día seleccionado

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
