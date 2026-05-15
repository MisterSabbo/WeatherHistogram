import { state } from './store.js';
import { storageService } from './services/StorageService.js';
import { getThemeFont, loadChartTheme } from './theme.js';
import { generateDailyCards, updateActiveDailyCard } from './ui/DailyCards.js';
import { drawScrubber } from './render/ScrubberRenderer.js';
import { updateMinimapViewport, setMinimapMode } from './render/MinimapViewport.js';
import { drawMinimap } from './render/MinimapRenderer.js';
import { setupMinimapDrag, handleMinimapDragMove, handleMinimapDragEnd, getIsMinimapDragging } from './render/MinimapInteraction.js';
import { initMapModal } from './ui/MapSelector.js';
import { initFavoritesModal } from './ui/FavoritesModal.js';
import { initYearInPixels } from './ui/YearInPixels.js';
import { updateTopPanel } from './render/TopPanelUpdater.js';
import { initBottomSheetGlobal } from './ui/BottomSheet.js';
import { initChangelogButton } from './ui/ChangelogModal.js';
import { registerServiceWorker } from './utils/VersionManager.js';
import { migrateStorage } from './init/StorageMigration.js';
import { initGestures } from './init/GestureManager.js';
import { initModalWiring } from './init/ModalWiring.js';
import { initEventBindings } from './init/EventBindings.js';
import { initRenderLoop, initScrollIndicator } from './init/RenderLoop.js';
import { showConfirm } from './init/SettingsBindings.js';
import { createWeatherLoader, updateLocationUI, showError } from './services/WeatherLoader.js';
import { createResizeHandler } from './layout/ResizeHandler.js';
import { createNavigation } from './navigation/Navigation.js';
import { createRender } from './render/render.js';

let weatherCache = new Map();
let tiles = [];
let minimapCanvas, minimapCtx;
let fixedOverlayCanvas, fixedOverlayCtx;
let scrollContainer, minimapViewport, themeToggle;

window.addEventListener('DOMContentLoaded', init);

function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);
    themeToggle.innerHTML = state.theme === 'dark' ? '<span class="material-symbols-outlined">light_mode</span>' : '<span class="material-symbols-outlined">dark_mode</span>';
    tiles.forEach(t => t.drawn = false);
    ren.render();
    drawMinimap(minimapCanvas, minimapCtx);
}

function drawFixedOverlay() {
    drawScrubber(fixedOverlayCanvas, fixedOverlayCtx, scrollContainer);
}

let ren, loader, resizer, nav;

