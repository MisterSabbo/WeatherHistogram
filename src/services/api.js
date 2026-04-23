// src/services/api.js

export class WeatherAPI {
    constructor(cacheDuration = 5 * 60 * 1000) {
        this.cache = new Map();
        this.cacheDuration = cacheDuration;
    }

    async fetchWeather(lat, lon, timezone = 'UTC') {
        const cacheKey = `${lat},${lon},${timezone}`;
        const now = Date.now();
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (now - cached.timestamp < this.cacheDuration) {
                return cached.data;
            }
        }

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
            `&hourly=` +
            `temperature_2m,apparent_temperature,precipitation,precipitation_probability,weather_code,` +
            `cloud_cover,relative_humidity_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,is_day` +
            `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset` +
            `&timezone=${encodeURIComponent(timezone)}`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Error al obtener el clima de Open-Meteo');
            const data = await response.json();
            this.cache.set(cacheKey, { timestamp: now, data });
            return data;
        } catch (error) {
            console.error('WeatherAPI fetchWeather error:', error);
            throw error;
        }
    }

    async fetchAQI(lat, lon, timezone = 'UTC') {
        const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}` +
            `&hourly=european_aqi,european_aqi_pm2_5,alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen` +
            `&timezone=${encodeURIComponent(timezone)}`;

        try {
            const response = await fetch(url);
            if (!response.ok) return null; // Tratar como opcional
            return await response.json();
        } catch (error) {
            console.error('WeatherAPI fetchAQI error:', error);
            return null;
        }
    }

    async fetchLocationByCoords(lat, lon) {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=es`);
        if (!response.ok) throw new Error('Error en geocodificación inversa');
        const data = await response.json();
        return (data.address && (data.address.city || data.address.town || data.address.village)) || "Localización Desconocida";
    }

    async fetchLocationBySearch(query) {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=es&format=json`);
        if (!response.ok) throw new Error('Error en búsqueda de localización');
        const data = await response.json();
        if (!data.results || data.results.length === 0) throw new Error('No se encontraron resultados');
        const result = data.results[0];
        return {
            lat: result.latitude,
            lon: result.longitude,
            name: result.name,
            timezone: result.timezone || 'UTC'
        };
    }
}

export const weatherApiLayer = new WeatherAPI();
