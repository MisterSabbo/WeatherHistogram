import { state } from '../../core/Store.js';
import { getThemeColor, getThemeFont, getThemeIcon } from '../../services/ThemeManager.js';
import { normalizeY, hexToRgb } from '../../utils/math.js';

export class WindLayer {
    constructor() {}

    render(ctx, viewX, viewW, h, styles) {
        this.drawWind(ctx, viewX, viewW, h, styles);
    }

    drawWind(ctx, viewX, viewW, h, styles) {
                const startIdx = Math.max(0, Math.floor(viewX / state.pixelsPerHour) - 5);
                const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / state.pixelsPerHour) + 5);
    
                ctx.save();
                // Draw tiny wind arrows directly on the grid
                for (let i = startIdx; i < endIdx; i++) {
                    const d = state.hourlyData[i];
                    if (d.localHour % 3 === 0) { // Draw every 3 hours to avoid clutter
                        const x = i * state.pixelsPerHour;
                        // Draw wind arrows at the top of the chart
                        const y = 35; // A bit below the top day labels
                        
                        ctx.save();
                        ctx.translate(x, y);
                        
                        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
                        ctx.shadowBlur = 4;
                        // Rotate based on wind direction (where it blows TO instead of FROM)
                        ctx.rotate((d.windDir + 180) * Math.PI / 180);
    
                        // Determine color based on temperature
                        let windColor = state.theme === 'dark' ? getThemeColor('wind.normalDark', '#cbd5e1') : getThemeColor('wind.normalLight', '#64748b'); // normal base
                        if (d.temp < 10) {
                            windColor = getThemeColor('wind.cold', '#3b82f6'); // Frío (Azul)
                        } else if (d.temp > 28) {
                            windColor = getThemeColor('wind.hot', '#ef4444'); // Caliente (Rojo)
                        }
    
                        if (d.wind > 40 && d.temp <= 28 && d.temp >= 10) {
                            windColor = state.theme === 'dark' ? getThemeColor('wind.strongDefaultDark', '#f87171') : getThemeColor('wind.strongDefaultLight', '#dc2626'); // strong default
                        }
                        
                        // Draw text
                        let wIcon = getThemeIcon('windDirection', null);
                        if (wIcon) {
                            ctx.font = '14px "Material Symbols Outlined"';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillStyle = windColor;
                            ctx.strokeStyle = state.theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)';
                            ctx.lineWidth = 1;
                            ctx.strokeText(wIcon, 0, 0);
                            ctx.fillText(wIcon, 0, 0);
                        } else {
                            ctx.fillStyle = windColor;
                            ctx.strokeStyle = state.theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)';
                            ctx.lineWidth = 1.5;
                            ctx.beginPath();
                            ctx.moveTo(0, -6);
                            ctx.lineTo(4, 4);
                            ctx.lineTo(0, 2);
                            ctx.lineTo(-4, 4);
                            ctx.closePath();
                            ctx.fill();
                            ctx.stroke();
                        }
                        
                        ctx.restore();
                    }
                }
                ctx.restore();
            }

}
