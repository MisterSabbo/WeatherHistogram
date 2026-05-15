import { state } from '../store.js';
import { CACHE_DURATION, DEFAULT_COORDS } from '../constants/index.js';
import { t } from '../utils/i18n.js';
import { weatherService } from './WeatherService.js';
import { geoService } from './GeoService.js';
import { processData } from './DataProcessor.js';
import { generateMockData } from './MockData.js';
import { storageService } from './StorageService.js';

export function updateLocationUI() {
    document.getElementById('location-name').innerText = state.locationName;
    if (state.lat && state.lon) {
        storageService.set('lastLocation', {
            lat: state.lat,
            lon: state.lon,
            name: state.locationName
        });
    }
}

export function showError(msg) {
    const errDiv = document.getElementById('error-msg');
    errDiv.innerHTML = `
        <div style="margin-bottom: 15px;">${msg}</div>
        <button onclick="document.getElementById('overlay').classList.add('hidden')"
                style="background: #666; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
            Cerrar y ver app
        </button>
    `;
    errDiv.style.display = 'block';
    const loader = document.querySelector('.loader');
    if (loader) loader.style.display = 'none';
    const statusText = document.getElementById('status-text');
    if (statusText) statusText.style.display = 'none';
}

export function createWeatherLoader(deps) {
    const { weatherCache, centerOnCurrentTime, drawMinimap, render, handleResize } = deps;

    async function useMyLocation(force = false) {
        if (!force) {
            const loc = await storageService.get('lastLocation');
            const isDefault = loc && Math.abs(loc.lat - DEFAULT_COORDS.lat) < 0.001 && Math.abs(loc.lon - DEFAULT_COORDS.lon) < 0.001;
            if (loc && loc.lat && loc.lon && !isDefault) {
                state.lat = loc.lat;
                state.lon = loc.lon;
                state.locationName = loc.name || 'Ubicaci\u00f3n Guardada';
                updateLocationUI();
                await loadWeather();
                return;
            }
        }

        document.getElementById('overlay').classList.remove('hidden');
        document.getElementById('status-text').innerText = 'Obteniendo ubicaci\u00f3n...';
        try {
            const pos = await getPosition();
            state.lat = pos.coords.latitude;
            state.lon = pos.coords.longitude;
            try {
                state.locationName = await geoService.reverseGeocode(state.lat, state.lon);
            } catch (e) {
                state.locationName = 'Ubicaci\u00f3n actual';
            }
        } catch (err) {
            console.warn('Geolocation failed, using default', err);
            state.lat = DEFAULT_COORDS.lat;
            state.lon = DEFAULT_COORDS.lon;
            state.locationName = DEFAULT_COORDS.name;
            if (err.code === 1) {
                console.warn('Permiso de ubicaci\u00f3n denegado.');
            }
        }
        updateLocationUI();
        await loadWeather();
    }

    async function loadWeather() {
        const overlay = document.getElementById('overlay');
        const statusText = document.getElementById('status-text');
        const errorMsg = document.getElementById('error-msg');
        const loader = document.querySelector('.loader');

        overlay.classList.remove('hidden');
        statusText.innerText = t('overlay.loadingData');
        statusText.style.display = 'block';
        loader.style.display = 'block';
        errorMsg.style.display = 'none';

        try {
            state.hourlyData = [];
            await fetchWeatherData(7, 7);
            if (errorMsg.style.display !== 'block') {
                overlay.classList.add('hidden');
            } else {
                if (loader) loader.style.display = 'none';
            }
            centerOnCurrentTime();
            drawMinimap();
            render();
        } catch (err) {
            console.error('Error in loadWeather:', err);
            showError('Error inesperado al cargar los datos.');
        }
    }

    async function fetchWeatherData(pastDays, forecastDays) {
        const cacheKey = `${state.lat.toFixed(4)},${state.lon.toFixed(4)},${pastDays},${forecastDays}`;
        const now = Date.now();

        if (weatherCache.has(cacheKey)) {
            const cached = weatherCache.get(cacheKey);
            if (now - cached.timestamp < CACHE_DURATION) {
                console.log('Usando datos en cach\u00e9 para:', cacheKey);
                state.rawForecast = cached.forecastData;
                state.rawAQI = cached.aqiData;
                processData(cached.forecastData, cached.aqiData, centerOnCurrentTime);
                handleResize();
                return;
            }
        }

        if (state.isFetching) return;
        state.isFetching = true;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
            const { forecastData, aqiData } = await weatherService.getWeatherData(state.lat, state.lon, pastDays, forecastDays, controller.signal);
            clearTimeout(timeoutId);
            weatherCache.set(cacheKey, { timestamp: now, forecastData, aqiData });
            state.rawForecast = forecastData;
            state.rawAQI = aqiData;
            processData(forecastData, aqiData, centerOnCurrentTime);
            handleResize();
        } catch (err) {
            clearTimeout(timeoutId);
            console.error('fetchWeatherData error:', err);
            if (weatherCache.has(cacheKey)) {
                console.warn('API fall\u00f3, usando datos expirados de la cach\u00e9');
                const cached = weatherCache.get(cacheKey);
                state.rawForecast = cached.forecastData;
                state.rawAQI = cached.aqiData;
                if (!state.locationName.endsWith('*')) {
                    state.locationName += '*';
                    updateLocationUI();
                }
                processData(cached.forecastData, cached.aqiData, centerOnCurrentTime);
                handleResize();
            } else {
                console.warn('API fall\u00f3 y no hay cach\u00e9, generando datos simulados');
                const mock = generateMockData(pastDays, forecastDays);
                state.rawForecast = mock.forecastData;
                state.rawAQI = mock.aqiData;
                state.locationName = 'Ninguna';
                updateLocationUI();
                processData(mock.forecastData, mock.aqiData, centerOnCurrentTime);
                handleResize();
            }
        } finally {
            state.isFetching = false;
        }
    }

    function getPosition() {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Timeout obteniendo ubicaci\u00f3n'));
            }, 4000);
            navigator.geolocation.getCurrentPosition(
                (pos) => { clearTimeout(timeout); resolve(pos); },
                (err) => { clearTimeout(timeout); reject(err); },
                { timeout: 3500, enableHighAccuracy: false, maximumAge: 60000 }
            );
        });
    }

    return { loadWeather, useMyLocation, fetchWeatherData, getPosition };
}
