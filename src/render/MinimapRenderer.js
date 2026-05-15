import { state } from '../store.js';
import { getThemeColor, getThemeFont } from '../theme.js';
import { normalizeY } from '../utils/math.js';
import { getSplitIndex, getMinimapMode } from './MinimapViewport.js';

let minimapCacheCanvas = null;

function buildPrecipGradient(ctx, minimapData, w, alpha) {
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    if (minimapData.length === 0) return `rgba(2, 136, 209, ${alpha})`;
    minimapData.forEach((d, i) => {
        const isSnow = [71, 73, 75, 77, 85, 86].includes(d.weatherCode);
        const isThunder = [95, 96, 99].includes(d.weatherCode);
        let baseColor = '2, 136, 209';
        if (isSnow) baseColor = '0, 188, 212';
        else if (isThunder) baseColor = '126, 87, 194';
        grad.addColorStop(i / (minimapData.length - 1 || 1), `rgba(${baseColor}, ${alpha})`);
    });
    return grad;
}

function renderMinimapToCache(w, h, minimapData, startIndex, dpr) {
    if (!minimapCacheCanvas) minimapCacheCanvas = document.createElement('canvas');
    if (minimapCacheCanvas.width !== w * dpr || minimapCacheCanvas.height !== h * dpr) {
        minimapCacheCanvas.width = w * dpr;
        minimapCacheCanvas.height = h * dpr;
    }

    const ctx = minimapCacheCanvas.getContext('2d');
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const step = w / minimapData.length;

    ctx.fillStyle = '#fffde7';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f3e8ff';
    minimapData.forEach((d, i) => {
        if (d.isNight) ctx.fillRect(i * step, 0, step + 0.5, h);
    });

    ctx.save();
    let lastLabelX = -100;
    minimapData.forEach((d, i) => {
        const x = i * step;
        if (d.localHour === 0 || (i === 0 && d.localHour !== 0)) {
            ctx.strokeStyle = 'rgba(0,0,0,0.05)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();

            const dateObj = new Date(d.time);
            const dayStr = String(dateObj.getDate()).padStart(2, '0');
            const monthStr = String(dateObj.getMonth() + 1).padStart(2, '0');
            const dayText = `${d.localDayShort} ${dayStr}/${monthStr}`;
            const labelWidth = ctx.measureText(dayText).width + 16;
            if (x > lastLabelX + labelWidth) {
                ctx.fillStyle = '#666666';
                ctx.font = `bold 9px ${getThemeFont()}`;
                ctx.fillText(dayText, x + 4, 12);
                lastLabelX = x;
            }
        }
    });
    ctx.restore();

    const y0 = normalizeY(0, -20, 40, h);
    ctx.strokeStyle = 'rgba(2, 136, 209, 0.4)';
    ctx.setLineDash([2, 2]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y0);
    ctx.lineTo(w, y0);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.save();
    ctx.fillStyle = 'rgba(100, 116, 139, 0.2)';
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.6)';
    ctx.lineWidth = 1;
    const cloudPath = new Path2D();
    minimapData.forEach((d, i) => {
        const x = i * step;
        const y = h - (h * (d.clouds / 100));
        if (i === 0) cloudPath.moveTo(x, y);
        else cloudPath.lineTo(x, y);
    });
    ctx.stroke(cloudPath);
    cloudPath.lineTo(w, h);
    cloudPath.lineTo(0, h);
    ctx.fill(cloudPath);
    ctx.restore();

    const precipBarGrad = buildPrecipGradient(ctx, minimapData, w, 0.6);
    const probStrokeGrad = buildPrecipGradient(ctx, minimapData, w, 1.0);
    const probFillGrad = buildPrecipGradient(ctx, minimapData, w, 0.2);

    ctx.fillStyle = precipBarGrad;
    minimapData.forEach((d, i) => {
        if (d.precip > 0) {
            const x = i * step;
            const barH = Math.max(2, Math.min(h, d.precip * 5));
            ctx.fillRect(x, h - barH, Math.max(1, step - 0.5), barH);
        }
    });

    ctx.save();
    ctx.fillStyle = probFillGrad;
    ctx.strokeStyle = probStrokeGrad;
    ctx.lineWidth = 1;
    const probPath = new Path2D();
    minimapData.forEach((d, i) => {
        const x = i * step;
        const y = h - (h * (d.precipProb / 100));
        if (i === 0) probPath.moveTo(x, y);
        else probPath.lineTo(x, y);
    });
    ctx.stroke(probPath);
    probPath.lineTo(w, h);
    probPath.lineTo(0, h);
    ctx.fill(probPath);
    ctx.restore();

    ctx.strokeStyle = '#d32f2f';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    minimapData.forEach((d, i) => {
        const x = i * step;
        const y = normalizeY(d.temp, -20, 40, h);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    minimapData.forEach((d, i) => {
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

    const now = Date.now();
    const nowIndex = (now - state.hourlyData[0].time) / 3600000;
    const localNowIndex = nowIndex - startIndex;

    if (localNowIndex >= 0 && localNowIndex <= minimapData.length) {
        const nowX = localNowIndex * step;
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(nowX, 0);
        ctx.lineTo(nowX, h);
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(nowX, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }

    ctx.restore();
    return minimapCacheCanvas;
}

export function drawMinimap(minimapCanvas, minimapCtx) {
    if (!state.hourlyData.length || !minimapCanvas || !minimapCtx) return;

    const splitIndex = getSplitIndex();
    const minimapMode = getMinimapMode();
    let minimapData;
    let startIndex = 0;

    if (minimapMode === 'past') {
        minimapData = state.hourlyData.slice(0, splitIndex);
        startIndex = 0;
    } else {
        minimapData = state.hourlyData.slice(splitIndex);
        startIndex = splitIndex;
    }

    if (!minimapData.length) return;

    const w = minimapCanvas.clientWidth || window.innerWidth;
    const h = 80;
    const dpr = state.dpr;

    renderMinimapToCache(w, h, minimapData, startIndex, dpr);

    minimapCtx.resetTransform();
    minimapCtx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);
    minimapCtx.drawImage(minimapCacheCanvas, 0, 0);

    if (minimapMode === 'past') {
        minimapCtx.save();
        minimapCtx.fillStyle = getThemeColor('minimapPastOverlay', 'rgba(0, 0, 0, 0.45)');
        if (state.theme === 'light') minimapCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        minimapCtx.fillRect(0, 0, w, h);
        minimapCtx.restore();
    }
}

export function invalidateMinimapCache() {
    minimapCacheCanvas = null;
}
