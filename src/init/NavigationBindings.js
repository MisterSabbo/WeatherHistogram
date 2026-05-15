import { state } from '../store.js';
import { storageService } from '../services/StorageService.js';

export function initNavigationBindings({
    centerOnCurrentTime,
    generateDailyCards,
    updateActiveDailyCard,
    drawMinimap,
    updateMinimapViewport,
    setMinimapMode,
    updateNowButtonPosition,
    getIsMinimapDragging,
    toggleNavBtn,
    floatingNowBtn,
    minimapContainer,
    dailyCardsContainer,
    minimapCanvas,
    minimapCtx,
    scrollContainer,
    minimapViewport,
    PIXELS_PER_HOUR
}) {
    if (floatingNowBtn) floatingNowBtn.addEventListener('click', centerOnCurrentTime);

    setupViewToggle({
        generateDailyCards,
        updateActiveDailyCard,
        centerOnCurrentTime,
        drawMinimap,
        updateMinimapViewport,
        setMinimapMode,
        updateNowButtonPosition,
        getIsMinimapDragging,
        toggleNavBtn,
        minimapContainer,
        dailyCardsContainer,
        minimapCanvas,
        minimapCtx,
        scrollContainer,
        minimapViewport,
        PIXELS_PER_HOUR
    });

    setupDailyCardsDrag(dailyCardsContainer);
}

function setupViewToggle({
    generateDailyCards, updateActiveDailyCard, centerOnCurrentTime,
    drawMinimap, updateMinimapViewport, setMinimapMode, updateNowButtonPosition,
    getIsMinimapDragging, toggleNavBtn, minimapContainer, dailyCardsContainer,
    minimapCanvas, minimapCtx, scrollContainer, minimapViewport, PIXELS_PER_HOUR
}) {
    if (!toggleNavBtn) return;

    const updateViewMode = () => {
        const toggle = document.getElementById('minimap-toggle');
        if (state.isDailyCardsView) {
            minimapContainer.style.display = 'none';
            if (toggle) toggle.style.display = 'none';
            dailyCardsContainer.style.display = 'flex';
            toggleNavBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px;">insights</span>';
            if (state.dailyData && state.dailyData.length > 0) {
                generateDailyCards(centerOnCurrentTime);
                updateActiveDailyCard();
            }
        } else {
            minimapContainer.style.display = 'block';
            if (toggle) toggle.style.display = 'flex';
            dailyCardsContainer.style.display = 'none';
            toggleNavBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px;">calendar_month</span>';
            drawMinimap(minimapCanvas, minimapCtx);
            updateMinimapViewport(scrollContainer, minimapCanvas, minimapViewport, setMinimapMode, updateNowButtonPosition, getIsMinimapDragging(), PIXELS_PER_HOUR);
        }
        storageService.set('viewMode', state.isDailyCardsView ? 'daily' : 'minimap');
    };

    toggleNavBtn.addEventListener('click', () => {
        state.isDailyCardsView = !state.isDailyCardsView;
        updateViewMode();
    });
    updateViewMode();
}

function setupDailyCardsDrag(dailyCardsContainer) {
    if (!dailyCardsContainer) return;

    let isDailyDragging = false;
    let dailyStartX;
    let dailyScrollLeft;

    dailyCardsContainer.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'mouse') return;
        isDailyDragging = true;
        dailyStartX = e.pageX - dailyCardsContainer.offsetLeft;
        dailyScrollLeft = dailyCardsContainer.scrollLeft;
        dailyCardsContainer.style.cursor = 'grabbing';
    });

    window.addEventListener('pointermove', (e) => {
        if (!isDailyDragging) return;
        e.preventDefault();
        const x = e.pageX - dailyCardsContainer.offsetLeft;
        const walk = (x - dailyStartX) * 2;
        dailyCardsContainer.scrollLeft = dailyScrollLeft - walk;
    });

    window.addEventListener('pointerup', () => {
        isDailyDragging = false;
        dailyCardsContainer.style.cursor = 'pointer';
    });
}
