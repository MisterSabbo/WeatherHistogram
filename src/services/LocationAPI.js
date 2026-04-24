import { state, updateState } from '../core/Store.js';
import { fetchWeatherData } from './WeatherAPI.js';

export async function fetchSuggestions(query) {
    try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=es&format=json`);
        const data = await res.json();
        return data.results || [];
    } catch (err) {
        console.error("Error fetching suggestions", err);
        return [];
    }
}

function getPosition() {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error("Timeout obteniendo ubicación"));
        }, 8000);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                clearTimeout(timeout);
                resolve(pos);
            },
            (err) => {
                clearTimeout(timeout);
                reject(err);
            },
            { timeout: 7000, enableHighAccuracy: false }
        );
    });
}

export async function useMyLocation(force = false, callbacks = {}) {
    if (!force) {
        const savedLocation = localStorage.getItem('last_weather_location');
        if (savedLocation) {
            try {
                const loc = JSON.parse(savedLocation);
                updateState({
                    lat: loc.lat,
                    lon: loc.lon,
                    locationName: loc.name
                });
                if (callbacks.onLocationFound) callbacks.onLocationFound();
                await fetchWeatherData(7, 7);
                return;
            } catch (e) {
                localStorage.removeItem('last_weather_location');
            }
        }
    }

    if (callbacks.onFetchingLocation) callbacks.onFetchingLocation();

    try {
        const pos = await getPosition();
        updateState({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude
        });

        // Reverse geocoding
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${state.lat}&lon=${state.lon}&format=json`);
            const data = await res.json();
            updateState({
                locationName: data.address.city || data.address.town || data.address.village || data.address.county || "Ubicación actual"
            });
        } catch (e) {
            updateState({ locationName: "Ubicación actual" });
        }
    } catch (err) {
        console.warn("Geolocation failed, using default", err);
        updateState({
            lat: 40.4167, // Madrid default
            lon: -3.70325,
            locationName: "Madrid"
        });
        if (err.code === 1) {
            console.warn("Permiso de ubicación denegado.");
        }
    }
    
    if (callbacks.onLocationFound) callbacks.onLocationFound();
    await fetchWeatherData(7, 7);
}
