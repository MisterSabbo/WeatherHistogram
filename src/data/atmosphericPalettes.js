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
        daySky:         '#87CEEB',
        daySun:         '#FFD700',
        daySunRay:      '#FFF3B0',

        /* ── Night ───────────────────────────────────────── */
        nightFill:            '#1A2744',
        minimapNightFill:     '#f8e4ff',
        nightTransitionMid:   '#7a91c2',
        nightShadowColor:            'rgba(26, 39, 68, 0.15)',
        nightShadowColorTransparent: 'rgba(26, 39, 68, 0)',

        /* ── Clouds ──────────────────────────────────────── */
        cloudFill: {
            light:  { r: 220, g: 225, b: 240, a: 0.65 },
            medium: { r: 195, g: 205, b: 225, a: 0.75 },
            heavy:  { r: 170, g: 180, b: 210, a: 0.85 }
        },
        cloudStroke: {
            light:  { r: 200, g: 210, b: 230 },
            medium: { r: 175, g: 185, b: 210 },
            heavy:  { r: 150, g: 160, b: 190 }
        },
        cloudLayers: [
            { offset: 5,  width: 4,  color: 'rgba(220, 225, 240, 0.3)' },
            { offset: 12, width: 8,  color: 'rgba(200, 210, 230, 0.2)' },
            { offset: 25, width: 15, color: 'rgba(195, 205, 225, 0.1)' },
            { offset: 45, width: 22, color: 'rgba(170, 180, 210, 0.05)' },
            { offset: 65, width: 30, color: 'rgba(170, 180, 210, 0.03)' }
        ],

        /* ── Rain ────────────────────────────────────────── */
        rainBar:    'rgba(30, 130, 190, 0.45)',
        rainStroke: 'rgba(30, 130, 190, 0.80)',
        rainShadow: 'rgba(30, 130, 190, 0.4)',

        /* ── Snow ────────────────────────────────────────── */
        snowBar:     'rgba(200, 220, 240, 0.40)',
        snowStroke:  'rgba(200, 220, 240, 0.80)',
        snowFlake:   'rgba(150, 180, 210, 0.8)',
        snowShadow:  'rgba(210, 225, 240, 0.8)',

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
        minimapNightFill:     '#f8e4ff',
        nightTransitionMid:   '#E8D0F0',
        nightShadowColor:            'rgba(45, 27, 77, 0.15)',
        nightShadowColorTransparent: 'rgba(45, 27, 77, 0)',

        /* ── Clouds ──────────────────────────────────────── */
        cloudFill: {
            light:  { r: 220, g: 225, b: 240, a: 0.65 },
            medium: { r: 195, g: 205, b: 225, a: 0.75 },
            heavy:  { r: 170, g: 180, b: 210, a: 0.85 }
        },
        cloudStroke: {
            light:  { r: 200, g: 210, b: 230 },
            medium: { r: 175, g: 185, b: 210 },
            heavy:  { r: 150, g: 160, b: 190 }
        },
        cloudLayers: [
            { offset: 5,  width: 4,  color: 'rgba(220, 225, 240, 0.3)' },
            { offset: 12, width: 8,  color: 'rgba(200, 210, 230, 0.2)' },
            { offset: 25, width: 15, color: 'rgba(195, 205, 225, 0.1)' },
            { offset: 45, width: 22, color: 'rgba(170, 180, 210, 0.05)' },
            { offset: 65, width: 30, color: 'rgba(170, 180, 210, 0.03)' }
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

const vivid = {
    id: 'vivid',
    icon: '🌅',
    colors: {
        /* ── Sky ─────────────────────────────────────────── */
        daySky:         '#FFD699',
        daySun:         '#FFA000',
        daySunRay:      '#FFD54F',

        /* ── Night ───────────────────────────────────────── */
        nightFill:            '#1A0033',
        minimapNightFill:     '#D080F0',
        nightTransitionMid:   '#C060D0',
        nightShadowColor:            'rgba(26, 0, 51, 0.20)',
        nightShadowColorTransparent: 'rgba(26, 0, 51, 0)',

        /* ── Clouds ──────────────────────────────────────── */
        cloudFill: {
            light:  { r: 215, g: 220, b: 245, a: 0.55 },
            medium: { r: 190, g: 200, b: 230, a: 0.65 },
            heavy:  { r: 165, g: 175, b: 215, a: 0.75 }
        },
        cloudStroke: {
            light:  { r: 195, g: 205, b: 235 },
            medium: { r: 170, g: 180, b: 215 },
            heavy:  { r: 145, g: 155, b: 195 }
        },
        cloudLayers: [
            { offset: 5,  width: 4,  color: 'rgba(215, 220, 245, 0.3)' },
            { offset: 12, width: 8,  color: 'rgba(205, 210, 240, 0.2)' },
            { offset: 25, width: 15, color: 'rgba(190, 200, 230, 0.1)' },
            { offset: 45, width: 22, color: 'rgba(165, 175, 215, 0.05)' },
            { offset: 65, width: 30, color: 'rgba(165, 175, 215, 0.03)' }
        ],

        /* ── Rain ────────────────────────────────────────── */
        rainBar:    'rgba(25, 130, 210, 0.50)',
        rainStroke: 'rgba(25, 130, 210, 0.85)',
        rainShadow: 'rgba(25, 130, 210, 0.45)',

        /* ── Snow ────────────────────────────────────────── */
        snowBar:     'rgba(200, 220, 240, 0.45)',
        snowStroke:  'rgba(200, 220, 240, 0.85)',
        snowFlake:   'rgba(130, 160, 200, 0.8)',
        snowShadow:  'rgba(210, 225, 245, 0.8)',

        /* ── Thunder ─────────────────────────────────────── */
        thunderBar:       'rgba(90, 60, 170, 0.45)',
        thunderStroke:    'rgba(90, 60, 170, 0.85)',
        thunderBolt:      '#FFD600',
        thunderBoltShadow: 'rgba(255, 214, 0, 0.8)',

        /* ── Precipitation Probability ───────────────────── */
        precipProbRain:    { r: 25,  g: 130, b: 210 },
        precipProbSnow:    { r: 200, g: 220, b: 240 },
        precipProbThunder: { r: 90,  g: 60,  b: 170 }
    }
};

const pastel = {
    id: 'pastel',
    icon: '🌸',
    colors: {
        /* ── Sky ─────────────────────────────────────────── */
        daySky:         '#D4E8F8',
        daySun:         '#F9D56E',
        daySunRay:      '#FCE8B2',

        /* ── Night ───────────────────────────────────────── */
        nightFill:            '#2E2252',
        minimapNightFill:     '#f8e4ff',
        nightTransitionMid:   '#E8D4F0',
        nightShadowColor:            'rgba(46, 34, 82, 0.12)',
        nightShadowColorTransparent: 'rgba(46, 34, 82, 0)',

        /* ── Clouds ──────────────────────────────────────── */
        cloudFill: {
            light:  { r: 220, g: 225, b: 240, a: 0.65 },
            medium: { r: 195, g: 205, b: 225, a: 0.75 },
            heavy:  { r: 170, g: 180, b: 210, a: 0.85 }
        },
        cloudStroke: {
            light:  { r: 200, g: 210, b: 230 },
            medium: { r: 175, g: 185, b: 210 },
            heavy:  { r: 150, g: 160, b: 190 }
        },
        cloudLayers: [
            { offset: 5,  width: 4,  color: 'rgba(220, 225, 240, 0.3)' },
            { offset: 12, width: 8,  color: 'rgba(200, 210, 230, 0.2)' },
            { offset: 25, width: 15, color: 'rgba(195, 205, 225, 0.1)' },
            { offset: 45, width: 22, color: 'rgba(170, 180, 210, 0.05)' },
            { offset: 65, width: 30, color: 'rgba(170, 180, 210, 0.03)' }
        ],

        /* ── Rain ────────────────────────────────────────── */
        rainBar:    'rgba(130, 180, 220, 0.40)',
        rainStroke: 'rgba(130, 180, 220, 0.75)',
        rainShadow: 'rgba(130, 180, 220, 0.35)',

        /* ── Snow ────────────────────────────────────────── */
        snowBar:     'rgba(200, 215, 240, 0.40)',
        snowStroke:  'rgba(200, 215, 240, 0.75)',
        snowFlake:   'rgba(150, 170, 210, 0.7)',
        snowShadow:  'rgba(210, 220, 245, 0.7)',

        /* ── Thunder ─────────────────────────────────────── */
        thunderBar:       'rgba(100, 90, 170, 0.35)',
        thunderStroke:    'rgba(100, 90, 170, 0.70)',
        thunderBolt:      '#A78BFA',
        thunderBoltShadow: 'rgba(167, 139, 250, 0.7)',

        /* ── Precipitation Probability ───────────────────── */
        precipProbRain:    { r: 130, g: 180, b: 220 },
        precipProbSnow:    { r: 200, g: 215, b: 240 },
        precipProbThunder: { r: 100, g: 90,  b: 170 }
    }
};

export const ATMOSPHERIC_PALETTES = Object.freeze({
    classic:  Object.freeze(classic),
    original: Object.freeze(original),
    vivid:    Object.freeze(vivid),
    pastel:   Object.freeze(pastel)
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
