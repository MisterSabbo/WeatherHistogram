import { hexToRgb } from '../utils/color.js';
import { getThemeColor, getThemeFont } from '../theme.js';
import { getAggregatedPollenLevel, getPollenColor } from '../services/AqiManager.js';

export function interpolateScrubberData(d1, d2, progress) {
  const interpolate = (v1, v2) => v1 + (v2 - v1) * progress;

  let tBezier = 0.5, minT = 0, maxT = 1;
  for (let i = 0; i < 10; i++) {
    const bx = 1.5 * tBezier - 1.5 * tBezier * tBezier + tBezier * tBezier * tBezier;
    if (bx < progress) minT = tBezier; else maxT = tBezier;
    tBezier = (minT + maxT) / 2;
  }
  const ty = tBezier * tBezier * (3 - 2 * tBezier);
  const interpolateBezier = (v1, v2) => v1 + (v2 - v1) * ty;

  return {
    temp: interpolate(d1.temp, d2.temp),
    apparent: interpolate(d1.apparent, d2.apparent),
    clouds: interpolateBezier(d1.clouds, d2.clouds),
    precipProb: interpolateBezier(d1.precipProb, d2.precipProb)
  };
}

export function getWeatherIconName(weatherCode) {
  if (weatherCode >= 1 && weatherCode <= 3) return 'cloud';
  if (weatherCode === 45 || weatherCode === 48) return 'foggy';
  if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82)) return 'rainy';
  if ((weatherCode >= 71 && weatherCode <= 77) || weatherCode === 85 || weatherCode === 86) return 'ac_unit';
  if (weatherCode >= 95) return 'thunderstorm';
  return 'clear_day';
}

export function updateWeatherZone(currentData, state, { haloColor, isDark, walkPhase, drawStickman }) {
  const summaryIconDOM = document.getElementById('summary-icon-dom');
  const summaryIconName = getWeatherIconName(currentData.weatherCode);
  if (summaryIconDOM) {
    if (summaryIconDOM.innerText !== summaryIconName) summaryIconDOM.innerText = summaryIconName;
    summaryIconDOM.style.textShadow = `0 0 4px ${haloColor}, 0 0 6px ${haloColor}`;
    summaryIconDOM.style.color = isDark ? '#f8fafc' : '#1e293b';
  }

  const isWindy = currentData.gusts >= state.stickmanThresholds.wind;
  const isNight = !!currentData.isNight;
  const stickmanCanvas = /** @type {HTMLCanvasElement} */ (document.getElementById('stickman-canvas'));
  if (stickmanCanvas) {
    const sCtx = stickmanCanvas.getContext('2d');
    sCtx.clearRect(0, 0, stickmanCanvas.width, stickmanCanvas.height);
    drawStickman(sCtx, 40, 80, walkPhase, currentData.apparent, currentData.weatherCode, isWindy, isDark, isNight, state.stickmanThresholds, currentData.precip, currentData.clouds);
  }

  const aqiWarningIcon = document.getElementById('aqi-warning-icon');
  const pollenWarningIcon = document.getElementById('pollen-warning-icon');
  const spfInfoContainer = document.getElementById('spf-info-container');
  const spfValueText = document.getElementById('spf-value-text');

  if (aqiWarningIcon && pollenWarningIcon && spfInfoContainer && spfValueText) {
    const pLevel = getAggregatedPollenLevel(currentData.pollenDetails || {});
    if (pLevel >= 2) {
      pollenWarningIcon.style.display = 'block';
      pollenWarningIcon.style.color = getPollenColor(pLevel);
    } else pollenWarningIcon.style.display = 'none';

    if (currentData.aqi !== null && currentData.aqi >= 101) {
      aqiWarningIcon.style.display = 'block';
      if (currentData.aqi <= 150) aqiWarningIcon.style.color = '#f97316';
      else if (currentData.aqi <= 200) aqiWarningIcon.style.color = '#ef4444';
      else if (currentData.aqi <= 300) aqiWarningIcon.style.color = '#9333ea';
      else aqiWarningIcon.style.color = '#831843';
    } else aqiWarningIcon.style.display = 'none';

    const uv = currentData.uv || 0;
    if (uv >= 3) {
      spfInfoContainer.style.display = 'flex';
      let spfText = '';
      if (uv >= 8) spfText = '50+';
      else if (uv >= 6) spfText = '50';
      else if (uv >= 3) spfText = '30';
      spfValueText.innerText = spfText;
      spfInfoContainer.dataset.uv = uv;
    } else if (uv > 0 && state.skinType <= 2) {
      spfInfoContainer.style.display = 'flex';
      spfValueText.innerText = '15';
      spfInfoContainer.dataset.uv = uv;
    } else {
      spfInfoContainer.style.display = 'none';
      spfInfoContainer.dataset.uv = uv;
    }

    const riskIconsRow = document.getElementById('risk-icons-row');
    if (riskIconsRow) {
      if (pollenWarningIcon.style.display !== 'none' || aqiWarningIcon.style.display !== 'none') {
        riskIconsRow.style.display = 'flex';
      } else riskIconsRow.style.display = 'none';
    }

    let visibleIcons = 1;
    if (pollenWarningIcon.style.display !== 'none') visibleIcons++;
    if (aqiWarningIcon.style.display !== 'none') visibleIcons++;
    if (spfInfoContainer.style.display !== 'none') visibleIcons++;

    const animatedWeatherZone = document.getElementById('animated-weather-zone');
    if (animatedWeatherZone) animatedWeatherZone.style.zIndex = visibleIcons > 2 ? '21' : '15';
  }
}

