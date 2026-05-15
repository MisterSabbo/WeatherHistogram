export function openChangelogDetail(item) {
    const sheet = document.getElementById('changelog-detail-sheet');
    const backdrop = document.getElementById('changelog-sheet-backdrop');

    document.getElementById('changelog-detail-title').textContent = `v${item.version}`;
    document.getElementById('changelog-detail-subtitle').textContent = 'Detalles de esta versión';

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
    const handle = document.getElementById('changelog-detail-sheet-drag-handle');

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
        handle.removeEventListener('touchstart', onTouchStart);
        handle.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
    };

    const clone = handle.cloneNode(true);
    handle.parentNode.replaceChild(clone, handle);
    clone.addEventListener('touchstart', onTouchStart, { passive: true });
    clone.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
}
