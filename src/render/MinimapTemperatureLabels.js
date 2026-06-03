import { normalizeY } from '../utils/math.js';
import { getThemeColor, getThemeFont } from '../theme.js';

export class MinimapTemperatureLabels {
  constructor() {
    this.significanceThreshold = 3;
    this.minPixelsBetweenLabels = 40;
    this.tempRange = { min: -20, max: 40 };
  }

  draw(ctx, data, width, height, step) {
    if (!ctx || data.length < 3) return;

    const extrema = this.detectExtrema(data);
    let significant = this.filterSignificant(extrema);
    significant = this.deduplicateSameType(significant);

    ctx.save();
    ctx.shadowColor = 'white';
    ctx.shadowBlur = 3;
    ctx.textAlign = 'center';
    ctx.font = `bold 9px ${getThemeFont()}`;
    ctx.fillStyle = getThemeColor('tempLine', '#d32f2f');

    let lastDrawnMaxX = -Infinity;
    let lastDrawnMinX = -Infinity;

    for (const ex of significant) {
      const x = ex.index * step;
      if (ex.type === 'max') {
        if (x - lastDrawnMaxX < this.minPixelsBetweenLabels) continue;
      } else {
        if (x - lastDrawnMinX < this.minPixelsBetweenLabels) continue;
      }

      const yRaw = normalizeY(ex.temp, this.tempRange.min, this.tempRange.max, height);
      let labelY;
      if (ex.type === 'max') {
        const aboveY = yRaw - 4;
        if (aboveY < 4) {
          ctx.textBaseline = 'top';
          labelY = Math.min(height - 4, yRaw + 4);
        } else {
          ctx.textBaseline = 'bottom';
          labelY = aboveY;
        }
      } else {
        const belowY = yRaw + 5;
        if (belowY > height - 4) {
          ctx.textBaseline = 'bottom';
          labelY = Math.max(4, yRaw - 4);
        } else {
          ctx.textBaseline = 'top';
          labelY = belowY;
        }
      }

      ctx.fillText(ex.temp + '\u00B0', x, labelY);
      if (ex.type === 'max') {
        lastDrawnMaxX = x;
      } else {
        lastDrawnMinX = x;
      }
    }

    ctx.restore();
  }

  detectExtrema(data) {
    const extrema = [];
    const n = data.length;
    const temps = data.map(d => Math.round(d.temp));

    for (let i = 0; i < n; i++) {
      const temp = temps[i];
      let isMax;
      let isMin;

      if (i === 0) {
        isMax = temp >= temps[i + 1];
        isMin = temp <= temps[i + 1];
      } else if (i === n - 1) {
        isMax = temp >= temps[i - 1];
        isMin = temp <= temps[i - 1];
      } else {
        isMax = temp > temps[i - 1] && temp >= temps[i + 1];
        isMin = temp < temps[i - 1] && temp <= temps[i + 1];
      }

      if (isMax && isMin) continue;
      if (isMax) extrema.push({ index: i, type: 'max', temp });
      else if (isMin) extrema.push({ index: i, type: 'min', temp });
    }

    return extrema;
  }

  filterSignificant(extrema) {
    if (!extrema.length) return [];

    const result = [extrema[0]];
    let prevTemp = extrema[0].temp;
    let wasPreviousSkipped = false;

    for (let i = 1; i < extrema.length; i++) {
      if (wasPreviousSkipped) {
        result.push(extrema[i]);
        wasPreviousSkipped = false;
      } else {
        const diff = Math.abs(extrema[i].temp - prevTemp);
        if (diff >= this.significanceThreshold) {
          result.push(extrema[i]);
        } else {
          wasPreviousSkipped = true;
        }
      }
      prevTemp = extrema[i].temp;
    }

    return result;
  }

  deduplicateSameType(extrema) {
    if (extrema.length < 2) return extrema;

    const result = [extrema[0]];

    for (let i = 1; i < extrema.length; i++) {
      const prev = result[result.length - 1];
      const curr = extrema[i];

      if (prev.type === curr.type) {
        if (curr.type === 'max') {
          if (curr.temp > prev.temp) result[result.length - 1] = curr;
        } else {
          if (curr.temp < prev.temp) result[result.length - 1] = curr;
        }
      } else {
        result.push(curr);
      }
    }

    return result;
  }
}
