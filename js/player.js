/**
 * Player class for the game
 */

class Player {
  constructor(canvasWidth, canvasHeight, chordMode = false, referenceHeight = 800) {
    // Position and size
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.referenceHeight = referenceHeight;
    this.width = 40;
    this.height = 30;

    // Scale vertical position based on canvas height
    const positionScale = this.canvasHeight / this.referenceHeight;
    this.baseY = this.canvasHeight - 100 * positionScale; // Scale vertical position
    this.x = canvasWidth / 2 - this.width / 2;
    this.y = this.baseY;

    // Movement
    this.targetX = this.x;
    this.moveSpeed = 0.35; // Factor for smooth movement (0-1)

    // Shield - scale shield height and position
    this.shieldHeight = 30 * positionScale;
    this.shieldY = this.y - this.shieldHeight;

    // Ammo
    this.maxAmmo = 60;
    this.ammo = this.maxAmmo;
    this.isChordMode = chordMode; // Store chord mode state
  }

  // Update player position and state
  update(deltaTime) {
    // Smooth movement towards target position
    if (this.x !== this.targetX) {
      const dx = this.targetX - this.x;
      this.x += dx * this.moveSpeed * (deltaTime / 16);

      // Snap to target if very close
      if (Math.abs(dx) < 0.1) {
        this.x = this.targetX;
      }
    }
  }

  // Reset player to initial state
  reset(chordMode = null) {
    // Scale vertical position based on canvas height
    const positionScale = this.canvasHeight / this.referenceHeight;

    // Reset position
    this.x = this.canvasWidth / 2 - this.width / 2;
    this.baseY = this.canvasHeight - 100 * positionScale;
    this.y = this.baseY;
    this.targetX = this.x;

    // Update shield position
    this.shieldHeight = 30 * positionScale;
    this.shieldY = this.y - this.shieldHeight;

    // Update chord mode if provided
    if (chordMode !== null) {
      this.isChordMode = chordMode;
      this.ammo = this.maxAmmo;
    }

    // Reset ammo
    this.ammo = this.maxAmmo;
  }

  hasAmmo() {
    return this.ammo > 0;
  }

  // Draw player and shield
  draw(ctx) {
    // Draw shield (rectangular touchdown zone style)
    const shieldWidth = this.canvasWidth * 0.975; // 97.5% of canvas width - expanded to catch more enemies
    const shieldX = (this.canvasWidth - shieldWidth) / 2;

    // Make sure coordinates are valid numbers
    const startY = this.shieldY;
    const endY = this.shieldY + this.shieldHeight;

    // Default fill style in case gradient creation fails
    ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';

    // Check for NaN or Infinity values
    if (isFinite(startY) && isFinite(endY)) {
      try {
        // Create gradient that becomes more transparent as it goes deeper
        const gradient = ctx.createLinearGradient(0, startY, 0, endY);
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.5)'); // More visible at top
        gradient.addColorStop(0.3, 'rgba(0, 255, 255, 0.3)');
        gradient.addColorStop(0.7, 'rgba(0, 255, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0.1)'); // More transparent at bottom

        ctx.fillStyle = gradient;
      } catch (e) {
        utils.error('Shield gradient error:', e.message);
        // Keep the default fill style set above
      }
    }

    // Draw rectangular shield with rounded corners
    try {
      // Make sure all coordinates are valid numbers
      if (isFinite(shieldX) && isFinite(shieldWidth) && isFinite(this.shieldY) && isFinite(this.shieldHeight)) {
        const cornerRadius = 10;
        ctx.beginPath();
        ctx.moveTo(shieldX + cornerRadius, this.shieldY);
        ctx.lineTo(shieldX + shieldWidth - cornerRadius, this.shieldY);
        ctx.quadraticCurveTo(shieldX + shieldWidth, this.shieldY, shieldX + shieldWidth, this.shieldY + cornerRadius);
        ctx.lineTo(shieldX + shieldWidth, this.shieldY + this.shieldHeight - cornerRadius);
        ctx.quadraticCurveTo(shieldX + shieldWidth, this.shieldY + this.shieldHeight, shieldX + shieldWidth - cornerRadius, this.shieldY + this.shieldHeight);
        ctx.lineTo(shieldX + cornerRadius, this.shieldY + this.shieldHeight);
        ctx.quadraticCurveTo(shieldX, this.shieldY + this.shieldHeight, shieldX, this.shieldY + this.shieldHeight - cornerRadius);
        ctx.lineTo(shieldX, this.shieldY + cornerRadius);
        ctx.quadraticCurveTo(shieldX, this.shieldY, shieldX + cornerRadius, this.shieldY);
        ctx.closePath();
        ctx.fill();
      } else {
        utils.error('Invalid shield coordinates');
      }
    } catch (e) {
      utils.error('Shield drawing error:', e.message);
    }

