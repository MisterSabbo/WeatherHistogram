import { state, CONFIG } from '../store.js';
import { getThemeColor } from '../theme.js';

export function normalizeY(val, min, max, height) {
    const norm = (val - min) / (max - min);
    return height - (norm * height * 0.8) - (height * 0.1); 
}
