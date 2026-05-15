import { t } from '../utils/i18n.js';
import { openBottomSheet } from './BottomSheet.js';
import { renderChangelogData } from './ChangelogRenderer.js';

let changelogCacheData = null;

export async function showChangelogModal(version) {
    const modal = document.getElementById('changelog-modal');
    const titleEl = document.getElementById('changelog-title');
    const listEl = document.getElementById('changelog-list');
    const closeBtn = document.getElementById('changelog-close-btn');
    const updateContainer = document.getElementById('changelog-update-container');
    const updateBtn = document.getElementById('changelog-update-btn');

    if (!modal || !titleEl || !listEl || !closeBtn || !updateBtn) return;

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

    try {
        let changelogData;
        if (changelogCacheData) {
            changelogData = changelogCacheData;
        } else {
            const response = await fetch('./changelog.json');
            if (!response.ok) throw new Error('Network response was not ok');
            changelogData = await response.json();
            changelogCacheData = changelogData;
        }

        renderChangelogData(changelogData, version, listEl, closeBtn, updateBtn);
    } catch (e) {
        console.warn('Failed to fetch changelog:', e);
        try {
            const cacheNames = await caches.keys();
            for (const name of cacheNames) {
                const cache = await caches.open(name);
                const cachedResp = await cache.match('./changelog.json');
                if (cachedResp && cachedResp.ok) {
                    const cachedData = await cachedResp.json();
                    changelogCacheData = cachedData;
                    renderChangelogData(cachedData, version, listEl, closeBtn, updateBtn);
                    return;
                }
            }
        } catch (cacheErr) {
            console.warn('Cache fallback also failed:', cacheErr);
        }
        const errorMsg = t('config.changelogError') || 'No se ha podido cargar el changelog. Verifica tu conexión.';
        listEl.innerHTML = `<p style="text-align:center;color:var(--text-secondary);padding:40px;font-size:0.9rem;">${errorMsg}</p>`;
        const closeSheet = openBottomSheet('changelog-modal', 'changelog-sheet-backdrop');
        closeBtn.onclick = () => closeSheet();
    }
}

export function initChangelogButton() {
    let isChangelogLoading = false;
    const openChangelogLink = document.getElementById('open-changelog-link');
    const infoModal = document.getElementById('info-modal');

    if (openChangelogLink) {
        const onChangelogOpen = (e) => {
            e.preventDefault();
            if (isChangelogLoading) return;
            isChangelogLoading = true;
            if (infoModal) infoModal.style.display = 'none';
            requestAnimationFrame(() => {
                showChangelogModal()
                    .catch(err => console.error('Changelog err:', err))
                    .finally(() => { isChangelogLoading = false; });
            });
        };
        openChangelogLink.addEventListener('click', onChangelogOpen);
    }
}
