/**
 * Sistema de detección de colisiones para etiquetas del scrubber.
 * Evita que las etiquetas de valores se superpongan visualmente.
 */

/**
 * Verifica si dos rectángulos se solapan.
 */
function rectsOverlap(a, b) {
    return !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);
}

/**
 * Encuentra una posición Y que no colisione con rectángulos existentes.
 */
export function findNonOverlappingY(labelRects, x, y, w, h, maxAttempts = 20, step = 1) {
    const candidate = { x, y, w, h };

    for (let i = 0; i < maxAttempts; i++) {
        let collision = false;
        for (const rect of labelRects) {
            if (rectsOverlap(candidate, rect)) {
                collision = true;
                break;
            }
        }
        if (!collision) return y;
        const direction = i % 2 === 0 ? 1 : -1;
        y += direction * step * Math.ceil((i + 1) / 2);
        candidate.y = y;
    }

    return y;
}

/**
 * Registra un rectángulo como ocupado.
 */
export function registerLabel(labelRects, x, y, w, h) {
    labelRects.push({ x, y, w, h });
}
