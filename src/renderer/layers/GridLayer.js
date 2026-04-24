import { state } from '../../core/Store.js';
import { getThemeColor, getThemeFont, getThemeIcon } from '../../services/ThemeManager.js';
import { normalizeY, hexToRgb } from '../../utils/math.js';

export class GridLayer {
    constructor() {}

    render(ctx, viewX, viewW, h, styles) {
        this.drawGrid(ctx, viewX, viewW, h, styles);
        this.drawAxes(ctx, viewX, viewW, h, styles);
    }

    drawGrid(ctx, viewX, viewW, h, styles) {
                ctx.strokeStyle = '#e0e0e0'; // Siempre modo claro
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
    
                // Línea de congelación (0°C)
                const frozenY = normalizeY(0, -20, 40, h);
                ctx.save();
                ctx.strokeStyle = getThemeColor('zeroLine', 'rgba(14, 165, 233, 0.4)');
                ctx.setLineDash([4, 4]); // Dashed line
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(xStart, frozenY);
                ctx.lineTo(xEnd, frozenY);
                ctx.stroke();
                ctx.restore();
    
                // Divisiones de día
                ctx.strokeStyle = 'rgba(0,0,0,0.08)'; // Siempre modo claro
                const startIdx = Math.max(0, Math.floor(viewX / state.pixelsPerHour) - 5);
                const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / state.pixelsPerHour) + 5);
    
                for (let i = startIdx; i < endIdx; i++) {
                    const d = state.hourlyData[i];
                    if (d.localHour === 0) {
                        ctx.beginPath();
                        ctx.moveTo(i * state.pixelsPerHour, 0);
                        ctx.lineTo(i * state.pixelsPerHour, h);
                        ctx.stroke();
                    }
                }
            }

    drawAxes(ctx, viewX, viewW, h, styles) {
                ctx.save();
                ctx.fillStyle = '#666666'; // Siempre modo claro
                ctx.font = `bold 10px ${getThemeFont()}`;
                ctx.textAlign = 'center';
    
                const startIdx = Math.max(0, Math.floor(viewX / state.pixelsPerHour) - 5);
                const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / state.pixelsPerHour) + 5);
    
                const sunMarkers = [];
                if (state.hourlyData.length) {
                    const startTime = state.hourlyData[0].time;
                    Object.values(state.sunData).forEach(sun => {
                        sunMarkers.push(((sun.sunrise - startTime) / 3600000) * state.pixelsPerHour);
                        sunMarkers.push(((sun.sunset - startTime) / 3600000) * state.pixelsPerHour);
                    });
                }
    
                for (let i = startIdx; i < endIdx; i++) {
                    const d = state.hourlyData[i];
                    const x = i * state.pixelsPerHour;
                    
                    // Check overlap with sun markers
                    const isOverlapping = sunMarkers.some(markerX => Math.abs(markerX - x) < 25);
                    if (isOverlapping) continue;
    
                    const label = d.localHour.toString().padStart(2, '0');
    
                    // Sombra para legibilidad
                    ctx.save();
                    ctx.shadowColor = 'white';
                    ctx.shadowBlur = 3;
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = 'white';
    
                    // Top labels (Axis X)
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, 8);
                    ctx.stroke();
                    ctx.strokeText(label, x, 20);
                    ctx.fillStyle = '#666666';
                    ctx.fillText(label, x, 20);
    
                    ctx.restore();
                }
                ctx.restore();
            }

}
