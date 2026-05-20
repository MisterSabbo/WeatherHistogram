import { state } from '../store.js';

export function drawAQIRadar(data, targetId = 'aqi-radar', detailsId = 'aqi-details') {
    const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById(targetId));
    if (!canvas || !data.aqiDetails) return;
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 60;

    const pollutants = [
        { name: 'PM10', val: data.aqiDetails.pm10 || 0, max: 100 },
        { name: 'PM2.5', val: data.aqiDetails.pm2_5 || 0, max: 75 },
        { name: 'O3', val: data.aqiDetails.ozone || 0, max: 180 },
        { name: 'NO2', val: data.aqiDetails.nitrogen_dioxide || 0, max: 200 }
    ];

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw axis lines and background (square/diamond for 4 elements)
    const corners = pollutants.length;
    ctx.strokeStyle = 'rgba(128,128,128,0.4)';
    ctx.lineWidth = 1;
    for (let j = 1; j <= 3; j++) {
        ctx.beginPath();
        const r = (radius / 3) * j;
        for (let i = 0; i < corners; i++) {
            const angle = (Math.PI * 2 / corners) * i - Math.PI / 2;
            const x = centerX + r * Math.cos(angle);
            const y = centerY + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
    }

    // Ejes
    ctx.beginPath();
    for (let i = 0; i < corners; i++) {
        const angle = (Math.PI * 2 / corners) * i - Math.PI / 2;
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
    }
    ctx.stroke();

    // Etiquetas
    ctx.font = 'bold 9px Inter';
    ctx.fillStyle = 'var(--text-primary)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    pollutants.forEach((p, i) => {
        const angle = (Math.PI * 2 / corners) * i - Math.PI / 2;
        const labelDist = radius + 22;
        const x = centerX + labelDist * Math.cos(angle);
        const y = centerY + labelDist * Math.sin(angle);

        ctx.save();
        ctx.shadowColor = state.theme === 'dark' ? 'black' : 'white';
        ctx.shadowBlur = 4;
        ctx.fillText(p.name, x, y);
        ctx.restore();
    });

    // Área de datos
    ctx.fillStyle = 'rgba(239, 68, 68, 0.6)'; // Reddish for pollution
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    pollutants.forEach((p, i) => {
        const angle = (Math.PI * 2 / corners) * i - Math.PI / 2;
        const r = Math.min(radius, (p.val / p.max) * radius);
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Detalles texto
    const details = document.getElementById(detailsId);
    if (details) {
        details.innerHTML = pollutants.map(p => {
            const unit = 'µg/m³';
            return `<div style="display:flex; justify-content:space-between;"><span>${p.name}:</span> <b>${p.val.toFixed(1)} ${unit}</b></div>`;
        }).join('');
    }
}
