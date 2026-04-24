import { state } from '../core/Store.js';
import { getThemeColor, getThemeFont, getThemeIcon } from '../services/ThemeManager.js';
import { normalizeY, hexToRgb } from '../utils/math.js';

export class LayoutManager {
    constructor() {
        this.scrollContainer = document.getElementById('scroll-container');
        this.fixedOverlayCanvas = document.getElementById('fixed-overlay-canvas');
        this.fixedOverlayCtx = this.fixedOverlayCanvas.getContext('2d');
    }

    updateScrollIndicators() {
        const left = document.querySelector('.scroll-indicator-left');
        const right = document.querySelector('.scroll-indicator-right');
        if (!left || !right) return;
        
        const scrollLeft = this.scrollContainer.scrollLeft;
        const maxScroll = this.scrollContainer.scrollWidth - this.scrollContainer.clientWidth;
        
        left.classList.toggle('visible', scrollLeft > 10);
        right.classList.toggle('visible', scrollLeft < maxScroll - 10);
    }

    updateNowButtonPosition() {
        if (state.hourlyData.length === 0) return;
        const floatBtn = document.getElementById('floating-now-btn');
        const now = Date.now();
        const startTime = state.hourlyData[0].time;
        const nowX = ((now - startTime) / 3600000) * state.pixelsPerHour;
        
        const nowIndicator = document.getElementById('now-indicator');
        const pastShadow = document.getElementById('past-shadow');
        
        if (nowIndicator && pastShadow) {
            if (nowX > 0) {
                nowIndicator.style.display = 'block';
                nowIndicator.style.left = nowX + 'px';
                pastShadow.style.width = nowX + 'px';
                const shadeAlpha = state.theme === 'dark' ? 0.5 : 0.15;
                pastShadow.style.background = `linear-gradient(to right, rgba(0,0,0,${shadeAlpha}) 0%, rgba(0,0,0,${shadeAlpha}) calc(100% - 150px), rgba(0,0,0,0) 100%)`;
            } else {
                nowIndicator.style.display = 'none';
                pastShadow.style.width = '0px';
            }
        }

        if (!floatBtn) return;
        const viewportX = nowX - this.scrollContainer.scrollLeft;
        const viewportWidth = this.scrollContainer.clientWidth;

        if (viewportX < 0 || viewportX > viewportWidth) {
            floatBtn.style.display = 'flex';
            if (viewportX < 0) {
                floatBtn.style.left = '20px'; floatBtn.style.right = 'auto';
                floatBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px;">chevron_left</span>';
            } else {
                floatBtn.style.left = 'auto'; floatBtn.style.right = '20px';
                floatBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px;">chevron_right</span>';
            }
        } else {
            floatBtn.style.display = 'none';
        }
    }

