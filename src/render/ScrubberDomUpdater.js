import { getThemeColor, getThemeIcon } from '../theme.js';
import { drawStickman } from './StickmanRenderer.js';
import { hexToRgb } from '../utils/hexToRgb.js';

/**
 * Actualiza todos los elementos DOM relacionados con el scrubber.
 * Se llama cada frame desde el renderizador del scrubber.
 */
export function updateScrubberDOM(currentData, apparent, isDark, haloColor, scrollLeft, PIXELS_PER_HOUR, uv, uvColor, uvText, d1, index) {
    updateWeatherIcon(currentData, isDark, haloColor);
    updateStickman(currentData, scrollLeft, isDark, apparent);
    updateWarningIcons(currentData);
    updateUVBlock(uv, uvColor, uvText, d1, index, PIXELS_PER_HOUR);
}

function updateWeatherIcon(currentData, isDark, haloColor) {
    let summaryIconName = 'clear_day';
    if (currentData) {
        const code = currentData.weatherCode;
        if (code >= 1 && code <= 3) summaryIconName = 'cloud';
        else if (code === 45 || code === 48) summaryIconName = 'foggy';
        else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) summaryIconName = 'rainy';
        else if ((code >= 71 && code <= 77) || code === 85 || code === 86) summaryIconName = 'ac_unit';
        else if (code >= 95) summaryIconName = 'thunderstorm';
    }

    const summaryIconDOM = document.getElementById('summary-icon-dom');
    if (summaryIconDOM) {
        if (summaryIconDOM.innerText !== summaryIconName) {
            summaryIconDOM.innerText = summaryIconName;
        }
        summaryIconDOM.style.textShadow = `0 0 4px ${haloColor}, 0 0 6px ${haloColor}`;
        summaryIconDOM.style.color = isDark ? '#f8fafc' : '#1e293b';
    }
}

function updateStickman(currentData, scrollLeft, isDark, apparent) {
    const walkPhase = (scrollLeft % 80) / 80;
    let isWindy = false;
    if (currentData) isWindy = currentData.gusts >= (globalThis.state?.stickmanThresholds?.wind ?? 45);
    const isNight = currentData ? !!currentData.isNight : false;

    const stickmanCanvas = document.getElementById('stickman-canvas');
    if (stickmanCanvas) {
        const sCtx = stickmanCanvas.getContext('2d');
        sCtx.clearRect(0, 0, stickmanCanvas.width, stickmanCanvas.height);
        drawStickman(
            sCtx, 40, 80, walkPhase, apparent,
            currentData ? currentData.weatherCode : 0,
            isWindy, isDark, isNight,
            globalThis.state?.stickmanThresholds || { cold: 10, hot: 30, wind: 45, clouds: 60 },
            currentData ? currentData.precip : 0,
            currentData ? currentData.clouds : 0
        );
    }
}

function updateWarningIcons(currentData) {
    const aqiWarningIcon = document.getElementById('aqi-warning-icon');
    const pollenWarningIcon = document.getElementById('pollen-warning-icon');
    const spfInfoContainer = document.getElementById('spf-info-container');
    const spfValueText = document.getElementById('spf-value-text');

    if (currentData && aqiWarningIcon && pollenWarningIcon && spfInfoContainer && spfValueText) {
        if (currentData.pollen > 10) {
            pollenWarningIcon.style.display = 'block';
            pollenWarningIcon.style.color = currentData.pollen <= 50 ? '#fbbf24' : currentData.pollen <= 100 ? '#ef4444' : '#9333ea';
        } else {
            pollenWarningIcon.style.display = 'none';
        }

        if (currentData.aqi !== null && currentData.aqi >= 101) {
            aqiWarningIcon.style.display = 'block';
            aqiWarningIcon.style.color = currentData.aqi <= 150 ? '#f97316' : currentData.aqi <= 200 ? '#ef4444' : currentData.aqi <= 300 ? '#9333ea' : '#831843';
        } else {
            aqiWarningIcon.style.display = 'none';
        }

        const uv = currentData.uv || 0;
        if (uv >= 3) {
            spfInfoContainer.style.display = 'flex';
            spfValueText.innerText = uv >= 8 ? '50+' : uv >= 6 ? '50' : '30';
            spfInfoContainer.dataset.uv = uv;
        } else if (uv > 0 && (globalThis.state?.skinType ?? 2) <= 2) {
            spfInfoContainer.style.display = 'flex';
            spfValueText.innerText = '15';
            spfInfoContainer.dataset.uv = uv;
        } else {
            spfInfoContainer.style.display = 'none';
            spfInfoContainer.dataset.uv = uv;
        }

        const riskIconsRow = document.getElementById('risk-icons-row');
        if (riskIconsRow) {
            riskIconsRow.style.display = (pollenWarningIcon.style.display !== 'none' || aqiWarningIcon.style.display !== 'none') ? 'flex' : 'none';
        }

        let visibleIcons = 1;
        if (pollenWarningIcon.style.display !== 'none') visibleIcons++;
        if (aqiWarningIcon.style.display !== 'none') visibleIcons++;
        if (spfInfoContainer.style.display !== 'none') visibleIcons++;

        const animatedWeatherZone = document.getElementById('animated-weather-zone');
        if (animatedWeatherZone) {
            animatedWeatherZone.style.zIndex = visibleIcons > 2 ? '21' : '15';
        }
    }
}

function updateUVBlock(uv, uvColor, uvText, d1, index, PIXELS_PER_HOUR) {
    const uvBlockDOM = document.getElementById('uv-active-block');
    if (uv > 0 && !d1.isNight && uvBlockDOM) {
        const c = hexToRgb(uvColor);
        const bgR = Math.round(255 * 0.8 + c.r * 0.2);
        const bgG = Math.round(255 * 0.8 + c.g * 0.2);
        const bgB = Math.round(255 * 0.8 + c.b * 0.2);
        const opacityColor = `rgba(${bgR}, ${bgG}, ${bgB}, 0.95)`;

        let textColor = uvColor;
        if (uvColor === getThemeColor('uvLevels.moderate', '#fbc02d') || uvColor === '#fbc02d') {
            textColor = '#e65100';
        }

        const cellAbsX = index * PIXELS_PER_HOUR;
        uvBlockDOM.style.display = 'flex';
        uvBlockDOM.style.left = cellAbsX + 'px';
        uvBlockDOM.style.width = PIXELS_PER_HOUR + 'px';
        uvBlockDOM.style.backgroundColor = opacityColor;
        uvBlockDOM.style.color = textColor;
        uvBlockDOM.innerText = uvText;
    } else if (uvBlockDOM) {
        uvBlockDOM.style.display = 'none';
    }
}

