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
        const luma = Math.round(255 - (p.val / 100) * 115);
        globalGrad.addColorStop(safeStop, `rgba(${luma}, ${luma}, ${luma + 10}, 0.7)`);
    });

    ctx.fillStyle = globalGrad;
    ctx.fillRect(minX, 0, maxX - minX, h);

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.45;

    const layers = [
        { offset: 5, width: 4, color: 'rgba(255, 255, 255, 0.3)' },
        { offset: 12, width: 8, color: 'rgba(255, 255, 255, 0.2)' },
        { offset: 25, width: 15, color: 'rgba(255, 255, 255, 0.1)' },
        { offset: 45, width: 22, color: 'rgba(0, 0, 0, 0.05)' },
        { offset: 65, width: 30, color: 'rgba(0, 0, 0, 0.03)' }
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
        const luma = Math.round(230 - (p.val / 100) * 110);
        strokeGrad.addColorStop(safeStop, `rgba(${luma}, ${luma}, ${luma + 5}, 1)`);
    });

    ctx.strokeStyle = strokeGrad;
    ctx.shadowOffsetY = 1;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    addSmoothPathTo(ctx);
    ctx.stroke();
    ctx.restore();
}
