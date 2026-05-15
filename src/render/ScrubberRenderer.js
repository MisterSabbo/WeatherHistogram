import { state, getDPR } from '../store.js';
import { getThemeColor, getThemeFont, getThemeIcon } from '../theme.js';
import { normalizeY } from '../utils/math.js';
import { PIXELS_PER_HOUR_DESKTOP, PIXELS_PER_HOUR_MOBILE, MOBILE_BREAKPOINT, PIXELS_PER_MM } from '../constants/index.js';
import { drawScrubberPoint } from './ScrubberCanvas.js';
import { updateScrubberDOM } from './ScrubberDomUpdater.js';

function getPixelsPerHour() {
    return window.innerWidth < MOBILE_BREAKPOINT ? PIXELS_PER_HOUR_MOBILE : PIXELS_PER_HOUR_DESKTOP;
}

/**
 * Dibuja el scrubber vertical completo (canvas + DOM).
 * Reemplaza la función drawFixedOverlay original.
 */
export function drawScrubber(fixedOverlayCanvas, fixedOverlayCtx, scrollContainer) {
    if (!state.hourlyData.length || !fixedOverlayCtx || !fixedOverlayCanvas) return;

    const PIXELS_PER_HOUR = getPixelsPerHour();
    const h = scrollContainer.clientHeight;
    const w = fixedOverlayCanvas.clientWidth;

    fixedOverlayCtx.clearRect(0, 0, fixedOverlayCanvas.clientWidth, fixedOverlayCanvas.clientHeight);

    const activeX = scrollContainer.scrollLeft + 60;
    const drawX = 60;

    const y0 = normalizeY(0, -20, 40, h);

    const animatedWeatherZone = document.getElementById('animated-weather-zone');
    if (animatedWeatherZone) {
        animatedWeatherZone.style.top = Math.max(0, y0) + 'px';
    }

    fixedOverlayCtx.save();
    const isDark = state.theme === 'dark';
    const haloColor = isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)';

    fixedOverlayCtx.strokeStyle = getThemeColor('zeroLine', 'rgba(2, 136, 209, 0.4)');
    fixedOverlayCtx.setLineDash([2, 2]);
    fixedOverlayCtx.lineWidth = 1;
    fixedOverlayCtx.beginPath();
    fixedOverlayCtx.moveTo(0, y0);
    fixedOverlayCtx.lineTo(60, y0);
    fixedOverlayCtx.stroke();
    fixedOverlayCtx.setLineDash([]);

    fixedOverlayCtx.font = `bold 10px ${getThemeFont()}`;
    fixedOverlayCtx.textAlign = 'left';
    fixedOverlayCtx.textBaseline = 'middle';
    fixedOverlayCtx.shadowColor = haloColor;
    fixedOverlayCtx.shadowBlur = 4;
    fixedOverlayCtx.lineWidth = 3;
    fixedOverlayCtx.strokeStyle = haloColor;
    fixedOverlayCtx.strokeText('0°C', 20, y0 - 8);
    fixedOverlayCtx.shadowBlur = 0;
    fixedOverlayCtx.fillStyle = getThemeColor('zeroLineIcon', 'rgba(2, 136, 209, 0.8)');
    fixedOverlayCtx.fillText('0°C', 20, y0 - 8);

    fixedOverlayCtx.font = '12px "Material Symbols Outlined"';
    fixedOverlayCtx.shadowColor = haloColor;
    fixedOverlayCtx.shadowBlur = 4;
    fixedOverlayCtx.strokeText(getThemeIcon('zeroLineIcon', 'ac_unit'), 4, y0 - 8);
    fixedOverlayCtx.shadowBlur = 0;
    fixedOverlayCtx.fillStyle = getThemeColor('zeroLineIcon', 'rgba(2, 136, 209, 0.8)');
    fixedOverlayCtx.fillText(getThemeIcon('zeroLineIcon', 'ac_unit'), 4, y0 - 8);
    fixedOverlayCtx.restore();

    const floatIndex = activeX / PIXELS_PER_HOUR;
    const index = Math.floor(floatIndex);
    const progress = floatIndex - index;

    if (index < 0 || index >= state.hourlyData.length - 1) {
        const uvBlockDOM = document.getElementById('uv-active-block');
        if (uvBlockDOM) uvBlockDOM.style.display = 'none';
        return;
    }

    const d1 = state.hourlyData[index];
    const d2 = state.hourlyData[index + 1];
    const currentData = state.hourlyData[index];

    const interpolate = (v1, v2) => v1 + (v2 - v1) * progress;

    let tBezier = 0.5, minT = 0, maxT = 1;
    for (let i = 0; i < 10; i++) {
        let bx = 1.5 * tBezier - 1.5 * tBezier * tBezier + tBezier * tBezier * tBezier;
        if (bx < progress) minT = tBezier; else maxT = tBezier;
        tBezier = (minT + maxT) / 2;
    }
    const ty = tBezier * tBezier * (3 - 2 * tBezier);
    const interpolateBezier = (v1, v2) => v1 + (v2 - v1) * ty;

    const temp = interpolate(d1.temp, d2.temp);
    const apparent = interpolate(d1.apparent, d2.apparent);
    const clouds = interpolateBezier(d1.clouds, d2.clouds);
    const precipProb = interpolateBezier(d1.precipProb, d2.precipProb);

    const labelRects = [];

    if (d1.uv > 0 && !d1.isNight) {
        labelRects.push({
            x: index * PIXELS_PER_HOUR - scrollContainer.scrollLeft,
            y: 0, w: PIXELS_PER_HOUR, h: 22, isUV: true
        });
    }

    const nowBtn = document.getElementById('now-btn');
    if (nowBtn && nowBtn.style.display !== 'none') {
        const btnRect = nowBtn.getBoundingClientRect();
        const canvasRect = fixedOverlayCanvas.getBoundingClientRect();
        labelRects.push({
            x: btnRect.left - canvasRect.left,
            y: btnRect.top - canvasRect.top,
            w: btnRect.width, h: btnRect.height, isNowBtn: true
        });
    }

    fixedOverlayCtx.save();
    fixedOverlayCtx.setLineDash([]);
    fixedOverlayCtx.font = `bold 10px ${getThemeFont()}`;
    fixedOverlayCtx.textAlign = 'left';
    fixedOverlayCtx.textBaseline = 'middle';
    fixedOverlayCtx.strokeStyle = '#fff';
    fixedOverlayCtx.lineWidth = 1.5;

    // Temperature
    const diff = Math.abs(temp - apparent);
    const showApparent = diff >= 1.5;
    const tempColor = '#d32f2f';

    if (showApparent) {
        const isCold = apparent <= temp;
        const apparentColor = isCold ? '#0288d1' : '#f97316';
        drawScrubberPoint(fixedOverlayCtx, drawX, normalizeY(temp, -20, 40, h), tempColor,
            `${Math.round(temp)}°C`, '', 'circle', getThemeIcon('scrubber.temp', 'device_thermostat'),
            `${Math.round(apparent)}°C`, apparentColor, 'emoji_people', labelRects, h, w);
    } else {
        drawScrubberPoint(fixedOverlayCtx, drawX, normalizeY(temp, -20, 40, h), tempColor,
            `${Math.round(temp)}°C`, '', 'circle', getThemeIcon('scrubber.temp', 'device_thermostat'),
            null, null, null, labelRects, h, w);
    }

    // Wind Gusts
    if (currentData && currentData.gusts > 35) {
        let color = getThemeColor('gusts.normal', '#64748b');
        if (currentData.gusts >= state.stickmanThresholds.wind) {
            color = getThemeColor('gusts.strong', '#ea580c');
            if (currentData.gusts > 70) color = getThemeColor('gusts.extreme', '#dc2626');
        }
        drawScrubberPoint(fixedOverlayCtx, drawX, h - 35, color,
            currentData.gusts.toFixed(1), 'km/h', 'none', getThemeIcon('scrubber.gusts', 'air'),
            null, null, null, labelRects, h, w);
    }

    // Precipitation
    const pVal = d1.precip;
    if (pVal > 0.01) {
        const maxH = h * 0.9;
        let barH = pVal * PIXELS_PER_MM;
        const isBroken = barH > maxH;
        const isSnow = [71, 73, 75, 77, 85, 86].includes(d1.weatherCode);
        const isThunder = [95, 96, 99].includes(d1.weatherCode);
        let pColor = '#1976d2';
        if (isSnow) pColor = '#000000';
        else if (isThunder) pColor = '#5e35b1';
        drawScrubberPoint(fixedOverlayCtx, drawX, (h - Math.min(maxH, barH)) - 12, pColor,
            pVal.toFixed(1) + (isBroken ? ' (!)' : ''), ' mm', 'none', '',
            null, null, null, labelRects, h, w);
    }

    // Precipitation Probability
    const getProbY = (val) => h - (h * (val / 100));
    const py1 = getProbY(d1.precipProb);
    const py2 = getProbY(d2.precipProb);
    const t = progress;
    const probY = py1 * (1 - t) * (1 - t) * (1 + 2 * t) + py2 * t * t * (3 - 2 * t);
    const isSnowProb = [71, 73, 75, 77, 85, 86].includes(d1.weatherCode);
    const isThunderProb = [95, 96, 99].includes(d1.weatherCode);
    const probIcon = isSnowProb ? 'ac_unit' : isThunderProb ? 'bolt' : getThemeIcon('scrubber.prob', 'water_drop');
    let probColor = '#0288d1';
    if (isSnowProb) probColor = '#00bcd4';
    else if (isThunderProb) probColor = '#7e57c2';
    drawScrubberPoint(fixedOverlayCtx, drawX, probY, probColor,
        Math.round(precipProb), '%', 'diamond', probIcon,
        null, null, null, labelRects, h, w);

    // Clouds
    const cloudY = h - (h * (clouds / 100));
    drawScrubberPoint(fixedOverlayCtx, drawX, cloudY, '#475569',
        Math.round(clouds), '%', 'circle', getThemeIcon('scrubber.cloud', 'cloud'),
        null, null, null, labelRects, h, w);

    fixedOverlayCtx.restore();

    // UV Block
    const uv = d1.uv || 0;
    let uvColor = '#4caf50';
    let uvText = '';
    if (uv > 0 && !d1.isNight) {
        if (uv < 3) { uvColor = getThemeColor('uvLevels.low', '#4caf50'); uvText = 'UV Bajo'; }
        else if (uv < 6) { uvColor = getThemeColor('uvLevels.moderate', '#fbc02d'); uvText = 'UV Moderado'; }
        else if (uv < 8) { uvColor = getThemeColor('uvLevels.high', '#f57c00'); uvText = 'UV Alto'; }
        else if (uv < 11) { uvColor = getThemeColor('uvLevels.vhigh', '#d32f2f'); uvText = 'UV Muy Alto'; }
        else { uvColor = getThemeColor('uvLevels.extreme', '#7b1fa2'); uvText = 'UV Extremo'; }
    }

    // DOM updates
    updateScrubberDOM(currentData, apparent, isDark, haloColor,
        scrollContainer.scrollLeft, PIXELS_PER_HOUR, uv, uvColor, uvText, d1, index);
}
