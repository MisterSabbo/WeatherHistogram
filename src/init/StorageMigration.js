import { storageService } from '../services/StorageService.js';

const LEGACY_KEYS = [
    'weatherhist_skintype',
    'weatherhist_stickmancold',
    'weatherhist_stickmanhot',
    'weatherhist_stickmanwind',
    'weatherhist_stickmanclouds',
    'last_weather_location',
    'chart_theme',
    'view_mode'
];

export async function migrateStorage() {
    if (localStorage.getItem('weatherhist_skintype') === null) return;

    try {
        await storageService.set('skinType', parseInt(localStorage.getItem('weatherhist_skintype')) || 2);
        await storageService.set('stickmanThresholds', {
            cold: parseFloat(localStorage.getItem('weatherhist_stickmancold')) || 10,
            hot: parseFloat(localStorage.getItem('weatherhist_stickmanhot')) || 30,
            wind: parseFloat(localStorage.getItem('weatherhist_stickmanwind')) || 45,
            clouds: parseFloat(localStorage.getItem('weatherhist_stickmanclouds')) || 60
        });

        const lastLoc = localStorage.getItem('last_weather_location');
        if (lastLoc) {
            try {
                await storageService.set('lastLocation', JSON.parse(lastLoc));
            } catch (e) {}
        }

        await storageService.set('chartTheme', localStorage.getItem('chart_theme') || 'default');
        await storageService.set('viewMode', localStorage.getItem('view_mode') || 'minimap');

        LEGACY_KEYS.forEach(key => localStorage.removeItem(key));
    } catch (e) {
        console.error('Storage migration failed:', e);
    }
}
