import { state } from '../store.js';
import { getThemeColor, getThemeIcon, getThemeFont } from '../theme.js';
import { normalizeY } from '../utils/math.js';

export function drawHumidity(ctx, viewX, viewW, h, styles, PIXELS_PER_HOUR) {
    const color = getThemeColor('humidityLine', 'rgba(0, 188, 212, 0.3)');
    const startIdx = Math.max(0, Math.floor(viewX / PIXELS_PER_HOUR) - 5);
    const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / PIXELS_PER_HOUR) + 5);

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    for (let i = startIdx; i < endIdx; i++) {
        const d = state.hourlyData[i];
        const x = i * PIXELS_PER_HOUR;
        const y = h - (h * (d.humidity / 100));
        if (i === startIdx) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
}

export function drawWind(ctx, viewX, viewW, h, styles, PIXELS_PER_HOUR) {
    const startIdx = Math.max(0, Math.floor(viewX / PIXELS_PER_HOUR) - 5);
    const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / PIXELS_PER_HOUR) + 5);

    ctx.save();
    for (let i = startIdx; i < endIdx; i++) {
        const d = state.hourlyData[i];
        if (d.localHour % 3 === 0) { 
            const x = i * PIXELS_PER_HOUR;
            const y = 35; 
            
            ctx.save();
            ctx.translate(x, y);
            
            ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
            ctx.shadowBlur = 4;
            ctx.rotate((d.windDir + 180) * Math.PI / 180);

            let windColor = state.theme === 'dark' ? getThemeColor('wind.normalDark', '#cbd5e1') : getThemeColor('wind.normalLight', '#64748b');
            if (d.temp < 10) {
                windColor = getThemeColor('wind.cold', '#3b82f6');
            } else if (d.temp > 28) {
                windColor = getThemeColor('wind.hot', '#ef4444');
            }

            if (d.wind > 40 && d.temp <= 28 && d.temp >= 10) {
                windColor = state.theme === 'dark' ? getThemeColor('wind.strongDefaultDark', '#f87171') : getThemeColor('wind.strongDefaultLight', '#dc2626');
            }
            
            let wIcon = getThemeIcon('windDirection', null);
            if (wIcon) {
                ctx.font = '14px "Material Symbols Outlined"';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = windColor;
                ctx.strokeStyle = state.theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)';
                ctx.lineWidth = 1;
                ctx.strokeText(wIcon, 0, 0);
                ctx.fillText(wIcon, 0, 0);
            } else {
                ctx.fillStyle = windColor;
                ctx.strokeStyle = state.theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(0, -6);
                ctx.lineTo(4, 4);
                ctx.lineTo(0, 2);
                ctx.lineTo(-4, 4);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
            
            ctx.restore();
        }
    }
    ctx.restore();
}

