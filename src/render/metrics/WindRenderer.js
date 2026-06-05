import { state } from '../../store.js';
import { getThemeColor, getThemeIcon } from '../../theme.js';

export function drawWind(ctx, viewX, viewW, h, styles, PIXELS_PER_HOUR) {
    const startIdx = Math.max(0, Math.floor(viewX / PIXELS_PER_HOUR) - 5);
    const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / PIXELS_PER_HOUR) + 5);

    ctx.save();
    for (let i = startIdx; i < endIdx; i++) {
        const d = state.hourlyData[i];
        if (d.localHour % 3 === 0) {
            const x = i * PIXELS_PER_HOUR;
            const y = 35;

            ctx.save();
            ctx.translate(x, y);

            ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
            ctx.shadowBlur = 4;
            ctx.rotate((d.windDir + 180) * Math.PI / 180);

            let windColor = state.theme === 'dark' ? getThemeColor('wind.normalDark', '#A8C4D8') : getThemeColor('wind.normalLight', '#6B8DAD');
            if (d.temp < 10) {
                windColor = getThemeColor('wind.cold', '#4A9FD9');
            } else if (d.temp > 28) {
                windColor = getThemeColor('wind.hot', '#E8734A');
            }

            if (d.wind > 40 && d.temp <= 28 && d.temp >= 10) {
                windColor = state.theme === 'dark' ? getThemeColor('wind.strongDefaultDark', '#E8734A') : getThemeColor('wind.strongDefaultLight', '#E8734A');
            }

            const wIcon = getThemeIcon('windDirection', null);
            if (wIcon) {
                ctx.font = '14px "Material Symbols Outlined"';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = windColor;
                ctx.strokeStyle = state.theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)';
                ctx.lineWidth = 1;
                ctx.strokeText(wIcon, 0, 0);
                ctx.fillText(wIcon, 0, 0);
            } else {
                ctx.fillStyle = windColor;
                ctx.strokeStyle = state.theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(0, -6);
                ctx.lineTo(4, 4);
                ctx.lineTo(0, 2);
                ctx.lineTo(-4, 4);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }

            ctx.restore();
        }
    }
    ctx.restore();
}
