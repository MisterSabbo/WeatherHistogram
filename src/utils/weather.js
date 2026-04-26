import { t } from './i18n.js';

export function getWeatherDescription(code) {
    return t('weatherCodes.' + code) || t('weatherCodes.unknown');
}
