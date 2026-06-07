import { state } from '../store.js';
import { storageService } from '../services/StorageService.js';
import { t } from '../utils/i18n.js';
import { openBottomSheet, closeBottomSheet } from '../ui/BottomSheet.js';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ATMOSPHERIC COLOR PALETTES
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Each palette defines colors for every atmospheric element in the chart.
 * To adjust a color, simply edit the corresponding value below.
 *
 * Color formats used:
 *   - Hex strings ('#RRGGBB') for solid fills (sky, sun, thunder bolt)
 *   - RGBA strings ('rgba(r,g,b,a)') for semi-transparent overlays (bars, strokes)
 *   - RGB objects ({ r, g, b, a? }) for computed fills where alpha is applied dynamically
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const classic = {
    id: 'classic',
    icon: '☀️',
    colors: {
        /* ── Sky ─────────────────────────────────────────── */
        daySky:         '#fff2c0',
        daySun:         '#FDD835',
        daySunRay:      '#FFF59D',

        /* ── Night ───────────────────────────────────────── */
        nightFill:            '#1A2744',
        nightTransitionMid:   '#FFDDBA',
        nightShadowColor:            'rgba(26, 39, 68, 0.15)',
        nightShadowColorTransparent: 'rgba(26, 39, 68, 0)',

        /* ── Clouds ──────────────────────────────────────── */
        cloudFill: {
            light:  { r: 185, g: 180, b: 175, a: 0.40 },
            medium: { r: 155, g: 150, b: 145, a: 0.50 },
            heavy:  { r: 125, g: 120, b: 115, a: 0.60 }
        },
        cloudStroke: {
            light:  { r: 170, g: 165, b: 160 },
            medium: { r: 145, g: 140, b: 135 },
            heavy:  { r: 115, g: 110, b: 105 }
        },
        cloudLayers: [
            { offset: 5,  width: 4,  color: 'rgba(195, 188, 182, 0.3)' },
            { offset: 12, width: 8,  color: 'rgba(185, 180, 175, 0.2)' },
            { offset: 25, width: 15, color: 'rgba(155, 150, 145, 0.1)' },
            { offset: 45, width: 22, color: 'rgba(125, 120, 115, 0.05)' },
            { offset: 65, width: 30, color: 'rgba(125, 120, 115, 0.03)' }
        ],

        /* ── Rain ────────────────────────────────────────── */
        rainBar:    'rgba(30, 130, 190, 0.45)',
        rainStroke: 'rgba(30, 130, 190, 0.80)',
        rainShadow: 'rgba(30, 130, 190, 0.4)',

        /* ── Snow ────────────────────────────────────────── */
        snowBar:     'rgba(180, 200, 220, 0.40)',
        snowStroke:  'rgba(180, 200, 220, 0.80)',
        snowFlake:   'rgba(100, 130, 160, 0.8)',
        snowShadow:  'rgba(200, 215, 230, 0.8)',

        /* ── Thunder ─────────────────────────────────────── */
        thunderBar:       'rgba(80, 70, 150, 0.40)',
        thunderStroke:    'rgba(80, 70, 150, 0.80)',
        thunderBolt:      '#FDE047',
        thunderBoltShadow: 'rgba(253, 224, 71, 0.8)',

        /* ── Precipitation Probability ───────────────────── */
        precipProbRain:    { r: 30,  g: 144, b: 200 },
        precipProbSnow:    { r: 200, g: 215, b: 230 },
        precipProbThunder: { r: 100, g: 80,  b: 160 }
    }
};

