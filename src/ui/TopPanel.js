import { state } from '../core/Store.js';
import { getThemeIcon } from '../services/ThemeManager.js';
import { getAQIInfo, getPollenText, getWeatherDescription } from '../utils/weatherFormatters.js';

export class TopPanel {
    constructor(radarView) {
        this.radarView = radarView;
        this.scrollContainer = document.getElementById('scroll-container');
        this.lastTopPanelData = {};
    }

    update() {
        if (!state.hourlyData.length) return;

        const referenceX = this.scrollContainer.scrollLeft + 60;
        const activeX = referenceX;

        const floatIndex = activeX / state.pixelsPerHour;
        const index = Math.floor(floatIndex);
        const progress = floatIndex - index;

        let d;
        let interpolatedData = {};

        if (index >= 0 && index < state.hourlyData.length - 1) {
            const d1 = state.hourlyData[index];
            const d2 = state.hourlyData[index + 1];
            const interpolate = (v1, v2) => v1 + (v2 - v1) * progress;

            interpolatedData = {
                temp: interpolate(d1.temp, d2.temp).toFixed(1),
                apparent: interpolate(d1.apparent, d2.apparent).toFixed(1),
                wind: interpolate(d1.wind, d2.wind).toFixed(1),
                windDir: interpolate(d1.windDir, d2.windDir),
                clouds: Math.round(interpolate(d1.clouds, d2.clouds)),
                precip: interpolate(d1.precip, d2.precip).toFixed(1),
                precipProb: Math.round(interpolate(d1.precipProb, d2.precipProb)),
                aqi: d1.aqi,
                aqiDetails: d1.aqiDetails,
                pollen: d1.pollen,
                pollenDetails: d1.pollenDetails,
                weatherCode: d1.weatherCode
            };
            d = d1;
        } else {
            const safeIndex = Math.max(0, Math.min(state.hourlyData.length - 1, Math.round(floatIndex)));
            d = state.hourlyData[safeIndex];
            if (!d) return;
            interpolatedData = {
                temp: d.temp.toFixed(1),
                apparent: d.apparent.toFixed(1),
                wind: d.wind.toFixed(1),
                windDir: d.windDir,
                clouds: d.clouds,
                precip: d.precip.toFixed(1),
                precipProb: d.precipProb,
                aqi: d.aqi,
                aqiDetails: d.aqiDetails,
                pollen: d.pollen,
                pollenDetails: d.pollenDetails,
                weatherCode: d.weatherCode
            };
        }

        const currentData = {
            ...interpolatedData,
            scrollLeft: Math.round(this.scrollContainer.scrollLeft / 2)
        };

        if (JSON.stringify(currentData) === JSON.stringify(this.lastTopPanelData)) return;
        this.lastTopPanelData = currentData;

        this.updateUI(currentData, d);
    }

    updateUI(currentData, d) {
        document.getElementById('val-temp').innerHTML = `${currentData.temp}<span class="data-unit">°C</span>`;
        document.getElementById('val-apparent').innerText = `ST: ${currentData.apparent}°C`;

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
        const aqiTextEl = document.querySelector('#val-aqi .aqi-text');
        if (aqiTextEl) aqiTextEl.innerText = aqiInfo.text;
        
        const aqiHeader = document.getElementById('aqi-header-info');
        if (aqiHeader) {
            aqiHeader.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid rgba(128,128,128,0.2); padding-bottom:5px;">
                    <span style="font-weight:bold;">Calidad del Aire</span>
                    <span style="background:var(--accent-temp); color:white; padding:2px 6px; border-radius:4px; font-size:0.7rem;">${aqiInfo.val}</span>
                </div>
                <div style="font-weight:bold; color:var(--accent-temp); margin-bottom:4px; text-align:center;">${aqiInfo.text}</div>
                <div style="font-size:0.7rem; line-height:1.4; opacity:0.9; text-align:center;">${aqiInfo.rec}</div>
            `;
        }
        
        const pollenText = getPollenText(currentData.pollen);
        const pollenTextEl = document.querySelector('#val-pollen .pollen-text');
        if (pollenTextEl) pollenTextEl.innerText = pollenText;

        if (this.radarView) {
            requestAnimationFrame(() => {
                this.radarView.drawAQIRadar(currentData);
                this.radarView.drawPollenRadar(currentData);
            });
        }

        document.getElementById('val-precip').innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px; color: var(--text-secondary);">${getThemeIcon('header.precip', 'rainy')}</span> <span>${currentData.precip}<span class="data-unit">mm</span></span>`;
        document.getElementById('val-precip-prob').innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px; color: var(--text-secondary);">${getThemeIcon('header.prob', 'water_drop')}</span> <span>${currentData.precipProb}<span class="data-unit">%</span></span>`;
        document.getElementById('val-clouds').innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px; color: var(--text-secondary);">${getThemeIcon('header.cloud', 'cloud')}</span> <span>${currentData.clouds}<span class="data-unit">%</span></span>`;

        const startTime = state.hourlyData[0].time;
        const exactTime = startTime + ((this.scrollContainer.scrollLeft + 60) / state.pixelsPerHour) * 3600000;
        const date = new Date(exactTime);
        const today = new Date();
        const isToday = date.getDate() === today.getDate() &&
                        date.getMonth() === today.getMonth() &&
                        date.getFullYear() === today.getFullYear();

        const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: state.timezone });
        const dateStr = date.toLocaleString('es-ES', {
            weekday: 'short', day: 'numeric', month: 'short', timeZone: state.timezone
        }).toUpperCase();

        const timeDisplay = document.getElementById('current-time-display');
        if (timeDisplay) {
            timeDisplay.querySelector('.time-main').innerText = timeStr;
            timeDisplay.querySelector('.date-sub').innerText = isToday ? `HOY, ${dateStr}` : dateStr;
        }

        const summaryEl = document.getElementById('weather-summary');
        if (summaryEl) summaryEl.innerText = getWeatherDescription(d.weatherCode);
    }
}
