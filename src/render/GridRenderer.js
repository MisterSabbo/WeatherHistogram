import { state } from '../store.js';
import { getThemeColor, getThemeFont } from '../theme.js';
import { normalizeY } from '../utils/math.js';
import { formatHour } from '../utils/time.js';

export function drawGrid(ctx, viewX, viewW, h, styles, PIXELS_PER_HOUR) {
    ctx.strokeStyle = '#e0e0e0'; 
    ctx.lineWidth = 1;
    ctx.beginPath();
    const xStart = viewX;
    const xEnd = viewX + viewW;
    for (let temp = -20; temp <= 40; temp += 10) {
        const y = normalizeY(temp, -20, 40, h);
        ctx.moveTo(xStart, y);
        ctx.lineTo(xEnd, y);
    }
    ctx.stroke();

    const frozenY = normalizeY(0, -20, 40, h);
    ctx.save();
    ctx.strokeStyle = getThemeColor('zeroLine', 'rgba(14, 165, 233, 0.7)');
    ctx.setLineDash([4, 4]); 
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(xStart, frozenY);
    ctx.lineTo(xEnd, frozenY);
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = 'rgba(0,0,0,0.08)'; 
    const startIdx = Math.max(0, Math.floor(viewX / PIXELS_PER_HOUR) - 5);
    const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / PIXELS_PER_HOUR) + 5);

    // Grid vertical lines previously drawn at localHour === 0 have been removed to prevent visual artifact complaints
}

export function drawDayNames(ctx, viewX, viewW, h, styles, PIXELS_PER_HOUR) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; 
    ctx.font = `900 80px ${getThemeFont()}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const startIdx = Math.max(0, Math.floor(viewX / PIXELS_PER_HOUR) - 24);
    const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / PIXELS_PER_HOUR) + 24);

    let dayStart = 0;
    for (let i = Math.max(0, startIdx); i >= 0; i--) {
        if (state.hourlyData[i].localHour === 0) {
            dayStart = i;
            break;
        }
    }

    let currentDayStart = dayStart;
    for (let i = dayStart + 1; i < endIdx + 24 && i < state.hourlyData.length; i++) {
        const d = state.hourlyData[i];
        if (d.localHour === 0) {
            const midX = (currentDayStart + (i - 1 - currentDayStart) / 2) * PIXELS_PER_HOUR;
            const dayName = state.hourlyData[currentDayStart].localDayName;
            ctx.fillText(dayName, midX, h / 2);
            currentDayStart = i;
        }
    }
    
    if (currentDayStart !== -1 && currentDayStart < endIdx + 24) {
        let nextDayStart = state.hourlyData.length;
        for (let i = currentDayStart + 1; i < state.hourlyData.length; i++) {
            if (state.hourlyData[i].localHour === 0) {
                nextDayStart = i;
                break;
            }
        }
        const midX = (currentDayStart + (nextDayStart - 1 - currentDayStart) / 2) * PIXELS_PER_HOUR;
        const dayName = state.hourlyData[currentDayStart].localDayName;
        ctx.fillText(dayName, midX, h / 2);
    }
    ctx.restore();
}

export function drawAxes(ctx, viewX, viewW, h, styles, PIXELS_PER_HOUR, CHART_HEIGHT) {
    ctx.save();
    ctx.fillStyle = getThemeColor('xAxisLabel', '#666666');
    ctx.font = `bold 10px ${getThemeFont()}`;
    ctx.textAlign = 'center';

    const startIdx = Math.max(0, Math.floor(viewX / PIXELS_PER_HOUR) - 5);
    const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / PIXELS_PER_HOUR) + 5);

    const sunMarkers = [];
    if (state.hourlyData.length) {
        const startTime = state.hourlyData[0].time;
        Object.values(state.sunData).forEach(sun => {
            sunMarkers.push(((sun.sunrise - startTime) / 3600000) * PIXELS_PER_HOUR);
            sunMarkers.push(((sun.sunset - startTime) / 3600000) * PIXELS_PER_HOUR);
        });
    }

    for (let i = startIdx; i < endIdx; i++) {
        const d = state.hourlyData[i];
        if (!d) continue;
        const x = i * PIXELS_PER_HOUR;
        
        // Check overlap with sun markers
        const isOverlapping = sunMarkers.some(markerX => Math.abs(markerX - x) < 25);
        if (isOverlapping) continue;

        const label = formatHour(d.localHour);

        // Sombra para legibilidad
        ctx.save();
        
        ctx.shadowBlur = 0;
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 8);
        ctx.stroke();

        ctx.lineWidth = 1;
        ctx.strokeStyle = getThemeColor('xAxisLabel', '#666666');
        ctx.stroke();

        ctx.shadowColor = 'white';
        ctx.shadowBlur = 3;
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'white';
        ctx.strokeText(label, x, 20);
        
        ctx.shadowBlur = 0;
        ctx.fillStyle = getThemeColor('xAxisLabel', '#666666');
        ctx.fillText(label, x, 20);

        ctx.restore();
    }
    ctx.restore();
}
