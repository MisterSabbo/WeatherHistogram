export function drawMoon(ctx, x, y, moonColor, glowColor) {
    const radius = 20;
    ctx.save();
    const grad = ctx.createRadialGradient(x, y, radius, x, y, radius + 40);
    grad.addColorStop(0, 'rgba(144, 202, 249, 0.2)');
    grad.addColorStop(1, 'rgba(144, 202, 249, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius + 40, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = moonColor;
    ctx.shadowBlur = 10;
    ctx.shadowColor = glowColor;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0.2 * Math.PI, 1.8 * Math.PI);
    ctx.quadraticCurveTo(x + radius * 0.5, y, x + radius * Math.cos(0.2 * Math.PI), y + radius * Math.sin(0.2 * Math.PI));
    ctx.fill();

    ctx.restore();
}
