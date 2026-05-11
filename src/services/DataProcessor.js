import { state } from '../store.js';
import { getLocale } from '../utils/i18n.js';
import { generateDailyCards } from '../ui/DailyCards.js';

import { storageService } from './StorageService.js';

export function processData(forecastData, aqiData, centerOnCurrentTime) {
    if (!forecastData || !forecastData.hourly || !forecastData.hourly.time || !aqiData || !aqiData.hourly || !aqiData.hourly.time) {
        throw new Error("Datos de API incompletos o inválidos");
    }
    const hourly = forecastData.hourly;
    const daily = forecastData.daily;
    const aqiHourly = aqiData.hourly;

    // Validar zona horaria
    let tz = forecastData.timezone;
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: tz });
    } catch (e) {
        console.warn("Invalid timezone from API, falling back to UTC", tz);
        tz = 'UTC';
    }
    state.timezone = tz;

    if (daily && daily.time) {
        daily.time.forEach((t, i) => {
            // Use local date string to match hourly data lookup
            const dateObj = new Date(t * 1000);
            const dateStr = dateObj.toLocaleDateString('en-CA', { timeZone: state.timezone });
            state.sunData[dateStr] = {
                sunrise: daily.sunrise[i] * 1000,
                sunset: daily.sunset[i] * 1000
            };
        });

        state.dailyData = daily.time.map((t, i) => ({
            time: t * 1000,
            weatherCode: daily.weather_code ? daily.weather_code[i] : 0,
            tempMax: daily.temperature_2m_max ? daily.temperature_2m_max[i] : 0,
            tempMin: daily.temperature_2m_min ? daily.temperature_2m_min[i] : 0,
        }));
    }

    const hourFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: state.timezone });
    const dayFormatter = new Intl.DateTimeFormat(getLocale(), { weekday: 'long', timeZone: state.timezone });
    const shortDayFormatter = new Intl.DateTimeFormat(getLocale(), { weekday: 'short', timeZone: state.timezone });

    const newHourly = hourly.time.map((t, i) => {
        const timestamp = t * 1000;
        const dateObj = new Date(timestamp);

        // Usamos la fecha local de la ciudad para buscar datos de sol
        const dateStr = dateObj.toLocaleDateString('en-CA', { timeZone: state.timezone });
        const sun = state.sunData[dateStr];
        let isNight = false;
        
        if (hourly.is_day !== undefined && hourly.is_day[i] !== undefined) {
            isNight = hourly.is_day[i] === 0;
        } else if (sun) {
            // Consider it night if the hour is strictly before sunrise or strictly after sunset
            // We check the hour's midpoint to be safe
            const hourMidpoint = timestamp + 1800000; // +30 mins
            if (sun.sunrise > 0 && sun.sunset > 0) {
                isNight = hourMidpoint < sun.sunrise || hourMidpoint > sun.sunset;
            } else {
                // Polar regions rough fallback if no is_day and sunrise/set are missing or 0
                isNight = false; // Just fallback to false
            }
        }

        const pollen = {
            alder: (aqiHourly.alder_pollen && aqiHourly.alder_pollen[i]) || 0,
            birch: (aqiHourly.birch_pollen && aqiHourly.birch_pollen[i]) || 0,
            grass: (aqiHourly.grass_pollen && aqiHourly.grass_pollen[i]) || 0,
            mugwort: (aqiHourly.mugwort_pollen && aqiHourly.mugwort_pollen[i]) || 0,
            olive: (aqiHourly.olive_pollen && aqiHourly.olive_pollen[i]) || 0,
            ragweed: (aqiHourly.ragweed_pollen && aqiHourly.ragweed_pollen[i]) || 0
        };
        const maxPollen = Math.max(...Object.values(pollen));

        const aqiDetails = {
            pm10: aqiHourly.pm10 ? aqiHourly.pm10[i] : null,
            pm2_5: aqiHourly.pm2_5 ? aqiHourly.pm2_5[i] : null,
            ozone: aqiHourly.ozone ? aqiHourly.ozone[i] : null,
            nitrogen_dioxide: aqiHourly.nitrogen_dioxide ? aqiHourly.nitrogen_dioxide[i] : null,
        };

        return {
            time: timestamp,
            localHour: parseInt(hourFormatter.format(dateObj)),
            localDayName: dayFormatter.format(dateObj).toUpperCase(),
            localDayShort: shortDayFormatter.format(dateObj).substring(0, 3).toUpperCase(),
            temp: hourly.temperature_2m[i],
            apparent: hourly.apparent_temperature[i],
            precip: hourly.precipitation[i],
            precipProb: hourly.precipitation_probability ? hourly.precipitation_probability[i] : 0,
            clouds: hourly.cloudcover[i],
            wind: hourly.wind_speed_10m[i],
            windDir: hourly.wind_direction_10m ? hourly.wind_direction_10m[i] : 0,
            gusts: hourly.wind_gusts_10m ? hourly.wind_gusts_10m[i] : hourly.wind_speed_10m[i],
            humidity: hourly.relative_humidity_2m ? hourly.relative_humidity_2m[i] : 0,
            pressure: hourly.surface_pressure ? hourly.surface_pressure[i] : 1013,
            uv: hourly.uv_index ? hourly.uv_index[i] : 0,
            visibility: hourly.visibility ? hourly.visibility[i] : 10000,
            weatherCode: hourly.weather_code[i],
            aqi: aqiHourly.us_aqi ? aqiHourly.us_aqi[i] : null,
            aqiDetails: aqiDetails,
            pollen: maxPollen,
            pollenDetails: pollen,
            isNight: isNight
        };
    });

    state.hourlyData = newHourly.sort((a, b) => a.time - b.time);
    
    // Generate daily cards if the container exists
    generateDailyCards(centerOnCurrentTime);

    saveHistoryData(state);
}

async function saveHistoryData(state) {
    let locClean = state.locationName || '';
    if (locClean.endsWith('*')) locClean = locClean.slice(0, -1);
    if (!locClean || locClean === 'Ninguna' || locClean === 'Desconocido' || locClean === 'Unknown') return;
    
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: state.timezone });
    
    let history = await storageService.getHistory(locClean);
    let changed = false;
    
    const pastHourly = state.hourlyData.filter(h => {
        const dStr = new Date(h.time).toLocaleDateString('en-CA', { timeZone: state.timezone });
        return dStr < todayStr;
    });
    
    const pastDaily = state.dailyData.filter(d => {
        const dStr = new Date(d.time).toLocaleDateString('en-CA', { timeZone: state.timezone });
        return dStr < todayStr;
    });

    // Hashset for faster hourly lookup
    const hourlyTimes = new Set(history.hourly.map(h => h.time));
    pastHourly.forEach(h => {
        if (!hourlyTimes.has(h.time)) {
            history.hourly.push(h);
            hourlyTimes.add(h.time);
            changed = true;
        }
    });

    const dailyTimes = new Set(history.daily.map(d => new Date(d.time).toLocaleDateString('en-CA', { timeZone: state.timezone })));
    pastDaily.forEach(d => {
        const dStr = new Date(d.time).toLocaleDateString('en-CA', { timeZone: state.timezone });
        if (!dailyTimes.has(dStr)) {
            history.daily.push(d);
            dailyTimes.add(dStr);
            changed = true;
        }
    });

    if (changed) {
        const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
        history.daily = history.daily.filter(d => d.time >= oneYearAgo);
        history.hourly = history.hourly.filter(h => h.time >= oneYearAgo);
        
        await storageService.setHistory(locClean, history);
    }
}
