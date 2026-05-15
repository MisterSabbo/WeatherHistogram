import { state } from '../store.js';
import { t, getLocale } from '../utils/i18n.js';

export function updateTimeDisplay(activeX, PIXELS_PER_HOUR) {
    const startTime = state.hourlyData[0].time;
    const exactTime = startTime + (activeX / PIXELS_PER_HOUR) * 3600000;
    const date = new Date(exactTime);
    const today = new Date();
    const isToday = date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

    const timeStr = date.toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit', timeZone: state.timezone });
    const dateStr = date.toLocaleString(getLocale(), {
        weekday: 'short', day: 'numeric', month: 'short', timeZone: state.timezone
    }).toUpperCase();

    const timeDisplay = document.getElementById('current-time-display');
    timeDisplay.querySelector('.time-main').innerText = timeStr;
    timeDisplay.querySelector('.date-sub').innerText = isToday ? `${t('topPanel.today')}, ${dateStr}` : dateStr;
}
