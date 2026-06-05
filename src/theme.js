import { state } from './store.js';

export function getThemeColor(path, fallbackColor) {
    if (!state.themeConfig || !state.themeConfig.colors) return fallbackColor;
    const parts = path.split('.');
    let val = state.themeConfig.colors;
    for (const p of parts) {
        if (val && val[p]) val = val[p];
        else return fallbackColor;
    }
    return typeof val === 'string' ? val : fallbackColor;
}

export function getThemeIcon(path, fallbackIcon) {
    if (!state.themeConfig || !state.themeConfig.icons) return fallbackIcon;
    const parts = path.split('.');
    let val = state.themeConfig.icons;
    for (const p of parts) {
        if (val && val[p]) val = val[p];
        else return fallbackIcon;
    }
    return typeof val === 'string' ? val : fallbackIcon;
}

export function getThemeFont(size = '') {
    const font = (state.themeConfig && state.themeConfig.font) ? state.themeConfig.font : 'Inter, sans-serif';
    return size ? `${size} ${font}` : font;
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
    } catch {
        console.warn(`Theme not found at ${primaryPath}, trying ${fallbackPath}...`);
        try {
            state.themeConfig = await doFetch(fallbackPath);
        } catch(e2) {
            console.error('Theme loading failed completely:', e2);
            state.themeConfig = { "font": "Inter, sans-serif", "icons": { "scrubber": { "temp": "device_thermostat", "wind": "air", "precip": "rainy", "prob": "water_drop", "cloud": "cloud" }, "header": { "aqi": "air", "allergen": "eco", "precip": "rainy", "prob": "water_drop", "cloud": "cloud" }, "zeroLine": "ac_unit", "windDirection": "navigation" }, "colors": { "tempLine": "#D94040", "precipBar": "rgba(30, 130, 190, 0.45)", "precipProbArea": "rgba(30, 144, 200, 0.12)", "cloudsArea": "rgba(115, 132, 148, 0.25)", "uvLevels": { "low": "#4CAF50", "moderate": "#FBC02D", "high": "#F57C00", "veryHigh": "#D94040", "extreme": "#8E44AD" }, "wind": { "normalLight": "#6B8DAD", "normalDark": "#A8C4D8", "cold": "#4A9FD9", "hot": "#E8734A", "strongDefaultLight": "#E8734A", "strongDefaultDark": "#E8734A" }, "gusts": { "normal": "#6B8DAD", "strong": "#E8734A", "extreme": "#D94040" }, "zeroLine": "rgba(30, 144, 200, 0.70)", "zeroLineIcon": "#1E82BE", "referenceLine": "rgba(255, 255, 255, 0.3)", "scrubber": { "bgLightMix": 0.85, "bgOpacity": 0.75 } } };
        }
    }
    applyThemeDOM();
}

export function applyThemeDOM() {
    document.body.style.fontFamily = getThemeFont();
    const metaTheme = /** @type {HTMLMetaElement} */ (document.querySelector('meta[name="theme-color"]'));
    if (metaTheme) {
        const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg-color').trim();
        metaTheme.content = bg || '#2B2D31';
    }
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
