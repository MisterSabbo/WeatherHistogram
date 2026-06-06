/**
         * CONFIGURACIÓN Y ESTADO
         */
import { state, CONFIG, getDPR } from './store.js';
import { storageService } from './services/StorageService.js';
import { getThemeColor, getThemeIcon, getThemeFont, loadChartTheme } from './theme.js';
import { setLanguage, getLanguage, applyTranslations, t } from './utils/i18n.js';
import { geoService } from './services/GeoService.js';
import { generateDailyCards, updateActiveDailyCard } from './ui/DailyCards.js';
import { processData } from './services/DataProcessor.js';
import { fetchWeatherData, clearWeatherCache } from './domain/WeatherFetcher.js';
import { showChangelogModal, initChangelog } from './ui/ChangelogModal.js';
import { registerSW, handleInstallPrompt, showUpdateToast, checkAppVersion, clearCacheAndReload } from './utils/pwa.js';
import { dateToX } from './utils/time.js';
import { normalizeY } from './utils/math.js';

import { drawWind, drawTemperature } from './render/MetricsRenderer.js';
import { drawClouds, drawPrecipitation, drawPrecipitationProbability } from './render/AtmosphereRenderer.js';
import { drawGrid, drawDayNames, drawAxes } from './render/GridRenderer.js';
import { drawWeatherPhenomena, drawStarrySky, drawUVSegments, drawSunMarkersOnCanvas, drawSunnyBackground, drawNightOverlay, drawNightShadow } from './render/BackgroundRenderer.js';
import { drawStickman } from './render/StickmanRenderer.js';
import { interpolateScrubberData, updateWeatherZone, drawScrubberPoint, updateUVBlock } from './render/OverlayRenderer.js';
import { initMapModal } from './ui/MapSelector.js';
import { initFavoritesModal } from './ui/FavoritesModal.js';
import { initYearInPixels } from './ui/YearInPixels.js';
import { openBottomSheet, closeBottomSheet } from './ui/BottomSheet.js';
import { showConfirm } from './ui/ConfirmModal.js';
import { initScrollIndicator as initScrollIndicatorRef } from './ui/ScrollIndicator.js';
import { updateTopPanel as updateTopPanelRef } from './ui/TopPanel.js';
import { initPullToRefresh as initPullToRefreshRef } from './ui/PullToRefresh.js';
import { initSpfModal as initSpfModalRef } from './ui/SpfModal.js';

import { initTooltipManager } from './ui/TooltipManager.js';
import { MinimapRenderer } from './render/MinimapRenderer.js';

