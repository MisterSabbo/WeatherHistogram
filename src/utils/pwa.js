import { t } from './i18n.js';

let deferredInstallPrompt = null;
let _isClearingCache = false;

export function registerSW() {
  const handlers = { onUpdate: null };
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        let _skipControllerReload = false;
        try {
          if (sessionStorage.getItem('_skipSwReload') === '1') {
            _skipControllerReload = true;
            sessionStorage.removeItem('_skipSwReload');
          }
        } catch (e) {}

        const reg = await navigator.serviceWorker.register('./sw.js');
        console.log('ServiceWorker registered: ./sw.js');

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                handlers.onUpdate?.();
              }
            });
          }
        });

        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (_isClearingCache || _skipControllerReload) return;
          window.location.reload();
        });
      } catch (err) {
        console.warn('SW registration failed:', err);
      }
    });
  }
  return handlers;
}

export function handleInstallPrompt() {
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
}

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
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    btn.style.display = 'none';
  });
  container.insertBefore(btn, container.firstChild);
}

export function showUpdateToast(onCheckVersion) {
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
      onCheckVersion?.();
    };

    toast.style.display = 'flex';
  }
}

export async function checkAppVersion(onNewVersion) {
  try {
    const response = await fetch('./version.json?t=' + Date.now());
    if (!response.ok) return;
    const data = await response.json();
    const remoteVersion = data.version;
    const localVersion = localStorage.getItem('appVersion');

    if (localVersion && remoteVersion && localVersion !== remoteVersion) {
      localStorage.setItem('appVersion', remoteVersion);
      onNewVersion?.(remoteVersion);
    } else if (!localVersion && remoteVersion) {
      localStorage.setItem('appVersion', remoteVersion);
    }
  } catch (error) {
    console.warn('Failed to check app version:', error);
  }
}

export async function clearCacheAndReload() {
  if (_isClearingCache) return;
  _isClearingCache = true;

  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    } catch (e) { console.warn(e); }
  }
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        if (reg.active) reg.active.postMessage({ action: 'skipWaiting' });
        await reg.unregister();
      }
    } catch (e) { console.warn(e); }
  }
  try { sessionStorage.setItem('_skipSwReload', '1'); } catch (e) {}

  const url = new URL(location.href);
  url.searchParams.set('_t', String(Date.now()));
  location.href = url.toString();
}
