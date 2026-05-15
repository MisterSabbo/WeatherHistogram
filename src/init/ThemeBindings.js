import { state } from '../store.js';
import { storageService } from '../services/StorageService.js';
import { loadChartTheme } from '../theme.js';
import { invalidateMinimapCache } from '../render/MinimapRenderer.js';

export function initThemeBindings({ toggleTheme, themeToggle, render, tiles }) {
    themeToggle.addEventListener('click', toggleTheme);
    setupChartThemeSelect(render, tiles);
    setupSkinCards(render);
}

function setupChartThemeSelect(render, tiles) {
    const chartThemeSelect = document.getElementById('chart-theme-select');
    if (!chartThemeSelect) return;

    const themeIds = ['default', 'neon', 'pastel'];
    Promise.all(themeIds.map(id =>
        fetch(`public/themes/${id}.json`).catch(() => fetch(`themes/${id}.json`)).then(r => r.json())
    )).then(themes => {
        chartThemeSelect.innerHTML = '';
        themes.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.innerText = t.name;
            chartThemeSelect.appendChild(opt);
        });
        chartThemeSelect.value = state.activeChartTheme;
    });

    chartThemeSelect.value = state.activeChartTheme;
    chartThemeSelect.addEventListener('change', async (e) => {
        state.activeChartTheme = e.target.value;
        storageService.set('chartTheme', state.activeChartTheme);
        await loadChartTheme(state.activeChartTheme);
        tiles.forEach(t => t.drawn = false);
        invalidateMinimapCache();
        render();
    });
}

function setupSkinCards(render) {
    const skinCards = document.querySelectorAll('.skin-card');
    if (!skinCards.length) return;

    const updateActiveCard = () => {
        const activeVal = state.skinType || 2;
        skinCards.forEach(card => {
            if (parseInt(card.dataset.value) === activeVal) {
                card.style.borderColor = '#3b82f6';
                card.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
            } else {
                card.style.borderColor = 'var(--grid-color)';
                card.style.backgroundColor = 'var(--card-bg)';
            }
        });
    };

    updateActiveCard();
    skinCards.forEach(card => {
        card.addEventListener('click', () => {
            const val = parseInt(card.dataset.value);
            if (!isNaN(val)) {
                state.skinType = val;
                storageService.set('skinType', val);
                updateActiveCard();
                render();
            }
        });
    });
}
