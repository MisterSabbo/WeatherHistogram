import { state, getDPR } from '../store.js';
import { TILE_WIDTH, MINIMAP_HEIGHT, PIXELS_PER_HOUR_DESKTOP, PIXELS_PER_HOUR_MOBILE, MOBILE_BREAKPOINT } from '../constants/index.js';

export function createResizeHandler(deps) {
    const { tiles, scrollContainer, minimapCanvas, minimapCtx, fixedOverlayCanvas, fixedOverlayCtx, drawMinimap, render } = deps;

    function handleResize() {
        if (!scrollContainer) return;
        state.PIXELS_PER_HOUR = window.innerWidth < MOBILE_BREAKPOINT ? PIXELS_PER_HOUR_MOBILE : PIXELS_PER_HOUR_DESKTOP;
        state.dpr = getDPR();

        const containerH = scrollContainer.clientHeight;
        const totalWidth = state.hourlyData.length * state.PIXELS_PER_HOUR;

        const canvasWrapper = document.getElementById('canvas-wrapper');
        if (canvasWrapper) {
            canvasWrapper.style.width = totalWidth + 'px';
            const numTiles = Math.ceil(totalWidth / TILE_WIDTH);
            tiles.forEach(t => t.canvas.remove());
            tiles.length = 0;

            for (let i = 0; i < numTiles; i++) {
                const canvas = document.createElement('canvas');
                canvas.width = TILE_WIDTH * state.dpr;
                canvas.height = containerH * state.dpr;
                canvas.style.width = TILE_WIDTH + 'px';
                canvas.style.height = containerH + 'px';
                canvas.style.position = 'absolute';
                canvas.style.left = (i * TILE_WIDTH) + 'px';
                canvas.style.top = '0';
                canvasWrapper.appendChild(canvas);
                const ctx = canvas.getContext('2d', { alpha: true });
                ctx.scale(state.dpr, state.dpr);
                tiles.push({ canvas, ctx, index: i, drawn: false });
            }
        }

        const minimapTargetWidth = minimapCanvas.parentElement.clientWidth || window.innerWidth;
        minimapCanvas.width = minimapTargetWidth * state.dpr;
        minimapCanvas.height = MINIMAP_HEIGHT * state.dpr;
        minimapCanvas.style.width = minimapTargetWidth + 'px';
        minimapCanvas.style.height = MINIMAP_HEIGHT + 'px';

        const chartArea = document.getElementById('chart-area');
        fixedOverlayCanvas.width = chartArea.clientWidth * state.dpr;
        fixedOverlayCanvas.height = chartArea.clientHeight * state.dpr;
        fixedOverlayCtx.resetTransform();
        fixedOverlayCtx.scale(state.dpr, state.dpr);

        drawMinimap();
        render();
    }

    return { handleResize };
}