const original = {
    id: 'original',
    icon: '🌤️',
    colors: {
        /* ── Sky ─────────────────────────────────────────── */
        daySky:         '#fff9ee',
        daySun:         '#FDD835',
        daySunRay:      '#FFF59D',

        /* ── Night ───────────────────────────────────────── */
        nightFill:            '#2D1B4D',
        nightTransitionMid:   '#E8D0F0',
        nightShadowColor:            'rgba(45, 27, 77, 0.15)',
        nightShadowColorTransparent: 'rgba(45, 27, 77, 0)',

        /* ── Clouds ──────────────────────────────────────── */
        cloudFill: {
            light:  { r: 185, g: 180, b: 175, a: 0.40 },
            medium: { r: 155, g: 150, b: 145, a: 0.50 },
            heavy:  { r: 125, g: 120, b: 115, a: 0.60 }
        },
        cloudStroke: {
            light:  { r: 170, g: 165, b: 160 },
            medium: { r: 145, g: 140, b: 135 },
            heavy:  { r: 115, g: 110, b: 105 }
        },
        cloudLayers: [
            { offset: 5,  width: 4,  color: 'rgba(195, 188, 182, 0.3)' },
            { offset: 12, width: 8,  color: 'rgba(185, 180, 175, 0.2)' },
            { offset: 25, width: 15, color: 'rgba(155, 150, 145, 0.1)' },
            { offset: 45, width: 22, color: 'rgba(125, 120, 115, 0.05)' },
            { offset: 65, width: 30, color: 'rgba(125, 120, 115, 0.03)' }
        ],

        /* ── Rain ────────────────────────────────────────── */
        rainBar:    'rgba(30, 130, 190, 0.45)',
        rainStroke: 'rgba(30, 130, 190, 0.80)',
        rainShadow: 'rgba(30, 130, 190, 0.4)',

        /* ── Snow ────────────────────────────────────────── */
        snowBar:     'rgba(180, 200, 220, 0.40)',
        snowStroke:  'rgba(180, 200, 220, 0.80)',
        snowFlake:   'rgba(100, 130, 160, 0.8)',
        snowShadow:  'rgba(200, 215, 230, 0.8)',

        /* ── Thunder ─────────────────────────────────────── */
        thunderBar:       'rgba(80, 70, 150, 0.40)',
        thunderStroke:    'rgba(80, 70, 150, 0.80)',
        thunderBolt:      '#FDE047',
        thunderBoltShadow: 'rgba(253, 224, 71, 0.8)',

        /* ── Precipitation Probability ───────────────────── */
        precipProbRain:    { r: 30,  g: 144, b: 200 },
        precipProbSnow:    { r: 200, g: 215, b: 230 },
        precipProbThunder: { r: 100, g: 80,  b: 160 }
    }
};

const warm = {
    id: 'warm',
    icon: '🌅',
    colors: {
        /* ── Sky ─────────────────────────────────────────── */
        daySky:         '#FFE0A0',
        daySun:         '#FF8F00',
        daySunRay:      '#FFB74D',

        /* ── Night ───────────────────────────────────────── */
        nightFill:            '#2D1B3D',
        nightTransitionMid:   '#FFB088',
        nightShadowColor:            'rgba(45, 27, 61, 0.18)',
        nightShadowColorTransparent: 'rgba(45, 27, 61, 0)',

        /* ── Clouds ──────────────────────────────────────── */
        cloudFill: {
            light:  { r: 210, g: 185, b: 165, a: 0.40 },
            medium: { r: 180, g: 155, b: 135, a: 0.50 },
            heavy:  { r: 150, g: 125, b: 105, a: 0.60 }
        },
        cloudStroke: {
            light:  { r: 195, g: 170, b: 150 },
            medium: { r: 165, g: 140, b: 120 },
            heavy:  { r: 135, g: 110, b: 90 }
        },
        cloudLayers: [
            { offset: 5,  width: 4,  color: 'rgba(210, 185, 165, 0.3)' },
            { offset: 12, width: 8,  color: 'rgba(195, 170, 150, 0.2)' },
            { offset: 25, width: 15, color: 'rgba(180, 155, 135, 0.1)' },
            { offset: 45, width: 22, color: 'rgba(150, 125, 105, 0.05)' },
            { offset: 65, width: 30, color: 'rgba(150, 125, 105, 0.03)' }
        ],

        /* ── Rain ────────────────────────────────────────── */
        rainBar:    'rgba(25, 118, 170, 0.45)',
        rainStroke: 'rgba(25, 118, 170, 0.80)',
        rainShadow: 'rgba(25, 118, 170, 0.4)',

        /* ── Snow ────────────────────────────────────────── */
        snowBar:     'rgba(220, 200, 180, 0.40)',
        snowStroke:  'rgba(220, 200, 180, 0.80)',
        snowFlake:   'rgba(180, 150, 120, 0.8)',
        snowShadow:  'rgba(235, 220, 200, 0.8)',

        /* ── Thunder ─────────────────────────────────────── */
        thunderBar:       'rgba(130, 50, 30, 0.40)',
        thunderStroke:    'rgba(130, 50, 30, 0.80)',
        thunderBolt:      '#FFB300',
        thunderBoltShadow: 'rgba(255, 179, 0, 0.8)',

        /* ── Precipitation Probability ───────────────────── */
        precipProbRain:    { r: 25,  g: 118, b: 170 },
        precipProbSnow:    { r: 220, g: 200, b: 180 },
        precipProbThunder: { r: 130, g: 50,  b: 30 }
    }
};

