import { storageService } from './StorageService.js';

export class FavoritesService {
    constructor() {
        this.cache = [];
    }

    async load() {
        this.cache = await storageService.get('favorites', []);
        return this.cache;
    }

    async save() {
        await storageService.set('favorites', this.cache);
    }

    async add(lat, lon, originalName) {
        await this.load();
        const exists = this.cache.find(f => Math.abs(f.lat - lat) < 0.001 && Math.abs(f.lon - lon) < 0.001);
        if (!exists) {
            this.cache.push({ lat, lon, originName: originalName, alias: originalName });
            await this.save();
        }
    }

    async remove(index) {
        await this.load();
        this.cache.splice(index, 1);
        await this.save();
    }

    async updateAlias(index, alias) {
        await this.load();
        if (this.cache[index]) {
            this.cache[index].alias = alias;
            await this.save();
        }
    }

    async reorder(oldIndex, newIndex) {
        await this.load();
        if(newIndex < 0 || newIndex >= this.cache.length) return;
        const [item] = this.cache.splice(oldIndex, 1);
        this.cache.splice(newIndex, 0, item);
        await this.save();
    }
}

export const favoritesService = new FavoritesService();
