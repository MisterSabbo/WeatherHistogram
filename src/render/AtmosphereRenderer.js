import { state } from '../store.js';
import { getThemeColor } from '../theme.js';
import { normalizeY } from '../utils/math.js';

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
        const luma = Math.round(255 - (p.val / 100) * 115); // Increased brightness (was 155)
        globalGrad.addColorStop(safeStop, `rgba(${luma}, ${luma}, ${luma + 10}, 0.7)`); // Transparency restored to 0.7
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
        const luma = Math.round(230 - (p.val / 100) * 110); // Brighter stroke (was 150)
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

export function drawPrecipitation(ctx, viewX, viewW, h, styles, PIXELS_PER_HOUR, PIXELS_PER_MM) {
    const startIdx = Math.max(0, Math.floor(viewX / PIXELS_PER_HOUR) - 5);
    const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / PIXELS_PER_HOUR) + 5);

    const maxH = h * 0.9;
    for (let i = startIdx; i < endIdx; i++) {
        const d = state.hourlyData[i];
        if (d.precip > 0) {
            let barH = d.precip * PIXELS_PER_MM;
            const x = i * PIXELS_PER_HOUR + 5;
            const bw = PIXELS_PER_HOUR - 10;

            const isSnow = [71, 73, 75, 77, 85, 86].includes(d.weatherCode);
            const isThunder = [95, 96, 99].includes(d.weatherCode);
            
            let baseColor = isSnow ? (state.theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(148, 163, 184, 0.4)') : 
                            isThunder ? 'rgba(57, 73, 171, 0.4)' : 
                            getThemeColor('precipBar', 'rgba(13, 71, 161, 0.4)');
            
            let strokeColor = isSnow ? (state.theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(100, 116, 139, 0.8)') : 
                              isThunder ? 'rgba(57, 73, 171, 0.8)' : 
                              'rgba(13, 71, 161, 0.8)';

            ctx.fillStyle = baseColor;
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 1;

            let drawH = Math.min(maxH, barH);
            let barY = h - drawH;
            
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
            const semiTransparentStroke = `rgba(${sR}, ${sG}, ${sB}, ${Math.max(0.3, sA * 0.5)})`;

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
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 4;
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';
                for(let k = 0; k < 4; k++) {
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
                for(let k = 0; k < 4; k++) {
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
            } else if (isThunder) {
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 5;
                ctx.lineJoin = 'round';
                for(let k = 0; k < 2; k++) {
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
                for(let k = 0; k < 2; k++) {
                    const lx = x + bw * 0.3 + k * (bw * 0.4);
                    const ly = barY + ((k * 13) % 10) - 5;
                    ctx.beginPath();
                    ctx.moveTo(lx, ly); ctx.lineTo(lx - 3, ly + 6);
                    ctx.lineTo(lx + 2, ly + 5); ctx.lineTo(lx - 2, ly + 12);
                    ctx.stroke();
                }
            } else {
                const dropIcon = 'water_drop';
                ctx.font = '10px "Material Symbols Outlined"'; 
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                
                const dropCount = 3;
                for (let k = 0; k < dropCount; k++) {
                    const dropX = x + (bw / (dropCount + 1)) * (k + 1);
                    const yJitter = ((i * 7 + k * 13) % 10) - 5;
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

export function drawPrecipitationProbability(ctx, viewX, viewW, h, styles, PIXELS_PER_HOUR) {
    const startIdx = Math.max(0, Math.floor(viewX / PIXELS_PER_HOUR) - 5);
    const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / PIXELS_PER_HOUR) + 5);

    const isDark = state.theme === 'dark';
    
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

    // Horizontal smooth transition gradient
    const hGrad = ctx.createLinearGradient(minX, 0, maxX, 0);
    points.forEach(p => {
        const isSnow = [71, 73, 75, 77, 85, 86].includes(p.code);
        const isThunder = [95, 96, 99].includes(p.code);
        let r = 2, g = 136, b = 209; 
        if (isSnow) { r = 148; g = 163; b = 184; }
        else if (isThunder) { r = 94; g = 53; b = 177; }
        
        const stop = Math.max(0, Math.min(1, (p.x - minX) / (maxX - minX || 1)));
        hGrad.addColorStop(stop, `rgba(${r}, ${g}, ${b}, ${isDark ? 0.15 : 0.08})`);
    });

    ctx.fillStyle = hGrad;
    ctx.fill(fillPath);
    ctx.restore();

    // Draw the aesthetic background icons inside the filled curve area
    ctx.save();
    ctx.clip(fillPath);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '14px "Material Symbols Outlined"';
    ctx.globalAlpha = isDark ? 0.2 : 0.15;
    
    // Seeded random for natural icon scatter
    const rand = (seed) => {
        let x = Math.sin(seed * 9.9898) * 43758.5453;
        return x - Math.floor(x);
    };

    points.forEach((p, index) => {
        if (p.x > minX && p.x < maxX && p.y < h - 20) {
            const isSnow = [71, 73, 75, 77, 85, 86].includes(p.code);
            const isThunder = [95, 96, 99].includes(p.code);
            
            // Generate some particles
            for (let s = 0; s < 4; s++) {
                const seed = index * 10 + s;
                const rx = p.x + (rand(seed) - 0.5) * PIXELS_PER_HOUR;
                const ry = p.y + rand(seed + 1) * (h - p.y);
                
                if (ry > p.y + 10 && ry < h - 10) {
                    if (isSnow) {
                        ctx.fillStyle = isDark ? '#ffffff' : '#000000';
                        ctx.fillText('ac_unit', rx, ry);
                    } else if (isThunder && s === 0) {
                        // Just one bolt per time slot randomly
                        ctx.fillStyle = isDark ? '#ffffff' : '#000000';
                        ctx.fillText('bolt', rx, ry);
                    } else {
                        // Rain lines
                        ctx.beginPath();
                        ctx.strokeStyle = isDark ? '#ffffff' : '#000000';
                        ctx.lineWidth = 1.5;
                        const len = 4 + rand(seed)*6; // length 4 to 10
                        ctx.moveTo(rx, ry);
                        ctx.lineTo(rx - len*0.4, ry + len);
                        ctx.stroke();
                    }
                }
            }
        }
    });
    ctx.restore();

    // Draw the stroke
    ctx.save();
    const strokeGrad = ctx.createLinearGradient(minX, 0, maxX, 0);
    points.forEach(p => {
        const isSnow = [71, 73, 75, 77, 85, 86].includes(p.code);
        const isThunder = [95, 96, 99].includes(p.code);
        let r = 2, g = 136, b = 209; 
        if (isSnow) { r = 148; g = 163; b = 184; }
        else if (isThunder) { r = 94; g = 53; b = 177; }
        
        const stop = Math.max(0, Math.min(1, (p.x - minX) / (maxX - minX || 1)));
        strokeGrad.addColorStop(stop, `rgba(${r}, ${g}, ${b}, ${isDark ? 0.8 : 0.7})`);
    });

    ctx.strokeStyle = strokeGrad;
    ctx.lineWidth = 1.5;
    ctx.stroke(path);
    ctx.restore();
}
