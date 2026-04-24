import { state } from '../../core/Store.js';
import { getThemeColor, getThemeFont, getThemeIcon } from '../../services/ThemeManager.js';
import { normalizeY, hexToRgb } from '../../utils/math.js';

export class WeatherPhenomenaLayer {
    constructor() {}

    render(ctx, viewX, viewW, h, styles) {
        this.drawWeatherPhenomena(ctx, viewX, viewW, h, styles);
    }

    drawWeatherPhenomena(ctx, viewX, viewW, h) {
                const startIdx = Math.max(0, Math.floor(viewX / state.pixelsPerHour) - 2);
                const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / state.pixelsPerHour) + 2);
    
                for (let i = startIdx; i < endIdx; i++) {
                    const d = state.hourlyData[i];
                    const x = i * state.pixelsPerHour;
                    const code = d.weatherCode;
    
                    // Ondas de choque (rachas > 35)
                    if (d.gusts > 35) {
                        ctx.save();
                        
                        let color = 'rgba(100, 116, 139, 1)'; // Gris pizarra (100% opacidad)
                        if (d.gusts > 70) {
                            color = 'rgba(220, 38, 38, 1)'; // Rojo para rachas extremas
                        } else if (d.gusts > 50) {
                            color = 'rgba(234, 88, 12, 1)'; // Naranja para rachas muy fuertes
                        }
                        
                        // Halo blanco para visibilidad
                        ctx.shadowBlur = 4;
                        ctx.shadowColor = 'white';
                        
                        ctx.strokeStyle = color;
                        ctx.lineWidth = 1.5;
                        const centerX = x; 
                        const centerY = h - 35; // Altura aproximada de las aspas
                        
                        // Semejante al strokeText, dibujamos una base negra/oscura para contraste extra
                        ctx.strokeStyle = '#fff';
                        ctx.lineWidth = 3.5;
                        
                        const drawGustIcon = () => {
                            // Semicírculo (onda frontal base)
                            ctx.beginPath();
                            ctx.arc(centerX + 2, centerY, 6, -Math.PI/2, Math.PI/2, false);
                            ctx.stroke();
    
                            // Líneas detrás base
                            ctx.beginPath();
                            ctx.moveTo(centerX - 3, centerY - 4);
                            ctx.lineTo(centerX - 3, centerY + 4);
                            ctx.moveTo(centerX - 7, centerY - 2);
                            ctx.lineTo(centerX - 7, centerY + 2);
                            ctx.stroke();
    
                            // Detalles adicionales según intensidad
                            if (d.gusts > 50) {
                                // Segunda onda frontal
                                ctx.beginPath();
                                ctx.arc(centerX + 6, centerY, 10, -Math.PI/2.5, Math.PI/2.5, false);
                                ctx.stroke();
                                // Línea extra detrás
                                ctx.beginPath();
                                ctx.moveTo(centerX - 11, centerY - 1);
                                ctx.lineTo(centerX - 11, centerY + 1);
                                ctx.stroke();
                            }
                            if (d.gusts > 70) {
                                // Tercera onda frontal
                                ctx.beginPath();
                                ctx.arc(centerX + 10, centerY, 14, -Math.PI/3, Math.PI/3, false);
                                ctx.stroke();
                            }
                        };
    
                        drawGustIcon(); // Stroke blanco
                        
                        ctx.strokeStyle = color;
                        ctx.lineWidth = 1.5;
                        ctx.shadowBlur = 0; // Quitar sombra para el color real
                        drawGustIcon(); // Color real
                        
                        ctx.restore();
                    }
                }
            }

}
