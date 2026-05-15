import { state } from '../store.js';
import { TILE_WIDTH, CHART_HEIGHT } from '../constants/index.js';
import { drawSunnyBackground, drawNightOverlay, drawNightShadow, drawStarrySky, drawWeatherPhenomena, drawUVSegments, drawSunMarkersOnCanvas } from './BackgroundRenderer.js';
import { drawGrid, drawDayNames, drawAxes } from './GridRenderer.js';
import { drawClouds, drawPrecipitation, drawPrecipitationProbability } from './AtmosphereRenderer.js';
import { drawHumidity, drawWind, drawTemperature } from './MetricsRenderer.js';

export function createRender(deps) {
    const { tiles, scrollContainer, updateTopPanel, updateMinimapViewport, setMinimapMode, updateNowButtonPosition, getIsMinimapDragging, drawFixedOverlay, minimapCanvas, minimapViewport } = deps;

    function drawTile(tile) {
        const ctx = tile.ctx;
        const xOffset = tile.index * TILE_WIDTH;
        const w = TILE_WIDTH;
        const h = scrollContainer.clientHeight;
        const styles = getComputedStyle(document.documentElement);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.clearRect(0, 0, w, h);
        ctx.save();
        ctx.translate(-xOffset, 0);

        drawSunnyBackground(ctx, xOffset, w, h, styles, true, state.PIXELS_PER_HOUR);
        drawNightOverlay(ctx, xOffset, w, h, state.PIXELS_PER_HOUR);
        drawNightShadow(ctx, xOffset, w, h, state.PIXELS_PER_HOUR);
        drawStarrySky(ctx, xOffset, w, h, state.PIXELS_PER_HOUR);
        drawGrid(ctx, xOffset, w, h, styles, state.PIXELS_PER_HOUR);
        drawDayNames(ctx, xOffset, w, h, styles, state.PIXELS_PER_HOUR);
        drawClouds(ctx, xOffset, w, h, styles, state.PIXELS_PER_HOUR);
        drawUVSegments(ctx, xOffset, w, h, state.PIXELS_PER_HOUR);
        drawPrecipitation(ctx, xOffset, w, h, styles, state.PIXELS_PER_HOUR);
        drawPrecipitationProbability(ctx, xOffset, w, h, styles, state.PIXELS_PER_HOUR);
        drawWeatherPhenomena(ctx, xOffset, w, h, state.PIXELS_PER_HOUR);
        drawWind(ctx, xOffset, w, h, styles, state.PIXELS_PER_HOUR);
        drawTemperature(ctx, xOffset, w, h, styles, state.PIXELS_PER_HOUR);
        drawSunMarkersOnCanvas(ctx, xOffset, w, h, state.PIXELS_PER_HOUR);
        drawAxes(ctx, xOffset, w, h, styles, state.PIXELS_PER_HOUR, CHART_HEIGHT);

        ctx.restore();
        tile.drawn = true;
    }

    function render() {
        if (!state.hourlyData.length) return;

        const scrollX = Math.floor(scrollContainer.scrollLeft);
        const viewportW = scrollContainer.clientWidth;
        const startTile = Math.max(0, Math.floor(scrollX / TILE_WIDTH) - 1);
        const endTile = Math.floor((scrollX + viewportW) / TILE_WIDTH) + 1;

        for (let i = startTile; i <= endTile; i++) {
            if (tiles[i] && !tiles[i].drawn) {
                drawTile(tiles[i]);
            }
        }

        updateMinimapViewport(scrollContainer, minimapCanvas, minimapViewport, setMinimapMode, updateNowButtonPosition, getIsMinimapDragging(), state.PIXELS_PER_HOUR);
        updateTopPanel();
        drawFixedOverlay();
    }

    return { render, drawTile };
}
