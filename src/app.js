/**
         * CONFIGURACIÓN Y ESTADO
         */
import { state, CONFIG, getDPR } from './store.js';
import { storageService } from './services/StorageService.js';
import { getThemeColor, getThemeIcon, getThemeFont, loadChartTheme, applyThemeDOM } from './theme.js';
import { getLocale, setLanguage, getLanguage, applyTranslations, t } from './utils/i18n.js';
import { weatherService } from './services/WeatherService.js';
import { geoService } from './services/GeoService.js';
import { generateDailyCards, updateActiveDailyCard, getWeatherIconSVG } from './ui/DailyCards.js';
import { processData } from './services/DataProcessor.js';
import { generateMockData } from './services/MockData.js';
import { getAQIInfo, getPollenText, getAggregatedPollenLevel, getPollenLevelByType } from './services/AqiManager.js';
import { drawAQIRadar } from './ui/AqiRadar.js';
import { drawPollenRadar } from './ui/PollenRadar.js';
import { getWeatherDescription } from './utils/weather.js';
import { showChangelogModal, initChangelog } from './ui/ChangelogModal.js';
import { registerSW, handleInstallPrompt, showUpdateToast, checkAppVersion, clearCacheAndReload } from './utils/pwa.js';
import { hexToRgb } from './utils/color.js';
import { dateToX, formatTooltipTime } from './utils/time.js';
import { normalizeY } from './utils/math.js';
import { drawHumidity, drawWind, drawTemperature } from './render/MetricsRenderer.js';
import { drawClouds, drawPrecipitation, drawPrecipitationProbability } from './render/AtmosphereRenderer.js';
import { drawGrid, drawDayNames, drawAxes } from './render/GridRenderer.js';
import { drawWeatherPhenomena, drawStarrySky, drawUVSegments, drawSunMarkersOnCanvas, drawSunnyBackground, drawNightOverlay, drawNightShadow } from './render/BackgroundRenderer.js';
import { drawStickman } from './render/StickmanRenderer.js';
import { initMapModal } from './ui/MapSelector.js';
import { initFavoritesModal } from './ui/FavoritesModal.js';
import { initYearInPixels } from './ui/YearInPixels.js';
import { openBottomSheet, closeBottomSheet, onSheetClose } from './ui/BottomSheet.js';
import { initScrollIndicator } from './ui/ScrollIndicator.js';
import { initPullToRefresh } from './ui/PullToRefresh.js';
import { initSpfModal } from './ui/SpfModal.js';
import { generateAlerts, renderAlerts } from './utils/AlertEngine.js';
import { initTooltipManager } from './ui/TooltipManager.js';
import { MinimapRenderer } from './render/MinimapRenderer.js';

let PIXELS_PER_HOUR = state.PIXELS_PER_HOUR;
const CHART_HEIGHT = CONFIG.CHART_HEIGHT;
const MINIMAP_HEIGHT = CONFIG.MINIMAP_HEIGHT;
const DEFAULT_COORDS = CONFIG.DEFAULT_COORDS;
const CACHE_DURATION = CONFIG.CACHE_DURATION;

