import { state, on, updateState } from './core/Store.js';
import { loadChartTheme } from './services/ThemeManager.js';
import { fetchWeatherData } from './services/WeatherAPI.js';
import { useMyLocation } from './services/LocationAPI.js';
import { CanvasEngine } from './renderer/CanvasEngine.js';
import { SearchBar } from './ui/SearchBar.js';
import { TopPanel } from './ui/TopPanel.js';
import { RadarView } from './ui/RadarView.js';
import { DailyCards } from './ui/DailyCards.js';
import { Minimap } from './ui/Minimap.js';
import { LayoutManager } from './ui/LayoutManager.js';

class App {
    constructor() {
        this.radarView = new RadarView();
        this.topPanel = new TopPanel(this.radarView);
        this.searchBar = new SearchBar();
        this.canvasEngine = new CanvasEngine();
        this.dailyCards = new DailyCards();
        this.minimap = new Minimap();
        this.layoutManager = new LayoutManager();
        
        this.isDailyCardsView = localStorage.getItem('view_mode') === 'daily';
    }

    async init() {
        // 1. Initial Load
        await loadChartTheme(state.activeChartTheme);
        
        // 2. Setup UI
        this.searchBar.init(() => this.loadWeather());
        this.setupEventListeners();
        
        // 3. Initial Location
        await useMyLocation(false, {
            onFetchingLocation: () => this.showOverlay("Obteniendo ubicación..."),
            onLocationFound: () => this.showOverlay("Cargando datos...")
        });

        // 4. Initial Render
        this.handleResize();
        this.updateViewMode();
        this.startPulseLoop();
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.handleResize());
        
        const scrollContainer = document.getElementById('scroll-container');
        scrollContainer.addEventListener('scroll', () => {
            this.topPanel.update();
            this.layoutManager.updateScrollIndicators();
            this.layoutManager.updateNowButtonPosition();
            this.layoutManager.drawFixedOverlay();
            this.minimap.updateViewport();
            if (this.isDailyCardsView) this.dailyCards.updateActive();
            this.canvasEngine.render();
        });

        document.getElementById('toggle-nav-btn')?.addEventListener('click', () => {
            this.isDailyCardsView = !this.isDailyCardsView;
            this.updateViewMode();
        });

        document.getElementById('floating-now-btn')?.addEventListener('click', () => {
            this.centerOnCurrentTime('smooth');
        });

        document.getElementById('force-refresh-btn')?.addEventListener('click', () => {
            localStorage.clear();
            location.reload();
        });

        on('weatherDataReady', () => {
            this.hideOverlay();
            this.handleResize(); // To setup tiles
            this.centerOnCurrentTime();
            this.renderAll();
        });
        
        window.addEventListener('centerOnCurrentTime', (e) => {
            this.centerOnCurrentTime(e.detail.behavior);
        });
    }

    async loadWeather() {
        this.showOverlay("Cargando datos...");
        await fetchWeatherData(7, 7);
    }

    handleResize() {
        updateState({ dpr: Math.min(window.devicePixelRatio || 1, 2) });
        
        const scrollContainer = document.getElementById('scroll-container');
        const containerH = scrollContainer.clientHeight;
        const totalWidth = state.hourlyData.length * state.pixelsPerHour;
        
        const canvasWrapper = document.getElementById('canvas-wrapper');
        if (canvasWrapper) canvasWrapper.style.width = totalWidth + 'px';

        // Re-initialize tiles in engine
        this.canvasEngine.tiles = [];
        const numTiles = Math.ceil(totalWidth / state.tileWidth);
        const oldCanvases = canvasWrapper.querySelectorAll('canvas:not(#fixed-overlay-canvas)');
        oldCanvases.forEach(c => c.remove());

        for (let i = 0; i < numTiles; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = state.tileWidth * state.dpr;
            canvas.height = containerH * state.dpr;
            canvas.style.width = state.tileWidth + 'px';
            canvas.style.height = containerH + 'px';
            canvas.style.position = 'absolute';
            canvas.style.left = (i * state.tileWidth) + 'px';
            canvas.style.top = '0';
            canvasWrapper.appendChild(canvas);

            const ctx = canvas.getContext('2d', { alpha: true });
            ctx.scale(state.dpr, state.dpr);
            this.canvasEngine.tiles.push({ canvas, ctx, index: i, drawn: false });
        }

        const fixedCanvas = document.getElementById('fixed-overlay-canvas');
        const chartArea = document.getElementById('chart-area');
        fixedCanvas.width = chartArea.clientWidth * state.dpr;
        fixedCanvas.height = chartArea.clientHeight * state.dpr;
        this.layoutManager.fixedOverlayCtx.resetTransform();
        this.layoutManager.fixedOverlayCtx.scale(state.dpr, state.dpr);

        this.renderAll();
    }

    updateViewMode() {
        const minimapContainer = document.getElementById('minimap-container');
        const dailyCardsContainer = document.getElementById('daily-cards-container');
        const toggleNavBtn = document.getElementById('toggle-nav-btn');

        if (this.isDailyCardsView) {
            minimapContainer.style.display = 'none';
            dailyCardsContainer.style.display = 'flex';
            toggleNavBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px;">insights</span>';
            this.dailyCards.render();
        } else {
            minimapContainer.style.display = 'block';
            dailyCardsContainer.style.display = 'none';
            toggleNavBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px;">calendar_month</span>';
            this.minimap.draw();
        }
        localStorage.setItem('view_mode', this.isDailyCardsView ? 'daily' : 'minimap');
    }

    renderAll() {
        this.canvasEngine.invalidateTiles();
        this.minimap.draw();
        this.topPanel.update();
        this.layoutManager.drawFixedOverlay();
        this.layoutManager.updateNowButtonPosition();
        if (this.isDailyCardsView) this.dailyCards.render();
    }

    centerOnCurrentTime(behavior = 'auto') {
        if (state.hourlyData.length === 0) return;
        const now = Date.now();
        const startTime = state.hourlyData[0].time;
        const exactX = ((now - startTime) / 3600000) * state.pixelsPerHour;
        const targetLeft = Math.max(0, exactX - 60);
        
        const scrollContainer = document.getElementById('scroll-container');
        if (behavior === 'smooth') {
            scrollContainer.scrollTo({ left: targetLeft, behavior: 'smooth' });
        } else {
            scrollContainer.scrollLeft = targetLeft;
        }
    }

    startPulseLoop() {
        const loop = () => {
            this.layoutManager.updateNowButtonPosition();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    showOverlay(text) {
        const overlay = document.getElementById('overlay');
        const statusText = document.getElementById('status-text');
        if (overlay) overlay.classList.remove('hidden');
        if (statusText) statusText.innerText = text;
    }

    hideOverlay() {
        const overlay = document.getElementById('overlay');
        if (overlay) overlay.classList.add('hidden');
    }
}

const app = new App();
app.init();
