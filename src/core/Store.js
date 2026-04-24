const getDPR = () => {
    return Math.min(window.devicePixelRatio || 1, 2);
};

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
    // Layout and Config
    pixelsPerHour: window.innerWidth < 600 ? 50 : 60,
    chartHeight: 250,
    minimapHeight: 80,
    tileWidth: 1024,
    pixelsPerMm: 10
};

// Event bus
const listeners = {};

export function on(event, callback) {
    if (!listeners[event]) {
        listeners[event] = [];
    }
    listeners[event].push(callback);
}

export function emit(event, data) {
    if (listeners[event]) {
        listeners[event].forEach(cb => cb(data));
    }
}

export function updateState(newState) {
    Object.assign(state, newState);
    emit('stateChange', state);
}