let weatherCache = new Map();

        let minimapCanvas, minimapCtx;
        let fixedOverlayCanvas, fixedOverlayCtx;
        let tiles = [];
        let cachedTileHeight = 0;
        let TILE_WIDTH = window.innerWidth < 600 ? 720 : 1440;
        let scrollContainer, themeToggle;
        let minimapRenderer;
        let onClearCache;

        let searchTimeout = null;
        let ticking = false;
        let preventBackNavTimer = null;
        const PIXELS_PER_MM = 10;

        /**
         * INICIALIZACIÓN
         */
        window.addEventListener('DOMContentLoaded', init);
        window.addEventListener('resize', handleResize);

        async function init() {
            await storageService.init();
            
            // Migrate localstorage if needed
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
                    try { await storageService.set('lastLocation', JSON.parse(lastLoc)); } catch (e) {}
                }
                await storageService.set('chartTheme', localStorage.getItem('chart_theme') || 'default');
                await storageService.set('viewMode', localStorage.getItem('view_mode') || 'minimap');
                
                // Clear migrated items to avoid re-migration
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

            // PWA Standalone Mode Detection
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
            if (isStandalone) {
                document.documentElement.classList.add('pwa-standalone');
            }
            window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
                document.documentElement.classList.toggle('pwa-standalone', e.matches);
            });

            // Network Status Listeners
            const updateNetworkStatus = () => {
                const isOnline = navigator.onLine;
                document.documentElement.classList.toggle('app-offline', !isOnline);
            };
            window.addEventListener('online', updateNetworkStatus);
            window.addEventListener('offline', updateNetworkStatus);
            updateNetworkStatus();

                       // Pull To Refresh Logic
            initPullToRefresh({
                onRefresh: async () => {
                    weatherCache.clear();

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
                        await loadWeather();
                    } catch (e) {
                        console.error('PTR refresh failed:', e);
                    }
                }
            });

            // Block zoom/pinch on iOS
            document.addEventListener('touchstart', (e) => {
                if (e.touches.length > 1) {
                    e.preventDefault();
                }
            }, { passive: false });

            // SPF Modal Logic
            initSpfModal();

            const pollenWarningIcon = document.getElementById('pollen-warning-icon');
            const pollenModal = document.getElementById('pollen-modal');
            const closePollenBtn = document.getElementById('close-pollen-btn');
            
            if (pollenWarningIcon && pollenModal) {
                pollenWarningIcon.addEventListener('click', () => {
                    openBottomSheet('pollen-modal');
                });
            }

            const aqiWarningIcon = document.getElementById('aqi-warning-icon');
            const aqiModal = document.getElementById('aqi-modal');
            const closeAqiBtn = document.getElementById('close-aqi-btn');
            
            if (aqiWarningIcon && aqiModal) {
                aqiWarningIcon.addEventListener('click', () => {
                    openBottomSheet('aqi-modal');
                });
            }

            document.addEventListener('gesturestart', (e) => {
                e.preventDefault();
            }, { passive: false });

            // mainCanvas ya no se usa como un único canvas gigante, sino que usaremos tiles.
            // Pero mantendremos la referencia para compatibilidad si es necesario o la eliminamos.

            minimapCanvas = document.getElementById('minimap-canvas');
            minimapCtx = minimapCanvas.getContext('2d', { alpha: true });
            fixedOverlayCanvas = document.getElementById('fixed-overlay-canvas');
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

            // Initialize map modal
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

            // Agrega botón principal para mi ubicación
            const mainLocBtn = document.getElementById('main-current-location-btn');
            if (mainLocBtn) {
                mainLocBtn.addEventListener('click', async () => {
                    const originalHTML = mainLocBtn.innerHTML;
                    mainLocBtn.innerHTML = '<span class="loader" style="width:16px;height:16px;border-width:2px;display:block;"></span>';
                    await useMyLocation(true);
                    mainLocBtn.innerHTML = originalHTML;
                });
            }

            // Initialize UV interaction block once
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
                uvBlock.style.fontSize = '8.5px'; // Will be responsive to theme if needed, but keeping small size
                canvasWrapper.appendChild(uvBlock);
            }
            try {
                // Location tooltip logic for mobile/desktop
                const locationGroup = document.querySelector('.location-group');
                if (locationGroup) {
                    const checkOverflow = () => {
                        const locName = document.getElementById('location-name');
                        const summary = document.getElementById('weather-summary');
                        const isOverflowing = (locName.scrollWidth > locName.offsetWidth) || 
                                            (summary.scrollWidth > summary.offsetWidth);
                        locationGroup.classList.toggle('has-overflow', isOverflowing);
                        locationGroup.style.cursor = isOverflowing ? 'pointer' : 'default';
                        return isOverflowing;
                    };

                    locationGroup.addEventListener('mouseenter', checkOverflow);
                    locationGroup.addEventListener('click', (e) => {
                        if (window.innerWidth <= 600) {
                            locationGroup.classList.toggle('active');
                            // Auto-hide after 3 seconds on mobile
                            if (locationGroup.classList.contains('active')) {
                                setTimeout(() => locationGroup.classList.remove('active'), 3000);
                            }
                        }
                    });
                }
                
                const alertsContainer = document.getElementById('alerts-container');
                if (alertsContainer) {
                    alertsContainer.style.pointerEvents = 'auto';
                    alertsContainer.addEventListener('click', (e) => {
                        const isMobile = window.innerWidth <= 600;
                        if (isMobile) {
                            const tooltip = document.getElementById('alerts-tooltip');
                            if (tooltip) {
                                const isVisible = tooltip.style.opacity === '1';
                                
                                // Cerrar otros
                                document.querySelectorAll('.custom-tooltip').forEach(t => t.style.display = '');
                                
                                if (!isVisible) {
                                    alertsContainer.classList.add('active');
                                    // Use fixed positioning like other cards to avoid left-side cutoff
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
                        if (window.innerWidth > 600) {
                            alertsContainer.classList.add('active');
                        }
                    });
                    alertsContainer.addEventListener('mouseleave', () => {
                        if (window.innerWidth > 600) {
                            alertsContainer.classList.remove('active');
                        }
                    });
                }

                // Theme setup
                themeToggle.addEventListener('click', toggleTheme);

                // Settings theme toggle sync
                const settingsThemeToggle = document.getElementById('settings-theme-toggle');
                if (settingsThemeToggle) {
                    settingsThemeToggle.checked = state.theme === 'dark';
                    settingsThemeToggle.addEventListener('change', () => {
                        const targetTheme = settingsThemeToggle.checked ? 'dark' : 'light';
                        if (state.theme !== targetTheme) toggleTheme();
                    });
                }
                // Keep settings toggle in sync when theme changes externally
                const origToggleTheme = toggleTheme;
                const wrappedToggleTheme = function() {
                    origToggleTheme();
                    if (settingsThemeToggle) {
                        settingsThemeToggle.checked = state.theme === 'dark';
                    }
                };
                // eslint-disable-next-line no-func-assign
                toggleTheme = wrappedToggleTheme;

                // Collapsible sections
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

                const floatingNowBtn = document.getElementById('floating-now-btn');
                if (floatingNowBtn) floatingNowBtn.addEventListener('click', centerOnCurrentTime);

                // Modal logic - Info Sheet (uses openBottomSheet for mobile and desktop)
                const btnInfo = document.getElementById('btn-info');
                const infoModal = document.getElementById('info-modal');
                const closeInfoBtn = document.getElementById('close-info-btn');
                let closeInfoSheet = () => {};
                if (btnInfo && infoModal) {
                    btnInfo.addEventListener('click', () => {
                        closeInfoSheet = openBottomSheet('info-modal', 'info-sheet-backdrop', 'info-sheet-content');
                    });
                    closeInfoBtn.addEventListener('click', () => {
                        closeInfoSheet();
                    });
                }

                initChangelog(() => {
                    if (closeInfoSheet) closeInfoSheet();
                });

                // I18n Logic
                const langCards = document.querySelectorAll('.lang-card');
                const updateLangCardsUI = (lang) => {
                    langCards.forEach(card => {
                        if (card.dataset.value === lang) {
                            card.style.borderColor = '#3b82f6';
                            card.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                        } else {
                            card.style.borderColor = 'var(--grid-color)';
                            card.style.backgroundColor = 'var(--card-bg)';
                        }
                    });
                };
                
                if (langCards.length > 0) {
                    updateLangCardsUI(getLanguage());
                    langCards.forEach(card => {
                        card.addEventListener('click', async () => {
                            const newLang = card.dataset.value;
                            if (newLang === getLanguage()) return;
                            const confirmed = await showConfirm(
                                t('config.confirmAction', 'Confirmar'),
                                t('config.langChangeConfirm', '¿Cambiar idioma? La aplicación se actualizará.')
                            );
                            if (!confirmed) return;
                            setLanguage(newLang);
                            updateLangCardsUI(newLang);
                            applyTranslations();
                            if (state.rawForecast && state.rawAQI) {
                                processData(state.rawForecast, state.rawAQI, false);
                                updateTopPanel();
                                generateDailyCards();
                            }
                            // Redraw graphics requiring translation
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

                // Theme Logic — Bottom Sheet Selector
                const themeSelectTrigger = document.getElementById('theme-select-trigger');
                const themeCurrentLabel = document.getElementById('theme-current-label');
                const themeCurrentSwatch = document.getElementById('theme-current-swatch');
                const themeOptionsContainer = document.getElementById('theme-options-container');

                const updateThemeUI = (themeId, themeName, themeColor) => {
                    if (themeCurrentLabel) themeCurrentLabel.textContent = themeName;
                    if (themeCurrentSwatch) themeCurrentSwatch.style.background = themeColor || 'var(--accent-temp)';
                    const opts = document.querySelectorAll('.theme-option');
                    opts.forEach(o => o.classList.toggle('active', o.dataset.value === themeId));
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
                
                // Stickman Thresholds Logic — Range Sliders
                const initSlider = (id, stateKey, displayId, onchange) => {
                    const slider = document.getElementById(id);
                    const display = document.getElementById(displayId);
                    if (!slider) return;
                    const val = state.stickmanThresholds[stateKey];
                    slider.value = val;
                    if (display) display.textContent = val;
                    slider.addEventListener('input', (e) => {
                        const v = e.target.value;
                        if (display) display.textContent = v;
                    });
                    slider.addEventListener('change', (e) => {
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v)) {
                            state.stickmanThresholds[stateKey] = v;
                            storageService.set('stickmanThresholds', state.stickmanThresholds);
                            document.getElementById('slider-' + stateKey + '-val').textContent = v;
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

                // Skin Type Cards
                const skinCards = document.querySelectorAll('.skin-card');
                if (skinCards.length > 0) {
                    const updateActiveCard = () => {
                        const activeVal = state.skinType || 2;
                        skinCards.forEach(card => {
                            if (parseInt(card.dataset.value) === activeVal) {
                                card.classList.add('active');
                            } else {
                                card.classList.remove('active');
                            }
                        });
                    };
                    updateActiveCard();
                    skinCards.forEach(card => {
                        card.addEventListener('click', () => {
                            const val = parseInt(card.dataset.value);
                            if (!isNaN(val)) {
                                state.skinType = val;
                                storageService.set('skinType', val);
                                updateActiveCard();
                                render();
                            }
                        });
                    });
                }

                // Function to show confirm modal
                const showConfirm = (title, message, onOk) => {
                    const titleEl = document.getElementById('confirm-title');
                    const msgEl = document.getElementById('confirm-message');
                    const cancelBtn = document.getElementById('confirm-cancel-btn');
                    const okBtn = document.getElementById('confirm-ok-btn');
                    
                    if (titleEl) titleEl.textContent = title;
                    if (msgEl) msgEl.textContent = message;
                    
                    if (cancelBtn) cancelBtn.textContent = t('config.cancel') || 'Cancelar';
                    if (okBtn) okBtn.textContent = t('config.accept') || 'Aceptar';
                    
                    const newOk = okBtn.cloneNode(true);
                    okBtn.parentNode.replaceChild(newOk, okBtn);
                    const newCancel = cancelBtn.cloneNode(true);
                    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
                    
                    const closeFn = openBottomSheet('confirm-modal', 'confirm-sheet-backdrop');
                    
                    let confirmed = false;
                    
                    newCancel.addEventListener('click', () => {
                        closeFn();
                    });
                    
                    newOk.addEventListener('click', () => {
                        if (confirmed) return;
                        confirmed = true;
                        closeFn();
                        onOk();
                    });
                };

                // Force refresh
                const forceRefreshBtn = document.getElementById('force-refresh-btn');
                if (forceRefreshBtn) {
                    forceRefreshBtn.addEventListener('click', () => {
                        showConfirm(
                            t('config.clearCache') || "Limpiar caché", 
                            t('config.clearCacheMsg') || "¿Estás seguro de que quieres limpiar la caché y recargar la aplicación?", 
                            async () => {
                                state.isFetching = true;
                                await onClearCache();
                            }
                        );
                    });
                }

                // Clear persisted data
                const clearDataBtn = document.getElementById('clear-data-btn');
                if (clearDataBtn) {
                    clearDataBtn.addEventListener('click', () => {
                        showConfirm(
                            t('config.clearData') || "Borrar datos guardados", 
                            t('config.clearDataMsg') || "¿Estás seguro de que quieres eliminar todos los datos persistentes (favoritos, configuraciones)? Esta acción no se puede deshacer.", 
                            async () => {
                                state.isFetching = true;
                                const { favoritesService } = await import('./services/FavoritesService.js');
                                await favoritesService.clear();
                                try { storageService.db?.close(); } catch(e) {}
                                await new Promise((resolve) => {
                                    const req = indexedDB.deleteDatabase("WeatherHistDB");
                                    req.onsuccess = () => resolve();
                                    req.onerror = () => resolve();
                                    req.onblocked = () => resolve();
                                });
                                try {
                                    localStorage.clear();
                                } catch(e) {}
                                const url = new URL(location.href);
                                url.searchParams.set('_t', Date.now());
                                location.href = url.toString();
                            }
                        );
                    });
                }

                // Removed obsolete suggestion box closing logic

                // Tooltip Manager (desktop hover + mobile click)
                initTooltipManager();

                // Iniciamos con un timeout de seguridad para la carga
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

                // Minimap drag and drop
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
                    // Initialize on start
                    updateViewMode();
                }

                // Drag and drop for daily cards
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
                        const walk = (x - dailyStartX) * 2; // Scroll-fast
                        dailyCardsContainer.scrollLeft = dailyScrollLeft - walk;
                    });

                    window.addEventListener('pointerup', () => {
                        isDailyDragging = false;
                        dailyCardsContainer.style.cursor = 'pointer';
                    });
                }

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

                window.addEventListener('mouseup', () => {
                    minimapRenderer.isDragging = false;
                });

                window.addEventListener('touchmove', (e) => {
                    if (minimapRenderer.isDragging) scrollContainer.scrollLeft = minimapRenderer.handleClick(e.touches[0].clientX, state, { PIXELS_PER_HOUR });
                }, { passive: true });

                window.addEventListener('touchend', () => {
                    minimapRenderer.isDragging = false;
                });
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
                            // Calculamos hoverX relativo al contenedor total
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
                    // Update DOM elements synchronously for zero-lag on iOS
                    updateNowButtonPosition();

                    // Flag active horizontal scroll to prevent Android back gesture
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

                // Navigation API: prevent system back gesture during horizontal scroll
                if (window.navigation) {
                    navigation.addEventListener('navigate', (e) => {
                        if (e.navigationType === 'traverse' && window._preventBackNav) {
                            e.preventDefault();
                        }
                    });
                }

                const metricsContainer = document.querySelector('.top-panel-metrics');
                const scrollIndLeft = document.querySelector('.scroll-indicator-left');
                const scrollIndRight = document.querySelector('.scroll-indicator-right');
                const metricsDots = document.getElementById('metrics-dots');
                
                if (metricsContainer && scrollIndLeft && scrollIndRight) {
                    window.updateScrollIndicator = initScrollIndicator(metricsContainer, scrollIndLeft, scrollIndRight, metricsDots);
                }

                handleResize();
                await useMyLocation();

                // Iniciar bucle de renderizado para el overlay pulsante
                const pulseLoop = () => {
                    drawFixedOverlay();
                    requestAnimationFrame(pulseLoop);
                };
                requestAnimationFrame(pulseLoop);
            } catch (err) {
                console.error("Initialization error:", err);
                showError("Error al iniciar la aplicación.");
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
                } catch (e) {
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
                await fetchWeatherData(7, 7);

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

        /**
         * CARGA DE DATOS
         */
        async function fetchWeatherData(pastDays, forecastDays) {
            const cacheKey = `${state.lat.toFixed(4)},${state.lon.toFixed(4)},${pastDays},${forecastDays}`;
            const now = Date.now();

            if (weatherCache.has(cacheKey)) {
                const cached = weatherCache.get(cacheKey);
                if (now - cached.timestamp < CACHE_DURATION) {
                    console.log("Usando datos en caché para:", cacheKey);
                    state.rawForecast = cached.forecastData;
                    state.rawAQI = cached.aqiData;
                    processData(cached.forecastData, cached.aqiData, centerOnCurrentTime);
                    handleResize();
                    return;
                }
            }

            if (state.isFetching) return;
            state.isFetching = true;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            try {
                const { forecastData, aqiData } = await weatherService.getWeatherData(state.lat, state.lon, pastDays, forecastDays, controller.signal);

                clearTimeout(timeoutId);

                // Guardar en caché
                weatherCache.set(cacheKey, {
                    timestamp: now,
                    forecastData,
                    aqiData
                });

                state.rawForecast = forecastData;
                state.rawAQI = aqiData;

                processData(forecastData, aqiData, centerOnCurrentTime);
                handleResize();
            } catch (err) {
                clearTimeout(timeoutId);
                console.error("fetchWeatherData error:", err);

                // Fallback: Si hay datos en caché (aunque estén expirados), los usamos
                if (weatherCache.has(cacheKey)) {
                    console.warn("API falló, usando datos expirados de la caché");
                    const cached = weatherCache.get(cacheKey);
                    state.rawForecast = cached.forecastData;
                    state.rawAQI = cached.aqiData;

                    if (!state.locationName.endsWith('*')) {
                        state.locationName += '*';
                        updateLocationUI();
                    }

                    processData(cached.forecastData, cached.aqiData, centerOnCurrentTime);
                    handleResize();
                } else {
                    // Fallback: Si no hay nada en caché, generamos datos simulados
                    console.warn("API falló y no hay caché, generando datos simulados");
                    const mock = generateMockData(pastDays, forecastDays);
                    state.rawForecast = mock.forecastData;
                    state.rawAQI = mock.aqiData;

                    state.locationName = "Ninguna";
                    updateLocationUI();

                    processData(mock.forecastData, mock.aqiData, centerOnCurrentTime);
                    handleResize();
                }
            } finally {
                state.isFetching = false;
            }
        }

                // ProcessData moved to DataProcessor.js

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
            drawGrid(ctx, xOffset, w, h, styles, PIXELS_PER_HOUR);
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
            drawAxes(ctx, xOffset, w, h, styles, PIXELS_PER_HOUR, CHART_HEIGHT);

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

        let lastNowBtnX = -1;
        let lastNowBtnMini = null;

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

                const interpolate = (v1, v2) => v1 + (v2 - v1) * progress;

                // Cloud data is drawn using bezierCurveTo(cx, y1, cx, y2, x2, y2)
                // We must find the correct 't' where B_x(t) = progress.
                let tBezier = 0.5, minT = 0, maxT = 1;
                for (let i = 0; i < 10; i++) {
                    let bx = 1.5 * tBezier - 1.5 * tBezier * tBezier + tBezier * tBezier * tBezier;
                    if (bx < progress) minT = tBezier; else maxT = tBezier;
                    tBezier = (minT + maxT) / 2;
                }
                // then B_y(t) is linear interpolation over t^2(3-2t)
                const ty = tBezier * tBezier * (3 - 2 * tBezier);
                const interpolateBezier = (v1, v2) => v1 + (v2 - v1) * ty;

                const temp = interpolate(d1.temp, d2.temp);
                const apparent = interpolate(d1.apparent, d2.apparent);
                const clouds = interpolateBezier(d1.clouds, d2.clouds);
                const precipProb = interpolateBezier(d1.precipProb, d2.precipProb);
                
                // Stickman & Weather Icon
                fixedOverlayCtx.save();
                
                // Weather Icon update
                const currentData = state.hourlyData[index];
                let summaryIconName = 'clear_day';
                if (currentData) {
                    const code = currentData.weatherCode;
                    if (code >= 1 && code <= 3) summaryIconName = 'cloud';
                    else if (code === 45 || code === 48) summaryIconName = 'foggy';
                    else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) summaryIconName = 'rainy';
                    else if ((code >= 71 && code <= 77) || code === 85 || code === 86) summaryIconName = 'ac_unit';
                    else if (code >= 95) summaryIconName = 'thunderstorm';
                }
                
                const summaryIconDOM = document.getElementById('summary-icon-dom');
                if (summaryIconDOM) {
                    if (summaryIconDOM.innerText !== summaryIconName) {
                        summaryIconDOM.innerText = summaryIconName;
                    }
                    // Setup shadow color based on haloColor
                    summaryIconDOM.style.textShadow = `0 0 4px ${haloColor}, 0 0 6px ${haloColor}`;
                    summaryIconDOM.style.color = isDark ? '#f8fafc' : '#1e293b';
                }
                
                // Stickman
                const walkPhase = (scrollContainer.scrollLeft % 80) / 80;
                let isWindy = false;
                if (currentData) isWindy = currentData.gusts >= state.stickmanThresholds.wind;
                const isNight = currentData ? !!currentData.isNight : false;
                
                const stickmanCanvas = document.getElementById('stickman-canvas');
                if (stickmanCanvas) {
                    const sCtx = stickmanCanvas.getContext('2d');
                    sCtx.clearRect(0, 0, stickmanCanvas.width, stickmanCanvas.height);
                    drawStickman(
                        sCtx, 
                        40, 
                        80, // sitting at bottom of 80x80 canvas
                        walkPhase, 
                        apparent, 
                        currentData ? currentData.weatherCode : 0, 
                        isWindy, 
                        isDark,
                        isNight,
                        state.stickmanThresholds,
                        currentData ? currentData.precip : 0,
                        currentData ? currentData.clouds : 0
                    );
                }

                // Update new DOM elements
                const aqiWarningIcon = document.getElementById('aqi-warning-icon');
                const pollenWarningIcon = document.getElementById('pollen-warning-icon');
                const spfInfoContainer = document.getElementById('spf-info-container');
                const spfValueText = document.getElementById('spf-value-text');

                if (currentData && aqiWarningIcon && pollenWarningIcon && spfInfoContainer && spfValueText) {
                    // Pollen Risk
                    if (currentData.pollen > 10) {
                        pollenWarningIcon.style.display = 'block';
                        if (currentData.pollen <= 50) pollenWarningIcon.style.color = '#fbbf24'; // Yellow
                        else if (currentData.pollen <= 100) pollenWarningIcon.style.color = '#ef4444'; // Red
                        else pollenWarningIcon.style.color = '#9333ea'; // Purple
                    } else {
                        pollenWarningIcon.style.display = 'none';
                    }

                    // AQI Risk
                    if (currentData.aqi !== null && currentData.aqi >= 101) {
                        aqiWarningIcon.style.display = 'block';
                        if (currentData.aqi <= 150) aqiWarningIcon.style.color = '#f97316'; // Orange
                        else if (currentData.aqi <= 200) aqiWarningIcon.style.color = '#ef4444'; // Red
                        else if (currentData.aqi <= 300) aqiWarningIcon.style.color = '#9333ea'; // Purple
                        else aqiWarningIcon.style.color = '#831843'; // Maroon
                    } else {
                        aqiWarningIcon.style.display = 'none';
                    }

                    // SPF Info
                    const uv = currentData.uv || 0;
                    if (uv >= 3) {
                        spfInfoContainer.style.display = 'flex';
                        let spfText = '';
                        if (uv >= 8) spfText = '50+';
                        else if (uv >= 6) spfText = '50';
                        else if (uv >= 3) spfText = '30';
                        
                        spfValueText.innerText = spfText;
                        
                        // We'll manage the onclick listener logic independently, just store data attributes
                        spfInfoContainer.dataset.uv = uv;
                    } else if (uv > 0 && state.skinType <= 2) {
                        // People with skin type I or II might need SPF 15 for UV 1-2
                        spfInfoContainer.style.display = 'flex';
                        spfValueText.innerText = '15';
                        spfInfoContainer.dataset.uv = uv;
                    } else {
                        spfInfoContainer.style.display = 'none';
                        spfInfoContainer.dataset.uv = uv;
                    }

                    const riskIconsRow = document.getElementById('risk-icons-row');
                    if (riskIconsRow) {
                        if (pollenWarningIcon.style.display !== 'none' || aqiWarningIcon.style.display !== 'none') {
                            riskIconsRow.style.display = 'flex';
                        } else {
                            riskIconsRow.style.display = 'none';
                        }
                    }

                    let visibleIcons = 1;
                    if (pollenWarningIcon.style.display !== 'none') visibleIcons++;
                    if (aqiWarningIcon.style.display !== 'none') visibleIcons++;
                    if (spfInfoContainer.style.display !== 'none') visibleIcons++;

                    const animatedWeatherZone = document.getElementById('animated-weather-zone');
                    if (animatedWeatherZone) {
                        animatedWeatherZone.style.zIndex = visibleIcons > 2 ? '21' : '15';
                    }
                }
                
                fixedOverlayCtx.restore();

                fixedOverlayCtx.save();
                fixedOverlayCtx.setLineDash([]);
                fixedOverlayCtx.font = `bold 10px ${getThemeFont()}`;
                fixedOverlayCtx.textAlign = 'left';
                fixedOverlayCtx.textBaseline = 'middle';
                fixedOverlayCtx.strokeStyle = '#fff';
                fixedOverlayCtx.lineWidth = 1.5;

                const drawPoint = (y, color, value, unit, shape = 'circle', icon = '', secondaryText = null, secondaryColor = null, secondaryIcon = '') => {
                    if (y >= h - 5) return; // Do not draw if it's at the bottom

                    // The point goes at the exact Y coordinate
                    fixedOverlayCtx.fillStyle = color;
                    fixedOverlayCtx.beginPath();
                    if (shape === 'circle') {
                        fixedOverlayCtx.arc(drawX, y, 4, 0, Math.PI * 2);
                        fixedOverlayCtx.fill();
                        fixedOverlayCtx.stroke();
                    } else if (shape === 'diamond') {
                        fixedOverlayCtx.moveTo(drawX, y - 5);
                        fixedOverlayCtx.lineTo(drawX + 5, y);
                        fixedOverlayCtx.lineTo(drawX, y + 5);
                        fixedOverlayCtx.lineTo(drawX - 5, y);
                        fixedOverlayCtx.closePath();
                        fixedOverlayCtx.fill();
                        fixedOverlayCtx.stroke();
                    } else if (shape === 'square') {
                        fixedOverlayCtx.rect(drawX - 3, y - 3, 6, 6);
                        fixedOverlayCtx.fill();
                        fixedOverlayCtx.stroke();
                    }
                    // If shape === 'none', do nothing for the shape

                    // Do not show values of 0 or very close to 0 to avoid noise and overlapping
                    if (value !== null && (typeof value === 'string' || Math.abs(value) > 0.01)) {
                        const bgH = secondaryText ? 32 : 22; // Taller for secondary text
                        let constrainedY = Math.max(0, Math.min(h - bgH, y));
                        const text = `${value}${unit}`;

                        fixedOverlayCtx.save();
                        fixedOverlayCtx.font = `bold 13px ${getThemeFont()}`;
                        const measureStr = text.replace(/[\d]/g, '0');
                        const textMetrics = fixedOverlayCtx.measureText(measureStr);
                        const iconWidth = icon ? (fixedOverlayCtx.font = '14px "Material Symbols Outlined"', fixedOverlayCtx.measureText(icon).width + 4) : 0;
                        fixedOverlayCtx.font = `bold 11px ${getThemeFont()}`;
                        const secMetrics = secondaryText ? (fixedOverlayCtx.font = `bold 11px ${getThemeFont()}`, fixedOverlayCtx.measureText(secondaryText.replace(/[\d]/g, '0'))) : { width: 0 };
                        const secIconWidth = secondaryIcon ? (fixedOverlayCtx.font = '12px "Material Symbols Outlined"', fixedOverlayCtx.measureText(secondaryIcon).width + 4) : 0;
                        
                        const col1W = Math.max(iconWidth, secIconWidth);
                        const bgW = Math.max(textMetrics.width, secMetrics.width) + col1W + 14;

                        // Sistema de detección de colisiones simple para etiquetas en la línea vertical
                        if (!state.labelRects) state.labelRects = [];

                        let rect = {
                            x: drawX,
                            y: constrainedY,
                            w: bgW,
                            h: bgH
                        };

                        // If it collides with a previous label, push it down or right
                        let attempts = 0;
                        let direction = 1;
                        while (state.labelRects.some(r =>
                            rect.x < r.x + r.w &&
                            rect.x + rect.w > r.x &&
                            rect.y < r.y + r.h &&
                            rect.y + rect.h > r.y
                        ) && attempts < 20) {
                            // Si choca con el botón NOW (que es ancho), mejor mover a la derecha
                            const collidingWithNow = state.labelRects.some(r => r.isNowBtn && 
                                rect.x < r.x + r.w && rect.x + rect.w > r.x &&
                                rect.y < r.y + r.h && rect.y + rect.h > r.y);
                            
                            if (collidingWithNow) {
                                rect.x += 10;
                                if (rect.x + rect.w > w) {
                                    rect.x = drawX; // Reset X
                                    rect.y += (bgH + 1) * direction; // Move down instead
                                    constrainedY += (bgH + 1) * direction;
                                }
                            } else {
                                if (rect.y + bgH * 2 > h) direction = -1;
                                rect.y += (bgH + 1) * direction;
                                constrainedY += (bgH + 1) * direction;
                            }
                            attempts++;
                        }

                        // Prevent disappearance if pushed slightly out of bounds due to collisions
                        if (rect.y < 0) rect.y = 2;
                        if (rect.y + rect.h > h) rect.y = h - rect.h - 2;

                        state.labelRects.push(rect);

                        const c = hexToRgb(color);
                        
                        const lightMix = getThemeColor('scrubber.bgLightMix', 0.85);
                        const bgR = Math.round(255 * lightMix + c.r * (1 - lightMix));
                        const bgG = Math.round(255 * lightMix + c.g * (1 - lightMix));
                        const bgB = Math.round(255 * lightMix + c.b * (1 - lightMix));

                        const opacity = getThemeColor('scrubber.bgOpacity', 0.75);
                        fixedOverlayCtx.fillStyle = `rgba(${bgR}, ${bgG}, ${bgB}, ${opacity})`;
                        fixedOverlayCtx.beginPath();
                        fixedOverlayCtx.roundRect(rect.x, rect.y, rect.w, rect.h, [0, 6, 6, 6]);
                        fixedOverlayCtx.fill();
                        fixedOverlayCtx.strokeStyle = getThemeColor('scrubber.borderColor', color);
                        fixedOverlayCtx.lineWidth = 0.5;
                        fixedOverlayCtx.stroke();

                        fixedOverlayCtx.fillStyle = color;
                        fixedOverlayCtx.textBaseline = 'middle';
                        
                        const textBaseX = rect.x + 6;
                        const textStartX = textBaseX + col1W;

                        const textY = secondaryText ? rect.y + 11 : rect.y + rect.h / 2 + 0.5;

                        if (icon) {
                            fixedOverlayCtx.font = '14px "Material Symbols Outlined"';
                            fixedOverlayCtx.fillStyle = color;
                            fixedOverlayCtx.fillText(icon, textBaseX, textY);
                        }
                        
                        fixedOverlayCtx.font = `bold 13px ${getThemeFont()}`;
                        fixedOverlayCtx.fillStyle = color;
                        fixedOverlayCtx.fillText(text, textStartX, textY);

                        if (secondaryText) {
                            if (secondaryIcon) {
                                fixedOverlayCtx.font = '13px "Material Symbols Outlined"';
                                fixedOverlayCtx.fillStyle = secondaryColor;
                                fixedOverlayCtx.fillText(secondaryIcon, textBaseX, textY + 14);
                            }
                            fixedOverlayCtx.font = `bold 11px ${getThemeFont()}`;
                            fixedOverlayCtx.fillStyle = secondaryColor;
                            fixedOverlayCtx.fillText(secondaryText, textStartX, textY + 14);
                        }
                        fixedOverlayCtx.restore();
                    }
                };

                state.labelRects = []; // Reset para este frame

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

                // 1. Temperatura
                const diff = Math.abs(temp - apparent);
                const showApparent = diff >= 1.5;
                const tempColor = '#d32f2f'; // El rojo normal de temperatura
                
                if (showApparent) {
                    const isCold = apparent <= temp;
                    const apparentColor = isCold ? '#0288d1' : '#f97316'; // Azul o Naranja fuerte
                    drawPoint(normalizeY(temp, -20, 40, h), tempColor, `${Math.round(temp)}°C`, '', 'circle', getThemeIcon('scrubber.temp', 'device_thermostat'), `${Math.round(apparent)}°C`, apparentColor, 'emoji_people');
                } else {
                    drawPoint(normalizeY(temp, -20, 40, h), tempColor, `${Math.round(temp)}°C`, '', 'circle', getThemeIcon('scrubber.temp', 'device_thermostat'));
                }

                // 1.1 Wind Gusts (discrete hourly metric)
                if (currentData && currentData.gusts > 35) {
                    let color = getThemeColor('gusts.normal', '#64748b'); // Gray
                    if (currentData.gusts >= state.stickmanThresholds.wind) {
                        color = getThemeColor('gusts.strong', '#ea580c'); // Orange
                        if (currentData.gusts > 70) color = getThemeColor('gusts.extreme', '#dc2626');
                    }

                    // Draw label
                    const gustIcon = getThemeIcon('scrubber.gusts', 'air');
                    drawPoint(h - 35, color, currentData.gusts.toFixed(1), 'km/h', 'none', gustIcon);
                }

                // 4. Precipitación (discrete hourly metric)
                const pVal = d1.precip;

                if (pVal > 0.01) {
                    const maxH = h * 0.9;
                    let barH = pVal * PIXELS_PER_MM;
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

                // 7. Probabilidad de Precipitación
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

                // 8. Nubes
                const cloudY = h - (h * (clouds / 100));
                drawPoint(cloudY, '#475569', Math.round(clouds), '%', 'circle', getThemeIcon('scrubber.cloud', 'cloud'));

                // 9. UV Index Interaction Canvas Mode
                const uvBlockDOM = document.getElementById('uv-active-block');

                if (d1.uv > 0 && !d1.isNight) {
                    let uvColor;
                    if (d1.uv >= 11) uvColor = getThemeColor('uvLevels.extreme', '#7b1fa2');
                    else if (d1.uv >= 8) uvColor = getThemeColor('uvLevels.veryHigh', '#d32f2f');
                    else if (d1.uv >= 6) uvColor = getThemeColor('uvLevels.high', '#f57c00');
                    else if (d1.uv >= 3) uvColor = getThemeColor('uvLevels.moderate', '#fbc02d');
                    else uvColor = getThemeColor('uvLevels.low', '#4caf50');

                    const uvText = `UV ${parseFloat(d1.uv).toFixed(1)}`;
                    
                    const c = hexToRgb(uvColor);
                    const bgR = Math.round(255 * 0.8 + c.r * 0.2);
                    const bgG = Math.round(255 * 0.8 + c.g * 0.2);
                    const bgB = Math.round(255 * 0.8 + c.b * 0.2);
                    const opacityColor = `rgba(${bgR}, ${bgG}, ${bgB}, 0.95)`;
                    
                    let textColor = uvColor;
                    if (uvColor === getThemeColor('uvLevels.moderate', '#fbc02d') || uvColor === '#fbc02d') {
                        textColor = '#e65100';
                    }

                    const cellAbsX = index * PIXELS_PER_HOUR;
                        
                    if (uvBlockDOM) {
                        uvBlockDOM.style.display = 'flex';
                        uvBlockDOM.style.left = cellAbsX + 'px';
                        uvBlockDOM.style.width = PIXELS_PER_HOUR + 'px';
                        uvBlockDOM.style.backgroundColor = opacityColor;
                        uvBlockDOM.style.color = textColor;
                        uvBlockDOM.innerText = uvText;
                    }
                } else {
                    if (uvBlockDOM) uvBlockDOM.style.display = 'none';
                }

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
        let lastTopPanelData = {};

        function updateTopPanel() {
            const referenceX = scrollContainer.scrollLeft + 60;
            const activeX = referenceX;

            // Cálculo de índice basado en el inicio de la hora
            const floatIndex = activeX / PIXELS_PER_HOUR;
            const index = Math.floor(floatIndex);
            const progress = floatIndex - index;

            let d, interpolatedData;

            if (index >= 0 && index < state.hourlyData.length - 1) {
                const d1 = state.hourlyData[index];
                const d2 = state.hourlyData[index + 1];
                const interpolate = (v1, v2) => v1 + (v2 - v1) * progress;

                interpolatedData = {
                    temp: interpolate(d1.temp, d2.temp).toFixed(1),
                    apparent: interpolate(d1.apparent, d2.apparent).toFixed(1),
                    wind: interpolate(d1.wind, d2.wind).toFixed(1),
                    windDir: interpolate(d1.windDir, d2.windDir),
                    clouds: Math.round(interpolate(d1.clouds, d2.clouds)),
                    precip: interpolate(d1.precip, d2.precip).toFixed(1),
                    precipProb: Math.round(interpolate(d1.precipProb, d2.precipProb)),
                    aqi: d1.aqi,
                    aqiDetails: d1.aqiDetails,
                    pollen: d1.pollen,
                    pollenDetails: d1.pollenDetails,
                    weatherCode: d1.weatherCode
                };
                d = d1;
            } else {
                const safeIndex = Math.max(0, Math.min(state.hourlyData.length - 1, Math.round(floatIndex)));
                d = state.hourlyData[safeIndex];
                if (!d) return;
                interpolatedData = {
                    temp: d.temp.toFixed(1),
                    apparent: d.apparent.toFixed(1),
                    wind: d.wind.toFixed(1),
                    windDir: d.windDir,
                    clouds: d.clouds,
                    precip: d.precip.toFixed(1),
                    precipProb: d.precipProb,
                    aqi: d.aqi,
                    aqiDetails: d.aqiDetails,
                    pollen: d.pollen,
                    pollenDetails: d.pollenDetails,
                    weatherCode: d.weatherCode
                };
            }

            // Only update if data has changed
            const currentData = {
                ...interpolatedData,
                scrollLeft: Math.round(scrollContainer.scrollLeft / 2) // Reducir frecuencia de actualización de tiempo
            };

            if (JSON.stringify(currentData) === JSON.stringify(lastTopPanelData)) return;
            lastTopPanelData = currentData;

            document.getElementById('val-temp').innerHTML = `${Math.round(currentData.temp)}<span class="data-unit">°C</span>`;
            document.getElementById('val-apparent').innerHTML = `<span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle; margin-right: 2px;">emoji_people</span><span style="vertical-align: middle;">${Math.round(currentData.apparent)}°C</span>`;

            // Wind Compass logic
            const windVal = document.getElementById('val-wind');
            if (windVal) windVal.innerHTML = `${currentData.wind}<span class="data-unit">km/h</span>`;

            const arrow = document.getElementById('wind-arrow');
            if (arrow) {
                arrow.style.transform = `rotate(${currentData.windDir + 180}deg)`;
                // Color based on temperature
                let windColor = 'var(--text-primary)';
                const t = parseFloat(currentData.temp);
                if (t < 10) windColor = '#3b82f6'; // Cold
                else if (t > 28) windColor = '#ef4444'; // Hot
                arrow.style.background = windColor;
                arrow.firstElementChild.style.borderBottomColor = windColor;
                document.getElementById('wind-compass').style.borderColor = windColor;
            }

            // AQI
            const aqiInfo = getAQIInfo(currentData.aqi);
            document.querySelector('#val-aqi .aqi-text').innerText = aqiInfo.text;
            const headerAqiIcon = document.getElementById('header-aqi-icon');
            if (headerAqiIcon) {
                if (currentData.aqi === null || currentData.aqi <= 50) headerAqiIcon.style.color = '#22c55e'; // Green
                else if (currentData.aqi <= 100) headerAqiIcon.style.color = '#eab308'; // Yellow
                else if (currentData.aqi <= 150) headerAqiIcon.style.color = '#f97316'; // Orange
                else if (currentData.aqi <= 200) headerAqiIcon.style.color = '#ef4444'; // Red
                else if (currentData.aqi <= 300) headerAqiIcon.style.color = '#9333ea'; // Purple
                else headerAqiIcon.style.color = '#831843'; // Maroon
            }
            
            const aqiHeader = document.getElementById('aqi-header-info');
            const aqiModalHeader = document.getElementById('aqi-modal-header-info');
            const aqiHtml = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid rgba(128,128,128,0.2); padding-bottom:5px;">
                        <span style="font-weight:bold;">${t('aqi.title')}</span>
                        <span style="background:var(--accent-temp); color:white; padding:2px 6px; border-radius:4px; font-size:0.7rem;">${aqiInfo.val}</span>
                    </div>
                    <div style="font-weight:bold; color:var(--accent-temp); margin-bottom:4px; text-align:center;">${aqiInfo.text}</div>
                    <div style="font-size:0.7rem; line-height:1.4; opacity:0.9; text-align:center;">${aqiInfo.rec}</div>
                `;
            if (aqiHeader) aqiHeader.innerHTML = aqiHtml;
            if (aqiModalHeader) aqiModalHeader.innerHTML = aqiHtml;
            
            const aqiRadar = document.getElementById('aqi-radar');
            if (aqiRadar) aqiRadar.style.display = 'block';
            const aqiModalRadar = document.getElementById('aqi-modal-radar');
            if (aqiModalRadar) aqiModalRadar.style.display = 'block';

            // Pollen
            const pollenText = getPollenText(currentData.pollen, currentData.pollenDetails);
            document.querySelector('#val-pollen .pollen-text').innerText = pollenText;
            const headerPollenIcon = document.getElementById('header-pollen-icon');
            if (headerPollenIcon) {
                const pLevel = getAggregatedPollenLevel(currentData.pollenDetails || {});
                if (pLevel === 0) headerPollenIcon.style.color = 'var(--text-secondary)';
                else if (pLevel <= 1) headerPollenIcon.style.color = '#a3e635';
                else if (pLevel <= 2) headerPollenIcon.style.color = '#fbbf24';
                else headerPollenIcon.style.color = '#ef4444';
            }

            // Dibujamos el radar
            requestAnimationFrame(() => {
                drawAQIRadar(currentData, 'aqi-radar', 'aqi-details');
                drawAQIRadar(currentData, 'aqi-modal-radar', 'aqi-modal-details');
                drawPollenRadar(currentData, 'pollen-radar', 'pollen-details');
                drawPollenRadar(currentData, 'pollen-modal-radar', 'pollen-modal-details');
            });

            document.getElementById('val-precip').innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px; color: var(--text-secondary);">${getThemeIcon('header.precip', 'rainy')}</span> <span>${currentData.precip}<span class="data-unit">mm</span></span>`;
            document.getElementById('val-precip-prob').innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px; color: var(--text-secondary);">${getThemeIcon('header.prob', 'water_drop')}</span> <span>${currentData.precipProb}<span class="data-unit">%</span></span>`;
            document.getElementById('val-clouds').innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px; color: var(--text-secondary);">${getThemeIcon('header.cloud', 'cloud')}</span> <span>${currentData.clouds}<span class="data-unit">%</span></span>`;

            // Calculate exact time based on X position to show accurate minutes
            const startTime = state.hourlyData[0].time;
            const exactTime = startTime + (activeX / PIXELS_PER_HOUR) * 3600000;
            const date = new Date(exactTime);
            const { timeStr, dateStr, isToday } = formatTooltipTime(date, getLocale(), state.timezone);

            const timeDisplay = document.getElementById('current-time-display');
            timeDisplay.querySelector('.time-main').innerText = timeStr;
            timeDisplay.querySelector('.date-sub').innerText = isToday ? `${t('topPanel.today')}, ${dateStr}` : dateStr;

            // Generate Alerts (based on current data + next 12h)
            const { alerts, alertLevel } = generateAlerts(state.hourlyData, index)
            renderAlerts(alerts, alertLevel)

            document.getElementById('weather-summary').innerText = getWeatherDescription(d.weatherCode);

            if (window.updateScrollIndicator) window.updateScrollIndicator();

            // Update location tooltip
            document.getElementById('tt-location').innerText = state.locationName;
            document.getElementById('tt-summary').innerText = getWeatherDescription(d.weatherCode);
        }

        function handleResize() {
            if (!scrollContainer) return;
            PIXELS_PER_HOUR = window.innerWidth < 600 ? 50 : 60;
            TILE_WIDTH = window.innerWidth < 600 ? 720 : 1440;
            state.dpr = getDPR();

            const containerH = scrollContainer.clientHeight;
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

                    const ctx = canvas.getContext('2d', { alpha: true });
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

        onClearCache = async () => {
            weatherCache.clear();
            try { storageService.db?.close(); } catch(e) {}
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
        
        window.openBottomSheet = openBottomSheet;
