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
import { changelogData } from './data/changelog.js';
import { getWeatherDescription } from './utils/weather.js';
import { normalizeY } from './utils/math.js';
import { drawHumidity, drawWind, drawTemperature } from './render/MetricsRenderer.js';
import { drawClouds, drawPrecipitation, drawPrecipitationProbability } from './render/AtmosphereRenderer.js';
import { drawGrid, drawDayNames, drawAxes } from './render/GridRenderer.js';
import { drawWeatherPhenomena, drawStarrySky, drawUVSegments, drawSunMarkersOnCanvas, drawSunnyBackground, drawNightOverlay, drawNightShadow } from './render/BackgroundRenderer.js';
import { drawStickman } from './render/StickmanRenderer.js';
import { initMapModal } from './ui/MapSelector.js';
import { initFavoritesModal } from './ui/FavoritesModal.js';
import { initYearInPixels } from './ui/YearInPixels.js';

let PIXELS_PER_HOUR = state.PIXELS_PER_HOUR;
const CHART_HEIGHT = CONFIG.CHART_HEIGHT;
const MINIMAP_HEIGHT = CONFIG.MINIMAP_HEIGHT;
const DEFAULT_COORDS = CONFIG.DEFAULT_COORDS;
const CACHE_DURATION = CONFIG.CACHE_DURATION;

