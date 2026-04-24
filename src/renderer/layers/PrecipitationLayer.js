import { state } from '../../core/Store.js';
import { getThemeColor, getThemeFont, getThemeIcon } from '../../services/ThemeManager.js';
import { normalizeY, hexToRgb } from '../../utils/math.js';

export class PrecipitationLayer {
    constructor() {}

    render(ctx, viewX, viewW, h, styles) {
        this.drawPrecipitation(ctx, viewX, viewW, h, styles);
        this.drawPrecipitationProbability(ctx, viewX, viewW, h, styles);
    }

    drawPrecipitation(ctx, viewX, viewW, h, styles) {
                const startIdx = Math.max(0, Math.floor(viewX / state.pixelsPerHour) - 5);
                const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / state.pixelsPerHour) + 5);
    
                const maxH = h * 0.9;
                for (let i = startIdx; i < endIdx; i++) {
                    const d = state.hourlyData[i];
                    if (d.precip > 0) {
                        let barH = d.precip * state.pixelsPerMm;
                        const x = i * state.pixelsPerHour + 5;
                        const bw = state.pixelsPerHour - 10;
    
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
                        
                        // Customize the fade out so the top is still visible (not fully transparent)
                        const grad = ctx.createLinearGradient(0, barY, 0, Math.min(h, barY + 30));
                        
                        // Extract rgba components to adjust opacity
                        const colorParts = baseColor.match(/[\d.]+/g);
                        const R = colorParts[0], G = colorParts[1], B = colorParts[2], A = colorParts[3];
                        const semiTransparentBase = `rgba(${R}, ${G}, ${B}, ${Math.max(0.1, A * 0.4)})`;
    
                        grad.addColorStop(0, semiTransparentBase);
                        grad.addColorStop(1, baseColor);
                        
                        ctx.fillStyle = grad;
                        
                        // Draw base rect
                        ctx.beginPath();
                        ctx.moveTo(x, h);
                        ctx.lineTo(x, barY);
                        ctx.lineTo(x + bw, barY);
                        ctx.lineTo(x + bw, h);
                        ctx.fill();
                        
                        // Let the stroke also fade, but be clearly visible at the top
                        const strokeColorParts = strokeColor.match(/[\d.]+/g);
                        const sR = strokeColorParts[0], sG = strokeColorParts[1], sB = strokeColorParts[2], sA = strokeColorParts[3];
                        const semiTransparentStroke = `rgba(${sR}, ${sG}, ${sB}, ${Math.max(0.3, sA * 0.5)})`;
    
                        const strokeGrad = ctx.createLinearGradient(0, barY, 0, Math.min(h, barY + 30));
                        strokeGrad.addColorStop(0, semiTransparentStroke);
                        strokeGrad.addColorStop(1, strokeColor);
                        
                        ctx.strokeStyle = strokeGrad;
                        
                        // Draw sides
                        ctx.beginPath();
                        ctx.moveTo(x, h);
                        ctx.lineTo(x, barY);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(x + bw, h);
                        ctx.lineTo(x + bw, barY);
                        ctx.stroke();
    
                        // Draw custom scattered top effects
                        ctx.save();
                        ctx.lineWidth = 1.5;
                        ctx.lineCap = 'round';
                        ctx.lineJoin = 'round';
                        
                        if (isSnow) {
                            // High contrast outline
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
                            // High contrast Outline
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
    
                            ctx.strokeStyle = '#fde047'; // yellow
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
                            // Regular rain (water drop stickers)
                            const dropIcon = 'water_drop';
                            ctx.font = '10px "Material Symbols Outlined"'; // Más pequeños
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'bottom';
                            
                            // Several icons
                            const dropCount = 3;
                            for (let k = 0; k < dropCount; k++) {
                                const dropX = x + (bw / (dropCount + 1)) * (k + 1);
                                // Altura aleatoria basada en el índice para que no estén alineados
                                const yJitter = ((i * 7 + k * 13) % 10) - 5;
                                const dropY = barY + 4 + yJitter;
                                
                                // Sticker outline (glow effect)
                                ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'; // Borde mucho menos agresivo, blanquecino
                                ctx.lineWidth = 2; // Más fino
                                ctx.strokeText(dropIcon, dropX, dropY);
                                
                                // Main icon
                                ctx.fillStyle = strokeColor;
                                ctx.shadowColor = 'rgba(13, 71, 161, 0.4)';
                                ctx.shadowBlur = 1;
                                ctx.fillText(dropIcon, dropX, dropY);
                            }
                        }
                        ctx.restore();
    
                        if (barH > maxH) {
                            // Draw zigzag
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

    drawPrecipitationProbability(ctx, viewX, viewW, h, styles) {
                const startIdx = Math.max(0, Math.floor(viewX / state.pixelsPerHour) - 5);
                const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / state.pixelsPerHour) + 5);
    
                if (state.hourlyData.length < 2) return;
    
                // Helper to get color based on weather code
                const getPrecipTypeColor = (code) => {
                    // Snow: 71, 73, 75, 77, 85, 86
                    if ([71, 73, 75, 77, 85, 86].includes(code)) return '#e0f7fa'; // Cyan muy claro para nieve
                    // Thunderstorm: 95, 96, 99
                    if ([95, 96, 99].includes(code)) return '#3949ab'; // Indigo para tormentas
                    // Default Rain
                    return '#039be5'; // Azul lluvia
                };
    
                const outlinePath = new Path2D();
                let first = true;
                for (let i = startIdx; i < endIdx; i++) {
                    const d = state.hourlyData[i];
                    const x = i * state.pixelsPerHour;
                    const prob = d.precipProb || 0;
                    const y = h - (h * (prob / 100));
    
                    if (first) {
                        outlinePath.moveTo(x, y);
                        first = false;
                    } else {
                        const prevD = state.hourlyData[i-1];
                        const prevX = (i-1) * state.pixelsPerHour;
                        const prevProb = prevD.precipProb || 0;
                        const prevY = h - (h * (prevProb / 100));
                        const cpX1 = prevX + (x - prevX) / 3;
                        const cpX2 = prevX + 2 * (x - prevX) / 3;
                        outlinePath.bezierCurveTo(cpX1, prevY, cpX2, y, x, y);
                    }
                }
    
                const fillPath = new Path2D(outlinePath);
                const lastX = (endIdx - 1) * state.pixelsPerHour;
                const firstX = startIdx * state.pixelsPerHour;
                fillPath.lineTo(lastX, h);
                fillPath.lineTo(firstX, h);
                fillPath.closePath();
    
                // Excluir las barras de precipitación usando sub-trazados para la regla evenodd
                // Agrandamos los rectángulos un poco para asegurar que no queden orillas de los patrones
                const maxH = h * 0.9;
                for (let i = startIdx; i < endIdx; i++) {
                    const d = state.hourlyData[i];
                    if (d && d.precip > 0.05) { // Solo si hay precipitación relevante
                        const barH = d.precip * state.pixelsPerMm;
                        const visualH = Math.min(maxH, barH);
                        const barY = h - visualH;
                        const x = i * state.pixelsPerHour + 5;
                        const bw = state.pixelsPerHour - 10;
                        
                        // Si el barY está dentro del área de relleno, restamos el rectángulo
                        fillPath.rect(x - 1, barY, bw + 2, h - barY + 1);
                    }
                }
    
                ctx.save();
                ctx.clip(fillPath, 'evenodd');
    
                // Añadir fondo azul suave casi transparente (resaltar relleno sobre fondo)
                ctx.fillStyle = 'rgba(3, 155, 229, 0.08)';
                ctx.fillRect((startIdx-1) * state.pixelsPerHour, 0, (endIdx - startIdx + 2) * state.pixelsPerHour, h);
    
                // Relleno con densidad de líneas según probabilidad (Agrupado en bloques contiguos)
                const blocks = [];
                let currentBlock = null;
    
                for (let i = startIdx; i < endIdx; i++) {
                    const d = state.hourlyData[i];
                    if (!d || !d.precipProb) {
                        if (currentBlock) { blocks.push(currentBlock); currentBlock = null; }
                        continue;
                    }
                    
                    const isSnow = [71, 73, 75, 77, 85, 86].includes(d.weatherCode);
                    const type = isSnow ? 'snow' : 'rain';
                    const color = getPrecipTypeColor(d.weatherCode);
                    const alpha = d.isNight ? 0.6 : 0.4;
                    const shadowColor = d.isNight ? 'rgba(255, 255, 255, 0.5)' : 'transparent';
    
                    if (!currentBlock || currentBlock.type !== type) {
                        if (currentBlock) blocks.push(currentBlock);
                        currentBlock = { type, start: i, end: i, colors: [color], alphas: [alpha], shadows: [shadowColor] };
                    } else {
                        currentBlock.end = i;
                        currentBlock.colors.push(color);
                        currentBlock.alphas.push(alpha);
                        currentBlock.shadows.push(shadowColor);
                    }
                }
                if (currentBlock) blocks.push(currentBlock);
    
                const spacing = 16; // Menos densidad (antes 12)
                
                blocks.forEach(block => {
                    const xStart = block.start * state.pixelsPerHour;
                    const xEnd = (block.end + 1) * state.pixelsPerHour;
                    
                    // Margen generoso para que se fundan los tramos colindantes sin corte
                    const drawXStart = xStart - 30;
                    const drawXEnd = xEnd + 30;
    
                    ctx.save();
                    ctx.beginPath();
                    // Clip del bloque entero + los márgenes
                    ctx.rect(drawXStart, 0, drawXEnd - drawXStart, h);
                    ctx.clip();
                    
                    let strokeFillColor = block.colors[0];
                    
                    // Helper para transformar color Hex a Rgba con Alpha controlado
                    const toRgba = (color, a) => {
                        const {r, g, b} = hexToRgb(color);
                        return `rgba(${r}, ${g}, ${b}, ${a})`;
                    };
                    
                    const alphaSolid = block.alphas[0];
                    const cFirst = block.colors[0];
                    const cLast = block.colors[block.colors.length - 1];
                    const totalW = drawXEnd - drawXStart;
                    
                    const g = ctx.createLinearGradient(drawXStart, 0, drawXEnd, 0);
                    
                    // Fundido transparente de entrada (overlap izquierdo ampliado a 60px para mayor suavidad)
                    const fadeW = 60;
                    g.addColorStop(0, toRgba(cFirst, 0));
                    g.addColorStop(fadeW / totalW, toRgba(cFirst, alphaSolid));
                    
                    // Colores internos del bloque iterados proporcionalmente en su espacio central
                    if (block.colors.length > 1) {
                        block.colors.forEach((c, idx) => {
                            const relativePos = idx / (block.colors.length - 1);
                            const stopPos = (fadeW + relativePos * (xEnd - xStart)) / totalW;
                            g.addColorStop(Math.min(1, Math.max(0, stopPos)), toRgba(c, alphaSolid));
                        });
                    } else {
                        g.addColorStop((totalW - fadeW) / totalW, toRgba(cFirst, alphaSolid));
                    }
                    
                    // Fundido transparente de salida (overlap derecho ampliado a 60px)
                    g.addColorStop((totalW - fadeW) / totalW, toRgba(cLast, alphaSolid));
                    g.addColorStop(1, toRgba(cLast, 0));
                    
                    strokeFillColor = g;
                    
                    ctx.strokeStyle = strokeFillColor;
                    ctx.fillStyle = strokeFillColor;
                    ctx.globalAlpha = 1; // Alpha controlado directamente en el gradiente
                    
                    if (block.shadows[0] !== 'transparent') {
                        ctx.shadowColor = block.shadows[0];
                        ctx.shadowBlur = 3;
                    }
    
                    ctx.lineWidth = 1;
    
                    if (block.type === 'snow') {
                        ctx.font = '10px "Material Symbols Outlined"';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        
                        const flakeSpacing = 40; // Menos densidad (antes 30)
                        const flakeOffset = Math.floor(drawXStart / flakeSpacing) * flakeSpacing;
                        
                        for (let lx = flakeOffset - h; lx < drawXEnd + h; lx += flakeSpacing) {
                            for (let ly = 10; ly < h; ly += flakeSpacing) {
                                const stagger = (Math.floor(ly / flakeSpacing) % 2) * (flakeSpacing * 0.5);
                                const randX = Math.sin(lx * 4.3 + ly * 2.1) * 12;
                                const randY = Math.cos(lx * 1.5 + ly * 3.7) * 12;
                                const sx = lx + stagger + randX;
                                const sy = ly + randY;
                                if (sx >= drawXStart && sx < drawXEnd) {
                                    ctx.fillText('ac_unit', sx, sy);
                                }
                            }
                        }
                    } else {
                        const strokeLen = 4;
                        const gapLen = 4;
                        const globalOffset = Math.floor(drawXStart / spacing) * spacing;
                        
                        ctx.beginPath();
                        for (let lx = globalOffset - h; lx < drawXEnd + h; lx += spacing) {
                            for (let ly = 0; ly < h; ly += (strokeLen + gapLen)) {
                                const sx = lx + ly;
                                const sy = ly;
                                if (sx >= drawXStart && sx < drawXEnd) {
                                    ctx.moveTo(sx, sy);
                                    ctx.lineTo(sx + strokeLen, sy + strokeLen);
                                }
                            }
                        }
                        ctx.stroke();
                    }
                    ctx.restore();
                });
                ctx.restore();
    
                // Línea de contorno fina
                ctx.strokeStyle = '#0288d1'; // Color sutil
                ctx.lineWidth = 1; // Línea más fina
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.stroke(outlinePath);
            }

}
