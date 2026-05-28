/**
 * @param {string} hex
 * @returns {{ r: number, g: number, b: number }}
 */
export function hexToRgb(hex) {
  let r = 0, g = 0, b = 0;
  if (typeof hex !== 'string') return { r, g, b };
  if (hex.startsWith('rgb')) {
    const parts = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (parts) { r = parseInt(parts[1]); g = parseInt(parts[2]); b = parseInt(parts[3]); }
  } else {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex) || /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
    if (result) {
      if (result[1].length === 1) {
        r = parseInt(result[1] + result[1], 16); g = parseInt(result[2] + result[2], 16); b = parseInt(result[3] + result[3], 16);
      } else {
        r = parseInt(result[1], 16); g = parseInt(result[2], 16); b = parseInt(result[3], 16);
      }
    }
  }
  return { r, g, b };
}

/**
 * @param {string} bgColor
 * @returns {string}
 */
export function getTextColorForBg(bgColor) {
  const { r, g, b } = hexToRgb(bgColor);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
}