const cold = {
    id: 'cold',
    icon: '❄️',
    colors: {
        /* ── Sky ─────────────────────────────────────────── */
        daySky:         '#D6ECFF',
        daySun:         '#90CAF9',
        daySunRay:      '#BBDEFB',

        /* ── Night ───────────────────────────────────────── */
        nightFill:            '#0D1B3E',
        nightTransitionMid:   '#B3CCE6',
        nightShadowColor:            'rgba(13, 27, 62, 0.20)',
        nightShadowColorTransparent: 'rgba(13, 27, 62, 0)',

        /* ── Clouds ──────────────────────────────────────── */
        cloudFill: {
            light:  { r: 170, g: 195, b: 215, a: 0.40 },
            medium: { r: 140, g: 170, b: 195, a: 0.50 },
            heavy:  { r: 110, g: 145, b: 175, a: 0.60 }
        },
        cloudStroke: {
            light:  { r: 155, g: 180, b: 200 },
            medium: { r: 125, g: 155, b: 180 },
            heavy:  { r: 95,  g: 130, b: 160 }
        },
        cloudLayers: [
            { offset: 5,  width: 4,  color: 'rgba(170, 195, 215, 0.3)' },
            { offset: 12, width: 8,  color: 'rgba(155, 180, 200, 0.2)' },
            { offset: 25, width: 15, color: 'rgba(140, 170, 195, 0.1)' },
            { offset: 45, width: 22, color: 'rgba(110, 145, 175, 0.05)' },
            { offset: 65, width: 30, color: 'rgba(110, 145, 175, 0.03)' }
        ],

        /* ── Rain ────────────────────────────────────────── */
        rainBar:    'rgba(0, 150, 210, 0.45)',
        rainStroke: 'rgba(0, 150, 210, 0.80)',
        rainShadow: 'rgba(0, 150, 210, 0.4)',

        /* ── Snow ────────────────────────────────────────── */
        snowBar:     'rgba(180, 210, 240, 0.40)',
        snowStroke:  'rgba(180, 210, 240, 0.80)',
        snowFlake:   'rgba(120, 160, 200, 0.8)',
        snowShadow:  'rgba(200, 225, 250, 0.8)',

        /* ── Thunder ─────────────────────────────────────── */
        thunderBar:       'rgba(60, 40, 140, 0.40)',
        thunderStroke:    'rgba(60, 40, 140, 0.80)',
        thunderBolt:      '#80D8FF',
        thunderBoltShadow: 'rgba(128, 216, 255, 0.8)',

        /* ── Precipitation Probability ───────────────────── */
        precipProbRain:    { r: 0,   g: 150, b: 210 },
        precipProbSnow:    { r: 180, g: 210, b: 240 },
        precipProbThunder: { r: 60,  g: 40,  b: 140 }
    }
};

export const ATMOSPHERIC_PALETTES = Object.freeze({
    classic:  Object.freeze(classic),
    original: Object.freeze(original),
    warm:     Object.freeze(warm),
    cold:     Object.freeze(cold)
});

