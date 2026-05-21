# Spec: `src/utils/time.js`

## Propósito
Utilidades de conversión de tiempo a coordenadas del histograma y formateo de fechas.

## Dependencias

Sin dependencias internas.

## API Pública

### `export function dateToX(time: number, startTime: number, pixelsPerHour: number): number`

**Descripción:** Convierte un timestamp ms a coordenada X en píxeles.

### `export function getCurrentTimeX(startTime: number, pixelsPerHour: number): number`

**Descripción:** Coordenada X del momento actual.

### `export function formatHour(hour: number): string`

**Descripción:** Formatea hora (0-23) a string de 2 dígitos.

### `export function formatDay(date: Date, locale: string): string`

**Descripción:** Formatea fecha a "MON, 15 JAN" en mayúsculas.

### `export function getSplitIndex(startTime: number, maxIndex?: number): number`

**Descripción:** Índice de la hora actual en el array horario.

### `export function formatTooltipTime(date: Date, locale: string, timezone: string): { timeStr: string, dateStr: string, isToday: boolean }`

**Descripción:** Formatea fecha para tooltip con hora local y detección de "hoy".

## Comportamiento

1. `dateToX`: `((time - startTime) / 3600000) * pixelsPerHour`
2. `getSplitIndex`: floor de horas desde startTime, acotado a `[0, maxIndex]`
3. `formatHour`: padStart(2, '0')
4. `formatDay`: toLocaleString con weekday:'short', day:'numeric', month:'short' → toUpperCase
5. `formatTooltipTime`: `isToday` compara día/mes/año; usa `toLocaleTimeString` con timezone

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `startTime = 0` en `getSplitIndex` | Retorna 0 |
| `maxIndex = null` | No acota el resultado |
| `date` fuera de rango | `toLocaleTimeString` puede fallar; en navegadores modernos funciona |
| `hour = 0` | Retorna `'00'` |
| `hour = 23` | Retorna `'23'` |

## Escenarios de test

1. **dateToX:** 1 hora de diferencia → retorna pixelsPerHour
2. **getSplitIndex:** momento actual dentro del rango → índice correcto
3. **getSplitIndex con startTime=0:** retorna 0
4. **formatHour:** 5 → `'05'`, 12 → `'12'`
5. **formatDay:** formato correcto con locale
6. **formatTooltipTime:** estructura correcta del return

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
