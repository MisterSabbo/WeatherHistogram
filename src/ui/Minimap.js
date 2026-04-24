import { state } from '../core/Store.js';
import { getThemeFont, getThemeColor } from '../services/ThemeManager.js';
import { normalizeY } from '../utils/math.js';

export class Minimap {
    constructor() {
        this.canvas = document.getElementById('minimap-canvas');
        this.viewport = document.getElementById('minimap-viewport');
        this.scrollContainer = document.getElementById('scroll-container');
        this.cacheCanvas = null;
    }

    draw() {
        if (!state.hourlyData.length) return;

        const ctx_main = this.canvas.getContext('2d');
        const w = this.canvas.clientWidth || window.innerWidth;
        const h = 80;
        const dpr = state.dpr;

        if (!this.cacheCanvas) this.cacheCanvas = document.createElement('canvas');
        if (this.cacheCanvas.width !== w * dpr || this.cacheCanvas.height !== h * dpr) {
            this.cacheCanvas.width = w * dpr;
            this.cacheCanvas.height = h * dpr;
        }

        const ctx = this.cacheCanvas.getContext('2d');
        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        const step = w / state.hourlyData.length;

        // 1. Background
        ctx.fillStyle = '#fffde7'; // Day
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#f3e8ff'; // Night
        state.hourlyData.forEach((d, i) => {
            if (d.isNight) ctx.fillRect(i * step, 0, step + 0.5, h);
        });

        // 2. Grid & Days
        ctx.save();
        state.hourlyData.forEach((d, i) => {
            if (d.localHour === 0) {
                const x = i * step;
                ctx.strokeStyle = 'rgba(0,0,0,0.05)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x, 0); ctx.lineTo(x, h);
                ctx.stroke();

                ctx.fillStyle = '#666666';
                ctx.font = `bold 9px ${getThemeFont()}`;
                ctx.fillText(d.localDayShort, x + 4, 12);
            }
        });
        ctx.restore();

        // 3. Simplified Layers
        const y0 = normalizeY(0, -20, 40, h);
        ctx.strokeStyle = 'rgba(2, 136, 209, 0.4)';
        ctx.setLineDash([2, 2]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y0); ctx.lineTo(w, y0);
        ctx.stroke();
        ctx.setLineDash([]);

        // Clouds
        ctx.save();
        ctx.fillStyle = 'rgba(100, 116, 139, 0.2)';
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.6)';
        const cloudPath = new Path2D();
        state.hourlyData.forEach((d, i) => {
            const x = i * step;
            const y = h - (h * (d.clouds / 100));
            if (i === 0) cloudPath.moveTo(x, y);
            else cloudPath.lineTo(x, y);
        });
        ctx.stroke(cloudPath);
        cloudPath.lineTo(w, h); cloudPath.lineTo(0, h);
        ctx.fill(cloudPath);
        ctx.restore();

        // Precipitation
        ctx.fillStyle = 'rgba(25, 118, 210, 0.5)';
        state.hourlyData.forEach((d, i) => {
            if (d.precip > 0) {
                const x = i * step;
                const barH = Math.max(2, Math.min(h, d.precip * 5));
                ctx.fillRect(x, h - barH, Math.max(1, step - 0.5), barH);
            }
        });

        // Prob
        ctx.save();
        ctx.fillStyle = 'rgba(2, 136, 209, 0.2)';
        ctx.strokeStyle = '#0288d1';
        const probPath = new Path2D();
        state.hourlyData.forEach((d, i) => {
            const x = i * step;
            const y = h - (h * (d.precipProb / 100));
            if (i === 0) probPath.moveTo(x, y);
            else probPath.lineTo(x, y);
        });
        ctx.stroke(probPath);
        probPath.lineTo(w, h); probPath.lineTo(0, h);
        ctx.fill(probPath);
        ctx.restore();

        // Temp
        ctx.strokeStyle = '#d32f2f';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        state.hourlyData.forEach((d, i) => {
            const x = i * step;
            const y = normalizeY(d.temp, -20, 40, h);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // UV
        state.hourlyData.forEach((d, i) => {
            if (d.uv >= 1) {
                const x = i * step;
                let color = getThemeColor('uvLevels.low', '#4caf50');
                if (d.uv >= 3 && d.uv < 6) color = getThemeColor('uvLevels.moderate', '#fbc02d');
                else if (d.uv >= 6 && d.uv < 8) color = getThemeColor('uvLevels.high', '#f57c00');
                else if (d.uv >= 8 && d.uv < 11) color = getThemeColor('uvLevels.veryHigh', '#d32f2f');
                else if (d.uv >= 11) color = getThemeColor('uvLevels.extreme', '#7b1fa2');
                ctx.fillStyle = color;
                ctx.fillRect(x, 0, Math.max(1, step), 3);
            }
        });

        // Now line
        const now = Date.now();
        const startTime = state.hourlyData[0].time;
        const nowIndex = (now - startTime) / 3600000;
        if (nowIndex >= 0 && nowIndex <= state.hourlyData.length) {
            const nowX = nowIndex * step;
            ctx.save();
            ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
            ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.moveTo(nowX, 0); ctx.lineTo(nowX, h); ctx.stroke();
            ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(nowX, 0, 4, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'white'; ctx.lineWidth = 1; ctx.stroke();
            ctx.restore();
        }

        ctx.restore();
        ctx_main.resetTransform();
        ctx_main.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx_main.drawImage(this.cacheCanvas, 0, 0);
        this.updateViewport();
    }

    updateViewport() {
        if (!state.hourlyData.length) return;
        const totalMainWidth = state.hourlyData.length * state.pixelsPerHour;
        const scrollRatio = this.scrollContainer.scrollLeft / totalMainWidth;
        const visibleRatio = this.scrollContainer.clientWidth / totalMainWidth;
        const minimapW = this.canvas.clientWidth;
        const vpWidth = visibleRatio * minimapW;
        const vpLeft = scrollRatio * minimapW;
        this.viewport.style.width = vpWidth + 'px';
        this.viewport.style.left = vpLeft + 'px';
        const mContainer = document.getElementById('minimap-container');
        if (mContainer && minimapW > mContainer.clientWidth) {
            const vpCenter = vpLeft + (vpWidth / 2);
            mContainer.scrollLeft = vpCenter - (mContainer.clientWidth / 2);
        }
    }
}
