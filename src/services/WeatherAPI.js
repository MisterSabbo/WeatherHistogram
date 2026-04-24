import { state, updateState, emit } from '../core/Store.js';
import { generateMockData } from '../utils/weatherFormatters.js';

const CACHE_DURATION = 5 * 60 * 1000;
let weatherCache = new Map();

export async function fetchWeatherData(pastDays, forecastDays) {
    const cacheKey = `${state.lat.toFixed(4)},${state.lon.toFixed(4)},${pastDays},${forecastDays}`;
    const now = Date.now();

    if (weatherCache.has(cacheKey)) {
        const cached = weatherCache.get(cacheKey);
        if (now - cached.timestamp < CACHE_DURATION) {
            console.log("Usando datos en caché para:", cacheKey);
            updateState({
                rawForecast: cached.forecastData,
                rawAQI: cached.aqiData
            });
            emit('weatherDataReady', { forecastData: cached.forecastData, aqiData: cached.aqiData });
            return;
        }
    }

    if (state.isFetching) return;
    updateState({ isFetching: true });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
        const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${state.lat}&longitude=${state.lon}&hourly=temperature_2m,apparent_temperature,precipitation,precipitation_probability,cloudcover,wind_speed_10m,wind_gusts_10m,wind_direction_10m,weather_code,relative_humidity_2m,surface_pressure,uv_index,visibility&daily=sunrise,sunset,weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&past_days=${pastDays}&forecast_days=${forecastDays}&timeformat=unixtime`;
        const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${state.lat}&longitude=${state.lon}&hourly=european_aqi,pm10,pm2_5,nitrogen_dioxide,ozone,alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen&timezone=auto&past_days=${pastDays}&forecast_days=${forecastDays}&timeformat=unixtime`;

        const [forecastRes, aqiRes] = await Promise.all([
            fetch(forecastUrl, { signal: controller.signal }),
            fetch(aqiUrl, { signal: controller.signal })
        ]);

        clearTimeout(timeoutId);

        if (!forecastRes.ok || !aqiRes.ok) throw new Error("Error en la respuesta de la API");

        const forecastData = await forecastRes.json();
        const aqiData = await aqiRes.json();

        if (forecastData.error || aqiData.error) {
            throw new Error(forecastData.reason || aqiData.reason || "Error de API");
        }

        weatherCache.set(cacheKey, {
            timestamp: now,
            forecastData,
            aqiData
        });

        updateState({
            rawForecast: forecastData,
            rawAQI: aqiData
        });

        emit('weatherDataReady', { forecastData, aqiData });
    } catch (err) {
        clearTimeout(timeoutId);
        console.error("fetchWeatherData error:", err);

        if (weatherCache.has(cacheKey)) {
            console.warn("API falló, usando datos expirados de la caché");
            const cached = weatherCache.get(cacheKey);
            updateState({
                rawForecast: cached.forecastData,
                rawAQI: cached.aqiData,
                locationName: state.locationName.endsWith('*') ? state.locationName : state.locationName + '*'
            });
            emit('weatherDataReady', { forecastData: cached.forecastData, aqiData: cached.aqiData });
        } else {
            console.warn("API falló y no hay caché, generando datos simulados");
            const mock = generateMockData(pastDays, forecastDays);
            updateState({
                rawForecast: mock.forecastData,
                rawAQI: mock.aqiData,
                locationName: "Ninguna"
            });
            emit('weatherDataReady', { forecastData: mock.forecastData, aqiData: mock.aqiData });
        }
    } finally {
        updateState({ isFetching: false });
    }
}
