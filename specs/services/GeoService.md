# Spec: `src/services/GeoService.js`

## Propósito
Geocoding y reverse geocoding usando Open-Meteo y Nominatim. Incluye queue con rate limiting para reverse geocoding.

## Dependencias

Sin dependencias internas.

## API Pública

### `export class GeoService`

### `async searchLocation(query: string, count?: number): Promise<Array>`

**Descripción:** Busca ubicaciones por nombre usando Open-Meteo geocoding API.

### `async reverseGeocode(lat: number, lon: number): Promise<string>`

**Descripción:** Reverse geocode usando Nominatim con queue y rate limiting (2s entre llamadas).

### `export const geoService: GeoService` (singleton)

## Comportamiento

1. `searchLocation`: fetch a `geocoding-api.open-meteo.com/v1/search`
2. `reverseGeocode`: queue con rate limiting de 2 segundos
3. Solo mantiene la petición más reciente en la queue (descarta anteriores con reject)
4. `reverseGeocode` construye nombre desde `data.address` (city/town/village, county, state, country)
5. Si no hay address, retorna "Ubicación actual"

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| API no responde | Error propagado |
| Llamadas spameadas a reverseGeocode | Solo la última se procesa, anteriores se cancelan |
| address sin city/town/village | Usa county como primer componente |
| address vacío | Retorna "Ubicación actual" |
| query vacío | API puede retornar error |

## Escenarios de test

1. **searchLocation con query:** retorna array de resultados
2. **searchLocation error:** fetch falla → lanza error
3. **reverseGeocode:** retorna nombre construido
4. **Queue rate limiting:** espera 2s entre llamadas
5. **Queue cancellation:** llamada spameada cancela anterior
6. **Singleton:** geoService es instancia única

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
