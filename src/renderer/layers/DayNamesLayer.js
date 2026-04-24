import { state } from '../../core/Store.js';
import { getThemeColor, getThemeFont, getThemeIcon } from '../../services/ThemeManager.js';
import { normalizeY, hexToRgb } from '../../utils/math.js';

export class DayNamesLayer {
    constructor() {}

    render(ctx, viewX, viewW, h, styles) {
        this.drawDayNames(ctx, viewX, viewW, h, styles);
    }

    drawDayNames(ctx, viewX, viewW, h, styles) {
                ctx.save();
                ctx.fillStyle = 'rgba(0,0,0,0.15)'; // Increased opacity for better visibility
                ctx.font = `900 80px ${getThemeFont()}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
    
                const startIdx = Math.max(0, Math.floor(viewX / state.pixelsPerHour) - 24);
                const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / state.pixelsPerHour) + 24);
    
                // Find the actual start of the day for the current visible range
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
                        const midX = (currentDayStart + (i - 1 - currentDayStart) / 2) * state.pixelsPerHour;
                        const dayName = state.hourlyData[currentDayStart].localDayName;
                        ctx.fillText(dayName, midX, h / 2);
                        currentDayStart = i;
                    }
                }
                // Último día visible
                if (currentDayStart !== -1 && currentDayStart < endIdx + 24) {
                    let nextDayStart = state.hourlyData.length;
                    for (let i = currentDayStart + 1; i < state.hourlyData.length; i++) {
                        if (state.hourlyData[i].localHour === 0) {
                            nextDayStart = i;
                            break;
                        }
                    }
                    const midX = (currentDayStart + (nextDayStart - 1 - currentDayStart) / 2) * state.pixelsPerHour;
                    const dayName = state.hourlyData[currentDayStart].localDayName;
                    ctx.fillText(dayName, midX, h / 2);
                }
                ctx.restore();
            }

}
