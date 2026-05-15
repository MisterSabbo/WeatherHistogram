/**
 * Convierte colores hex o rgba a objeto {r, g, b}.
 * Soporta: #RGB, #RRGGBB, rgba(r,g,b,...)
 */
export function hexToRgb(hex) {
    let r = 0, g = 0, b = 0;
    if (typeof hex !== 'string') return {r, g, b};
    if (hex.startsWith('rgba')) {
        const parts = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (parts) { r = parseInt(parts[1]); g = parseInt(parts[2]); b = parseInt(parts[3]); }
    } else {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex) || /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
        if (result) {
            if (result[1].length === 1) {
                r = parseInt(result[1]+result[1], 16); g = parseInt(result[2]+result[2], 16); b = parseInt(result[3]+result[3], 16);
            } else {
                r = parseInt(result[1], 16); g = parseInt(result[2], 16); b = parseInt(result[3], 16);
            }
        }
    }
    return {r, g, b};
}
