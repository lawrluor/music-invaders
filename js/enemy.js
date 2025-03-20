/**
 * Enemy class for the game
 */

class Enemy {
  constructor(x, y, midiNote, animationOffset = 0) {
    // Position and size
    this.x = x;
    this.y = y;
    this.initialY = y;
    this.width = 85; // Increased size by 30% again (from 65)
    this.height = 85; // Increased size by 30% again (from 65)
    
    // MIDI note
    this.midiNote = midiNote;
    this.noteName = utils.midiNoteToName(midiNote);
    
    // Movement
    this.speed = 12.5 + Math.random() * 3; // Pixels per second
    this.wobbleAmount = 10;
    this.wobbleSpeed = 1 + Math.random() * 0.5;
    
    // Animation
    this.animationTime = animationOffset;
    this.alive = true;
    this.hitTime = 0;
    this.hitDuration = 0.5; // seconds
    this.shieldHitTime = 0;
    this.shieldHitDuration = 1.0; // seconds
    this.deathTime = 0;
    this.deathDuration = 0.3; // seconds - faster fade out
    this.hasHitShield = false; // Flag to track if enemy has already hit the shield
    
    // Colors
    this.color = this.getColorFromNote(midiNote);
  }
  
  // Update enemy position and animation
  update(deltaTime) {
    if (!this.alive) return;
    
    // Convert deltaTime to seconds for easier animation calculations
    const dt = deltaTime / 1000;
    
    // Update animation time
    this.animationTime += dt;
    
    // Move down
    this.y += this.speed * dt;
    
    // Wobble side to side
    this.x += Math.sin(this.animationTime * this.wobbleSpeed) * 0.5;
    
    // Update hit animation
    if (this.hitTime > 0) {
      this.hitTime -= dt;
    }
    
    // Update shield hit animation
    if (this.shieldHitTime > 0) {
      this.shieldHitTime -= dt;
    }
    
    // Update death animation
    if (this.deathTime > 0) {
      this.deathTime -= dt;
      if (this.deathTime <= 0) {
        this.alive = false;
      }
    }
  }
  
