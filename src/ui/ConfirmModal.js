import { openBottomSheet, confirmButtonClone } from './BottomSheet.js';
import { t } from '../utils/i18n.js';

export function showConfirm(title, message) {
  return new Promise((resolve) => {
    const titleEl = document.getElementById('confirm-title');
    const msgEl = document.getElementById('confirm-message');
    const okBtn = document.getElementById('confirm-ok-btn');
    const cancelBtn = document.getElementById('confirm-cancel-btn');

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;

    if (okBtn) okBtn.textContent = t('config.accept') || 'Aceptar';
    if (cancelBtn) cancelBtn.textContent = t('config.cancel') || 'Cancelar';

    let resolved = false;

    const closeFn = openBottomSheet('confirm-modal', 'confirm-sheet-backdrop', 'confirm-sheet-scroll-content');

    confirmButtonClone('confirm-ok-btn', () => {
      if (resolved) return;
      resolved = true;
      closeFn();
      resolve(true);
    });

    confirmButtonClone('confirm-cancel-btn', () => {
      if (resolved) return;
      resolved = true;
      closeFn();
      resolve(false);
    });
  });
}
