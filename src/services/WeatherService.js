export class WeatherService {
    constructor(baseURLForecast, baseURLAQI) {
        this.baseURLForecast = baseURLForecast || 'https://api.open-meteo.com/v1/forecast';
        this.baseURLAQI = baseURLAQI || 'https://air-quality-api.open-meteo.com/v1/air-quality';
    }

    async getWeatherData(lat, lon, pastDays, forecastDays, signal) {
        const forecastUrl = `${this.baseURLForecast}?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,apparent_temperature,precipitation,precipitation_probability,cloudcover,wind_speed_10m,wind_gusts_10m,wind_direction_10m,weather_code,relative_humidity_2m,surface_pressure,uv_index,visibility&daily=sunrise,sunset,weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&past_days=${pastDays}&forecast_days=${forecastDays}&timeformat=unixtime`;
        const aqiUrl = `${this.baseURLAQI}?latitude=${lat}&longitude=${lon}&hourly=european_aqi,pm10,pm2_5,nitrogen_dioxide,ozone,alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen&timezone=auto&past_days=${pastDays}&forecast_days=${forecastDays}&timeformat=unixtime`;

        const [forecastRes, aqiRes] = await Promise.all([
            fetch(forecastUrl, { signal }),
            fetch(aqiUrl, { signal })
        ]);

        if (!forecastRes.ok || !aqiRes.ok) {
            throw new Error("API Response Error");
        }

        const forecastData = await forecastRes.json();
        const aqiData = await aqiRes.json();

        if (forecastData.error || aqiData.error) {
            throw new Error(forecastData.reason || aqiData.reason || "Weather API Error");
        }

        return { forecastData, aqiData };
    }
}

export const weatherService = new WeatherService();
