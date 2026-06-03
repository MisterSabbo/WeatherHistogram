import { getSplitIndex } from '../utils/time.js';
import { getThemeColor, getThemeFont } from '../theme.js';
import { normalizeY } from '../utils/math.js';

export class MinimapRenderer {
  constructor({ canvas, ctx, viewportEl, scrollContainer, centerOnCurrentTime, updateNowButtonPosition, minimapHeight }) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.viewportEl = viewportEl;
    this.scrollContainer = scrollContainer;
    this.centerOnCurrentTime = centerOnCurrentTime;
    this.updateNowButtonPosition = updateNowButtonPosition;
    this.minimapHeight = minimapHeight;
    this.cacheCanvas = null;
    this.mode = 'future';
    this.isDragging = false;
  }

  invalidateCache() {
    this.cacheCanvas = null;
  }

  setMode(mode, isUserInteraction, state, config) {
    const hasChanged = this.mode !== mode;
    this.mode = mode;

    if (isUserInteraction) {
      if (mode === 'future') {
        this.centerOnCurrentTime();
      } else if (mode === 'past') {
        this.scrollContainer.scrollLeft = 0;
      }
    }

    if (hasChanged) {
      requestAnimationFrame(() => {
        this.invalidateCache();
        this.updateViewport(state, config);
        this.draw(state, config);
      });
    }
  }

  updateViewport(state, config) {
    if (!state.hourlyData.length) return;

    const PIXELS_PER_HOUR = config.PIXELS_PER_HOUR;
    const splitIndex = getSplitIndex(state.hourlyData[0].time, state.hourlyData.length);
    const startIndex = this.mode === 'past' ? 0 : splitIndex;
    const dataLength = this.mode === 'past' ? splitIndex : state.hourlyData.length - splitIndex;
    if (dataLength <= 0) return;

    const currentLeftIndex = this.scrollContainer.scrollLeft / PIXELS_PER_HOUR;
    const currentRightIndex = (this.scrollContainer.scrollLeft + this.scrollContainer.clientWidth) / PIXELS_PER_HOUR;
    const centerIndex = currentLeftIndex + (currentRightIndex - currentLeftIndex) / 2;

    if (!this.isDragging) {
      if (this.mode === 'future' && centerIndex < splitIndex) {
        this.setMode('past', false, state, config);
        return;
      } else if (this.mode === 'past' && centerIndex >= splitIndex && centerIndex < state.hourlyData.length) {
        this.setMode('future', false, state, config);
        return;
      }
    }

    const minimapW = this.canvas.clientWidth;
    const localLeftIndex = currentLeftIndex - startIndex;
    const localRightIndex = currentRightIndex - startIndex;

    const vpLeft = (localLeftIndex / dataLength) * minimapW;
    const vpWidth = ((localRightIndex - localLeftIndex) / dataLength) * minimapW;

    this.viewportEl.style.width = vpWidth + 'px';
    this.viewportEl.style.left = vpLeft + 'px';

    const mContainer = document.getElementById('minimap-container');
    if (mContainer && minimapW > mContainer.clientWidth) {
      const vpCenter = vpLeft + (vpWidth / 2);
      mContainer.scrollLeft = vpCenter - (mContainer.clientWidth / 2);
    }

    this.updateNowButtonPosition();
  }

  handleClick(clientX, state, config) {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));

    const PIXELS_PER_HOUR = config.PIXELS_PER_HOUR;
    const splitIndex = getSplitIndex(state.hourlyData[0].time, state.hourlyData.length);
    const startIndex = this.mode === 'past' ? 0 : splitIndex;
    const dataLength = this.mode === 'past' ? splitIndex : state.hourlyData.length - splitIndex;

    const targetLocalIndex = ratio * dataLength;
    const targetGlobalIndex = startIndex + targetLocalIndex;

    return (targetGlobalIndex * PIXELS_PER_HOUR) - (this.scrollContainer.clientWidth / 2);
  }

  setCanvasSize(state) {
    const MINIMAP_HEIGHT = this.minimapHeight;
    const targetWidth = this.canvas.parentElement.clientWidth || window.innerWidth;
    this.canvas.width = targetWidth * state.dpr;
    this.canvas.height = MINIMAP_HEIGHT * state.dpr;
    this.canvas.style.width = targetWidth + 'px';
    this.canvas.style.height = MINIMAP_HEIGHT + 'px';
  }

  draw(state, config) {
    if (!state.hourlyData.length) return;

    const MINIMAP_HEIGHT = this.minimapHeight;
    const splitIndex = getSplitIndex(state.hourlyData[0].time, state.hourlyData.length);
    let minimapData, startIndex;

    if (this.mode === 'past') {
      minimapData = state.hourlyData.slice(0, splitIndex);
      startIndex = 0;
    } else {
      minimapData = state.hourlyData.slice(splitIndex);
      startIndex = splitIndex;
    }

    if (!minimapData.length) return;

    const w = this.canvas.clientWidth || window.innerWidth;
    const h = MINIMAP_HEIGHT;
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

    const buildPrecipGradient = (alpha) => {
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
    };

    const precipBarGrad = buildPrecipGradient(0.6);
    const probStrokeGrad = buildPrecipGradient(1.0);
    const probFillGrad = buildPrecipGradient(0.2);

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

    if (this.mode === 'past') {
      ctx.save();
      ctx.fillStyle = getThemeColor('minimapPastOverlay', 'rgba(0, 0, 0, 0.45)');
      if (state.theme === 'light') ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    ctx.restore();

    this.ctx.resetTransform();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.cacheCanvas, 0, 0);
    this.updateViewport(state, config);
  }
}
