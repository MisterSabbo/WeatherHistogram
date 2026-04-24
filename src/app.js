/**
         * CONFIGURACIÓN Y ESTADO
         */
        let PIXELS_PER_HOUR = window.innerWidth < 600 ? 50 : 60;
        const CHART_HEIGHT = 250;
        const MINIMAP_HEIGHT = 80;
        const DEFAULT_COORDS = { lat: 40.4167, lon: -3.70325, name: "Madrid" };
        const CACHE_DURATION = 5 * 60 * 1000;

        const getDPR = () => {
            return Math.min(window.devicePixelRatio || 1, 2);
        };

        let weatherCache = new Map();

        let state = {
            lat: null,
            lon: null,
            locationName: "Cargando...",
            hourlyData: [],
            dailyData: [],
            sunData: {},
            hoverX: null,
            isFetching: false,
            dpr: getDPR(),
            theme: 'dark',
            timezone: 'UTC',
            rawForecast: null,
            rawAQI: null,
            isDragging: false,
            startX: 0,
            scrollLeft: 0,
            activeChartTheme: localStorage.getItem('chart_theme') || 'default',
            themeConfig: null
        };

        function getThemeColor(path, fallbackColor) {
            if (!state.themeConfig || !state.themeConfig.colors) return fallbackColor;
            const parts = path.split('.');
            let val = state.themeConfig.colors;
            for (let p of parts) {
                if (val && val[p]) val = val[p];
                else return fallbackColor;
            }
            return typeof val === 'string' ? val : fallbackColor;
        }

        function getThemeIcon(path, fallbackIcon) {
            if (!state.themeConfig || !state.themeConfig.icons) return fallbackIcon;
            const parts = path.split('.');
            let val = state.themeConfig.icons;
            for (let p of parts) {
                if (val && val[p]) val = val[p];
                else return fallbackIcon;
            }
            return typeof val === 'string' ? val : fallbackIcon;
        }

        function getThemeFont() {
            return (state.themeConfig && state.themeConfig.font) ? state.themeConfig.font : 'Inter, sans-serif';
        }

        async function loadChartTheme(themeId) {
            const primaryPath = `themes/${themeId}.json`;
            const fallbackPath = `public/themes/${themeId}.json`;

            async function doFetch(url) {
                const res = await fetch(url);
                if (!res.ok) throw new Error('Not found');
                return await res.json();
            }

            try {
                // Intento 1: Ruta estándar (Build o Local Dev)
                state.themeConfig = await doFetch(primaryPath);
            } catch(e) {
                console.warn(`Theme not found at ${primaryPath}, trying ${fallbackPath}...`);
                try {
                    // Intento 2: Ruta del repositorio (si no se está usando build de Vite)
                    state.themeConfig = await doFetch(fallbackPath);
                } catch(e2) {
                    console.error('Theme loading failed completely:', e2);
                    // Fallback hardcodeado para asegurar que la app no se rompa
                    state.themeConfig = { "font": "Inter, sans-serif", "icons": { "scrubber": { "temp": "device_thermostat", "wind": "air", "precip": "rainy", "prob": "water_drop", "cloud": "cloud" }, "header": { "aqi": "air", "allergen": "eco", "precip": "rainy", "prob": "water_drop", "cloud": "cloud" }, "zeroLine": "ac_unit", "windDirection": "navigation" }, "colors": { "tempLine": "#d32f2f", "humidityLine": "rgba(0, 172, 193, 0.4)", "precipBar": "rgba(25, 118, 210, 0.4)", "precipProbArea": "rgba(2, 136, 209, 0.2)", "cloudsArea": "rgba(100, 116, 139, 0.2)", "uvLevels": { "low": "#4caf50", "moderate": "#fbc02d", "high": "#f57c00", "veryHigh": "#d32f2f", "extreme": "#7b1fa2" }, "wind": { "normalLight": "#64748b", "normalDark": "#cbd5e1", "cold": "#3b82f6", "hot": "#ef4444", "strongDefaultLight": "#dc2626", "strongDefaultDark": "#f87171" }, "gusts": { "normal": "#64748b", "strong": "#ea580c", "extreme": "#dc2626" }, "zeroLine": "rgba(2, 136, 209, 0.8)", "zeroLineIcon": "#0288d1", "referenceLine": "rgba(255, 255, 255, 0.3)", "scrubber": { "bgLightMix": 0.85, "bgOpacity": 0.75 } } };
                }
            }
            applyThemeDOM();
        }

        function applyThemeDOM() {
            document.body.style.fontFamily = getThemeFont();
            // Update header icons
            const elPrecip = document.querySelector('#val-precip .material-symbols-outlined');
            if (elPrecip) elPrecip.textContent = getThemeIcon('header.precip', 'rainy');
            
            const elProb = document.querySelector('#val-precip-prob .material-symbols-outlined');
            if (elProb) elProb.textContent = getThemeIcon('header.prob', 'water_drop');
            
            const elCloud = document.querySelector('#val-clouds .material-symbols-outlined');
            if (elCloud) elCloud.textContent = getThemeIcon('header.cloud', 'cloud');
            
            const elAqi = document.querySelector('#val-aqi .material-symbols-outlined');
            if (elAqi) elAqi.textContent = getThemeIcon('header.aqi', 'air');
            
            const elPollen = document.querySelector('#val-pollen .material-symbols-outlined');
            if (elPollen) elPollen.textContent = getThemeIcon('header.allergen', 'eco');
        }

        let minimapCanvas, minimapCtx;
        let fixedOverlayCanvas, fixedOverlayCtx;
        let minimapCacheCanvas = null;
        let tiles = [];
        const TILE_WIDTH = 1024;
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
                
                // Theme Logic
                const chartThemeSelect = document.getElementById('chart-theme-select');
                if (chartThemeSelect) {
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
                        if (statusText && statusText.innerText === "Cargando datos...") {
                            statusText.innerHTML = 'Cargando datos... <br><button onclick="document.getElementById(\'overlay\').classList.add(\'hidden\')" style="margin-top:10px; font-size:0.7rem; opacity:0.7;">Saltar espera</button>';
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
                            generateDailyCards();
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
                const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=es&format=json`);
                const data = await res.json();
                showSuggestions(data.results || []);
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
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${state.lat}&lon=${state.lon}&format=json`);
                    const data = await res.json();
                    state.locationName = data.address.city || data.address.town || data.address.village || data.address.county || "Ubicación actual";
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
            statusText.innerText = "Cargando datos...";
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
                const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=es&format=json`);
                const data = await res.json();
                if (data.results && data.results.length > 0) {
                    const loc = data.results[0];
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
        function generateMockData(pastDays, forecastDays) {
            const now = Math.floor(Date.now() / 1000);
            const start = now - (pastDays * 24 * 3600);
            const end = now + (forecastDays * 24 * 3600);

            const times = [];
            for (let t = start; t <= end; t += 3600) {
                times.push(t);
            }

            const hourlyCount = times.length;
            const mockForecast = {
                timezone: "UTC",
                hourly: {
                    time: times,
                    temperature_2m: Array.from({length: hourlyCount}, (_, i) => 15 + 10 * Math.sin(i / 12) + Math.random() * 2),
                    apparent_temperature: Array.from({length: hourlyCount}, (_, i) => 13 + 10 * Math.sin(i / 12) + Math.random() * 2),
                    precipitation: Array.from({length: hourlyCount}, () => Math.random() > 0.9 ? Math.random() * 2 : 0),
                    precipitation_probability: Array.from({length: hourlyCount}, () => Math.floor(Math.random() * 30)),
                    cloudcover: Array.from({length: hourlyCount}, () => Math.floor(Math.random() * 100)),
                    wind_speed_10m: Array.from({length: hourlyCount}, () => 5 + Math.random() * 15),
                    weather_code: Array.from({length: hourlyCount}, () => 0)
                },
                daily: {
                    time: [],
                    sunrise: [],
                    sunset: [],
                    weather_code: [],
                    temperature_2m_max: [],
                    temperature_2m_min: []
                }
            };

            for (let d = -pastDays; d <= forecastDays; d++) {
                const dayStart = Math.floor(new Date().setHours(0,0,0,0) / 1000) + (d * 24 * 3600);
                mockForecast.daily.time.push(dayStart);
                mockForecast.daily.sunrise.push(dayStart + 6 * 3600);
                mockForecast.daily.sunset.push(dayStart + 18 * 3600);
                mockForecast.daily.weather_code.push(0);
                mockForecast.daily.temperature_2m_max.push(25);
                mockForecast.daily.temperature_2m_min.push(15);
            }

            const mockAQI = {
                hourly: {
                    time: times,
                    european_aqi: Array.from({length: hourlyCount}, () => 20 + Math.floor(Math.random() * 30)),
                    alder_pollen: Array.from({length: hourlyCount}, () => Math.random() * 5),
                    birch_pollen: Array.from({length: hourlyCount}, () => Math.random() * 5),
                    grass_pollen: Array.from({length: hourlyCount}, () => Math.random() * 5),
                    mugwort_pollen: Array.from({length: hourlyCount}, () => Math.random() * 5),
                    olive_pollen: Array.from({length: hourlyCount}, () => Math.random() * 5),
                    ragweed_pollen: Array.from({length: hourlyCount}, () => Math.random() * 5)
                }
            };

            return { forecastData: mockForecast, aqiData: mockAQI };
        }

        async function fetchWeatherData(pastDays, forecastDays) {
            const cacheKey = `${state.lat.toFixed(4)},${state.lon.toFixed(4)},${pastDays},${forecastDays}`;
            const now = Date.now();

            if (weatherCache.has(cacheKey)) {
                const cached = weatherCache.get(cacheKey);
                if (now - cached.timestamp < CACHE_DURATION) {
                    console.log("Usando datos en caché para:", cacheKey);
                    state.rawForecast = cached.forecastData;
                    state.rawAQI = cached.aqiData;
                    processData(cached.forecastData, cached.aqiData);
                    handleResize();
                    return;
                }
            }

            if (state.isFetching) return;
            state.isFetching = true;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            try {
                const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${state.lat}&longitude=${state.lon}&hourly=temperature_2m,apparent_temperature,precipitation,precipitation_probability,cloudcover,wind_speed_10m,wind_gusts_10m,wind_direction_10m,weather_code,relative_humidity_2m,surface_pressure,uv_index,visibility&daily=sunrise,sunset,weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&past_days=${pastDays}&forecast_days=${forecastDays}&timeformat=unixtime`;
                const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${state.lat}&longitude=${state.lon}&hourly=european_aqi,pm10,pm2_5,nitrogen_dioxide,ozone,alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen&timezone=auto&past_days=${pastDays}&forecast_days=${forecastDays}&timeformat=unixtime`;

                const [forecastRes, aqiRes] = await Promise.all([
                    fetch(forecastUrl, { signal: controller.signal }),
                    fetch(aqiUrl, { signal: controller.signal })
                ]);

                clearTimeout(timeoutId);

                if (!forecastRes.ok || !aqiRes.ok) throw new Error("Error en la respuesta de la API");

                const forecastData = await forecastRes.json();
                const aqiData = await aqiRes.json();

                if (forecastData.error || aqiData.error) {
                    throw new Error(forecastData.reason || aqiData.reason || "Error de API");
                }

                // Guardar en caché
                weatherCache.set(cacheKey, {
                    timestamp: now,
                    forecastData,
                    aqiData
                });

                state.rawForecast = forecastData;
                state.rawAQI = aqiData;

                processData(forecastData, aqiData);
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

                    processData(cached.forecastData, cached.aqiData);
                    handleResize();
                } else {
                    // Fallback: Si no hay nada en caché, generamos datos simulados
                    console.warn("API falló y no hay caché, generando datos simulados");
                    const mock = generateMockData(pastDays, forecastDays);
                    state.rawForecast = mock.forecastData;
                    state.rawAQI = mock.aqiData;

                    state.locationName = "Ninguna";
                    updateLocationUI();

                    processData(mock.forecastData, mock.aqiData);
                    handleResize();
                }
            } finally {
                state.isFetching = false;
            }
        }

        function processData(forecastData, aqiData) {
            if (!forecastData || !forecastData.hourly || !forecastData.hourly.time || !aqiData || !aqiData.hourly || !aqiData.hourly.time) {
                throw new Error("Datos de API incompletos o inválidos");
            }
            const hourly = forecastData.hourly;
            const daily = forecastData.daily;
            const aqiHourly = aqiData.hourly;

            // Validar zona horaria
            let tz = forecastData.timezone;
            try {
                new Intl.DateTimeFormat('en-US', { timeZone: tz });
            } catch (e) {
                console.warn("Invalid timezone from API, falling back to UTC", tz);
                tz = 'UTC';
            }
            state.timezone = tz;

            if (daily && daily.time) {
                daily.time.forEach((t, i) => {
                    // Use local date string to match hourly data lookup
                    const dateObj = new Date(t * 1000);
                    const dateStr = dateObj.toLocaleDateString('en-CA', { timeZone: state.timezone });
                    state.sunData[dateStr] = {
                        sunrise: daily.sunrise[i] * 1000,
                        sunset: daily.sunset[i] * 1000
                    };
                });

                state.dailyData = daily.time.map((t, i) => ({
                    time: t * 1000,
                    weatherCode: daily.weather_code ? daily.weather_code[i] : 0,
                    tempMax: daily.temperature_2m_max ? daily.temperature_2m_max[i] : 0,
                    tempMin: daily.temperature_2m_min ? daily.temperature_2m_min[i] : 0,
                }));
            }

            const hourFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: state.timezone });
            const dayFormatter = new Intl.DateTimeFormat('es-ES', { weekday: 'long', timeZone: state.timezone });
            const shortDayFormatter = new Intl.DateTimeFormat('es-ES', { weekday: 'short', timeZone: state.timezone });

            const newHourly = hourly.time.map((t, i) => {
                const timestamp = t * 1000;
                const dateObj = new Date(timestamp);

                // Usamos la fecha local de la ciudad para buscar datos de sol
                const dateStr = dateObj.toLocaleDateString('en-CA', { timeZone: state.timezone });
                const sun = state.sunData[dateStr];
                let isNight = false;
                if (sun) {
                    // Consider it night if the hour is strictly before sunrise or strictly after sunset
                    // We check the hour's midpoint to be safe
                    const hourMidpoint = timestamp + 1800000; // +30 mins
                    isNight = hourMidpoint < sun.sunrise || hourMidpoint > sun.sunset;
                }

                const pollen = {
                    alder: (aqiHourly.alder_pollen && aqiHourly.alder_pollen[i]) || 0,
                    birch: (aqiHourly.birch_pollen && aqiHourly.birch_pollen[i]) || 0,
                    grass: (aqiHourly.grass_pollen && aqiHourly.grass_pollen[i]) || 0,
                    mugwort: (aqiHourly.mugwort_pollen && aqiHourly.mugwort_pollen[i]) || 0,
                    olive: (aqiHourly.olive_pollen && aqiHourly.olive_pollen[i]) || 0,
                    ragweed: (aqiHourly.ragweed_pollen && aqiHourly.ragweed_pollen[i]) || 0
                };
                const maxPollen = Math.max(...Object.values(pollen));

                const aqiDetails = {
                    pm10: aqiHourly.pm10 ? aqiHourly.pm10[i] : null,
                    pm2_5: aqiHourly.pm2_5 ? aqiHourly.pm2_5[i] : null,
                    ozone: aqiHourly.ozone ? aqiHourly.ozone[i] : null,
                    nitrogen_dioxide: aqiHourly.nitrogen_dioxide ? aqiHourly.nitrogen_dioxide[i] : null,
                };

                return {
                    time: timestamp,
                    localHour: parseInt(hourFormatter.format(dateObj)),
                    localDayName: dayFormatter.format(dateObj).toUpperCase(),
                    localDayShort: shortDayFormatter.format(dateObj).substring(0, 3).toUpperCase(),
                    temp: hourly.temperature_2m[i],
                    apparent: hourly.apparent_temperature[i],
                    precip: hourly.precipitation[i],
                    precipProb: hourly.precipitation_probability ? hourly.precipitation_probability[i] : 0,
                    clouds: hourly.cloudcover[i],
                    wind: hourly.wind_speed_10m[i],
                    windDir: hourly.wind_direction_10m ? hourly.wind_direction_10m[i] : 0,
                    gusts: hourly.wind_gusts_10m ? hourly.wind_gusts_10m[i] : hourly.wind_speed_10m[i],
                    humidity: hourly.relative_humidity_2m ? hourly.relative_humidity_2m[i] : 0,
                    pressure: hourly.surface_pressure ? hourly.surface_pressure[i] : 1013,
                    uv: hourly.uv_index ? hourly.uv_index[i] : 0,
                    visibility: hourly.visibility ? hourly.visibility[i] : 10000,
                    weatherCode: hourly.weather_code[i],
                    aqi: aqiHourly.european_aqi ? aqiHourly.european_aqi[i] : null,
                    aqiDetails: aqiDetails,
                    pollen: maxPollen,
                    pollenDetails: pollen,
                    isNight: isNight
                };
            });

            state.hourlyData = newHourly.sort((a, b) => a.time - b.time);
            
            // Generate daily cards if the container exists
            generateDailyCards();
        }

        /**
         * RENDERIZADO
         */
        function drawWeatherPhenomena(ctx, viewX, viewW, h) {
            const startIdx = Math.max(0, Math.floor(viewX / PIXELS_PER_HOUR) - 2);
            const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / PIXELS_PER_HOUR) + 2);

            for (let i = startIdx; i < endIdx; i++) {
                const d = state.hourlyData[i];
                const x = i * PIXELS_PER_HOUR;
                const code = d.weatherCode;

                // Ondas de choque (rachas > 35)
                if (d.gusts > 35) {
                    ctx.save();
                    
                    let color = 'rgba(100, 116, 139, 1)'; // Gris pizarra (100% opacidad)
                    if (d.gusts > 70) {
                        color = 'rgba(220, 38, 38, 1)'; // Rojo para rachas extremas
                    } else if (d.gusts > 50) {
                        color = 'rgba(234, 88, 12, 1)'; // Naranja para rachas muy fuertes
                    }
                    
                    // Halo blanco para visibilidad
                    ctx.shadowBlur = 4;
                    ctx.shadowColor = 'white';
                    
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 1.5;
                    const centerX = x; 
                    const centerY = h - 35; // Altura aproximada de las aspas
                    
                    // Semejante al strokeText, dibujamos una base negra/oscura para contraste extra
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 3.5;
                    
                    const drawGustIcon = () => {
                        // Semicírculo (onda frontal base)
                        ctx.beginPath();
                        ctx.arc(centerX + 2, centerY, 6, -Math.PI/2, Math.PI/2, false);
                        ctx.stroke();

                        // Líneas detrás base
                        ctx.beginPath();
                        ctx.moveTo(centerX - 3, centerY - 4);
                        ctx.lineTo(centerX - 3, centerY + 4);
                        ctx.moveTo(centerX - 7, centerY - 2);
                        ctx.lineTo(centerX - 7, centerY + 2);
                        ctx.stroke();

                        // Detalles adicionales según intensidad
                        if (d.gusts > 50) {
                            // Segunda onda frontal
                            ctx.beginPath();
                            ctx.arc(centerX + 6, centerY, 10, -Math.PI/2.5, Math.PI/2.5, false);
                            ctx.stroke();
                            // Línea extra detrás
                            ctx.beginPath();
                            ctx.moveTo(centerX - 11, centerY - 1);
                            ctx.lineTo(centerX - 11, centerY + 1);
                            ctx.stroke();
                        }
                        if (d.gusts > 70) {
                            // Tercera onda frontal
                            ctx.beginPath();
                            ctx.arc(centerX + 10, centerY, 14, -Math.PI/3, Math.PI/3, false);
                            ctx.stroke();
                        }
                    };

                    drawGustIcon(); // Stroke blanco
                    
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 1.5;
                    ctx.shadowBlur = 0; // Quitar sombra para el color real
                    drawGustIcon(); // Color real
                    
                    ctx.restore();
                }
            }
        }

        function drawStarrySky(ctx, viewX, viewW, h) {
            ctx.save();
            ctx.fillStyle = 'white';
            const startIdx = Math.max(0, Math.floor(viewX / PIXELS_PER_HOUR) - 5);
            const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / PIXELS_PER_HOUR) + 5);

            // Seeded random function based on position
            const rand = (seed) => {
                let x = Math.sin(seed * 9.9898) * 43758.5453;
                return x - Math.floor(x);
            };

            for (let i = startIdx; i < endIdx; i++) {
                const d = state.hourlyData[i];
                if (d.isNight) {
                    const xOffset = i * PIXELS_PER_HOUR;
                    // Generate deterministic stars per hour chunk
                    for (let s = 0; s < 12; s++) { // 12 stars per hour width
                        const seed = i * 100 + s;
                        const sx = xOffset + rand(seed) * PIXELS_PER_HOUR;
                        const sy = rand(seed + 1) * h; // En todo el cielo
                        const size = 0.5 + rand(seed + 2) * 1.5;
                        const opacity = 0.3 + rand(seed + 3) * 0.7;
                        
                        ctx.globalAlpha = opacity;
                        ctx.beginPath();
                        ctx.arc(sx, sy, size, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
            ctx.restore();
        }

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

            drawSunnyBackground(ctx, xOffset, w, h, styles, true);
            drawNightOverlay(ctx, xOffset, w, h);
            drawNightShadow(ctx, xOffset, w, h);
            drawStarrySky(ctx, xOffset, w, h);
            drawGrid(ctx, xOffset, w, h, styles);
            drawDayNames(ctx, xOffset, w, h, styles);
            drawClouds(ctx, xOffset, w, h, styles);
            drawUVSegments(ctx, xOffset, w, h); // Add UV segments
            drawPrecipitation(ctx, xOffset, w, h, styles);
            drawPrecipitationProbability(ctx, xOffset, w, h, styles);

            // Weather Phenomena
            drawWeatherPhenomena(ctx, xOffset, w, h);
            drawWind(ctx, xOffset, w, h, styles);

            drawTemperature(ctx, xOffset, w, h, styles);
            drawSunMarkersOnCanvas(ctx, xOffset, w, h);
            drawAxes(ctx, xOffset, w, h, styles);

            ctx.restore();
            tile.drawn = true;
        }

        function drawSunMarkersOnCanvas(ctx, viewX, viewW, h) {
            if (!state.hourlyData.length) return;
            const startTime = state.hourlyData[0].time;
            const markerColor = '#666666'; // Siempre gris oscuro como los ejes

            ctx.save();
            ctx.font = `bold 10px ${getThemeFont()}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.lineWidth = 1.5;

            Object.keys(state.sunData).forEach(dateStr => {
                const sun = state.sunData[dateStr];
                const sunriseX = ((sun.sunrise - startTime) / 3600000) * PIXELS_PER_HOUR;
                const sunsetX = ((sun.sunset - startTime) / 3600000) * PIXELS_PER_HOUR;

                const sunriseTime = new Date(sun.sunrise).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: state.timezone });
                const sunsetTime = new Date(sun.sunset).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: state.timezone });

                const drawMarker = (x, time, type) => {
                    if (x < viewX - 50 || x > viewX + viewW + 50) return;

                    ctx.save();
                    ctx.translate(x, 0); // Posicionado en el borde superior
                    ctx.strokeStyle = markerColor;
                    ctx.fillStyle = markerColor;
                    ctx.lineWidth = 2; // Igual que los ejes

                    // Sombra blanca para legibilidad, igual que los ejes
                    ctx.shadowColor = 'white';
                    ctx.shadowBlur = 3;

                    // Icon (Line design) - Upside down
                    ctx.beginPath();
                    // Ground line
                    ctx.moveTo(-12, 0); ctx.lineTo(12, 0);
                    
                    // Sun semi-circle (pointing down)
                    ctx.moveTo(6, 0);
                    ctx.arc(0, 0, 6, 0, Math.PI, false);
                    
                    // Rays
                    const rayLen = 4;
                    for (let j = 0; j < 5; j++) {
                        const a = (j * Math.PI) / 4;
                        ctx.moveTo(Math.cos(a) * 8, Math.sin(a) * 8);
                        ctx.lineTo(Math.cos(a) * (8 + rayLen), Math.sin(a) * (8 + rayLen));
                    }
                    
                    if (type === 'sunrise') {
                        // Arrow pointing down (into the sun) - Swapped
                        ctx.moveTo(-3, 15); ctx.lineTo(0, 18); ctx.lineTo(3, 15);
                        ctx.moveTo(0, 18); ctx.lineTo(0, 11);
                    } else {
                        // Arrow pointing up (from the sun) - Swapped
                        ctx.moveTo(-3, 14); ctx.lineTo(0, 11); ctx.lineTo(3, 14);
                        ctx.moveTo(0, 11); ctx.lineTo(0, 18);
                    }
                    
                    // Draw white outline for glow
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 4;
                    ctx.stroke();

                    // Draw actual icon
                    ctx.strokeStyle = markerColor;
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    // Time text
                    ctx.font = 'bold 10px Inter';
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = 'white';
                    ctx.strokeText(time, 0, 20); // Add stroke for shadow effect
                    ctx.fillStyle = markerColor;
                    ctx.fillText(time, 0, 20); // Texto debajo del icono
                    ctx.restore();
                };

                drawMarker(sunriseX, sunriseTime, 'sunrise');
                drawMarker(sunsetX, sunsetTime, 'sunset');
            });
            ctx.restore();
        }

        function drawUVSegments(ctx, viewX, viewW, h) {
            const startIdx = Math.max(0, Math.floor(viewX / PIXELS_PER_HOUR) - 2);
            const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / PIXELS_PER_HOUR) + 2);

            for (let i = startIdx; i < endIdx; i++) {
                const d = state.hourlyData[i];
                if (d.uv >= 1) {
                    const x = i * PIXELS_PER_HOUR;
                    let color = '#4caf50'; // Low (1-2)
                    if (d.uv >= 3 && d.uv < 6) color = '#fbc02d'; // Moderate (3-5)
                    else if (d.uv >= 6 && d.uv < 8) color = '#f57c00'; // High (6-7)
                    else if (d.uv >= 8 && d.uv < 11) color = '#d32f2f'; // Very High (8-10)
                    else if (d.uv >= 11) color = '#7b1fa2'; // Extreme (11+)

                    ctx.fillStyle = color;
                    ctx.fillRect(x, 0, PIXELS_PER_HOUR + 0.5, 2);
                }
            }
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

        function getWeatherIconSVG(code) {
            let iconName = getThemeIcon('dailyCards.clear', 'clear_day');
            
            if (code >= 1 && code <= 3) {
                iconName = getThemeIcon('dailyCards.cloudy', 'cloud');
            } else if (code === 45 || code === 48) {
                iconName = getThemeIcon('dailyCards.fog', 'foggy');
            } else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
                iconName = getThemeIcon('dailyCards.rain', 'rainy');
            } else if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
                iconName = getThemeIcon('dailyCards.snow', 'ac_unit');
            } else if (code >= 95) {
                iconName = getThemeIcon('dailyCards.thunderstorm', 'thunderstorm');
            }
            return `<span class="material-symbols-outlined" style="font-size:24px;">${iconName}</span>`;
        }

        function generateDailyCards() {
            const container = document.getElementById('daily-cards-container');
            if (!container) return;
            container.innerHTML = '';

            if (!state.dailyData || !state.dailyData.length) return;

            const now = new Date();
            const nowStr = now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', timeZone: state.timezone });

            state.dailyData.forEach((day, index) => {
                const card = document.createElement('div');
                card.className = 'daily-card';
                card.dataset.index = index;
                
                const date = new Date(day.time);
                const dayName = date.toLocaleDateString('es-ES', { weekday: 'short', timeZone: state.timezone }).toUpperCase();
                const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', timeZone: state.timezone });
                
                const isToday = (dateStr === nowStr);
                
                const iconSVG = getWeatherIconSVG(day.weatherCode);

                card.innerHTML = `
                    <div class="day-header">
                        <span class="day-name">${dayName} ${isToday ? '<span class="today-marker"></span>' : ''}</span>
                        <span class="day-date">${dateStr}</span>
                    </div>
                    <div class="day-body">
                        <div class="day-icon">${iconSVG}</div>
                        <div class="day-temp-group">
                            <span class="day-temp">${Math.round(day.tempMax)}°</span>
                            <span class="day-temp-min">${Math.round(day.tempMin)}°</span>
                        </div>
                    </div>
                `;

                card.addEventListener('click', () => {
                    if (isToday) {
                        centerOnCurrentTime('smooth');
                        return;
                    }

                    const noonIndex = state.hourlyData.findIndex(h => {
                        const hDate = new Date(h.time);
                        const hStr = hDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', timeZone: state.timezone });
                        return hStr === dateStr && h.localHour === 12;
                    });

                    // Si no encuentra la hora 12 exacta de ese día, busca la primera y suma 12
                    let targetIndex = noonIndex;
                    if (targetIndex === -1) {
                         const firstIndex = state.hourlyData.findIndex(h => {
                            const hDate = new Date(h.time);
                            return hDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', timeZone: state.timezone }) === dateStr;
                         });
                         if (firstIndex !== -1) targetIndex = Math.min(state.hourlyData.length - 1, firstIndex + 12);
                    }

                    if (targetIndex !== -1) {
                        const scrollContainer = document.getElementById('scroll-container');
                        const targetScroll = (targetIndex * PIXELS_PER_HOUR) - 60; // Alineado a la línea de referencia (60px)
                        scrollContainer.scrollTo({ left: targetScroll, behavior: 'smooth' });
                    }
                });

                container.appendChild(card);
            });
            updateActiveDailyCard();
        }

        function updateActiveDailyCard() {
            const container = document.getElementById('daily-cards-container');
            if (!container || container.style.display === 'none') return;
            
            const scrollContainer = document.getElementById('scroll-container');
            const activeX = scrollContainer.scrollLeft + 60;
            
            const floatIndex = activeX / PIXELS_PER_HOUR;
            const hourIndex = Math.max(0, Math.min(state.hourlyData.length - 1, Math.floor(floatIndex)));
            const currentData = state.hourlyData[hourIndex];
            if (!currentData) return;
            
            const currentDate = new Date(currentData.time);
            const currentDateStr = currentDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', timeZone: state.timezone });
            
            // Usar índice flotante para progreso exacto (incluso entre horas)
            const fraction = floatIndex - Math.floor(floatIndex);
            const dayProgress = (currentData.localHour + fraction) / 24;
            
            const cards = container.querySelectorAll('.daily-card');
            cards.forEach((card, index) => {
                const dayData = state.dailyData[index];
                if (!dayData) return;
                const dDate = new Date(dayData.time);
                const dDateStr = dDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', timeZone: state.timezone });
                
                const isActive = currentDateStr === dDateStr;
                card.classList.toggle('active', isActive);
                
                if (isActive) {
                    card.style.setProperty('--arrow-pos', `${Math.max(0, Math.min(1, dayProgress)) * 100}%`);

                    const cardRect = card.getBoundingClientRect();
                    const containerRect = container.getBoundingClientRect();
                    
                    if (cardRect.left < containerRect.left || cardRect.right > containerRect.right) {
                        const scrollLeft = card.offsetLeft - (container.clientWidth / 2) + (card.clientWidth / 2);
                        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
                    }
                }
            });
        }

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

        function drawSunnyBackground(ctx, viewX, viewW, h, styles, drawSunIcon) {
            const skyColor = '#fffde7'; // Siempre modo claro
            const sunColor = '#fdd835';
            const rayColor = '#fff59d';

            ctx.save();
            ctx.fillStyle = skyColor;
            ctx.fillRect(viewX, 0, viewW, h);

            if (drawSunIcon && state.hourlyData.length > 0) {
                const startTime = state.hourlyData[0].time;
                Object.keys(state.sunData).forEach(dateStr => {
                    const sun = state.sunData[dateStr];
                    // Sun midpoint (noon-ish)
                    const midpoint = (sun.sunrise + sun.sunset) / 2;
                    const x = ((midpoint - startTime) / 3600000) * PIXELS_PER_HOUR;

                    if (x >= viewX - 100 && x <= viewX + viewW + 100) {
                        drawSun(ctx, x, h * 0.25, sunColor, rayColor);
                    }
                });
            }
            ctx.restore();
        }

        function drawSun(ctx, x, y, sunColor, rayColor) {
            const radius = 25;
            const rayCount = 12;
            const rayLength = 20;

            ctx.save();
            // Resplandor
            const grad = ctx.createRadialGradient(x, y, radius, x, y, radius + 50);
            grad.addColorStop(0, 'rgba(253, 216, 53, 0.3)');
            grad.addColorStop(1, 'rgba(253, 216, 53, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, radius + 50, 0, Math.PI * 2);
            ctx.fill();

            // Rayos
            ctx.strokeStyle = rayColor;
            ctx.lineWidth = 2;
            for (let i = 0; i < rayCount; i++) {
                const angle = (i / rayCount) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(x + Math.cos(angle) * (radius + 8), y + Math.sin(angle) * (radius + 8));
                ctx.lineTo(x + Math.cos(angle) * (radius + 8 + rayLength), y + Math.sin(angle) * (radius + 8 + rayLength));
                ctx.stroke();
            }

            // Sol
            ctx.fillStyle = sunColor;
            ctx.shadowBlur = 15;
            ctx.shadowColor = sunColor;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        function drawMoon(ctx, x, y, moonColor, glowColor) {
            const radius = 20;
            ctx.save();
            // Resplandor
            const grad = ctx.createRadialGradient(x, y, radius, x, y, radius + 40);
            grad.addColorStop(0, 'rgba(144, 202, 249, 0.2)');
            grad.addColorStop(1, 'rgba(144, 202, 249, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, radius + 40, 0, Math.PI * 2);
            ctx.fill();

            // Luna (Creciente) dibujada con path para evitar destination-out
            ctx.fillStyle = moonColor;
            ctx.shadowBlur = 10;
            ctx.shadowColor = glowColor;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0.2 * Math.PI, 1.8 * Math.PI);
            ctx.quadraticCurveTo(x + radius * 0.5, y, x + radius * Math.cos(0.2 * Math.PI), y + radius * Math.sin(0.2 * Math.PI));
            ctx.fill();

            ctx.restore();
        }

        function drawNightOverlay(ctx, viewX, viewW, h) {
            const startIdx = Math.max(0, Math.floor(viewX / PIXELS_PER_HOUR) - 5);
            const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / PIXELS_PER_HOUR) + 5);

            let solidNightStart = -1;

            for (let i = startIdx; i < endIdx; i++) {
                const d = state.hourlyData[i];
                if (d.isNight) {
                    const prevIsDay = i > 0 && !state.hourlyData[i - 1].isNight;
                    const nextIsDay = i < state.hourlyData.length - 1 && !state.hourlyData[i + 1].isNight;
                    const x = i * PIXELS_PER_HOUR;
                    const w = PIXELS_PER_HOUR;

                    if (prevIsDay) {
                        if (solidNightStart !== -1) {
                            ctx.fillStyle = '#e9d5ff';
                            ctx.fillRect(solidNightStart * PIXELS_PER_HOUR, 0, (i - solidNightStart) * PIXELS_PER_HOUR, h);
                            solidNightStart = -1;
                        }
                        const grad = ctx.createLinearGradient(x, 0, x + w + 0.5, 0);
                        grad.addColorStop(0, '#fffde7');
                        grad.addColorStop(0.5, '#ffedd5');
                        grad.addColorStop(1, '#e9d5ff');
                        ctx.fillStyle = grad;
                        ctx.fillRect(x, 0, w + 0.5, h);
                    } else if (nextIsDay) {
                        if (solidNightStart !== -1) {
                            ctx.fillStyle = '#e9d5ff';
                            ctx.fillRect(solidNightStart * PIXELS_PER_HOUR, 0, (i - solidNightStart) * PIXELS_PER_HOUR, h);
                            solidNightStart = -1;
                        }
                        const grad = ctx.createLinearGradient(x, 0, x + w + 0.5, 0);
                        grad.addColorStop(0, '#e9d5ff');
                        grad.addColorStop(0.5, '#ffedd5');
                        grad.addColorStop(1, '#fffde7');
                        ctx.fillStyle = grad;
                        ctx.fillRect(x, 0, w + 0.5, h);
                    } else {
                        if (solidNightStart === -1) {
                            solidNightStart = i;
                        }
                    }
                } else {
                    if (solidNightStart !== -1) {
                        ctx.fillStyle = '#e9d5ff'; // Darker violet
                        ctx.fillRect(solidNightStart * PIXELS_PER_HOUR, 0, (i - solidNightStart) * PIXELS_PER_HOUR + 0.5, h);
                        solidNightStart = -1;
                    }
                }
            }

            if (solidNightStart !== -1) {
                ctx.fillStyle = '#e9d5ff';
                ctx.fillRect(solidNightStart * PIXELS_PER_HOUR, 0, (endIdx - solidNightStart) * PIXELS_PER_HOUR + 0.5, h);
            }

            // Draw Moon at midpoints
            if (state.hourlyData.length > 0) {
                const startTime = state.hourlyData[0].time;
                const sortedDates = Object.keys(state.sunData).sort();
                for (let i = 0; i < sortedDates.length; i++) {
                    const currentSun = state.sunData[sortedDates[i]];
                    const nextSun = state.sunData[sortedDates[i+1]];

                    if (nextSun) {
                        // Moon midpoint is between sunset today and sunrise tomorrow
                        const midpoint = (currentSun.sunset + nextSun.sunrise) / 2;
                        const x = ((midpoint - startTime) / 3600000) * PIXELS_PER_HOUR;
                        if (x >= viewX - 50 && x <= viewX + viewW + 50) {
                            drawMoon(ctx, x, h * 0.25, '#f5f5f5', '#90caf9');
                        }
                    }
                }
            }
        }

        function drawGrid(ctx, viewX, viewW, h, styles) {
            ctx.strokeStyle = '#e0e0e0'; // Siempre modo claro
            ctx.lineWidth = 1;
            ctx.beginPath();
            const xStart = viewX;
            const xEnd = viewX + viewW;
            for (let temp = -20; temp <= 40; temp += 10) {
                const y = normalizeY(temp, -20, 40, h);
                ctx.moveTo(xStart, y);
                ctx.lineTo(xEnd, y);
            }
            ctx.stroke();

            // Línea de congelación (0°C)
            const frozenY = normalizeY(0, -20, 40, h);
            ctx.save();
            ctx.strokeStyle = getThemeColor('zeroLine', 'rgba(14, 165, 233, 0.4)');
            ctx.setLineDash([4, 4]); // Dashed line
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(xStart, frozenY);
            ctx.lineTo(xEnd, frozenY);
            ctx.stroke();
            ctx.restore();

            // Divisiones de día
            ctx.strokeStyle = 'rgba(0,0,0,0.08)'; // Siempre modo claro
            const startIdx = Math.max(0, Math.floor(viewX / PIXELS_PER_HOUR) - 5);
            const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / PIXELS_PER_HOUR) + 5);

            for (let i = startIdx; i < endIdx; i++) {
                const d = state.hourlyData[i];
                if (d.localHour === 0) {
                    ctx.beginPath();
                    ctx.moveTo(i * PIXELS_PER_HOUR, 0);
                    ctx.lineTo(i * PIXELS_PER_HOUR, h);
                    ctx.stroke();
                }
            }
        }

        function drawDayNames(ctx, viewX, viewW, h, styles) {
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.15)'; // Increased opacity for better visibility
            ctx.font = `900 80px ${getThemeFont()}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const startIdx = Math.max(0, Math.floor(viewX / PIXELS_PER_HOUR) - 24);
            const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / PIXELS_PER_HOUR) + 24);

            // Find the actual start of the day for the current visible range
            let dayStart = 0;
            for (let i = Math.max(0, startIdx); i >= 0; i--) {
                if (state.hourlyData[i].localHour === 0) {
                    dayStart = i;
                    break;
                }
            }

            let currentDayStart = dayStart;
            for (let i = dayStart + 1; i < endIdx + 24 && i < state.hourlyData.length; i++) {
                const d = state.hourlyData[i];
                if (d.localHour === 0) {
                    const midX = (currentDayStart + (i - 1 - currentDayStart) / 2) * PIXELS_PER_HOUR;
                    const dayName = state.hourlyData[currentDayStart].localDayName;
                    ctx.fillText(dayName, midX, h / 2);
                    currentDayStart = i;
                }
            }
            // Último día visible
            if (currentDayStart !== -1 && currentDayStart < endIdx + 24) {
                let nextDayStart = state.hourlyData.length;
                for (let i = currentDayStart + 1; i < state.hourlyData.length; i++) {
                    if (state.hourlyData[i].localHour === 0) {
                        nextDayStart = i;
                        break;
                    }
                }
                const midX = (currentDayStart + (nextDayStart - 1 - currentDayStart) / 2) * PIXELS_PER_HOUR;
                const dayName = state.hourlyData[currentDayStart].localDayName;
                ctx.fillText(dayName, midX, h / 2);
            }
            ctx.restore();
        }

        function drawClouds(ctx, viewX, viewW, h, styles) {
            const startIdx = Math.max(0, Math.floor(viewX / PIXELS_PER_HOUR) - 5);
            const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / PIXELS_PER_HOUR) + 5);

            const points = [];
            for (let i = startIdx; i < endIdx; i++) {
                const d = state.hourlyData[i];
                if (!d) continue;
                points.push({
                    x: i * PIXELS_PER_HOUR,
                    y: h - (h * (d.clouds / 100)),
                    val: d.clouds
                });
            }

            if (points.length < 2) return;

            const addSmoothPathTo = (pathCtx, offset = 0, firstMove = true) => {
                if (firstMove) pathCtx.moveTo(points[0].x, points[0].y + offset);

                for (let i = 0; i < points.length - 1; i++) {
                    const p1 = points[i];
                    const p2 = points[i + 1];
                    const cx = (p1.x + p2.x) / 2;
                    pathCtx.bezierCurveTo(cx, p1.y + offset, cx, p2.y + offset, p2.x, p2.y + offset);
                }
            };

            const cloudPath = new Path2D();
            cloudPath.moveTo(points[0].x, h);
            cloudPath.lineTo(points[0].x, points[0].y);
            addSmoothPathTo(cloudPath, 0, false);
            cloudPath.lineTo(points[points.length-1].x, h);
            cloudPath.closePath();

            // Relleno suave con un único gradiente global para evitar líneas verticales
            ctx.save();
            ctx.clip(cloudPath);
            
            const minX = points[0].x;
            const maxX = points[points.length - 1].x;
            const globalGrad = ctx.createLinearGradient(minX, 0, maxX, 0);
            
            points.forEach(p => {
                const stop = (p.x - minX) / (maxX - minX || 1);
                const safeStop = Math.max(0, Math.min(1, stop));
                const luma = Math.round(255 - (p.val / 100) * 155);
                globalGrad.addColorStop(safeStop, `rgba(${luma}, ${luma}, ${luma + 10}, 0.7)`);
            });

            ctx.fillStyle = globalGrad;
            ctx.fillRect(minX, 0, maxX - minX, h);
            
            // Efecto Volumen (Isóbaras más sutiles pero más capas)
            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalAlpha = 0.45;

            const layers = [
                { offset: 5, width: 4, color: 'rgba(255, 255, 255, 0.3)' },
                { offset: 12, width: 8, color: 'rgba(255, 255, 255, 0.2)' },
                { offset: 25, width: 15, color: 'rgba(255, 255, 255, 0.1)' },
                { offset: 45, width: 22, color: 'rgba(0, 0, 0, 0.05)' },
                { offset: 65, width: 30, color: 'rgba(0, 0, 0, 0.03)' }
            ];

            layers.forEach(layer => {
                ctx.lineWidth = layer.width;
                ctx.strokeStyle = layer.color;
                ctx.beginPath();
                addSmoothPathTo(ctx, layer.offset);
                ctx.stroke();
            });

            ctx.restore();
            ctx.restore();

            // Línea de contorno principal con color dinámico (gris claro/oscuro según nubosidad)
            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.shadowBlur = 8;
            ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
            
            const strokeGrad = ctx.createLinearGradient(minX, 0, maxX, 0);
            points.forEach(p => {
                const stop = (p.x - minX) / (maxX - minX || 1);
                const safeStop = Math.max(0, Math.min(1, stop));
                // Luma para la línea: un poco más oscura que el relleno para que resalte
                const luma = Math.round(230 - (p.val / 100) * 150);
                strokeGrad.addColorStop(safeStop, `rgba(${luma}, ${luma}, ${luma + 5}, 1)`);
            });

            ctx.strokeStyle = strokeGrad;
            ctx.shadowOffsetY = 1;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            addSmoothPathTo(ctx);
            ctx.stroke();
            ctx.restore();
        }

        function drawPrecipitation(ctx, viewX, viewW, h, styles) {
            const startIdx = Math.max(0, Math.floor(viewX / PIXELS_PER_HOUR) - 5);
            const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / PIXELS_PER_HOUR) + 5);

            const maxH = h * 0.9;
            for (let i = startIdx; i < endIdx; i++) {
                const d = state.hourlyData[i];
                if (d.precip > 0) {
                    let barH = d.precip * PIXELS_PER_MM;
                    const x = i * PIXELS_PER_HOUR + 5;
                    const bw = PIXELS_PER_HOUR - 10;

                    const isSnow = [71, 73, 75, 77, 85, 86].includes(d.weatherCode);
                    const isThunder = [95, 96, 99].includes(d.weatherCode);
                    
                    let baseColor = isSnow ? (state.theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(148, 163, 184, 0.4)') : 
                                    isThunder ? 'rgba(57, 73, 171, 0.4)' : 
                                    getThemeColor('precipBar', 'rgba(13, 71, 161, 0.4)');
                    
                    let strokeColor = isSnow ? (state.theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(100, 116, 139, 0.8)') : 
                                      isThunder ? 'rgba(57, 73, 171, 0.8)' : 
                                      'rgba(13, 71, 161, 0.8)';

                    ctx.fillStyle = baseColor;
                    ctx.strokeStyle = strokeColor;
                    ctx.lineWidth = 1;

                    let drawH = Math.min(maxH, barH);
                    let barY = h - drawH;
                    
                    // Customize the fade out so the top is still visible (not fully transparent)
                    const grad = ctx.createLinearGradient(0, barY, 0, Math.min(h, barY + 30));
                    
                    // Extract rgba components to adjust opacity
                    const colorParts = baseColor.match(/[\d.]+/g);
                    const R = colorParts[0], G = colorParts[1], B = colorParts[2], A = colorParts[3];
                    const semiTransparentBase = `rgba(${R}, ${G}, ${B}, ${Math.max(0.1, A * 0.4)})`;

                    grad.addColorStop(0, semiTransparentBase);
                    grad.addColorStop(1, baseColor);
                    
                    ctx.fillStyle = grad;
                    
                    // Draw base rect
                    ctx.beginPath();
                    ctx.moveTo(x, h);
                    ctx.lineTo(x, barY);
                    ctx.lineTo(x + bw, barY);
                    ctx.lineTo(x + bw, h);
                    ctx.fill();
                    
                    // Let the stroke also fade, but be clearly visible at the top
                    const strokeColorParts = strokeColor.match(/[\d.]+/g);
                    const sR = strokeColorParts[0], sG = strokeColorParts[1], sB = strokeColorParts[2], sA = strokeColorParts[3];
                    const semiTransparentStroke = `rgba(${sR}, ${sG}, ${sB}, ${Math.max(0.3, sA * 0.5)})`;

                    const strokeGrad = ctx.createLinearGradient(0, barY, 0, Math.min(h, barY + 30));
                    strokeGrad.addColorStop(0, semiTransparentStroke);
                    strokeGrad.addColorStop(1, strokeColor);
                    
                    ctx.strokeStyle = strokeGrad;
                    
                    // Draw sides
                    ctx.beginPath();
                    ctx.moveTo(x, h);
                    ctx.lineTo(x, barY);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(x + bw, h);
                    ctx.lineTo(x + bw, barY);
                    ctx.stroke();

                    // Draw custom scattered top effects
                    ctx.save();
                    ctx.lineWidth = 1.5;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    
                    if (isSnow) {
                        // High contrast outline
                        ctx.strokeStyle = '#000000';
                        ctx.lineWidth = 4;
                        ctx.lineJoin = 'round';
                        ctx.lineCap = 'round';
                        for(let k = 0; k < 4; k++) {
                            const sx = x + bw * 0.15 + k * (bw * 0.25);
                            const sy = barY + ((k * 17) % 15) - 5;
                            const flakeSize = 2.5 + ((k * 11) % 2);
                            ctx.beginPath();
                            ctx.moveTo(sx - flakeSize, sy); ctx.lineTo(sx + flakeSize, sy);
                            ctx.moveTo(sx, sy - flakeSize); ctx.lineTo(sx, sy + flakeSize);
                            ctx.moveTo(sx - flakeSize*0.7, sy - flakeSize*0.7); ctx.lineTo(sx + flakeSize*0.7, sy + flakeSize*0.7);
                            ctx.moveTo(sx - flakeSize*0.7, sy + flakeSize*0.7); ctx.lineTo(sx + flakeSize*0.7, sy - flakeSize*0.7);
                            ctx.stroke();
                        }

                        ctx.strokeStyle = 'white'; 
                        ctx.lineWidth = 1.5;
                        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
                        ctx.shadowBlur = 2;
                        for(let k = 0; k < 4; k++) {
                            const sx = x + bw * 0.15 + k * (bw * 0.25);
                            const sy = barY + ((k * 17) % 15) - 5;
                            const flakeSize = 2.5 + ((k * 11) % 2);
                            ctx.beginPath();
                            ctx.moveTo(sx - flakeSize, sy); ctx.lineTo(sx + flakeSize, sy);
                            ctx.moveTo(sx, sy - flakeSize); ctx.lineTo(sx, sy + flakeSize);
                            ctx.moveTo(sx - flakeSize*0.7, sy - flakeSize*0.7); ctx.lineTo(sx + flakeSize*0.7, sy + flakeSize*0.7);
                            ctx.moveTo(sx - flakeSize*0.7, sy + flakeSize*0.7); ctx.lineTo(sx + flakeSize*0.7, sy - flakeSize*0.7);
                            ctx.stroke();
                        }
                    } else if (isThunder) {
                        // High contrast Outline
                        ctx.strokeStyle = '#000000';
                        ctx.lineWidth = 5;
                        ctx.lineJoin = 'round';
                        for(let k = 0; k < 2; k++) {
                            const lx = x + bw * 0.3 + k * (bw * 0.4);
                            const ly = barY + ((k * 13) % 10) - 5;
                            ctx.beginPath();
                            ctx.moveTo(lx, ly); ctx.lineTo(lx - 3, ly + 6);
                            ctx.lineTo(lx + 2, ly + 5); ctx.lineTo(lx - 2, ly + 12);
                            ctx.stroke();
                        }

                        ctx.strokeStyle = '#fde047'; // yellow
                        ctx.shadowColor = 'rgba(253, 224, 71, 0.8)';
                        ctx.shadowBlur = 6;
                        ctx.lineWidth = 2.0;
                        for(let k = 0; k < 2; k++) {
                            const lx = x + bw * 0.3 + k * (bw * 0.4);
                            const ly = barY + ((k * 13) % 10) - 5;
                            ctx.beginPath();
                            ctx.moveTo(lx, ly); ctx.lineTo(lx - 3, ly + 6);
                            ctx.lineTo(lx + 2, ly + 5); ctx.lineTo(lx - 2, ly + 12);
                            ctx.stroke();
                        }
                    } else {
                        // Regular rain (water drop stickers)
                        const dropIcon = 'water_drop';
                        ctx.font = '10px "Material Symbols Outlined"'; // Más pequeños
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'bottom';
                        
                        // Several icons
                        const dropCount = 3;
                        for (let k = 0; k < dropCount; k++) {
                            const dropX = x + (bw / (dropCount + 1)) * (k + 1);
                            // Altura aleatoria basada en el índice para que no estén alineados
                            const yJitter = ((i * 7 + k * 13) % 10) - 5;
                            const dropY = barY + 4 + yJitter;
                            
                            // Sticker outline (glow effect)
                            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'; // Borde mucho menos agresivo, blanquecino
                            ctx.lineWidth = 2; // Más fino
                            ctx.strokeText(dropIcon, dropX, dropY);
                            
                            // Main icon
                            ctx.fillStyle = strokeColor;
                            ctx.shadowColor = 'rgba(13, 71, 161, 0.4)';
                            ctx.shadowBlur = 1;
                            ctx.fillText(dropIcon, dropX, dropY);
                        }
                    }
                    ctx.restore();

                    if (barH > maxH) {
                        // Draw zigzag
                        ctx.save();
                        ctx.strokeStyle = 'white';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        const zy = h - maxH + 15;
                        ctx.moveTo(x, zy);
                        ctx.lineTo(x + bw/4, zy - 5);
                        ctx.lineTo(x + bw*3/4, zy + 5);
                        ctx.lineTo(x + bw, zy);
                        ctx.stroke();
                        ctx.restore();
                    }
                }
            }
        }

        function drawPrecipitationProbability(ctx, viewX, viewW, h, styles) {
            const startIdx = Math.max(0, Math.floor(viewX / PIXELS_PER_HOUR) - 5);
            const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / PIXELS_PER_HOUR) + 5);

            if (state.hourlyData.length < 2) return;

            // Helper to get color based on weather code
            const getPrecipTypeColor = (code) => {
                // Snow: 71, 73, 75, 77, 85, 86
                if ([71, 73, 75, 77, 85, 86].includes(code)) return '#e0f7fa'; // Cyan muy claro para nieve
                // Thunderstorm: 95, 96, 99
                if ([95, 96, 99].includes(code)) return '#3949ab'; // Indigo para tormentas
                // Default Rain
                return '#039be5'; // Azul lluvia
            };

            const outlinePath = new Path2D();
            let first = true;
            for (let i = startIdx; i < endIdx; i++) {
                const d = state.hourlyData[i];
                const x = i * PIXELS_PER_HOUR;
                const prob = d.precipProb || 0;
                const y = h - (h * (prob / 100));

                if (first) {
                    outlinePath.moveTo(x, y);
                    first = false;
                } else {
                    const prevD = state.hourlyData[i-1];
                    const prevX = (i-1) * PIXELS_PER_HOUR;
                    const prevProb = prevD.precipProb || 0;
                    const prevY = h - (h * (prevProb / 100));
                    const cpX1 = prevX + (x - prevX) / 3;
                    const cpX2 = prevX + 2 * (x - prevX) / 3;
                    outlinePath.bezierCurveTo(cpX1, prevY, cpX2, y, x, y);
                }
            }

            const fillPath = new Path2D(outlinePath);
            const lastX = (endIdx - 1) * PIXELS_PER_HOUR;
            const firstX = startIdx * PIXELS_PER_HOUR;
            fillPath.lineTo(lastX, h);
            fillPath.lineTo(firstX, h);
            fillPath.closePath();

            // Excluir las barras de precipitación usando sub-trazados para la regla evenodd
            // Agrandamos los rectángulos un poco para asegurar que no queden orillas de los patrones
            const maxH = h * 0.9;
            for (let i = startIdx; i < endIdx; i++) {
                const d = state.hourlyData[i];
                if (d && d.precip > 0.05) { // Solo si hay precipitación relevante
                    const barH = d.precip * PIXELS_PER_MM;
                    const visualH = Math.min(maxH, barH);
                    const barY = h - visualH;
                    const x = i * PIXELS_PER_HOUR + 5;
                    const bw = PIXELS_PER_HOUR - 10;
                    
                    // Si el barY está dentro del área de relleno, restamos el rectángulo
                    fillPath.rect(x - 1, barY, bw + 2, h - barY + 1);
                }
            }

            ctx.save();
            ctx.clip(fillPath, 'evenodd');

            // Añadir fondo azul suave casi transparente (resaltar relleno sobre fondo)
            ctx.fillStyle = 'rgba(3, 155, 229, 0.08)';
            ctx.fillRect((startIdx-1) * PIXELS_PER_HOUR, 0, (endIdx - startIdx + 2) * PIXELS_PER_HOUR, h);

            // Relleno con densidad de líneas según probabilidad (Agrupado en bloques contiguos)
            const blocks = [];
            let currentBlock = null;

            for (let i = startIdx; i < endIdx; i++) {
                const d = state.hourlyData[i];
                if (!d || !d.precipProb) {
                    if (currentBlock) { blocks.push(currentBlock); currentBlock = null; }
                    continue;
                }
                
                const isSnow = [71, 73, 75, 77, 85, 86].includes(d.weatherCode);
                const type = isSnow ? 'snow' : 'rain';
                const color = getPrecipTypeColor(d.weatherCode);
                const alpha = d.isNight ? 0.6 : 0.4;
                const shadowColor = d.isNight ? 'rgba(255, 255, 255, 0.5)' : 'transparent';

                if (!currentBlock || currentBlock.type !== type) {
                    if (currentBlock) blocks.push(currentBlock);
                    currentBlock = { type, start: i, end: i, colors: [color], alphas: [alpha], shadows: [shadowColor] };
                } else {
                    currentBlock.end = i;
                    currentBlock.colors.push(color);
                    currentBlock.alphas.push(alpha);
                    currentBlock.shadows.push(shadowColor);
                }
            }
            if (currentBlock) blocks.push(currentBlock);

            const spacing = 16; // Menos densidad (antes 12)
            
            blocks.forEach(block => {
                const xStart = block.start * PIXELS_PER_HOUR;
                const xEnd = (block.end + 1) * PIXELS_PER_HOUR;
                
                // Margen generoso para que se fundan los tramos colindantes sin corte
                const drawXStart = xStart - 30;
                const drawXEnd = xEnd + 30;

                ctx.save();
                ctx.beginPath();
                // Clip del bloque entero + los márgenes
                ctx.rect(drawXStart, 0, drawXEnd - drawXStart, h);
                ctx.clip();
                
                let strokeFillColor = block.colors[0];
                
                // Helper para transformar color Hex a Rgba con Alpha controlado
                const toRgba = (color, a) => {
                    const {r, g, b} = window.hexToRgb(color);
                    return `rgba(${r}, ${g}, ${b}, ${a})`;
                };
                
                const alphaSolid = block.alphas[0];
                const cFirst = block.colors[0];
                const cLast = block.colors[block.colors.length - 1];
                const totalW = drawXEnd - drawXStart;
                
                const g = ctx.createLinearGradient(drawXStart, 0, drawXEnd, 0);
                
                // Fundido transparente de entrada (overlap izquierdo ampliado a 60px para mayor suavidad)
                const fadeW = 60;
                g.addColorStop(0, toRgba(cFirst, 0));
                g.addColorStop(fadeW / totalW, toRgba(cFirst, alphaSolid));
                
                // Colores internos del bloque iterados proporcionalmente en su espacio central
                if (block.colors.length > 1) {
                    block.colors.forEach((c, idx) => {
                        const relativePos = idx / (block.colors.length - 1);
                        const stopPos = (fadeW + relativePos * (xEnd - xStart)) / totalW;
                        g.addColorStop(Math.min(1, Math.max(0, stopPos)), toRgba(c, alphaSolid));
                    });
                } else {
                    g.addColorStop((totalW - fadeW) / totalW, toRgba(cFirst, alphaSolid));
                }
                
                // Fundido transparente de salida (overlap derecho ampliado a 60px)
                g.addColorStop((totalW - fadeW) / totalW, toRgba(cLast, alphaSolid));
                g.addColorStop(1, toRgba(cLast, 0));
                
                strokeFillColor = g;
                
                ctx.strokeStyle = strokeFillColor;
                ctx.fillStyle = strokeFillColor;
                ctx.globalAlpha = 1; // Alpha controlado directamente en el gradiente
                
                if (block.shadows[0] !== 'transparent') {
                    ctx.shadowColor = block.shadows[0];
                    ctx.shadowBlur = 3;
                }

                ctx.lineWidth = 1;

                if (block.type === 'snow') {
                    ctx.font = '10px "Material Symbols Outlined"';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    const flakeSpacing = 40; // Menos densidad (antes 30)
                    const flakeOffset = Math.floor(drawXStart / flakeSpacing) * flakeSpacing;
                    
                    for (let lx = flakeOffset - h; lx < drawXEnd + h; lx += flakeSpacing) {
                        for (let ly = 10; ly < h; ly += flakeSpacing) {
                            const stagger = (Math.floor(ly / flakeSpacing) % 2) * (flakeSpacing * 0.5);
                            const randX = Math.sin(lx * 4.3 + ly * 2.1) * 12;
                            const randY = Math.cos(lx * 1.5 + ly * 3.7) * 12;
                            const sx = lx + stagger + randX;
                            const sy = ly + randY;
                            if (sx >= drawXStart && sx < drawXEnd) {
                                ctx.fillText('ac_unit', sx, sy);
                            }
                        }
                    }
                } else {
                    const strokeLen = 4;
                    const gapLen = 4;
                    const globalOffset = Math.floor(drawXStart / spacing) * spacing;
                    
                    ctx.beginPath();
                    for (let lx = globalOffset - h; lx < drawXEnd + h; lx += spacing) {
                        for (let ly = 0; ly < h; ly += (strokeLen + gapLen)) {
                            const sx = lx + ly;
                            const sy = ly;
                            if (sx >= drawXStart && sx < drawXEnd) {
                                ctx.moveTo(sx, sy);
                                ctx.lineTo(sx + strokeLen, sy + strokeLen);
                            }
                        }
                    }
                    ctx.stroke();
                }
                ctx.restore();
            });
            ctx.restore();

            // Línea de contorno fina
            ctx.strokeStyle = '#0288d1'; // Color sutil
            ctx.lineWidth = 1; // Línea más fina
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke(outlinePath);
        }

        function drawHumidity(ctx, viewX, viewW, h, styles) {
            const color = getThemeColor('humidityLine', 'rgba(0, 188, 212, 0.3)');
            const startIdx = Math.max(0, Math.floor(viewX / PIXELS_PER_HOUR) - 5);
            const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / PIXELS_PER_HOUR) + 5);

            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);

            for (let i = startIdx; i < endIdx; i++) {
                const d = state.hourlyData[i];
                const x = i * PIXELS_PER_HOUR;
                const y = h - (h * (d.humidity / 100));
                if (i === startIdx) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.setLineDash([]);
        }

        function drawWind(ctx, viewX, viewW, h, styles) {
            const startIdx = Math.max(0, Math.floor(viewX / PIXELS_PER_HOUR) - 5);
            const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / PIXELS_PER_HOUR) + 5);

            ctx.save();
            // Draw tiny wind arrows directly on the grid
            for (let i = startIdx; i < endIdx; i++) {
                const d = state.hourlyData[i];
                if (d.localHour % 3 === 0) { // Draw every 3 hours to avoid clutter
                    const x = i * PIXELS_PER_HOUR;
                    // Draw wind arrows at the top of the chart
                    const y = 35; // A bit below the top day labels
                    
                    ctx.save();
                    ctx.translate(x, y);
                    
                    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
                    ctx.shadowBlur = 4;
                    // Rotate based on wind direction (where it blows TO instead of FROM)
                    ctx.rotate((d.windDir + 180) * Math.PI / 180);

                    // Determine color based on temperature
                    let windColor = state.theme === 'dark' ? getThemeColor('wind.normalDark', '#cbd5e1') : getThemeColor('wind.normalLight', '#64748b'); // normal base
                    if (d.temp < 10) {
                        windColor = getThemeColor('wind.cold', '#3b82f6'); // Frío (Azul)
                    } else if (d.temp > 28) {
                        windColor = getThemeColor('wind.hot', '#ef4444'); // Caliente (Rojo)
                    }

                    if (d.wind > 40 && d.temp <= 28 && d.temp >= 10) {
                        windColor = state.theme === 'dark' ? getThemeColor('wind.strongDefaultDark', '#f87171') : getThemeColor('wind.strongDefaultLight', '#dc2626'); // strong default
                    }
                    
                    // Draw text
                    let wIcon = getThemeIcon('windDirection', null);
                    if (wIcon) {
                        ctx.font = '14px "Material Symbols Outlined"';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = windColor;
                        ctx.strokeStyle = state.theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)';
                        ctx.lineWidth = 1;
                        ctx.strokeText(wIcon, 0, 0);
                        ctx.fillText(wIcon, 0, 0);
                    } else {
                        ctx.fillStyle = windColor;
                        ctx.strokeStyle = state.theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)';
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        ctx.moveTo(0, -6);
                        ctx.lineTo(4, 4);
                        ctx.lineTo(0, 2);
                        ctx.lineTo(-4, 4);
                        ctx.closePath();
                        ctx.fill();
                        ctx.stroke();
                    }
                    
                    ctx.restore();
                }
            }
            ctx.restore();
        }

        function drawTemperature(ctx, viewX, viewW, h, styles) {
            const color = getThemeColor('tempLine', '#d32f2f'); // Temperature Base
            const apparentColor = getThemeColor('apparentTempLine', '#8b0000'); // Sensación térmica
            const textColor = '#1a1a1a'; // Siempre modo claro

            const startIdx = Math.max(0, Math.floor(viewX / PIXELS_PER_HOUR) - 5);
            const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / PIXELS_PER_HOUR) + 5);

            // Sombreado entre temperatura y sensación térmica
            for (let i = startIdx; i < Math.min(endIdx, state.hourlyData.length - 1); i++) {
                const d = state.hourlyData[i];
                const nextD = state.hourlyData[i+1];
                const diff1 = Math.abs(d.temp - d.apparent);
                const diff2 = Math.abs(nextD.temp - nextD.apparent);

                if (diff1 >= 1 || diff2 >= 1) {
                    const isCold = diff1 >= Math.max(1, diff2) ? (d.apparent < d.temp) : (nextD.apparent < nextD.temp);
                    ctx.fillStyle = isCold ? 'rgba(2, 136, 209, 0.2)' : 'rgba(239, 68, 68, 0.2)'; // Blue for cold, Red for hot

                    const x1 = i * PIXELS_PER_HOUR;
                    const x2 = (i + 1) * PIXELS_PER_HOUR;

                    const y1_t = normalizeY(d.temp, -20, 40, h);
                    const y1_a = normalizeY(diff1 >= 1 ? d.apparent : d.temp, -20, 40, h);

                    const y2_t = normalizeY(nextD.temp, -20, 40, h);
                    const y2_a = normalizeY(diff2 >= 1 ? nextD.apparent : nextD.temp, -20, 40, h);

                    ctx.beginPath();
                    ctx.moveTo(x1, y1_t);
                    ctx.lineTo(x2, y2_t);
                    ctx.lineTo(x2, y2_a);
                    ctx.lineTo(x1, y1_a);
                    ctx.closePath();
                    ctx.fill();
                }
            }

            // Línea de sensación térmica
            ctx.lineWidth = 1.5;
            
            for (let i = startIdx; i < Math.min(endIdx, state.hourlyData.length - 1); i++) {
                const d = state.hourlyData[i];
                const nextD = state.hourlyData[i+1];
                
                const diff1 = Math.abs(d.temp - d.apparent);
                const diff2 = Math.abs(nextD.temp - nextD.apparent);

                const shouldDraw = diff1 >= 1 || diff2 >= 1;

                if (shouldDraw) {
                    const isCold = diff1 >= Math.max(1, diff2) ? (d.apparent < d.temp) : (nextD.apparent < nextD.temp);
                    
                    const x1 = i * PIXELS_PER_HOUR;
                    const y1 = normalizeY(diff1 >= 1 ? d.apparent : d.temp, -20, 40, h);
                    
                    const x2 = (i + 1) * PIXELS_PER_HOUR;
                    const y2 = normalizeY(diff2 >= 1 ? nextD.apparent : nextD.temp, -20, 40, h);

                    const avgY = (y1 + y2) / 2;
                    const cloudY = h - (h * (d.clouds / 100));
                    const nextCloudY = h - (h * (nextD.clouds / 100));
                    const avgCloudY = (cloudY + nextCloudY) / 2;

                    const probY = h - (h * ((d.precipProb || 0) / 100));
                    const nextProbY = h - (h * ((nextD.precipProb || 0) / 100));
                    const avgProbY = (probY + nextProbY) / 2;

                    const avgClouds = (d.clouds + nextD.clouds) / 2;
                    const avgProb = ((d.precipProb || 0) + (nextD.precipProb || 0)) / 2;

                    let isWet = avgY >= avgProbY && avgProb > 15;
                    let isCloudy = avgY >= avgCloudY && avgClouds >= 25;

                    // 1. Dibujado de Efectos Continuos (Glow/Sombra)
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    
                    let sCol = '';
                    let sBlur = 0;
                    let sOffY = 0;

                    if (isWet) {
                        sCol = 'rgba(0, 200, 255, 0.3)';
                        sBlur = 20;
                        sOffY = 2; // Más separado
                    } else if (isCloudy) {
                        sCol = 'rgba(0, 0, 0, 0.2)'; // Más suave
                        sBlur = 20; // Más difuminado
                        sOffY = 6; // Más separado
                    }
                    
                    if (sCol) {
                        ctx.shadowColor = sCol;
                        ctx.shadowBlur = sBlur;
                        ctx.shadowOffsetY = sOffY;
                        ctx.strokeStyle = sCol.replace(/[\d.]+\)$/, '0.05)'); // Muy tenue
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                    ctx.restore();

                    // 2. Dibujado de la Línea Punteada (Sin sombra física individual)
                    ctx.save();
                    ctx.setLineDash([4, 4]);
                    
                    if (!isWet && !isCloudy) {
                        // Color adaptado para despejado (mezcla entre color base y resplandor)
                        if (d.isNight) {
                            // Night: Blanco como base de mezcla solo si es calor
                            ctx.strokeStyle = isCold ? '#0288d1' : 'rgba(247, 161, 161, 0.9)';
                        } else {
                            // Day: Naranja como base de mezcla solo si es calor
                            ctx.strokeStyle = isCold ? '#0288d1' : 'rgba(247, 104, 34, 1)';
                        }
                    } else {
                        ctx.strokeStyle = isCold ? '#0288d1' : '#ef4444'; 
                    }

                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();

                    if (isWet) {
                        // Reflejo húmedo continuo (sin puntos) como pidió el usuario
                        ctx.setLineDash([]); 
                        ctx.strokeStyle = 'rgba(200, 240, 255, 0.4)';
                        ctx.lineWidth = 0.8;
                        ctx.stroke();
                    }

                    ctx.restore();
                }
            }
            
            // Pre-calcular claridad de nodos para transiciones suaves del resplandor
            let nodeClear = [];
            for (let i = 0; i < state.hourlyData.length; i++) {
                const d = state.hourlyData[i];
                const y = normalizeY(d.temp, -20, 40, h);
                const cloudY = h - (h * (d.clouds / 100));
                const probY = h - (h * ((d.precipProb || 0) / 100));
                
                let isWetNode = y >= probY && (d.precipProb || 0) > 15;
                let isCloudyNode = y >= cloudY && d.clouds >= 25;
                nodeClear.push(!(isWetNode || isCloudyNode) ? 1 : 0);
            }

            // Línea de temperatura normal
            for (let i = startIdx; i < endIdx - 1; i++) {
                const d = state.hourlyData[i];
                const nextD = state.hourlyData[i+1];
                
                const x1 = i * PIXELS_PER_HOUR;
                const y1 = normalizeY(d.temp, -20, 40, h);
                const x2 = (i + 1) * PIXELS_PER_HOUR;
                const y2 = normalizeY(nextD.temp, -20, 40, h);

                const avgY = (y1 + y2) / 2;
                const cloudY = h - (h * (d.clouds / 100));
                const nextCloudY = h - (h * (nextD.clouds / 100));
                const avgCloudY = (cloudY + nextCloudY) / 2;

                const probY = h - (h * ((d.precipProb || 0) / 100));
                const nextProbY = h - (h * ((nextD.precipProb || 0) / 100));
                const avgProbY = (probY + nextProbY) / 2;

                const avgClouds = (d.clouds + nextD.clouds) / 2;
                const avgProb = ((d.precipProb || 0) + (nextD.precipProb || 0)) / 2;

                ctx.save();
                ctx.lineWidth = 3;
                ctx.strokeStyle = color;

                let isWet = avgY >= avgProbY && avgProb > 15;
                let isCloudy = avgY >= avgCloudY && avgClouds >= 25;

                if (isCloudy || isWet) {
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
                    ctx.shadowOffsetY = 4;
                    ctx.shadowBlur = 12;
                } else {
                    ctx.shadowColor = 'transparent';
                    ctx.shadowBlur = 0;
                }
                
                let gStart = nodeClear[i] || 0;
                let gEnd = nodeClear[i+1] || 0;

                // Efecto resplandor como trazo continuo con gradiente (suavizado)
                if (gStart > 0 || gEnd > 0) {
                    const isMobile = window.innerWidth < 600;
                    
                    // Al usar multi-stroke, las capas suman mucha opacidad. Reducimos el base multiplicador.
                    let intensityStart = isMobile && !d.isNight ? gStart * 0.6 : gStart * 1.0;
                    let intensityEnd = isMobile && !nextD.isNight ? gEnd * 0.6 : gEnd * 1.0;
                    
                    if (d.isNight) intensityStart = gStart * 1.4; // Noche más brillante
                    if (nextD.isNight) intensityEnd = gEnd * 1.4;

                    const colStart = d.isNight ? `rgba(255, 255, 255, ${Math.min(1, intensityStart)})` : `rgba(255, 140, 0, ${Math.min(1, intensityStart)})`;
                    const colEnd = nextD.isNight ? `rgba(255, 255, 255, ${Math.min(1, intensityEnd)})` : `rgba(255, 140, 0, ${Math.min(1, intensityEnd)})`;

                    let grad = ctx.createLinearGradient(x1, y1, x2, y2);
                    grad.addColorStop(0, colStart);
                    grad.addColorStop(1, colEnd);

                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    
                    ctx.strokeStyle = grad;
                    ctx.lineCap = 'round';
                    
                    // Para evitar cualquier banding o cortes visibles, usamos una línea muy fina (3px) 
                    // que quedará completamente oculta bajo la línea principal roja/azul.
                    // Toda la luz visible hacia afuera se generará ÚNICAMENTE mediante el desenfoque gaussiano perfecto.
                    ctx.lineWidth = 3; 
                    ctx.shadowColor = d.isNight ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 140, 0, 1)';
                    ctx.shadowOffsetY = 0;
                    
                    // Capa 1: Halo exterior suave y muy amplio
                    ctx.shadowBlur = isMobile ? (d.isNight ? 24 : 18) : (d.isNight ? 30 : 22);
                    ctx.globalAlpha = d.isNight ? 0.8 : 0.45; 
                    ctx.stroke();
                    if (d.isNight) { ctx.stroke(); } // Duplicar intensidad en la noche
                    
                    // Capa 2: Resplandor medio para dar cuerpo a la luz
                    ctx.shadowBlur = isMobile ? (d.isNight ? 12 : 9) : (d.isNight ? 16 : 12);
                    ctx.globalAlpha = d.isNight ? 0.95 : 0.65;
                    ctx.stroke();
                    if (d.isNight) { ctx.stroke(); }
                    
                    // Capa 3: Brillo intenso concentrado cerca del núcleo
                    ctx.shadowBlur = isMobile ? (d.isNight ? 5 : 4) : (d.isNight ? 7 : 5);
                    ctx.globalAlpha = d.isNight ? 1.0 : 0.9;
                    ctx.stroke();
                    if (d.isNight) { ctx.stroke(); ctx.stroke(); } // Multiplicar el núcleo para que el blanco destaque
                    
                    ctx.restore();
                }

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                
                // Refuerzo extra de brillo para cielos muy despejados
                let glowFactor = (gStart + gEnd) / 2;
                if (glowFactor > 0.7 && !isCloudy && !isWet) {
                    ctx.save();
                    ctx.globalAlpha = (glowFactor - 0.7) * 3.3;
                    ctx.stroke();
                    ctx.restore();
                }

                // Detalles adicionales adaptativos a la línea base
                const avgTemp = (d.temp + nextD.temp) / 2;
                const avgWind = (d.wind + nextD.wind) / 2;
                


                // Efecto escarcha para frío (reacciona al entorno)
                if (avgTemp <= 0) {
                    ctx.save();
                    ctx.strokeStyle = 'rgba(150, 240, 255, 0.7)';
                    ctx.lineWidth = 1;
                    ctx.setLineDash([3, 4]);
                    ctx.beginPath();
                    ctx.moveTo(x1, y1 + 3);
                    ctx.lineTo(x2, y2 + 3);
                    ctx.stroke();
                    ctx.restore();
                }

                if (isWet) {
                    // Charco continuo (continuous puddle)
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.lineWidth = 7;
                    ctx.strokeStyle = 'rgba(13, 71, 161, 0.35)'; // Azul oscuro transparente
                    ctx.lineCap = 'round';
                    ctx.stroke();
                    ctx.restore();


                }
                
                // Contraste para nubes: sutil resplandor interno claro por encima de la sombra oscura
                if (isCloudy && !isWet) {
                    ctx.save();
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; // Fina luz blanca debajo del rojo, arriba de las nubes grises
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(x1, y1 + 1);
                    ctx.lineTo(x2, y2 + 1);
                    ctx.stroke();
                    ctx.restore();
                }

                ctx.restore();
            }

            // Puntos y valores
            ctx.font = `bold 10px ${getThemeFont()}`;
            ctx.textAlign = 'center';
            for (let i = startIdx; i < endIdx; i++) {
                const d = state.hourlyData[i];
                const x = i * PIXELS_PER_HOUR;
                const y = normalizeY(d.temp, -20, 40, h);

                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();

                // Sombra para legibilidad (Solo si hay nubosidad o lluvia)
                const cloudY = h - (h * (d.clouds / 100));
                const probY = h - (h * ((d.precipProb || 0) / 100));
                const isWet = y >= probY && (d.precipProb || 0) > 15;
                const isCloudy = y >= cloudY && d.clouds >= 25;

                ctx.save();
                if (isWet || isCloudy) {
                    ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
                    ctx.shadowBlur = 5;
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                    ctx.strokeText(d.temp.toFixed(1) + '°', x, y - 10);
                }
                
                ctx.fillStyle = textColor;
                ctx.fillText(d.temp.toFixed(1) + '°', x, y - 10);
                ctx.restore();
            }
        }

        function drawNightShadow(ctx, viewX, viewW, h) {
            const startIdx = Math.max(0, Math.floor(viewX / PIXELS_PER_HOUR) - 5);
            const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / PIXELS_PER_HOUR) + 5);

            let solidNightStart = -1;

            for (let i = startIdx; i < endIdx; i++) {
                const d = state.hourlyData[i];
                if (d.isNight) {
                    const prevIsDay = i > 0 && !state.hourlyData[i-1].isNight;
                    const nextIsDay = i < state.hourlyData.length - 1 && !state.hourlyData[i+1].isNight;
                    const x = i * PIXELS_PER_HOUR;
                    const w = PIXELS_PER_HOUR;

                    if (prevIsDay) {
                        if (solidNightStart !== -1) {
                            ctx.fillStyle = 'rgba(0, 0, 20, 0.15)';
                            ctx.fillRect(solidNightStart * PIXELS_PER_HOUR, 0, (i - solidNightStart) * PIXELS_PER_HOUR, h);
                            solidNightStart = -1;
                        }
                        const grad = ctx.createLinearGradient(x, 0, x + w + 0.5, 0);
                        grad.addColorStop(0, 'rgba(0, 0, 20, 0)');
                        grad.addColorStop(1, 'rgba(0, 0, 20, 0.15)');
                        ctx.fillStyle = grad;
                        ctx.fillRect(x, 0, w + 0.5, h);
                    } else if (nextIsDay) {
                        if (solidNightStart !== -1) {
                            ctx.fillStyle = 'rgba(0, 0, 20, 0.15)';
                            ctx.fillRect(solidNightStart * PIXELS_PER_HOUR, 0, (i - solidNightStart) * PIXELS_PER_HOUR, h);
                            solidNightStart = -1;
                        }
                        const grad = ctx.createLinearGradient(x, 0, x + w + 0.5, 0);
                        grad.addColorStop(0, 'rgba(0, 0, 20, 0.15)');
                        grad.addColorStop(1, 'rgba(0, 0, 20, 0)');
                        ctx.fillStyle = grad;
                        ctx.fillRect(x, 0, w + 0.5, h);
                    } else {
                        if (solidNightStart === -1) {
                            solidNightStart = i;
                        }
                    }
                } else {
                    if (solidNightStart !== -1) {
                        ctx.fillStyle = 'rgba(0, 0, 20, 0.15)';
                        ctx.fillRect(solidNightStart * PIXELS_PER_HOUR, 0, (i - solidNightStart) * PIXELS_PER_HOUR + 0.5, h);
                        solidNightStart = -1;
                    }
                }
            }

            if (solidNightStart !== -1) {
                ctx.fillStyle = 'rgba(0, 0, 20, 0.15)';
                ctx.fillRect(solidNightStart * PIXELS_PER_HOUR, 0, (endIdx - solidNightStart) * PIXELS_PER_HOUR + 0.5, h);
            }
        }

        function drawAxes(ctx, viewX, viewW, h, styles) {
            ctx.save();
            ctx.fillStyle = '#666666'; // Siempre modo claro
            ctx.font = `bold 10px ${getThemeFont()}`;
            ctx.textAlign = 'center';

            const startIdx = Math.max(0, Math.floor(viewX / PIXELS_PER_HOUR) - 5);
            const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / PIXELS_PER_HOUR) + 5);

            const sunMarkers = [];
            if (state.hourlyData.length) {
                const startTime = state.hourlyData[0].time;
                Object.values(state.sunData).forEach(sun => {
                    sunMarkers.push(((sun.sunrise - startTime) / 3600000) * PIXELS_PER_HOUR);
                    sunMarkers.push(((sun.sunset - startTime) / 3600000) * PIXELS_PER_HOUR);
                });
            }

            for (let i = startIdx; i < endIdx; i++) {
                const d = state.hourlyData[i];
                const x = i * PIXELS_PER_HOUR;
                
                // Check overlap with sun markers
                const isOverlapping = sunMarkers.some(markerX => Math.abs(markerX - x) < 25);
                if (isOverlapping) continue;

                const label = d.localHour.toString().padStart(2, '0');

                // Sombra para legibilidad
                ctx.save();
                ctx.shadowColor = 'white';
                ctx.shadowBlur = 3;
                ctx.lineWidth = 2;
                ctx.strokeStyle = 'white';

                // Top labels (Axis X)
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, 8);
                ctx.stroke();
                ctx.strokeText(label, x, 20);
                ctx.fillStyle = '#666666';
                ctx.fillText(label, x, 20);

                ctx.restore();
            }
            ctx.restore();
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

            const activeX = Math.floor(scrollContainer.scrollLeft + 60);
            const drawX = 60;
            
            // 1. Fixed Reference Line (60px)
            fixedOverlayCtx.save();
            fixedOverlayCtx.setLineDash([5, 5]);
            fixedOverlayCtx.strokeStyle = getThemeColor('referenceLine', 'rgba(255, 255, 255, 0.3)');
            fixedOverlayCtx.beginPath();
            fixedOverlayCtx.moveTo(60, 0);
            fixedOverlayCtx.lineTo(60, h);
            fixedOverlayCtx.stroke();
            fixedOverlayCtx.restore();

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

                const temp = interpolate(d1.temp, d2.temp);
                const apparent = interpolate(d1.apparent, d2.apparent);
                const clouds = interpolate(d1.clouds, d2.clouds);
                const precipProb = interpolate(d1.precipProb, d2.precipProb);

                fixedOverlayCtx.save();
                fixedOverlayCtx.setLineDash([]);
                fixedOverlayCtx.font = `bold 10px ${getThemeFont()}`;
                fixedOverlayCtx.textAlign = 'left';
                fixedOverlayCtx.textBaseline = 'middle';
                fixedOverlayCtx.strokeStyle = '#fff';
                fixedOverlayCtx.lineWidth = 1.5;

                const drawPoint = (y, color, value, unit, shape = 'circle', icon = '', secondaryText = null, secondaryColor = null) => {
                    if (y >= h - 5) return; // No dibujar si está en el fondo

                    // El punto va en la Y exacta
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

                    // No mostrar valores de 0 o muy cercanos a 0 para evitar ruido y solapamientos
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

                        // Si colisiona con una etiqueta anterior, desplazamos hacia abajo o hacia la derecha
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
                if (d1.uv >= 1) {
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

                    drawPoint(barY - 12, '#1976d2', pVal.toFixed(1) + (isBroken ? ' (!)' : ''), ' mm', 'none', pIcon);
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

                // 9. UV Index Interaction
                let uvBlockDOM = document.getElementById('uv-active-block');
                if (!uvBlockDOM) {
                    uvBlockDOM = document.createElement('div');
                    uvBlockDOM.id = 'uv-active-block';
                    uvBlockDOM.style.position = 'absolute';
                    uvBlockDOM.style.top = '0';
                    uvBlockDOM.style.height = '14px'; // Reduced to prevent overlap with hour digits text
                    uvBlockDOM.style.zIndex = '5'; // Below overlay, above tiles
                    uvBlockDOM.style.pointerEvents = 'none';
                    uvBlockDOM.style.display = 'flex';
                    uvBlockDOM.style.alignItems = 'center';
                    uvBlockDOM.style.justifyContent = 'center';
                    uvBlockDOM.style.fontWeight = 'bold';
                    uvBlockDOM.style.fontSize = '8.5px'; // Slightly smaller to fit in the 14px height
                    uvBlockDOM.style.fontFamily = getThemeFont();
                    uvBlockDOM.style.borderBottomLeftRadius = '4px';
                    uvBlockDOM.style.borderBottomRightRadius = '4px';
                    uvBlockDOM.style.borderBottom = '1px solid transparent';
                    uvBlockDOM.style.borderLeft = '1px solid transparent';
                    uvBlockDOM.style.borderRight = '1px solid transparent';
                    const wrapper = document.getElementById('canvas-wrapper');
                    if (wrapper) wrapper.appendChild(uvBlockDOM);
                }

                if (d1.uv >= 1) {
                    let color = getThemeColor('uvLevels.low', '#4caf50');
                    if (d1.uv >= 3 && d1.uv < 6) color = getThemeColor('uvLevels.moderate', '#fbc02d');
                    else if (d1.uv >= 6 && d1.uv < 8) color = getThemeColor('uvLevels.high', '#f57c00');
                    else if (d1.uv >= 8 && d1.uv < 11) color = getThemeColor('uvLevels.veryHigh', '#d32f2f');
                    else if (d1.uv >= 11) color = getThemeColor('uvLevels.extreme', '#7b1fa2');

                    const uvText = `UV ${parseFloat(d1.uv).toFixed(1)}`;
                    
                    const c = window.hexToRgb ? window.hexToRgb(color) : {r: 0, g: 0, b: 0};
                    const bgR = Math.round(255 * 0.8 + c.r * 0.2);
                    const bgG = Math.round(255 * 0.8 + c.g * 0.2);
                    const bgB = Math.round(255 * 0.8 + c.b * 0.2);
                    const opacityColor = `rgba(${bgR}, ${bgG}, ${bgB}, 0.95)`;
                    
                    let textColor = color;
                    if (color === '#fbc02d') textColor = '#e65100';

                    if (uvBlockDOM) {
                        uvBlockDOM.style.display = 'flex';
                        uvBlockDOM.style.backgroundColor = opacityColor;
                        uvBlockDOM.style.borderColor = color;
                        uvBlockDOM.style.color = textColor;
                        uvBlockDOM.innerText = uvText;
                        
                        if (window.innerWidth < 600) {
                            // Full width on mobile, minimal padding, no left/right borders to look flushed
                            uvBlockDOM.style.left = (index * PIXELS_PER_HOUR) + 'px';
                            uvBlockDOM.style.width = PIXELS_PER_HOUR + 'px';
                            uvBlockDOM.style.borderLeft = 'none';
                            uvBlockDOM.style.borderRight = 'none';
                            uvBlockDOM.style.borderBottomLeftRadius = '0px';
                            uvBlockDOM.style.borderBottomRightRadius = '0px';
                        } else {
                            // Fit to width + padding on desktop
                            const canvasFont = `bold 9px ${getThemeFont()}`;
                            fixedOverlayCtx.font = canvasFont;
                            const textW = fixedOverlayCtx.measureText(uvText).width;
                            const labelW = Math.max(34, textW + 10);
                            const slotCenterX = index * PIXELS_PER_HOUR + PIXELS_PER_HOUR / 2;
                            uvBlockDOM.style.left = (slotCenterX - labelW / 2) + 'px';
                            uvBlockDOM.style.width = labelW + 'px';
                            uvBlockDOM.style.borderLeft = `1px solid ${color}`;
                            uvBlockDOM.style.borderRight = `1px solid ${color}`;
                            uvBlockDOM.style.borderBottomLeftRadius = '4px';
                            uvBlockDOM.style.borderBottomRightRadius = '4px';
                        }
                    }
                } else if (uvBlockDOM) {
                    uvBlockDOM.style.display = 'none';
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
        function normalizeY(val, min, max, height) {
            const norm = (val - min) / (max - min);
            return height - (norm * height * 0.8) - (height * 0.1); // Margen superior/inferior
        }

        function getAQIInfo(aqi) {
            if (aqi === null) return { text: '--', rec: '' };
            let level = 1;
            if (aqi <= 6) {
                level = aqi;
            } else {
                if (aqi <= 20) level = 1;
                else if (aqi <= 40) level = 2;
                else if (aqi <= 60) level = 3;
                else if (aqi <= 80) level = 4;
                else if (aqi <= 100) level = 5;
                else level = 6;
            }

            const map = {
                1: { t: 'Bueno', r: 'Calidad de aire ideal para actividades al aire libre.' },
                2: { t: 'Regular', r: 'Los grupos sensibles deben considerar reducir el esfuerzo físico.' },
                3: { t: 'Moderado', r: 'Se recomienda reducir actividades intensas al aire libre.' },
                4: { t: 'Pobre', r: 'Evite el esfuerzo físico prolongado al aire libre.' },
                5: { t: 'Muy Pobre', r: 'Mantenga las ventanas cerradas y evite salir.' },
                6: { t: 'Extremo', r: 'Alerta de salud: evite cualquier actividad al aire libre.' }
            };

            return {
                text: map[level]?.t || 'Desconocido',
                rec: map[level]?.r || '',
                val: aqi
            };
        }

        function getWeatherDescription(code) {
            const mapping = {
                0: "Despejado",
                1: "Principalmente despejado",
                2: "Parcialmente nublado",
                3: "Cubierto",
                45: "Niebla",
                48: "Niebla con escarcha",
                51: "Llovizna ligera",
                53: "Llovizna moderada",
                55: "Llovizna densa",
                56: "Llovizna helada ligera",
                57: "Llovizna helada densa",
                61: "Lluvia débil",
                63: "Lluvia moderada",
                65: "Lluvia fuerte",
                66: "Lluvia helada ligera",
                67: "Lluvia helada fuerte",
                71: "Nieve débil",
                73: "Nieve moderada",
                75: "Nieve fuerte",
                77: "Granizo",
                80: "Chubascos de lluvia débiles",
                81: "Chubascos de lluvia moderados",
                82: "Chubascos de lluvia violentos",
                85: "Chubascos de nieve débiles",
                86: "Chubascos de nieve fuertes",
                95: "Tormenta",
                96: "Tormenta con granizo débil",
                99: "Tormenta con granizo fuerte"
            };
            return mapping[code] || "Desconocido";
        }

        function getPollenText(val) {
            if (val === null || val === undefined) return '--';
            if (val < 1) return 'Nulo';
            if (val < 15) return 'Bajo';
            if (val < 50) return 'Medio';
            return 'Alto';
        }

        function drawAQIRadar(data) {
            const canvas = document.getElementById('aqi-radar');
            if (!canvas || !data.aqiDetails) return;
            const ctx = canvas.getContext('2d');
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = 60;

            const pollutants = [
                { name: 'PM10', val: data.aqiDetails.pm10 || 0, max: 100 },
                { name: 'PM2.5', val: data.aqiDetails.pm2_5 || 0, max: 75 },
                { name: 'O3', val: data.aqiDetails.ozone || 0, max: 180 },
                { name: 'NO2', val: data.aqiDetails.nitrogen_dioxide || 0, max: 200 }
            ];

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw axis lines and background (square/diamond for 4 elements)
            const corners = pollutants.length;
            ctx.strokeStyle = 'rgba(128,128,128,0.4)';
            ctx.lineWidth = 1;
            for (let j = 1; j <= 3; j++) {
                ctx.beginPath();
                const r = (radius / 3) * j;
                for (let i = 0; i < corners; i++) {
                    const angle = (Math.PI * 2 / corners) * i - Math.PI / 2;
                    const x = centerX + r * Math.cos(angle);
                    const y = centerY + r * Math.sin(angle);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.stroke();
            }

            // Ejes
            ctx.beginPath();
            for (let i = 0; i < corners; i++) {
                const angle = (Math.PI * 2 / corners) * i - Math.PI / 2;
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
            }
            ctx.stroke();

            // Etiquetas
            ctx.font = 'bold 9px Inter';
            ctx.fillStyle = 'var(--text-primary)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            pollutants.forEach((p, i) => {
                const angle = (Math.PI * 2 / corners) * i - Math.PI / 2;
                const labelDist = radius + 22;
                const x = centerX + labelDist * Math.cos(angle);
                const y = centerY + labelDist * Math.sin(angle);

                ctx.save();
                ctx.shadowColor = state.theme === 'dark' ? 'black' : 'white';
                ctx.shadowBlur = 4;
                ctx.fillText(p.name, x, y);
                ctx.restore();
            });

            // Área de datos
            ctx.fillStyle = 'rgba(239, 68, 68, 0.6)'; // Reddish for pollution
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            pollutants.forEach((p, i) => {
                const angle = (Math.PI * 2 / corners) * i - Math.PI / 2;
                const r = Math.min(radius, (p.val / p.max) * radius);
                const x = centerX + r * Math.cos(angle);
                const y = centerY + r * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Detalles texto
            const details = document.getElementById('aqi-details');
            if (details) {
                details.innerHTML = pollutants.map(p => {
                    const unit = 'µg/m³';
                    return `<div style="display:flex; justify-content:space-between;"><span>${p.name}:</span> <b>${p.val.toFixed(1)} ${unit}</b></div>`;
                }).join('');
            }
        }
        function drawPollenRadar(data) {
            const canvas = document.getElementById('pollen-radar');
            if (!canvas || !data.pollenDetails) return;
            const ctx = canvas.getContext('2d');
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = 55;
            const plants = [
                { name: 'Aliso', val: data.pollenDetails.alder, max: 50 },
                { name: 'Abedul', val: data.pollenDetails.birch, max: 50 },
                { name: 'Gramíneas', val: data.pollenDetails.grass, max: 30 },
                { name: 'Artemisa', val: data.pollenDetails.mugwort, max: 30 },
                { name: 'Olivo', val: data.pollenDetails.olive, max: 50 },
                { name: 'Ambrosía', val: data.pollenDetails.ragweed, max: 30 }
            ];

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Dibujar fondo (hexágono)
            ctx.strokeStyle = 'rgba(128,128,128,0.4)';
            ctx.lineWidth = 1;
            for (let j = 1; j <= 3; j++) {
                ctx.beginPath();
                const r = (radius / 3) * j;
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i - Math.PI / 2;
                    const x = centerX + r * Math.cos(angle);
                    const y = centerY + r * Math.sin(angle);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.stroke();
            }

            // Ejes
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i - Math.PI / 2;
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
            }
            ctx.stroke();

            // Etiquetas
            ctx.font = 'bold 9px Inter';
            ctx.fillStyle = 'var(--text-primary)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            plants.forEach((p, i) => {
                const angle = (Math.PI / 3) * i - Math.PI / 2;
                // Aumentamos la distancia de las etiquetas para que no se pisen con el polígono
                const labelDist = radius + 22;
                const x = centerX + labelDist * Math.cos(angle);
                const y = centerY + labelDist * Math.sin(angle);

                // Dibujar un pequeño fondo para el texto si es necesario, o usar sombras
                ctx.save();
                ctx.shadowColor = state.theme === 'dark' ? 'black' : 'white';
                ctx.shadowBlur = 4;
                ctx.fillText(p.name, x, y);
                ctx.restore();
            });

            // Área de datos
            ctx.fillStyle = 'rgba(51, 153, 255, 0.6)';
            ctx.strokeStyle = '#3399ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            plants.forEach((p, i) => {
                const angle = (Math.PI / 3) * i - Math.PI / 2;
                const r = Math.min(radius, (p.val / p.max) * radius);
                const x = centerX + r * Math.cos(angle);
                const y = centerY + r * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Detalles texto
            const details = document.getElementById('pollen-details');
            if (details) {
                details.innerHTML = plants.map(p => `<div style="display:flex; justify-content:space-between;"><span>${p.name}:</span> <b>${p.val.toFixed(1)}</b></div>`).join('');
            }
        }
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

            // Solo actualizar si los datos han cambiado
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
                        <span style="font-weight:bold;">Calidad del Aire</span>
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

            // Calculamos el tiempo exacto basado en la posición X para mostrar minutos precisos
            const startTime = state.hourlyData[0].time;
            const exactTime = startTime + (activeX / PIXELS_PER_HOUR) * 3600000;
            const date = new Date(exactTime);
            const today = new Date();
            const isToday = date.getDate() === today.getDate() &&
                            date.getMonth() === today.getMonth() &&
                            date.getFullYear() === today.getFullYear();

            const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: state.timezone });
            const dateStr = date.toLocaleString('es-ES', {
                weekday: 'short', day: 'numeric', month: 'short', timeZone: state.timezone
            }).toUpperCase();

            const timeDisplay = document.getElementById('current-time-display');
            timeDisplay.querySelector('.time-main').innerText = timeStr;
            timeDisplay.querySelector('.date-sub').innerText = isToday ? `HOY, ${dateStr}` : dateStr;

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
