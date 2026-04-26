export class GeoService {
    constructor() {
        this.baseSearchURL = 'https://geocoding-api.open-meteo.com/v1/search';
        this.baseReverseURL = 'https://nominatim.openstreetmap.org/reverse';
    }

    async searchLocation(query, count = 1) {
        const res = await fetch(`${this.baseSearchURL}?name=${encodeURIComponent(query)}&count=${count}&language=es&format=json`);
        if (!res.ok) throw new Error("Error fetching location data");
        const data = await res.json();
        return data.results || [];
    }

    async reverseGeocode(lat, lon) {
        const res = await fetch(`${this.baseReverseURL}?lat=${lat}&lon=${lon}&format=json`);
        if (!res.ok) throw new Error("Error during reverse geocoding");
        const data = await res.json();
        return data.address ? (data.address.city || data.address.town || data.address.village || data.address.county || "Ubicación actual") : "Ubicación actual";
    }
}

export const geoService = new GeoService();