let weatherCache = new Map();

        let minimapCanvas, minimapCtx;
        let fixedOverlayCanvas, fixedOverlayCtx;
        let minimapCacheCanvas = null;
        let tiles = [];
        let cachedTileHeight = 0;
        let TILE_WIDTH = window.innerWidth < 600 ? 720 : 1440;
        let scrollContainer, minimapViewport, themeToggle;
        let isMinimapDragging = false;
        let minimapMode = 'future'; // 'past' or 'future'
        
        const setMinimapMode = (mode, isUserInteraction = false) => {
            const hasChanged = minimapMode !== mode;
            minimapMode = mode;
            
            if (isUserInteraction) {
                if (mode === 'future') {
                    centerOnCurrentTime();
                } else if (mode === 'past') {
                    // Scroll to the very beginning of the data
                    scrollContainer.scrollLeft = 0;
                }
            }

            if (hasChanged) {
                requestAnimationFrame(() => {
                    minimapCacheCanvas = null;
                    updateMinimapViewport();
                    drawMinimap();
                });
            }
        };

        let searchTimeout = null;
        let ticking = false;
        let preventBackNavTimer = null;
        const PIXELS_PER_MM = 10;

        window.hexToRgb = hex => {
            let r = 0, g = 0, b = 0;
            if (typeof hex !== 'string') return {r, g, b};
            if (hex.startsWith('rgba')) {
                const parts = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                if (parts) { r = parseInt(parts[1]); g = parseInt(parts[2]); b = parseInt(parts[3]); }
            } else {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex) || /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
                if (result) {
                    if (result[1].length === 1) {
                        r = parseInt(result[1]+result[1], 16); g = parseInt(result[2]+result[2], 16); b = parseInt(result[3]+result[3], 16);
                    } else {
                        r = parseInt(result[1], 16); g = parseInt(result[2], 16); b = parseInt(result[3], 16);
                    }
                }
            }
            return {r, g, b};
        };

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
            let ptrStartY = 0;
            let ptrStartX = 0;
            let ptrDist = 0;
            const ptrIndicator = document.getElementById('ptr-indicator');
            const appWrapper = document.getElementById('app-wrapper');

            document.addEventListener('touchstart', (e) => {
                const hasOverlayOpen = document.querySelectorAll('.yip-sheet-backdrop.open, #info-modal[style*="display: flex"], #favorites-modal[style*="display: flex"], #map-location-modal[style*="display: flex"], #prompt-modal[style*="display: flex"], #changelog-modal.open, #yip-modal[style*="display: flex"]').length > 0;
                if (e.touches.length === 1 && !hasOverlayOpen && !e.target.closest('#search-results')) {
                    ptrStartY = e.touches[0].clientY;
                    ptrStartX = e.touches[0].clientX;
                    ptrDist = 0;
                } else {
                    ptrStartY = 0;
                }
            }, { passive: true });

            document.addEventListener('touchmove', (e) => {
                if (e.touches.length === 1 && ptrStartY > 0) {
                    const currentY = e.touches[0].clientY;
                    const currentX = e.touches[0].clientX;
                    
                    // If horizontal movement is greater than vertical, cancel PTR
                    if (Math.abs(currentX - ptrStartX) > Math.abs(currentY - ptrStartY)) {
                        ptrStartY = 0;
                        ptrDist = 0;
                        if (ptrIndicator) ptrIndicator.style.transform = `translateY(-100%)`;
                        if (appWrapper) appWrapper.style.transform = `translateY(0)`;
                        return;
                    }

                    if (currentY > ptrStartY) { 
                        // Vertical dragging down -> prevent native browser scroll to avoid micro-scrolling elastic bounce
                        if (e.cancelable) e.preventDefault();
                        
                        ptrDist = currentY - ptrStartY;
                        // Visual feedback
                        if (ptrDist > 0 && ptrDist < 200 && !state.isFetching) {
                            let visualDist = Math.min(75, ptrDist / 2.5); // Max pull down is 75px
                            if (ptrIndicator) {
                                ptrIndicator.style.transition = 'none';
                                ptrIndicator.style.transform = `translateY(${visualDist - 75}px)`;
                                const ptrIcon = document.getElementById('ptr-icon');
                                if (ptrIcon) {
                                    const rotation = Math.min(360, (visualDist / 75) * 360);
                                    ptrIcon.style.transform = `rotate(${rotation}deg)`;
                                    ptrIcon.style.opacity = Math.min(1, visualDist / 40);
                                }
                            }
                            if (appWrapper) {
                                appWrapper.style.transition = 'none';
                                appWrapper.style.transform = `translateY(${visualDist}px)`;
                            }
                        }
                    } else {
                        ptrDist = 0; 
                    }
                }
            }, { passive: false }); // Needs to be false to prevent default

            document.addEventListener('touchend', () => {
                const resetUI = () => {
                    const ptrIcon = document.getElementById('ptr-icon');
                    if (ptrIcon) {
                        ptrIcon.dataset.spinning = 'false';
                        if (ptrIcon.dataset.spinInterval) {
                            clearInterval(parseInt(ptrIcon.dataset.spinInterval));
                        }
                    }
                    if (ptrIndicator) {
                        ptrIndicator.style.transition = 'transform 0.3s ease-out';
                        ptrIndicator.style.transform = `translateY(-100%)`;
                    }
                    if (appWrapper) {
                        appWrapper.style.transition = 'transform 0.3s ease-out';
                        appWrapper.style.transform = `translateY(0)`;
                    }
                };

                if (ptrDist > 60 && state.lat && state.lon && !state.isFetching) {
                    const ptrIcon = document.getElementById('ptr-icon');
                    if (ptrIcon) {
                        ptrIcon.style.transition = 'transform 0.5s linear';
                        // Keep rotating
                        ptrIcon.dataset.spinning = 'true';
                        let spinDeg = 360;
                        const spinInterval = setInterval(() => {
                           if (ptrIcon.dataset.spinning !== 'true') {
                               clearInterval(spinInterval);
                               return;
                           }
                           spinDeg += 360;
                           ptrIcon.style.transform = `rotate(${spinDeg}deg)`;
                        }, 500);
                        // Save interval id to stop it later
                        ptrIcon.dataset.spinInterval = spinInterval;
                    }

                    if (ptrIndicator) {
                        ptrIndicator.style.transition = 'transform 0.2s ease-out';
                        ptrIndicator.style.transform = `translateY(0px)`;
                    }
                    if (appWrapper) {
                        appWrapper.style.transition = 'transform 0.2s ease-out';
                        appWrapper.style.transform = `translateY(75px)`;
                    }
                    weatherCache.clear();
                    
                    // Clear canvases to provide visual feedback of refresh
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
                    const doRefresh = async () => {
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
                        } finally {
                            resetUI();
                        }
                    };
                    doRefresh();
                } else {
                    resetUI();
                }

                ptrStartY = 0;
                ptrStartX = 0;
                ptrDist = 0;
            });

            // Block zoom/pinch on iOS
            document.addEventListener('touchstart', (e) => {
                if (e.touches.length > 1) {
                    e.preventDefault();
                }
            }, { passive: false });

            // SPF Modal Logic
            const spfInfoContainer = document.getElementById('spf-info-container');
            const spfModal = document.getElementById('spf-modal');
            const closeSpfBtn = document.getElementById('close-spf-btn');
            const spfSettingsBtn = document.getElementById('spf-settings-btn');
            const infoModal = document.getElementById('info-modal');

            if (spfInfoContainer && spfModal) {
                spfInfoContainer.addEventListener('click', () => {
                    const uv = parseFloat(spfInfoContainer.dataset.uv || 0);
                    
                    const elUviBox = document.getElementById('spf-modal-uvi-box');
                    const elUviTitle = document.getElementById('spf-modal-uvi-title');
                    const elUviDesc = document.getElementById('spf-modal-uvi-desc');
                    
                    elUviBox.innerText = uv.toFixed(1);
                    
                    let riskStr, riskDesc, riskColor;
                    
                    if (uv < 3) {
                        riskStr = 'Bajo'; riskDesc = t('config.spfModalRiskLow'); riskColor = '#22c55e';
                    } else if (uv < 6) {
                        riskStr = 'Moderado'; riskDesc = t('config.spfModalRiskMod'); riskColor = '#eab308';
                    } else if (uv < 8) {
                        riskStr = 'Alto'; riskDesc = t('config.spfModalRiskHigh'); riskColor = '#f97316';
                    } else if (uv < 11) {
                        riskStr = 'Muy Alto'; riskDesc = t('config.spfModalRiskVHigh'); riskColor = '#ef4444';
                    } else {
                        riskStr = 'Extremo'; riskDesc = t('config.spfModalRiskExt'); riskColor = '#a855f7';
                    }
                    
                    elUviBox.style.backgroundColor = riskColor;
                    elUviTitle.style.color = riskColor;
                    elUviTitle.innerText = `${t('config.spfModalTitleUVI')}: ${riskStr}`;
                    elUviDesc.innerText = riskDesc;
                    
                    const skinTypes = ["I", "II", "III", "IV", "V", "VI"];
                    const skinBaseMins = [67, 100, 200, 300, 400, 600];
                    const sType = state.skinType || 2;
                    
                    const timeToBurn = uv > 0 ? Math.round(skinBaseMins[sType - 1] / uv) : 0;
                    document.getElementById('spf-modal-time-val').innerText = timeToBurn > 0 ? (timeToBurn > 120 ? '> 120' : timeToBurn) : '--';
                    document.getElementById('spf-modal-time-desc').innerText = `${t('config.spfModalTimeNone')} ${skinTypes[sType - 1] || "II"}`;

                    let spfText;
                    if (uv >= 8) spfText = 'SPF 50+';
                    else if (uv >= 6) spfText = 'SPF 50';
                    else if (uv >= 3) spfText = 'SPF 30+';
                    else if (uv > 0 && sType <= 2) spfText = 'SPF 15';
                    else spfText = '--';
                    
                    document.getElementById('spf-modal-rec-val').innerText = spfText;
                    document.getElementById('spf-modal-rec-desc').innerText = t('config.spfModalReapply');
                    
                    const closeSpfSheet = openBottomSheet('spf-modal');
                    window._closeSpfSheet = closeSpfSheet;
                });

                spfSettingsBtn.addEventListener('click', () => {
                    if (window._closeSpfSheet) window._closeSpfSheet();
                    openBottomSheet('info-modal', 'info-sheet-backdrop', 'info-sheet-content');
                });
            }

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
            fixedOverlayCtx = fixedOverlayCanvas.getContext('2d');

            scrollContainer = document.getElementById('scroll-container');
            minimapViewport = document.getElementById('minimap-viewport');
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

                let isChangelogLoading = false;

                const openChangelogLink = document.getElementById('open-changelog-link');
                if (openChangelogLink) {
                    const onChangelogOpen = (e) => {
                        e.preventDefault();
                        if (isChangelogLoading) return;
                        isChangelogLoading = true;
                        if (closeInfoSheet) closeInfoSheet();
                        requestAnimationFrame(() => {
                            try { showChangelogModal(); } catch (e) { console.error("Changelog err:", e); }
                            isChangelogLoading = false;
                        });
                    };
                    openChangelogLink.addEventListener('click', onChangelogOpen);
                }
                
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
                                minimapCacheCanvas = null;
                                render();
                                drawMinimap();
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
                                    minimapCacheCanvas = null;
                                    render();
                                    const sheetClose = _activeSheets['theme-sheet-backdrop'];
                                    if (sheetClose) sheetClose();
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
                    
                    const closeFn = window.openBottomSheet ? window.openBottomSheet('confirm-modal', 'confirm-sheet-backdrop') : () => {};
                    
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
                                await performClearCacheAndReload();
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

                // Header tooltips hover reliability (Desktop)
                document.querySelectorAll('.info-icon, .location-group').forEach(el => {
                    el.addEventListener('mouseenter', () => {
                        if (window.innerWidth >= 600) {
                            const container = el.classList.contains('info-icon') ? el.closest('.data-value') : el;
                            const tt = container.querySelector('.custom-tooltip');
                            if (tt) {
                                // For location-group, only show if text is truncated
                                if (el.classList.contains('location-group')) {
                                    const locName = document.getElementById('location-name');
                                    const summary = document.getElementById('weather-summary');
                                    const isTruncated = (locName.scrollWidth > locName.clientWidth) || (summary.scrollWidth > summary.clientWidth);
                                    if (isTruncated) {
                                        tt.style.display = 'block';
                                    }
                                } else {
                                    tt.style.display = 'block';
                                }
                            }
                        }
                    });
                    el.addEventListener('mouseleave', () => {
                        if (window.innerWidth >= 600) {
                            const container = el.classList.contains('info-icon') ? el.closest('.data-value') : el;
                            const tt = container.querySelector('.custom-tooltip');
                            if (tt) tt.style.display = '';
                        }
                    });
                });

                // Tooltips en móvil al tocar el valor o la ubicación
                document.querySelectorAll('.data-value, .location-group').forEach(val => {
                    val.addEventListener('click', (e) => {
                        if (window.innerWidth < 600) {
                            const tooltip = val.querySelector('.custom-tooltip');
                            if (tooltip) {
                                // For location-group, only show if text is truncated
                                if (val.classList.contains('location-group')) {
                                    const locName = document.getElementById('location-name');
                                    const summary = document.getElementById('weather-summary');
                                    const isTruncated = (locName.scrollWidth > locName.clientWidth) || (summary.scrollWidth > summary.clientWidth);
                                    if (!isTruncated) return;
                                }
                                const isVisible = tooltip.style.display === 'block';
                                // Cerrar otros tooltips
                                document.querySelectorAll('.custom-tooltip').forEach(t => {
                                    t.style.display = '';
                                    t.style.position = '';
                                    t.style.top = '';
                                    t.style.left = '';
                                    t.style.transform = '';
                                    t.style.zIndex = '';
                                });
                                
                                if (!isVisible) {
                                    tooltip.style.display = 'block';
                                    const rect = val.getBoundingClientRect();
                                    tooltip.style.position = 'fixed';
                                    tooltip.style.top = (rect.bottom + 10) + 'px';
                                    tooltip.style.left = '50%';
                                    tooltip.style.transform = 'translateX(-50%)';
                                    tooltip.style.zIndex = '9999';
                                }
                                e.stopPropagation();
                            }
                        }
                    });
                });

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
                        drawMinimap();
                        updateMinimapViewport();
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
                    // Reverting to basic mouse/touch events to ensure standard behavior that was working before
                    minimapContainer.style.touchAction = '';

                    minimapContainer.addEventListener('mousedown', (e) => {
                        isMinimapDragging = true;
                        handleMinimapClick(e);
                    });

                    minimapContainer.addEventListener('touchstart', (e) => {
                        isMinimapDragging = true;
                        handleMinimapClick(e.touches[0]);
                    }, { passive: true });
                }

                window.addEventListener('mousemove', (e) => {
                    if (isMinimapDragging) handleMinimapClick(e);
                });

                window.addEventListener('mouseup', () => {
                    isMinimapDragging = false;
                });

                window.addEventListener('touchmove', (e) => {
                    if (isMinimapDragging) handleMinimapClick(e.touches[0]);
                }, { passive: true });

                window.addEventListener('touchend', () => {
                    isMinimapDragging = false;
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

                document.addEventListener('click', () => {
                    if (window.innerWidth < 600) {
                        document.querySelectorAll('.custom-tooltip').forEach(t => {
                            t.style.display = '';
                            t.style.position = '';
                            t.style.top = '';
                            t.style.left = '';
                            t.style.transform = '';
                            t.style.zIndex = '';
                        });
                    }
                });

                const metricsContainer = document.querySelector('.top-panel-metrics');
                const scrollIndLeft = document.querySelector('.scroll-indicator-left');
                const scrollIndRight = document.querySelector('.scroll-indicator-right');
                const metricsDots = document.getElementById('metrics-dots');
                
                if (metricsContainer && scrollIndLeft && scrollIndRight) {
                    let _discoveryPlayed = false;

                    const updateScrollIndicator = () => {
                        const hasOverflow = metricsContainer.scrollWidth > metricsContainer.clientWidth;
                        const isAtStart = metricsContainer.scrollLeft <= 5;
                        const isAtEnd = metricsContainer.scrollLeft + metricsContainer.clientWidth >= metricsContainer.scrollWidth - 5;
                        
                        // Right indicator - use .visible class
                        if (hasOverflow && !isAtEnd) {
                            scrollIndRight.classList.add('visible');
                        } else {
                            scrollIndRight.classList.remove('visible');
                        }

                        // Left indicator
                        if (hasOverflow && !isAtStart) {
                            scrollIndLeft.classList.add('visible');
                        } else {
                            scrollIndLeft.classList.remove('visible');
                        }

                        // Pagination dots with page counter
                        if (metricsDots) {
                            if (!hasOverflow) {
                                metricsDots.innerHTML = '';
                                metricsDots.style.display = 'none';
                                return;
                            }
                            metricsDots.style.display = '';
                            const pageWidth = metricsContainer.clientWidth;
                            const totalPages = Math.max(1, Math.ceil(metricsContainer.scrollWidth / pageWidth));
                            const currentPage = Math.round(metricsContainer.scrollLeft / pageWidth);
                            let html = '';
                            for (let i = 0; i < totalPages; i++) {
                                html += '<span class="metric-dot' + (i === currentPage ? ' active' : '') + '"></span>';
                            }
                            if (totalPages > 1) {
                                html += '<span class="metric-page-counter">' + (currentPage + 1) + '/' + totalPages + '</span>';
                            }
                            metricsDots.innerHTML = html;
                        }

                        // Discovery animation on first overflow
                        if (!_discoveryPlayed && hasOverflow) {
                            _discoveryPlayed = true;
                            const el = scrollIndRight;
                            el.classList.add('visible');
                            el.style.transition = 'none';
                            el.style.transform = 'translateY(-50%) translateX(0)';
                            // Force reflow
                            void el.offsetHeight;
                            // Animate: swipe right 3 times
                            let step = 0;
                            const swipe = () => {
                                if (step > 5) {
                                    el.style.transition = '';
                                    el.style.transform = '';
                                    return;
                                }
                                const isEven = step % 2 === 0;
                                el.style.transition = 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)';
                                el.style.transform = isEven
                                    ? 'translateY(-50%) translateX(14px)'
                                    : 'translateY(-50%) translateX(0)';
                                step++;
                                setTimeout(swipe, 280);
                            };
                            setTimeout(swipe, 400);
                        }
                    };

                    window.updateScrollIndicator = updateScrollIndicator;
                    metricsContainer.addEventListener('scroll', updateScrollIndicator, { passive: true });
                    window.addEventListener('resize', updateScrollIndicator);
                    setTimeout(updateScrollIndicator, 1000);
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
                drawMinimap();
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
            drawMinimap();
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

            updateMinimapViewport();
            updateTopPanel();
            drawFixedOverlay();
        }

        // Functions logic removed because it is handled by DailyCards.js

        function getSplitIndex() {
            if (!state.hourlyData.length) return 0;
            const now = Date.now();
            const startTime = state.hourlyData[0].time;
            const index = Math.floor((now - startTime) / 3600000);
            return Math.max(0, Math.min(state.hourlyData.length, index));
        }

        function updateMinimapViewport() {
            if (!state.hourlyData.length) return;

            const splitIndex = getSplitIndex();
            let startIndex = minimapMode === 'past' ? 0 : splitIndex;
            let dataLength = minimapMode === 'past' ? splitIndex : state.hourlyData.length - splitIndex;
            if (dataLength <= 0) return;

            const totalMainWidth = state.hourlyData.length * PIXELS_PER_HOUR;
            const scrollRatio = scrollContainer.scrollLeft / totalMainWidth;
            const visibleRatio = scrollContainer.clientWidth / totalMainWidth;

            // Current visible range in indexes
            const currentLeftIndex = scrollContainer.scrollLeft / PIXELS_PER_HOUR;
            const currentRightIndex = (scrollContainer.scrollLeft + scrollContainer.clientWidth) / PIXELS_PER_HOUR;
            const centerIndex = currentLeftIndex + (currentRightIndex - currentLeftIndex) / 2;

            // Auto-switch mode based on center of screen
            if (!isMinimapDragging) { // don't auto-switch while dragging minimap
                if (minimapMode === 'future' && centerIndex < splitIndex) {
                    setMinimapMode('past'); // helper handles the toggle + redraw
                    return;
                } else if (minimapMode === 'past' && centerIndex >= splitIndex && centerIndex < state.hourlyData.length) {
                    setMinimapMode('future');
                    return;
                }
            }

            const minimapW = minimapCanvas.clientWidth;
            
            // Map the global ratio to the local data slice
            const localLeftIndex = currentLeftIndex - startIndex;
            const localRightIndex = currentRightIndex - startIndex;
            
            const vpLeft = (localLeftIndex / dataLength) * minimapW;
            const vpWidth = ((localRightIndex - localLeftIndex) / dataLength) * minimapW;

            minimapViewport.style.width = vpWidth + 'px';
            minimapViewport.style.left = vpLeft + 'px';

            // Auto-scroll the minimap container if it's wider than the screen
            const mContainer = document.getElementById('minimap-container');
            if (mContainer && minimapW > mContainer.clientWidth) {
                const vpCenter = vpLeft + (vpWidth / 2);
                mContainer.scrollLeft = vpCenter - (mContainer.clientWidth / 2);
            }

            updateNowButtonPosition();
        }

        function drawMinimap() {
            if (!state.hourlyData.length) return;

            const splitIndex = getSplitIndex();
            let minimapData, startIndex;

            if (minimapMode === 'past') {
                minimapData = state.hourlyData.slice(0, splitIndex);
                startIndex = 0;
            } else {
                minimapData = state.hourlyData.slice(splitIndex);
                startIndex = splitIndex;
            }

            if (!minimapData.length) return;

            const w = minimapCanvas.clientWidth || window.innerWidth;
            const h = 80;
            const dpr = state.dpr;

            if (!minimapCacheCanvas) minimapCacheCanvas = document.createElement('canvas');
            if (minimapCacheCanvas.width !== w * dpr || minimapCacheCanvas.height !== h * dpr) {
                minimapCacheCanvas.width = w * dpr;
                minimapCacheCanvas.height = h * dpr;
            }

            const ctx = minimapCacheCanvas.getContext('2d');
            ctx.save();
            ctx.scale(dpr, dpr);
            ctx.clearRect(0, 0, w, h);

            const step = w / minimapData.length;

            // 1. Background (Day/Night)
            ctx.fillStyle = '#fffde7'; // Day
            ctx.fillRect(0, 0, w, h);

            ctx.fillStyle = '#f3e8ff'; // Night
            minimapData.forEach((d, i) => {
                if (d.isNight) {
                    ctx.fillRect(i * step, 0, step + 0.5, h);
                }
            });

            // 2. Grid & Day Labels
            ctx.save();
            let lastLabelX = -100;
            minimapData.forEach((d, i) => {
                const x = i * step;
                if (d.localHour === 0 || (i === 0 && d.localHour !== 0)) {
                    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, h);
                    ctx.stroke();

                    // Only draw text if it's midnight or first entry in segment AND enough space
                    const dateObj = new Date(d.time);
                    const dayStr = String(dateObj.getDate()).padStart(2, '0');
                    const monthStr = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const dayText = `${d.localDayShort} ${dayStr}/${monthStr}`;
                    
                    const labelWidth = ctx.measureText(dayText).width + 16; // Increased gap to prevent overlapping
                    if (x > lastLabelX + labelWidth) {
                        ctx.fillStyle = '#666666';
                        ctx.font = `bold 9px ${getThemeFont()}`;
                        ctx.fillText(dayText, x + 4, 12);
                        lastLabelX = x;
                    }
                }
            });
            ctx.restore();

            // 3. Layers (Simplified for minimap)
            // Zero line (0°C)
            const y0 = normalizeY(0, -20, 40, h);
            ctx.strokeStyle = 'rgba(2, 136, 209, 0.4)';
            ctx.setLineDash([2, 2]);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, y0);
            ctx.lineTo(w, y0);
            ctx.stroke();
            ctx.setLineDash([]);

            // Clouds
            ctx.save();
            ctx.fillStyle = 'rgba(100, 116, 139, 0.2)';
            ctx.strokeStyle = 'rgba(100, 116, 139, 0.6)';
            ctx.lineWidth = 1;
            const cloudPath = new Path2D();
            minimapData.forEach((d, i) => {
                const x = i * step;
                const y = h - (h * (d.clouds / 100));
                if (i === 0) cloudPath.moveTo(x, y);
                else cloudPath.lineTo(x, y);
            });
            ctx.stroke(cloudPath);
            cloudPath.lineTo(w, h);
            cloudPath.lineTo(0, h);
            ctx.fill(cloudPath);
            ctx.restore();

            // Gradient color helper for precipitation type
            const buildPrecipGradient = (alpha) => {
                const grad = ctx.createLinearGradient(0, 0, w, 0);
                if (minimapData.length === 0) return `rgba(2, 136, 209, ${alpha})`;
                minimapData.forEach((d, i) => {
                    const isSnow = [71, 73, 75, 77, 85, 86].includes(d.weatherCode);
                    const isThunder = [95, 96, 99].includes(d.weatherCode);
                    let baseColor = '2, 136, 209'; // Default blue
                    if (isSnow) baseColor = '0, 188, 212'; // Cyan
                    else if (isThunder) baseColor = '126, 87, 194'; // Purple

                    grad.addColorStop(i / (minimapData.length - 1 || 1), `rgba(${baseColor}, ${alpha})`);
                });
                return grad;
            };

            const precipBarGrad = buildPrecipGradient(0.6);
            const probStrokeGrad = buildPrecipGradient(1.0);
            const probFillGrad = buildPrecipGradient(0.2);

            // Precipitation bars
            ctx.fillStyle = precipBarGrad;
            minimapData.forEach((d, i) => {
                if (d.precip > 0) {
                    const x = i * step;
                    const barH = Math.max(2, Math.min(h, d.precip * 5));
                    ctx.fillRect(x, h - barH, Math.max(1, step - 0.5), barH);
                }
            });

            // Precipitation Probability
            ctx.save();
            ctx.fillStyle = probFillGrad;
            ctx.strokeStyle = probStrokeGrad;
            ctx.lineWidth = 1;
            const probPath = new Path2D();
            minimapData.forEach((d, i) => {
                const x = i * step;
                const y = h - (h * (d.precipProb / 100));
                if (i === 0) probPath.moveTo(x, y);
                else probPath.lineTo(x, y);
            });
            ctx.stroke(probPath);
            probPath.lineTo(w, h);
            probPath.lineTo(0, h);
            ctx.fill(probPath);
            ctx.restore();

            // Temperature Line
            ctx.strokeStyle = '#d32f2f';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            minimapData.forEach((d, i) => {
                const x = i * step;
                const y = normalizeY(d.temp, -20, 40, h);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();

            // UV Segments
            minimapData.forEach((d, i) => {
                if (d.uv >= 1) {
                    const x = i * step;
                    let color = getThemeColor('uvLevels.low', '#4caf50');
                    if (d.uv >= 3 && d.uv < 6) color = getThemeColor('uvLevels.moderate', '#fbc02d');
                    else if (d.uv >= 6 && d.uv < 8) color = getThemeColor('uvLevels.high', '#f57c00');
                    else if (d.uv >= 8 && d.uv < 11) color = getThemeColor('uvLevels.veryHigh', '#d32f2f');
                    else if (d.uv >= 11) color = getThemeColor('uvLevels.extreme', '#7b1fa2');

                    ctx.fillStyle = color;
                    ctx.fillRect(x, 0, Math.max(1, step), 3);
                }
            });

            // Modern vertical line for 'Now'
            const now = Date.now();
            const nowIndex = (now - state.hourlyData[0].time) / 3600000;
            const localNowIndex = nowIndex - startIndex;
            
            if (localNowIndex >= 0 && localNowIndex <= minimapData.length) {
                const nowX = localNowIndex * step;
                ctx.save();
                    
                    // Outer glow shadow
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
                    
                    // Vertical line
                    ctx.strokeStyle = '#ef4444';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.moveTo(nowX, 0);
                    ctx.lineTo(nowX, h);
                    ctx.stroke();
                    
                    // Little indicator circle at top
                    ctx.fillStyle = '#ef4444';
                    ctx.beginPath();
                    ctx.arc(nowX, 0, 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    
                    ctx.restore();
            }

            if (minimapMode === 'past') {
                ctx.save();
                ctx.fillStyle = getThemeColor('minimapPastOverlay', 'rgba(0, 0, 0, 0.45)');
                // If it's light mode, it could have a different tint, but let the user's theme system handle it, or just use blackish
                if (state.theme === 'light') ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; 
                ctx.fillRect(0, 0, w, h);
                ctx.restore();
            }

            ctx.restore();

            // Draw to main minimap canvas
            minimapCtx.resetTransform();
            minimapCtx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);
            minimapCtx.drawImage(minimapCacheCanvas, 0, 0);
            updateMinimapViewport();
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

                        const c = window.hexToRgb ? window.hexToRgb(color) : {r: 0, g: 0, b: 0};
                        
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
                    
                    const c = window.hexToRgb ? window.hexToRgb(uvColor) : {r: 0, g: 0, b: 0};
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

            // Posición X real en el canvas
            const nowX = ((now - startTime) / 3600000) * PIXELS_PER_HOUR;
            
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
            const today = new Date();
            const isToday = date.getDate() === today.getDate() &&
                            date.getMonth() === today.getMonth() &&
                            date.getFullYear() === today.getFullYear();

            const timeStr = date.toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit', timeZone: state.timezone });
            const dateStr = date.toLocaleString(getLocale(), {
                weekday: 'short', day: 'numeric', month: 'short', timeZone: state.timezone
            }).toUpperCase();

            const timeDisplay = document.getElementById('current-time-display');
            timeDisplay.querySelector('.time-main').innerText = timeStr;
            timeDisplay.querySelector('.date-sub').innerText = isToday ? `${t('topPanel.today')}, ${dateStr}` : dateStr;

            // Generate Alerts (based on current data + next 12h)
            const alerts = [];
            const alertTypes = new Set();
            let alertLevel = 0; // 0: none, 1: yellow, 2: orange, 3: red
            
            for(let i = index; i < Math.min(state.hourlyData.length, index + 12); i++) {
                const hourData = state.hourlyData[i];
                if (!hourData) continue;
                
                // Temp
                if (hourData.temp >= 38 && !alertTypes.has("temp")) {
                    alerts.push({ type: "temp", level: 3, msg: "Calor extremo (>38°C)" });
                    alertTypes.add("temp");
                    alertLevel = Math.max(alertLevel, 3);
                } else if (hourData.temp >= 35 && !alertTypes.has("temp")) {
                    alerts.push({ type: "temp", level: 2, msg: "Altas temperaturas (>35°C)" });
                    alertTypes.add("temp");
                    alertLevel = Math.max(alertLevel, 2);
                } else if (hourData.temp <= -5 && !alertTypes.has("temp")) {
                    alerts.push({ type: "temp", level: 2, msg: "Frío extremo (<-5°C)" });
                    alertTypes.add("temp");
                    alertLevel = Math.max(alertLevel, 2);
                }

                // Wind
                if (hourData.gusts >= 90 && !alertTypes.has("wind")) {
                    alerts.push({ type: "wind", level: 3, msg: "Vientos huracanados (>90km/h)" });
                    alertTypes.add("wind");
                    alertLevel = Math.max(alertLevel, 3);
                } else if (hourData.gusts >= 70 && !alertTypes.has("wind")) {
                    alerts.push({ type: "wind", level: 2, msg: "Rachas muy fuertes (>70km/h)" });
                    alertTypes.add("wind");
                    alertLevel = Math.max(alertLevel, 2);
                }

                // Precip
                if (hourData.precip >= 15 && !alertTypes.has("rain")) {
                    alerts.push({ type: "rain", level: 3, msg: "Lluvias torrenciales (>15mm/h)" });
                    alertTypes.add("rain");
                    alertLevel = Math.max(alertLevel, 3);
                } else if (hourData.precip >= 8 && !alertTypes.has("rain")) {
                    alerts.push({ type: "rain", level: 2, msg: "Lluvias intensas (>8mm/h)" });
                    alertTypes.add("rain");
                    alertLevel = Math.max(alertLevel, 2);
                }
                
                // UV
                if (hourData.uv >= 11 && !alertTypes.has("uv")) {
                    alerts.push({ type: "uv", level: 3, msg: "Índice UV Extremo (≥11)" });
                    alertTypes.add("uv");
                    alertLevel = Math.max(alertLevel, 3);
                }

                // Snow
                const isSnow = [71, 73, 75, 77, 85, 86].includes(hourData.weatherCode);
                if (isSnow && hourData.precip >= 2 && !alertTypes.has("snow")) {
                    alerts.push({ type: "snow", level: 2, msg: "Nevadas intensas" });
                    alertTypes.add("snow");
                    alertLevel = Math.max(alertLevel, 2);
                }
            }

            const alertContainer = document.getElementById('alerts-container');
            const alertTooltip = document.getElementById('alerts-tooltip');
            
            if (alerts.length > 0 && alertContainer && alertTooltip) {
                alertContainer.style.display = 'flex';
                
                let alertHtml = `<div style="font-weight:bold; margin-bottom:5px; border-bottom:1px solid rgba(128,128,128,0.2); padding-bottom:3px; color:var(--text-primary);">${t('topPanel.activeAlerts')}</div>`;
                
                let iconColor = '#fbc02d'; // Yellow
                if (alertLevel === 3) iconColor = '#d32f2f'; // Red
                else if (alertLevel === 2) iconColor = '#f57c00'; // Orange
                
                alertContainer.querySelector('.material-symbols-outlined').style.color = iconColor;

                alerts.forEach(a => {
                    let c = a.level === 3 ? '#ef5350' : a.level === 2 ? '#ff9800' : '#ffca28';
                    alertHtml += `<div style="display:flex; align-items:center; gap:6px; margin:4px 0; color:var(--text-primary);"><span style="min-width:8px; width:8px; height:8px; border-radius:50%; background:${c};"></span> <span style="font-size:0.85rem; text-align:left;">${a.msg}</span></div>`;
                });
                alertTooltip.innerHTML = alertHtml;
            } else if (alertContainer) {
                alertContainer.style.display = 'none';
            }

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

        function centerOnCurrentTime(behavior = 'auto') {
            if (state.hourlyData.length === 0) return;
            const now = Date.now();
            const startTime = state.hourlyData[0].time;

            // Calculamos la posición X exacta para el momento actual
            // (ms transcurridos / ms por hora) * pixeles por hora
            const exactX = ((now - startTime) / 3600000) * PIXELS_PER_HOUR;

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

        function handleMinimapClick(e) {
            const rect = minimapCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const ratio = Math.max(0, Math.min(1, x / rect.width));
            
            const splitIndex = getSplitIndex();
            const startIndex = minimapMode === 'past' ? 0 : splitIndex;
            const dataLength = minimapMode === 'past' ? splitIndex : state.hourlyData.length - splitIndex;

            const targetLocalIndex = ratio * dataLength;
            const targetGlobalIndex = startIndex + targetLocalIndex;
            
            const targetScrollX = (targetGlobalIndex * PIXELS_PER_HOUR) - (scrollContainer.clientWidth / 2);
            scrollContainer.scrollLeft = targetScrollX;
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

        if ("serviceWorker" in navigator) {
            window.addEventListener("load", async () => {
                try {
                    const reg = await navigator.serviceWorker.register("./sw.js");
                    console.log("ServiceWorker registered: ./sw.js");
                    
                    reg.addEventListener('updatefound', () => {
                        const newWorker = reg.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    showUpdateToast();
                                }
                            });
                        }
                    });

                    // Reload when new SW takes over
                    navigator.serviceWorker.addEventListener('controllerchange', () => {
                        window.location.reload();
                    });
                } catch(err) {
                    console.warn("SW registration failed:", err);
                }
                
                checkAppVersion();
            });
        }

        // PWA Install Prompt
        let deferredInstallPrompt = null;

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredInstallPrompt = e;
            showInstallButton();
        });

        window.addEventListener('appinstalled', () => {
            deferredInstallPrompt = null;
            const installBtn = document.getElementById('pwa-install-btn');
            if (installBtn) installBtn.style.display = 'none';
            console.log('PWA installed successfully');
        });

        function showInstallButton() {
            const existing = document.getElementById('pwa-install-btn');
            if (existing) {
                existing.style.display = 'flex';
                return;
            }
            const container = document.querySelector('.controls-right');
            if (!container || !deferredInstallPrompt) return;

            const btn = document.createElement('button');
            btn.id = 'pwa-install-btn';
            btn.title = t('config.installApp');
            btn.style.cssText = 'display:flex; align-items:center; justify-content:center; background:transparent; border:none; color:inherit; cursor:pointer; margin-right:4px;';
            btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:20px">download</span>';
            btn.addEventListener('click', async () => {
                if (!deferredInstallPrompt) return;
                deferredInstallPrompt.prompt();
                const result = await deferredInstallPrompt.userChoice;
                deferredInstallPrompt = null;
                btn.style.display = 'none';
            });
            container.insertBefore(btn, container.firstChild);
        }
        
        async function checkAppVersion() {
            try {
                const response = await fetch('./version.json?t=' + Date.now());
                if (!response.ok) return;
                const data = await response.json();
                const remoteVersion = data.version;
                const localVersion = localStorage.getItem('appVersion');
                
                if (localVersion && remoteVersion && localVersion !== remoteVersion) {
                    localStorage.setItem('appVersion', remoteVersion);
                    showChangelogModal(remoteVersion);
                } else if (!localVersion && remoteVersion) {
                    localStorage.setItem('appVersion', remoteVersion);
                }
            } catch (error) {
                console.warn('Failed to check app version:', error);
            }
        }
        
        function showUpdateToast() {
            const toast = document.getElementById('update-toast');
            const text = document.getElementById('update-toast-text');
            const btn = document.getElementById('update-toast-btn');
            
            if (document.getElementById('changelog-modal').classList.contains('open')) {
                return;
            }
            
            if (toast && text && btn) {
                text.textContent = t('config.newVersionAvailable') || 'Nueva versión disponible';
                btn.textContent = t('config.whatsNew') || 'Ver Novedades';
                
                btn.onclick = () => {
                    toast.style.display = 'none';
                    checkAppVersion(); 
                };
                
                toast.style.display = 'flex';
            }
        }
        
        let _activeSheets = {};
        let _sheetIdCounter = 0;

        function getScrollElement(sheet, scrollElementId) {
            if (!scrollElementId) return sheet;
            return document.getElementById(scrollElementId) || sheet;
        }

        function openBottomSheet(sheetId, backdropId = 'pill-sheet-backdrop', scrollElementId) {
            const sheet = document.getElementById(sheetId);
            const backdrop = document.getElementById(backdropId);

            if (!sheet || !backdrop) return () => {};

            if (_activeSheets[backdropId]) {
                _activeSheets[backdropId]();
            }

            _sheetIdCounter++;
            const depth = _sheetIdCounter;
            const sheetZ = 7000 + depth * 100;
            const backdropZ = 6999 + depth * 100;
            sheet.style.zIndex = sheetZ;
            backdrop.style.zIndex = backdropZ;

            sheet.style.transform = '';
            sheet.classList.add('open');
            backdrop.classList.add('open');

            let startY = 0;
            let currentY = 0;
            let isDragging = false;
            let usingTouch = false;
            let touchFallback = false;

            const closeSheet = () => {
                sheet.classList.remove('open');
                backdrop.classList.remove('open');
                sheet.style.transform = '';
                sheet.style.transition = '';
                sheet.style.zIndex = '';
                backdrop.style.zIndex = '';
                backdrop.onclick = null;
                cleanup();
                if (_activeSheets[backdropId] === closeSheet) {
                    delete _activeSheets[backdropId];
                }
            };

            backdrop.onclick = closeSheet;

            const onDragStart = (clientY) => {
                startY = clientY;
                currentY = clientY;
                isDragging = true;
                sheet.style.transition = 'none';
            };

            const onDragMove = (clientY) => {
                if (!isDragging) return;
                const scrollEl = getScrollElement(sheet, scrollElementId);
                if (scrollEl.scrollTop > 0) return;
                currentY = clientY;
                const diff = currentY - startY;
                if (diff > 0) {
                    sheet.style.transform = `translateY(${diff}px)`;
                }
            };

            const onDragEnd = () => {
                if (!isDragging) return;
                isDragging = false;
                sheet.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)';
                if (currentY - startY > 100) {
                    closeSheet();
                } else {
                    sheet.style.transform = 'translateY(0)';
                }
            };

            const onPointerDown = (e) => {
                usingTouch = e.pointerType === 'touch' || e.pointerType === 'pen';
                onDragStart(e.clientY);
            };

            const onPointerMove = (e) => {
                onDragMove(e.clientY);
            };

            const onPointerUp = () => {
                onDragEnd();
            };

            const onPointerCancel = () => {
                if (!isDragging) return;
                touchFallback = true;
                sheet.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)';
            };

            const onTouchStart = (e) => {
                if (usingTouch) return;
                usingTouch = true;
                onDragStart(e.touches[0].clientY);
            };

            const onTouchMove = (e) => {
                if (touchFallback) {
                    if (!isDragging) return;
                    const scrollEl = getScrollElement(sheet, scrollElementId);
                    if (scrollEl.scrollTop > 0) return;
                    currentY = e.touches[0].clientY;
                    const diff = currentY - startY;
                    if (diff > 0) {
                        sheet.style.transform = `translateY(${diff}px)`;
                    }
                    return;
                }
                if (usingTouch) return;
                if (sheet.scrollTop > 0) return;
                onDragMove(e.touches[0].clientY);
            };

            const onTouchEnd = () => {
                if (touchFallback) {
                    touchFallback = false;
                    isDragging = false;
                    if (currentY - startY > 100) {
                        closeSheet();
                    } else {
                        sheet.style.transform = 'translateY(0)';
                    }
                    return;
                }
                if (usingTouch) return;
                onDragEnd();
            };

            const cleanup = () => {
                touchFallback = false;
                sheet.removeEventListener('pointerdown', onPointerDown);
                window.removeEventListener('pointermove', onPointerMove);
                window.removeEventListener('pointerup', onPointerUp);
                window.removeEventListener('pointercancel', onPointerCancel);
                sheet.removeEventListener('touchstart', onTouchStart);
                sheet.removeEventListener('touchmove', onTouchMove);
                sheet.removeEventListener('touchend', onTouchEnd);
                window.removeEventListener('touchend', onTouchEnd);
            };

            sheet.addEventListener('pointerdown', onPointerDown);
            window.addEventListener('pointermove', onPointerMove);
            window.addEventListener('pointerup', onPointerUp);
            window.addEventListener('pointercancel', onPointerCancel);
            sheet.addEventListener('touchstart', onTouchStart, { passive: true });
            sheet.addEventListener('touchmove', onTouchMove, { passive: true });
            sheet.addEventListener('touchend', onTouchEnd);
            window.addEventListener('touchend', onTouchEnd);

            _activeSheets[backdropId] = closeSheet;
            return closeSheet;
        }
        window.openBottomSheet = openBottomSheet;

        function openChangelogDetail(item) {
            document.getElementById('changelog-detail-title').textContent = `v${item.version}`;
            document.getElementById('changelog-detail-subtitle').textContent = "Detalles de esta versión";
            
            const listEl = document.getElementById('changelog-detail-list');
            listEl.innerHTML = '';
            
            if (item.changes && item.changes.length > 0) {
                item.changes.forEach(change => {
                    const li = document.createElement('li');
                    li.textContent = change;
                    li.style.marginBottom = '12px';
                    listEl.appendChild(li);
                });
            } else {
                const li = document.createElement('li');
                li.textContent = 'Actualizaciones menores y corrección de errores.';
                listEl.appendChild(li);
            }
            
            openBottomSheet('changelog-detail-sheet', 'changelog-detail-backdrop', 'changelog-detail-scroll-content');
        }

        function renderChangelogData(changelogData, version, listEl, closeBtn, updateBtn) {
            const renderData = version ? [changelogData.find(item => item.version === version) || {version: version, changes: []}] : changelogData;

            renderData.forEach((item, index) => {
                const li = document.createElement('li');
                li.style.position = 'relative';
                li.style.paddingLeft = '30px';
                li.style.cursor = 'pointer';
                li.style.animation = `fadeInUp 0.4s ease forwards ${index * 0.1}s`;
                li.style.opacity = '0';
                li.style.transform = 'translateY(10px)';

                const isMajor = item.version.endsWith('.0');

                const marker = document.createElement('div');
                marker.style.position = 'absolute';
                marker.style.left = '-7px';
                marker.style.top = '16px';
                marker.style.width = '16px';
                marker.style.height = '16px';
                marker.style.borderRadius = '50%';
                marker.style.background = isMajor ? 'var(--accent-temp)' : 'var(--grid-color)';
                marker.style.border = '3px solid var(--bg-color)';
                marker.style.zIndex = '2';
                li.appendChild(marker);

                const content = document.createElement('div');
                content.style.background = 'var(--card-bg)';
                content.style.borderRadius = '12px';
                content.style.padding = '16px';
                content.style.border = '1px solid var(--grid-color)';

                const header = document.createElement('div');
                header.style.display = 'flex';
                header.style.alignItems = 'center';
                header.style.gap = '8px';
                header.style.marginBottom = '8px';

                const tag = document.createElement('span');
                tag.textContent = isMajor ? 'Major' : 'Patch';
                tag.style.fontSize = '0.7rem';
                tag.style.fontWeight = 'bold';
                tag.style.padding = '2px 8px';
                tag.style.borderRadius = '12px';
                tag.style.background = isMajor ? 'rgba(59, 130, 246, 0.1)' : 'rgba(156, 163, 175, 0.1)';
                tag.style.color = isMajor ? '#3b82f6' : 'var(--text-secondary)';
                header.appendChild(tag);

                const title = document.createElement('div');
                title.textContent = `v${item.version}`;
                title.style.fontWeight = 'bold';
                title.style.fontSize = isMajor ? '1.1rem' : '1rem';
                title.style.color = 'var(--text-primary)';
                header.appendChild(title);

                if (version && index === 0) {
                    const unreadDot = document.createElement('div');
                    unreadDot.style.width = '8px';
                    unreadDot.style.height = '8px';
                    unreadDot.style.borderRadius = '50%';
                    unreadDot.style.background = '#3b82f6';
                    unreadDot.style.marginLeft = 'auto';
                    header.appendChild(unreadDot);
                }

                content.appendChild(header);

                const desc = document.createElement('div');
                desc.style.fontSize = '0.85rem';
                desc.style.color = 'var(--text-secondary)';
                desc.style.display = '-webkit-box';
                desc.style.webkitLineClamp = '2';
                desc.style.webkitBoxOrient = 'vertical';
                desc.style.overflow = 'hidden';
                desc.textContent = (item.changes && item.changes.length > 0) ? item.changes[0] : 'Actualizaciones menores y corrección de errores.';
                content.appendChild(desc);

                li.appendChild(content);

                li.onclick = () => openChangelogDetail(item);

                listEl.appendChild(li);
            });

            const closeSheet = openBottomSheet('changelog-modal', 'changelog-sheet-backdrop', 'changelog-scroll-content');

            closeBtn.onclick = () => closeSheet();
            updateBtn.onclick = async () => {
                closeSheet();
                await performClearCacheAndReload();
            };
        }

        function showChangelogModal(version) {
            const modal = document.getElementById('changelog-modal');
            const titleEl = document.getElementById('changelog-title');
            const listEl = document.getElementById('changelog-list');
            const closeBtn = document.getElementById('changelog-close-btn');
            const updateContainer = document.getElementById('changelog-update-container');
            const updateBtn = document.getElementById('changelog-update-btn');

            if (!modal || !titleEl || !listEl || !closeBtn || !updateBtn) return;

            // Clear previous content immediately to avoid stale items
            listEl.innerHTML = '';

            if (version) {
                const titleFormat = t('config.changelogTitle') || 'Novedades v{version}';
                titleEl.textContent = titleFormat.replace('{version}', version);
                updateContainer.style.display = 'flex';
                updateBtn.textContent = (t('config.update') || 'Actualizar') + ' a v' + version;
            } else {
                titleEl.textContent = t('config.changelogTitleAll') || 'Todos los cambios';
                updateContainer.style.display = 'none';
}

            renderChangelogData(changelogData, version, listEl, closeBtn, updateBtn);
        }
        
        let _isClearingCache = false;

        async function performClearCacheAndReload() {
            if (_isClearingCache) return;
            _isClearingCache = true;
            weatherCache.clear();
            try { storageService.db?.close(); } catch(e) {}
            if ('caches' in window) {
                try {
                    const cacheNames = await caches.keys();
                    await Promise.all(cacheNames.map(name => caches.delete(name)));
                } catch(e) { console.warn(e); }
            }
            if ('serviceWorker' in navigator) {
                try {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (let reg of registrations) {
                        if (reg.active) reg.active.postMessage({ action: 'skipWaiting' });
                        await reg.unregister();
                    }
                } catch(e) { console.warn(e); }
            }
            const url = new URL(location.href);
            url.searchParams.set('_t', Date.now());
            location.href = url.toString();
        }
