import { state } from '../store.js';
import { getThemeFont, getThemeColor } from '../theme.js';
import { getLocale } from '../utils/i18n.js';

export function drawWeatherPhenomena(ctx, viewX, viewW, h, PIXELS_PER_HOUR) {
    const startIdx = Math.max(0, Math.floor(viewX / PIXELS_PER_HOUR) - 2);
    const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / PIXELS_PER_HOUR) + 2);

    for (let i = startIdx; i < endIdx; i++) {
        const d = state.hourlyData[i];
        const x = i * PIXELS_PER_HOUR;

        if (d.gusts > 35) {
            ctx.save();
            
            let color = 'rgba(100, 116, 139, 1)'; 
            if (d.gusts > 70) {
                color = 'rgba(220, 38, 38, 1)'; 
            } else if (d.gusts > 50) {
                color = 'rgba(234, 88, 12, 1)';
            }
            
            ctx.shadowBlur = 4;
            ctx.shadowColor = 'white';
            
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            const centerX = x; 
            const centerY = h - 35; 
            
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3.5;
            
            const drawGustIcon = () => {
                ctx.beginPath();
                ctx.arc(centerX + 2, centerY, 6, -Math.PI/2, Math.PI/2, false);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(centerX - 3, centerY - 4);
                ctx.lineTo(centerX - 3, centerY + 4);
                ctx.moveTo(centerX - 7, centerY - 2);
                ctx.lineTo(centerX - 7, centerY + 2);
                ctx.stroke();

                if (d.gusts > 50) {
                    ctx.beginPath();
                    ctx.arc(centerX + 6, centerY, 10, -Math.PI/2.5, Math.PI/2.5, false);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(centerX - 11, centerY - 1);
                    ctx.lineTo(centerX - 11, centerY + 1);
                    ctx.stroke();
                }
                if (d.gusts > 70) {
                    ctx.beginPath();
                    ctx.arc(centerX + 10, centerY, 14, -Math.PI/3, Math.PI/3, false);
                    ctx.stroke();
                }
            };

            drawGustIcon(); 
            
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 0; 
            drawGustIcon(); 
            
            ctx.restore();
        }
    }
}

export function drawStarrySky(ctx, viewX, viewW, h, PIXELS_PER_HOUR) {
    ctx.save();
    ctx.fillStyle = 'white';
    const startIdx = Math.max(0, Math.floor(viewX / PIXELS_PER_HOUR) - 5);
    const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / PIXELS_PER_HOUR) + 5);

    const rand = (seed) => {
        let x = Math.sin(seed * 9.9898) * 43758.5453;
        return x - Math.floor(x);
    };

    for (let i = startIdx; i < endIdx; i++) {
        const d = state.hourlyData[i];
        if (d.isNight) {
            const xOffset = i * PIXELS_PER_HOUR;
            for (let s = 0; s < 12; s++) { 
                const seed = i * 100 + s;
                const sx = xOffset + rand(seed) * PIXELS_PER_HOUR;
                const sy = rand(seed + 1) * h * 0.5; // Stars up to middle height
                let sSize = rand(seed + 2) * 1.5 + 0.5;
                
                let alpha = rand(seed + 3) * 0.8 + 0.2;
                // Add twinkle effect dynamically (just use time directly would flicker, so pseudo-random opacity)
                // Minimap doesn't call this, only main chart.

                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(sx, sy, sSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    ctx.restore();
}

export function drawSunMarkersOnCanvas(ctx, viewX, viewW, h, PIXELS_PER_HOUR) {
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
        const sunriseX = ((sun.sunrise - startTime) / 3600000) * PIXELS_PER_HOUR;
        const sunsetX = ((sun.sunset - startTime) / 3600000) * PIXELS_PER_HOUR;

        const sunriseTime = new Date(sun.sunrise).toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit', timeZone: state.timezone });
        const sunsetTime = new Date(sun.sunset).toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit', timeZone: state.timezone });

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
            ctx.fillText(time, 0, 20); // Text below icon
            ctx.restore();
        };

        drawMarker(sunriseX, sunriseTime, 'sunrise');
        drawMarker(sunsetX, sunsetTime, 'sunset');
    });
    ctx.restore();
}

