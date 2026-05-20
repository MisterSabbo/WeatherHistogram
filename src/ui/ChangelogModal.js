import { changelogData } from '../data/changelog.js';
import { t } from '../utils/i18n.js';
import { openBottomSheet } from './BottomSheet.js';

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

function renderChangelogData(changelogData, version, listEl, closeBtn, updateBtn, onUpdate) {
  const renderData = version ? [changelogData.find(item => item.version === version) || { version: version, changes: [] }] : changelogData;

  renderData.forEach((item, index) => {
    const li = document.createElement('li');
    li.style.position = 'relative';
    li.style.paddingLeft = '30px';
    li.style.cursor = 'pointer';
    li.style.opacity = '0';
    li.style.transform = 'translateY(10px)';
    li.style.animation = `fadeInUp 0.4s ease forwards ${index * 0.1}s`;
    li.addEventListener('animationend', function cleanup() {
      this.style.opacity = '1';
      this.style.transform = 'none';
      this.style.animation = 'none';
      this.removeEventListener('animationend', cleanup);
    });

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
  if (updateBtn && onUpdate) {
    updateBtn.onclick = async () => {
      closeSheet();
      await onUpdate();
    };
  }
}

export function showChangelogModal(version, onUpdate) {
  const modal = document.getElementById('changelog-modal');
  const titleEl = document.getElementById('changelog-title');
  const listEl = document.getElementById('changelog-list');
  const closeBtn = document.getElementById('changelog-close-btn');
  const updateContainer = document.getElementById('changelog-update-container');
  const updateBtn = document.getElementById('changelog-update-btn');
  const itemsContainer = document.getElementById('changelog-items');

  if (!modal || !titleEl || !listEl || !closeBtn || !updateBtn || !itemsContainer) return;

  itemsContainer.innerHTML = '';

  if (version) {
    const titleFormat = t('config.changelogTitle') || 'Novedades v{version}';
    titleEl.textContent = titleFormat.replace('{version}', version);
    updateContainer.style.display = 'flex';
    updateBtn.textContent = (t('config.update') || 'Actualizar') + ' a v' + version;
  } else {
    titleEl.textContent = t('config.changelogTitleAll') || 'Todos los cambios';
    updateContainer.style.display = 'none';
  }

  renderChangelogData(changelogData, version, itemsContainer, closeBtn, updateBtn, onUpdate);
}

export function initChangelog(onBeforeOpen) {
  let isChangelogLoading = false;
  const openChangelogLink = document.getElementById('open-changelog-link');
  if (openChangelogLink) {
    openChangelogLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (isChangelogLoading) return;
      isChangelogLoading = true;
      if (onBeforeOpen) onBeforeOpen();
      requestAnimationFrame(() => {
        try { showChangelogModal(); } catch (e) { console.error("Changelog err:", e); }
        isChangelogLoading = false;
      });
    });
  }
}
