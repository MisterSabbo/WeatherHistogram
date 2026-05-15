import { state } from '../store.js';
import { storageService } from '../services/StorageService.js';
import { setLanguage, getLanguage, applyTranslations, t } from '../utils/i18n.js';
import { processData } from '../services/DataProcessor.js';
import { generateDailyCards } from '../ui/DailyCards.js';
import { invalidateMinimapCache } from '../render/MinimapRenderer.js';
import { updateTopPanel } from '../render/TopPanelUpdater.js';

export function initSettingsBindings({ drawFixedOverlay, render, drawMinimap, minimapCanvas, minimapCtx, tiles, scrollContainer, PIXELS_PER_HOUR }) {
    setupLanguageCards(render, drawMinimap, minimapCanvas, minimapCtx, tiles, scrollContainer, PIXELS_PER_HOUR);
    setupStickmanInputs(drawFixedOverlay, render);
    setupConfirmModal();
}

function setupLanguageCards(render, drawMinimap, minimapCanvas, minimapCtx, tiles, scrollContainer, PIXELS_PER_HOUR) {
    const langCards = document.querySelectorAll('.lang-card');
    const updateLangCardsUI = (lang) => {
        langCards.forEach(card => {
            if (card.dataset.value === lang) {
                card.style.borderColor = '#3b82f6';
                card.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
            } else {
                card.style.borderColor = 'var(--grid-color)';
                card.style.backgroundColor = 'var(--card-bg)';
            }
        });
    };

    if (langCards.length > 0) {
        updateLangCardsUI(getLanguage());
        langCards.forEach(card => {
            card.addEventListener('click', () => {
                const newLang = card.dataset.value;
                setLanguage(newLang);
                updateLangCardsUI(newLang);
                applyTranslations();
                if (state.rawForecast && state.rawAQI) {
                    processData(state.rawForecast, state.rawAQI, false);
                    updateTopPanel(scrollContainer, PIXELS_PER_HOUR);
                    generateDailyCards();
                }
                requestAnimationFrame(() => {
                    tiles.forEach(t => t.drawn = false);
                    invalidateMinimapCache();
                    render();
                    drawMinimap(minimapCanvas, minimapCtx);
                });
            });
        });
    }
    applyTranslations();
}

function setupStickmanInputs(drawFixedOverlay, render) {
    const stickmanColdInput = document.getElementById('stickman-cold-input');
    const stickmanHotInput = document.getElementById('stickman-hot-input');
    const stickmanWindInput = document.getElementById('stickman-wind-input');
    const stickmanCloudsInput = document.getElementById('stickman-clouds-input');

    if (stickmanColdInput) {
        stickmanColdInput.value = state.stickmanThresholds.cold;
        stickmanColdInput.addEventListener('change', (e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val)) {
                state.stickmanThresholds.cold = val;
                storageService.set('stickmanThresholds', state.stickmanThresholds);
                drawFixedOverlay();
            }
        });
    }

    if (stickmanHotInput) {
        stickmanHotInput.value = state.stickmanThresholds.hot;
        stickmanHotInput.addEventListener('change', (e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val)) {
                state.stickmanThresholds.hot = val;
                storageService.set('stickmanThresholds', state.stickmanThresholds);
                drawFixedOverlay();
            }
        });
    }

    if (stickmanWindInput) {
        stickmanWindInput.value = state.stickmanThresholds.wind;
        stickmanWindInput.addEventListener('change', (e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val)) {
                state.stickmanThresholds.wind = val;
                storageService.set('stickmanThresholds', state.stickmanThresholds);
                drawFixedOverlay();
                render();
            }
        });
    }

    if (stickmanCloudsInput) {
        stickmanCloudsInput.value = state.stickmanThresholds.clouds;
        stickmanCloudsInput.addEventListener('change', (e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val)) {
                state.stickmanThresholds.clouds = val;
                storageService.set('stickmanThresholds', state.stickmanThresholds);
                drawFixedOverlay();
            }
        });
    }
}

export function showConfirm(title, message, onOk) {
    const titleEl = document.getElementById('confirm-title');
    const msgEl = document.getElementById('confirm-message');
    const cancelBtn = document.getElementById('confirm-cancel-btn');
    const okBtn = document.getElementById('confirm-ok-btn');

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;

    if (cancelBtn) cancelBtn.textContent = t('config.cancel') || 'Cancelar';
    if (okBtn) okBtn.textContent = t('config.accept') || 'Aceptar';

    const newOk = okBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOk, okBtn);
    const newCancel = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

    const closeFn = window.openBottomSheet ? window.openBottomSheet('confirm-modal', 'confirm-sheet-backdrop') : () => {};

    newCancel.addEventListener('click', () => {
        closeFn();
    });

    newOk.addEventListener('click', () => {
        closeFn();
        onOk();
    });
}
