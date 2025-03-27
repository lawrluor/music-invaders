/**
 * Laser class for the game
 */

class Laser {
  constructor(startX, startY, targetX, targetY, power = 1, delay = 0) {
    // Start and end positions
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    
    // Power level (1-4 based on number of notes in chord)
    this.power = Math.min(Math.max(power, 1), 4);
    
    // Animation
    this.duration = 0.3 + (this.power * 0.05); // Longer duration for more powerful lasers
    this.time = 0;
    this.active = true;
    
    // Delay before laser starts moving (in seconds)
    this.delay = delay;
    this.delayRemaining = delay;
    
    // Hit status
    this.hit = false;
  }

  setTarget(targetX, targetY) {
    this.targetX = targetX;
    this.targetY = targetY;
  }

  setSource(startX, startY) {
    this.startX = startX;
    this.startY = startY;
  }

  // Update laser animation
  update(deltaTime) {
    if (!this.active) return;
    
    // Convert deltaTime to seconds
    const dt = deltaTime / 1000;
    
    // Handle delay before starting animation
    if (this.delayRemaining > 0) {
      this.delayRemaining -= dt;
      return; // Don't update animation during delay
    }
    
    // Update time
    this.time += dt;
    
    // Deactivate if animation is complete
    if (this.time >= this.duration) {
      this.active = false;
    }
  }
  
  // Draw laser
  draw(ctx) {
    if (!this.active || this.delayRemaining > 0) return; // Don't draw during delay
    
    // Calculate progress (0 to 1)
    const progress = this.time / this.duration;
    
    // Calculate current position
    const x1 = this.startX;
    const y1 = this.startY;
    let x2, y2;
    
    // Extend the laser based on progress
    if (progress < 0.5) {
      // First half: extend from start to target
      const extendProgress = progress * 2; // 0 to 1 during first half
      x2 = x1 + (this.targetX - x1) * extendProgress;
      y2 = y1 + (this.targetY - y1) * extendProgress;
    } else {
      // Second half: fade out
      x2 = this.targetX;
      y2 = this.targetY;
    }
    
    // Calculate alpha based on progress
    let alpha = 1;
    if (progress > 0.5) {
      alpha = 1 - ((progress - 0.5) * 2); // Fade out in second half
    }
    
    // Draw laser beam
    ctx.save();
    
    // Determine color based on power level
    let outerColor, innerColor;
    switch(this.power) {
      case 1: // Single note - cyan
        outerColor = `rgba(0, 255, 255, ${alpha * 0.5})`;
        innerColor = `rgba(255, 255, 255, ${alpha})`;
        break;
      case 2: // Two notes - green
        outerColor = `rgba(0, 255, 100, ${alpha * 0.6})`;
        innerColor = `rgba(200, 255, 200, ${alpha})`;
        break;
      case 3: // Three notes - yellow/orange
        outerColor = `rgba(255, 200, 0, ${alpha * 0.7})`;
        innerColor = `rgba(255, 255, 200, ${alpha})`;
        break;
      case 4: // Four notes or more - red/purple
        outerColor = `rgba(255, 0, 255, ${alpha * 0.8})`;
        innerColor = `rgba(255, 200, 255, ${alpha})`;
        break;
    }
    
    // Outer glow - size based on power
    ctx.strokeStyle = outerColor;
    ctx.lineWidth = 4 + (this.power * 2); // 6-12 based on power
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // Inner beam
    ctx.strokeStyle = innerColor;
    ctx.lineWidth = 1 + this.power; // 2-5 based on power
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // Draw impact if hit and near end of animation
    if (this.hit && progress > 0.4 && progress < 0.7) {
      const impactSize = (8 + (this.power * 3)) * (1 - Math.abs(progress - 0.5) * 2);
      
      // Outer impact glow
      let impactColor;
      switch(this.power) {
        case 1: // Single note - cyan
          impactColor = `rgba(0, 255, 255, ${alpha * 0.7})`;
          break;
        case 2: // Two notes - green
          impactColor = `rgba(0, 255, 100, ${alpha * 0.7})`;
          break;
        case 3: // Three notes - yellow/orange
          impactColor = `rgba(255, 200, 0, ${alpha * 0.7})`;
          break;
        case 4: // Four notes or more - red/purple
          impactColor = `rgba(255, 0, 255, ${alpha * 0.7})`;
          break;
      }
      
      ctx.fillStyle = impactColor;
      ctx.beginPath();
      ctx.arc(this.targetX, this.targetY, impactSize * 1.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner impact
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(this.targetX, this.targetY, impactSize, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
  
  // Mark the laser as having hit a target
  markHit() {
    this.hit = true;
  }
}
