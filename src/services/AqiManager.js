import { t } from '../utils/i18n.js';

export function getAQIInfo(aqi) {
    if (aqi === null) return { text: '--', rec: '' };
    let level = 1;
    if (aqi <= 6) {
        level = aqi;
    } else {
        if (aqi <= 20) level = 1;
        else if (aqi <= 40) level = 2;
        else if (aqi <= 60) level = 3;
        else if (aqi <= 80) level = 4;
        else if (aqi <= 100) level = 5;
        else level = 6;
    }

    return {
        text: t(`aqiLevel.${level}.t`) || t('weatherCodes.unknown'),
        rec: t(`aqiLevel.${level}.r`) || '',
        val: aqi
    };
}

export function getPollenText(val) {
    if (val === null || val === undefined) return '--';
    if (val < 1) return t('pollenLevels.none');
    if (val < 15) return t('pollenLevels.low');
    if (val < 50) return t('pollenLevels.moderate');
    return t('pollenLevels.high');
}
