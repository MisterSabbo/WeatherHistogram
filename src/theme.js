import { state } from './store.js';

export function getThemeColor(path, fallbackColor) {
    if (!state.themeConfig || !state.themeConfig.colors) return fallbackColor;
    const parts = path.split('.');
    let val = state.themeConfig.colors;
    for (let p of parts) {
        if (val && val[p]) val = val[p];
        else return fallbackColor;
    }
    return typeof val === 'string' ? val : fallbackColor;
}

export function getThemeIcon(path, fallbackIcon) {
    if (!state.themeConfig || !state.themeConfig.icons) return fallbackIcon;
    const parts = path.split('.');
    let val = state.themeConfig.icons;
    for (let p of parts) {
        if (val && val[p]) val = val[p];
        else return fallbackIcon;
    }
    return typeof val === 'string' ? val : fallbackIcon;
}

export function getThemeFont() {
    return (state.themeConfig && state.themeConfig.font) ? state.themeConfig.font : 'Inter, sans-serif';
}

export async function loadChartTheme(themeId) {
    const primaryPath = `./themes/${themeId}.json`;
    const fallbackPath = `./public/themes/${themeId}.json`;

    async function doFetch(url) {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Not found');
        return await res.json();
    }

    try {
        state.themeConfig = await doFetch(primaryPath);
    } catch(e) {
        console.warn(`Theme not found at ${primaryPath}, trying ${fallbackPath}...`);
        try {
            state.themeConfig = await doFetch(fallbackPath);
        } catch(e2) {
            console.error('Theme loading failed completely:', e2);
            state.themeConfig = { "font": "Inter, sans-serif", "icons": { "scrubber": { "temp": "device_thermostat", "wind": "air", "precip": "rainy", "prob": "water_drop", "cloud": "cloud" }, "header": { "aqi": "air", "allergen": "eco", "precip": "rainy", "prob": "water_drop", "cloud": "cloud" }, "zeroLine": "ac_unit", "windDirection": "navigation" }, "colors": { "tempLine": "#d32f2f", "humidityLine": "rgba(0, 172, 193, 0.4)", "precipBar": "rgba(25, 118, 210, 0.4)", "precipProbArea": "rgba(2, 136, 209, 0.2)", "cloudsArea": "rgba(100, 116, 139, 0.2)", "uvLevels": { "low": "#4caf50", "moderate": "#fbc02d", "high": "#f57c00", "veryHigh": "#d32f2f", "extreme": "#7b1fa2" }, "wind": { "normalLight": "#64748b", "normalDark": "#cbd5e1", "cold": "#3b82f6", "hot": "#ef4444", "strongDefaultLight": "#dc2626", "strongDefaultDark": "#f87171" }, "gusts": { "normal": "#64748b", "strong": "#ea580c", "extreme": "#dc2626" }, "zeroLine": "rgba(2, 136, 209, 0.8)", "zeroLineIcon": "#0288d1", "referenceLine": "rgba(255, 255, 255, 0.3)", "scrubber": { "bgLightMix": 0.85, "bgOpacity": 0.75 } } };
        }
    }
    applyThemeDOM();
}

export function applyThemeDOM() {
    document.body.style.fontFamily = getThemeFont();
    const elPrecip = document.querySelector('#val-precip .material-symbols-outlined');
    if (elPrecip) elPrecip.textContent = getThemeIcon('header.precip', 'rainy');
    
    const elProb = document.querySelector('#val-precip-prob .material-symbols-outlined');
    if (elProb) elProb.textContent = getThemeIcon('header.prob', 'water_drop');
    
    const elCloud = document.querySelector('#val-clouds .material-symbols-outlined');
    if (elCloud) elCloud.textContent = getThemeIcon('header.cloud', 'cloud');
    
    const elAqi = document.querySelector('#val-aqi .material-symbols-outlined');
    if (elAqi) elAqi.textContent = getThemeIcon('header.aqi', 'air');
    
    const elPollen = document.querySelector('#val-pollen .material-symbols-outlined');
    if (elPollen) elPollen.textContent = getThemeIcon('header.allergen', 'eco');
}
