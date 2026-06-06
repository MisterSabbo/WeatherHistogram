import { state } from '../store.js';
import { CONFIG } from '../store.js';
import { weatherService } from '../services/WeatherService.js';
import { generateMockData } from '../services/MockData.js';
import { processData } from '../services/DataProcessor.js';

const weatherCache = new Map();
let activeController = null;

export function clearWeatherCache() {
  weatherCache.clear();
}

export async function fetchWeatherData(pastDays, forecastDays, {
  onResize,
  onUpdateLocationUI,
  onCenterOnCurrentTime
}) {
  const cacheKey = `${state.lat.toFixed(4)},${state.lon.toFixed(4)},${pastDays},${forecastDays}`;
  const now = Date.now();
  const CACHE_DURATION = CONFIG.CACHE_DURATION;

  if (weatherCache.has(cacheKey)) {
    const cached = weatherCache.get(cacheKey);
    if (now - cached.timestamp < CACHE_DURATION) {
      console.log("Usando datos en caché para:", cacheKey);
      state.rawForecast = cached.forecastData;
      state.rawAQI = cached.aqiData;
      await processData(cached.forecastData, cached.aqiData, onCenterOnCurrentTime);
      onResize();
      return;
    }
  }

  if (state.isFetching && activeController) {
    activeController.abort();
  }

  state.isFetching = true;

  const controller = new AbortController();
  activeController = controller;
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const { forecastData, aqiData } = await weatherService.getWeatherData(state.lat, state.lon, pastDays, forecastDays, controller.signal);

    clearTimeout(timeoutId);

    weatherCache.set(cacheKey, { timestamp: now, forecastData, aqiData });

    state.rawForecast = forecastData;
    state.rawAQI = aqiData;

    await processData(forecastData, aqiData, onCenterOnCurrentTime);
    onResize();
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError' && activeController !== controller) {
      return;
    }

    console.error("fetchWeatherData error:", err);

    if (weatherCache.has(cacheKey)) {
      console.warn("API falló, usando datos expirados de la caché");
      const cached = weatherCache.get(cacheKey);
      state.rawForecast = cached.forecastData;
      state.rawAQI = cached.aqiData;

      if (!state.locationName.endsWith('*')) {
        state.locationName += '*';
        onUpdateLocationUI();
      }

      await processData(cached.forecastData, cached.aqiData, onCenterOnCurrentTime);
      onResize();
    } else {
      console.warn("API falló y no hay caché, generando datos simulados");
      const mock = generateMockData(pastDays, forecastDays);
      state.rawForecast = mock.forecastData;
      state.rawAQI = mock.aqiData;

      state.locationName = "Ninguna";
      onUpdateLocationUI();

      await processData(mock.forecastData, mock.aqiData, onCenterOnCurrentTime);
      onResize();
    }
  } finally {
    if (activeController === controller) {
      state.isFetching = false;
      activeController = null;
    }
  }
}
