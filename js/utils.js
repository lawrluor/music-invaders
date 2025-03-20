/**
 * Utility functions for the game
 */

const utils = {
  // Create a random number between min and max
  random: function(min, max) {
    return Math.random() * (max - min) + min;
  },
  
  // Create a random integer between min and max (inclusive)
  randomInt: function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  
  // Convert MIDI note number to frequency
  midiNoteToFrequency: function(note) {
    return 440 * Math.pow(2, (note - 69) / 12);
  },
  
  // Convert MIDI note number to note name
  midiNoteToName: function(note) {
    // Define sharp and flat note names
    const sharpNoteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const flatNoteNames = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    
    const octave = Math.floor(note / 12) - 1;
    const noteIndex = note % 12;
    
    // For notes that have sharps, randomly choose between sharp and flat notation
    // Notes with sharps are at indices 1, 3, 6, 8, 10
    let noteName;
    if ([1, 3, 6, 8, 10].includes(noteIndex) && Math.random() < 0.5) {
      // Use flat notation (which is the next note's flat)
      noteName = flatNoteNames[noteIndex];
    } else {
      // Use sharp notation
      noteName = sharpNoteNames[noteIndex];
    }
    
    return noteName + octave;
  },
  
  // Calculate x position based on MIDI note
  midiNoteToXPosition: function(note, canvasWidth, minNote, maxNote) {
    // Ensure note is within the range
    note = Math.max(minNote, Math.min(maxNote, note));
    
    // Calculate position based on note range
    const range = maxNote - minNote;
    const position = (note - minNote) / range;
    
    // Add some padding on the sides
    const padding = canvasWidth * 0.1;
    return padding + position * (canvasWidth - 2 * padding);
  },
  
  // Create stars for background
  createStars: function(count) {
    const stars = [];
    const starColors = [
      '#ffffff', // White
      '#ffffdd', // Warm white
      '#ddddff', // Cool white
      '#ffdddd', // Reddish
      '#ddffff', // Bluish
      '#ffff99', // Bright yellow
      '#99ffff', // Bright cyan
      '#ff99ff'  // Bright magenta
    ];
    
    for (let i = 0; i < count; i++) {
      // Determine if this is a regular star or a special effect star
      const isSpecialStar = Math.random() < 0.6; // 60% chance for special stars (significantly increased)
      const isExtraSpecial = isSpecialStar && Math.random() < 0.4; // More extra special stars
      
      stars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 3.5 + (isSpecialStar ? 3.5 : 2.0), // Much larger stars overall
        speed: Math.random() * 0.03 + 0.01, // Slightly faster movement
        color: starColors[Math.floor(Math.random() * starColors.length)],
        twinkle: {
          active: Math.random() < 0.8, // 80% of stars twinkle (increased)
          phase: Math.random() * Math.PI * 2, // Random starting phase
          speed: 0.005 + Math.random() * 0.02, // Increased twinkle speed variation
          min: isSpecialStar ? 0.5 : 0.7, // Higher minimum opacity for better visibility
          max: 1.0 // Maximum opacity
        },
        trail: isSpecialStar && Math.random() < 0.5, // More stars have trails
        pulse: isExtraSpecial, // Some stars pulse in size
        pulseSpeed: 0.05 + Math.random() * 0.05,
        pulsePhase: Math.random() * Math.PI * 2
      });
    }
    return stars;
  },
  
  // Update and draw stars
  updateStars: function(stars, ctx, deltaTime) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const dt = deltaTime / 16; // Normalize for 60fps
    
    stars.forEach(star => {
      // Update position
      star.y += star.speed * dt;
      
      // Wrap around if off screen
      if (star.y > 1) {
        star.y = 0;
        star.x = Math.random();
        // Randomize trail property for recycled stars
        if (star.twinkle.active) {
          star.trail = Math.random() < 0.3;
        }
      }
      
      // Update twinkle effect
      if (star.twinkle.active) {
        star.twinkle.phase += star.twinkle.speed * dt;
        if (star.twinkle.phase > Math.PI * 2) {
          star.twinkle.phase -= Math.PI * 2;
        }
      }
      
      // Update pulse effect
      if (star.pulse) {
        star.pulsePhase += star.pulseSpeed * dt;
        if (star.pulsePhase > Math.PI * 2) {
          star.pulsePhase -= Math.PI * 2;
        }
      }
      
      // Calculate opacity based on twinkle - always keep high opacity
      const opacity = star.twinkle.active
        ? 0.7 + (Math.sin(star.twinkle.phase) + 1) / 2 * 0.3 // Minimum opacity of 0.7
        : 1.0;
      
      // Draw trail if enabled
      if (star.trail) {
        // Make sure coordinates are valid numbers
        const startX = star.x * width;
        const startY = star.y * height;
        const endX = startX;  // Same x-coordinate for vertical trail
        const endY = (star.y - 0.03) * height;
        
        // Check for NaN or Infinity values
        if (isFinite(startX) && isFinite(startY) && isFinite(endX) && isFinite(endY)) {
          try {
            const gradient = ctx.createLinearGradient(
              startX, startY, endX, endY
            );
            gradient.addColorStop(0, star.color);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.beginPath();
            ctx.strokeStyle = gradient;
            ctx.lineWidth = star.size / 2;
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
          } catch (e) {
            // Skip trail if gradient fails
            console.log('Trail gradient error:', e.message);
          }
        }
      }
      
      // Draw star
      ctx.globalAlpha = opacity;
      ctx.fillStyle = star.color;
      
      // Calculate size with pulse effect if enabled
      let currentSize = star.size;
      if (star.pulse) {
        const pulseFactor = 0.3 + (Math.sin(star.pulsePhase) + 1) / 2 * 0.7;
        currentSize = star.size * (1 + pulseFactor * 0.5);
      }
      
      // Draw larger stars with a glow effect
      if (star.size > 2) {
        // Make sure coordinates are valid numbers
        const starX = star.x * width;
        const starY = star.y * height;
        const glowRadius = star.size * 3;
        
        // Check for NaN or Infinity values
        if (isFinite(starX) && isFinite(starY) && isFinite(glowRadius)) {
          // Outer glow
          try {
            const glow = ctx.createRadialGradient(
              starX, starY, 0,
              starX, starY, glowRadius
            );
            glow.addColorStop(0, star.color);
            glow.addColorStop(0.5, star.color.replace(')', ', 0.5)').replace('rgb', 'rgba'));
            glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.globalAlpha = opacity * 0.8; // Increased opacity for better visibility
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(
              starX,
              starY,
              glowRadius,
              0,
              Math.PI * 2
            );
            ctx.fill();
            ctx.globalAlpha = opacity; // Reset alpha
          } catch (e) {
            // Fallback to simple star if gradient fails
            console.log('Gradient error:', e.message);
          }
        }
        
        // Inner star - brighter color
        // Make the star color brighter
        const brighterColor = star.color.startsWith('#') 
          ? star.color // Keep hex colors as is
          : star.color.replace('rgb', 'rgba').replace(')', ', 1)'); // Ensure full opacity
        
        ctx.fillStyle = brighterColor;
      }
      
      // Make sure coordinates are valid numbers
      const mainStarX = star.x * width;
      const mainStarY = star.y * height;
      const mainStarSize = currentSize;
      
      // Check for NaN or Infinity values
      if (isFinite(mainStarX) && isFinite(mainStarY) && isFinite(mainStarSize) && mainStarSize > 0) {
        try {
          ctx.beginPath();
          ctx.arc(
            mainStarX,
            mainStarY,
            mainStarSize,
            0,
            Math.PI * 2
          );
          ctx.fill();
          
          // Add a subtle stroke around the star for better visibility
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        } catch (e) {
          console.log('Star drawing error:', e.message);
        }
      }
      
      // Reset opacity
      ctx.globalAlpha = 1.0;
    });
  },
  
  // Easing function for smooth animations
  easeOutQuad: function(t) {
    return t * (2 - t);
  },
  
  // Easing function for smooth animations
  easeInOutQuad: function(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  },
  
  // Save high score to local storage
  saveHighScore: function(score) {
    const currentHighScore = localStorage.getItem('midiSpaceInvadersHighScore') || 0;
    if (score > currentHighScore) {
      localStorage.setItem('midiSpaceInvadersHighScore', score);
      return true;
    }
    return false;
  },
  
  // Load high score from local storage
  loadHighScore: function() {
    return parseInt(localStorage.getItem('midiSpaceInvadersHighScore') || 0);
  },
  
  // Save last selected MIDI device
  saveLastMidiDevice: function(deviceId) {
    localStorage.setItem('midiSpaceInvadersLastDevice', deviceId);
  },
  
  // Load last selected MIDI device
  loadLastMidiDevice: function() {
    return localStorage.getItem('midiSpaceInvadersLastDevice') || '';
  }
};
