/**
         * CONFIGURACIÓN Y ESTADO
         */
import { state, CONFIG, getDPR } from './store.js';
import { getThemeColor, getThemeIcon, getThemeFont, loadChartTheme, applyThemeDOM } from './theme.js';
import { getLocale, setLanguage, getLanguage, applyTranslations, t } from './utils/i18n.js';
import { weatherService } from './services/WeatherService.js';
import { geoService } from './services/GeoService.js';
import { generateDailyCards, updateActiveDailyCard, getWeatherIconSVG } from './ui/DailyCards.js';
import { processData } from './services/DataProcessor.js';
import { generateMockData } from './services/MockData.js';
import { getAQIInfo, getPollenText } from './services/AqiManager.js';
import { drawAQIRadar } from './ui/AqiRadar.js';
import { drawPollenRadar } from './ui/PollenRadar.js';
import { getWeatherDescription } from './utils/weather.js';
import { normalizeY } from './utils/math.js';
import { drawHumidity, drawWind, drawTemperature } from './render/MetricsRenderer.js';
import { drawClouds, drawPrecipitation, drawPrecipitationProbability } from './render/AtmosphereRenderer.js';
import { drawGrid, drawDayNames, drawAxes } from './render/GridRenderer.js';
import { drawWeatherPhenomena, drawStarrySky, drawUVSegments, drawSunMarkersOnCanvas, drawSunnyBackground, drawNightOverlay, drawNightShadow } from './render/BackgroundRenderer.js';

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
        const TILE_WIDTH = 1440; // 24 hours * 60px/hour to prevent overlapping artifacts
        let scrollContainer, minimapViewport, themeToggle, locationInput, suggestionsBox, searchBtn, geoBtn;
        let searchTimeout = null;
        let ticking = false;
        const PIXELS_PER_MM = 10;

        window.hexToRgb = hex => {
            let r = 0, g = 0, b = 0;
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
            await loadChartTheme(state.activeChartTheme);
            
            // Block zoom/pinch on iOS
            document.addEventListener('touchstart', (e) => {
                if (e.touches.length > 1) {
                    e.preventDefault();
                }
            }, { passive: false });

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
            locationInput = document.getElementById('location-input');
            suggestionsBox = document.getElementById('suggestions');
            searchBtn = document.getElementById('search-btn');
            geoBtn = document.getElementById('geo-btn');

            try {
                // Mobile toggles
                const toggleSearchBtn = document.getElementById('toggle-search-btn');
                const searchBox = document.getElementById('search-box');
                const controlsLeft = document.querySelector('.controls-left');

                if (toggleSearchBtn) {
                    toggleSearchBtn.addEventListener('click', () => {
                        const isActive = searchBox.classList.toggle('active');
                        toggleSearchBtn.classList.toggle('active', isActive);
                        controlsLeft.classList.toggle('has-active', isActive);
                    });
                }

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
                    alertsContainer.addEventListener('click', (e) => {
                        alertsContainer.classList.toggle('active');
                        // Auto-hide after 4 seconds on mobile
                        if (alertsContainer.classList.contains('active') && window.innerWidth <= 600) {
                            setTimeout(() => alertsContainer.classList.remove('active'), 4000);
                        }
                    });
                }

                // Theme setup
                themeToggle.addEventListener('click', toggleTheme);
                searchBtn.addEventListener('click', handleSearch);
                geoBtn.addEventListener('click', () => useMyLocation(true));
                locationInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') handleSearch(); });

                const floatingNowBtn = document.getElementById('floating-now-btn');
                if (floatingNowBtn) floatingNowBtn.addEventListener('click', centerOnCurrentTime);

                // Modal logic
                const btnInfo = document.getElementById('btn-info');
                const infoModal = document.getElementById('info-modal');
                const closeInfoBtn = document.getElementById('close-info-btn');
                if (btnInfo && infoModal) {
                    btnInfo.addEventListener('click', () => infoModal.style.display = 'flex');
                    closeInfoBtn.addEventListener('click', () => infoModal.style.display = 'none');
                    infoModal.addEventListener('click', (e) => {
                        if (e.target === infoModal) infoModal.style.display = 'none';
                    });
                }
                
                // I18n Logic
                const languageSelect = document.getElementById('language-select');
                if (languageSelect) {
                    languageSelect.value = getLanguage();
                    languageSelect.addEventListener('change', (e) => {
                        setLanguage(e.target.value);
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
                }
                applyTranslations();

                // Theme Logic
                const chartThemeSelect = document.getElementById('chart-theme-select');
                if (chartThemeSelect) {
                    const themeIds = ['default', 'neon', 'pastel'];
                    Promise.all(themeIds.map(id => fetch(`public/themes/${id}.json`).catch(() => fetch(`themes/${id}.json`)).then(r => r.json()))).then(themes => {
                        chartThemeSelect.innerHTML = '';
                        themes.forEach(t => {
                            const opt = document.createElement('option');
                            opt.value = t.id;
                            opt.innerText = t.name;
                            chartThemeSelect.appendChild(opt);
                        });
                        chartThemeSelect.value = state.activeChartTheme;
                    });
                    
                    chartThemeSelect.value = state.activeChartTheme;
                    chartThemeSelect.addEventListener('change', async (e) => {
                        state.activeChartTheme = e.target.value;
                        localStorage.setItem('chart_theme', state.activeChartTheme);
                        await loadChartTheme(state.activeChartTheme);
                        // Redraw everything
                        tiles.forEach(t => t.drawn = false);
                        minimapCacheCanvas = null;
                        render();
                    });
                }

                // Force refresh
                const forceRefreshBtn = document.getElementById('force-refresh-btn');
                if (forceRefreshBtn) {
                    forceRefreshBtn.addEventListener('click', async () => {
                        localStorage.clear();
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
                                    await reg.unregister();
                                }
                            } catch(e) { console.warn(e); }
                        }
                        window.location.reload(true);
                    });
                }

                // Suggestions logic
                let lastQuery = ""; // Variable para evitar repetir la misma búsqueda

locationInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const query = locationInput.value.trim().toLowerCase();

    // 1. Aumentamos el mínimo a 3 caracteres
    if (query.length < 3) {
        suggestionsBox.style.display = 'none';
        return;
    }

    // 2. Si la búsqueda es idéntica a la anterior, no hacemos nada
    if (query === lastQuery) return;

    // 3. Aumentamos el delay a 500ms
    searchTimeout = setTimeout(async () => {
        lastQuery = query; // Actualizamos la última consulta
        await fetchSuggestions(query);
    }, 500);
});

                document.addEventListener('click', (e) => {
                    if (!e.target.closest('.search-box') && !e.target.closest('.mobile-toggles')) {
                        closeMobilePanels();
                    }
                    if (!e.target.closest('.search-box')) suggestionsBox.style.display = 'none';
                });

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

                // Iniciamos con un timeout de seguridad para el overlay
                setTimeout(() => {
                    const overlay = document.getElementById('overlay');
                    if (overlay && !overlay.classList.contains('hidden') && document.getElementById('error-msg').style.display !== 'block') {
                        console.warn("Loading taking too long, forcing overlay hide");
                        // No lo ocultamos automáticamente por si realmente está cargando,
                        // pero mostramos un botón de "Saltar" si pasan 10 segundos
                        const statusText = document.getElementById('status-text');
                        if (statusText && statusText.innerText === t('overlay.loadingData')) {
                            statusText.innerHTML = `${t('overlay.loadingData')} <br><button onclick="document.getElementById('overlay').classList.add('hidden')" style="margin-top:10px; font-size:0.7rem; opacity:0.7;">${t('overlay.skipWait')}</button>`;
                        }
                    }
                }, 10000);

                // Minimap drag and drop
                let isMinimapDragging = false;
                const minimapContainer = document.getElementById('minimap-container');
                const dailyCardsContainer = document.getElementById('daily-cards-container');
                const toggleNavBtn = document.getElementById('toggle-nav-btn');
                let isDailyCardsView = localStorage.getItem('view_mode') === 'daily';

                const updateViewMode = () => {
                    if (isDailyCardsView) {
                        minimapContainer.style.display = 'none';
                        dailyCardsContainer.style.display = 'flex';
                        toggleNavBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px;">insights</span>';
                        if (state.dailyData && state.dailyData.length > 0) {
                            generateDailyCards(centerOnCurrentTime);
                            updateActiveDailyCard();
                        }
                    } else {
                        minimapContainer.style.display = 'block';
                        dailyCardsContainer.style.display = 'none';
                        toggleNavBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px;">calendar_month</span>';
                        drawMinimap();
                        updateMinimapViewport();
                    }
                    localStorage.setItem('view_mode', isDailyCardsView ? 'daily' : 'minimap');
                };

                if (toggleNavBtn) {
                    toggleNavBtn.addEventListener('click', () => {
                        isDailyCardsView = !isDailyCardsView;
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

                // Eventos de expansión de texto
                document.getElementById('location-name').addEventListener('click', function() {
                    this.classList.toggle('expanded');
                });
                document.getElementById('weather-summary').addEventListener('click', function() {
                    this.classList.toggle('expanded');
                });

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
                
                if (metricsContainer && scrollIndLeft && scrollIndRight) {
                    const updateScrollIndicator = () => {
                        const hasOverflow = metricsContainer.scrollWidth > metricsContainer.clientWidth;
                        const isAtStart = metricsContainer.scrollLeft <= 5;
                        const isAtEnd = metricsContainer.scrollLeft + metricsContainer.clientWidth >= metricsContainer.scrollWidth - 5;
                        
                        // Right indicator
                        if (hasOverflow && !isAtEnd) {
                            scrollIndRight.style.display = 'flex';
                            scrollIndRight.style.opacity = '1';
                        } else {
                            scrollIndRight.style.opacity = '0';
                            setTimeout(() => {
                                if (scrollIndRight.style.opacity === '0') scrollIndRight.style.display = 'none';
                            }, 300);
                        }

                        // Left indicator
                        if (hasOverflow && !isAtStart) {
                            scrollIndLeft.style.display = 'flex';
                            scrollIndLeft.style.opacity = '1';
                        } else {
                            scrollIndLeft.style.opacity = '0';
                            setTimeout(() => {
                                if (scrollIndLeft.style.opacity === '0') scrollIndLeft.style.display = 'none';
                            }, 300);
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

        async function fetchSuggestions(query) {
            try {
                const results = await geoService.searchLocation(query, 5);
                showSuggestions(results);
            } catch (err) {
                console.error("Error fetching suggestions", err);
                suggestionsBox.style.display = 'none';
            }
        }

        function showSuggestions(results) {
            suggestionsBox.innerHTML = '';
            if (results.length === 0) {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.style.cursor = 'default';
                div.innerText = 'No se encontraron resultados';
                suggestionsBox.appendChild(div);
            } else {
                results.forEach(loc => {
                    const div = document.createElement('div');
                    div.className = 'suggestion-item';
                    const admin = loc.admin1 ? `<span class="admin">(${loc.admin1}, ${loc.country})</span>` : `<span class="admin">(${loc.country})</span>`;
                    div.innerHTML = `<strong>${loc.name}</strong> ${admin}`;
                    div.onclick = () => {
                        state.lat = loc.latitude;
                        state.lon = loc.longitude;
                        state.locationName = loc.name + (loc.admin1 ? `, ${loc.admin1}` : "");
                        locationInput.value = loc.name;
                        suggestionsBox.style.display = 'none';
                        updateLocationUI();
                        closeMobilePanels();
                        loadWeather();
                    };
                    suggestionsBox.appendChild(div);
                });
            }
            suggestionsBox.style.display = 'block';
        }

        async function useMyLocation(force = false) {
            if (!force) {
                const savedLocation = localStorage.getItem('last_weather_location');
                if (savedLocation) {
                    try {
                        const loc = JSON.parse(savedLocation);
                        state.lat = loc.lat;
                        state.lon = loc.lon;
                        state.locationName = loc.name;
                        updateLocationUI();
                        closeMobilePanels();
                        await loadWeather();
                        return;
                    } catch (e) {
                        localStorage.removeItem('last_weather_location');
                    }
                }
            }

            document.getElementById('overlay').classList.remove('hidden');
            document.getElementById('status-text').innerText = "Obteniendo ubicación...";
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
            closeMobilePanels();
            await loadWeather();
        }

        async function loadWeather() {
            const overlay = document.getElementById('overlay');
            const statusText = document.getElementById('status-text');
            const errorMsg = document.getElementById('error-msg');
            const loader = document.querySelector('.loader');

            overlay.classList.remove('hidden');
            statusText.innerText = t('overlay.loadingData');
            statusText.style.display = 'block';
            loader.style.display = 'block';
            errorMsg.style.display = 'none';

            try {
                state.hourlyData = [];
                await fetchWeatherData(7, 7);

                // Forzamos ocultar si llegamos aquí sin errores fatales
                if (errorMsg.style.display !== 'block') {
                    overlay.classList.add('hidden');
                } else {
                    // Si hay un error mostrado, nos aseguramos que el loader se quite
                    if (loader) loader.style.display = 'none';
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
                }, 8000);

                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        clearTimeout(timeout);
                        resolve(pos);
                    },
                    (err) => {
                        clearTimeout(timeout);
                        reject(err);
                    },
                    { timeout: 7000, enableHighAccuracy: false }
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

        async function handleSearch() {
            const query = locationInput.value.trim();
            if (!query) return;

            try {
                const results = await geoService.searchLocation(query, 1);
                if (results.length > 0) {
                    const loc = results[0];
                    state.lat = loc.latitude;
                    state.lon = loc.longitude;
                    state.locationName = loc.name + (loc.admin1 ? `, ${loc.admin1}` : "");
                    updateLocationUI();
                    closeMobilePanels();
                    await loadWeather();
                } else {
                    console.warn("No se encontró la ubicación.");
                }
            } catch (err) {
                console.error("Search error:", err);
                showError("Error al buscar la ubicación.");
            }
        }

        function updateLocationUI() {
            document.getElementById('location-name').innerText = state.locationName;
            if (state.lat && state.lon) {
                localStorage.setItem('last_weather_location', JSON.stringify({
                    lat: state.lat,
                    lon: state.lon,
                    name: state.locationName
                }));
            }
        }

        function closeMobilePanels() {
            const searchBox = document.getElementById('search-box');
            const toggleSearchBtn = document.getElementById('toggle-search-btn');
            const controlsLeft = document.querySelector('.controls-left');

            if (searchBox) searchBox.classList.remove('active');
            if (toggleSearchBtn) toggleSearchBtn.classList.remove('active');
            if (controlsLeft) controlsLeft.classList.remove('has-active');
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
            const h = scrollContainer.clientHeight;
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

        function updateMinimapViewport() {
            if (!state.hourlyData.length) return;

            const totalMainWidth = state.hourlyData.length * PIXELS_PER_HOUR;
            const scrollRatio = scrollContainer.scrollLeft / totalMainWidth;
            const visibleRatio = scrollContainer.clientWidth / totalMainWidth;

            const minimapW = minimapCanvas.clientWidth;
            
            const vpWidth = visibleRatio * minimapW;
            const vpLeft = scrollRatio * minimapW;

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

            const step = w / state.hourlyData.length;

            // 1. Background (Day/Night)
            ctx.fillStyle = '#fffde7'; // Day
            ctx.fillRect(0, 0, w, h);

            ctx.fillStyle = '#f3e8ff'; // Night
            state.hourlyData.forEach((d, i) => {
                if (d.isNight) {
                    ctx.fillRect(i * step, 0, step + 0.5, h);
                }
            });

            // 2. Grid & Day Labels
            ctx.save();
            state.hourlyData.forEach((d, i) => {
                if (d.localHour === 0) {
                    const x = i * step;
                    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, h);
                    ctx.stroke();

                    ctx.fillStyle = '#666666';
                    ctx.font = `bold 9px ${getThemeFont()}`;
                    ctx.fillText(d.localDayShort, x + 4, 12);
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
            state.hourlyData.forEach((d, i) => {
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

            // Precipitation bars
            ctx.fillStyle = 'rgba(25, 118, 210, 0.5)';
            state.hourlyData.forEach((d, i) => {
                if (d.precip > 0) {
                    const x = i * step;
                    const barH = Math.max(2, Math.min(h, d.precip * 5));
                    ctx.fillRect(x, h - barH, Math.max(1, step - 0.5), barH);
                }
            });

            // Precipitation Probability
            ctx.save();
            ctx.fillStyle = 'rgba(2, 136, 209, 0.2)';
            ctx.strokeStyle = '#0288d1';
            ctx.lineWidth = 1;
            const probPath = new Path2D();
            state.hourlyData.forEach((d, i) => {
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
            state.hourlyData.forEach((d, i) => {
                const x = i * step;
                const y = normalizeY(d.temp, -20, 40, h);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();

            // UV Segments
            state.hourlyData.forEach((d, i) => {
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
            const startTime = state.hourlyData[0].time;
            const nowIndex = (now - startTime) / 3600000;
            if (nowIndex >= 0 && nowIndex <= state.hourlyData.length) {
                const nowX = nowIndex * step;
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
            if (!state.hourlyData.length) return;

            const w = fixedOverlayCanvas.clientWidth;
            const h = scrollContainer.clientHeight; 

            fixedOverlayCtx.clearRect(0, 0, fixedOverlayCanvas.clientWidth, fixedOverlayCanvas.clientHeight);

            // Calculate Exact Subpixel Scrubber Frame
            const activeX = scrollContainer.scrollLeft + 60;
            const drawX = 60;

            // 0 Degree Marker Line Label
            const y0 = normalizeY(0, -20, 40, h);
            fixedOverlayCtx.save();
            fixedOverlayCtx.fillStyle = getThemeColor('zeroLine', 'rgba(2, 136, 209, 0.8)'); // Ice blue
            fixedOverlayCtx.font = `bold 10px ${getThemeFont()}`;
            fixedOverlayCtx.textAlign = 'left';
            fixedOverlayCtx.textBaseline = 'middle';
            fixedOverlayCtx.fillText('0°C', 5, y0 - 8);
            
            // Icon
            fixedOverlayCtx.fillStyle = getThemeColor('zeroLineIcon', '#0288d1');
            fixedOverlayCtx.font = '12px "Material Symbols Outlined"';
            fixedOverlayCtx.fillText(getThemeIcon('zeroLine', 'ac_unit'), 5, y0 + 6);
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
                const precipProb = interpolate(d1.precipProb, d2.precipProb);

                fixedOverlayCtx.save();
                fixedOverlayCtx.setLineDash([]);
                fixedOverlayCtx.font = `bold 10px ${getThemeFont()}`;
                fixedOverlayCtx.textAlign = 'left';
                fixedOverlayCtx.textBaseline = 'middle';
                fixedOverlayCtx.strokeStyle = '#fff';
                fixedOverlayCtx.lineWidth = 1.5;

                const drawPoint = (y, color, value, unit, shape = 'circle', icon = '', secondaryText = null, secondaryColor = null) => {
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
                        // El texto tiene margen de seguridad de 10px
                        let constrainedY = Math.max(10, Math.min(h - 10, y));
                        const text = `${value}${unit}`;

                        fixedOverlayCtx.save();
                        fixedOverlayCtx.font = `bold 11px ${getThemeFont()}`;
                        const textMetrics = fixedOverlayCtx.measureText(text);
                        let secMetrics = { width: 0 };
                        if (secondaryText) {
                            secMetrics = fixedOverlayCtx.measureText(secondaryText);
                        }
                        
                        // Calculate width for icon if present
                        let iconWidth = 0;
                        if (icon) {
                            fixedOverlayCtx.font = '12px "Material Symbols Outlined"';
                            iconWidth = fixedOverlayCtx.measureText(icon).width + 4;
                            fixedOverlayCtx.font = `bold 11px ${getThemeFont()}`; // restore
                        }
                        
                        const bgW = textMetrics.width + secMetrics.width + iconWidth + 12 + (secondaryText ? 4 : 0);
                        const bgH = 18;

                        // Sistema de detección de colisiones simple para etiquetas en la línea vertical
                        if (!state.labelRects) state.labelRects = [];

                        let rect = {
                            x: drawX + 4,
                            y: constrainedY - bgH / 2,
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
                                    rect.x = drawX + 4; // Reset X
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

                        if (rect.y < 0 || rect.y + rect.h > h) {
                            fixedOverlayCtx.restore();
                            return; // Skip if pushed out of bounds
                        }

                        state.labelRects.push(rect);

                        const c = window.hexToRgb ? window.hexToRgb(color) : {r: 0, g: 0, b: 0};
                        
                        const lightMix = getThemeColor('scrubber.bgLightMix', 0.85);
                        const bgR = Math.round(255 * lightMix + c.r * (1 - lightMix));
                        const bgG = Math.round(255 * lightMix + c.g * (1 - lightMix));
                        const bgB = Math.round(255 * lightMix + c.b * (1 - lightMix));

                        const opacity = getThemeColor('scrubber.bgOpacity', 0.75);
                        fixedOverlayCtx.fillStyle = `rgba(${bgR}, ${bgG}, ${bgB}, ${opacity})`;
                        fixedOverlayCtx.beginPath();
                        fixedOverlayCtx.roundRect(rect.x, rect.y, rect.w, rect.h, 4);
                        fixedOverlayCtx.fill();
                        fixedOverlayCtx.strokeStyle = getThemeColor('scrubber.borderColor', color);
                        fixedOverlayCtx.lineWidth = 0.5;
                        fixedOverlayCtx.stroke();

                        fixedOverlayCtx.fillStyle = color;
                        fixedOverlayCtx.textBaseline = 'middle';
                        
                        let textStartX = rect.x + 6;
                        
                        if (icon) {
                            fixedOverlayCtx.font = '12px "Material Symbols Outlined"';
                            fixedOverlayCtx.fillText(icon, textStartX, rect.y + rect.h / 2 + 1);
                            textStartX += iconWidth;
                        }
                        
                        fixedOverlayCtx.font = `bold 11px ${getThemeFont()}`;
                        fixedOverlayCtx.fillText(text, textStartX, rect.y + rect.h / 2 + 1);

                        if (secondaryText) {
                            textStartX += textMetrics.width + 4;
                            fixedOverlayCtx.fillStyle = secondaryColor;
                            fixedOverlayCtx.fillText(secondaryText, textStartX, rect.y + rect.h / 2 + 1);
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
                const showApparent = diff >= 1;
                const tempColor = '#d32f2f'; // El rojo normal de temperatura
                
                if (showApparent) {
                    const isCold = apparent <= temp;
                    const apparentColor = isCold ? '#0288d1' : '#f97316'; // Azul o Naranja fuerte
                    drawPoint(normalizeY(temp, -20, 40, h), tempColor, `${temp.toFixed(1)}°C`, '', 'circle', getThemeIcon('scrubber.temp', 'device_thermostat'), `(${apparent.toFixed(1)}°C)`, apparentColor);
                } else {
                    drawPoint(normalizeY(temp, -20, 40, h), tempColor, `${temp.toFixed(1)}°C`, '', 'circle', getThemeIcon('scrubber.temp', 'device_thermostat'));
                }

                // 1.1 Wind Gusts (discrete hourly metric)
                const currentData = state.hourlyData[index];
                if (currentData && currentData.gusts > 35) {
                    let color = getThemeColor('gusts.normal', '#64748b');
                    if (currentData.gusts > 70) color = getThemeColor('gusts.extreme', '#dc2626');
                    else if (currentData.gusts > 50) color = getThemeColor('gusts.strong', '#ea580c');

                    // Draw label
                    drawPoint(h - 35, color, currentData.gusts.toFixed(1), 'km/h', 'none', getThemeIcon('scrubber.wind', 'air'));
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
                    const pIcon = isSnow ? 'ac_unit' : isThunder ? 'bolt' : getThemeIcon('scrubber.precip', 'water_drop');
                    
                    let pColor = '#1976d2';
                    if (isSnow) pColor = '#000000';
                    else if (isThunder) pColor = '#5e35b1';

                    drawPoint(barY - 12, pColor, pVal.toFixed(1) + (isBroken ? ' (!)' : ''), ' mm', 'none', pIcon);
                }

                // 7. Probabilidad de Precipitación
                const getProbY = (val) => h - (h * (val / 100));
                const py1 = getProbY(d1.precipProb);
                const py2 = getProbY(d2.precipProb);
                const t = progress;
                const probY = py1 * (1 - t) * (1 - t) * (1 + 2 * t) + py2 * t * t * (3 - 2 * t);
                drawPoint(probY, '#0288d1', Math.round(precipProb), '%', 'diamond', getThemeIcon('scrubber.prob', 'water_drop'));

                // 8. Nubes
                const getY = (d) => h - (h * (d.clouds / 100));
                const y1 = getY(d1);
                const y2 = getY(d2);
                const midY = (y1 + y2) / 2;
                const puff = ((d1.clouds / 100) * 12 + (d2.clouds / 100) * 12) / 2;

                let cloudY;
                if (puff < 0.5) {
                    cloudY = y1 + (y2 - y1) * progress;
                } else {
                    if (progress < 0.5) {
                        const t2 = progress * 2;
                        const cp1y = y1 - puff;
                        const cp2y = midY - puff;
                        cloudY = Math.pow(1-t2, 3) * y1 + 3 * Math.pow(1-t2, 2) * t2 * cp1y + 3 * (1-t2) * t2 * t2 * cp2y + Math.pow(t2, 3) * midY;
                    } else {
                        const t2 = (progress - 0.5) * 2;
                        const cp3y = midY - puff;
                        const cp4y = y2 - puff;
                        cloudY = Math.pow(1-t2, 3) * midY + 3 * Math.pow(1-t2, 2) * t2 * cp3y + 3 * (1-t2) * t2 * t2 * cp4y + Math.pow(t2, 3) * y2;
                    }
                }
                drawPoint(cloudY, '#475569', Math.round(clouds), '%', 'circle', getThemeIcon('scrubber.cloud', 'cloud'));

                // 9. UV Index Interaction Canvas Mode
                const oldUvBlockDOM = document.getElementById('uv-active-block');
                if (oldUvBlockDOM) oldUvBlockDOM.remove();

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

                    fixedOverlayCtx.save();
                    fixedOverlayCtx.translate(-scrollContainer.scrollLeft, 0);
                    
                    const cellAbsX = index * PIXELS_PER_HOUR;
                        
                    // Draw full block identical to mobile
                    fixedOverlayCtx.fillStyle = opacityColor;
                    fixedOverlayCtx.beginPath();
                    fixedOverlayCtx.rect(cellAbsX, 0, PIXELS_PER_HOUR, 14);
                    fixedOverlayCtx.fill();
                    
                    fixedOverlayCtx.fillStyle = textColor;
                    fixedOverlayCtx.font = `bold 8.5px ${getThemeFont()}`;
                    fixedOverlayCtx.textAlign = 'center';
                    fixedOverlayCtx.textBaseline = 'middle';
                    fixedOverlayCtx.fillText(uvText, cellAbsX + PIXELS_PER_HOUR / 2, 8);
                    
                    // Redraw the X axis hour digits to overlap the UV block
                    const drawTick = (tickX, hourLabel) => {
                        const isSunMarker = state.hourlyData.length && Object.values(state.sunData).some(sun => {
                            if (!sun || !sun.sunrise || !sun.sunset) return false;
                            const markerX = ((sun.sunrise - state.hourlyData[0].time) / 3600000) * PIXELS_PER_HOUR;
                            const markerX2 = ((sun.sunset - state.hourlyData[0].time) / 3600000) * PIXELS_PER_HOUR;
                            return Math.abs(markerX - tickX) < 25 || Math.abs(markerX2 - tickX) < 25;
                        });
                        
                        if (!isSunMarker) {
                            fixedOverlayCtx.font = `bold 10px ${getThemeFont()}`;
                            fixedOverlayCtx.textAlign = 'center';
                            fixedOverlayCtx.textBaseline = 'alphabetic';
                            
                            fixedOverlayCtx.shadowBlur = 0;
                            fixedOverlayCtx.lineWidth = 2.5;
                            fixedOverlayCtx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
                            fixedOverlayCtx.beginPath();
                            fixedOverlayCtx.moveTo(tickX, 0);
                            fixedOverlayCtx.lineTo(tickX, 8);
                            fixedOverlayCtx.stroke();

                            fixedOverlayCtx.lineWidth = 1;
                            fixedOverlayCtx.strokeStyle = getThemeColor('xAxisLabel', '#666666');
                            fixedOverlayCtx.stroke();

                            fixedOverlayCtx.shadowColor = 'rgba(255, 255, 255, 1)';
                            fixedOverlayCtx.shadowBlur = 4;
                            fixedOverlayCtx.lineWidth = 2.5;
                            fixedOverlayCtx.strokeStyle = 'rgba(255, 255, 255, 1)';
                            fixedOverlayCtx.strokeText(hourLabel, tickX, 20);
                            
                            fixedOverlayCtx.shadowBlur = 0;
                            fixedOverlayCtx.fillStyle = getThemeColor('xAxisLabel', '#666666');
                            fixedOverlayCtx.fillText(hourLabel, tickX, 20);
                        }
                    };

                    fixedOverlayCtx.imageSmoothingEnabled = true;
                    drawTick(cellAbsX, d1.localHour.toString().padStart(2, '0'));
                    if (d2) {
                        drawTick(cellAbsX + PIXELS_PER_HOUR, d2.localHour.toString().padStart(2, '0'));
                    }
                    
                    fixedOverlayCtx.restore();
                }

                fixedOverlayCtx.restore();
            } else {
                const uvBlockDOM = document.getElementById('uv-active-block');
                if (uvBlockDOM) uvBlockDOM.remove();
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

            let d;
            let interpolatedData = {};

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

            document.getElementById('val-temp').innerHTML = `${currentData.temp}<span class="data-unit">°C</span>`;
            document.getElementById('val-apparent').innerText = `ST: ${currentData.apparent}°C`;

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
            
            const aqiHeader = document.getElementById('aqi-header-info');
            if (aqiHeader) {
                aqiHeader.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid rgba(128,128,128,0.2); padding-bottom:5px;">
                        <span style="font-weight:bold;">${t('aqi.title')}</span>
                        <span style="background:var(--accent-temp); color:white; padding:2px 6px; border-radius:4px; font-size:0.7rem;">${aqiInfo.val}</span>
                    </div>
                    <div style="font-weight:bold; color:var(--accent-temp); margin-bottom:4px; text-align:center;">${aqiInfo.text}</div>
                    <div style="font-size:0.7rem; line-height:1.4; opacity:0.9; text-align:center;">${aqiInfo.rec}</div>
                `;
            }
            const aqiRadar = document.getElementById('aqi-radar');
            if (aqiRadar) aqiRadar.style.display = 'block';

            // Polen
            const pollenText = getPollenText(currentData.pollen);
            document.querySelector('#val-pollen .pollen-text').innerText = pollenText;

            // Dibujamos el radar
            requestAnimationFrame(() => {
                drawAQIRadar(currentData);
                drawPollenRadar(currentData);
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
            state.dpr = getDPR();

            const containerH = scrollContainer.clientHeight;
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
            const totalWidth = state.hourlyData.length * PIXELS_PER_HOUR;
            scrollContainer.scrollLeft = (ratio * totalWidth) - (scrollContainer.clientWidth / 2);
        }

        function showError(msg) {
            const errDiv = document.getElementById('error-msg');
            errDiv.innerHTML = `
                <div style="margin-bottom: 15px;">${msg}</div>
                <button onclick="document.getElementById('overlay').classList.add('hidden')"
                        style="background: #666; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
                    Cerrar y ver app
                </button>
            `;
            errDiv.style.display = 'block';
            const loader = document.querySelector('.loader');
            if (loader) loader.style.display = 'none';
            const statusText = document.getElementById('status-text');
            if (statusText) statusText.style.display = 'none';
        }

        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                const swPaths = ['./sw.js', './public/sw.js'];
                let attempting = 0;

                const tryNext = () => {
                    if (attempting >= swPaths.length) return;
                    navigator.serviceWorker.register(swPaths[attempting])
                        .then(() => console.log('ServiceWorker registered:', swPaths[attempting]))
                        .catch(err => {
                            console.warn(`SW ${swPaths[attempting]} failed:`, err);
                            attempting++;
                            tryNext();
                        });
                };
                tryNext();
            });
        }
