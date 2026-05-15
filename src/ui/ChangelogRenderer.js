import { openBottomSheet } from './BottomSheet.js';
import { performClearCacheAndReload } from '../utils/cache.js';
import { openChangelogDetail } from './ChangelogDetail.js';

export function renderChangelogData(changelogData, version, listEl, closeBtn, updateBtn) {
    const renderData = version ? [changelogData.find(item => item.version === version) || { version: version, changes: [] }] : changelogData;

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

    const closeSheet = openBottomSheet('changelog-modal', 'changelog-sheet-backdrop');

    closeBtn.onclick = () => closeSheet();
    updateBtn.onclick = async () => {
        closeSheet();
        await performClearCacheAndReload();
    };
}
