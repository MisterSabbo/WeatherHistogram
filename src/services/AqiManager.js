import { t } from '../utils/i18n.js';

export function getAQIInfo(aqi) {
    if (aqi === null) return { text: '--', rec: '' };
    let level = 1;
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

export function getPollenText(val) {
    if (val === null || val === undefined) return '--';
    if (val === 0) return t('pollenLevels.none');
    if (val <= 10) return t('pollenLevels.low');
    if (val <= 50) return t('pollenLevels.moderate');
    if (val <= 100) return t('pollenLevels.high');
    return t('pollenLevels.veryHigh');
}
