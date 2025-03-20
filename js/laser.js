/**
 * Laser class for the game
 */

class Laser {
  constructor(startX, startY, targetX, targetY) {
    // Start and end positions
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    
    // Animation
    this.duration = 0.3; // seconds
    this.time = 0;
    this.active = true;
    
    // Hit status
    this.hit = false;
  }
  
  // Update laser animation
  update(deltaTime) {
    if (!this.active) return;
    
    // Convert deltaTime to seconds
    const dt = deltaTime / 1000;
    
    // Update time
    this.time += dt;
    
    // Deactivate if animation is complete
    if (this.time >= this.duration) {
      this.active = false;
    }
  }
  
  // Draw laser
  draw(ctx) {
    if (!this.active) return;
    
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
    
    // Outer glow
    ctx.strokeStyle = `rgba(0, 255, 255, ${alpha * 0.5})`;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // Inner beam
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // Draw impact if hit and near end of animation
    if (this.hit && progress > 0.4 && progress < 0.7) {
      const impactSize = 10 * (1 - Math.abs(progress - 0.5) * 2);
      
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
