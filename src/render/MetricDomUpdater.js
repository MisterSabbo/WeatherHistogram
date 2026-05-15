import { getThemeIcon } from '../theme.js';
import { getAQIInfo, getPollenText } from '../services/AqiManager.js';
import { drawAQIRadar } from '../ui/AqiRadar.js';
import { drawPollenRadar } from '../ui/PollenRadar.js';
import { t } from '../utils/i18n.js';

export function updateMetricDOMs(currentData) {
    document.getElementById('val-temp').innerHTML = `${Math.round(currentData.temp)}<span class="data-unit">°C</span>`;
    document.getElementById('val-apparent').innerHTML = `<span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle; margin-right: 2px;">emoji_people</span><span style="vertical-align: middle;">${Math.round(currentData.apparent)}°C</span>`;

    const windVal = document.getElementById('val-wind');
    if (windVal) windVal.innerHTML = `${currentData.wind}<span class="data-unit">km/h</span>`;

    const arrow = document.getElementById('wind-arrow');
    if (arrow) {
        arrow.style.transform = `rotate(${currentData.windDir + 180}deg)`;
        let windColor = 'var(--text-primary)';
        const t = parseFloat(currentData.temp);
        if (t < 10) windColor = '#3b82f6';
        else if (t > 28) windColor = '#ef4444';
        arrow.style.background = windColor;
        arrow.firstElementChild.style.borderBottomColor = windColor;
        document.getElementById('wind-compass').style.borderColor = windColor;
    }

    const aqiInfo = getAQIInfo(currentData.aqi);
    document.querySelector('#val-aqi .aqi-text').innerText = aqiInfo.text;
    const headerAqiIcon = document.getElementById('header-aqi-icon');
    if (headerAqiIcon) {
        if (currentData.aqi === null || currentData.aqi <= 50) headerAqiIcon.style.color = '#22c55e';
        else if (currentData.aqi <= 100) headerAqiIcon.style.color = '#eab308';
        else if (currentData.aqi <= 150) headerAqiIcon.style.color = '#f97316';
        else if (currentData.aqi <= 200) headerAqiIcon.style.color = '#ef4444';
        else if (currentData.aqi <= 300) headerAqiIcon.style.color = '#9333ea';
        else headerAqiIcon.style.color = '#831843';
    }

    const aqiHeader = document.getElementById('aqi-header-info');
    const aqiModalHeader = document.getElementById('aqi-modal-header-info');
    const aqiHtml = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid rgba(128,128,128,0.2); padding-bottom:5px;">
                <span style="font-weight:bold;">${t('aqi.title')}</span>
                <span style="background:var(--accent-temp); color:white; padding:2px 6px; border-radius:4px; font-size:0.7rem;">${aqiInfo.val}</span>
            </div>
            <div style="font-weight:bold; color:var(--accent-temp); margin-bottom:4px; text-align:center;">${aqiInfo.text}</div>
            <div style="font-size:0.7rem; line-height:1.4; opacity:0.9; text-align:center;">${aqiInfo.rec}</div>
        `;
    if (aqiHeader) aqiHeader.innerHTML = aqiHtml;
    if (aqiModalHeader) aqiModalHeader.innerHTML = aqiHtml;

    const aqiRadar = document.getElementById('aqi-radar');
    if (aqiRadar) aqiRadar.style.display = 'block';
    const aqiModalRadar = document.getElementById('aqi-modal-radar');
    if (aqiModalRadar) aqiModalRadar.style.display = 'block';

    const pollenText = getPollenText(currentData.pollen);
    document.querySelector('#val-pollen .pollen-text').innerText = pollenText;
    const headerPollenIcon = document.getElementById('header-pollen-icon');
    if (headerPollenIcon) {
        if (currentData.pollen <= 10) headerPollenIcon.style.color = 'var(--text-secondary)';
        else if (currentData.pollen <= 50) headerPollenIcon.style.color = '#fbbf24';
        else if (currentData.pollen <= 100) headerPollenIcon.style.color = '#ef4444';
        else headerPollenIcon.style.color = '#9333ea';
    }

    requestAnimationFrame(() => {
        drawAQIRadar(currentData, 'aqi-radar', 'aqi-details');
        drawAQIRadar(currentData, 'aqi-modal-radar', 'aqi-modal-details');
        drawPollenRadar(currentData, 'pollen-radar', 'pollen-details');
        drawPollenRadar(currentData, 'pollen-modal-radar', 'pollen-modal-details');
    });

    document.getElementById('val-precip').innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px; color: var(--text-secondary);">${getThemeIcon('header.precip', 'rainy')}</span> <span>${currentData.precip}<span class="data-unit">mm</span></span>`;
    document.getElementById('val-precip-prob').innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px; color: var(--text-secondary);">${getThemeIcon('header.prob', 'water_drop')}</span> <span>${currentData.precipProb}<span class="data-unit">%</span></span>`;
    document.getElementById('val-clouds').innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px; color: var(--text-secondary);">${getThemeIcon('header.cloud', 'cloud')}</span> <span>${currentData.clouds}<span class="data-unit">%</span></span>`;
}
