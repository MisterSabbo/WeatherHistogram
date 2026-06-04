import { changelogData } from '../data/changelog.js';
import { t } from '../utils/i18n.js';
import { openBottomSheet } from './BottomSheet.js';

const PAGE_SIZE = 10;

let observer = null;
let sentinel = null;
let isLoading = false;
let currentIndex = 0;

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

function createEntryElement(item) {
  const li = document.createElement('li');
  const isMajor = item.version.endsWith('.0');
  li.className = isMajor ? 'changelog-entry changelog-entry-major' : 'changelog-entry';

  const marker = document.createElement('div');
  marker.className = 'changelog-entry-marker';
  li.appendChild(marker);

  const content = document.createElement('div');
  content.className = 'changelog-entry-content';

  const header = document.createElement('div');
  header.className = 'changelog-entry-header';

  const tag = document.createElement('span');
  tag.className = 'changelog-entry-tag';
  tag.textContent = isMajor ? 'Major' : 'Patch';
  header.appendChild(tag);

  const title = document.createElement('div');
  title.className = 'changelog-entry-title';
  title.textContent = `v${item.version}`;
  header.appendChild(title);

  content.appendChild(header);

  const desc = document.createElement('div');
  desc.className = 'changelog-entry-desc';
  desc.textContent = (item.changes && item.changes.length > 0) ? item.changes[0] : 'Actualizaciones menores y corrección de errores.';
  content.appendChild(desc);

  li.appendChild(content);

  li.onclick = () => openChangelogDetail(item);

  return li;
}

function createBlock(startIndex, count, items) {
  const fragment = document.createDocumentFragment();
  const end = Math.min(startIndex + count, items.length);
  for (let i = startIndex; i < end; i++) {
    fragment.appendChild(createEntryElement(items[i]));
  }
  return fragment;
}

function createSentinel() {
  const el = document.createElement('li');
  el.className = 'changelog-sentinel';
  el.setAttribute('aria-hidden', 'true');
  return el;
}

function createLoadingIndicator() {
  const el = document.createElement('li');
  el.className = 'changelog-loading';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.textContent = t('config.changelogLoading') || 'Loading more changes…';
  return el;
}

function createCaughtUpIndicator() {
  const el = document.createElement('li');
  el.className = 'changelog-caught-up';
  el.textContent = t('config.changelogCaughtUp') || 'All caught up';
  return el;
}

function createErrorMessage(retryCallback) {
  const el = document.createElement('li');
  el.className = 'changelog-error';
  const errorText = document.createElement('span');
  errorText.textContent = (t('config.changelogLoadError') || 'Load error. Retry.') + ' ';
  el.appendChild(errorText);
  const retryLink = document.createElement('a');
  retryLink.textContent = t('config.changelogRetry') || 'Retry';
  retryLink.addEventListener('click', (e) => {
    e.preventDefault();
    retryCallback();
  });
  el.appendChild(retryLink);
  return el;
}

function renderInitialBlock(items, listEl, scrollContentEl) {
  listEl.innerHTML = '';
  currentIndex = 0;

  if (items.length === 0) return;

  if (items.length <= PAGE_SIZE) {
    listEl.appendChild(createBlock(0, items.length, items));
    currentIndex = items.length;
    return;
  }

  listEl.appendChild(createBlock(0, PAGE_SIZE, items));
  currentIndex = PAGE_SIZE;

  sentinel = createSentinel();
  listEl.appendChild(sentinel);

  if (typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !isLoading) {
          loadNextBlock(items, listEl);
        }
      }
    }, {
      root: scrollContentEl || null,
      rootMargin: '0px 0px 200px 0px',
      threshold: 0
    });
    observer.observe(sentinel);
  } else {
    listEl.appendChild(createBlock(currentIndex, items.length - currentIndex, items));
    currentIndex = items.length;
  }
}

function loadNextBlock(items, listEl) {
  if (isLoading || currentIndex >= items.length) return;

  isLoading = true;

  if (sentinel) {
    sentinel.style.display = 'none';
  }

  const loadingEl = createLoadingIndicator();
  listEl.appendChild(loadingEl);

  setTimeout(() => {
    try {
      const block = createBlock(currentIndex, PAGE_SIZE, items);
      currentIndex = Math.min(currentIndex + PAGE_SIZE, items.length);

      listEl.removeChild(loadingEl);

      const wrapper = document.createElement('div');
      wrapper.className = 'changelog-block-enter';
      wrapper.appendChild(block);
      listEl.appendChild(wrapper);

      if (currentIndex >= items.length) {
        listEl.appendChild(createCaughtUpIndicator());
        if (observer && sentinel) {
          observer.unobserve(sentinel);
        }
      } else {
        if (sentinel) {
          sentinel.style.display = '';
          listEl.appendChild(sentinel);
        }
      }
    } catch (err) {
      console.error('Changelog load error:', err);
      if (loadingEl.parentNode) {
        listEl.removeChild(loadingEl);
      }
      const errorEl = createErrorMessage(() => {
        if (errorEl.parentNode) {
          listEl.removeChild(errorEl);
        }
        loadNextBlock(items, listEl);
      });
      listEl.appendChild(errorEl);
      if (sentinel) {
        sentinel.style.display = '';
        if (sentinel.parentNode !== listEl) {
          listEl.appendChild(sentinel);
        }
      }
    } finally {
      isLoading = false;
    }
  }, 150);
}

export function showChangelogModal(version, onUpdate) {
  const modal = document.getElementById('changelog-modal');
  const titleEl = document.getElementById('changelog-title');
  const listEl = document.getElementById('changelog-list');
  const closeBtn = document.getElementById('changelog-close-btn');
  const updateContainer = document.getElementById('changelog-update-container');
  const updateBtn = document.getElementById('changelog-update-btn');
  const itemsContainer = document.getElementById('changelog-items');
  const scrollContentEl = document.getElementById('changelog-scroll-content');

  if (!modal || !titleEl || !listEl || !closeBtn || !updateBtn || !itemsContainer) return;

  itemsContainer.innerHTML = '';

  if (observer) {
    observer.disconnect();
    observer = null;
  }
  sentinel = null;
  isLoading = false;
  currentIndex = 0;

  if (version) {
    const titleFormat = t('config.changelogTitle') || 'Novedades v{version}';
    titleEl.textContent = titleFormat.replace('{version}', version);
    updateContainer.style.display = 'flex';
    updateBtn.textContent = (t('config.update') || 'Actualizar') + ' a v' + version;

    const renderData = [changelogData.find(item => item.version === version) || { version: version, changes: [] }];
    renderData.forEach((item) => {
      itemsContainer.appendChild(createEntryElement(item));
    });
  } else {
    titleEl.textContent = t('config.changelogTitleAll') || 'Todos los cambios';
    updateContainer.style.display = 'none';

    renderInitialBlock(changelogData, itemsContainer, scrollContentEl);
  }

  const closeSheet = openBottomSheet('changelog-modal', 'changelog-sheet-backdrop', 'changelog-scroll-content');

  closeBtn.onclick = () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    sentinel = null;
    isLoading = false;
    currentIndex = 0;
    closeSheet();
  };

  if (updateBtn && onUpdate) {
    updateBtn.onclick = async () => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      closeSheet();
      await onUpdate();
    };
  }
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
