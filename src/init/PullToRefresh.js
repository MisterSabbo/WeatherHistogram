import { state } from '../store.js';
import { getThemeColor, getThemeFont } from '../theme.js';
import { t } from '../utils/i18n.js';
import { geoService } from '../services/GeoService.js';

export function initPullToRefresh({ loadWeather, weatherCache, tiles, fixedOverlayCanvas, fixedOverlayCtx, minimapCanvas, minimapCtx }) {
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

            if (Math.abs(currentX - ptrStartX) > Math.abs(currentY - ptrStartY)) {
                ptrStartY = 0;
                ptrDist = 0;
                if (ptrIndicator) ptrIndicator.style.transform = 'translateY(-100%)';
                if (appWrapper) appWrapper.style.transform = 'translateY(0)';
                return;
            }

            if (currentY > ptrStartY) {
                if (e.cancelable) e.preventDefault();
                ptrDist = currentY - ptrStartY;
                if (ptrDist > 0 && ptrDist < 200 && !state.isFetching) {
                    let visualDist = Math.min(75, ptrDist / 2.5);
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
    }, { passive: false });

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
                ptrIndicator.style.transform = 'translateY(-100%)';
            }
            if (appWrapper) {
                appWrapper.style.transition = 'transform 0.3s ease-out';
                appWrapper.style.transform = 'translateY(0)';
            }
        };

        if (ptrDist > 60 && state.lat && state.lon && !state.isFetching) {
            const ptrIcon = document.getElementById('ptr-icon');
            if (ptrIcon) {
                ptrIcon.style.transition = 'transform 0.5s linear';
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
                ptrIcon.dataset.spinInterval = spinInterval;
            }

            if (ptrIndicator) {
                ptrIndicator.style.transition = 'transform 0.2s ease-out';
                ptrIndicator.style.transform = 'translateY(0px)';
            }
            if (appWrapper) {
                appWrapper.style.transition = 'transform 0.2s ease-out';
                appWrapper.style.transform = 'translateY(75px)';
            }

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
            const doRefresh = async () => {
                const overlay = document.getElementById('overlay');
                const statusText = document.getElementById('status-text');
                overlay.classList.remove('hidden');
                statusText.innerText = t('config.loading') || 'Cargando...';
                statusText.style.display = 'block';
                document.querySelector('.loader').style.display = 'block';
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
}
