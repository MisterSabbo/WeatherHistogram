const stack = [];
const Z_BASE = 5000;

function createOverlay(zIndex) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: ${zIndex};
        opacity: 1;
        pointer-events: auto;
        transition: opacity 0.3s;
    `;
    document.body.appendChild(overlay);
    return overlay;
}

function syncBodyAttr() {
    if (stack.length > 0) {
        document.body.dataset.modalOpen = '';
    } else {
        delete document.body.dataset.modalOpen;
    }
}

export function openModal(element, options = {}) {
    if (!element) return { close: () => {} };

    const depth = stack.length;
    const modalZIndex = Z_BASE + (depth * 2);
    const overlayZIndex = modalZIndex - 1;

    const overlay = createOverlay(overlayZIndex);
    element.style.zIndex = modalZIndex;

    const show = options.show || ((el) => el.classList.add('open'));
    const hide = options.hide || ((el) => el.classList.remove('open'));

    show(element);

    const entry = { element, overlay, show, hide, zIndex: modalZIndex, onClose: options.onClose };
    stack.push(entry);
    syncBodyAttr();

    const close = () => closeModal(element);

    overlay.addEventListener('click', close);

    if (options.canSwipeClose) {
        const handleId = options.handleId || element.id.replace('-modal', '-sheet-drag-handle');
        setupSwipeClose(element, handleId, close);
    }

    return { close };
}

export function closeModal(element) {
    const entry = stack.find(e => e.element === element);
    if (!entry) return;

    const index = stack.indexOf(entry);
    const toClose = stack.splice(index);

    toClose.forEach(e => {
        e.hide(e.element);
        e.element.style.zIndex = '';
        e.overlay.remove();
        if (e.onClose) e.onClose();
    });

    syncBodyAttr();
}

export function closeTopModal() {
    if (stack.length === 0) return;
    const top = stack[stack.length - 1];
    closeModal(top.element);
}

export function closeAll() {
    const modals = [...stack].reverse();
    modals.forEach(e => {
        e.hide(e.element);
        e.element.style.zIndex = '';
        e.overlay.remove();
        if (e.onClose) e.onClose();
    });
    stack.length = 0;
    syncBodyAttr();
}

export function isModalOpen() {
    return stack.length > 0;
}

function setupSwipeClose(sheet, handleId, closeCallback) {
    const handle = document.getElementById(handleId);
    if (!handle) return;

    let startY = 0;
    let currentY = 0;

    const onTouchStart = (e) => {
        startY = e.touches[0].clientY;
        sheet.style.transition = 'none';
    };

    const onTouchMove = (e) => {
        currentY = e.touches[0].clientY;
        const diff = currentY - startY;
        if (diff > 0) {
            sheet.style.transform = `translateY(${diff}px)`;
        }
    };

    const onTouchEnd = () => {
        sheet.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)';
        if (currentY - startY > 100) {
            closeCallback();
        } else {
            sheet.style.transform = 'translateY(0)';
        }

        const el = document.getElementById(handleId);
        if (el) {
            el.removeEventListener('touchstart', onTouchStart);
            el.removeEventListener('touchmove', onTouchMove);
        }
        window.removeEventListener('touchend', onTouchEnd);
    };

    const clone = handle.cloneNode(true);
    handle.parentNode.replaceChild(clone, handle);
    clone.addEventListener('touchstart', onTouchStart, { passive: true });
    clone.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
}

export function showConfirm(title, message, options = {}) {
    return new Promise((resolve) => {
        const titleEl = document.getElementById('confirm-title');
        const msgEl = document.getElementById('confirm-message');
        const cancelBtn = document.getElementById('confirm-cancel-btn');
        const okBtn = document.getElementById('confirm-ok-btn');

        if (titleEl) titleEl.textContent = title;
        if (msgEl) msgEl.textContent = message;

        if (cancelBtn) cancelBtn.textContent = options.cancelText || 'Cancelar';
        if (okBtn) okBtn.textContent = options.okText || 'Aceptar';

        if (okBtn) {
            const newOk = okBtn.cloneNode(true);
            okBtn.parentNode.replaceChild(newOk, okBtn);
            newOk.onclick = () => {
                close();
                resolve(true);
            };
        }
        if (cancelBtn) {
            const newCancel = cancelBtn.cloneNode(true);
            cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
            newCancel.onclick = () => {
                close();
                resolve(false);
            };
        }

        const { close } = openModal(document.getElementById('confirm-modal'), {
            show: (el) => el.classList.add('open'),
            hide: (el) => el.classList.remove('open'),
            baseZIndex: 6000,
            canSwipeClose: true,
            handleId: 'confirm-sheet-drag-handle'
        });
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeTopModal();
});

export const ModalManager = { openModal, closeModal, closeTopModal, closeAll, isModalOpen, showConfirm };
window.ModalManager = ModalManager;
