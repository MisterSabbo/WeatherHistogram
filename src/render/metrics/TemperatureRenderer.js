import { state } from '../../store.js';
import { getThemeColor, getThemeFont } from '../../theme.js';
import { normalizeY } from '../../utils/math.js';

export function drawTemperature(ctx, viewX, viewW, h, styles, PIXELS_PER_HOUR) {
    const color = getThemeColor('tempLine', '#D94040');
    const textColor = '#1a1a1a';

    const startIdx = Math.max(0, Math.floor(viewX / PIXELS_PER_HOUR) - 5);
    const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / PIXELS_PER_HOUR) + 5);

    // Sombreado entre temperatura y sensación térmica
    for (let i = startIdx; i < Math.min(endIdx, state.hourlyData.length - 1); i++) {
        const d = state.hourlyData[i];
        const nextD = state.hourlyData[i+1];
        const diff1 = Math.abs(d.temp - d.apparent);
        const diff2 = Math.abs(nextD.temp - nextD.apparent);

        if (diff1 >= 1 || diff2 >= 1) {
            const isCold = diff1 >= Math.max(1, diff2) ? (d.apparent < d.temp) : (nextD.apparent < nextD.temp);
            ctx.fillStyle = isCold ? 'rgba(74, 159, 217, 0.2)' : 'rgba(232, 115, 74, 0.2)';

            const x1 = i * PIXELS_PER_HOUR;
            const x2 = (i + 1) * PIXELS_PER_HOUR;

            const y1_t = normalizeY(d.temp, -20, 40, h);
            const y1_a = normalizeY(diff1 >= 1 ? d.apparent : d.temp, -20, 40, h);

            const y2_t = normalizeY(nextD.temp, -20, 40, h);
            const y2_a = normalizeY(diff2 >= 1 ? nextD.apparent : nextD.temp, -20, 40, h);

            ctx.beginPath();
            ctx.moveTo(x1, y1_t);
            ctx.lineTo(x2, y2_t);
            ctx.lineTo(x2, y2_a);
            ctx.lineTo(x1, y1_a);
            ctx.closePath();
            ctx.fill();
        }
    }

    // Apparent Temperature Line
    ctx.lineWidth = 1.5;

    for (let i = startIdx; i < Math.min(endIdx, state.hourlyData.length - 1); i++) {
        const d = state.hourlyData[i];
        const nextD = state.hourlyData[i+1];

        const diff1 = Math.abs(d.temp - d.apparent);
        const diff2 = Math.abs(nextD.temp - nextD.apparent);

        const shouldDraw = diff1 >= 1 || diff2 >= 1;

        if (shouldDraw) {
            const isCold = diff1 >= Math.max(1, diff2) ? (d.apparent < d.temp) : (nextD.apparent < nextD.temp);

            const x1 = i * PIXELS_PER_HOUR;
            const y1 = normalizeY(diff1 >= 1 ? d.apparent : d.temp, -20, 40, h);

            const x2 = (i + 1) * PIXELS_PER_HOUR;
            const y2 = normalizeY(diff2 >= 1 ? nextD.apparent : nextD.temp, -20, 40, h);

            const avgY = (y1 + y2) / 2;
            const cloudY = h - (h * (d.clouds / 100));
            const nextCloudY = h - (h * (nextD.clouds / 100));
            const avgCloudY = (cloudY + nextCloudY) / 2;

            const probY = h - (h * ((d.precipProb || 0) / 100));
            const nextProbY = h - (h * ((nextD.precipProb || 0) / 100));
            const avgProbY = (probY + nextProbY) / 2;

            const avgClouds = (d.clouds + nextD.clouds) / 2;
            const avgProb = ((d.precipProb || 0) + (nextD.precipProb || 0)) / 2;

            const isWet = avgY >= avgProbY && avgProb > 15;
            const isCloudy = avgY >= avgCloudY && avgClouds >= 25;

            // 1. Dibujado de Efectos Continuos (Glow/Sombra)
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);

            let sCol = '';
            let sBlur = 0;
            let sOffY = 0;

            if (isWet) {
                sCol = 'rgba(30, 144, 200, 0.3)';
                sBlur = 20;
                sOffY = 2;
            } else if (isCloudy) {
                sCol = 'rgba(0, 0, 0, 0.2)';
                sBlur = 30;
                sOffY = 8;
            }

            if (sCol) {
                ctx.shadowColor = sCol;
                ctx.shadowBlur = sBlur;
                ctx.shadowOffsetY = sOffY;
                ctx.strokeStyle = sCol.replace(/[\d.]+\)$/, '0.05)');
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            ctx.restore();

            // 2. Draw the Dotted Line
            ctx.save();
            ctx.setLineDash([4, 4]);

            if (!isWet && !isCloudy) {
                if (d.isNight) {
                    ctx.strokeStyle = isCold ? '#4A9FD9' : 'rgba(232, 115, 74, 0.9)';
                } else {
                    ctx.strokeStyle = isCold ? '#4A9FD9' : 'rgba(232, 115, 74, 1)';
                }
            } else {
                ctx.strokeStyle = isCold ? '#4A9FD9' : '#E8734A';
            }

            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            if (isWet) {
                ctx.setLineDash([]);
                ctx.strokeStyle = 'rgba(30, 144, 200, 0.4)';
                ctx.lineWidth = 0.8;
                ctx.stroke();
            }

            ctx.restore();
        }
    }

    // Base temperature line
    ctx.save();
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = startIdx; i < endIdx - 1; i++) {
        const d = state.hourlyData[i];
        const nextD = state.hourlyData[i+1];
        const x1 = i * PIXELS_PER_HOUR;
        const y1 = normalizeY(d.temp, -20, 40, h);
        const x2 = (i + 1) * PIXELS_PER_HOUR;
        const y2 = normalizeY(nextD.temp, -20, 40, h);

        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    for (let i = startIdx; i < endIdx - 1; i++) {
        const d = state.hourlyData[i];
        const nextD = state.hourlyData[i+1];

        const x1 = i * PIXELS_PER_HOUR;
        const y1 = normalizeY(d.temp, -20, 40, h);
        const x2 = (i + 1) * PIXELS_PER_HOUR;
        const y2 = normalizeY(nextD.temp, -20, 40, h);

        const cloudY1 = h - (h * (d.clouds / 100));
        const cloudY2 = h - (h * (nextD.clouds / 100));

        const probY1 = h - (h * ((d.precipProb || 0) / 100));
        const probY2 = h - (h * ((nextD.precipProb || 0) / 100));

        const isWet1 = y1 >= probY1 && (d.precipProb || 0) > 15;
        const isWet2 = y2 >= probY2 && (nextD.precipProb || 0) > 15;

        const isCloudy1 = y1 >= cloudY1 && d.clouds >= 25;
        const isCloudy2 = y2 >= cloudY2 && nextD.clouds >= 25;

        const isClear1 = !isWet1 && !isCloudy1;
        const isClear2 = !isWet2 && !isCloudy2;

        const isThunder1 = [95, 96, 99].includes(d.weatherCode);
        const isThunder2 = [95, 96, 99].includes(nextD.weatherCode);

        const isSnow1 = [71, 73, 75, 77, 85, 86].includes(d.weatherCode);
        const isSnow2 = [71, 73, 75, 77, 85, 86].includes(nextD.weatherCode);

        // Sunlight Glow
        if (isClear1 || isClear2) {
            const isMobile = window.innerWidth < 600;

            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);

            ctx.shadowColor = d.isNight ? '#C8D6E5' : '#FF9F43';
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = isMobile ? (d.isNight ? 24 : 20) : (d.isNight ? 30 : 25);
            ctx.stroke();
            if (d.isNight) ctx.stroke();
            ctx.shadowBlur = isMobile ? (d.isNight ? 12 : 12) : (d.isNight ? 16 : 14);
            ctx.stroke();
            if (d.isNight) ctx.stroke();
            ctx.restore();
        }

        // Cloudy shadow overlay
        if ((isCloudy1 || isCloudy2) && (!isWet1 && !isWet2)) {
            const gradD = ctx.createLinearGradient(x1, y1, x2, y2);
            gradD.addColorStop(0, isCloudy1 ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0)');
            gradD.addColorStop(1, isCloudy2 ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0)');

            const gradL = ctx.createLinearGradient(x1, y1, x2, y2);
            gradL.addColorStop(0, isCloudy1 ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0)');
            gradL.addColorStop(1, isCloudy2 ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0)');

            ctx.save();

            ctx.strokeStyle = gradL;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x1, y1 - 1.5);
            ctx.lineTo(x2, y2 - 1.5);
            ctx.stroke();

            ctx.strokeStyle = gradD;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x1, y1 + 1.5);
            ctx.lineTo(x2, y2 + 1.5);
            ctx.stroke();

            ctx.strokeStyle = gradD;
            ctx.lineWidth = 3;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetY = 4;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            ctx.restore();
        }

        // Wet overlay (Rain or Snow)
        if (isWet1 || isWet2) {
            const hasSnow = (isSnow1 && isWet1) || (isSnow2 && isWet2);

            const grad = ctx.createLinearGradient(x1, y1, x2, y2);

            if (hasSnow) {
                grad.addColorStop(0, isWet1 && isSnow1 ? 'rgba(200, 215, 230, 0.7)' : 'rgba(200, 215, 230, 0)');
                grad.addColorStop(1, isWet2 && isSnow2 ? 'rgba(200, 215, 230, 0.7)' : 'rgba(200, 215, 230, 0)');
            } else {
                grad.addColorStop(0, isWet1 ? 'rgba(30, 144, 200, 0.45)' : 'rgba(30, 144, 200, 0)');
                grad.addColorStop(1, isWet2 ? 'rgba(30, 144, 200, 0.45)' : 'rgba(30, 144, 200, 0)');
            }

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineWidth = hasSnow ? 5 : 7;
            ctx.strokeStyle = grad;
            ctx.lineCap = 'round';

            if (hasSnow) {
                ctx.setLineDash([2, 4]);
                ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
                ctx.shadowBlur = 4;
            }

            ctx.stroke();
            ctx.restore();

            if (hasSnow) {
                const innerGrad = ctx.createLinearGradient(x1, y1, x2, y2);
                innerGrad.addColorStop(0, isWet1 && isSnow1 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0)');
                innerGrad.addColorStop(1, isWet2 && isSnow2 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0)');

                ctx.save();
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.lineWidth = 2;
                ctx.strokeStyle = innerGrad;
                ctx.lineCap = 'round';
                ctx.stroke();
                ctx.restore();
            }
        }

        // Thunder electricity effect
        if ((isThunder1 && isWet1) || (isThunder2 && isWet2)) {
            ctx.save();
            ctx.beginPath();
            const dx = x2 - x1;
            const dy = y2 - y1;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const steps = Math.floor(dist / 4);
            const tOffset = (Date.now() / 150) % (Math.PI * 2);

            for (let j = 0; j <= steps; j++) {
                const t = j / steps;
                const cx = x1 + dx * t;
                const cy = y1 + dy * t;
                const perpX = -dy / dist;
                const perpY = dx / dist;
                const phase = t * Math.PI * 15 + tOffset;
                const amp = Math.sin(phase) * 3;
                if(j===0) ctx.moveTo(cx, cy);
                else ctx.lineTo(cx + perpX * amp, cy + perpY * amp);
            }

            const grad = ctx.createLinearGradient(x1, y1, x2, y2);
            grad.addColorStop(0, (isThunder1 && isWet1) ? 'rgba(253, 224, 71, 0.9)' : 'rgba(253, 224, 71, 0)');
            grad.addColorStop(1, (isThunder2 && isWet2) ? 'rgba(253, 224, 71, 0.9)' : 'rgba(253, 224, 71, 0)');

            ctx.lineWidth = 1.5;
            ctx.strokeStyle = grad;
            ctx.shadowColor = 'rgba(253, 224, 71, 0.8)';
            ctx.shadowBlur = 6;
            ctx.stroke();
            ctx.restore();
        }
    }
    ctx.restore();

    // Puntos y valores
    ctx.font = `bold 10px ${getThemeFont()}`;
    ctx.textAlign = 'center';
    for (let i = startIdx; i < endIdx; i++) {
        const d = state.hourlyData[i];
        const x = i * PIXELS_PER_HOUR;
        const y = normalizeY(d.temp, -20, 40, h);

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
        ctx.shadowBlur = 5;
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.strokeText(Math.round(d.temp) + '\u00b0', x, y - 10);

        ctx.fillStyle = textColor;
        ctx.fillText(Math.round(d.temp) + '\u00b0', x, y - 10);
        ctx.restore();
    }
}
