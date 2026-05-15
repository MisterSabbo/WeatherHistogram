import { t } from '../utils/i18n.js';
import { performClearCacheAndReload } from '../utils/cache.js';

export function initMaintenanceBindings({ showConfirm, weatherCache }) {
    setupForceRefresh(showConfirm, weatherCache);
    setupClearData(showConfirm);
    setupLoadingTimeout();
}

function setupForceRefresh(showConfirm, weatherCache) {
    const forceRefreshBtn = document.getElementById('force-refresh-btn');
    if (!forceRefreshBtn) return;

    forceRefreshBtn.addEventListener('click', () => {
        showConfirm(
            t('config.clearCache') || 'Limpiar caché',
            t('config.clearCacheMsg') || '¿Estás seguro de que quieres limpiar la caché y recargar la aplicación?',
            () => {
                weatherCache.clear();
                performClearCacheAndReload();
            }
        );
    });
}

function setupClearData(showConfirm) {
    const clearDataBtn = document.getElementById('clear-data-btn');
    if (!clearDataBtn) return;

    clearDataBtn.addEventListener('click', () => {
        showConfirm(
            t('config.clearData') || 'Borrar datos guardados',
            t('config.clearDataMsg') || '¿Estás seguro de que quieres eliminar todos los datos persistentes?',
            async () => {
                const { favoritesService } = await import('../services/FavoritesService.js');
                await favoritesService.clear();
                try { indexedDB.deleteDatabase('WeatherHistDB'); } catch (e) {}
                try { localStorage.clear(); } catch (e) {}
                window.location.reload(true);
            }
        );
    });
}

function setupLoadingTimeout() {
    setTimeout(() => {
        const overlay = document.getElementById('overlay');
        if (overlay && !overlay.classList.contains('hidden') && document.getElementById('error-msg').style.display !== 'block') {
            console.warn('Loading taking too long, forcing overlay hide');
            const statusText = document.getElementById('status-text');
            if (statusText && statusText.innerText === t('overlay.loadingData')) {
                statusText.innerHTML = `${t('overlay.loadingData')} <br><button onclick="document.getElementById('overlay').classList.add('hidden')" style="margin-top:10px; font-size:0.7rem; opacity:0.7;">${t('overlay.skipWait')}</button>`;
            }
        }
    }, 10000);
}