    // Draw shield grid lines for touchdown zone effect
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 1;

    try {
      // Make sure all coordinates are valid numbers
      if (isFinite(shieldX) && isFinite(shieldWidth) && isFinite(this.shieldY) && isFinite(this.shieldHeight)) {
        // Horizontal lines
        const lineCount = 5;
        const lineSpacing = this.shieldHeight / lineCount;

        for (let i = 1; i < lineCount; i++) {
          const y = this.shieldY + i * lineSpacing;

          if (isFinite(y)) {
            ctx.beginPath();
            ctx.moveTo(shieldX, y);
            ctx.lineTo(shieldX + shieldWidth, y);
            ctx.stroke();
          }
        }
      }
    } catch (e) {
      utils.error('Shield grid lines error:', e.message);
    }

    // Vertical center line
    try {
      const centerX = this.canvasWidth / 2;

      if (isFinite(centerX) && isFinite(this.shieldY) && isFinite(this.shieldHeight)) {
        ctx.beginPath();
        ctx.moveTo(centerX, this.shieldY);
        ctx.lineTo(centerX, this.shieldY + this.shieldHeight);
        ctx.stroke();
      }
    } catch (e) {
      utils.error('Vertical center line error:', e.message);
    }

    // Draw ship with more details
    // Create a gradient for the ship body
    const shipGradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
    shipGradient.addColorStop(0, '#00ffff');
    shipGradient.addColorStop(0.5, '#00ccff');
    shipGradient.addColorStop(1, '#0088ff');
    ctx.fillStyle = shipGradient;

    // Main ship body (slightly larger)
    ctx.beginPath();
    ctx.moveTo(this.x + this.width / 2, this.y - 5); // Pointed top, extend 5px higher
    ctx.lineTo(this.x + this.width + 5, this.y + this.height); // Wider base
    ctx.lineTo(this.x - 5, this.y + this.height); // Wider base
    ctx.closePath();
    ctx.fill();

    // Add a stroke outline
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Cockpit/windshield
    const cockpitGradient = ctx.createLinearGradient(
      this.x + this.width / 2, this.y + 5,
      this.x + this.width / 2, this.y + 15
    );
    cockpitGradient.addColorStop(0, '#88ffff');
    cockpitGradient.addColorStop(1, '#005f5f');
    ctx.fillStyle = cockpitGradient;

    ctx.beginPath();
    ctx.moveTo(this.x + this.width / 2, this.y + 5);
    ctx.lineTo(this.x + this.width / 2 + 12, this.y + 15);
    ctx.lineTo(this.x + this.width / 2 - 12, this.y + 15);
    ctx.closePath();
    ctx.fill();

    // Wing details
    ctx.fillStyle = '#005f5f';

    // Left wing
    ctx.beginPath();
    ctx.moveTo(this.x + 5, this.y + this.height - 15);
    ctx.lineTo(this.x - 8, this.y + this.height - 5);
    ctx.lineTo(this.x + 10, this.y + this.height - 5);
    ctx.closePath();
    ctx.fill();

    // Right wing
    ctx.beginPath();
    ctx.moveTo(this.x + this.width - 5, this.y + this.height - 15);
    ctx.lineTo(this.x + this.width + 8, this.y + this.height - 5);
    ctx.lineTo(this.x + this.width - 10, this.y + this.height - 5);
    ctx.closePath();
    ctx.fill();

