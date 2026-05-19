export const CONFIG = Object.freeze({
    CHART_HEIGHT: 250,
    MINIMAP_HEIGHT: 80,
    DEFAULT_COORDS: { lat: 40.4167, lon: -3.70325, name: "Madrid" },
    CACHE_DURATION: 5 * 60 * 1000,
    TILE_WIDTH: 1440,
    PIXELS_PER_MM: 10
});

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
    PIXELS_PER_HOUR: window.innerWidth < 600 ? 50 : 60,
    stickmanThresholds: {
        cold: 10,
        hot: 30,
        wind: 45,
        clouds: 60
    },
    skinType: 2
};
