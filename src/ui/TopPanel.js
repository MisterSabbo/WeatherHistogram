import { state } from '../store.js';
import { getThemeIcon } from '../theme.js';
import { t, getLocale } from '../utils/i18n.js';
import { formatTooltipTime } from '../utils/time.js';
import { getWeatherDescription } from '../utils/weather.js';
import { getAQIInfo, getPollenText, getAggregatedPollenLevel } from '../services/AqiManager.js';
import { generateAlerts, renderAlerts } from '../utils/AlertEngine.js';
import { drawAQIRadar } from './AqiRadar.js';
import { drawPollenRadar } from './PollenRadar.js';

let lastTopPanelData = {};

export function updateTopPanel({ scrollContainer, PIXELS_PER_HOUR }) {
  const referenceX = scrollContainer.scrollLeft + 60;
  const activeX = referenceX;

  const floatIndex = activeX / PIXELS_PER_HOUR;
  const index = Math.floor(floatIndex);
  const progress = floatIndex - index;

  let d, interpolatedData;

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
    scrollLeft: Math.round(scrollContainer.scrollLeft / 2)
  };

  if (JSON.stringify(currentData) === JSON.stringify(lastTopPanelData)) return;
  lastTopPanelData = currentData;

  document.getElementById('val-temp').innerHTML = `${Math.round(currentData.temp)}<span class="data-unit">°C</span>`;
  document.getElementById('val-apparent').innerHTML = `<span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle; margin-right: 2px;">emoji_people</span><span style="vertical-align: middle;">${Math.round(currentData.apparent)}°C</span>`;

  const windVal = document.getElementById('val-wind');
  if (windVal) windVal.innerHTML = `${currentData.wind}<span class="data-unit">km/h</span>`;

  const arrow = document.getElementById('wind-arrow');
  if (arrow) {
    arrow.style.transform = `rotate(${currentData.windDir + 180}deg)`;
    let windColor = 'var(--text-primary)';
    const t2 = parseFloat(currentData.temp);
    if (t2 < 10) windColor = '#3b82f6';
    else if (t2 > 28) windColor = '#ef4444';
    arrow.style.background = windColor;
    /** @type {HTMLElement} */ (arrow.firstElementChild).style.borderBottomColor = windColor;
    document.getElementById('wind-compass').style.borderColor = windColor;
  }

  const aqiInfo = getAQIInfo(currentData.aqi);
  /** @type {HTMLElement} */ (document.querySelector('#val-aqi .aqi-text')).innerText = aqiInfo.text;
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

  const pollenText = getPollenText(currentData.pollen, currentData.pollenDetails);
  /** @type {HTMLElement} */ (document.querySelector('#val-pollen .pollen-text')).innerText = pollenText;
  const headerPollenIcon = document.getElementById('header-pollen-icon');
  if (headerPollenIcon) {
    const pLevel = getAggregatedPollenLevel(currentData.pollenDetails || {});
    if (pLevel === 0) headerPollenIcon.style.color = 'var(--text-secondary)';
    else if (pLevel <= 1) headerPollenIcon.style.color = '#a3e635';
    else if (pLevel <= 2) headerPollenIcon.style.color = '#fbbf24';
    else headerPollenIcon.style.color = '#ef4444';
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

  const startTime = state.hourlyData[0].time;
  const exactTime = startTime + (activeX / PIXELS_PER_HOUR) * 3600000;
  const date = new Date(exactTime);
  const { timeStr, dateStr, isToday } = formatTooltipTime(date, getLocale(), state.timezone);

  const timeDisplay = /** @type {HTMLElement} */ (document.getElementById('current-time-display'));
  /** @type {HTMLElement} */ (timeDisplay.querySelector('.time-main')).innerText = timeStr;
  /** @type {HTMLElement} */ (timeDisplay.querySelector('.date-sub')).innerText = isToday ? `${t('topPanel.today')}, ${dateStr}` : dateStr;

  const { alerts, alertLevel } = generateAlerts(state.hourlyData, index);
  renderAlerts(alerts, alertLevel);

  document.getElementById('weather-summary').innerText = getWeatherDescription(d.weatherCode);

  if (window.updateScrollIndicator) window.updateScrollIndicator();

  document.getElementById('tt-location').innerText = state.locationName;
  document.getElementById('tt-summary').innerText = getWeatherDescription(d.weatherCode);
}
