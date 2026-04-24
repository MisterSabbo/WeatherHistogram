import { getThemeIcon } from '../services/ThemeManager.js';

export function getAQIInfo(aqi) {
    if (aqi === null) return { text: '--', rec: '' };
    let level = 1;
    if (aqi <= 6) {
        level = aqi;
    } else {
        if (aqi <= 20) level = 1;
        else if (aqi <= 40) level = 2;
        else if (aqi <= 60) level = 3;
        else if (aqi <= 80) level = 4;
        else if (aqi <= 100) level = 5;
        else level = 6;
    }

    const map = {
        1: { t: 'Bueno', r: 'Calidad de aire ideal para actividades al aire libre.' },
        2: { t: 'Regular', r: 'Los grupos sensibles deben considerar reducir el esfuerzo físico.' },
        3: { t: 'Moderado', r: 'Se recomienda reducir actividades intensas al aire libre.' },
        4: { t: 'Pobre', r: 'Evite el esfuerzo físico prolongado al aire libre.' },
        5: { t: 'Muy Pobre', r: 'Mantenga las ventanas cerradas y evite salir.' },
        6: { t: 'Extremo', r: 'Alerta de salud: evite cualquier actividad al aire libre.' }
    };

    return {
        text: map[level]?.t || 'Desconocido',
        rec: map[level]?.r || '',
        val: aqi
    };
}

export function getWeatherDescription(code) {
    const mapping = {
        0: "Despejado", 1: "Principalmente despejado", 2: "Parcialmente nublado", 3: "Cubierto",
        45: "Niebla", 48: "Niebla con escarcha",
        51: "Llovizna ligera", 53: "Llovizna moderada", 55: "Llovizna densa",
        56: "Llovizna helada ligera", 57: "Llovizna helada densa",
        61: "Lluvia débil", 63: "Lluvia moderada", 65: "Lluvia fuerte",
        66: "Lluvia helada ligera", 67: "Lluvia helada fuerte",
        71: "Nieve débil", 73: "Nieve moderada", 75: "Nieve fuerte", 77: "Granizo",
        80: "Chubascos de lluvia débiles", 81: "Chubascos de lluvia moderados", 82: "Chubascos de lluvia violentos",
        85: "Chubascos de nieve débiles", 86: "Chubascos de nieve fuertes",
        95: "Tormenta", 96: "Tormenta con granizo débil", 99: "Tormenta con granizo fuerte"
    };
    return mapping[code] || "Desconocido";
}

export function getPollenText(val) {
    if (val === null || val === undefined) return '--';
    if (val < 1) return 'Nulo';
    if (val < 15) return 'Bajo';
    if (val < 50) return 'Medio';
    return 'Alto';
}

export function getWeatherIconSVG(code) {
    let iconName = getThemeIcon('dailyCards.clear', 'clear_day');
    
    if (code >= 1 && code <= 3) {
        iconName = getThemeIcon('dailyCards.cloudy', 'cloud');
    } else if (code === 45 || code === 48) {
        iconName = getThemeIcon('dailyCards.fog', 'foggy');
    } else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
        iconName = getThemeIcon('dailyCards.rain', 'rainy');
    } else if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
        iconName = getThemeIcon('dailyCards.snow', 'ac_unit');
    } else if (code >= 95) {
        iconName = getThemeIcon('dailyCards.thunderstorm', 'thunderstorm');
    }
    return `<span class="material-symbols-outlined" style="font-size:24px;">${iconName}</span>`;
}
