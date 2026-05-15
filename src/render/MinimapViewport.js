import { state } from '../store.js';

let minimapMode = 'future';

function getSplitIndex() {
    if (!state.hourlyData.length) return 0;
    const now = Date.now();
    const startTime = state.hourlyData[0].time;
    const index = Math.floor((now - startTime) / 3600000);
    return Math.max(0, Math.min(state.hourlyData.length, index));
}

export function getMinimapMode() {
    return minimapMode;
}

export function setMinimapMode(mode, callbacks = {}) {
    const { onModeChange, centerOnCurrentTime, scrollContainer } = callbacks;
    const hasChanged = minimapMode !== mode;
    minimapMode = mode;

    if (onModeChange && hasChanged) {
        onModeChange();
    }
}

export function updateMinimapViewport(scrollContainer, minimapCanvas, minimapViewport, setMinimapModeFn, updateNowButtonPosition, isMinimapDragging, PIXELS_PER_HOUR) {
    if (!state.hourlyData.length || !scrollContainer || !minimapCanvas || !minimapViewport) return;

    const splitIndex = getSplitIndex();
    let startIndex = minimapMode === 'past' ? 0 : splitIndex;
    let dataLength = minimapMode === 'past' ? splitIndex : state.hourlyData.length - splitIndex;
    if (dataLength <= 0) return;

    const totalMainWidth = state.hourlyData.length * PIXELS_PER_HOUR;
    const currentLeftIndex = scrollContainer.scrollLeft / PIXELS_PER_HOUR;
    const currentRightIndex = (scrollContainer.scrollLeft + scrollContainer.clientWidth) / PIXELS_PER_HOUR;
    const centerIndex = currentLeftIndex + (currentRightIndex - currentLeftIndex) / 2;

    if (!isMinimapDragging) {
        if (minimapMode === 'future' && centerIndex < splitIndex) {
            setMinimapModeFn('past');
            return;
        } else if (minimapMode === 'past' && centerIndex >= splitIndex && centerIndex < state.hourlyData.length) {
            setMinimapModeFn('future');
            return;
        }
    }

    const minimapW = minimapCanvas.clientWidth;
    const localLeftIndex = currentLeftIndex - startIndex;
    const localRightIndex = currentRightIndex - startIndex;

    const vpLeft = (localLeftIndex / dataLength) * minimapW;
    const vpWidth = ((localRightIndex - localLeftIndex) / dataLength) * minimapW;

    minimapViewport.style.width = vpWidth + 'px';
    minimapViewport.style.left = vpLeft + 'px';

    const mContainer = document.getElementById('minimap-container');
    if (mContainer && minimapW > mContainer.clientWidth) {
        const vpCenter = vpLeft + (vpWidth / 2);
        mContainer.scrollLeft = vpCenter - (mContainer.clientWidth / 2);
    }

    updateNowButtonPosition();
}

export { getSplitIndex };
