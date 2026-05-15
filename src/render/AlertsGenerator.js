import { t } from '../utils/i18n.js';

export function generateAlerts(hourlyData, index) {
    const alerts = [];
    const alertTypes = new Set();
    let alertLevel = 0;

    for (let i = index; i < Math.min(hourlyData.length, index + 12); i++) {
        const hourData = hourlyData[i];
        if (!hourData) continue;

        if (hourData.temp >= 38 && !alertTypes.has('temp')) {
            alerts.push({ type: 'temp', level: 3, msg: t('alerts.extremeHeat', 'Calor extremo (>38°C)') });
            alertTypes.add('temp');
            alertLevel = Math.max(alertLevel, 3);
        } else if (hourData.temp >= 35 && !alertTypes.has('temp')) {
            alerts.push({ type: 'temp', level: 2, msg: t('alerts.highTemp', 'Altas temperaturas (>35°C)') });
            alertTypes.add('temp');
            alertLevel = Math.max(alertLevel, 2);
        } else if (hourData.temp <= -5 && !alertTypes.has('temp')) {
            alerts.push({ type: 'temp', level: 2, msg: t('alerts.extremeCold', 'Frío extremo (<-5°C)') });
            alertTypes.add('temp');
            alertLevel = Math.max(alertLevel, 2);
        }

        if (hourData.gusts >= 90 && !alertTypes.has('wind')) {
            alerts.push({ type: 'wind', level: 3, msg: t('alerts.hurricaneWind', 'Vientos huracanados (>90km/h)') });
            alertTypes.add('wind');
            alertLevel = Math.max(alertLevel, 3);
        } else if (hourData.gusts >= 70 && !alertTypes.has('wind')) {
            alerts.push({ type: 'wind', level: 2, msg: t('alerts.strongWind', 'Rachas muy fuertes (>70km/h)') });
            alertTypes.add('wind');
            alertLevel = Math.max(alertLevel, 2);
        }

        if (hourData.precip >= 15 && !alertTypes.has('rain')) {
            alerts.push({ type: 'rain', level: 3, msg: t('alerts.torrentialRain', 'Lluvias torrenciales (>15mm/h)') });
            alertTypes.add('rain');
            alertLevel = Math.max(alertLevel, 3);
        } else if (hourData.precip >= 8 && !alertTypes.has('rain')) {
            alerts.push({ type: 'rain', level: 2, msg: t('alerts.heavyRain', 'Lluvias intensas (>8mm/h)') });
            alertTypes.add('rain');
            alertLevel = Math.max(alertLevel, 2);
        }

        if (hourData.uv >= 11 && !alertTypes.has('uv')) {
            alerts.push({ type: 'uv', level: 3, msg: t('alerts.extremeUV', 'Índice UV Extremo (≥11)') });
            alertTypes.add('uv');
            alertLevel = Math.max(alertLevel, 3);
        }

        const isSnow = [71, 73, 75, 77, 85, 86].includes(hourData.weatherCode);
        if (isSnow && hourData.precip >= 2 && !alertTypes.has('snow')) {
            alerts.push({ type: 'snow', level: 2, msg: t('alerts.heavySnow', 'Nevadas intensas') });
            alertTypes.add('snow');
            alertLevel = Math.max(alertLevel, 2);
        }
    }

    return { alerts, alertLevel };
}

export function updateAlertsUI(alerts, alertLevel, container, tooltip) {
    if (!container || !tooltip) return;

    if (alerts.length > 0) {
        container.style.display = 'flex';

        let alertHtml = `<div style="font-weight:bold; margin-bottom:5px; border-bottom:1px solid rgba(128,128,128,0.2); padding-bottom:3px; color:var(--text-primary);">${t('topPanel.activeAlerts')}</div>`;

        let iconColor = '#fbc02d';
        if (alertLevel === 3) iconColor = '#d32f2f';
        else if (alertLevel === 2) iconColor = '#f57c00';

        container.querySelector('.material-symbols-outlined').style.color = iconColor;

        alerts.forEach(a => {
            let c = a.level === 3 ? '#ef5350' : a.level === 2 ? '#ff9800' : '#ffca28';
            alertHtml += `<div style="display:flex; align-items:center; gap:6px; margin:4px 0; color:var(--text-primary);"><span style="min-width:8px; width:8px; height:8px; border-radius:50%; background:${c};"></span> <span style="font-size:0.85rem; text-align:left;">${a.msg}</span></div>`;
        });
        tooltip.innerHTML = alertHtml;
    } else {
        container.style.display = 'none';
    }
}
