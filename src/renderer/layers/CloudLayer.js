import { state } from '../../core/Store.js';
import { getThemeColor, getThemeFont, getThemeIcon } from '../../services/ThemeManager.js';
import { normalizeY, hexToRgb } from '../../utils/math.js';

export class CloudLayer {
    constructor() {}

    render(ctx, viewX, viewW, h, styles) {
        this.drawClouds(ctx, viewX, viewW, h, styles);
    }

    drawClouds(ctx, viewX, viewW, h, styles) {
                const startIdx = Math.max(0, Math.floor(viewX / state.pixelsPerHour) - 5);
                const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / state.pixelsPerHour) + 5);
    
                const points = [];
                for (let i = startIdx; i < endIdx; i++) {
                    const d = state.hourlyData[i];
                    if (!d) continue;
                    points.push({
                        x: i * state.pixelsPerHour,
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
    
                // Relleno suave con un único gradiente global para evitar líneas verticales
                ctx.save();
                ctx.clip(cloudPath);
                
                const minX = points[0].x;
                const maxX = points[points.length - 1].x;
                const globalGrad = ctx.createLinearGradient(minX, 0, maxX, 0);
                
                points.forEach(p => {
                    const stop = (p.x - minX) / (maxX - minX || 1);
                    const safeStop = Math.max(0, Math.min(1, stop));
                    const luma = Math.round(255 - (p.val / 100) * 155);
                    globalGrad.addColorStop(safeStop, `rgba(${luma}, ${luma}, ${luma + 10}, 0.7)`);
                });
    
                ctx.fillStyle = globalGrad;
                ctx.fillRect(minX, 0, maxX - minX, h);
                
                // Efecto Volumen (Isóbaras más sutiles pero más capas)
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
    
                // Línea de contorno principal con color dinámico (gris claro/oscuro según nubosidad)
                ctx.save();
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.shadowBlur = 8;
                ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
                
                const strokeGrad = ctx.createLinearGradient(minX, 0, maxX, 0);
                points.forEach(p => {
                    const stop = (p.x - minX) / (maxX - minX || 1);
                    const safeStop = Math.max(0, Math.min(1, stop));
                    // Luma para la línea: un poco más oscura que el relleno para que resalte
                    const luma = Math.round(230 - (p.val / 100) * 150);
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

}
