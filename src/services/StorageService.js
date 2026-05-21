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
        request.onerror = (e) => reject(request.error);
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
      return new Promise((resolve, reject) => {
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
      } catch (err) {
        return defaultValue;
      }
    }
  }

  async set(key, value) {
    try {
      await this.init();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.put(value, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn("Storage.set IndexedDB failed, using localStorage", e);
      try {
        localStorage.setItem(`weatherhist_${key}`, JSON.stringify(value));
      } catch (err) {
        // ignore
      }
    }
  }
  async getHistory(locationName) {
    try {
      await this.init();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.historyStoreName], "readonly");
        const store = transaction.objectStore(this.historyStoreName);
        const request = store.get(locationName);
        request.onsuccess = () => resolve(request.result || { hourly: [], daily: [] });
        request.onerror = () => resolve({ hourly: [], daily: [] });
      });
    } catch(e) {
      return { hourly: [], daily: [] };
    }
  }

  async setHistory(locationName, pastData) {
    try {
      await this.init();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.historyStoreName], "readwrite");
        const store = transaction.objectStore(this.historyStoreName);
        const request = store.put(pastData, locationName);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch(e) {}
  }

  async updateDayNotes(locationName, dayTimestamp, notes) {
    try {
      const history = await this.getHistory(locationName);
      const day = history.daily.find(d => d.time === dayTimestamp);
      if (!day) return false;
      if (notes) {
        day.notes = notes;
      } else {
        delete day.notes;
      }
      await this.setHistory(locationName, history);
      return true;
    } catch(e) {
      return false;
    }
  }

  async updateDayMoods(locationName, dayTimestamp, moods) {
    try {
      const history = await this.getHistory(locationName);
      const day = history.daily.find(d => d.time === dayTimestamp);
      if (!day) return false;
      if (moods && moods.length > 0) {
        day.moods = moods;
      } else {
        delete day.moods;
      }
      await this.setHistory(locationName, history);
      return true;
    } catch(e) {
      return false;
    }
  }
}

export const storageService = new StorageService();
