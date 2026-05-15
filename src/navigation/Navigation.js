import { state } from '../store.js';

export function createNavigation(deps) {
    const { scrollContainer } = deps;

    function centerOnCurrentTime(behavior = 'auto') {
        if (state.hourlyData.length === 0) return;
        const now = Date.now();
        const startTime = state.hourlyData[0].time;
        const exactX = ((now - startTime) / 3600000) * state.PIXELS_PER_HOUR;
        const targetLeft = Math.max(0, exactX - 60);
        if (behavior === 'smooth') {
            scrollContainer.scrollTo({ left: targetLeft, behavior: 'smooth' });
        } else {
            scrollContainer.scrollLeft = targetLeft;
        }
        state.hoverX = null;
        deps.render();
    }

    function updateNowButtonPosition() {
        if (state.hourlyData.length === 0) return;
        const floatBtn = document.getElementById('floating-now-btn');
        const now = Date.now();
        const startTime = state.hourlyData[0].time;
        const nowX = ((now - startTime) / 3600000) * state.PIXELS_PER_HOUR;
        const nowIndicator = document.getElementById('now-indicator');
        const pastShadow = document.getElementById('past-shadow');

        if (nowIndicator && pastShadow) {
            if (nowX > 0) {
                nowIndicator.style.display = 'block';
                nowIndicator.style.left = nowX + 'px';
                pastShadow.style.width = nowX + 'px';
                const shadeAlpha = state.theme === 'dark' ? 0.5 : 0.15;
                pastShadow.style.background = `linear-gradient(to right, rgba(0,0,0,${shadeAlpha}) 0%, rgba(0,0,0,${shadeAlpha}) calc(100% - 150px), rgba(0,0,0,0) 100%)`;
            } else {
                nowIndicator.style.display = 'none';
                pastShadow.style.width = '0px';
            }
        }

        if (!floatBtn) return;
        const viewportX = nowX - scrollContainer.scrollLeft;
        const viewportWidth = scrollContainer.clientWidth;
        if (viewportX < 0 || viewportX > viewportWidth) {
            floatBtn.style.display = 'flex';
            if (viewportX < 0) {
                floatBtn.style.left = '20px';
                floatBtn.style.right = 'auto';
                floatBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px;">chevron_left</span>';
            } else {
                floatBtn.style.left = 'auto';
                floatBtn.style.right = '20px';
                floatBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px;">chevron_right</span>';
            }
        } else {
            floatBtn.style.display = 'none';
        }
    }

    return { centerOnCurrentTime, updateNowButtonPosition };
}
