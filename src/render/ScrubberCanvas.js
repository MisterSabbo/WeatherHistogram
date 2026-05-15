import { getThemeColor, getThemeFont, getThemeIcon } from '../theme.js';
import { hexToRgb } from '../utils/hexToRgb.js';
import { findNonOverlappingY, registerLabel } from './ScrubberLabels.js';

/**
 * Dibuja un punto de datos en el scrubber con etiqueta anti-colisión.
 * Extraído de la función nested drawPoint en drawFixedOverlay.
 */
export function drawScrubberPoint(ctx, drawX, y, color, value, unit, shape, icon, secondaryText, secondaryColor, secondaryIcon, labelRects, canvasH, canvasW) {
    if (y >= canvasH - 5) return;

    ctx.fillStyle = color;
    ctx.beginPath();
    if (shape === 'circle') {
        ctx.arc(drawX, y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    } else if (shape === 'diamond') {
        ctx.moveTo(drawX, y - 5);
        ctx.lineTo(drawX + 5, y);
        ctx.lineTo(drawX, y + 5);
        ctx.lineTo(drawX - 5, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    } else if (shape === 'square') {
        ctx.rect(drawX - 3, y - 3, 6, 6);
        ctx.fill();
        ctx.stroke();
    }

    if (value !== null && (typeof value === 'string' || Math.abs(value) > 0.01)) {
        const bgH = secondaryText ? 32 : 22;
        let constrainedY = Math.max(0, Math.min(canvasH - bgH, y));
        const text = `${value}${unit}`;

        ctx.save();
        ctx.font = `bold 13px ${getThemeFont()}`;
        const measureStr = text.replace(/[\d]/g, '0');
        const textMetrics = ctx.measureText(measureStr);
        const iconWidth = icon ? (ctx.font = '14px "Material Symbols Outlined"', ctx.measureText(icon).width + 4) : 0;
        ctx.font = `bold 11px ${getThemeFont()}`;
        const secMetrics = secondaryText ? (ctx.font = `bold 11px ${getThemeFont()}`, ctx.measureText(secondaryText.replace(/[\d]/g, '0'))) : { width: 0 };
        const secIconWidth = secondaryIcon ? (ctx.font = '12px "Material Symbols Outlined"', ctx.measureText(secondaryIcon).width + 4) : 0;

        const col1W = Math.max(iconWidth, secIconWidth);
        const bgW = Math.max(textMetrics.width, secMetrics.width) + col1W + 14;

        let rect = { x: drawX, y: constrainedY, w: bgW, h: bgH };

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
                if (rect.x + rect.w > canvasW) {
                    rect.x = drawX;
                    rect.y += (bgH + 1) * direction;
                    constrainedY += (bgH + 1) * direction;
                }
            } else {
                if (rect.y + bgH * 2 > canvasH) direction = -1;
                rect.y += (bgH + 1) * direction;
                constrainedY += (bgH + 1) * direction;
            }
            attempts++;
        }

        if (rect.y < 0) rect.y = 2;
        if (rect.y + rect.h > canvasH) rect.y = canvasH - rect.h - 2;

        labelRects.push(rect);

        const c = hexToRgb(color);
        const lightMix = getThemeColor('scrubber.bgLightMix', 0.85);
        const bgR = Math.round(255 * lightMix + c.r * (1 - lightMix));
        const bgG = Math.round(255 * lightMix + c.g * (1 - lightMix));
        const bgB = Math.round(255 * lightMix + c.b * (1 - lightMix));
        const opacity = getThemeColor('scrubber.bgOpacity', 0.75);

        ctx.fillStyle = `rgba(${bgR}, ${bgG}, ${bgB}, ${opacity})`;
        ctx.beginPath();
        ctx.roundRect(rect.x, rect.y, rect.w, rect.h, [0, 6, 6, 6]);
        ctx.fill();
        ctx.strokeStyle = getThemeColor('scrubber.borderColor', color);
        ctx.lineWidth = 0.5;
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.textBaseline = 'middle';

        const textBaseX = rect.x + 6;
        const textStartX = textBaseX + col1W;
        const textY = secondaryText ? rect.y + 11 : rect.y + rect.h / 2 + 0.5;

        if (icon) {
            ctx.font = '14px "Material Symbols Outlined"';
            ctx.fillStyle = color;
            ctx.fillText(icon, textBaseX, textY);
        }

        ctx.font = `bold 13px ${getThemeFont()}`;
        ctx.fillStyle = color;
        ctx.fillText(text, textStartX, textY);

        if (secondaryText) {
            if (secondaryIcon) {
                ctx.font = '13px "Material Symbols Outlined"';
                ctx.fillStyle = secondaryColor;
                ctx.fillText(secondaryIcon, textBaseX, textY + 14);
            }
            ctx.font = `bold 11px ${getThemeFont()}`;
            ctx.fillStyle = secondaryColor;
            ctx.fillText(secondaryText, textStartX, textY + 14);
        }
        ctx.restore();
    }
}
