export class GeoService {
    constructor() {
        this.baseSearchURL = 'https://geocoding-api.open-meteo.com/v1/search';
        this.baseReverseURL = 'https://nominatim.openstreetmap.org/reverse';
        
        this.lastReverseCall = 0;
        this.reverseQueue = [];
        this.isProcessingQueue = false;
    }

    async searchLocation(query, count = 1) {
        const res = await fetch(`${this.baseSearchURL}?name=${encodeURIComponent(query)}&count=${count}&language=es&format=json`);
        if (!res.ok) throw new Error("Error fetching location data");
        const data = await res.json();
        return data.results || [];
    }

    async reverseGeocode(lat, lon) {
        return new Promise((resolve, reject) => {
            const task = { lat, lon, resolve, reject };
            this.reverseQueue.push(task);
            
            // Only keep the most recent request to avoid queuing up spammed clicks
            while (this.reverseQueue.length > 1) {
                 const dropped = this.reverseQueue.shift();
                 dropped.reject(new Error("Cancelled"));
            }
            this._processQueue();
        });
    }

    async _processQueue() {
        if (this.isProcessingQueue) return;
        this.isProcessingQueue = true;

        while (this.reverseQueue.length > 0) {
            const now = Date.now();
            const timeSinceLastCall = now - this.lastReverseCall;
            if (timeSinceLastCall < 2000) {
                await new Promise(r => setTimeout(r, 2000 - timeSinceLastCall));
            }
            if (this.reverseQueue.length === 0) break;
            
            const task = this.reverseQueue.shift();
            this.lastReverseCall = Date.now();

            try {
                const res = await fetch(`${this.baseReverseURL}?format=json&lat=${task.lat}&lon=${task.lon}&zoom=18`);
                if (!res.ok) throw new Error("Error during reverse geocoding");
                const data = await res.json();
                
                const nameParts = [];
                if (data.address) {
                    if (data.address.city || data.address.town || data.address.village) {
                        nameParts.push(data.address.city || data.address.town || data.address.village);
                    }
                    if (data.address.county) nameParts.push(data.address.county);
                    if (data.address.state) nameParts.push(data.address.state);
                    if (data.address.country) nameParts.push(data.address.country);
                }
                const finalName = nameParts.length > 0 ? nameParts.join(", ") : "Ubicación actual";
                
                task.resolve(finalName);
            } catch (err) {
                task.reject(err);
            }
        }
        
        this.isProcessingQueue = false;
    }
}

export const geoService = new GeoService();
