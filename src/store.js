export const CONFIG = {
    CHART_HEIGHT: 250,
    MINIMAP_HEIGHT: 80,
    DEFAULT_COORDS: { lat: 40.4167, lon: -3.70325, name: "Madrid" },
    CACHE_DURATION: 5 * 60 * 1000,
    TILE_WIDTH: 1024,
    PIXELS_PER_MM: 10
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
    activeChartTheme: localStorage.getItem('chart_theme') || 'default',
    themeConfig: null,
    PIXELS_PER_HOUR: window.innerWidth < 600 ? 50 : 60,
    stickmanThresholds: {
        cold: parseFloat(localStorage.getItem('weatherhist_stickmancold')) || 10,
        hot: parseFloat(localStorage.getItem('weatherhist_stickmanhot')) || 30,
        wind: parseFloat(localStorage.getItem('weatherhist_stickmanwind')) || 45
    }
};