/**
 * Returns the current color value for the given atmospheric element key
 * from the active palette. Falls back to classic if key not found.
 *
 * @param {string} key - Dot-notation path, e.g. 'rainBar' or 'cloudFill.light'
 * @returns {string|object} The color value
 */
export function getAtmosphericColor(key) {
    const paletteId = state.activeAtmosphericPalette || 'classic';
    const palette = ATMOSPHERIC_PALETTES[paletteId] || ATMOSPHERIC_PALETTES.classic;
    const keys = key.split('.');
    let value = palette.colors;
    for (const k of keys) {
        if (value && value[k] !== undefined) {
            value = value[k];
        } else {
            return getAtmosphericColorFallback(key);
        }
    }
    return value;
}

function getAtmosphericColorFallback(key) {
    const keys = key.split('.');
    let value = ATMOSPHERIC_PALETTES.classic.colors;
    for (const k of keys) {
        if (value && value[k] !== undefined) {
            value = value[k];
        } else {
            return '';
        }
    }
    return value;
}

/**
 * Initializes the palette selector UI in the settings panel.
 *
 * @param {object} deps - Dependencies injected from app.js
 * @param {function} deps.onPaletteChange - Called when user selects a new palette
 */
export function initAtmosphericPaletteSelector(deps) {
    const { onPaletteChange } = deps || {};
    const trigger = document.getElementById('atmo-palette-select-trigger');
    const currentLabel = document.getElementById('atmo-palette-current-label');
    const currentSwatch = document.getElementById('atmo-palette-current-swatch');
    const optionsContainer = document.getElementById('atmo-palette-options-container');

    if (!trigger || !optionsContainer) return;

    const updateUI = (paletteId) => {
        const palette = ATMOSPHERIC_PALETTES[paletteId] || ATMOSPHERIC_PALETTES.classic;
        if (currentLabel) currentLabel.textContent = t(`config.atmoPalette${paletteId.charAt(0).toUpperCase() + paletteId.slice(1)}`, paletteId);
        if (currentSwatch) {
            const c = palette.colors;
            currentSwatch.style.background = `linear-gradient(90deg, ${c.daySky} 0%, ${c.rainBar} 33%, ${c.snowBar} 66%, ${c.nightFill} 100%)`;
        }
        optionsContainer.querySelectorAll('.theme-option').forEach(el => {
            el.classList.toggle('active', /** @type {HTMLElement} */ (el).dataset.value === paletteId);
        });
    };

    const buildOptions = () => {
        optionsContainer.innerHTML = '';
        Object.values(ATMOSPHERIC_PALETTES).forEach(palette => {
            const div = document.createElement('div');
            div.className = 'theme-option';
            div.dataset.value = palette.id;

            const swatch = document.createElement('div');
            swatch.className = 'theme-option-swatch';
            const c = palette.colors;
            swatch.style.background = `linear-gradient(90deg, ${c.daySky} 0%, ${c.rainBar} 33%, ${c.snowBar} 66%, ${c.nightFill} 100%)`;

            const name = document.createElement('span');
            name.className = 'theme-option-name';
            name.textContent = t(`config.atmoPalette${palette.id.charAt(0).toUpperCase() + palette.id.slice(1)}`, palette.id);

            const check = document.createElement('span');
            check.className = 'material-symbols-outlined theme-option-check';
            check.textContent = 'check';

            div.appendChild(swatch);
            div.appendChild(name);
            div.appendChild(check);

            if (palette.id === state.activeAtmosphericPalette) {
                div.classList.add('active');
            }

            div.addEventListener('click', () => {
                state.activeAtmosphericPalette = palette.id;
                storageService.set('atmosphericPalette', palette.id);
                updateUI(palette.id);
                if (onPaletteChange) onPaletteChange();
                closeBottomSheet('atmo-palette-select-sheet', 'atmo-palette-sheet-backdrop');
            });

            optionsContainer.appendChild(div);
        });
    };

    trigger.addEventListener('click', () => {
        buildOptions();
        openBottomSheet('atmo-palette-select-sheet', 'atmo-palette-sheet-backdrop', 'atmo-palette-options-container');
    });

    updateUI(state.activeAtmosphericPalette);
}
