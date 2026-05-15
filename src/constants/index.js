/**
 * Constantes globales de la aplicación.
 * Centralizadas para evitar duplicación y magic numbers.
 */

export const TILE_WIDTH = 1440;          // 24h * 60px/hour
export const PIXELS_PER_MM = 10;         // Escala de precipitación
export const PIXELS_PER_HOUR_DESKTOP = 60;
export const PIXELS_PER_HOUR_MOBILE = 50;
export const MOBILE_BREAKPOINT = 600;    // px para detectar móvil
export const CHART_HEIGHT = 250;
export const MINIMAP_HEIGHT = 80;
export const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
export const DEFAULT_COORDS = { lat: 40.4167, lon: -3.70325, name: "Madrid" }; // Madrid
