import { state } from '../store.js';
import { t } from '../utils/i18n.js';

export function drawPollenRadar(data) {
    const canvas = document.getElementById('pollen-radar');
    if (!canvas || !data.pollenDetails) return;
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 55;
    const plants = [
        { name: t('pollen.alder'), val: data.pollenDetails.alder, max: 50 },
        { name: t('pollen.birch'), val: data.pollenDetails.birch, max: 50 },
        { name: t('pollen.grass'), val: data.pollenDetails.grass, max: 30 },
        { name: t('pollen.mugwort'), val: data.pollenDetails.mugwort, max: 30 },
        { name: t('pollen.olive'), val: data.pollenDetails.olive, max: 50 },
        { name: t('pollen.ragweed'), val: data.pollenDetails.ragweed, max: 30 }
    ];

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar fondo (hexágono)
    ctx.strokeStyle = 'rgba(128,128,128,0.4)';
    ctx.lineWidth = 1;
    for (let j = 1; j <= 3; j++) {
        ctx.beginPath();
        const r = (radius / 3) * j;
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 2;
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
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
    }
    ctx.stroke();

    // Etiquetas
    ctx.font = 'bold 9px Inter';
    ctx.fillStyle = 'var(--text-primary)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    plants.forEach((p, i) => {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const labelDist = radius + 22;
        const x = centerX + labelDist * Math.cos(angle);
        let y = centerY + labelDist * Math.sin(angle);
        if (i === 1 || i === 5) y -= 5;
        if (i === 2 || i === 4) y += 5;

        ctx.save();
        ctx.shadowColor = state.theme === 'dark' ? 'black' : 'white';
        ctx.shadowBlur = 4;
        ctx.fillText(p.name, x, y);
        ctx.restore();
    });

    // Área de datos
    ctx.fillStyle = 'rgba(234, 179, 8, 0.6)'; // Yellow context for pollen
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;
    ctx.beginPath();
    plants.forEach((p, i) => {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const r = Math.min(radius, (Math.max(0, p.val) / p.max) * radius);
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Detalles texto
    const details = document.getElementById('pollen-details');
    if (details) {
        details.innerHTML = plants.map(p => {
            return `<div style="display:flex; justify-content:space-between;"><span>${p.name}:</span> <b>${p.val ? p.val.toFixed(1) : t('pollen.noData')}</b></div>`;
        }).join('');
    }
}
