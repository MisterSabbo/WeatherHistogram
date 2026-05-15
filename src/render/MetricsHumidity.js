import { state } from '../store.js';
import { getThemeColor } from '../theme.js';

export function drawHumidity(ctx, viewX, viewW, h, styles, PIXELS_PER_HOUR) {
    const color = getThemeColor('humidityLine', 'rgba(0, 188, 212, 0.3)');
    const startIdx = Math.max(0, Math.floor(viewX / PIXELS_PER_HOUR) - 5);
    const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / PIXELS_PER_HOUR) + 5);

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    for (let i = startIdx; i < endIdx; i++) {
        const d = state.hourlyData[i];
        const x = i * PIXELS_PER_HOUR;
        const y = h - (h * (d.humidity / 100));
        if (i === startIdx) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
}
