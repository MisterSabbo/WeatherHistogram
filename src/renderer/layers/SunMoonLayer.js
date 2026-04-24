import { state } from '../../core/Store.js';
import { getThemeColor, getThemeFont, getThemeIcon } from '../../services/ThemeManager.js';
import { normalizeY, hexToRgb } from '../../utils/math.js';

export class SunMoonLayer {
    constructor() {}

    render(ctx, viewX, viewW, h, styles) {
        this.drawSunMarkersOnCanvas(ctx, viewX, viewW, h, styles);
        this.drawSunnyBackground(ctx, viewX, viewW, h, styles);
        this.drawNightOverlay(ctx, viewX, viewW, h, styles);
        this.drawNightShadow(ctx, viewX, viewW, h, styles);
        this.drawStarrySky(ctx, viewX, viewW, h, styles);
        this.drawSun(ctx, viewX, viewW, h, styles);
        this.drawMoon(ctx, viewX, viewW, h, styles);
    }

    drawSunMarkersOnCanvas(ctx, viewX, viewW, h) {
                if (!state.hourlyData.length) return;
                const startTime = state.hourlyData[0].time;
                const markerColor = '#666666'; // Siempre gris oscuro como los ejes
    
                ctx.save();
                ctx.font = `bold 10px ${getThemeFont()}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.lineWidth = 1.5;
    
                Object.keys(state.sunData).forEach(dateStr => {
                    const sun = state.sunData[dateStr];
                    const sunriseX = ((sun.sunrise - startTime) / 3600000) * state.pixelsPerHour;
                    const sunsetX = ((sun.sunset - startTime) / 3600000) * state.pixelsPerHour;
    
                    const sunriseTime = new Date(sun.sunrise).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: state.timezone });
                    const sunsetTime = new Date(sun.sunset).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: state.timezone });
    
                    const drawMarker = (x, time, type) => {
                        if (x < viewX - 50 || x > viewX + viewW + 50) return;
    
                        ctx.save();
                        ctx.translate(x, 0); // Posicionado en el borde superior
                        ctx.strokeStyle = markerColor;
                        ctx.fillStyle = markerColor;
                        ctx.lineWidth = 2; // Igual que los ejes
    
                        // Sombra blanca para legibilidad, igual que los ejes
                        ctx.shadowColor = 'white';
                        ctx.shadowBlur = 3;
    
                        // Icon (Line design) - Upside down
                        ctx.beginPath();
                        // Ground line
                        ctx.moveTo(-12, 0); ctx.lineTo(12, 0);
                        
                        // Sun semi-circle (pointing down)
                        ctx.moveTo(6, 0);
                        ctx.arc(0, 0, 6, 0, Math.PI, false);
                        
                        // Rays
                        const rayLen = 4;
                        for (let j = 0; j < 5; j++) {
                            const a = (j * Math.PI) / 4;
                            ctx.moveTo(Math.cos(a) * 8, Math.sin(a) * 8);
                            ctx.lineTo(Math.cos(a) * (8 + rayLen), Math.sin(a) * (8 + rayLen));
                        }
                        
                        if (type === 'sunrise') {
                            // Arrow pointing down (into the sun) - Swapped
                            ctx.moveTo(-3, 15); ctx.lineTo(0, 18); ctx.lineTo(3, 15);
                            ctx.moveTo(0, 18); ctx.lineTo(0, 11);
                        } else {
                            // Arrow pointing up (from the sun) - Swapped
                            ctx.moveTo(-3, 14); ctx.lineTo(0, 11); ctx.lineTo(3, 14);
                            ctx.moveTo(0, 11); ctx.lineTo(0, 18);
                        }
                        
                        // Draw white outline for glow
                        ctx.strokeStyle = 'white';
                        ctx.lineWidth = 4;
                        ctx.stroke();
    
                        // Draw actual icon
                        ctx.strokeStyle = markerColor;
                        ctx.lineWidth = 2;
                        ctx.stroke();
    
                        // Time text
                        ctx.font = 'bold 10px Inter';
                        ctx.lineWidth = 3;
                        ctx.strokeStyle = 'white';
                        ctx.strokeText(time, 0, 20); // Add stroke for shadow effect
                        ctx.fillStyle = markerColor;
                        ctx.fillText(time, 0, 20); // Texto debajo del icono
                        ctx.restore();
                    };
    
                    drawMarker(sunriseX, sunriseTime, 'sunrise');
                    drawMarker(sunsetX, sunsetTime, 'sunset');
                });
                ctx.restore();
            }

    drawSunnyBackground(ctx, viewX, viewW, h, styles, drawSunIcon) {
                const skyColor = '#fffde7'; // Siempre modo claro
                const sunColor = '#fdd835';
                const rayColor = '#fff59d';
    
                ctx.save();
                ctx.fillStyle = skyColor;
                ctx.fillRect(viewX, 0, viewW, h);
    
                if (drawSunIcon && state.hourlyData.length > 0) {
                    const startTime = state.hourlyData[0].time;
                    Object.keys(state.sunData).forEach(dateStr => {
                        const sun = state.sunData[dateStr];
                        // Sun midpoint (noon-ish)
                        const midpoint = (sun.sunrise + sun.sunset) / 2;
                        const x = ((midpoint - startTime) / 3600000) * state.pixelsPerHour;
    
                        if (x >= viewX - 100 && x <= viewX + viewW + 100) {
                            drawSun(ctx, x, h * 0.25, sunColor, rayColor);
                        }
                    });
                }
                ctx.restore();
            }

    drawNightOverlay(ctx, viewX, viewW, h) {
                const startIdx = Math.max(0, Math.floor(viewX / state.pixelsPerHour) - 5);
                const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / state.pixelsPerHour) + 5);
    
                let solidNightStart = -1;
    
                for (let i = startIdx; i < endIdx; i++) {
                    const d = state.hourlyData[i];
                    if (d.isNight) {
                        const prevIsDay = i > 0 && !state.hourlyData[i - 1].isNight;
                        const nextIsDay = i < state.hourlyData.length - 1 && !state.hourlyData[i + 1].isNight;
                        const x = i * state.pixelsPerHour;
                        const w = state.pixelsPerHour;
    
                        if (prevIsDay) {
                            if (solidNightStart !== -1) {
                                ctx.fillStyle = '#e9d5ff';
                                ctx.fillRect(solidNightStart * state.pixelsPerHour, 0, (i - solidNightStart) * state.pixelsPerHour, h);
                                solidNightStart = -1;
                            }
                            const grad = ctx.createLinearGradient(x, 0, x + w + 0.5, 0);
                            grad.addColorStop(0, '#fffde7');
                            grad.addColorStop(0.5, '#ffedd5');
                            grad.addColorStop(1, '#e9d5ff');
                            ctx.fillStyle = grad;
                            ctx.fillRect(x, 0, w + 0.5, h);
                        } else if (nextIsDay) {
                            if (solidNightStart !== -1) {
                                ctx.fillStyle = '#e9d5ff';
                                ctx.fillRect(solidNightStart * state.pixelsPerHour, 0, (i - solidNightStart) * state.pixelsPerHour, h);
                                solidNightStart = -1;
                            }
                            const grad = ctx.createLinearGradient(x, 0, x + w + 0.5, 0);
                            grad.addColorStop(0, '#e9d5ff');
                            grad.addColorStop(0.5, '#ffedd5');
                            grad.addColorStop(1, '#fffde7');
                            ctx.fillStyle = grad;
                            ctx.fillRect(x, 0, w + 0.5, h);
                        } else {
                            if (solidNightStart === -1) {
                                solidNightStart = i;
                            }
                        }
                    } else {
                        if (solidNightStart !== -1) {
                            ctx.fillStyle = '#e9d5ff'; // Darker violet
                            ctx.fillRect(solidNightStart * state.pixelsPerHour, 0, (i - solidNightStart) * state.pixelsPerHour + 0.5, h);
                            solidNightStart = -1;
                        }
                    }
                }
    
                if (solidNightStart !== -1) {
                    ctx.fillStyle = '#e9d5ff';
                    ctx.fillRect(solidNightStart * state.pixelsPerHour, 0, (endIdx - solidNightStart) * state.pixelsPerHour + 0.5, h);
                }
    
                // Draw Moon at midpoints
                if (state.hourlyData.length > 0) {
                    const startTime = state.hourlyData[0].time;
                    const sortedDates = Object.keys(state.sunData).sort();
                    for (let i = 0; i < sortedDates.length; i++) {
                        const currentSun = state.sunData[sortedDates[i]];
                        const nextSun = state.sunData[sortedDates[i+1]];
    
                        if (nextSun) {
                            // Moon midpoint is between sunset today and sunrise tomorrow
                            const midpoint = (currentSun.sunset + nextSun.sunrise) / 2;
                            const x = ((midpoint - startTime) / 3600000) * state.pixelsPerHour;
                            if (x >= viewX - 50 && x <= viewX + viewW + 50) {
                                drawMoon(ctx, x, h * 0.25, '#f5f5f5', '#90caf9');
                            }
                        }
                    }
                }
            }

    drawNightShadow(ctx, viewX, viewW, h) {
                const startIdx = Math.max(0, Math.floor(viewX / state.pixelsPerHour) - 5);
                const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / state.pixelsPerHour) + 5);
    
                let solidNightStart = -1;
    
                for (let i = startIdx; i < endIdx; i++) {
                    const d = state.hourlyData[i];
                    if (d.isNight) {
                        const prevIsDay = i > 0 && !state.hourlyData[i-1].isNight;
                        const nextIsDay = i < state.hourlyData.length - 1 && !state.hourlyData[i+1].isNight;
                        const x = i * state.pixelsPerHour;
                        const w = state.pixelsPerHour;
    
                        if (prevIsDay) {
                            if (solidNightStart !== -1) {
                                ctx.fillStyle = 'rgba(0, 0, 20, 0.15)';
                                ctx.fillRect(solidNightStart * state.pixelsPerHour, 0, (i - solidNightStart) * state.pixelsPerHour, h);
                                solidNightStart = -1;
                            }
                            const grad = ctx.createLinearGradient(x, 0, x + w + 0.5, 0);
                            grad.addColorStop(0, 'rgba(0, 0, 20, 0)');
                            grad.addColorStop(1, 'rgba(0, 0, 20, 0.15)');
                            ctx.fillStyle = grad;
                            ctx.fillRect(x, 0, w + 0.5, h);
                        } else if (nextIsDay) {
                            if (solidNightStart !== -1) {
                                ctx.fillStyle = 'rgba(0, 0, 20, 0.15)';
                                ctx.fillRect(solidNightStart * state.pixelsPerHour, 0, (i - solidNightStart) * state.pixelsPerHour, h);
                                solidNightStart = -1;
                            }
                            const grad = ctx.createLinearGradient(x, 0, x + w + 0.5, 0);
                            grad.addColorStop(0, 'rgba(0, 0, 20, 0.15)');
                            grad.addColorStop(1, 'rgba(0, 0, 20, 0)');
                            ctx.fillStyle = grad;
                            ctx.fillRect(x, 0, w + 0.5, h);
                        } else {
                            if (solidNightStart === -1) {
                                solidNightStart = i;
                            }
                        }
                    } else {
                        if (solidNightStart !== -1) {
                            ctx.fillStyle = 'rgba(0, 0, 20, 0.15)';
                            ctx.fillRect(solidNightStart * state.pixelsPerHour, 0, (i - solidNightStart) * state.pixelsPerHour + 0.5, h);
                            solidNightStart = -1;
                        }
                    }
                }
    
                if (solidNightStart !== -1) {
                    ctx.fillStyle = 'rgba(0, 0, 20, 0.15)';
                    ctx.fillRect(solidNightStart * state.pixelsPerHour, 0, (endIdx - solidNightStart) * state.pixelsPerHour + 0.5, h);
                }
            }

    drawStarrySky(ctx, viewX, viewW, h) {
                ctx.save();
                ctx.fillStyle = 'white';
                const startIdx = Math.max(0, Math.floor(viewX / state.pixelsPerHour) - 5);
                const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / state.pixelsPerHour) + 5);
    
                // Seeded random based on position
                const rand = (seed) => {
                    let x = Math.sin(seed * 9.9898) * 43758.5453;
                    return x - Math.floor(x);
                };
    
                for (let i = startIdx; i < endIdx; i++) {
                    const d = state.hourlyData[i];
                    if (d.isNight) {
                        const xOffset = i * state.pixelsPerHour;
                        // Generate deterministic stars per hour chunk
                        for (let s = 0; s < 12; s++) { // 12 stars per hour width
                            const seed = i * 100 + s;
                            const sx = xOffset + rand(seed) * state.pixelsPerHour;
                            const sy = rand(seed + 1) * h; // En todo el cielo
                            const size = 0.5 + rand(seed + 2) * 1.5;
                            const opacity = 0.3 + rand(seed + 3) * 0.7;
                            
                            ctx.globalAlpha = opacity;
                            ctx.beginPath();
                            ctx.arc(sx, sy, size, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                }
                ctx.restore();
            }

    drawSun(ctx, x, y, sunColor, rayColor) {
                const radius = 25;
                const rayCount = 12;
                const rayLength = 20;
    
                ctx.save();
                // Resplandor
                const grad = ctx.createRadialGradient(x, y, radius, x, y, radius + 50);
                grad.addColorStop(0, 'rgba(253, 216, 53, 0.3)');
                grad.addColorStop(1, 'rgba(253, 216, 53, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(x, y, radius + 50, 0, Math.PI * 2);
                ctx.fill();
    
                // Rayos
                ctx.strokeStyle = rayColor;
                ctx.lineWidth = 2;
                for (let i = 0; i < rayCount; i++) {
                    const angle = (i / rayCount) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.moveTo(x + Math.cos(angle) * (radius + 8), y + Math.sin(angle) * (radius + 8));
                    ctx.lineTo(x + Math.cos(angle) * (radius + 8 + rayLength), y + Math.sin(angle) * (radius + 8 + rayLength));
                    ctx.stroke();
                }
    
                // Sol
                ctx.fillStyle = sunColor;
                ctx.shadowBlur = 15;
                ctx.shadowColor = sunColor;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

    drawMoon(ctx, x, y, moonColor, glowColor) {
                const radius = 20;
                ctx.save();
                // Resplandor
                const grad = ctx.createRadialGradient(x, y, radius, x, y, radius + 40);
                grad.addColorStop(0, 'rgba(144, 202, 249, 0.2)');
                grad.addColorStop(1, 'rgba(144, 202, 249, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(x, y, radius + 40, 0, Math.PI * 2);
                ctx.fill();
    
                // Luna (Creciente) dibujada con path para evitar destination-out
                ctx.fillStyle = moonColor;
                ctx.shadowBlur = 10;
                ctx.shadowColor = glowColor;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0.2 * Math.PI, 1.8 * Math.PI);
                ctx.quadraticCurveTo(x + radius * 0.5, y, x + radius * Math.cos(0.2 * Math.PI), y + radius * Math.sin(0.2 * Math.PI));
                ctx.fill();
    
                ctx.restore();
            }

}
