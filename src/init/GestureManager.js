import { initPullToRefresh } from './PullToRefresh.js';

export function initGestures(options) {
    initPullToRefresh(options);
    blockPinchZoom();
    blockGestureStart();
}

function blockPinchZoom() {
    document.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) e.preventDefault();
    }, { passive: false });
}

function blockGestureStart() {
    document.addEventListener('gesturestart', (e) => {
        e.preventDefault();
    }, { passive: false });
}
