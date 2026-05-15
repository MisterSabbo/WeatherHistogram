import { state } from '../store.js';
import { getWeatherDescription } from '../utils/weather.js';
import { generateAlerts, updateAlertsUI } from './AlertsGenerator.js';
import { updateTimeDisplay } from './TimeDisplayUpdater.js';
import { updateMetricDOMs } from './MetricDomUpdater.js';

let lastTopPanelData = {};

export function updateTopPanel(scrollContainer, PIXELS_PER_HOUR) {
    const referenceX = scrollContainer.scrollLeft + 60;
    const activeX = referenceX;

    const floatIndex = activeX / PIXELS_PER_HOUR;
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
        scrollLeft: Math.round(scrollContainer.scrollLeft / 2)
    };

    if (JSON.stringify(currentData) === JSON.stringify(lastTopPanelData)) return;
    lastTopPanelData = currentData;

    updateMetricDOMs(currentData);
    updateTimeDisplay(activeX, PIXELS_PER_HOUR);

    const { alerts, alertLevel } = generateAlerts(state.hourlyData, index);
    updateAlertsUI(alerts, alertLevel,
        document.getElementById('alerts-container'),
        document.getElementById('alerts-tooltip')
    );

    document.getElementById('weather-summary').innerText = getWeatherDescription(d.weatherCode);

    if (window.updateScrollIndicator) window.updateScrollIndicator();

    document.getElementById('tt-location').innerText = state.locationName;
    document.getElementById('tt-summary').innerText = getWeatherDescription(d.weatherCode);
}
