import { state } from '../store.js';
import { getThemeFont } from '../theme.js';
import { getLocale } from '../utils/i18n.js';

export function drawSunMarkersOnCanvas(ctx, viewX, viewW, h, PIXELS_PER_HOUR) {
    if (!state.hourlyData.length) return;
    const startTime = state.hourlyData[0].time;
    const markerColor = '#666666';

    ctx.save();
    ctx.font = `bold 10px ${getThemeFont()}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.lineWidth = 1.5;

    Object.keys(state.sunData).forEach(dateStr => {
        const sun = state.sunData[dateStr];
        const sunriseX = ((sun.sunrise - startTime) / 3600000) * PIXELS_PER_HOUR;
        const sunsetX = ((sun.sunset - startTime) / 3600000) * PIXELS_PER_HOUR;

        const sunriseTime = new Date(sun.sunrise).toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit', timeZone: state.timezone });
        const sunsetTime = new Date(sun.sunset).toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit', timeZone: state.timezone });

        const drawMarker = (x, time, type) => {
            if (x < viewX - 50 || x > viewX + viewW + 50) return;

            ctx.save();
            ctx.translate(x, 0);
            ctx.strokeStyle = markerColor;
            ctx.fillStyle = markerColor;
            ctx.lineWidth = 2;

            ctx.shadowColor = 'white';
            ctx.shadowBlur = 3;

            ctx.beginPath();
            ctx.moveTo(-12, 0); ctx.lineTo(12, 0);

            ctx.moveTo(6, 0);
            ctx.arc(0, 0, 6, 0, Math.PI, false);

            const rayLen = 4;
            for (let j = 0; j < 5; j++) {
                const a = (j * Math.PI) / 4;
                ctx.moveTo(Math.cos(a) * 8, Math.sin(a) * 8);
                ctx.lineTo(Math.cos(a) * (8 + rayLen), Math.sin(a) * (8 + rayLen));
            }

            if (type === 'sunrise') {
                ctx.moveTo(-3, 15); ctx.lineTo(0, 18); ctx.lineTo(3, 15);
                ctx.moveTo(0, 18); ctx.lineTo(0, 11);
            } else {
                ctx.moveTo(-3, 14); ctx.lineTo(0, 11); ctx.lineTo(3, 14);
                ctx.moveTo(0, 11); ctx.lineTo(0, 18);
            }

            ctx.strokeStyle = 'white';
            ctx.lineWidth = 4;
            ctx.stroke();

            ctx.strokeStyle = markerColor;
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.font = 'bold 10px Inter';
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'white';
            ctx.strokeText(time, 0, 20);
            ctx.fillStyle = markerColor;
            ctx.fillText(time, 0, 20);
            ctx.restore();
        };

        drawMarker(sunriseX, sunriseTime, 'sunrise');
        drawMarker(sunsetX, sunsetTime, 'sunset');
    });
    ctx.restore();
}
