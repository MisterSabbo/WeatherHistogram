import { state } from '../store.js';
import { getThemeColor } from '../theme.js';
import { drawMoon } from './MoonRenderer.js';
export { drawSunMarkersOnCanvas } from './SunMarkers.js';

export function drawWeatherPhenomena(ctx, viewX, viewW, h, PIXELS_PER_HOUR) {
    const startIdx = Math.max(0, Math.floor(viewX / PIXELS_PER_HOUR) - 2);
    const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / PIXELS_PER_HOUR) + 2);

    for (let i = startIdx; i < endIdx; i++) {
        const d = state.hourlyData[i];
        const x = i * PIXELS_PER_HOUR;

        if (d.gusts > 35) {
            ctx.save();
            
            let color = '#6B8DAD';
            if (d.gusts > 70) {
                color = '#D94040';
            } else if (d.gusts > 50) {
                color = '#E8734A';
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
        const x = Math.sin(seed * 9.9898) * 43758.5453;
        return x - Math.floor(x);
    };

    for (let i = startIdx; i < endIdx; i++) {
        const d = state.hourlyData[i];
        if (d.isNight) {
            const xOffset = i * PIXELS_PER_HOUR;
            for (let s = 0; s < 12; s++) { 
                const seed = i * 100 + s;
                const sx = xOffset + rand(seed) * PIXELS_PER_HOUR;
                const sy = rand(seed + 1) * h * 0.85; // Stars up to 85% of height (was 0.5)
                const sSize = rand(seed + 2) * 1.5 + 0.5;
                
                const alpha = rand(seed + 3) * 0.8 + 0.2;
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

export function drawUVSegments(ctx, viewX, viewW, h, PIXELS_PER_HOUR) {
    const startIdx = Math.max(0, Math.floor(viewX / PIXELS_PER_HOUR) - 2);
    const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / PIXELS_PER_HOUR) + 2);

    for (let i = startIdx; i < endIdx; i++) {
        const d = state.hourlyData[i];
        if (d.uv > 0 && !d.isNight) {
            const x = i * PIXELS_PER_HOUR;
            
            let uvColor;
            if (d.uv >= 11) uvColor = getThemeColor('uvLevels.extreme', '#8E44AD');
            else if (d.uv >= 8) uvColor = getThemeColor('uvLevels.veryHigh', '#D94040');
            else if (d.uv >= 6) uvColor = getThemeColor('uvLevels.high', '#F57C00');
            else if (d.uv >= 3) uvColor = getThemeColor('uvLevels.moderate', '#FBC02D');
            else uvColor = getThemeColor('uvLevels.low', '#4CAF50');

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
    const skyColor = '#FEF0A8'; 
    const sunColor = '#FDD835';
    const rayColor = '#FFF59D';

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
    grad.addColorStop(0, 'rgba(254, 240, 168, 0.3)');
    grad.addColorStop(1, 'rgba(254, 240, 168, 0)');
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
                    ctx.fillStyle = '#1A2744';
                    ctx.fillRect(solidNightStart * PIXELS_PER_HOUR, 0, (i - solidNightStart) * PIXELS_PER_HOUR + 1.5, h);
                    solidNightStart = -1;
                }
                const grad = ctx.createLinearGradient(x, 0, x + w + 0.5, 0);
                grad.addColorStop(0, '#FEF0A8');
                grad.addColorStop(0.5, '#FFDDBA');
                grad.addColorStop(1, '#1A2744');
                ctx.fillStyle = grad;
                ctx.fillRect(x, 0, w + 0.5, h);
            } else if (nextIsDay) {
                if (solidNightStart !== -1) {
                    ctx.fillStyle = '#1A2744';
                    ctx.fillRect(solidNightStart * PIXELS_PER_HOUR, 0, (i - solidNightStart) * PIXELS_PER_HOUR + 1.5, h);
                    solidNightStart = -1;
                }
                const grad = ctx.createLinearGradient(x, 0, x + w + 0.5, 0);
                grad.addColorStop(0, '#1A2744');
                grad.addColorStop(0.5, '#FFDDBA');
                grad.addColorStop(1, '#FEF0A8');
                ctx.fillStyle = grad;
                ctx.fillRect(x, 0, w + 0.5, h);
            } else {
                if (solidNightStart === -1) {
                    solidNightStart = i;
                }
            }
        } else {
            if (solidNightStart !== -1) {
                ctx.fillStyle = '#1A2744'; 
                ctx.fillRect(solidNightStart * PIXELS_PER_HOUR, 0, (i - solidNightStart) * PIXELS_PER_HOUR + 1.5, h);
                solidNightStart = -1;
            }
        }
    }

    if (solidNightStart !== -1) {
        ctx.fillStyle = '#1A2744';
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
                    drawMoon(ctx, x, h * 0.25, '#F5F5F5', 'rgba(144, 202, 249, 0.20)');
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
                    ctx.fillStyle = 'rgba(26, 39, 68, 0.15)';
                    ctx.fillRect(solidNightStart * PIXELS_PER_HOUR, 0, x - solidNightStart * PIXELS_PER_HOUR, h);
                    solidNightStart = -1;
                }
                const grad = ctx.createLinearGradient(x, 0, x + w, 0);
                grad.addColorStop(0, 'rgba(26, 39, 68, 0)');
                grad.addColorStop(1, 'rgba(26, 39, 68, 0.15)');
                ctx.fillStyle = grad;
                ctx.fillRect(x, 0, w, h);
            } else if (nextIsDay) {
                if (solidNightStart !== -1) {
                    ctx.fillStyle = 'rgba(26, 39, 68, 0.15)';
                    ctx.fillRect(solidNightStart * PIXELS_PER_HOUR, 0, x - solidNightStart * PIXELS_PER_HOUR, h);
                    solidNightStart = -1;
                }
                const grad = ctx.createLinearGradient(x, 0, x + w, 0);
                grad.addColorStop(0, 'rgba(26, 39, 68, 0.15)');
                grad.addColorStop(1, 'rgba(26, 39, 68, 0)');
                ctx.fillStyle = grad;
                ctx.fillRect(x, 0, w, h);
            } else {
                if (solidNightStart === -1) {
                    solidNightStart = i;
                }
            }
        } else {
            if (solidNightStart !== -1) {
                ctx.fillStyle = 'rgba(26, 39, 68, 0.15)'; 
                ctx.fillRect(solidNightStart * PIXELS_PER_HOUR, 0, (i * PIXELS_PER_HOUR) - (solidNightStart * PIXELS_PER_HOUR), h);
                solidNightStart = -1;
            }
        }
    }

    if (solidNightStart !== -1) {
        ctx.fillStyle = 'rgba(26, 39, 68, 0.15)';
        ctx.fillRect(solidNightStart * PIXELS_PER_HOUR, 0, (endIdx * PIXELS_PER_HOUR) - (solidNightStart * PIXELS_PER_HOUR), h);
    }
}