    // Engine glow with animation
    const time = Date.now() / 200;
    const glowSize = 8 + Math.sin(time) * 3; // Pulsating effect

    // Create gradient for engine glow
    try {
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height + 5;

      // Ensure all values are finite and valid
      if (!isFinite(centerX) || !isFinite(centerY) || !isFinite(glowSize) || glowSize <= 0) {
        throw new Error('Invalid gradient parameters');
      }

      const engineGlow = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, glowSize
      );
      engineGlow.addColorStop(0, '#ffffff');
      engineGlow.addColorStop(0.4, '#ffff00');
      engineGlow.addColorStop(1, 'rgba(255, 100, 0, 0)');
      ctx.fillStyle = engineGlow;
    } catch (e) {
      utils.error('Engine glow error:', e.message);
      ctx.fillStyle = 'rgba(255, 100, 0, 0.5)'; // Fallback color
    }

    // Main engine
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2, this.y + this.height + 5, glowSize, 0, Math.PI * 2);
    ctx.fill();

    // Side thrusters
    const smallGlowSize = 4 + Math.sin(time + 1) * 2;

    // Left thruster
    ctx.beginPath();
    ctx.arc(this.x + 5, this.y + this.height, smallGlowSize, 0, Math.PI * 2);
    ctx.fill();

    // Right thruster
    ctx.beginPath();
    ctx.arc(this.x + this.width - 5, this.y + this.height, smallGlowSize, 0, Math.PI * 2);
    ctx.fill();
  }

  // Move to a specific x position (target for smooth movement)
  moveTo(x) {
    // Ensure player stays within canvas bounds
    this.targetX = Math.max(0, Math.min(this.canvasWidth - this.width, x - this.width / 2));
  }

  // DEBUG ONLY: Export player as a PNG image file
  exportAsImage(filename = 'player.png') {
    // Create a temporary canvas with the player's dimensions
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    const ctx = canvas.getContext('2d');

    // Save the current position and state
    const originalX = this.x;
    const originalY = this.y;
    const originalThrust = this.thrust;

    // Temporarily position at 0,0 for the export and set thrust to true to show engine glow
    this.x = 0;
    this.y = 0;
    this.thrust = true;

    // Draw the player on the temporary canvas
    this.draw(ctx);

    // Restore the original position and state
    this.x = originalX;
    this.y = originalY;
    this.thrust = originalThrust;

    // Create a download link for the image
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');

    // Trigger the download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return canvas; // Return the canvas in case it's needed for other purposes
  }

  // Check if a point is within the shield
  isPointInShield(x, y) {
    const shieldWidth = this.canvasWidth * 0.95; // 95% of canvas width - expanded to catch more enemies
    const shieldX = (this.canvasWidth - shieldWidth) / 2;

    // Check if point is within the rectangular shield
    return x >= shieldX &&
           x <= shieldX + shieldWidth &&
           y >= this.shieldY &&
           y <= this.shieldY + this.shieldHeight;
  }

  // Update player position and shield when window is resized
  updatePositions(canvasWidth, canvasHeight) {
    // Update canvas dimensions
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    // Recalculate position scale
    const positionScale = this.canvasHeight / this.referenceHeight;

    // Update vertical position
    this.baseY = this.canvasHeight - 100 * positionScale;
    this.y = this.baseY;

    // Keep player horizontally centered if at center, otherwise maintain relative position
    const centerX = this.canvasWidth / 2 - this.width / 2;
    if (Math.abs(this.x - (this.canvasWidth / 2 - this.width / 2)) < 5) {
      // If player is near center, keep it centered
      this.x = centerX;
      this.targetX = centerX;
    } else {
      // Maintain relative horizontal position
      const relativeX = this.x / (this.canvasWidth - this.width);
      this.x = relativeX * (this.canvasWidth - this.width);
      this.targetX = this.x;
    }

    // Update shield dimensions
    this.shieldHeight = 30 * positionScale;
    this.shieldY = this.y - this.shieldHeight;
  }
}