export function drawUVSegments(ctx, viewX, viewW, h, PIXELS_PER_HOUR) {
    const startIdx = Math.max(0, Math.floor(viewX / PIXELS_PER_HOUR) - 2);
    const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / PIXELS_PER_HOUR) + 2);

    for (let i = startIdx; i < endIdx; i++) {
        const d = state.hourlyData[i];
        if (d.uv > 0 && !d.isNight) {
            const x = i * PIXELS_PER_HOUR;
            
            let uvColor;
            if (d.uv >= 11) uvColor = getThemeColor('uvLevels.extreme', '#7b1fa2');
            else if (d.uv >= 8) uvColor = getThemeColor('uvLevels.veryHigh', '#d32f2f');
            else if (d.uv >= 6) uvColor = getThemeColor('uvLevels.high', '#f57c00');
            else if (d.uv >= 3) uvColor = getThemeColor('uvLevels.moderate', '#fbc02d');
            else uvColor = getThemeColor('uvLevels.low', '#4caf50');

            const c = window.hexToRgb ? window.hexToRgb(uvColor) : {r: 0, g: 0, b: 0};
            const bgR = Math.round(255 * 0.8 + c.r * 0.2);
            const bgG = Math.round(255 * 0.8 + c.g * 0.2);
            const bgB = Math.round(255 * 0.8 + c.b * 0.2);
            const opacityColor = `rgba(${bgR}, ${bgG}, ${bgB}, 0.95)`;
            
            let textColor = uvColor;
            if (uvColor === getThemeColor('uvLevels.moderate', '#fbc02d') || uvColor === '#fbc02d') {
                textColor = '#e65100';
            }

            const uvText = `UV ${parseFloat(d.uv).toFixed(1)}`;

            ctx.save();
            // Draw rectangle block (reduced height, solid intense color)
            ctx.fillStyle = uvColor;
            ctx.beginPath();
            ctx.rect(x, 0, PIXELS_PER_HOUR, 6);
            ctx.fill();
            ctx.restore();
        }
    }
}

export function drawSunnyBackground(ctx, viewX, viewW, h, styles, drawSunIcon, PIXELS_PER_HOUR) {
    const skyColor = '#fffde7'; 
    const sunColor = '#fdd835';
    const rayColor = '#fff59d';

    ctx.save();
    ctx.fillStyle = skyColor;
    ctx.fillRect(viewX, 0, viewW, h);

    if (drawSunIcon && state.hourlyData.length > 0) {
        const startTime = state.hourlyData[0].time;
        Object.keys(state.sunData).forEach(dateStr => {
            const sun = state.sunData[dateStr];
            const midpoint = (sun.sunrise + sun.sunset) / 2;
            const x = ((midpoint - startTime) / 3600000) * PIXELS_PER_HOUR;

            if (x >= viewX - 100 && x <= viewX + viewW + 100) {
                drawSun(ctx, x, h * 0.25, sunColor, rayColor);
            }
        });
    }
    ctx.restore();
}

function drawSun(ctx, x, y, sunColor, rayColor) {
    const radius = 25;
    const rayCount = 12;
    const rayLength = 20;

    ctx.save();
    const grad = ctx.createRadialGradient(x, y, radius, x, y, radius + 50);
    grad.addColorStop(0, 'rgba(253, 216, 53, 0.3)');
    grad.addColorStop(1, 'rgba(253, 216, 53, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius + 50, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = rayColor;
    ctx.lineWidth = 2;
    for (let i = 0; i < rayCount; i++) {
        const angle = (i / rayCount) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(angle) * (radius + 8), y + Math.sin(angle) * (radius + 8));
        ctx.lineTo(x + Math.cos(angle) * (radius + 8 + rayLength), y + Math.sin(angle) * (radius + 8 + rayLength));
        ctx.stroke();
    }

    ctx.fillStyle = sunColor;
    ctx.shadowBlur = 15;
    ctx.shadowColor = sunColor;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawMoon(ctx, x, y, moonColor, glowColor) {
    const radius = 20;
    ctx.save();
    const grad = ctx.createRadialGradient(x, y, radius, x, y, radius + 40);
    grad.addColorStop(0, 'rgba(144, 202, 249, 0.2)');
    grad.addColorStop(1, 'rgba(144, 202, 249, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius + 40, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = moonColor;
    ctx.shadowBlur = 10;
    ctx.shadowColor = glowColor;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0.2 * Math.PI, 1.8 * Math.PI);
    ctx.quadraticCurveTo(x + radius * 0.5, y, x + radius * Math.cos(0.2 * Math.PI), y + radius * Math.sin(0.2 * Math.PI));
    ctx.fill();

    ctx.restore();
}

export function drawNightOverlay(ctx, viewX, viewW, h, PIXELS_PER_HOUR) {
    const startIdx = Math.max(0, Math.floor(viewX / PIXELS_PER_HOUR) - 5);
    const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / PIXELS_PER_HOUR) + 5);

    let solidNightStart = -1;

    for (let i = startIdx; i < endIdx; i++) {
        const d = state.hourlyData[i];
        if (d.isNight) {
            const prevIsDay = i > 0 && !state.hourlyData[i - 1].isNight;
            const nextIsDay = i < state.hourlyData.length - 1 && !state.hourlyData[i + 1].isNight;
            const x = i * PIXELS_PER_HOUR;
            const w = PIXELS_PER_HOUR;

            if (prevIsDay) {
                if (solidNightStart !== -1) {
                    ctx.fillStyle = '#e9d5ff';
                    ctx.fillRect(solidNightStart * PIXELS_PER_HOUR, 0, (i - solidNightStart) * PIXELS_PER_HOUR + 1.5, h);
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
                    ctx.fillRect(solidNightStart * PIXELS_PER_HOUR, 0, (i - solidNightStart) * PIXELS_PER_HOUR + 1.5, h);
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
                ctx.fillStyle = '#e9d5ff'; 
                ctx.fillRect(solidNightStart * PIXELS_PER_HOUR, 0, (i - solidNightStart) * PIXELS_PER_HOUR + 1.5, h);
                solidNightStart = -1;
            }
        }
    }

    if (solidNightStart !== -1) {
        ctx.fillStyle = '#e9d5ff';
        ctx.fillRect(solidNightStart * PIXELS_PER_HOUR, 0, (endIdx - solidNightStart) * PIXELS_PER_HOUR + 1.5, h);
    }

    if (state.hourlyData.length > 0) {
        const startTime = state.hourlyData[0].time;
        const sortedDates = Object.keys(state.sunData).sort();
        for (let i = 0; i < sortedDates.length; i++) {
            const currentSun = state.sunData[sortedDates[i]];
            const nextSun = state.sunData[sortedDates[i+1]];

            if (nextSun) {
                const midpoint = (currentSun.sunset + nextSun.sunrise) / 2;
                const x = ((midpoint - startTime) / 3600000) * PIXELS_PER_HOUR;
                if (x >= viewX - 50 && x <= viewX + viewW + 50) {
                    drawMoon(ctx, x, h * 0.25, '#f5f5f5', '#90caf9');
                }
            }
        }
    }
}

