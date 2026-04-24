import { state } from '../core/Store.js';
import { GridLayer } from './layers/GridLayer.js';
import { DayNamesLayer } from './layers/DayNamesLayer.js';
import { SunMoonLayer } from './layers/SunMoonLayer.js';
import { CloudLayer } from './layers/CloudLayer.js';
import { PrecipitationLayer } from './layers/PrecipitationLayer.js';
import { HumidityLayer } from './layers/HumidityLayer.js';
import { WindLayer } from './layers/WindLayer.js';
import { TemperatureLayer } from './layers/TemperatureLayer.js';
import { UvLayer } from './layers/UvLayer.js';
import { WeatherPhenomenaLayer } from './layers/WeatherPhenomenaLayer.js';

export class CanvasEngine {
    constructor() {
        this.layers = [
            new SunMoonLayer(),
            new GridLayer(),
            new DayNamesLayer(),
            new CloudLayer(),
            new UvLayer(),
            new PrecipitationLayer(),
            new WeatherPhenomenaLayer(),
            new WindLayer(),
            new HumidityLayer(),
            new TemperatureLayer()
        ];
        
        this.tiles = [];
        this.scrollContainer = document.getElementById('scroll-container');
    }

    init() {
        // Setup resize handling, etc.
    }

    render() {
        if (!state.hourlyData.length) return;

        const scrollX = Math.floor(this.scrollContainer.scrollLeft);
        const viewportW = this.scrollContainer.clientWidth;
        
        const startTile = Math.max(0, Math.floor(scrollX / state.tileWidth) - 1);
        const endTile = Math.floor((scrollX + viewportW) / state.tileWidth) + 1;

        for (let i = startTile; i <= endTile; i++) {
            if (this.tiles[i] && !this.tiles[i].drawn) {
                this.drawTile(this.tiles[i]);
            }
        }
    }

    drawTile(tile) {
        const ctx = tile.ctx;
        const xOffset = tile.index * state.tileWidth;
        const w = state.tileWidth;
        const h = this.scrollContainer.clientHeight;
        const styles = getComputedStyle(document.documentElement);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.clearRect(0, 0, w, h);
        ctx.save();
        ctx.translate(-xOffset, 0);

        for (const layer of this.layers) {
            layer.render(ctx, xOffset, w, h, styles);
        }

        ctx.restore();
        tile.drawn = true;
    }

    invalidateTiles() {
        this.tiles.forEach(t => t.drawn = false);
        this.render();
    }
}
