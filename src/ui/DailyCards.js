import { state, CONFIG } from '../store.js';
import { getThemeIcon } from '../theme.js';
import { getLocale } from '../utils/i18n.js';

export function getWeatherIconSVG(code) {
    let iconName = getThemeIcon('dailyCards.clear', 'clear_day');
    
    if (code >= 1 && code <= 3) {
        iconName = getThemeIcon('dailyCards.cloudy', 'cloud');
    } else if (code === 45 || code === 48) {
        iconName = getThemeIcon('dailyCards.fog', 'foggy');
    } else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
        iconName = getThemeIcon('dailyCards.rain', 'rainy');
    } else if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
        iconName = getThemeIcon('dailyCards.snow', 'ac_unit');
    } else if (code >= 95) {
        iconName = getThemeIcon('dailyCards.thunderstorm', 'thunderstorm');
    }
    return `<span class="material-symbols-outlined" style="font-size:24px;">${iconName}</span>`;
}

export function generateDailyCards(centerOnCurrentTimeCallback) {
    const container = document.getElementById('daily-cards-container');
    if (!container) return;
    container.innerHTML = '';

    if (!state.dailyData || !state.dailyData.length) return;

    const now = new Date();
    const nowStr = now.toLocaleDateString(getLocale(), { day: '2-digit', month: '2-digit', timeZone: state.timezone });

    state.dailyData.forEach((day, index) => {
        const card = document.createElement('div');
        card.className = 'daily-card';
        card.dataset.index = String(index);
        
        const date = new Date(day.time);
        const dayName = date.toLocaleDateString(getLocale(), { weekday: 'short', timeZone: state.timezone }).toUpperCase();
        const dateStr = date.toLocaleDateString(getLocale(), { day: '2-digit', month: '2-digit', timeZone: state.timezone });
        
        const isToday = (dateStr === nowStr);
        let isPast = false;
        
        // Find today's index
        const todayIndex = state.dailyData.findIndex(d => {
             const dDate = new Date(d.time);
             return dDate.toLocaleDateString(getLocale(), { day: '2-digit', month: '2-digit', timeZone: state.timezone }) === nowStr;
        });
        if (todayIndex !== -1 && index < todayIndex) {
            isPast = true;
        }
        
        const iconSVG = getWeatherIconSVG(day.weatherCode);

        let pastIconHTML = '';
        if (isPast) {
            card.classList.add('past-day');
            pastIconHTML = `<span class="material-symbols-outlined past-indicator">history</span>`;
        }

        card.innerHTML = `
            ${pastIconHTML}
            <div class="day-header">
                <span class="day-name">${dayName} ${isToday ? '<span class="today-marker"></span>' : ''}</span>
                <span class="day-date">${dateStr}</span>
            </div>
            <div class="day-body">
                <div class="day-icon">${iconSVG}</div>
                <div class="day-temp-group">
                    <span class="day-temp">${Math.round(day.tempMax)}°</span>
                    <span class="day-temp-min">${Math.round(day.tempMin)}°</span>
                </div>
            </div>
        `;

        card.addEventListener('click', () => {
            if (isToday) {
                if (centerOnCurrentTimeCallback) centerOnCurrentTimeCallback('smooth');
                return;
            }

            const noonIndex = state.hourlyData.findIndex(h => {
                const hDate = new Date(h.time);
                const hStr = hDate.toLocaleDateString(getLocale(), { day: '2-digit', month: '2-digit', timeZone: state.timezone });
                return hStr === dateStr && h.localHour === 12;
            });

            // Si no encuentra la hora 12 exacta de ese día, busca la primera y suma 12
            let targetIndex = noonIndex;
            if (targetIndex === -1) {
                 const firstIndex = state.hourlyData.findIndex(h => {
                    const hDate = new Date(h.time);
                    return hDate.toLocaleDateString(getLocale(), { day: '2-digit', month: '2-digit', timeZone: state.timezone }) === dateStr;
                 });
                 if (firstIndex !== -1) targetIndex = Math.min(state.hourlyData.length - 1, firstIndex + 12);
            }

            if (targetIndex !== -1) {
                const scrollContainer = document.getElementById('scroll-container');
                const targetScroll = (targetIndex * state.PIXELS_PER_HOUR) - 60; // Alineado a la línea de referencia (60px)
                scrollContainer.scrollTo({ left: targetScroll, behavior: 'smooth' });
            }
        });

        container.appendChild(card);
    });
    updateActiveDailyCard();
}

let lastActiveDateStr = '';

export function updateActiveDailyCard() {
    const container = document.getElementById('daily-cards-container');
    if (!container || container.style.display === 'none') return;
    
    const scrollContainer = document.getElementById('scroll-container');
    const activeX = scrollContainer.scrollLeft + 60;
    
    const floatIndex = activeX / state.PIXELS_PER_HOUR;
    const hourIndex = Math.max(0, Math.min(state.hourlyData.length - 1, Math.floor(floatIndex)));
    const currentData = state.hourlyData[hourIndex];
    if (!currentData) return;
    
    const currentDate = new Date(currentData.time);
    const currentDateStr = currentDate.toLocaleDateString(getLocale(), { day: '2-digit', month: '2-digit', timeZone: state.timezone });
    
    // Skip heavy layout ops if the active day hasn't changed
    const dayChanged = currentDateStr !== lastActiveDateStr;
    lastActiveDateStr = currentDateStr;

    // Usar índice flotante para progreso exacto (incluso entre horas)
    const fraction = floatIndex - Math.floor(floatIndex);
    const dayProgress = (currentData.localHour + fraction) / 24;
    
    const cards = container.querySelectorAll('.daily-card');
    cards.forEach((card, index) => {
        const dayData = state.dailyData[index];
        if (!dayData) return;
        const dDate = new Date(dayData.time);
        const dDateStr = dDate.toLocaleDateString(getLocale(), { day: '2-digit', month: '2-digit', timeZone: state.timezone });
        
        const isActive = currentDateStr === dDateStr;
        card.classList.toggle('active', isActive);
        
        if (isActive) {
            const c = /** @type {HTMLElement} */ (card);
            c.style.setProperty('--arrow-pos', `${Math.max(0, Math.min(1, dayProgress)) * 100}%`);

            if (dayChanged) {
                const cardRect = c.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                
                if (cardRect.left < containerRect.left || cardRect.right > containerRect.right) {
                    const scrollLeft = c.offsetLeft - (container.clientWidth / 2) + (card.clientWidth / 2);
                    container.scrollTo({ left: scrollLeft, behavior: 'instant' });
                }
            }
        }
    });
}