let PIXELS_PER_HOUR = state.PIXELS_PER_HOUR;
const MINIMAP_HEIGHT = CONFIG.MINIMAP_HEIGHT;
const DEFAULT_COORDS = CONFIG.DEFAULT_COORDS;


        /** @type {HTMLCanvasElement} */
        let minimapCanvas;
        /** @type {CanvasRenderingContext2D} */
        let minimapCtx;
        /** @type {HTMLCanvasElement} */
        let fixedOverlayCanvas;
        /** @type {CanvasRenderingContext2D} */
        let fixedOverlayCtx;
        let tiles = [];
        let cachedTileHeight = 0;
        let TILE_WIDTH = window.innerWidth < 600 ? 720 : CONFIG.TILE_WIDTH;
        let scrollContainer, themeToggle;
        let minimapRenderer;
        let ticking = false;
        let preventBackNavTimer = null;
        let scrollSnapTimer = null;
        const snapScroll = () => {
            if (!state.hourlyData.length) return;
            const rounded = Math.round(scrollContainer.scrollLeft);
            if (scrollContainer.scrollLeft !== rounded) {
                scrollContainer.scrollLeft = rounded;
                render();
            }
        };

        /**
         * INICIALIZACIÓN
         */
        window.addEventListener('DOMContentLoaded', init);
        window.addEventListener('resize', handleResize);

        async function init() {
            try {
                await initStorage();
                initPwaDetection();
                initNetworkStatus();
                initPullToRefresh();
                initTouchPrevention();
                initSpfModal();
                initPollenAqiIcons();
                initCanvas();
                initModals();
                initLocationButton();
                initUvBlock();
                initLocationTooltip();
                initAlertsContainer();
                initTheme();
                initCollapsibleSections();
                initNowButton();
                initInfoModal();
                initLanguage();
                initThemeSelector();
                initStickmanSliders();
                initSkinCards();
                initForceRefresh();
                initClearData();
                initTooltipManager();
                initLoadingTimeout();
                initViewMode();
                initMinimapEvents();
                initScrollEvents();
                initScrollIndicator();
                handleResize();
                await useMyLocation();
                startPulseLoop();
            } catch (err) {
                console.error("Initialization error:", err);
                showError("Error al iniciar la aplicación.");
            }

            async function initStorage() {
                await storageService.init();

                if (localStorage.getItem('weatherhist_skintype') !== null) {
                    await storageService.set('skinType', parseInt(localStorage.getItem('weatherhist_skintype')) || 2);
                    await storageService.set('stickmanThresholds', {
                        cold: parseFloat(localStorage.getItem('weatherhist_stickmancold')) || 10,
                        hot: parseFloat(localStorage.getItem('weatherhist_stickmanhot')) || 30,
                        wind: parseFloat(localStorage.getItem('weatherhist_stickmanwind')) || 45,
                        clouds: parseFloat(localStorage.getItem('weatherhist_stickmanclouds')) || 60
                    });
                    const lastLoc = localStorage.getItem('last_weather_location');
                    if (lastLoc) {
                        try { await storageService.set('lastLocation', JSON.parse(lastLoc)); } catch {}
                    }
                    await storageService.set('chartTheme', localStorage.getItem('chart_theme') || 'default');
                    await storageService.set('viewMode', localStorage.getItem('view_mode') || 'minimap');
                    localStorage.removeItem('weatherhist_skintype');
                    localStorage.removeItem('weatherhist_stickmancold');
                    localStorage.removeItem('weatherhist_stickmanhot');
                    localStorage.removeItem('weatherhist_stickmanwind');
                    localStorage.removeItem('weatherhist_stickmanclouds');
                    localStorage.removeItem('last_weather_location');
                    localStorage.removeItem('chart_theme');
                    localStorage.removeItem('view_mode');
                }

                state.skinType = await storageService.get('skinType', 2);
                state.stickmanThresholds = await storageService.get('stickmanThresholds', { cold: 10, hot: 30, wind: 45, clouds: 60 });
                state.activeChartTheme = await storageService.get('chartTheme', 'default');
                state.isDailyCardsView = await storageService.get('viewMode', 'minimap') === 'daily';
                await loadChartTheme(state.activeChartTheme);
            }

            function initPwaDetection() {
                const isStandalone = window.matchMedia('(display-mode: standalone)').matches || /** @type {any} */ (window.navigator).standalone === true;
                if (isStandalone) {
                    document.documentElement.classList.add('pwa-standalone');
                }
                window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
                    document.documentElement.classList.toggle('pwa-standalone', e.matches);
                });
            }

            function initNetworkStatus() {
                const updateNetworkStatus = () => {
                    document.documentElement.classList.toggle('app-offline', !navigator.onLine);
                };
                window.addEventListener('online', updateNetworkStatus);
                window.addEventListener('offline', updateNetworkStatus);
                updateNetworkStatus();
            }

            function initPullToRefresh() {
                initPullToRefreshRef({
                    onRefresh: async () => {
                        clearWeatherCache();
                        tiles.forEach(t => {
                            t.drawn = false;
                            t.ctx.clearRect(0, 0, t.canvas.width, t.canvas.height);
                        });
                        if (fixedOverlayCtx && fixedOverlayCanvas) {
                            fixedOverlayCtx.clearRect(0, 0, fixedOverlayCanvas.width, fixedOverlayCanvas.height);
                            fixedOverlayCtx.fillStyle = getThemeColor('textPrimary');
                            fixedOverlayCtx.font = getThemeFont('16px Inter');
                            fixedOverlayCtx.textAlign = 'center';
                            fixedOverlayCtx.textBaseline = 'middle';
                            fixedOverlayCtx.fillText(t('config.loading') || 'Cargando...', fixedOverlayCanvas.width / 2, fixedOverlayCanvas.height / 2);
                        }
                        if (minimapCtx && minimapCanvas) {
                            minimapCtx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);
                        }
                        const originalLocation = state.locationName ? state.locationName.replace(/\*$/, '') : '';
                        document.getElementById('app-wrapper').classList.add('loading');
                        document.getElementById('error-msg').style.display = 'none';
                        try {
                            if (originalLocation) {
                                const results = await geoService.searchLocation(originalLocation, 1);
                                if (results.length > 0) {
                                    state.lat = results[0].latitude;
                                    state.lon = results[0].longitude;
                                    state.locationName = results[0].name + (results[0].admin1 ? `, ${results[0].admin1}` : "");
                                }
                            }
                        } catch (e) {
                            console.error('PTR geo-search failed, using existing coordinates:', e);
                        }
                        await loadWeather();
                        showRefreshToast();
                    }
                });
            }

            function initTouchPrevention() {
                document.addEventListener('touchstart', (e) => {
                    if (e.touches.length > 1) e.preventDefault();
                }, { passive: false });
                document.addEventListener('gesturestart', (e) => {
                    e.preventDefault();
                }, { passive: false });
            }

            function initSpfModal() {
                initSpfModalRef();
            }

            function initPollenAqiIcons() {
                const pollenWarningIcon = document.getElementById('pollen-warning-icon');
                const pollenModal = document.getElementById('pollen-modal');
                if (pollenWarningIcon && pollenModal) {
                    pollenWarningIcon.addEventListener('click', () => openBottomSheet('pollen-modal', 'pill-sheet-backdrop', 'pollen-sheet-scroll-content'));
                }
                const aqiWarningIcon = document.getElementById('aqi-warning-icon');
                const aqiModal = document.getElementById('aqi-modal');
                if (aqiWarningIcon && aqiModal) {
                    aqiWarningIcon.addEventListener('click', () => openBottomSheet('aqi-modal', 'pill-sheet-backdrop', 'aqi-sheet-scroll-content'));
                }
            }

            function initCanvas() {
                minimapCanvas = /** @type {HTMLCanvasElement} */ (document.getElementById('minimap-canvas'));
                minimapCtx = minimapCanvas.getContext('2d', { alpha: true });
                fixedOverlayCanvas = /** @type {HTMLCanvasElement} */ (document.getElementById('fixed-overlay-canvas'));
                fixedOverlayCtx = fixedOverlayCanvas.getContext('2d', { alpha: true });
                scrollContainer = document.getElementById('scroll-container');
                const minimapViewport = document.getElementById('minimap-viewport');
                minimapRenderer = new MinimapRenderer({
                    canvas: minimapCanvas,
                    ctx: minimapCtx,
                    viewportEl: minimapViewport,
                    scrollContainer,
                    centerOnCurrentTime,
                    updateNowButtonPosition,
                    minimapHeight: MINIMAP_HEIGHT
                });
                themeToggle = document.getElementById('theme-toggle');
            }

            function initModals() {
                initMapModal(async (lat, lon, name) => {
                    state.lat = lat;
                    state.lon = lon;
                    state.locationName = name;
                    updateLocationUI();
                    await loadWeather();
                });
                initFavoritesModal(async (lat, lon, name) => {
                    state.lat = lat;
                    state.lon = lon;
                    state.locationName = name;
                    updateLocationUI();
                    await loadWeather();
                });
                initYearInPixels();
            }

            function initLocationButton() {
                const mainLocBtn = document.getElementById('main-current-location-btn');
                if (mainLocBtn) {
                    mainLocBtn.addEventListener('click', async () => {
                        const originalHTML = mainLocBtn.innerHTML;
                        mainLocBtn.innerHTML = '<span class="loader" style="width:16px;height:16px;border-width:2px;display:block;"></span>';
                        await useMyLocation(true);
                        mainLocBtn.innerHTML = originalHTML;
                    });
                }
            }

            function initUvBlock() {
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
            }

            function initLocationTooltip() {
                const locationGroup = /** @type {HTMLElement} */ (document.querySelector('.location-group'));
                if (locationGroup) {
                    const checkOverflow = () => {
                        const locName = document.getElementById('location-name');
                        const summary = document.getElementById('weather-summary');
                        const isOverflowing = (locName.scrollWidth > locName.offsetWidth) || (summary.scrollWidth > summary.offsetWidth);
                        locationGroup.classList.toggle('has-overflow', isOverflowing);
                        locationGroup.style.cursor = isOverflowing ? 'pointer' : 'default';
                        return isOverflowing;
                    };
                    locationGroup.addEventListener('mouseenter', checkOverflow);
                    locationGroup.addEventListener('click', () => {
                        if (window.innerWidth <= 600) {
                            locationGroup.classList.toggle('active');
                            if (locationGroup.classList.contains('active')) {
                                setTimeout(() => locationGroup.classList.remove('active'), 3000);
                            }
                        }
                    });
                }
            }

            function initAlertsContainer() {
                const alertsContainer = document.getElementById('alerts-container');
                if (alertsContainer) {
                    alertsContainer.style.pointerEvents = 'auto';
                    alertsContainer.addEventListener('click', (e) => {
                        const isMobile = window.innerWidth <= 600;
                        if (isMobile) {
                            const tooltip = document.getElementById('alerts-tooltip');
                            if (tooltip) {
                                const isVisible = tooltip.style.opacity === '1';
                                document.querySelectorAll('.custom-tooltip').forEach(t => /** @type {HTMLElement} */ (t).style.display = '');
                                if (!isVisible) {
                                    alertsContainer.classList.add('active');
                                    tooltip.style.position = 'fixed';
                                    const rect = alertsContainer.getBoundingClientRect();
                                    tooltip.style.top = (rect.bottom + 10) + 'px';
                                    tooltip.style.left = '50%';
                                    tooltip.style.transform = 'translateX(-50%)';
                                    tooltip.style.zIndex = '9999';
                                    tooltip.style.opacity = '1';
                                    tooltip.style.visibility = 'visible';
                                    tooltip.style.display = 'block';
                                    setTimeout(() => {
                                        alertsContainer.classList.remove('active');
                                        tooltip.style.opacity = '';
                                        tooltip.style.visibility = '';
                                        tooltip.style.display = '';
                                    }, 4000);
                                } else {
                                    alertsContainer.classList.remove('active');
                                    tooltip.style.opacity = '';
                                    tooltip.style.visibility = '';
                                    tooltip.style.display = '';
                                }
                            }
                            e.stopPropagation();
                        }
                    });
                    alertsContainer.addEventListener('mouseenter', () => {
                        if (window.innerWidth > 600) alertsContainer.classList.add('active');
                    });
                    alertsContainer.addEventListener('mouseleave', () => {
                        if (window.innerWidth > 600) alertsContainer.classList.remove('active');
                    });
                }
            }

            function initTheme() {
                document.documentElement.setAttribute('data-theme', state.theme);
                const settingsThemeToggle = /** @type {HTMLInputElement} */ (document.getElementById('settings-theme-toggle'));
                if (settingsThemeToggle) {
                    settingsThemeToggle.checked = state.theme === 'dark';
                }
                const syncToggleTheme = () => {
                    toggleTheme();
                    if (settingsThemeToggle) {
                        settingsThemeToggle.checked = state.theme === 'dark';
                    }
                };
                themeToggle.addEventListener('click', syncToggleTheme);
                if (settingsThemeToggle) {
                    settingsThemeToggle.addEventListener('change', () => {
                        const targetTheme = settingsThemeToggle.checked ? 'dark' : 'light';
                        if (state.theme !== targetTheme) syncToggleTheme();
                    });
                }
            }

            function initCollapsibleSections() {
                document.querySelectorAll('.collapsible-trigger').forEach(trigger => {
                    trigger.addEventListener('click', () => {
                        const parent = trigger.closest('.collapsible');
                        if (parent) {
                            parent.classList.toggle('open');
                            const body = parent.querySelector('.info-section-body');
                            if (body) body.classList.toggle('open');
                        }
                    });
                });
            }

            function initNowButton() {
                const floatingNowBtn = document.getElementById('floating-now-btn');
                if (floatingNowBtn) floatingNowBtn.addEventListener('click', () => centerOnCurrentTime());
            }

            function initInfoModal() {
                const btnInfo = document.getElementById('btn-info');
                const infoModal = document.getElementById('info-modal');
                const closeInfoBtn = document.getElementById('close-info-btn');
                let closeInfoSheet = () => {};
                if (btnInfo && infoModal) {
                    btnInfo.addEventListener('click', () => {
                        closeInfoSheet = openBottomSheet('info-modal', 'info-sheet-backdrop', 'info-sheet-content');
                    });
                    closeInfoBtn.addEventListener('click', () => closeInfoSheet());
                }
                initChangelog(() => {
                    if (closeInfoSheet) closeInfoSheet();
                });
            }

            function initLanguage() {
                const langCards = document.querySelectorAll('.lang-card');
                const updateLangCardsUI = (lang) => {
                    langCards.forEach(card => {
                        const el = /** @type {HTMLElement} */ (card);
                        if (el.dataset.value === lang) {
                            el.style.borderColor = '#3b82f6';
                            el.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                        } else {
                            el.style.borderColor = 'var(--grid-color)';
                            el.style.backgroundColor = 'var(--card-bg)';
                        }
                    });
                };
                if (langCards.length > 0) {
                    updateLangCardsUI(getLanguage());
                    langCards.forEach(card => {
                        card.addEventListener('click', async () => {
                            const newLang = /** @type {HTMLElement} */ (card).dataset.value;
                            if (newLang === getLanguage()) return;
                            setLanguage(newLang);
                            updateLangCardsUI(newLang);
                            applyTranslations();
                            if (state.rawForecast && state.rawAQI) {
                                await processData(state.rawForecast, state.rawAQI, false);
                                updateTopPanel();
                                generateDailyCards();
                            }
                            requestAnimationFrame(() => {
                                tiles.forEach(t => t.drawn = false);
                                minimapRenderer.invalidateCache();
                                render();
                                minimapRenderer.draw(state, { PIXELS_PER_HOUR });
                            });
                        });
                    });
                }
                applyTranslations();
            }

            function initThemeSelector() {
                const themeSelectTrigger = document.getElementById('theme-select-trigger');
                const themeCurrentLabel = document.getElementById('theme-current-label');
                const themeCurrentSwatch = document.getElementById('theme-current-swatch');
                const themeOptionsContainer = document.getElementById('theme-options-container');

                const updateThemeUI = (themeId, themeName, themeColor) => {
                    if (themeCurrentLabel) themeCurrentLabel.textContent = themeName;
                    if (themeCurrentSwatch) themeCurrentSwatch.style.background = themeColor || 'var(--accent-temp)';
                    const opts = document.querySelectorAll('.theme-option');
                    opts.forEach(o => {
                        const el = /** @type {HTMLElement} */ (o);
                        el.classList.toggle('active', el.dataset.value === themeId);
                    });
                };

                const loadThemeOptions = async () => {
                    const themeIds = ['default', 'neon', 'pastel'];
                    try {
                        const themes = await Promise.all(themeIds.map(id =>
                            fetch(`public/themes/${id}.json`).catch(() => fetch(`themes/${id}.json`)).then(r => r.json())
                        ));
                        if (themeOptionsContainer) {
                            themeOptionsContainer.innerHTML = '';
                            themes.forEach(t => {
                                const div = document.createElement('div');
                                div.className = 'theme-option';
                                div.dataset.value = t.id;
                                const swatch = document.createElement('div');
                                swatch.className = 'theme-option-swatch';
                                swatch.style.background = t.colors.tempLine || 'var(--accent-temp)';
                                const name = document.createElement('span');
                                name.className = 'theme-option-name';
                                name.textContent = t.name;
                                const check = document.createElement('span');
                                check.className = 'material-symbols-outlined theme-option-check';
                                check.textContent = 'check';
                                div.appendChild(swatch);
                                div.appendChild(name);
                                div.appendChild(check);
                                if (t.id === state.activeChartTheme) {
                                    div.classList.add('active');
                                    updateThemeUI(t.id, t.name, t.colors.tempLine);
                                }
                                div.addEventListener('click', async () => {
                                    state.activeChartTheme = t.id;
                                    storageService.set('chartTheme', state.activeChartTheme);
                                    await loadChartTheme(state.activeChartTheme);
                                    updateThemeUI(t.id, t.name, t.colors.tempLine);
                                    tiles.forEach(t => t.drawn = false);
                                    minimapRenderer.invalidateCache();
                                    render();
                                    closeBottomSheet('theme-select-sheet', 'theme-sheet-backdrop');
                                });
                                themeOptionsContainer.appendChild(div);
                            });
                        }
                    } catch (e) {
                        console.warn('Failed to load themes:', e);
                    }
                };

                if (themeSelectTrigger) {
                    themeSelectTrigger.addEventListener('click', () => {
                        loadThemeOptions();
                        openBottomSheet('theme-select-sheet', 'theme-sheet-backdrop', 'theme-options-container');
                    });
                }
                loadThemeOptions();
            }

            function initStickmanSliders() {
                const initSlider = (id, stateKey, displayId, onchange) => {
                    const slider = /** @type {HTMLInputElement} */ (document.getElementById(id));
                    const display = document.getElementById(displayId);
                    if (!slider) return;
                    const val = state.stickmanThresholds[stateKey];
                    slider.value = String(val);
                    if (display) display.textContent = String(val);
                    slider.addEventListener('input', (e) => {
                        const v = /** @type {HTMLInputElement} */ (e.target).value;
                        if (display) display.textContent = v;
                    });
                    slider.addEventListener('change', (e) => {
                        const v = parseFloat(/** @type {HTMLInputElement} */ (e.target).value);
                        if (!isNaN(v)) {
                            state.stickmanThresholds[stateKey] = v;
                            storageService.set('stickmanThresholds', state.stickmanThresholds);
                            document.getElementById('slider-' + stateKey + '-val').textContent = String(v);
                            if (onchange) onchange();
                            if (stateKey === 'wind') render();
                            drawFixedOverlay();
                        }
                    });
                };
                initSlider('stickman-cold-slider', 'cold', 'slider-cold-val');
                initSlider('stickman-hot-slider', 'hot', 'slider-hot-val');
                initSlider('stickman-wind-slider', 'wind', 'slider-wind-val');
                initSlider('stickman-clouds-slider', 'clouds', 'slider-clouds-val');
            }

            function initSkinCards() {
                const skinCards = document.querySelectorAll('.skin-card');
                if (skinCards.length > 0) {
                    const updateActiveCard = () => {
                        const activeVal = state.skinType || 2;
                        skinCards.forEach(card => {
                            if (parseInt(/** @type {HTMLElement} */ (card).dataset.value) === activeVal) {
                                card.classList.add('active');
                            } else {
                                card.classList.remove('active');
                            }
                        });
                    };
                    updateActiveCard();
                    skinCards.forEach(card => {
                        card.addEventListener('click', () => {
                            const val = parseInt(/** @type {HTMLElement} */ (card).dataset.value);
                            if (!isNaN(val)) {
                                state.skinType = val;
                                storageService.set('skinType', val);
                                updateActiveCard();
                                render();
                            }
                        });
                    });
                }
            }

            function initForceRefresh() {
                const forceRefreshBtn = document.getElementById('force-refresh-btn');
                if (forceRefreshBtn) {
                    forceRefreshBtn.addEventListener('click', async () => {
                        const confirmed = await showConfirm(
                            t('config.clearCache') || "Limpiar caché",
                            t('config.clearCacheMsg') || "¿Estás seguro de que quieres limpiar la caché y recargar la aplicación?"
                        );
                        if (!confirmed) return;
                        state.isFetching = true;
                        await onClearCache();
                    });
                }
            }

            function initClearData() {
                const clearDataBtn = document.getElementById('clear-data-btn');
                if (clearDataBtn) {
                    clearDataBtn.addEventListener('click', async () => {
                        const confirmed = await showConfirm(
                            t('config.clearData') || "Borrar datos guardados",
                            t('config.clearDataMsg') || "¿Estás seguro de que quieres eliminar todos los datos persistentes (favoritos, configuraciones)? Esta acción no se puede deshacer."
                        );
                        if (!confirmed) return;
                        state.isFetching = true;
                        const { favoritesService } = await import('./services/FavoritesService.js');
                        await favoritesService.clear();
                        try { storageService.db?.close(); } catch {}
                        await new Promise((resolve) => {
                            const req = indexedDB.deleteDatabase("WeatherHistDB");
                            req.onsuccess = () => resolve();
                            req.onerror = () => resolve();
                            req.onblocked = () => resolve();
                        });
                        try { localStorage.clear(); } catch {}
                        const url = new URL(location.href);
                        url.searchParams.set('_t', String(Date.now()));
                        location.href = url.toString();
                    });
                }
            }

            function initLoadingTimeout() {
                setTimeout(() => {
                    const appWrapper = document.getElementById('app-wrapper');
                    if (appWrapper && appWrapper.classList.contains('loading') && document.getElementById('error-msg').style.display !== 'block') {
                        console.warn("Loading taking too long, forcing loading hide");
                        const skipBtn = document.createElement('button');
                        skipBtn.className = 'skip-loading-btn';
                        skipBtn.innerText = t('overlay.skipWait') || 'Skip';
                        skipBtn.onclick = () => {
                            appWrapper.classList.remove('loading');
                            skipBtn.remove();
                        };
                        skipBtn.style.cssText = 'position:fixed;bottom:120px;left:50%;transform:translateX(-50%);font-size:0.7rem;opacity:0.7;padding:8px 16px;background:var(--input-bg);border:1px solid var(--grid-color);border-radius:6px;color:var(--text-primary);cursor:pointer;z-index:9999;';
                        document.body.appendChild(skipBtn);
                    }
                }, 10000);
            }

            function initViewMode() {
                const minimapContainer = document.getElementById('minimap-container');
                const dailyCardsContainer = document.getElementById('daily-cards-container');
                const toggleNavBtn = document.getElementById('toggle-nav-btn');

                const updateViewMode = () => {
                    const toggle = document.getElementById('minimap-toggle');
                    if (state.isDailyCardsView) {
                        minimapContainer.style.display = 'none';
                        if (toggle) toggle.style.display = 'none';
                        dailyCardsContainer.style.display = 'flex';
                        toggleNavBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px;">insights</span>';
                        if (state.dailyData && state.dailyData.length > 0) {
                            generateDailyCards(centerOnCurrentTime);
                            updateActiveDailyCard();
                        }
                    } else {
                        minimapContainer.style.display = 'block';
                        if (toggle) toggle.style.display = 'flex';
                        dailyCardsContainer.style.display = 'none';
                        toggleNavBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px;">calendar_month</span>';
                        minimapRenderer.draw(state, { PIXELS_PER_HOUR });
                    }
                    storageService.set('viewMode', state.isDailyCardsView ? 'daily' : 'minimap');
                };

                if (toggleNavBtn) {
                    toggleNavBtn.addEventListener('click', () => {
                        state.isDailyCardsView = !state.isDailyCardsView;
                        updateViewMode();
                    });
                    updateViewMode();
                }

                let isDailyDragging = false;
                let dailyStartX;
                let dailyScrollLeft;

                if (dailyCardsContainer) {
                    dailyCardsContainer.addEventListener('pointerdown', (e) => {
                        if (e.pointerType !== 'mouse') return;
                        isDailyDragging = true;
                        dailyStartX = e.pageX - dailyCardsContainer.offsetLeft;
                        dailyScrollLeft = dailyCardsContainer.scrollLeft;
                        dailyCardsContainer.style.cursor = 'grabbing';
                    });
                    window.addEventListener('pointermove', (e) => {
                        if (!isDailyDragging) return;
                        e.preventDefault();
                        const x = e.pageX - dailyCardsContainer.offsetLeft;
                        const walk = (x - dailyStartX) * 2;
                        dailyCardsContainer.scrollLeft = dailyScrollLeft - walk;
                    });
                    window.addEventListener('pointerup', () => {
                        isDailyDragging = false;
                        dailyCardsContainer.style.cursor = 'pointer';
                    });
                }
            }

            function initMinimapEvents() {
                const minimapContainer = document.getElementById('minimap-container');
                if (minimapContainer) {
                    minimapContainer.style.touchAction = '';
                    minimapContainer.addEventListener('mousedown', (e) => {
                        minimapRenderer.isDragging = true;
                        scrollContainer.scrollLeft = minimapRenderer.handleClick(e.clientX, state, { PIXELS_PER_HOUR });
                    });
                    minimapContainer.addEventListener('touchstart', (e) => {
                        minimapRenderer.isDragging = true;
                        scrollContainer.scrollLeft = minimapRenderer.handleClick(e.touches[0].clientX, state, { PIXELS_PER_HOUR });
                    }, { passive: true });
                }
                window.addEventListener('mousemove', (e) => {
                    if (minimapRenderer.isDragging) scrollContainer.scrollLeft = minimapRenderer.handleClick(e.clientX, state, { PIXELS_PER_HOUR });
                });
                window.addEventListener('mouseup', () => { minimapRenderer.isDragging = false; });
                window.addEventListener('touchmove', (e) => {
                    if (minimapRenderer.isDragging) scrollContainer.scrollLeft = minimapRenderer.handleClick(e.touches[0].clientX, state, { PIXELS_PER_HOUR });
                }, { passive: true });
                window.addEventListener('touchend', () => { minimapRenderer.isDragging = false; });
            }

            function initScrollEvents() {
                scrollContainer.addEventListener('pointerdown', (e) => {
                    if (e.pointerType !== 'mouse') return;
                    state.isDragging = true;
                    state.startX = e.pageX - scrollContainer.offsetLeft;
                    state.scrollLeft = scrollContainer.scrollLeft;
                    scrollContainer.style.cursor = 'grabbing';
                });
                scrollContainer.addEventListener('pointermove', (e) => {
                    if (e.pointerType !== 'mouse') return;
                    if (state.isDragging) e.preventDefault();
                    if (!ticking) {
                        const rect = scrollContainer.getBoundingClientRect();
                        const pageX = e.pageX;
                        const clientX = e.clientX;
                        const offsetLeft = scrollContainer.offsetLeft;
                        window.requestAnimationFrame(() => {
                            state.hoverX = (clientX - rect.left) + scrollContainer.scrollLeft;
                            if (state.isDragging) {
                                const x = pageX - offsetLeft;
                                if (Math.abs(x - state.startX) > 3) {
                                    const walk = (x - state.startX) * 1.5;
                                    scrollContainer.scrollLeft = state.scrollLeft - walk;
                                }
                            }
                            render();
                            ticking = false;
                        });
                        ticking = true;
                    }
                });
                scrollContainer.addEventListener('pointerup', (e) => {
                    if (e.pointerType !== 'mouse') return;
                    state.isDragging = false;
                    scrollContainer.style.cursor = 'default';
                });
                scrollContainer.addEventListener('pointerleave', (e) => {
                    if (e.pointerType !== 'mouse') return;
                    state.isDragging = false;
                    state.hoverX = null;
                    scrollContainer.style.cursor = 'default';
                    render();
                });
                scrollContainer.addEventListener('scroll', () => {
                    updateNowButtonPosition();
                    window._preventBackNav = true;
                    clearTimeout(preventBackNavTimer);
                    preventBackNavTimer = setTimeout(() => { window._preventBackNav = false; }, 400);
                    if (!ticking) {
                        window.requestAnimationFrame(() => {
                            drawFixedOverlay();
                            render();
                            updateActiveDailyCard();
                            ticking = false;
                        });
                        ticking = true;
                    }
                }, { passive: true });
                if (window.navigation) {
                    navigation.addEventListener('navigate', (e) => {
                        if (e.navigationType === 'traverse' && window._preventBackNav) {
                            e.preventDefault();
                        }
                    });
                }

                scrollContainer.addEventListener('touchend', () => {
                    clearTimeout(scrollSnapTimer);
                    scrollSnapTimer = setTimeout(snapScroll, 200);
                });
                scrollContainer.addEventListener('mouseup', () => {
                    clearTimeout(scrollSnapTimer);
                    scrollSnapTimer = setTimeout(snapScroll, 200);
                });
                scrollContainer.addEventListener('scrollend', snapScroll);
            }

            function initScrollIndicator() {
                const metricsContainer = document.querySelector('.top-panel-metrics');
                const metricsDots = document.getElementById('metrics-dots');
                if (metricsContainer) {
                    initScrollIndicatorRef(metricsContainer, metricsDots);
                }
            }

            function startPulseLoop() {
                const pulseLoop = () => {
                    drawFixedOverlay();
                    requestAnimationFrame(pulseLoop);
                };
                requestAnimationFrame(pulseLoop);
            }
        }

        async function useMyLocation(force = false) {
            if (!force) {
                const loc = await storageService.get('lastLocation');
                const isDefault = loc && Math.abs(loc.lat - DEFAULT_COORDS.lat) < 0.001 && Math.abs(loc.lon - DEFAULT_COORDS.lon) < 0.001;
                if (loc && loc.lat && loc.lon && !isDefault) {
                    state.lat = loc.lat;
                    state.lon = loc.lon;
                    state.locationName = loc.name || "Ubicación Guardada";
                    updateLocationUI();
                    await loadWeather();
                    return;
                }
            }

            document.getElementById('app-wrapper').classList.add('loading');
            try {
                const pos = await getPosition();
                state.lat = pos.coords.latitude;
                state.lon = pos.coords.longitude;

                // Reverse geocoding
                try {
                    state.locationName = await geoService.reverseGeocode(state.lat, state.lon);
                } catch {
                    state.locationName = "Ubicación actual";
                }
            } catch (err) {
                console.warn("Geolocation failed, using default", err);
                state.lat = DEFAULT_COORDS.lat;
                state.lon = DEFAULT_COORDS.lon;
                state.locationName = DEFAULT_COORDS.name;
                // Si el error es por denegación, avisamos
                if (err.code === 1) {
                    console.warn("Permiso de ubicación denegado.");
                }
            }
            updateLocationUI();
            await loadWeather();
        }

        async function loadWeather() {
            const appWrapper = document.getElementById('app-wrapper');
            const errorMsg = document.getElementById('error-msg');

            appWrapper.classList.add('loading');
            errorMsg.style.display = 'none';

            try {
                state.hourlyData = [];
                await fetchWeatherData(7, 7, {
                  onResize: handleResize,
                  onUpdateLocationUI: updateLocationUI,
                  onCenterOnCurrentTime: centerOnCurrentTime
                });

                // Forzamos ocultar si llegamos aquí sin errores fatales
                if (errorMsg.style.display !== 'block') {
                    appWrapper.classList.remove('loading');
                    document.querySelectorAll('.skip-loading-btn').forEach(btn => btn.remove());
                }

                centerOnCurrentTime();
                minimapRenderer.draw(state, { PIXELS_PER_HOUR });
                render();
            } catch (err) {
                console.error("Error in loadWeather:", err);
                showError("Error inesperado al cargar los datos.");
            }
        }

        function getPosition() {
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error("Timeout obteniendo ubicación"));
                }, 4000);

                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        clearTimeout(timeout);
                        resolve(pos);
                    },
                    (err) => {
                        clearTimeout(timeout);
                        reject(err);
                    },
                    { timeout: 3500, enableHighAccuracy: false, maximumAge: 60000 }
                );
            });
        }

        function toggleTheme() {
            state.theme = state.theme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', state.theme);
            themeToggle.innerHTML = state.theme === 'dark' ? '<span class="material-symbols-outlined">light_mode</span>' : '<span class="material-symbols-outlined">dark_mode</span>';
            tiles.forEach(t => t.drawn = false);
            render();
            minimapRenderer.draw(state, { PIXELS_PER_HOUR });
        }

        function updateLocationUI() {
            document.getElementById('location-name').innerText = state.locationName;
            if (state.lat && state.lon) {
                storageService.set('lastLocation', {
                    lat: state.lat,
                    lon: state.lon,
                    name: state.locationName
                });
            }
        }

        // fetchWeatherData moved to src/domain/WeatherFetcher.js

        /**
         * RENDERIZADO
         */
        function drawTile(tile) {
            const ctx = tile.ctx;
            const xOffset = tile.index * TILE_WIDTH;
            const w = TILE_WIDTH;
            const h = cachedTileHeight || scrollContainer.clientHeight;
            const styles = getComputedStyle(document.documentElement);

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            ctx.clearRect(0, 0, w, h);
            ctx.save();
            ctx.translate(-xOffset, 0);

            drawSunnyBackground(ctx, xOffset, w, h, styles, true, PIXELS_PER_HOUR);
            drawNightOverlay(ctx, xOffset, w, h, PIXELS_PER_HOUR);
            drawNightShadow(ctx, xOffset, w, h, PIXELS_PER_HOUR);
            drawStarrySky(ctx, xOffset, w, h, PIXELS_PER_HOUR);
            drawGrid(ctx, xOffset, w, h);
            drawDayNames(ctx, xOffset, w, h, styles, PIXELS_PER_HOUR);
            drawClouds(ctx, xOffset, w, h, styles, PIXELS_PER_HOUR);
            drawUVSegments(ctx, xOffset, w, h, PIXELS_PER_HOUR); // Add UV segments
            drawPrecipitation(ctx, xOffset, w, h, styles, PIXELS_PER_HOUR, CONFIG.PIXELS_PER_MM);
            drawPrecipitationProbability(ctx, xOffset, w, h, styles, PIXELS_PER_HOUR);

            // Weather Phenomena
            drawWeatherPhenomena(ctx, xOffset, w, h, PIXELS_PER_HOUR);
            drawWind(ctx, xOffset, w, h, styles, PIXELS_PER_HOUR);

            drawTemperature(ctx, xOffset, w, h, styles, PIXELS_PER_HOUR);
            drawSunMarkersOnCanvas(ctx, xOffset, w, h, PIXELS_PER_HOUR);
            drawAxes(ctx, xOffset, w, h, styles, PIXELS_PER_HOUR);

            ctx.restore();
            tile.drawn = true;
        }

        function render() {
            if (!state.hourlyData.length) return;

            const scrollX = Math.floor(scrollContainer.scrollLeft);
            const viewportW = scrollContainer.clientWidth;
            // Add a 1-tile buffer on both sides to prevent blank areas during fast scrolling
            const startTile = Math.max(0, Math.floor(scrollX / TILE_WIDTH) - 1);
            const endTile = Math.floor((scrollX + viewportW) / TILE_WIDTH) + 1;

            for (let i = startTile; i <= endTile; i++) {
                if (tiles[i] && !tiles[i].drawn) {
                    drawTile(tiles[i]);
                }
            }

            minimapRenderer.updateViewport(state, { PIXELS_PER_HOUR });
            updateTopPanel();
            drawFixedOverlay();
        }

        function drawFixedOverlay() {
            if (document.getElementById('app-wrapper').classList.contains('loading')) return;
            if (!state.hourlyData.length) return;

            const w = fixedOverlayCanvas.clientWidth;
            const h = cachedTileHeight || scrollContainer.clientHeight;

            fixedOverlayCtx.clearRect(0, 0, fixedOverlayCanvas.clientWidth, fixedOverlayCanvas.clientHeight);

            // Calculate Exact Subpixel Scrubber Frame
            const activeX = scrollContainer.scrollLeft + 60;
            const drawX = 60;

            // 0 Degree Marker Line Label
            const y0 = normalizeY(0, -20, 40, h);
            
            // Adjust animated weather zone top limit
            const animatedWeatherZone = document.getElementById('animated-weather-zone');
            if (animatedWeatherZone) {
                // Ensure it's under the zero line
                animatedWeatherZone.style.top = Math.max(0, y0) + 'px';
            }

            fixedOverlayCtx.save();
            const isDark = state.theme === 'dark';
            const haloColor = isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)';
            
            // Dotted line on the left side
            // Match the right side: rgba(2, 136, 209, 0.4)
            fixedOverlayCtx.strokeStyle = getThemeColor('zeroLine', 'rgba(2, 136, 209, 0.4)');
            fixedOverlayCtx.setLineDash([2, 2]); 
            fixedOverlayCtx.lineWidth = 1;
            fixedOverlayCtx.beginPath();
            fixedOverlayCtx.moveTo(0, y0);
            fixedOverlayCtx.lineTo(60, y0);
            fixedOverlayCtx.stroke();
            fixedOverlayCtx.setLineDash([]);
            
            // Label rendering with halo
            fixedOverlayCtx.font = `bold 10px ${getThemeFont()}`;
            fixedOverlayCtx.textAlign = 'left';
            fixedOverlayCtx.textBaseline = 'middle';
            
            fixedOverlayCtx.shadowColor = haloColor;
            fixedOverlayCtx.shadowBlur = 4;
            fixedOverlayCtx.lineWidth = 3;
            fixedOverlayCtx.strokeStyle = haloColor;
            fixedOverlayCtx.strokeText('0°C', 20, y0 - 8);
            
            fixedOverlayCtx.shadowBlur = 0;
            fixedOverlayCtx.fillStyle = getThemeColor('zeroLineIcon', 'rgba(2, 136, 209, 0.8)'); // Sync with icon color
            fixedOverlayCtx.fillText('0°C', 20, y0 - 8);
            
            // Icon
            fixedOverlayCtx.font = '12px "Material Symbols Outlined"';
            
            fixedOverlayCtx.shadowColor = haloColor;
            fixedOverlayCtx.shadowBlur = 4;
            fixedOverlayCtx.strokeText(getThemeIcon('zeroLineIcon', 'ac_unit'), 4, y0 - 8);
            
            fixedOverlayCtx.shadowBlur = 0;
            fixedOverlayCtx.fillStyle = getThemeColor('zeroLineIcon', 'rgba(2, 136, 209, 0.8)');
            fixedOverlayCtx.fillText(getThemeIcon('zeroLineIcon', 'ac_unit'), 4, y0 - 8);
            fixedOverlayCtx.restore();

            // Cálculo de índice basado en el inicio de la hora (x = i * PPH)
            const floatIndex = activeX / PIXELS_PER_HOUR;
            const index = Math.floor(floatIndex);
            const progress = floatIndex - index;

            if (index >= 0 && index < state.hourlyData.length - 1) {
                const d1 = state.hourlyData[index];
                const d2 = state.hourlyData[index + 1];

                const { temp, apparent, clouds, precipProb } = interpolateScrubberData(d1, d2, progress);
                
                const currentData = state.hourlyData[index];
                
                fixedOverlayCtx.save();
                const walkPhase = (scrollContainer.scrollLeft % 80) / 80;
                updateWeatherZone(currentData, state, { haloColor, isDark, walkPhase, drawStickman });
                fixedOverlayCtx.restore();

                fixedOverlayCtx.save();
                fixedOverlayCtx.setLineDash([]);
                fixedOverlayCtx.font = `bold 10px ${getThemeFont()}`;
                fixedOverlayCtx.textAlign = 'left';
                fixedOverlayCtx.textBaseline = 'middle';
                fixedOverlayCtx.strokeStyle = '#fff';
                fixedOverlayCtx.lineWidth = 1.5;

                state.labelRects = [];

                // Pre-add UV label constraint at the top so other labels avoid it
                if (d1.uv > 0 && !d1.isNight) {
                    state.labelRects.push({
                        x: index * PIXELS_PER_HOUR - scrollContainer.scrollLeft, 
                        y: 0,
                        w: PIXELS_PER_HOUR,
                        h: 22,
                        isUV: true
                    });
                }

                // Add NOW button to collision detection
                const nowBtn = document.getElementById('now-btn');
                if (nowBtn && nowBtn.style.display !== 'none') {
                    const btnRect = nowBtn.getBoundingClientRect();
                    const canvasRect = fixedOverlayCanvas.getBoundingClientRect();
                    
                    const btnX = btnRect.left - canvasRect.left;
                    const btnY = btnRect.top - canvasRect.top;
                    
                    state.labelRects.push({
                        x: btnX,
                        y: btnY,
                        w: btnRect.width,
                        h: btnRect.height,
                        isNowBtn: true
                    });
                }

                const labelRects = state.labelRects;

                const drawPoint = (y, color, value, unit, shape = 'circle', icon = '', secondaryText = null, secondaryColor = null, secondaryIcon = '') => {
                  drawScrubberPoint(fixedOverlayCtx, y, color, value, unit, { shape, icon, secondaryText, secondaryColor, secondaryIcon, drawX, h, w, labelRects });
                };

                // 1. Temperatura
                const diff = Math.abs(temp - apparent);
                const showApparent = diff >= 1.5;
                            const tempColor = '#D94040';
                if (showApparent) {
                    const isCold = apparent <= temp;
                    const apparentColor = isCold ? '#4A9FD9' : '#E8734A';
                    drawPoint(normalizeY(temp, -20, 40, h), tempColor, `${Math.round(temp)}°C`, '', 'circle', getThemeIcon('scrubber.temp', 'device_thermostat'), `${Math.round(apparent)}°C`, apparentColor, 'emoji_people');
                } else {
                    drawPoint(normalizeY(temp, -20, 40, h), tempColor, `${Math.round(temp)}°C`, '', 'circle', getThemeIcon('scrubber.temp', 'device_thermostat'));
                }

                if (currentData && currentData.gusts > 35) {
                    let color = getThemeColor('gusts.normal', '#6B8DAD');
                    if (currentData.gusts > 50) {
                        color = getThemeColor('gusts.strong', '#E8734A');
                        if (currentData.gusts > 70) color = getThemeColor('gusts.extreme', '#D94040');
                    }
                    drawPoint(h - 35, color, currentData.gusts.toFixed(1), 'km/h', 'none', getThemeIcon('scrubber.gusts', 'air'));
                }

                const pVal = d1.precip;
                if (pVal > 0.01) {
                    const maxH = h * 0.9;
                    const barH = pVal * CONFIG.PIXELS_PER_MM;
                    const isBroken = barH > maxH;
                    const visualH = Math.min(maxH, barH);
                    const barY = h - visualH;
                    const isSnow = [71, 73, 75, 77, 85, 86].includes(d1.weatherCode);
                    const isThunder = [95, 96, 99].includes(d1.weatherCode);
                    let pColor = '#1976d2';
                    if (isSnow) pColor = '#000000';
                    else if (isThunder) pColor = '#5e35b1';
                    drawPoint(barY - 12, pColor, pVal.toFixed(1) + (isBroken ? ' (!)' : ''), ' mm', 'none', '');
                }

                const getProbY = (val) => h - (h * (val / 100));
                const py1 = getProbY(d1.precipProb);
                const py2 = getProbY(d2.precipProb);
                const t = progress;
                const probY = py1 * (1 - t) * (1 - t) * (1 + 2 * t) + py2 * t * t * (3 - 2 * t);
                const isSnowProb = [71, 73, 75, 77, 85, 86].includes(d1.weatherCode);
                const isThunderProb = [95, 96, 99].includes(d1.weatherCode);
                const probIcon = isSnowProb ? 'ac_unit' : isThunderProb ? 'bolt' : getThemeIcon('scrubber.prob', 'water_drop');
                let probColor = '#0288d1';
                if (isSnowProb) probColor = '#00bcd4';
                else if (isThunderProb) probColor = '#7e57c2';
                drawPoint(probY, probColor, Math.round(precipProb), '%', 'diamond', probIcon);

                const cloudY = h - (h * (clouds / 100));
                drawPoint(cloudY, '#475569', Math.round(clouds), '%', 'circle', getThemeIcon('scrubber.cloud', 'cloud'));

                updateUVBlock(d1, index, fixedOverlayCanvas, PIXELS_PER_HOUR);

                fixedOverlayCtx.restore();
            } else {
                const uvBlockDOM = document.getElementById('uv-active-block');
                if (uvBlockDOM) uvBlockDOM.style.display = 'none';
            }
        }

        function updateNowButtonPosition() {
            if (state.hourlyData.length === 0) return;
            const floatBtn = document.getElementById('floating-now-btn');
            
            const now = Date.now();
            const startTime = state.hourlyData[0].time;

            const nowX = dateToX(now, startTime, PIXELS_PER_HOUR);
            
            // DOM Playhead and Shadow directly mapped to wrapper coords
            const nowIndicator = document.getElementById('now-indicator');
            const pastShadow = document.getElementById('past-shadow');
            
            if (nowIndicator && pastShadow) {
                if (nowX > 0) {
                    nowIndicator.style.display = 'block';
                    nowIndicator.style.left = nowX + 'px';
                    
                    pastShadow.style.width = nowX + 'px';
                    const shadeAlpha = state.theme === 'dark' ? 0.5 : 0.15;
                    pastShadow.style.background = `linear-gradient(to right, rgba(0,0,0,${shadeAlpha}) 0%, rgba(0,0,0,${shadeAlpha}) calc(100% - 150px), rgba(0,0,0,0) 100%)`;
                } else {
                    nowIndicator.style.display = 'none';
                    pastShadow.style.width = '0px';
                }
            }

            if (!floatBtn) return;
            
            // Posición relativa al viewport del scroll
            const viewportX = nowX - scrollContainer.scrollLeft;
            const viewportWidth = scrollContainer.clientWidth;

            if (viewportX < 0 || viewportX > viewportWidth) {
                floatBtn.style.display = 'flex';
                if (viewportX < 0) {
                    floatBtn.style.left = '20px';
                    floatBtn.style.right = 'auto';
                    floatBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px;">chevron_left</span>';
                } else {
                    floatBtn.style.left = 'auto';
                    floatBtn.style.right = '20px';
                    floatBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px;">chevron_right</span>';
                }
            } else {
                floatBtn.style.display = 'none';
            }
        }

        /**
         * UTILIDADES
         */

        function updateTopPanel() {
          updateTopPanelRef({ scrollContainer, PIXELS_PER_HOUR });
        }

        function handleResize() {
            if (!scrollContainer) return;
            PIXELS_PER_HOUR = window.innerWidth < 600 ? 50 : 60;
            TILE_WIDTH = window.innerWidth < 600 ? 720 : CONFIG.TILE_WIDTH;
            state.dpr = getDPR();

            const containerRect = scrollContainer.getBoundingClientRect();
            const containerH = Math.ceil(containerRect.height) + 1;
            cachedTileHeight = containerH;
            const totalWidth = state.hourlyData.length * PIXELS_PER_HOUR;

            const canvasWrapper = document.getElementById('canvas-wrapper');
            if (canvasWrapper) {
                canvasWrapper.style.width = totalWidth + 'px';

                // Tiling logic
                const numTiles = Math.ceil(totalWidth / TILE_WIDTH);

                // Cleanup old tiles
                tiles.forEach(t => t.canvas.remove());
                tiles = [];

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

                    const ctx = canvas.getContext('2d', { willReadFrequently: true }) || canvas.getContext('2d');
                    ctx.scale(state.dpr, state.dpr);
                    tiles.push({ canvas, ctx, index: i, drawn: false });
                }
            }

            minimapRenderer.setCanvasSize(state);

            const chartArea = document.getElementById('chart-area');
            fixedOverlayCanvas.width = chartArea.clientWidth * state.dpr;
            fixedOverlayCanvas.height = chartArea.clientHeight * state.dpr;
            fixedOverlayCtx.resetTransform();
            fixedOverlayCtx.scale(state.dpr, state.dpr);

            minimapRenderer.draw(state, { PIXELS_PER_HOUR });
            render();
        }

        function centerOnCurrentTime(behavior = 'auto') {
            if (state.hourlyData.length === 0) return;
            const now = Date.now();
            const startTime = state.hourlyData[0].time;

            const exactX = dateToX(now, startTime, PIXELS_PER_HOUR);

            // Centramos exactX en la línea de referencia fija (scrollLeft + 60)
            const targetLeft = Math.max(0, exactX - 60);
            if (behavior === 'smooth') {
                scrollContainer.scrollTo({ left: targetLeft, behavior: 'smooth' });
            } else {
                scrollContainer.scrollLeft = targetLeft;
            }
            state.hoverX = null;
            render();
        }

        function showError(msg) {
            const errDiv = document.getElementById('error-msg');
            errDiv.innerHTML = `
                <div style="margin-bottom: 15px;">${msg}</div>
                <button onclick="document.getElementById('app-wrapper').classList.remove('loading');document.querySelectorAll('.skip-loading-btn').forEach(b=>b.remove());this.closest('#error-msg').style.display='none'"
                        style="background: #666; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
                    Cerrar y ver app
                </button>
            `;
            errDiv.style.display = 'block';
        }

        function showRefreshToast() {
            const toast = document.getElementById('refresh-toast');
            if (!toast) return;
            toast.textContent = t('config.dataUpdated') || 'Datos actualizados';
            toast.style.display = 'block';
            requestAnimationFrame(() => toast.classList.add('visible'));
            setTimeout(() => {
                toast.classList.remove('visible');
                setTimeout(() => { toast.style.display = 'none'; }, 300);
            }, 2000);
        }

        const onClearCache = async () => {
            clearWeatherCache();
            try { storageService.db?.close(); } catch {}
            await clearCacheAndReload();
        };

        const swHandlers = registerSW();
        swHandlers.onUpdate = () => showUpdateToast(() => {
            checkAppVersion((remoteVersion) => {
                showChangelogModal(remoteVersion, onClearCache);
            });
        });
        handleInstallPrompt();
        checkAppVersion((remoteVersion) => {
            showChangelogModal(remoteVersion, onClearCache);
        });
