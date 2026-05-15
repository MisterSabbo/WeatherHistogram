export function openBottomSheet(sheetId, backdropId = 'pill-sheet-backdrop') {
    const sheet = document.getElementById(sheetId);
    const backdrop = document.getElementById(backdropId);

    if (!sheet || !backdrop) return () => {};

    sheet.style.transform = '';
    sheet.classList.add('open');
    backdrop.classList.add('open');

    const closeSheet = () => {
        sheet.classList.remove('open');
        backdrop.classList.remove('open');
        sheet.style.transform = '';
    };

    backdrop.onclick = closeSheet;

    let startY = 0;
    let currentY = 0;

    let handleId = sheetId.replace('-modal', '-sheet-drag-handle');
    const handle = document.getElementById(handleId);

    if (handle) {
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
                closeSheet();
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

    return closeSheet;
}

export function initBottomSheetGlobal() {
    window.openBottomSheet = openBottomSheet;
}
