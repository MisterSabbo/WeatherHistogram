import { state } from '../store.js';

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
        if (density <= 0.33) { r = 185; g = 180; b = 175; a = 0.40; }
        else if (density <= 0.66) { r = 155; g = 150; b = 145; a = 0.50; }
        else { r = 125; g = 120; b = 115; a = 0.60; }
        globalGrad.addColorStop(safeStop, `rgba(${r}, ${g}, ${b}, ${a})`);
    });

    ctx.fillStyle = globalGrad;
    ctx.fillRect(minX, 0, maxX - minX, h);

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.45;

    const layers = [
        { offset: 5, width: 4, color: 'rgba(195, 188, 182, 0.3)' },
        { offset: 12, width: 8, color: 'rgba(185, 180, 175, 0.2)' },
        { offset: 25, width: 15, color: 'rgba(155, 150, 145, 0.1)' },
        { offset: 45, width: 22, color: 'rgba(125, 120, 115, 0.05)' },
        { offset: 65, width: 30, color: 'rgba(125, 120, 115, 0.03)' }
    ];

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
        if (density <= 0.33) { r = 170; g = 165; b = 160; }
        else if (density <= 0.66) { r = 145; g = 140; b = 135; }
        else { r = 115; g = 110; b = 105; }
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
