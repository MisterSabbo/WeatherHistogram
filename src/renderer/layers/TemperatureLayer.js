import { state } from '../../core/Store.js';
import { getThemeColor, getThemeFont, getThemeIcon } from '../../services/ThemeManager.js';
import { normalizeY, hexToRgb } from '../../utils/math.js';

export class TemperatureLayer {
    constructor() {}

    render(ctx, viewX, viewW, h, styles) {
        this.drawTemperature(ctx, viewX, viewW, h, styles);
    }

    drawTemperature(ctx, viewX, viewW, h, styles) {
                const color = getThemeColor('tempLine', '#d32f2f'); // Temperature Base
                const apparentColor = getThemeColor('apparentTempLine', '#8b0000'); // Sensación térmica
                const textColor = '#1a1a1a'; // Siempre modo claro
    
                const startIdx = Math.max(0, Math.floor(viewX / state.pixelsPerHour) - 5);
                const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / state.pixelsPerHour) + 5);
    
                // Sombreado entre temperatura y sensación térmica
                for (let i = startIdx; i < Math.min(endIdx, state.hourlyData.length - 1); i++) {
                    const d = state.hourlyData[i];
                    const nextD = state.hourlyData[i+1];
                    const diff1 = Math.abs(d.temp - d.apparent);
                    const diff2 = Math.abs(nextD.temp - nextD.apparent);
    
                    if (diff1 >= 1 || diff2 >= 1) {
                        const isCold = diff1 >= Math.max(1, diff2) ? (d.apparent < d.temp) : (nextD.apparent < nextD.temp);
                        ctx.fillStyle = isCold ? 'rgba(2, 136, 209, 0.2)' : 'rgba(239, 68, 68, 0.2)'; // Blue for cold, Red for hot
    
                        const x1 = i * state.pixelsPerHour;
                        const x2 = (i + 1) * state.pixelsPerHour;
    
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
    
                // Línea de sensación térmica
                ctx.lineWidth = 1.5;
                
                for (let i = startIdx; i < Math.min(endIdx, state.hourlyData.length - 1); i++) {
                    const d = state.hourlyData[i];
                    const nextD = state.hourlyData[i+1];
                    
                    const diff1 = Math.abs(d.temp - d.apparent);
                    const diff2 = Math.abs(nextD.temp - nextD.apparent);
    
                    const shouldDraw = diff1 >= 1 || diff2 >= 1;
    
                    if (shouldDraw) {
                        const isCold = diff1 >= Math.max(1, diff2) ? (d.apparent < d.temp) : (nextD.apparent < nextD.temp);
                        
                        const x1 = i * state.pixelsPerHour;
                        const y1 = normalizeY(diff1 >= 1 ? d.apparent : d.temp, -20, 40, h);
                        
                        const x2 = (i + 1) * state.pixelsPerHour;
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
                            sBlur = 20; // Más difuminado
                            sOffY = 6; // Más separado
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
    
                        // 2. Dibujado de la Línea Punteada (Sin sombra física individual)
                        ctx.save();
                        ctx.setLineDash([4, 4]);
                        
                        if (!isWet && !isCloudy) {
                            // Color adaptado para despejado (mezcla entre color base y resplandor)
                            if (d.isNight) {
                                // Night: Blanco como base de mezcla solo si es calor
                                ctx.strokeStyle = isCold ? '#0288d1' : 'rgba(247, 161, 161, 0.9)';
                            } else {
                                // Day: Naranja como base de mezcla solo si es calor
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
                            // Reflejo húmedo continuo (sin puntos) como pidió el usuario
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
    
                // Línea de temperatura normal
                for (let i = startIdx; i < endIdx - 1; i++) {
                    const d = state.hourlyData[i];
                    const nextD = state.hourlyData[i+1];
                    
                    const x1 = i * state.pixelsPerHour;
                    const y1 = normalizeY(d.temp, -20, 40, h);
                    const x2 = (i + 1) * state.pixelsPerHour;
                    const y2 = normalizeY(nextD.temp, -20, 40, h);
    
                    const avgY = (y1 + y2) / 2;
                    const cloudY = h - (h * (d.clouds / 100));
                    const nextCloudY = h - (h * (nextD.clouds / 100));
                    const avgCloudY = (cloudY + nextCloudY) / 2;
    
                    const probY = h - (h * ((d.precipProb || 0) / 100));
                    const nextProbY = h - (h * ((nextD.precipProb || 0) / 100));
                    const avgProbY = (probY + nextProbY) / 2;
    
                    const avgClouds = (d.clouds + nextD.clouds) / 2;
                    const avgProb = ((d.precipProb || 0) + (nextD.precipProb || 0)) / 2;
    
                    ctx.save();
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = color;
    
                    let isWet = avgY >= avgProbY && avgProb > 15;
                    let isCloudy = avgY >= avgCloudY && avgClouds >= 25;
    
                    if (isCloudy || isWet) {
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
                        ctx.shadowOffsetY = 4;
                        ctx.shadowBlur = 12;
                    } else {
                        ctx.shadowColor = 'transparent';
                        ctx.shadowBlur = 0;
                    }
                    
                    let gStart = nodeClear[i] || 0;
                    let gEnd = nodeClear[i+1] || 0;
    
                    // Efecto resplandor como trazo continuo con gradiente (suavizado)
                    if (gStart > 0 || gEnd > 0) {
                        const isMobile = window.innerWidth < 600;
                        
                        // Al usar multi-stroke, las capas suman mucha opacidad. Reducimos el base multiplicador.
                        let intensityStart = isMobile && !d.isNight ? gStart * 0.6 : gStart * 1.0;
                        let intensityEnd = isMobile && !nextD.isNight ? gEnd * 0.6 : gEnd * 1.0;
                        
                        if (d.isNight) intensityStart = gStart * 1.4; // Noche más brillante
                        if (nextD.isNight) intensityEnd = gEnd * 1.4;
    
                        const colStart = d.isNight ? `rgba(255, 255, 255, ${Math.min(1, intensityStart)})` : `rgba(255, 140, 0, ${Math.min(1, intensityStart)})`;
                        const colEnd = nextD.isNight ? `rgba(255, 255, 255, ${Math.min(1, intensityEnd)})` : `rgba(255, 140, 0, ${Math.min(1, intensityEnd)})`;
    
                        let grad = ctx.createLinearGradient(x1, y1, x2, y2);
                        grad.addColorStop(0, colStart);
                        grad.addColorStop(1, colEnd);
    
                        ctx.save();
                        ctx.beginPath();
                        ctx.moveTo(x1, y1);
                        ctx.lineTo(x2, y2);
                        
                        ctx.strokeStyle = grad;
                        ctx.lineCap = 'round';
                        
                        // Para evitar cualquier banding o cortes visibles, usamos una línea muy fina (3px) 
                        // que quedará completamente oculta bajo la línea principal roja/azul.
                        // Toda la luz visible hacia afuera se generará ÚNICAMENTE mediante el desenfoque gaussiano perfecto.
                        ctx.lineWidth = 3; 
                        ctx.shadowColor = d.isNight ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 140, 0, 1)';
                        ctx.shadowOffsetY = 0;
                        
                        // Capa 1: Halo exterior suave y muy amplio
                        ctx.shadowBlur = isMobile ? (d.isNight ? 24 : 18) : (d.isNight ? 30 : 22);
                        ctx.globalAlpha = d.isNight ? 0.8 : 0.45; 
                        ctx.stroke();
                        if (d.isNight) { ctx.stroke(); } // Duplicar intensidad en la noche
                        
                        // Capa 2: Resplandor medio para dar cuerpo a la luz
                        ctx.shadowBlur = isMobile ? (d.isNight ? 12 : 9) : (d.isNight ? 16 : 12);
                        ctx.globalAlpha = d.isNight ? 0.95 : 0.65;
                        ctx.stroke();
                        if (d.isNight) { ctx.stroke(); }
                        
                        // Capa 3: Brillo intenso concentrado cerca del núcleo
                        ctx.shadowBlur = isMobile ? (d.isNight ? 5 : 4) : (d.isNight ? 7 : 5);
                        ctx.globalAlpha = d.isNight ? 1.0 : 0.9;
                        ctx.stroke();
                        if (d.isNight) { ctx.stroke(); ctx.stroke(); } // Multiplicar el núcleo para que el blanco destaque
                        
                        ctx.restore();
                    }
    
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                    
                    // Refuerzo extra de brillo para cielos muy despejados
                    let glowFactor = (gStart + gEnd) / 2;
                    if (glowFactor > 0.7 && !isCloudy && !isWet) {
                        ctx.save();
                        ctx.globalAlpha = (glowFactor - 0.7) * 3.3;
                        ctx.stroke();
                        ctx.restore();
                    }
    
                    // Detalles adicionales adaptativos a la línea base
                    const avgTemp = (d.temp + nextD.temp) / 2;
                    const avgWind = (d.wind + nextD.wind) / 2;
                    
    
    
                    // Efecto escarcha para frío (reacciona al entorno)
                    if (avgTemp <= 0) {
                        ctx.save();
                        ctx.strokeStyle = 'rgba(150, 240, 255, 0.7)';
                        ctx.lineWidth = 1;
                        ctx.setLineDash([3, 4]);
                        ctx.beginPath();
                        ctx.moveTo(x1, y1 + 3);
                        ctx.lineTo(x2, y2 + 3);
                        ctx.stroke();
                        ctx.restore();
                    }
    
                    if (isWet) {
                        // Charco continuo (continuous puddle)
                        ctx.save();
                        ctx.beginPath();
                        ctx.moveTo(x1, y1);
                        ctx.lineTo(x2, y2);
                        ctx.lineWidth = 7;
                        ctx.strokeStyle = 'rgba(13, 71, 161, 0.35)'; // Azul oscuro transparente
                        ctx.lineCap = 'round';
                        ctx.stroke();
                        ctx.restore();
    
    
                    }
                    
                    // Contraste para nubes: sutil resplandor interno claro por encima de la sombra oscura
                    if (isCloudy && !isWet) {
                        ctx.save();
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; // Fina luz blanca debajo del rojo, arriba de las nubes grises
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        ctx.moveTo(x1, y1 + 1);
                        ctx.lineTo(x2, y2 + 1);
                        ctx.stroke();
                        ctx.restore();
                    }
    
                    ctx.restore();
                }
    
                // Puntos y valores
                ctx.font = `bold 10px ${getThemeFont()}`;
                ctx.textAlign = 'center';
                for (let i = startIdx; i < endIdx; i++) {
                    const d = state.hourlyData[i];
                    const x = i * state.pixelsPerHour;
                    const y = normalizeY(d.temp, -20, 40, h);
    
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(x, y, 3, 0, Math.PI * 2);
                    ctx.fill();
    
                    // Sombra para legibilidad (Solo si hay nubosidad o lluvia)
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

}