export function drawNightShadow(ctx, viewX, viewW, h, PIXELS_PER_HOUR) {
    const startIdx = Math.max(0, Math.floor(viewX / PIXELS_PER_HOUR) - 5);
    const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / PIXELS_PER_HOUR) + 5);

    let solidNightStart = -1;

    for (let i = startIdx; i < endIdx; i++) {
        const d = state.hourlyData[i];
        if (d.isNight) {
            const prevIsDay = i > 0 && !state.hourlyData[i-1].isNight;
            const nextIsDay = i < state.hourlyData.length - 1 && !state.hourlyData[i+1].isNight;
            const x = i * PIXELS_PER_HOUR;
            const w = PIXELS_PER_HOUR;

            if (prevIsDay) {
                if (solidNightStart !== -1) {
                    ctx.fillStyle = 'rgba(0, 0, 20, 0.15)';
                    ctx.fillRect(solidNightStart * PIXELS_PER_HOUR, 0, x - solidNightStart * PIXELS_PER_HOUR, h);
                    solidNightStart = -1;
                }
                const grad = ctx.createLinearGradient(x, 0, x + w, 0);
                grad.addColorStop(0, 'rgba(0, 0, 20, 0)');
                grad.addColorStop(1, 'rgba(0, 0, 20, 0.15)');
                ctx.fillStyle = grad;
                ctx.fillRect(x, 0, w, h);
            } else if (nextIsDay) {
                if (solidNightStart !== -1) {
                    ctx.fillStyle = 'rgba(0, 0, 20, 0.15)';
                    ctx.fillRect(solidNightStart * PIXELS_PER_HOUR, 0, x - solidNightStart * PIXELS_PER_HOUR, h);
                    solidNightStart = -1;
                }
                const grad = ctx.createLinearGradient(x, 0, x + w, 0);
                grad.addColorStop(0, 'rgba(0, 0, 20, 0.15)');
                grad.addColorStop(1, 'rgba(0, 0, 20, 0)');
                ctx.fillStyle = grad;
                ctx.fillRect(x, 0, w, h);
            } else {
                if (solidNightStart === -1) {
                    solidNightStart = i;
                }
            }
        } else {
            if (solidNightStart !== -1) {
                ctx.fillStyle = 'rgba(0, 0, 20, 0.15)'; 
                ctx.fillRect(solidNightStart * PIXELS_PER_HOUR, 0, (i * PIXELS_PER_HOUR) - (solidNightStart * PIXELS_PER_HOUR), h);
                solidNightStart = -1;
            }
        }
    }

    if (solidNightStart !== -1) {
        ctx.fillStyle = 'rgba(0, 0, 20, 0.15)';
        ctx.fillRect(solidNightStart * PIXELS_PER_HOUR, 0, (endIdx * PIXELS_PER_HOUR) - (solidNightStart * PIXELS_PER_HOUR), h);
    }
}