    drawFixedOverlay() {
        if (!state.hourlyData.length) return;
        const ctx = this.fixedOverlayCtx;
        const w = this.fixedOverlayCanvas.clientWidth;
        const h = this.scrollContainer.clientHeight;
        ctx.clearRect(0, 0, w, h);

        const drawX = 60;
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = getThemeColor('referenceLine', 'rgba(255, 255, 255, 0.3)');
        ctx.beginPath(); ctx.moveTo(drawX, 0); ctx.lineTo(drawX, h); ctx.stroke();
        ctx.restore();

        const activeX = this.scrollContainer.scrollLeft + 60;
        const floatIndex = activeX / state.pixelsPerHour;
        const index = Math.floor(floatIndex);
        const progress = floatIndex - index;

        if (index >= 0 && index < state.hourlyData.length - 1) {
            const d1 = state.hourlyData[index];
            const d2 = state.hourlyData[index + 1];
            const interpolate = (v1, v2) => v1 + (v2 - v1) * progress;

            const temp = interpolate(d1.temp, d2.temp);
            const apparent = interpolate(d1.apparent, d2.apparent);
            const clouds = interpolate(d1.clouds, d2.clouds);
            const precipProb = interpolate(d1.precipProb, d2.precipProb);

            ctx.save();
            ctx.font = `bold 10px ${getThemeFont()}`;
            ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;

            const labelRects = [];
            
            const drawPoint = (y, color, value, unit, shape = 'circle', icon = '', secondaryText = null, secondaryColor = null) => {
                if (y >= h - 5) return;
                ctx.fillStyle = color;
                ctx.beginPath();
                if (shape === 'circle') { ctx.arc(drawX, y, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
                else if (shape === 'diamond') {
                    ctx.moveTo(drawX, y - 5); ctx.lineTo(drawX + 5, y); ctx.lineTo(drawX, y + 5); ctx.lineTo(drawX - 5, y); ctx.closePath(); ctx.fill(); ctx.stroke();
                }

                if (value !== null && (typeof value === 'string' || Math.abs(value) > 0.01)) {
                    let constrainedY = Math.max(10, Math.min(h - 10, y));
                    const text = `${value}${unit}`;
                    
                    ctx.save();
                    ctx.font = `bold 11px ${getThemeFont()}`;
                    const textMetrics = ctx.measureText(text);
                    let secMetrics = { width: 0 };
                    if (secondaryText) secMetrics = ctx.measureText(secondaryText);
                    
                    let iconWidth = 0;
                    if (icon) {
                        ctx.font = '12px "Material Symbols Outlined"';
                        iconWidth = ctx.measureText(icon).width + 4;
                        ctx.font = `bold 11px ${getThemeFont()}`;
                    }
                    
                    const bgW = textMetrics.width + secMetrics.width + iconWidth + 12 + (secondaryText ? 4 : 0);
                    const bgH = 18;

                    let rect = { x: drawX + 4, y: constrainedY - bgH / 2, w: bgW, h: bgH };
                    let attempts = 0;
                    while (labelRects.some(r => rect.x < r.x + r.w && rect.x + rect.w > r.x && rect.y < r.y + r.h && rect.y + rect.h > r.y) && attempts < 20) {
                        rect.y += bgH + 1;
                        attempts++;
                    }
                    labelRects.push(rect);

                    const c = hexToRgb(color);
                    const lightMix = getThemeColor('scrubber.bgLightMix', 0.85);
                    const bgR = Math.round(255 * lightMix + c.r * (1 - lightMix));
                    const bgG = Math.round(255 * lightMix + c.g * (1 - lightMix));
                    const bgB = Math.round(255 * lightMix + c.b * (1 - lightMix));
                    const opacity = getThemeColor('scrubber.bgOpacity', 0.75);

                    ctx.fillStyle = `rgba(${bgR}, ${bgG}, ${bgB}, ${opacity})`;
                    ctx.beginPath(); ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 4); ctx.fill();
                    ctx.strokeStyle = getThemeColor('scrubber.borderColor', color); ctx.lineWidth = 0.5; ctx.stroke();

                    ctx.fillStyle = color;
                    let textStartX = rect.x + 6;
                    if (icon) {
                        ctx.font = '12px "Material Symbols Outlined"';
                        ctx.fillText(icon, textStartX, rect.y + rect.h / 2 + 1);
                        textStartX += iconWidth;
                    }
                    ctx.font = `bold 11px ${getThemeFont()}`;
                    ctx.fillText(text, textStartX, rect.y + rect.h / 2 + 1);
                    if (secondaryText) {
                        textStartX += textMetrics.width + 4;
                        ctx.fillStyle = secondaryColor; ctx.fillText(secondaryText, textStartX, rect.y + rect.h / 2 + 1);
                    }
                    ctx.restore();
                }
            };

            // 1. Temp
            const diff = Math.abs(temp - apparent);
            const tempColor = '#d32f2f';
            if (diff >= 1) {
                const isCold = apparent <= temp;
                const apparentColor = isCold ? '#0288d1' : '#f97316';
                drawPoint(normalizeY(temp, -20, 40, h), tempColor, `${temp.toFixed(1)}°C`, '', 'circle', getThemeIcon('scrubber.temp', 'device_thermostat'), `(${apparent.toFixed(1)}°C)`, apparentColor);
            } else {
                drawPoint(normalizeY(temp, -20, 40, h), tempColor, `${temp.toFixed(1)}°C`, '', 'circle', getThemeIcon('scrubber.temp', 'device_thermostat'));
            }

            // 2. Prob
            drawPoint(h - (h * (precipProb / 100)), '#0288d1', Math.round(precipProb), '%', 'diamond', getThemeIcon('scrubber.prob', 'water_drop'));

            // 3. Clouds
            drawPoint(h - (h * (clouds / 100)), '#475569', Math.round(clouds), '%', 'circle', getThemeIcon('scrubber.cloud', 'cloud'));

            ctx.restore();
        }
    }
}
