import { CHART_HEIGHT, MINIMAP_HEIGHT, DEFAULT_COORDS, CACHE_DURATION, TILE_WIDTH, PIXELS_PER_MM, PIXELS_PER_HOUR_DESKTOP, PIXELS_PER_HOUR_MOBILE, MOBILE_BREAKPOINT } from './constants/index.js';

export { CHART_HEIGHT, MINIMAP_HEIGHT, DEFAULT_COORDS, CACHE_DURATION, TILE_WIDTH, PIXELS_PER_MM, PIXELS_PER_HOUR_DESKTOP, PIXELS_PER_HOUR_MOBILE, MOBILE_BREAKPOINT };

export const CONFIG = {
    CHART_HEIGHT,
    MINIMAP_HEIGHT,
    DEFAULT_COORDS,
    CACHE_DURATION,
    TILE_WIDTH,
    PIXELS_PER_MM
};

export const getDPR = () => Math.min(window.devicePixelRatio || 1, 2);

export const state = {
    lat: null,
    lon: null,
    locationName: "Cargando...",
    hourlyData: [],
    dailyData: [],
    sunData: {},
    hoverX: null,
    isFetching: false,
    dpr: getDPR(),
    theme: 'dark',
    timezone: 'UTC',
    rawForecast: null,
    rawAQI: null,
    isDragging: false,
    startX: 0,
    scrollLeft: 0,
    activeChartTheme: 'default',
    isDailyCardsView: false,
    themeConfig: null,
    PIXELS_PER_HOUR: window.innerWidth < MOBILE_BREAKPOINT ? PIXELS_PER_HOUR_MOBILE : PIXELS_PER_HOUR_DESKTOP,
    stickmanThresholds: {
        cold: 10,
        hot: 30,
        wind: 45,
        clouds: 60
    },
    skinType: 2
};
