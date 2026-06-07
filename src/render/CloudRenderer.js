import { state } from '../store.js';
import { getAtmosphericColor } from '../data/atmosphericPalettes.js';

export function drawClouds(ctx, viewX, viewW, h, styles, PIXELS_PER_HOUR) {
    const startIdx = Math.max(0, Math.floor(viewX / PIXELS_PER_HOUR) - 5);
    const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / PIXELS_PER_HOUR) + 5);

    const points = [];
    for (let i = startIdx; i < endIdx; i++) {
        const d = state.hourlyData[i];
        if (!d) continue;
        points.push({
            x: i * PIXELS_PER_HOUR,
            y: h - (h * (d.clouds / 100)),
            val: d.clouds
        });
    }

    if (points.length < 2) return;

    const addSmoothPathTo = (pathCtx, offset = 0, firstMove = true) => {
        if (firstMove) pathCtx.moveTo(points[0].x, points[0].y + offset);

        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            const cx = (p1.x + p2.x) / 2;
            pathCtx.bezierCurveTo(cx, p1.y + offset, cx, p2.y + offset, p2.x, p2.y + offset);
        }
    };

    const cloudPath = new Path2D();
    cloudPath.moveTo(points[0].x, h);
    cloudPath.lineTo(points[0].x, points[0].y);
    addSmoothPathTo(cloudPath, 0, false);
    cloudPath.lineTo(points[points.length-1].x, h);
    cloudPath.closePath();

    ctx.save();
    ctx.clip(cloudPath);

    const minX = points[0].x;
    const maxX = points[points.length - 1].x;
    const globalGrad = ctx.createLinearGradient(minX, 0, maxX, 0);

    points.forEach(p => {
        const stop = (p.x - minX) / (maxX - minX || 1);
        const safeStop = Math.max(0, Math.min(1, stop));
        const density = p.val / 100;
        let r, g, b, a;
        if (density <= 0.33) { const c = getAtmosphericColor('cloudFill.light'); r = c.r; g = c.g; b = c.b; a = c.a; }
        else if (density <= 0.66) { const c = getAtmosphericColor('cloudFill.medium'); r = c.r; g = c.g; b = c.b; a = c.a; }
        else { const c = getAtmosphericColor('cloudFill.heavy'); r = c.r; g = c.g; b = c.b; a = c.a; }
        globalGrad.addColorStop(safeStop, `rgba(${r}, ${g}, ${b}, ${a})`);
    });

    ctx.fillStyle = globalGrad;
    ctx.fillRect(minX, 0, maxX - minX, h);

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.45;

    const layers = getAtmosphericColor('cloudLayers');

    layers.forEach(layer => {
        ctx.lineWidth = layer.width;
        ctx.strokeStyle = layer.color;
        ctx.beginPath();
        addSmoothPathTo(ctx, layer.offset);
        ctx.stroke();
    });

    ctx.restore();
    ctx.restore();

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';

    const strokeGrad = ctx.createLinearGradient(minX, 0, maxX, 0);
    points.forEach(p => {
        const stop = (p.x - minX) / (maxX - minX || 1);
        const safeStop = Math.max(0, Math.min(1, stop));
        const density = p.val / 100;
        let r, g, b;
        if (density <= 0.33) { const c = getAtmosphericColor('cloudStroke.light'); r = c.r; g = c.g; b = c.b; }
        else if (density <= 0.66) { const c = getAtmosphericColor('cloudStroke.medium'); r = c.r; g = c.g; b = c.b; }
        else { const c = getAtmosphericColor('cloudStroke.heavy'); r = c.r; g = c.g; b = c.b; }
        strokeGrad.addColorStop(safeStop, `rgba(${r}, ${g}, ${b}, 1)`);
    });

    ctx.strokeStyle = strokeGrad;
    ctx.shadowOffsetY = 1;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    addSmoothPathTo(ctx);
    ctx.stroke();
    ctx.restore();
}
