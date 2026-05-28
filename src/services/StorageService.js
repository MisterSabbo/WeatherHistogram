export class StorageService {
  constructor() {
    this.dbName = "WeatherHistDB";
    this.storeName = "userPreferences";
    this.historyStoreName = "historyData";
    this.db = null;
  }

  async init() {
    if (this.db) return;
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(this.dbName, 2);
        request.onerror = () => reject(request.error);
        request.onsuccess = (e) => {
          this.db = /** @type {IDBOpenDBRequest} */ (e.target).result;
          resolve();
        };
        request.onupgradeneeded = (e) => {
          const db = /** @type {IDBOpenDBRequest} */ (e.target).result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName);
          }
          if (!db.objectStoreNames.contains(this.historyStoreName)) {
            db.createObjectStore(this.historyStoreName);
          }
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  async get(key, defaultValue = null) {
    try {
      await this.init();
      return new Promise((resolve) => {
        const transaction = this.db.transaction([this.storeName], "readonly");
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);
        request.onsuccess = () =>
          resolve(request.result !== undefined ? request.result : defaultValue);
        request.onerror = () => resolve(defaultValue);
      });
    } catch (e) {
      console.warn("Storage.get IndexedDB failed, using localStorage", e);
      try {
        const item = localStorage.getItem(`weatherhist_${key}`);
        return item !== null ? JSON.parse(item) : defaultValue;
      } catch {
        return defaultValue;
      }
    }
  }

  async set(key, value) {
    try {
      await this.init();
      return new Promise((resolve) => {
        const transaction = this.db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.put(value, key);
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      });
    } catch (e) {
      console.warn("Storage.set IndexedDB failed, using localStorage", e);
      try {
        localStorage.setItem(`weatherhist_${key}`, JSON.stringify(value));
      } catch {
        // ignore
      }
    }
  }
  async getHistory(locationName) {
    try {
      await this.init();
      return new Promise((resolve) => {
        const transaction = this.db.transaction([this.historyStoreName], "readonly");
        const store = transaction.objectStore(this.historyStoreName);
        const request = store.get(locationName);
        request.onsuccess = () => resolve(request.result || { hourly: [], daily: [] });
        request.onerror = () => resolve({ hourly: [], daily: [] });
      });
    } catch {
      return { hourly: [], daily: [] };
    }
  }

  async setHistory(locationName, pastData) {
    try {
      await this.init();
      return new Promise((resolve) => {
        const transaction = this.db.transaction([this.historyStoreName], "readwrite");
        const store = transaction.objectStore(this.historyStoreName);
        const request = store.put(pastData, locationName);
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      });
    } catch {}
  }

    async updateDayNotes(locationName, dayTimestamp, notes) {
        try {
            const history = await this.getHistory(locationName);
            let day = history.daily.find(d => d.time === dayTimestamp);
            if (!day) {
                day = { time: dayTimestamp };
                history.daily.push(day);
            }
            if (notes) {
                day.notes = notes;
            } else {
                delete day.notes;
            }
            await this.setHistory(locationName, history);
            return true;
        } catch {
            return false;
        }
    }

    async updateDayMoods(locationName, dayTimestamp, moods) {
        try {
            const history = await this.getHistory(locationName);
            let day = history.daily.find(d => d.time === dayTimestamp);
            if (!day) {
                day = { time: dayTimestamp };
                history.daily.push(day);
            }
            if (moods && moods.length > 0) {
                day.moods = moods;
            } else {
                delete day.moods;
            }
            await this.setHistory(locationName, history);
            return true;
        } catch {
            return false;
        }
    }

    async updateDayConditions(locationName, dayTimestamp, conditions) {
        try {
            const history = await this.getHistory(locationName);
            let day = history.daily.find(d => d.time === dayTimestamp);
            if (!day) {
                day = { time: dayTimestamp };
                history.daily.push(day);
            }
            if (conditions.cold) {
                day.cold = true;
            } else {
                delete day.cold;
            }
            if (conditions.allergies) {
                day.allergies = true;
            } else {
                delete day.allergies;
            }
            await this.setHistory(locationName, history);
            return true;
        } catch {
            return false;
        }
    }

    async updateDayData(locationName, dayTimestamp, fields) {
        try {
            const history = await this.getHistory(locationName);
            let day = history.daily.find(d => d.time === dayTimestamp);
            if (!day) {
                day = { time: dayTimestamp };
                history.daily.push(day);
            }
            Object.keys(fields).forEach((key) => {
                const value = fields[key];
                if (value === undefined) {
                    delete day[key];
                } else {
                    day[key] = value;
                }
            });
            await this.setHistory(locationName, history);
            return true;
        } catch {
            return false;
        }
    }
}

export const storageService = new StorageService();
