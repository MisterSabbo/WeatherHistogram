import { es } from './i18n-es.js';
import { en } from './i18n-en.js';

export const translations = { es, en };

let currentLanguage = localStorage.getItem('weatherhist_language') || 'es';

export function setLanguage(lang) {
    if (translations[lang]) {
        currentLanguage = lang;
        localStorage.setItem('weatherhist_language', lang);
        applyTranslations();
    }
}

export function getLanguage() {
    return currentLanguage;
}

export function t(key, fallback = null) {
    const keys = key.split('.');
    let value = translations[currentLanguage];
    for (const k of keys) {
        if (value && value[k] !== undefined) {
            value = value[k];
        } else {
            return fallback !== null ? fallback : key;
        }
    }
    return value;
}

export function getLocale() {
    return currentLanguage === 'es' ? 'es-ES' : 'en-US';
}

export function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.setAttribute('placeholder', t(key));
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        el.setAttribute('title', t(key));
    });
}

export { es, en };