export function drawScrubberPoint(fixedOverlayCtx, y, color, value, unit, {
  shape = 'circle',
  icon = '',
  secondaryText = null,
  secondaryColor = null,
  secondaryIcon = '',
  drawX = 60,
  h,
  w,
  labelRects
}) {
  if (y >= h - 5) return;

  fixedOverlayCtx.fillStyle = color;
  fixedOverlayCtx.beginPath();
  if (shape === 'circle') {
    fixedOverlayCtx.arc(drawX, y, 4, 0, Math.PI * 2);
    fixedOverlayCtx.fill();
    fixedOverlayCtx.stroke();
  } else if (shape === 'diamond') {
    fixedOverlayCtx.moveTo(drawX, y - 5);
    fixedOverlayCtx.lineTo(drawX + 5, y);
    fixedOverlayCtx.lineTo(drawX, y + 5);
    fixedOverlayCtx.lineTo(drawX - 5, y);
    fixedOverlayCtx.closePath();
    fixedOverlayCtx.fill();
    fixedOverlayCtx.stroke();
  } else if (shape === 'square') {
    fixedOverlayCtx.rect(drawX - 3, y - 3, 6, 6);
    fixedOverlayCtx.fill();
    fixedOverlayCtx.stroke();
  }

  if (value !== null && (typeof value === 'string' || Math.abs(value) > 0.01)) {
    const bgH = secondaryText ? 32 : 22;
    let constrainedY = Math.max(0, Math.min(h - bgH, y));
    const text = `${value}${unit}`;

    fixedOverlayCtx.save();
    fixedOverlayCtx.font = `bold 13px ${getThemeFont()}`;
    const measureStr = text.replace(/[\d]/g, '0');
    const textMetrics = fixedOverlayCtx.measureText(measureStr);
    const iconWidth = icon ? (fixedOverlayCtx.font = '14px "Material Symbols Outlined"', fixedOverlayCtx.measureText(icon).width + 4) : 0;
    fixedOverlayCtx.font = `bold 11px ${getThemeFont()}`;
    const secMetrics = secondaryText ? (fixedOverlayCtx.font = `bold 11px ${getThemeFont()}`, fixedOverlayCtx.measureText(secondaryText.replace(/[\d]/g, '0'))) : { width: 0 };
    const secIconWidth = secondaryIcon ? (fixedOverlayCtx.font = '12px "Material Symbols Outlined"', fixedOverlayCtx.measureText(secondaryIcon).width + 4) : 0;

    const col1W = Math.max(iconWidth, secIconWidth);
    const bgW = Math.max(textMetrics.width, secMetrics.width) + col1W + 14;

    const rect = { x: drawX, y: constrainedY, w: bgW, h: bgH };

    let attempts = 0;
    let direction = 1;
    while (labelRects.some(r =>
      rect.x < r.x + r.w && rect.x + rect.w > r.x &&
      rect.y < r.y + r.h && rect.y + rect.h > r.y
    ) && attempts < 20) {
      const collidingWithNow = labelRects.some(r => r.isNowBtn &&
        rect.x < r.x + r.w && rect.x + rect.w > r.x &&
        rect.y < r.y + r.h && rect.y + rect.h > r.y);
      if (collidingWithNow) {
        rect.x += 10;
        if (rect.x + rect.w > w) {
          rect.x = drawX;
          rect.y += (bgH + 1) * direction;
          constrainedY += (bgH + 1) * direction;
        }
      } else {
        if (rect.y + bgH * 2 > h) direction = -1;
        rect.y += (bgH + 1) * direction;
        constrainedY += (bgH + 1) * direction;
      }
      attempts++;
    }

    if (rect.y < 0) rect.y = 2;
    if (rect.y + rect.h > h) rect.y = h - rect.h - 2;

    labelRects.push(rect);

    const c = hexToRgb(color);
    const lightMix = getThemeColor('scrubber.bgLightMix', 0.85);
    const bgR = Math.round(255 * lightMix + c.r * (1 - lightMix));
    const bgG = Math.round(255 * lightMix + c.g * (1 - lightMix));
    const bgB = Math.round(255 * lightMix + c.b * (1 - lightMix));
    const opacity = getThemeColor('scrubber.bgOpacity', 0.75);
    fixedOverlayCtx.fillStyle = `rgba(${bgR}, ${bgG}, ${bgB}, ${opacity})`;
    fixedOverlayCtx.beginPath();
    fixedOverlayCtx.roundRect(rect.x, rect.y, rect.w, rect.h, [0, 6, 6, 6]);
    fixedOverlayCtx.fill();
    fixedOverlayCtx.strokeStyle = getThemeColor('scrubber.borderColor', color);
    fixedOverlayCtx.lineWidth = 0.5;
    fixedOverlayCtx.stroke();

    fixedOverlayCtx.fillStyle = color;
    fixedOverlayCtx.textBaseline = 'middle';

    const textBaseX = rect.x + 6;
    const textStartX = textBaseX + col1W;
    const textY = secondaryText ? rect.y + 11 : rect.y + rect.h / 2 + 0.5;

    if (icon) {
      fixedOverlayCtx.font = '14px "Material Symbols Outlined"';
      fixedOverlayCtx.fillStyle = color;
      fixedOverlayCtx.fillText(icon, textBaseX, textY);
    }
    fixedOverlayCtx.font = `bold 13px ${getThemeFont()}`;
    fixedOverlayCtx.fillStyle = color;
    fixedOverlayCtx.fillText(text, textStartX, textY);

    if (secondaryText) {
      if (secondaryIcon) {
        fixedOverlayCtx.font = '13px "Material Symbols Outlined"';
        fixedOverlayCtx.fillStyle = secondaryColor;
        fixedOverlayCtx.fillText(secondaryIcon, textBaseX, textY + 14);
      }
      fixedOverlayCtx.font = `bold 11px ${getThemeFont()}`;
      fixedOverlayCtx.fillStyle = secondaryColor;
      fixedOverlayCtx.fillText(secondaryText, textStartX, textY + 14);
    }
    fixedOverlayCtx.restore();
  }
}

