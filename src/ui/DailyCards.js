import { state } from '../core/Store.js';
import { getWeatherIconSVG } from '../utils/weatherFormatters.js';

export class DailyCards {
    constructor() {
        this.container = document.getElementById('daily-cards-container');
        this.scrollContainer = document.getElementById('scroll-container');
    }

    render() {
        if (!this.container) return;
        this.container.innerHTML = '';

        if (!state.dailyData || !state.dailyData.length) return;

        const now = new Date();
        const nowStr = now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', timeZone: state.timezone });

        state.dailyData.forEach((day, index) => {
            const card = document.createElement('div');
            card.className = 'daily-card';
            card.dataset.index = index;
            
            const date = new Date(day.time);
            const dayName = date.toLocaleDateString('es-ES', { weekday: 'short', timeZone: state.timezone }).toUpperCase();
            const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', timeZone: state.timezone });
            
            const isToday = (dateStr === nowStr);
            const iconSVG = getWeatherIconSVG(day.weatherCode);

            card.innerHTML = `
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
                    window.dispatchEvent(new CustomEvent('centerOnCurrentTime', { detail: { behavior: 'smooth' } }));
                    return;
                }

                const noonIndex = state.hourlyData.findIndex(h => {
                    const hDate = new Date(h.time);
                    const hStr = hDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', timeZone: state.timezone });
                    return hStr === dateStr && h.localHour === 12;
                });

                let targetIndex = noonIndex;
                if (targetIndex === -1) {
                     const firstIndex = state.hourlyData.findIndex(h => {
                        const hDate = new Date(h.time);
                        return hDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', timeZone: state.timezone }) === dateStr;
                     });
                     if (firstIndex !== -1) targetIndex = Math.min(state.hourlyData.length - 1, firstIndex + 12);
                }

                if (targetIndex !== -1) {
                    const targetScroll = (targetIndex * state.pixelsPerHour) - 60;
                    this.scrollContainer.scrollTo({ left: targetScroll, behavior: 'smooth' });
                }
            });

            this.container.appendChild(card);
        });
        this.updateActive();
    }

    updateActive() {
        if (!this.container || this.container.style.display === 'none') return;
        
        const activeX = this.scrollContainer.scrollLeft + 60;
        const floatIndex = activeX / state.pixelsPerHour;
        const hourIndex = Math.max(0, Math.min(state.hourlyData.length - 1, Math.floor(floatIndex)));
        const currentData = state.hourlyData[hourIndex];
        if (!currentData) return;
        
        const currentDate = new Date(currentData.time);
        const currentDateStr = currentDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', timeZone: state.timezone });
        
        const fraction = floatIndex - Math.floor(floatIndex);
        const dayProgress = (currentData.localHour + fraction) / 24;
        
        const cards = this.container.querySelectorAll('.daily-card');
        cards.forEach((card, index) => {
            const dayData = state.dailyData[index];
            if (!dayData) return;
            const dDate = new Date(dayData.time);
            const dDateStr = dDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', timeZone: state.timezone });
            
            const isActive = currentDateStr === dDateStr;
            card.classList.toggle('active', isActive);
            
            if (isActive) {
                card.style.setProperty('--arrow-pos', `${Math.max(0, Math.min(1, dayProgress)) * 100}%`);
                const cardRect = card.getBoundingClientRect();
                const containerRect = this.container.getBoundingClientRect();
                
                if (cardRect.left < containerRect.left || cardRect.right > containerRect.right) {
                    const scrollLeft = card.offsetLeft - (this.container.clientWidth / 2) + (card.clientWidth / 2);
                    this.container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
                }
            }
        });
    }
}