export function drawTemperature(ctx, viewX, viewW, h, styles, PIXELS_PER_HOUR) {
    const color = getThemeColor('tempLine', '#d32f2f'); 
    const apparentColor = getThemeColor('apparentTempLine', '#8b0000'); 
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
            ctx.fillStyle = isCold ? 'rgba(2, 136, 209, 0.2)' : 'rgba(239, 68, 68, 0.2)';

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

            let isWet = avgY >= avgProbY && avgProb > 15;
            let isCloudy = avgY >= avgCloudY && avgClouds >= 25;

            // 1. Dibujado de Efectos Continuos (Glow/Sombra)
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            
            let sCol = '';
            let sBlur = 0;
            let sOffY = 0;

            if (isWet) {
                sCol = 'rgba(0, 200, 255, 0.3)';
                sBlur = 20;
                sOffY = 2; // Más separado
            } else if (isCloudy) {
                sCol = 'rgba(0, 0, 0, 0.2)'; // Más suave
                sBlur = 30; // Más difuminado (increased for 5th point)
                sOffY = 8; // Más separado
            }
            
            if (sCol) {
                ctx.shadowColor = sCol;
                ctx.shadowBlur = sBlur;
                ctx.shadowOffsetY = sOffY;
                ctx.strokeStyle = sCol.replace(/[\d.]+\)$/, '0.05)'); // Muy tenue
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            ctx.restore();

            // 2. Draw the Dotted Line (Without individual physical shadow)
            ctx.save();
            ctx.setLineDash([4, 4]);
            
            if (!isWet && !isCloudy) {
                // Color adaptado para despejado (mezcla entre color base y resplandor)
                if (d.isNight) {
                    ctx.strokeStyle = isCold ? '#0288d1' : 'rgba(247, 161, 161, 0.9)';
                } else {
                    ctx.strokeStyle = isCold ? '#0288d1' : 'rgba(247, 104, 34, 1)';
                }
            } else {
                ctx.strokeStyle = isCold ? '#0288d1' : '#ef4444'; 
            }

            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            if (isWet) {
                ctx.setLineDash([]); 
                ctx.strokeStyle = 'rgba(200, 240, 255, 0.4)';
                ctx.lineWidth = 0.8;
                ctx.stroke();
            }

            ctx.restore();
        }
    }
    
    // Pre-calcular claridad de nodos para transiciones suaves del resplandor
    let nodeClear = [];
    for (let i = 0; i < state.hourlyData.length; i++) {
        const d = state.hourlyData[i];
        const y = normalizeY(d.temp, -20, 40, h);
        const cloudY = h - (h * (d.clouds / 100));
        const probY = h - (h * ((d.precipProb || 0) / 100));
        
        let isWetNode = y >= probY && (d.precipProb || 0) > 15;
        let isCloudyNode = y >= cloudY && d.clouds >= 25;
        nodeClear.push(!(isWetNode || isCloudyNode) ? 1 : 0);
    }

    // Base temperature line
    ctx.save();
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Draw all segments base line
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

    // Now global effects applied cleanly per segment avoiding overreach
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
            ctx.strokeStyle = color; // Draw exact physical line color
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            
            // Only shadow color is orange/white to create the glow behind
            ctx.shadowColor = d.isNight ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 140, 0, 1)';
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = isMobile ? (d.isNight ? 24 : 20) : (d.isNight ? 30 : 25);
            ctx.stroke();
            if (d.isNight) ctx.stroke();
            ctx.shadowBlur = isMobile ? (d.isNight ? 12 : 12) : (d.isNight ? 16 : 14);
            ctx.stroke();
            if (d.isNight) ctx.stroke();
            ctx.restore();
        }

        // Cloudy shadow overlay (underneath the line) - Updated to 3D volume effect
        if ((isCloudy1 || isCloudy2) && (!isWet1 && !isWet2)) {
            let gradD = ctx.createLinearGradient(x1, y1, x2, y2);
            gradD.addColorStop(0, isCloudy1 ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0)');
            gradD.addColorStop(1, isCloudy2 ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0)');
            
            let gradL = ctx.createLinearGradient(x1, y1, x2, y2);
            gradL.addColorStop(0, isCloudy1 ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0)');
            gradL.addColorStop(1, isCloudy2 ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0)');

            ctx.save();
            
            // Top highlight for volume
            ctx.strokeStyle = gradL;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x1, y1 - 1.5);
            ctx.lineTo(x2, y2 - 1.5);
            ctx.stroke();

            // Bottom shadow for volume
            ctx.strokeStyle = gradD;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x1, y1 + 1.5);
            ctx.lineTo(x2, y2 + 1.5);
            ctx.stroke();

            // Soft ambient drop shadow underneath
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
            
            let grad = ctx.createLinearGradient(x1, y1, x2, y2);
            
            if (hasSnow) {
                // Freezing effect: cyan/white frozen glow
                grad.addColorStop(0, isWet1 && isSnow1 ? 'rgba(0, 220, 255, 0.7)' : 'rgba(0, 220, 255, 0)');
                grad.addColorStop(1, isWet2 && isSnow2 ? 'rgba(0, 220, 255, 0.7)' : 'rgba(0, 220, 255, 0)');
            } else {
                // Normal rain dark blue effect
                grad.addColorStop(0, isWet1 ? 'rgba(13, 71, 161, 0.45)' : 'rgba(13, 71, 161, 0)');
                grad.addColorStop(1, isWet2 ? 'rgba(13, 71, 161, 0.45)' : 'rgba(13, 71, 161, 0)');
            }

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineWidth = hasSnow ? 5 : 7;
            ctx.strokeStyle = grad;
            ctx.lineCap = 'round';
            
            if (hasSnow) {
                // Render frost outline
                ctx.setLineDash([2, 4]);
                ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
                ctx.shadowBlur = 4;
            }
            
            ctx.stroke();
            ctx.restore();
            
            if (hasSnow) {
                // Frost inner core
                let innerGrad = ctx.createLinearGradient(x1, y1, x2, y2);
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
            let dx = x2 - x1;
            let dy = y2 - y1;
            let dist = Math.sqrt(dx * dx + dy * dy);
            let steps = Math.floor(dist / 4); 
            let tOffset = (Date.now() / 150) % (Math.PI * 2);

            for (let j = 0; j <= steps; j++) {
                let t = j / steps;
                let cx = x1 + dx * t;
                let cy = y1 + dy * t;
                let perpX = -dy / dist;
                let perpY = dx / dist;
                let phase = t * Math.PI * 15 + tOffset;
                let amp = Math.sin(phase) * 3;
                if(j===0) ctx.moveTo(cx, cy);
                else ctx.lineTo(cx + perpX * amp, cy + perpY * amp);
            }

            let grad = ctx.createLinearGradient(x1, y1, x2, y2);
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

        const cloudY = h - (h * (d.clouds / 100));
        const probY = h - (h * ((d.precipProb || 0) / 100));
        const isWet = y >= probY && (d.precipProb || 0) > 15;
        const isCloudy = y >= cloudY && d.clouds >= 25;

        ctx.save();
        if (isWet || isCloudy) {
            ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
            ctx.shadowBlur = 5;
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.strokeText(d.temp.toFixed(1) + '°', x, y - 10);
        }
        
        ctx.fillStyle = textColor;
        ctx.fillText(d.temp.toFixed(1) + '°', x, y - 10);
        ctx.restore();
    }
}