export function updateUVBlock(d1, index, fixedOverlayCanvas, PIXELS_PER_HOUR) {
  const uvBlockDOM = document.getElementById('uv-active-block');
  if (d1.uv > 0 && !d1.isNight) {
    let uvColor;
    if (d1.uv >= 11) uvColor = getThemeColor('uvLevels.extreme', '#7b1fa2');
    else if (d1.uv >= 8) uvColor = getThemeColor('uvLevels.veryHigh', '#d32f2f');
    else if (d1.uv >= 6) uvColor = getThemeColor('uvLevels.high', '#f57c00');
    else if (d1.uv >= 3) uvColor = getThemeColor('uvLevels.moderate', '#fbc02d');
    else uvColor = getThemeColor('uvLevels.low', '#4caf50');

    const uvText = `UV ${parseFloat(d1.uv).toFixed(1)}`;

    const c = hexToRgb(uvColor);
    const bgR = Math.round(255 * 0.8 + c.r * 0.2);
    const bgG = Math.round(255 * 0.8 + c.g * 0.2);
    const bgB = Math.round(255 * 0.8 + c.b * 0.2);
    const opacityColor = `rgba(${bgR}, ${bgG}, ${bgB}, 0.95)`;

    let textColor = uvColor;
    if (uvColor === getThemeColor('uvLevels.moderate', '#fbc02d') || uvColor === '#fbc02d') {
      textColor = '#e65100';
    }

    const cellAbsX = index * PIXELS_PER_HOUR;

    if (uvBlockDOM) {
      uvBlockDOM.style.display = 'flex';
      uvBlockDOM.style.left = cellAbsX + 'px';
      uvBlockDOM.style.width = PIXELS_PER_HOUR + 'px';
      uvBlockDOM.style.backgroundColor = opacityColor;
      uvBlockDOM.style.color = textColor;
      uvBlockDOM.innerText = uvText;
    }
  } else {
    if (uvBlockDOM) uvBlockDOM.style.display = 'none';
  }
}
