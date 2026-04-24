import { state } from '../../core/Store.js';
import { getThemeColor, getThemeFont, getThemeIcon } from '../../services/ThemeManager.js';
import { normalizeY, hexToRgb } from '../../utils/math.js';

export class HumidityLayer {
    constructor() {}

    render(ctx, viewX, viewW, h, styles) {
        this.drawHumidity(ctx, viewX, viewW, h, styles);
    }

    drawHumidity(ctx, viewX, viewW, h, styles) {
                const color = getThemeColor('humidityLine', 'rgba(0, 188, 212, 0.3)');
                const startIdx = Math.max(0, Math.floor(viewX / state.pixelsPerHour) - 5);
                const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / state.pixelsPerHour) + 5);
    
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 5]);
    
                for (let i = startIdx; i < endIdx; i++) {
                    const d = state.hourlyData[i];
                    const x = i * state.pixelsPerHour;
                    const y = h - (h * (d.humidity / 100));
                    if (i === startIdx) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
                ctx.setLineDash([]);
            }

}
