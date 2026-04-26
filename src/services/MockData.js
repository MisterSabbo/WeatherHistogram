export function generateMockData(pastDays, forecastDays) {
    const mockForecast = {
        timezone: 'UTC',
        hourly: {
            time: [],
            temperature_2m: [],
            apparent_temperature: [],
            precipitation: [],
            precipitation_probability: [],
            cloudcover: [],
            wind_speed_10m: [],
            wind_gusts_10m: [],
            wind_direction_10m: [],
            weather_code: [],
            relative_humidity_2m: [],
            surface_pressure: [],
            uv_index: [],
            visibility: []
        },
        daily: {
            time: [],
            sunrise: [],
            sunset: [],
            weather_code: [],
            temperature_2m_max: [],
            temperature_2m_min: []
        }
    };

    const mockAQI = {
        hourly: {
            time: [],
            european_aqi: [],
            pm10: [],
            pm2_5: [],
            nitrogen_dioxide: [],
            ozone: [],
            alder_pollen: [],
            birch_pollen: [],
            grass_pollen: [],
            mugwort_pollen: [],
            olive_pollen: [],
            ragweed_pollen: []
        }
    };

    const nowSeconds = Math.floor(Date.now() / 1000);
    const startSeconds = nowSeconds - (pastDays * 86400);
    const totalHours = (pastDays + forecastDays) * 24;

    for (let i = 0; i < totalHours; i++) {
        const t = startSeconds + (i * 3600);
        mockForecast.hourly.time.push(t);
        mockAQI.hourly.time.push(t);
        mockForecast.hourly.temperature_2m.push(20 + Math.sin(i / 12 * Math.PI) * 10);
        mockForecast.hourly.apparent_temperature.push(20 + Math.sin(i / 12 * Math.PI) * 10);
        mockForecast.hourly.precipitation.push(Math.random() > 0.8 ? Math.random() * 5 : 0);
        mockForecast.hourly.precipitation_probability.push(Math.random() > 0.8 ? 50 : 0);
        mockForecast.hourly.cloudcover.push(Math.random() * 100);
        mockForecast.hourly.wind_speed_10m.push(Math.random() * 10);
        mockForecast.hourly.wind_gusts_10m.push(Math.random() * 15);
        mockForecast.hourly.wind_direction_10m.push(Math.random() * 360);
        mockForecast.hourly.weather_code.push(0);
        mockForecast.hourly.relative_humidity_2m.push(50);
        mockForecast.hourly.surface_pressure.push(1013);
        mockForecast.hourly.uv_index.push(0);
        mockForecast.hourly.visibility.push(10000);
        
        mockAQI.hourly.european_aqi.push(Math.random() * 50);
        mockAQI.hourly.pm10.push(0);
        mockAQI.hourly.pm2_5.push(0);
        mockAQI.hourly.nitrogen_dioxide.push(0);
        mockAQI.hourly.ozone.push(0);
        mockAQI.hourly.alder_pollen.push(0);
        mockAQI.hourly.birch_pollen.push(0);
        mockAQI.hourly.grass_pollen.push(0);
        mockAQI.hourly.mugwort_pollen.push(0);
        mockAQI.hourly.olive_pollen.push(0);
        mockAQI.hourly.ragweed_pollen.push(0);
    }
    
    // Generar daily simulado
    const startDay = new Date(startSeconds * 1000);
    startDay.setHours(0, 0, 0, 0); // Ajustar a medianoche local (simplificación)
    
    for (let i = 0; i < (pastDays + forecastDays); i++) {
        const d = new Date(startDay.getTime() + (i * 86400000));
        mockForecast.daily.time.push(Math.floor(d.getTime() / 1000));
        
        // Simular amanecer a las 6 AM, atardecer a las 6 PM
        const sunrise = new Date(d);
        sunrise.setHours(6, 0, 0, 0);
        mockForecast.daily.sunrise.push(Math.floor(sunrise.getTime() / 1000));
        
        const sunset = new Date(d);
        sunset.setHours(18, 0, 0, 0);
        mockForecast.daily.sunset.push(Math.floor(sunset.getTime() / 1000));
    }

    return { forecastData: mockForecast, aqiData: mockAQI };
}
