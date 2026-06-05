import { state } from '../store.js';

export function drawPrecipitationProbability(ctx, viewX, viewW, h, styles, PIXELS_PER_HOUR) {
    const startIdx = Math.max(0, Math.floor(viewX / PIXELS_PER_HOUR) - 5);
    const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / PIXELS_PER_HOUR) + 5);

    const points = [];
    let hasProb = false;
    for (let i = startIdx; i < endIdx; i++) {
        const d = state.hourlyData[i];
        if (!d) continue;
        const p = d.precipProb || 0;
        if (p > 0) hasProb = true;
        points.push({
            x: i * PIXELS_PER_HOUR,
            y: h - (h * (p / 100)),
            code: d.weatherCode
        });
    }

    if (!hasProb || points.length < 2) return;

    const path = new Path2D();
    const fillPath = new Path2D();

    path.moveTo(points[0].x, points[0].y);
    fillPath.moveTo(points[0].x, h);
    fillPath.lineTo(points[0].x, points[0].y);

    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const cp1x = p1.x + (p2.x - p1.x) * 0.5;
        const cp2x = p1.x + (p2.x - p1.x) * 0.5;

        path.bezierCurveTo(cp1x, p1.y, cp2x, p2.y, p2.x, p2.y);
        fillPath.bezierCurveTo(cp1x, p1.y, cp2x, p2.y, p2.x, p2.y);
    }

    fillPath.lineTo(points[points.length - 1].x, h);
    fillPath.closePath();

    const minX = points[0].x;
    const maxX = points[points.length - 1].x;

    ctx.save();
    ctx.clip(fillPath);

    const hGrad = ctx.createLinearGradient(minX, 0, maxX, 0);
    points.forEach(p => {
        const isSnow = [71, 73, 75, 77, 85, 86].includes(p.code);
        const isThunder = [95, 96, 99].includes(p.code);
        let r = 30, g = 144, b = 200;
        if (isSnow) { r = 200; g = 215; b = 230; }
        else if (isThunder) { r = 100; g = 80; b = 160; }

        const stop = Math.max(0, Math.min(1, (p.x - minX) / (maxX - minX || 1)));
        hGrad.addColorStop(stop, `rgba(${r}, ${g}, ${b}, 0.12)`);
    });

    ctx.fillStyle = hGrad;
    ctx.fill(fillPath);
    ctx.restore();

    ctx.save();
    ctx.clip(fillPath);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '14px "Material Symbols Outlined"';
    ctx.globalAlpha = 0.15;

    const rand = (seed) => {
        const x = Math.sin(seed * 9.9898) * 43758.5453;
        return x - Math.floor(x);
    };

    points.forEach((p, index) => {
        if (p.x > minX && p.x < maxX && p.y < h - 20) {
            const isSnow = [71, 73, 75, 77, 85, 86].includes(p.code);
            const isThunder = [95, 96, 99].includes(p.code);

            for (let s = 0; s < 4; s++) {
                const seed = index * 10 + s;
                const rx = p.x + (rand(seed) - 0.5) * PIXELS_PER_HOUR;
                const ry = p.y + rand(seed + 1) * (h - p.y);

                if (ry > p.y + 10 && ry < h - 10) {
                    if (isSnow) {
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillText('ac_unit', rx, ry);
                    } else if (isThunder && s === 0) {
                        ctx.fillStyle = '#FDE047';
                        ctx.fillText('bolt', rx, ry);
                    } else {
                        ctx.beginPath();
                        ctx.strokeStyle = '#FFFFFF';
                        ctx.lineWidth = 1.5;
                        const len = 4 + rand(seed)*6;
                        ctx.moveTo(rx, ry);
                        ctx.lineTo(rx - len*0.4, ry + len);
                        ctx.stroke();
                    }
                }
            }
        }
    });
    ctx.restore();

    ctx.save();
    const strokeGrad = ctx.createLinearGradient(minX, 0, maxX, 0);
    points.forEach(p => {
        const isSnow = [71, 73, 75, 77, 85, 86].includes(p.code);
        const isThunder = [95, 96, 99].includes(p.code);
        let r = 30, g = 144, b = 200;
        if (isSnow) { r = 200; g = 215; b = 230; }
        else if (isThunder) { r = 100; g = 80; b = 160; }

        const stop = Math.max(0, Math.min(1, (p.x - minX) / (maxX - minX || 1)));
        strokeGrad.addColorStop(stop, `rgba(${r}, ${g}, ${b}, 0.75)`);
    });

    ctx.strokeStyle = strokeGrad;
    ctx.lineWidth = 1.5;
    ctx.stroke(path);
    ctx.restore();
}
