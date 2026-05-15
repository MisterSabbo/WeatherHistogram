import { state } from '../store.js';
import { getSplitIndex, getMinimapMode } from './MinimapViewport.js';

let isMinimapDragging = false;

export function handleMinimapClick(e, minimapCanvas, scrollContainer, PIXELS_PER_HOUR) {
    if (!minimapCanvas || !scrollContainer) return;

    const rect = minimapCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));

    const splitIndex = getSplitIndex();
    const minimapMode = getMinimapMode();
    const startIndex = minimapMode === 'past' ? 0 : splitIndex;
    const dataLength = minimapMode === 'past' ? splitIndex : (state.hourlyData?.length || 0) - splitIndex;

    const targetLocalIndex = ratio * dataLength;
    const targetGlobalIndex = startIndex + targetLocalIndex;

    const targetScrollX = (targetGlobalIndex * PIXELS_PER_HOUR) - (scrollContainer.clientWidth / 2);
    scrollContainer.scrollLeft = targetScrollX;
}

export function setupMinimapDrag(minimapContainer, minimapCanvas, scrollContainer, PIXELS_PER_HOUR) {
    if (!minimapContainer) return () => {};

    minimapContainer.style.touchAction = '';

    minimapContainer.addEventListener('mousedown', (e) => {
        isMinimapDragging = true;
        handleMinimapClick(e, minimapCanvas, scrollContainer, PIXELS_PER_HOUR);
    });

    minimapContainer.addEventListener('touchstart', (e) => {
        isMinimapDragging = true;
        handleMinimapClick(e.touches[0], minimapCanvas, scrollContainer, PIXELS_PER_HOUR);
    }, { passive: true });

    return () => {
        isMinimapDragging = false;
    };
}

export function handleMinimapDragMove(e, minimapCanvas, scrollContainer, PIXELS_PER_HOUR) {
    if (!isMinimapDragging) return;
    handleMinimapClick(e, minimapCanvas, scrollContainer, PIXELS_PER_HOUR);
}

export function handleMinimapDragEnd() {
    isMinimapDragging = false;
}

export function getIsMinimapDragging() {
    return isMinimapDragging;
}
