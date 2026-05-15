import { state } from '../store.js';
import { t } from '../utils/i18n.js';
import { openBottomSheet } from '../ui/BottomSheet.js';

export function initModalWiring() {
    setupSPFModal();
    setupPollenModal();
    setupAQIModal();
    setupInfoModal();
}

function setupSPFModal() {
    const spfInfoContainer = document.getElementById('spf-info-container');
    const spfModal = document.getElementById('spf-modal');
    const spfSettingsBtn = document.getElementById('spf-settings-btn');
    const infoModal = document.getElementById('info-modal');

    if (spfInfoContainer && spfModal) {
        spfInfoContainer.addEventListener('click', () => {
            const uv = parseFloat(spfInfoContainer.dataset.uv || 0);

            const elUviBox = document.getElementById('spf-modal-uvi-box');
            const elUviTitle = document.getElementById('spf-modal-uvi-title');
            const elUviDesc = document.getElementById('spf-modal-uvi-desc');

            elUviBox.innerText = uv.toFixed(1);

            let riskStr = '';
            let riskDesc = '';
            let riskColor = '';

            if (uv < 3) {
                riskStr = 'Bajo'; riskDesc = t('config.spfModalRiskLow'); riskColor = '#22c55e';
            } else if (uv < 6) {
                riskStr = 'Moderado'; riskDesc = t('config.spfModalRiskMod'); riskColor = '#eab308';
            } else if (uv < 8) {
                riskStr = 'Alto'; riskDesc = t('config.spfModalRiskHigh'); riskColor = '#f97316';
            } else if (uv < 11) {
                riskStr = 'Muy Alto'; riskDesc = t('config.spfModalRiskVHigh'); riskColor = '#ef4444';
            } else {
                riskStr = 'Extremo'; riskDesc = t('config.spfModalRiskExt'); riskColor = '#a855f7';
            }

            elUviBox.style.backgroundColor = riskColor;
            elUviTitle.style.color = riskColor;
            elUviTitle.innerText = `${t('config.spfModalTitleUVI')}: ${riskStr}`;
            elUviDesc.innerText = riskDesc;

            const skinTypes = ['I', 'II', 'III', 'IV', 'V', 'VI'];
            const skinBaseMins = [67, 100, 200, 300, 400, 600];
            const sType = state.skinType || 2;

            const timeToBurn = uv > 0 ? Math.round(skinBaseMins[sType - 1] / uv) : 0;
            document.getElementById('spf-modal-time-val').innerText = timeToBurn > 0 ? (timeToBurn > 120 ? '> 120' : timeToBurn) : '--';
            document.getElementById('spf-modal-time-desc').innerText = `${t('config.spfModalTimeNone')} ${skinTypes[sType - 1] || 'II'}`;

            let spfText = 'SPF 15';
            if (uv >= 8) spfText = 'SPF 50+';
            else if (uv >= 6) spfText = 'SPF 50';
            else if (uv >= 3) spfText = 'SPF 30+';
            else if (uv > 0 && sType <= 2) spfText = 'SPF 15';
            else spfText = '--';

            document.getElementById('spf-modal-rec-val').innerText = spfText;
            document.getElementById('spf-modal-rec-desc').innerText = t('config.spfModalReapply');

            openBottomSheet('spf-modal');
        });

        if (spfSettingsBtn) {
            spfSettingsBtn.addEventListener('click', () => {
                spfModal.classList.remove('open');
                const backdrop = document.getElementById('pill-sheet-backdrop');
                if (backdrop) backdrop.classList.remove('open');
                if (infoModal) infoModal.style.display = 'flex';
            });
        }
    }
}

function setupPollenModal() {
    const pollenWarningIcon = document.getElementById('pollen-warning-icon');
    const pollenModal = document.getElementById('pollen-modal');

    if (pollenWarningIcon && pollenModal) {
        pollenWarningIcon.addEventListener('click', () => {
            openBottomSheet('pollen-modal');
        });
    }
}

function setupAQIModal() {
    const aqiWarningIcon = document.getElementById('aqi-warning-icon');
    const aqiModal = document.getElementById('aqi-modal');

    if (aqiWarningIcon && aqiModal) {
        aqiWarningIcon.addEventListener('click', () => {
            openBottomSheet('aqi-modal');
        });
    }
}

function setupInfoModal() {
    const btnInfo = document.getElementById('btn-info');
    const infoModal = document.getElementById('info-modal');
    const closeInfoBtn = document.getElementById('close-info-btn');

    if (btnInfo && infoModal) {
        btnInfo.addEventListener('click', () => infoModal.style.display = 'flex');
        if (closeInfoBtn) {
            closeInfoBtn.addEventListener('click', () => infoModal.style.display = 'none');
        }
        infoModal.addEventListener('click', (e) => {
            if (e.target === infoModal) infoModal.style.display = 'none';
        });
    }
}
