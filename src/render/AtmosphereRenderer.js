import { state } from '../store.js';
import { getThemeColor } from '../theme.js';
export { drawClouds } from './CloudRenderer.js';
export { drawPrecipitationProbability } from './PrecipProbabilityRenderer.js';

function drawRain(ctx, x, bw, barY, strokeColor, idx) {
    const dropIcon = 'water_drop';
    ctx.font = '10px "Material Symbols Outlined"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    const dropCount = 3;
    for (let k = 0; k < dropCount; k++) {
        const dropX = x + (bw / (dropCount + 1)) * (k + 1);
        const yJitter = ((idx * 7 + k * 13) % 10) - 5;
        const dropY = barY + 4 + yJitter;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.strokeText(dropIcon, dropX, dropY);

        ctx.fillStyle = strokeColor;
        ctx.shadowColor = 'rgba(13, 71, 161, 0.4)';
        ctx.shadowBlur = 1;
        ctx.fillText(dropIcon, dropX, dropY);
    }
}

function drawSnow(ctx, x, bw, barY) {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (let k = 0; k < 4; k++) {
        const sx = x + bw * 0.15 + k * (bw * 0.25);
        const sy = barY + ((k * 17) % 15) - 5;
        const flakeSize = 2.5 + ((k * 11) % 2);
        ctx.beginPath();
        ctx.moveTo(sx - flakeSize, sy); ctx.lineTo(sx + flakeSize, sy);
        ctx.moveTo(sx, sy - flakeSize); ctx.lineTo(sx, sy + flakeSize);
        ctx.moveTo(sx - flakeSize*0.7, sy - flakeSize*0.7); ctx.lineTo(sx + flakeSize*0.7, sy + flakeSize*0.7);
        ctx.moveTo(sx - flakeSize*0.7, sy + flakeSize*0.7); ctx.lineTo(sx + flakeSize*0.7, sy - flakeSize*0.7);
        ctx.stroke();
    }

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = 2;
    for (let k = 0; k < 4; k++) {
        const sx = x + bw * 0.15 + k * (bw * 0.25);
        const sy = barY + ((k * 17) % 15) - 5;
        const flakeSize = 2.5 + ((k * 11) % 2);
        ctx.beginPath();
        ctx.moveTo(sx - flakeSize, sy); ctx.lineTo(sx + flakeSize, sy);
        ctx.moveTo(sx, sy - flakeSize); ctx.lineTo(sx, sy + flakeSize);
        ctx.moveTo(sx - flakeSize*0.7, sy - flakeSize*0.7); ctx.lineTo(sx + flakeSize*0.7, sy + flakeSize*0.7);
        ctx.moveTo(sx - flakeSize*0.7, sy + flakeSize*0.7); ctx.lineTo(sx + flakeSize*0.7, sy - flakeSize*0.7);
        ctx.stroke();
    }
}

function drawThunder(ctx, x, bw, barY) {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    for (let k = 0; k < 2; k++) {
        const lx = x + bw * 0.3 + k * (bw * 0.4);
        const ly = barY + ((k * 13) % 10) - 5;
        ctx.beginPath();
        ctx.moveTo(lx, ly); ctx.lineTo(lx - 3, ly + 6);
        ctx.lineTo(lx + 2, ly + 5); ctx.lineTo(lx - 2, ly + 12);
        ctx.stroke();
    }

    ctx.strokeStyle = '#fde047';
    ctx.shadowColor = 'rgba(253, 224, 71, 0.8)';
    ctx.shadowBlur = 6;
    ctx.lineWidth = 2.0;
    for (let k = 0; k < 2; k++) {
        const lx = x + bw * 0.3 + k * (bw * 0.4);
        const ly = barY + ((k * 13) % 10) - 5;
        ctx.beginPath();
        ctx.moveTo(lx, ly); ctx.lineTo(lx - 3, ly + 6);
        ctx.lineTo(lx + 2, ly + 5); ctx.lineTo(lx - 2, ly + 12);
        ctx.stroke();
    }
}

export function drawPrecipitation(ctx, viewX, viewW, h, styles, PIXELS_PER_HOUR, PIXELS_PER_MM) {
    const startIdx = Math.max(0, Math.floor(viewX / PIXELS_PER_HOUR) - 5);
    const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / PIXELS_PER_HOUR) + 5);

    const maxH = h * 0.9;
    for (let i = startIdx; i < endIdx; i++) {
        const d = state.hourlyData[i];
        if (d.precip > 0) {
            const barH = d.precip * PIXELS_PER_MM;
            const x = i * PIXELS_PER_HOUR + 5;
            const bw = PIXELS_PER_HOUR - 10;

            const isSnow = [71, 73, 75, 77, 85, 86].includes(d.weatherCode);
            const isThunder = [95, 96, 99].includes(d.weatherCode);

            const baseColor = isSnow ? (state.theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(148, 163, 184, 0.4)') :
                            isThunder ? 'rgba(57, 73, 171, 0.4)' :
                            getThemeColor('precipBar', 'rgba(13, 71, 161, 0.4)');

            const strokeColor = isSnow ? (state.theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(100, 116, 139, 0.8)') :
                              isThunder ? 'rgba(57, 73, 171, 0.8)' :
                              'rgba(13, 71, 161, 0.8)';

            ctx.fillStyle = baseColor;
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 1;

            const drawH = Math.min(maxH, barH);
            const barY = h - drawH;

            const grad = ctx.createLinearGradient(0, barY, 0, Math.min(h, barY + 30));
            const colorParts = baseColor.match(/[\d.]+/g);
            const R = colorParts[0], G = colorParts[1], B = colorParts[2], A = colorParts[3];
            const semiTransparentBase = `rgba(${R}, ${G}, ${B}, ${Math.max(0.1, A * 0.4)})`;

            grad.addColorStop(0, semiTransparentBase);
            grad.addColorStop(1, baseColor);

            ctx.fillStyle = grad;

            ctx.beginPath();
            ctx.moveTo(x, h);
            ctx.lineTo(x, barY);
            ctx.lineTo(x + bw, barY);
            ctx.lineTo(x + bw, h);
            ctx.fill();

            const strokeColorParts = strokeColor.match(/[\d.]+/g);
            const sR = strokeColorParts[0], sG = strokeColorParts[1], sB = strokeColorParts[2], sA = strokeColorParts[3];
            const semiTransparentStroke = `rgba(${sR}, ${sG}, ${sB}, ${Math.max(0.3, Number(sA) * 0.5)})`;

            const strokeGrad = ctx.createLinearGradient(0, barY, 0, Math.min(h, barY + 30));
            strokeGrad.addColorStop(0, semiTransparentStroke);
            strokeGrad.addColorStop(1, strokeColor);

            ctx.strokeStyle = strokeGrad;

            ctx.beginPath();
            ctx.moveTo(x, h);
            ctx.lineTo(x, barY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + bw, h);
            ctx.lineTo(x + bw, barY);
            ctx.stroke();

            ctx.save();
            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (isSnow) {
                drawSnow(ctx, x, bw, barY);
            } else if (isThunder) {
                drawThunder(ctx, x, bw, barY);
            } else {
                drawRain(ctx, x, bw, barY, strokeColor, i);
            }
            ctx.restore();

            if (barH > maxH) {
                ctx.save();
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.beginPath();
                const zy = h - maxH + 15;
                ctx.moveTo(x, zy);
                ctx.lineTo(x + bw/4, zy - 5);
                ctx.lineTo(x + bw*3/4, zy + 5);
                ctx.lineTo(x + bw, zy);
                ctx.stroke();
                ctx.restore();
            }
        }
    }
}
