export class StorageService {
  constructor() {
    this.dbName = "WeatherHistDB";
    this.storeName = "userPreferences";
    this.db = null;
  }

  async init() {
    if (this.db) return;
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(this.dbName, 1);
        request.onerror = (e) => reject(request.error);
        request.onsuccess = (e) => {
          this.db = e.target.result;
          resolve();
        };
        request.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName);
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
}

export const storageService = new StorageService();
