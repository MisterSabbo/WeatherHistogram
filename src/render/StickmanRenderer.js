export function drawStickman(ctx, x, y, walkPhase, apparentTemp, precCode, isWindy, isDarkTheme, isNight, thresholds, precipAmt, clouds) {
    ctx.save();
    
    // Inverted halo shadow
    ctx.shadowColor = isDarkTheme ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)';
    ctx.shadowBlur = 6;

    const strokeColor = isDarkTheme ? '#e2e8f0' : '#1e293b';
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = strokeColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Reactions
    const isSnowing = ((precCode >= 71 && precCode <= 77) || precCode === 85 || precCode === 86);
    const isRaining = (!isSnowing && precipAmt > 0) || ((precCode >= 51 && precCode <= 67) || (precCode >= 80 && precCode <= 82) || precCode >= 95);
    const isHot = apparentTemp >= thresholds.hot;
    const isCold = apparentTemp <= thresholds.cold;
    const isSunnyDay = !isNight && clouds < thresholds.clouds;
    
    // Wind lean
    const windLean = isWindy ? Math.PI / 10 : 0;
    
    ctx.translate(x, y);
    ctx.rotate(windLean);
    
    // Walking dynamics (sideways, facing right)
    const legLength = 12;
    const bodyLen = 14;
    const headRadius = 4.5;
    
    const maxLegSwing = Math.PI / 4;
    // Walk cycle: two steps per phase
    const swing1 = Math.sin(walkPhase * Math.PI * 2) * maxLegSwing;
    const swing2 = Math.sin((walkPhase + 0.5) * Math.PI * 2) * maxLegSwing;
    
    const bounce = Math.abs(Math.sin(walkPhase * Math.PI * 4)) * 1.5;
    const pelvisY = -legLength - bounce;
    const neckY = pelvisY - bodyLen;
    
    // --- DRAWING BACK ARM & LEG FIRST ---
    // Back leg (Leg 2)
    ctx.beginPath();
    ctx.moveTo(0, pelvisY);
    ctx.lineTo(Math.sin(swing2) * legLength, pelvisY + Math.cos(swing2) * legLength);
    ctx.stroke();
    
    if (isSnowing) {
        // Boots
        ctx.strokeStyle = '#8b5cf6'; // Purple boot
        ctx.lineWidth = 4;
        ctx.beginPath();
        const bootTipX = Math.sin(swing2) * legLength;
        const bootTipY = pelvisY + Math.cos(swing2) * legLength;
        ctx.moveTo(Math.sin(swing2) * (legLength - 4), pelvisY + Math.cos(swing2) * (legLength - 4));
        ctx.lineTo(bootTipX, bootTipY);
        ctx.lineTo(bootTipX + 2, bootTipY); // Foot facing forward
        ctx.stroke();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2.5;
    }

    // Back Arm (Arm 2) swinging opposite to back leg
    const arm2Angle = swing1 * 1.2; 
    const arm2tipX = Math.sin(arm2Angle) * 9;
    const arm2tipY = neckY + 2 + Math.cos(arm2Angle) * 9;
    
    // Always draw back arm unless it's doing something very specific that needs hiding (we don't need hiding)
    ctx.beginPath();
    ctx.moveTo(0, neckY + 2);
    ctx.lineTo(arm2tipX, arm2tipY);
    ctx.stroke();
    
    if (isSnowing) {
        // Glove
        ctx.fillStyle = '#8b5cf6';
        ctx.beginPath();
        ctx.arc(arm2tipX, arm2tipY, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // --- DRAW BODY & HEAD ---
    ctx.beginPath();
    ctx.moveTo(0, pelvisY);
    ctx.lineTo(0, neckY);
    ctx.stroke();
    
    // Head -> moved slightly forward to signify direction
    const headCenterX = 1;
    const headCenterY = neckY - headRadius;
    
    ctx.save();
    ctx.shadowBlur = 0; // Disable shadow for the head so it looks pure white/unaffected by blur
    ctx.beginPath();
    ctx.arc(headCenterX, headCenterY, headRadius, 0, Math.PI * 2);
    // Explicitly set fill and stroke for the head to meet the user's requirements
    ctx.fillStyle = isHot ? '#fca5a5' : '#ffffff'; 
    ctx.fill();
    
    if (isHot) {
        ctx.strokeStyle = '#fca5a5'; // Pure reddish border for blush
    } else {
        ctx.strokeStyle = strokeColor;
    }
    ctx.stroke();
    ctx.restore();
    
    // Sunglasses
    if (isSunnyDay) {
        ctx.fillStyle = '#111827';
        ctx.beginPath();
        // Lens on the right
        ctx.arc(headCenterX + 2, headCenterY - 0.5, 2, 0, Math.PI, false);
        ctx.lineTo(headCenterX + 4, headCenterY - 2.5);
        ctx.lineTo(headCenterX, headCenterY - 2.5);
        ctx.fill();
        
        // Earpiece
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(headCenterX, headCenterY - 1.5);
        ctx.lineTo(headCenterX - 3.5, headCenterY - 1.5);
        ctx.lineTo(headCenterX - 4.5, headCenterY + 0.5);
        ctx.stroke();
        
        // Restore
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2.5;
    }
    
    // --- DRAW FRONT LEG & ARM ---
    // Front leg (Leg 1)
    ctx.beginPath();
    ctx.moveTo(0, pelvisY);
    ctx.lineTo(Math.sin(swing1) * legLength, pelvisY + Math.cos(swing1) * legLength);
    ctx.stroke();
    
    if (isSnowing) {
        // Boots
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 4;
        ctx.beginPath();
        const bootTipX = Math.sin(swing1) * legLength;
        const bootTipY = pelvisY + Math.cos(swing1) * legLength;
        ctx.moveTo(Math.sin(swing1) * (legLength - 4), pelvisY + Math.cos(swing1) * (legLength - 4));
        ctx.lineTo(bootTipX, bootTipY);
        ctx.lineTo(bootTipX + 2, bootTipY);
        ctx.stroke();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2.5;
    }
    
    // Front Arm (Arm 1)
    const arm1Angle = swing2 * 1.2;
    let arm1tipX = Math.sin(arm1Angle) * 9;
    let arm1tipY = neckY + 2 + Math.cos(arm1Angle) * 9;
    
    if (isRaining) {
        // Holding umbrella up and forward
        arm1tipX = 4;
        arm1tipY = neckY - 2;
        ctx.beginPath();
        ctx.moveTo(0, neckY + 2);
        ctx.lineTo(arm1tipX, arm1tipY);
        ctx.stroke();
        
        // Umbrella Handle
        ctx.beginPath();
        ctx.moveTo(arm1tipX, arm1tipY + 2);
        ctx.lineTo(arm1tipX, headCenterY - 10);
        ctx.stroke();
        
        // Umbrella Canopy
        ctx.fillStyle = '#0288d1';
        ctx.beginPath();
        ctx.arc(arm1tipX, headCenterY - 8, 12, Math.PI, 0); // Flat bottom half circle
        ctx.fill();
    } else if (isCold && !isSnowing) { // If it's snowing, arms swing normally with gloves
        // Arms rubbing body for warmth
        ctx.beginPath();
        ctx.moveTo(0, neckY + 2);
        ctx.lineTo(4, neckY + 8);
        ctx.lineTo(-1, neckY + 10);
        ctx.stroke();
    } else {
        // Normal front arm swing
        ctx.beginPath();
        ctx.moveTo(0, neckY + 2);
        ctx.lineTo(arm1tipX, arm1tipY);
        ctx.stroke();
        
        if (isSnowing) {
            // Glove
            ctx.fillStyle = '#8b5cf6';
            ctx.beginPath();
            ctx.arc(arm1tipX, arm1tipY, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // --- ACCESSORIES (OVER ARM) ---
    if (isCold) {
        // Scarf
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3.5;
        // Wrap around neck
        ctx.beginPath();
        ctx.moveTo(-2, neckY + 2);
        ctx.lineTo(3, neckY + 2);
        ctx.stroke();
        // Tail
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(2, neckY + 2);
        const scarfTailX = isWindy ? -6 : -2;
        const scarfTailY = isWindy ? neckY : neckY + 6;
        ctx.quadraticCurveTo(0, scarfTailY, scarfTailX, scarfTailY);
        ctx.stroke();
    }
    
    // Zzz at night
    if (isNight) {
        ctx.fillStyle = isDarkTheme ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 0; // Disable shadow for text
        ctx.font = '10px "Inter", sans-serif';
        // Float zzz upwards based on walk phase for a continuous dreamy effect
        const zOffset = (walkPhase * 20) % 15;
        ctx.fillText('z', headCenterX + 4 + zOffset*0.2, headCenterY - 4 - zOffset);
        ctx.font = '8px "Inter", sans-serif';
        ctx.fillText('z', headCenterX + 8 + zOffset*0.3, headCenterY - 8 - zOffset*1.2);
    }
    
    // Wind lines
    if (isWindy) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = isDarkTheme ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1.5;
        const windPhase = (Date.now() / 200) % 20; // moving lines
        ctx.beginPath();
        ctx.moveTo(-15 + windPhase, pelvisY - 5);
        ctx.lineTo(-5 + windPhase, pelvisY - 5);
        ctx.moveTo(-20 + windPhase, neckY);
        ctx.lineTo(-8 + windPhase, neckY);
        ctx.stroke();
    }
    
    ctx.restore();
}