async function init() {
    await storageService.init();
    await migrateStorage();

    state.skinType = await storageService.get('skinType', 2);
    state.stickmanThresholds = await storageService.get('stickmanThresholds', { cold: 10, hot: 30, wind: 45, clouds: 60 });
    state.activeChartTheme = await storageService.get('chartTheme', 'default');
    state.isDailyCardsView = await storageService.get('viewMode', 'minimap') === 'daily';

    await loadChartTheme(state.activeChartTheme);
    initGestures({ loadWeather: () => loader.loadWeather(), weatherCache, tiles, fixedOverlayCanvas, fixedOverlayCtx, minimapCanvas, minimapCtx });
    initModalWiring();

    minimapCanvas = document.getElementById('minimap-canvas');
    minimapCtx = minimapCanvas.getContext('2d', { alpha: true });
    fixedOverlayCanvas = document.getElementById('fixed-overlay-canvas');
    fixedOverlayCtx = fixedOverlayCanvas.getContext('2d');
    scrollContainer = document.getElementById('scroll-container');
    minimapViewport = document.getElementById('minimap-viewport');
    themeToggle = document.getElementById('theme-toggle');

    nav = createNavigation({ scrollContainer, render: () => ren.render() });
    ren = createRender({ tiles, scrollContainer, updateTopPanel, updateMinimapViewport, setMinimapMode, updateNowButtonPosition: nav.updateNowButtonPosition, getIsMinimapDragging, drawFixedOverlay, minimapCanvas, minimapViewport });
    resizer = createResizeHandler({ tiles, scrollContainer, minimapCanvas, minimapCtx, fixedOverlayCanvas, fixedOverlayCtx, drawMinimap: () => drawMinimap(minimapCanvas, minimapCtx), render: () => ren.render() });
    loader = createWeatherLoader({ weatherCache, centerOnCurrentTime: nav.centerOnCurrentTime, drawMinimap: () => drawMinimap(minimapCanvas, minimapCtx), render: () => ren.render(), handleResize: resizer.handleResize });

    initMapModal(async (lat, lon, name) => {
        state.lat = lat; state.lon = lon; state.locationName = name;
        updateLocationUI(); await loader.loadWeather();
    });

    initFavoritesModal(async (lat, lon, name) => {
        state.lat = lat; state.lon = lon; state.locationName = name;
        updateLocationUI(); await loader.loadWeather();
    });

    initYearInPixels();

    const mainLocBtn = document.getElementById('main-current-location-btn');
    if (mainLocBtn) {
        mainLocBtn.addEventListener('click', async () => {
            const originalHTML = mainLocBtn.innerHTML;
            mainLocBtn.innerHTML = '<span class="loader" style="width:16px;height:16px;border-width:2px;display:block;"></span>';
            await loader.useMyLocation(true);
            mainLocBtn.innerHTML = originalHTML;
        });
    }

    const canvasWrapper = document.getElementById('canvas-wrapper');
    let uvBlock = document.getElementById('uv-active-block');
    if (canvasWrapper && !uvBlock) {
        uvBlock = document.createElement('div');
        uvBlock.id = 'uv-active-block';
        uvBlock.style.position = 'absolute';
        uvBlock.style.top = '0';
        uvBlock.style.height = '14px';
        uvBlock.style.zIndex = '50';
        uvBlock.style.pointerEvents = 'none';
        uvBlock.style.display = 'none';
        uvBlock.style.justifyContent = 'center';
        uvBlock.style.alignItems = 'center';
        uvBlock.style.fontWeight = 'bold';
        uvBlock.style.fontFamily = getThemeFont();
        uvBlock.style.fontSize = '8.5px';
        canvasWrapper.appendChild(uvBlock);
    }

    try {
        const minimapContainer = document.getElementById('minimap-container');
        const dailyCardsContainer = document.getElementById('daily-cards-container');
        const toggleNavBtn = document.getElementById('toggle-nav-btn');
        const floatingNowBtn = document.getElementById('floating-now-btn');

        initEventBindings({
            toggleTheme, themeToggle, render: () => ren.render(), tiles,
            drawFixedOverlay, drawMinimap, minimapCanvas, minimapCtx,
            scrollContainer, PIXELS_PER_HOUR: state.PIXELS_PER_HOUR, centerOnCurrentTime: nav.centerOnCurrentTime,
            generateDailyCards, updateActiveDailyCard, updateMinimapViewport,
            setMinimapMode, updateNowButtonPosition: nav.updateNowButtonPosition, getIsMinimapDragging,
            floatingNowBtn, toggleNavBtn, minimapContainer, dailyCardsContainer,
            minimapViewport, weatherCache, showConfirm
        });

        initRenderLoop({ scrollContainer, render: () => ren.render(), drawFixedOverlay, updateNowButtonPosition: nav.updateNowButtonPosition, updateActiveDailyCard, state });
        initScrollIndicator();
        initBottomSheetGlobal();

        if (minimapContainer) {
            setupMinimapDrag(minimapContainer, minimapCanvas, scrollContainer, state.PIXELS_PER_HOUR);
        }
        window.addEventListener('mousemove', (e) => { handleMinimapDragMove(e, minimapCanvas, scrollContainer, state.PIXELS_PER_HOUR); });
        window.addEventListener('mouseup', () => { handleMinimapDragEnd(); });
        window.addEventListener('touchmove', (e) => { handleMinimapDragMove(e.touches[0], minimapCanvas, scrollContainer, state.PIXELS_PER_HOUR); }, { passive: true });
        window.addEventListener('touchend', () => { handleMinimapDragEnd(); });

        initChangelogButton();

        window.addEventListener('resize', resizer.handleResize);
        resizer.handleResize();
        await loader.useMyLocation();
    } catch (err) {
        console.error('Initialization error:', err);
        showError('Error al iniciar la aplicaci\u00f3n.');
    }
}

registerServiceWorker();
