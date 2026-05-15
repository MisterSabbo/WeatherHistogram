import { t } from './i18n.js';
import { showChangelogModal } from '../ui/ChangelogModal.js';
import { performClearCacheAndReload } from './cache.js';

export function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', async () => {
            try {
                const reg = await navigator.serviceWorker.register('./sw.js');
                console.log('ServiceWorker registered: ./sw.js');

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
            } catch (err) {
                console.warn('SW registration failed:', err);
            }

            checkAppVersion();
        });
    }
}

export async function checkAppVersion() {
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

export function showUpdateToast() {
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
