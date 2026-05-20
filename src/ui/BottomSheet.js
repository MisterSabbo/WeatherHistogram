let _activeSheets = {};
let _sheetIdCounter = 0;
const _onSheetCloseCallbacks = new Map();

function getScrollElement(sheet, scrollElementId) {
  if (!scrollElementId) return sheet;
  return document.getElementById(scrollElementId) || sheet;
}

export function initBottomSheets() {
  _activeSheets = {};
  _sheetIdCounter = 0;
  _onSheetCloseCallbacks.clear();
}

export function onSheetClose(sheetId, callback) {
  _onSheetCloseCallbacks.set(sheetId, callback);
}

export function openBottomSheet(sheetId, backdropId = 'pill-sheet-backdrop', scrollElementId) {
  const sheet = document.getElementById(sheetId);
  const backdrop = document.getElementById(backdropId);

  if (!sheet || !backdrop) return () => {};

  if (_activeSheets[backdropId]) {
    _activeSheets[backdropId]();
  }

  _sheetIdCounter++;
  const depth = _sheetIdCounter;
  const sheetZ = 7000 + depth * 100;
  const backdropZ = 6999 + depth * 100;
  sheet.style.zIndex = String(sheetZ);
  backdrop.style.zIndex = String(backdropZ);

  sheet.style.transform = '';
  sheet.classList.add('open');
  backdrop.classList.add('open');

  let startY = 0;
  let currentY = 0;
  let isDragging = false;
  let usingTouch = false;
  let touchFallback = false;

  const closeSheet = () => {
    sheet.classList.remove('open');
    backdrop.classList.remove('open');
    sheet.style.transform = '';
    sheet.style.transition = '';
    sheet.style.zIndex = '';
    backdrop.style.zIndex = '';
    backdrop.onclick = null;
    cleanup();
    if (_activeSheets[backdropId] === closeSheet) {
      delete _activeSheets[backdropId];
    }
    _onSheetCloseCallbacks.get(sheetId)?.();
  };

  backdrop.onclick = closeSheet;

  const onDragStart = (clientY) => {
    startY = clientY;
    currentY = clientY;
    isDragging = true;
    sheet.style.transition = 'none';
  };

  const onDragMove = (clientY) => {
    if (!isDragging) return;
    const scrollEl = getScrollElement(sheet, scrollElementId);
    if (scrollEl.scrollTop > 0) return;
    currentY = clientY;
    const diff = currentY - startY;
    if (diff > 0) {
      sheet.style.transform = `translateY(${diff}px)`;
    }
  };

  const onDragEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    sheet.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)';
    if (currentY - startY > 100) {
      closeSheet();
    } else {
      sheet.style.transform = 'translateY(0)';
    }
  };

  const onPointerDown = (e) => {
    usingTouch = e.pointerType === 'touch' || e.pointerType === 'pen';
    onDragStart(e.clientY);
  };

  const onPointerMove = (e) => {
    onDragMove(e.clientY);
  };

  const onPointerUp = () => {
    onDragEnd();
  };

  const onPointerCancel = () => {
    if (!isDragging) return;
    touchFallback = true;
    sheet.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)';
  };

  const onTouchStart = (e) => {
    if (usingTouch) return;
    usingTouch = true;
    onDragStart(e.touches[0].clientY);
  };

  const onTouchMove = (e) => {
    if (touchFallback) {
      if (!isDragging) return;
      const scrollEl = getScrollElement(sheet, scrollElementId);
      if (scrollEl.scrollTop > 0) return;
      currentY = e.touches[0].clientY;
      const diff = currentY - startY;
      if (diff > 0) {
        sheet.style.transform = `translateY(${diff}px)`;
      }
      return;
    }
    if (usingTouch) return;
    if (sheet.scrollTop > 0) return;
    onDragMove(e.touches[0].clientY);
  };

  const onTouchEnd = () => {
    if (touchFallback) {
      touchFallback = false;
      isDragging = false;
      if (currentY - startY > 100) {
        closeSheet();
      } else {
        sheet.style.transform = 'translateY(0)';
      }
      return;
    }
    if (usingTouch) return;
    onDragEnd();
  };

  const cleanup = () => {
    touchFallback = false;
    sheet.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerCancel);
    sheet.removeEventListener('touchstart', onTouchStart);
    sheet.removeEventListener('touchmove', onTouchMove);
    sheet.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('touchend', onTouchEnd);
  };

  sheet.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerCancel);
  sheet.addEventListener('touchstart', onTouchStart, { passive: true });
  sheet.addEventListener('touchmove', onTouchMove, { passive: true });
  sheet.addEventListener('touchend', onTouchEnd);
  window.addEventListener('touchend', onTouchEnd);

  _activeSheets[backdropId] = closeSheet;
  return closeSheet;
}

export function closeBottomSheet(sheetId, backdropId = 'pill-sheet-backdrop') {
  const closeFn = _activeSheets[backdropId];
  if (closeFn) closeFn();
}
