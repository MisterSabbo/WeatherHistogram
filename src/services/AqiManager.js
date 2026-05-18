import { t } from '../utils/i18n.js';

export function getAQIInfo(aqi) {
    if (aqi === null) return { text: '--', rec: '' };
    let level;
    if (aqi <= 50) level = 1;         // Buena
    else if (aqi <= 100) level = 2;   // Moderada
    else if (aqi <= 150) level = 3;   // Dañina para sensibles
    else if (aqi <= 200) level = 4;   // Dañina
    else if (aqi <= 300) level = 5;   // Muy dañina
    else level = 6;                   // Peligrosa

    return {
        text: t(`aqiLevel.${level}.t`) || t('weatherCodes.unknown'),
        rec: t(`aqiLevel.${level}.r`) || '',
        val: aqi
    };
}

const POLLEN_THRESHOLDS = {
    alder: [15, 75, 250],
    birch: [15, 80, 300],
    grass: [10, 50, 250],
    mugwort: [10, 50, 150],
    olive: [50, 200, 500],
    ragweed: [10, 50, 150]
};

export function getPollenLevelByType(type, raw) {
    if (!raw || raw <= 0) return 0;
    const t = POLLEN_THRESHOLDS[type];
    if (!t) return raw > 0 ? 1 : 0;
    if (raw < t[0]) return 1;
    if (raw < t[1]) return 2;
    if (raw < t[2]) return 3;
    return 4;
}

export function getAggregatedPollenLevel(pollenDetails) {
    if (!pollenDetails) return 0;
    let maxLevel = 0;
    Object.keys(POLLEN_THRESHOLDS).forEach(s => {
        const level = getPollenLevelByType(s, pollenDetails[s] || 0);
        if (level > maxLevel) maxLevel = level;
    });
    return maxLevel;
}

export function getPollenText(val, pollenDetails) {
    if (pollenDetails) {
        const level = getAggregatedPollenLevel(pollenDetails);
        if (level === 0) return t('pollenLevels.none');
        if (level <= 1) return t('pollenLevels.low');
        if (level <= 2) return t('pollenLevels.moderate');
        if (level <= 3) return t('pollenLevels.high');
        return t('pollenLevels.veryHigh');
    }
    if (val === null || val === undefined) return '--';
    if (val === 0) return t('pollenLevels.none');
    if (val <= 10) return t('pollenLevels.low');
    if (val <= 50) return t('pollenLevels.moderate');
    if (val <= 100) return t('pollenLevels.high');
    return t('pollenLevels.veryHigh');
}
