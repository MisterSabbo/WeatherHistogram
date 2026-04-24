import { state } from '../../core/Store.js';
import { getThemeColor, getThemeFont, getThemeIcon } from '../../services/ThemeManager.js';
import { normalizeY, hexToRgb } from '../../utils/math.js';

export class UvLayer {
    constructor() {}

    render(ctx, viewX, viewW, h, styles) {
        this.drawUVSegments(ctx, viewX, viewW, h, styles);
    }

    drawUVSegments(ctx, viewX, viewW, h) {
                const startIdx = Math.max(0, Math.floor(viewX / state.pixelsPerHour) - 2);
                const endIdx = Math.min(state.hourlyData.length, Math.ceil((viewX + viewW) / state.pixelsPerHour) + 2);
    
                for (let i = startIdx; i < endIdx; i++) {
                    const d = state.hourlyData[i];
                    if (d.uv >= 1) {
                        const x = i * state.pixelsPerHour;
                        let color = '#4caf50'; // Low (1-2)
                        if (d.uv >= 3 && d.uv < 6) color = '#fbc02d'; // Moderate (3-5)
                        else if (d.uv >= 6 && d.uv < 8) color = '#f57c00'; // High (6-7)
                        else if (d.uv >= 8 && d.uv < 11) color = '#d32f2f'; // Very High (8-10)
                        else if (d.uv >= 11) color = '#7b1fa2'; // Extreme (11+)
    
                        ctx.fillStyle = color;
                        ctx.fillRect(x, 0, state.pixelsPerHour + 0.5, 2);
                    }
                }
            }

}