  // Draw enemy
  draw(ctx) {
    if (!this.alive && this.deathTime <= 0) return;
    
    // Save context
    ctx.save();
    
    // Death animation
    if (this.deathTime > 0) {
      const progress = 1 - (this.deathTime / this.deathDuration);
      const scale = 1 + progress * 0.5;
      const alpha = 1 - progress;
      
      ctx.globalAlpha = alpha;
      ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
      ctx.scale(scale, scale);
      ctx.translate(-this.width / 2, -this.height / 2);
    } else {
      ctx.translate(this.x, this.y);
    }
    
    // Wobble animation
    const wobble = Math.sin(this.animationTime * 2) * 2;
    const tentacleWobble = Math.sin(this.animationTime * 3) * 3;
    
    // Hit flash
    if (this.hitTime > 0) {
      ctx.fillStyle = '#fff';
    } 
    // Shield hit animation
    else if (this.shieldHitTime > 0) {
      const progress = 1 - (this.shieldHitTime / this.shieldHitDuration);
      ctx.fillStyle = `rgba(0, 255, 255, ${0.8 - progress * 0.8})`;
    } 
    // Normal color
    else {
      ctx.fillStyle = this.color;
    }
    
    // Draw enemy based on React component reference
    // Center coordinates
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    
    // Animation - bouncy effect
    const bounceAmount = Math.sin(this.animationTime * 3) * 3;
    
    // Draw container (circular border with glow)
    ctx.beginPath();
    ctx.arc(centerX, centerY, this.width / 2 - 2, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 255, 255, 0.2)`;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Create glow effect
    try {
      const glowRadius = this.width / 2;
      const glow = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, glowRadius
      );
      // Convert color to rgba with alpha (reduced glow)
      const colorWithAlpha = this.color.startsWith('hsl') 
        ? this.color.replace('hsl', 'hsla').replace(')', ', 0.15)')
        : this.color.startsWith('rgb')
          ? this.color.replace('rgb', 'rgba').replace(')', ', 0.15)')
          : this.color;
      
      glow.addColorStop(0, colorWithAlpha); // Add alpha for transparency
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = glow;
      ctx.fill();
    } catch (e) {
      // Fallback if gradient fails
      console.log('Gradient error:', e.message);
    }
    
    // Draw tentacles first (they go behind the head)
    const tentacleCount = 3;
    const tentacleWidth = 4;
    const tentacleHeight = 20; // Increased from 10 to make tentacles longer
    const tentacleSpacing = 7; // 4px width + 2px margin on each side
    
    // Calculate starting position for first tentacle
    const firstTentacleX = centerX - ((tentacleCount - 1) * tentacleSpacing) / 2;
    
    // Draw tentacle container div
    ctx.save();
    ctx.translate(centerX, centerY + 5 + bounceAmount * 0.5);
    
    // Draw each tentacle
    ctx.fillStyle = this.color;
    for (let i = 0; i < tentacleCount; i++) {
      const tentacleX = -((tentacleCount - 1) * tentacleSpacing) / 2 + (i * tentacleSpacing);
      
      // Draw tentacle (rounded rectangle)
      ctx.beginPath();
      const radius = tentacleWidth / 2;
      
      // Draw rounded rectangle for tentacle
      ctx.moveTo(tentacleX, 0);
      ctx.lineTo(tentacleX + tentacleWidth, 0);
      ctx.lineTo(tentacleX + tentacleWidth, tentacleHeight);
      ctx.arc(tentacleX + radius, tentacleHeight, radius, 0, Math.PI, true);
      ctx.lineTo(tentacleX, tentacleHeight);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    
    // Reset fill style for next elements if needed
    if (this.hitTime > 0) {
      ctx.fillStyle = '#fff';
    } 
    else if (this.shieldHitTime > 0) {
      const progress = 1 - (this.shieldHitTime / this.shieldHitDuration);
      ctx.fillStyle = `rgba(0, 255, 255, ${0.8 - progress * 0.8})`;
    } 
    else {
      ctx.fillStyle = this.color;
    }
    
    // Draw enemy head
    const headWidth = 40; // Increased from 30 to make head larger
    const headHeight = 32; // Increased from 24 to make head taller
    const headY = centerY - 5 + bounceAmount * 0.7; // Position with bounce effect
    
    // Draw head (rounded rectangle with top rounded corners)
    ctx.fillStyle = this.color;
    ctx.beginPath();
    
    // Draw rounded rectangle with only top corners rounded
    const topRadius = 15; // Rounded top corners
    const bottomRadius = 5; // Less rounded bottom corners
    
    // Top left corner
    ctx.moveTo(centerX - headWidth/2 + topRadius, headY - headHeight/2);
    // Top edge
    ctx.lineTo(centerX + headWidth/2 - topRadius, headY - headHeight/2);
    // Top right corner
    ctx.arc(centerX + headWidth/2 - topRadius, headY - headHeight/2 + topRadius, topRadius, -Math.PI/2, 0, false);
    // Right edge
    ctx.lineTo(centerX + headWidth/2, headY + headHeight/2 - bottomRadius);
    // Bottom right corner
    ctx.arc(centerX + headWidth/2 - bottomRadius, headY + headHeight/2 - bottomRadius, bottomRadius, 0, Math.PI/2, false);
    // Bottom edge
    ctx.lineTo(centerX - headWidth/2 + bottomRadius, headY + headHeight/2);
    // Bottom left corner
    ctx.arc(centerX - headWidth/2 + bottomRadius, headY + headHeight/2 - bottomRadius, bottomRadius, Math.PI/2, Math.PI, false);
    // Left edge
    ctx.lineTo(centerX - headWidth/2, headY - headHeight/2 + topRadius);
    // Top left corner
    ctx.arc(centerX - headWidth/2 + topRadius, headY - headHeight/2 + topRadius, topRadius, Math.PI, Math.PI*3/2, false);
    
    ctx.closePath();
    ctx.fill();
    
    // Add head glow
    try {
      const headGlow = ctx.createRadialGradient(
        centerX, headY, 0,
        centerX, headY, headWidth/2 + 5
      );
      // Convert color to rgba with alpha for head glow
      const headColorFull = this.color.startsWith('hsl') 
        ? this.color.replace('hsl', 'hsla').replace(')', ', 1.0)')
        : this.color.startsWith('rgb')
          ? this.color.replace('rgb', 'rgba').replace(')', ', 1.0)')
          : this.color;
          
      const headColorFaded = this.color.startsWith('hsl') 
        ? this.color.replace('hsl', 'hsla').replace(')', ', 0.2)')
        : this.color.startsWith('rgb')
          ? this.color.replace('rgb', 'rgba').replace(')', ', 0.2)')
          : this.color;
      
      headGlow.addColorStop(0, headColorFull);
      headGlow.addColorStop(0.7, headColorFaded);
      headGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = headGlow;
      ctx.beginPath();
      ctx.arc(centerX, headY, headWidth/2 + 5, 0, Math.PI * 2);
      ctx.fill();
    } catch (e) {
      console.log('Head glow error:', e.message);
    }
    
    // Draw googley eyes (more centered and cute)
    const eyeRadius = 6; // Increased from 4.5 for larger eyes
    const eyeOffsetX = 8; // Adjusted from 6 to match larger head
    const eyeOffsetY = -7; // Adjusted from -5 to match larger head
    const pupilRadius = 3.5; // Increased from 2.5 for larger pupils
    
    // Random pupil position for googley effect
    const pupilOffsetX = Math.sin(this.animationTime * 2) * 1.2;
    const pupilOffsetY = Math.cos(this.animationTime * 1.5) * 1.2;
    
    // Left eye white
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(
      centerX - eyeOffsetX,
      headY + eyeOffsetY,
      eyeRadius,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Right eye white
    ctx.beginPath();
    ctx.arc(
      centerX + eyeOffsetX,
      headY + eyeOffsetY,
      eyeRadius,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Left eye pupil (with googley movement)
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(
      centerX - eyeOffsetX + pupilOffsetX,
      headY + eyeOffsetY + pupilOffsetY,
      pupilRadius,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Right eye pupil (with googley movement)
    ctx.beginPath();
    ctx.arc(
      centerX + eyeOffsetX + pupilOffsetX,
      headY + eyeOffsetY + pupilOffsetY,
      pupilRadius,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Eye highlights
    ctx.fillStyle = '#fff';
    const highlightRadius = 1.2; // Highlight
    
    // Left eye highlight
    ctx.beginPath();
    ctx.arc(
      centerX - eyeOffsetX - 1.5,
      headY + eyeOffsetY - 1.5,
      highlightRadius,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Right eye highlight
    ctx.beginPath();
    ctx.arc(
      centerX + eyeOffsetX - 1.5,
      headY + eyeOffsetY - 1.5,
      highlightRadius,
      0,
      Math.PI * 2
    );
    ctx.fill();
    

    
    // Draw note name below enemy
    ctx.fillStyle = '#dddddd'; // Light grey instead of white for better readability
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Position below enemy
    const noteY = centerY + this.height/2 + 5;
    
    // Add text shadow for glow effect
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 1;
    ctx.fillText(this.noteName, centerX, noteY);
    
    // Add second shadow for stronger glow
    ctx.shadowBlur = 1;
    ctx.fillText(this.noteName, centerX, noteY);
    
    // Reset shadow
    ctx.shadowBlur = 0;
    
    // Restore context
    ctx.restore();
  }
  
  // Get color based on MIDI note
  getColorFromNote(note) {
    // Use hue based on note (C = red, C# = orange, etc.)
    const hue = (note % 12) * 30;
    // Use brightness based on octave
    const lightness = 50 + (Math.floor(note / 12) - 2) * 10;
    
    return `hsl(${hue}, 100%, ${lightness}%)`;
  }
  
  // Check if this enemy matches the given MIDI note
  matchesNote(note) {
    return this.midiNote === note;
  }
  
  // Hit the enemy
  hit() {
    this.hitTime = this.hitDuration;
  }
  
  // Start death animation
  die() {
    if (this.deathTime <= 0) { // Only start death animation if not already dying
      this.deathTime = this.deathDuration;
    }
  }
  
  // Hit the shield
  hitShield() {
    if (!this.hasHitShield) {
      this.shieldHitTime = this.shieldHitDuration;
      this.hasHitShield = true;
    }
  }
  
  // Check collision with a point
  collidesWith(x, y) {
    return this.alive &&
           x >= this.x &&
           x <= this.x + this.width &&
           y >= this.y &&
           y <= this.y + this.height;
  }
  
  // Check if enemy is below the shield
  isBelowShield(shieldY) {
    return this.y + this.height > shieldY;
  }
}
