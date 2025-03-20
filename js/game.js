/**
 * Game class for Space Invaders
 */

class Game {
  constructor(canvas) {
    // Canvas setup
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resizeCanvas();
    
    // Game state
    this.gameState = 'title'; // title, playing, gameOver, victory, waveTransition
    this.score = 0;
    this.highScore = utils.loadHighScore();
    this.wave = 1;
    this.health = 100;
    this.initialHealth = 100;
    this.wavesTotal = 5;
    this.pointsPerEnemy = 100;
    this.waveTransitionTime = 2000; // ms - reduced from 3000
    this.waveTransitionStart = 0;
    this.gameOverReason = ''; // Reason for game over
    
    // Game objects
    this.player = null;
    this.enemies = [];
    this.lasers = [];
    this.backgroundTime = 0; // Time for background animation
    
    // Background color schemes for different waves
    this.backgroundSchemes = [
      // Wave 1: Blue theme
      [
        { r: 0, g: 0, b: 30 },   // Deep blue at top
        { r: 10, g: 0, b: 50 },  // Blue-purple in middle
        { r: 30, g: 0, b: 70 }   // Purple at bottom
      ],
      // Wave 2: Green theme
      [
        { r: 0, g: 20, b: 20 },  // Dark teal at top
        { r: 0, g: 40, b: 30 },  // Teal in middle
        { r: 0, g: 60, b: 40 }   // Green at bottom
      ],
      // Wave 3: Red theme
      [
        { r: 30, g: 0, b: 10 },  // Dark red at top
        { r: 50, g: 0, b: 20 },  // Red in middle
        { r: 70, g: 10, b: 30 }  // Red-purple at bottom
      ],
      // Wave 4: Purple theme
      [
        { r: 20, g: 0, b: 30 },  // Dark purple at top
        { r: 40, g: 0, b: 60 },  // Purple in middle
        { r: 60, g: 20, b: 80 }  // Light purple at bottom
      ],
      // Wave 5+: Gold theme
      [
        { r: 30, g: 20, b: 0 },  // Dark gold at top
        { r: 60, g: 40, b: 0 },  // Gold in middle
        { r: 80, g: 60, b: 20 }  // Light gold at bottom
      ]
    ];
    
    // Current background colors (will be set based on wave)
    this.backgroundColors = this.backgroundSchemes[0];
    
    // MIDI note range - will be updated for each wave
    this.midiRange = {
      min: 48, // C3
      max: 84  // C6
    };
    
    // Get the actual MIDI device range to ensure we stay within bounds
    this.updateMidiDeviceRange();
    
    // MIDI note processing
    this.lastProcessedNotes = {};
    
    // Animation frame
    this.animationFrameId = null;
    this.lastFrameTime = 0;
    this.fps = 0;
    this.frameCount = 0;
    this.lastFpsUpdate = 0;
    
    // UI elements
    this.uiElements = {
      score: document.getElementById('score'),
      highScore: document.getElementById('high-score'),
      wave: document.getElementById('wave'),
      ammoBar: document.getElementById('ammo-bar'),
      healthBar: document.getElementById('health-bar'),
      fpsCounter: document.getElementById('fps-counter'),
      finalScore: document.getElementById('final-score'),
      victoryScore: document.getElementById('victory-score'),
      nextWave: document.getElementById('next-wave'),
      titleScreen: document.getElementById('title-screen'),
      gameOverScreen: document.getElementById('game-over-screen'),
      victoryScreen: document.getElementById('victory-screen'),
      waveTransition: document.getElementById('wave-transition')
    };
    
    // Bind methods
    this.init = this.init.bind(this);
    this.startGame = this.startGame.bind(this);
    this.gameLoop = this.gameLoop.bind(this);
    this.handleNoteOn = this.handleNoteOn.bind(this);
    this.handleNoteOff = this.handleNoteOff.bind(this);
    this.resizeCanvas = this.resizeCanvas.bind(this);
    this.startNextWave = this.startNextWave.bind(this);
    
    // Event listeners
    window.addEventListener('resize', this.resizeCanvas);
    document.getElementById('start-button').addEventListener('click', this.startGame);
    document.getElementById('restart-button').addEventListener('click', this.startGame);
    document.getElementById('play-again-button').addEventListener('click', this.startGame);
  }
  
  // Initialize the game
  init() {
    // Add MIDI event listeners
    window.midiController.addNoteOnListener(this.handleNoteOn);
    window.midiController.addNoteOffListener(this.handleNoteOff);
    
    // Update high score display
    this.uiElements.highScore.textContent = this.highScore;
    
    // Start game loop
    this.lastFrameTime = performance.now();
    this.gameLoop();
    
    console.log('Game initialized');
  }
  
  // Start a new game
  startGame() {
    // Reset game state
    this.gameState = 'playing';
    this.score = 0;
    this.wave = 1;
    this.health = this.initialHealth;
    this.lastProcessedNotes = {};
    
    // Reset to the first MIDI range scheme
    this.updateMidiRangeForWave();
    
    // Create player
    this.player = new Player(this.canvas.width, this.canvas.height);
    
    // Clear existing objects
    this.enemies = [];
    this.lasers = [];
    
    // Create enemies for first wave
    this.createEnemiesForWave();
    
    // Update UI
    this.updateUI();
    
    // Hide all screens
    this.uiElements.titleScreen.classList.add('hidden');
    this.uiElements.gameOverScreen.classList.add('hidden');
    this.uiElements.victoryScreen.classList.add('hidden');
    this.uiElements.waveTransition.classList.add('hidden');
    
    // Resume audio context
    window.soundController.resumeAudio();
    
    console.log('Game started');
  }
  
  // Create enemies for the current wave
  createEnemiesForWave() {
    // Clear existing enemies
    this.enemies = [];
    
    // Determine number of enemies based on wave
    const enemyCount = 5 + Math.min(this.wave - 1, 2);
    
    // Use the current MIDI range for this wave
    // The range should already be set to 3 octaves (36 notes) if possible
    const startNote = this.midiRange.min;
    const endNote = this.midiRange.max;
    
    // Create a set to track used notes
    const usedNotes = new Set();
    
    // Create enemies
    for (let i = 0; i < enemyCount; i++) {
      // Generate random note for each enemy, ensuring no duplicates
      let note;
      do {
        note = utils.randomInt(startNote, endNote);
      } while (usedNotes.has(note));
      
      // Add note to used notes set
      usedNotes.add(note);
      
      // Calculate x position based on note
      const x = utils.midiNoteToXPosition(note, this.canvas.width, startNote, endNote);
      
      // Random y position near the top with 20% more spread
      const y = utils.random(30, 180); // Increased from (50, 150)
      
      // Animation offset for variety
      const animationOffset = i * 0.2;
      
      this.enemies.push(new Enemy(x, y, note, animationOffset));
    }
  }
  
  // Main game loop
  gameLoop(timestamp) {
    // Calculate delta time
    if (!this.lastFrameTime) this.lastFrameTime = timestamp;
    const deltaTime = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;
    
    // Update FPS counter
    this.updateFPS(deltaTime);
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw gradient background instead of stars
    this.drawBackground(deltaTime);
    
    // Update and draw game objects based on game state
    if (this.gameState === 'playing') {
      this.updatePlaying(deltaTime);
    } else if (this.gameState === 'waveTransition') {
      this.updateWaveTransition(timestamp);
    }
    
    // Request next frame
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  }
  
  // Update game during playing state
  updatePlaying(deltaTime) {
    // Update player
    if (this.player) {
      this.player.update(deltaTime);
      this.player.draw(this.ctx);
    }
    
    // Update enemies
    let allEnemiesDead = true;
    this.enemies.forEach(enemy => {
      if (enemy.alive) {
        allEnemiesDead = false;
        enemy.update(deltaTime);
        
        // Check if enemy is touching the shield
        if (this.player) {
          // Check if any part of the enemy is inside the shield
          const enemyPoints = [
            { x: enemy.x, y: enemy.y }, // Top-left
            { x: enemy.x + enemy.width, y: enemy.y }, // Top-right
            { x: enemy.x, y: enemy.y + enemy.height }, // Bottom-left
            { x: enemy.x + enemy.width, y: enemy.y + enemy.height }, // Bottom-right
            { x: enemy.x + enemy.width / 2, y: enemy.y + enemy.height } // Bottom-center
          ];
          
          // Check if any point is inside the shield
          const touchingShield = enemyPoints.some(point => 
            this.player.isPointInShield(point.x, point.y)
          );
          
          if (touchingShield && !enemy.hasHitShield) {
            // Enemy touches shield - cause damage immediately (20% of health)
            this.health -= 20; // 20% of initial health (100)
            enemy.hitShield();
            enemy.die(); // Start death animation
            window.soundController.playEnemyShieldHitSound();
            window.soundController.playPlayerDamageSound();
            
            // Check if player is dead
            if (this.health <= 0) {
              this.gameOverReason = 'Your shield was destroyed by an enemy!';
              this.gameOver();
            }
          }
        }
        
        enemy.draw(this.ctx);
      }
    });
    
    // Update lasers
    this.lasers = this.lasers.filter(laser => {
      laser.update(deltaTime);
      laser.draw(this.ctx);
      return laser.active;
    });
    
    // Check if all enemies are dead
    if (allEnemiesDead && this.enemies.length > 0) {
      if (this.wave >= this.wavesTotal) {
        this.victory();
      } else {
        this.startWaveTransition();
      }
    }
    
    // Update UI
    this.updateUI();
  }
  
  // Update wave transition
  updateWaveTransition(timestamp) {
    // Check if transition is complete
    if (timestamp - this.waveTransitionStart >= this.waveTransitionTime) {
      this.startNextWave();
    }
  }
  
  // Start wave transition
  startWaveTransition() {
    this.gameState = 'waveTransition';
    this.waveTransitionStart = performance.now();
    this.wave++;
    
    // Update UI
    this.uiElements.nextWave.textContent = this.wave;
    this.uiElements.waveTransition.classList.remove('hidden');
    
    // Play sound
    window.soundController.playWaveCompleteSound();
  }
  
  // Start next wave
  startNextWave() {
    this.gameState = 'playing';
    
    // Update background colors based on wave
    const schemeIndex = Math.min(this.wave - 1, this.backgroundSchemes.length - 1);
    this.backgroundColors = this.backgroundSchemes[schemeIndex];
    
    // Update MIDI range based on wave
    this.updateMidiRangeForWave();
    
    this.createEnemiesForWave();
    
    // Hide transition screen
    this.uiElements.waveTransition.classList.add('hidden');
  }
  
  // Game over
  gameOver() {
    this.gameState = 'gameOver';
    
    // Update high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      utils.saveHighScore(this.highScore);
      this.uiElements.highScore.textContent = this.highScore;
    }
    
    // Update UI
    this.uiElements.finalScore.textContent = this.score;
    
    // Display game over reason
    if (!this.gameOverReason) {
      this.gameOverReason = 'You were defeated!';
    }
    document.getElementById('game-over-reason').textContent = this.gameOverReason;
    
    this.uiElements.gameOverScreen.classList.remove('hidden');
    
    // Play sound
    window.soundController.playGameOverSound();
  }
  
  // Victory
  victory() {
    this.gameState = 'victory';
    
    // Store the base score before adding bonus
    const baseScore = this.score;
    
    // Add bonus points for leftover ammo
    const ammoBonus = this.player.ammo * 50; // 50 points per leftover ammo
    this.score += ammoBonus;
    
    // Add bonus points for leftover health
    const healthBonus = Math.round(this.health * 10); // 10 points per health point
    this.score += healthBonus;
    
    // Update high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      utils.saveHighScore(this.highScore);
      this.uiElements.highScore.textContent = this.highScore;
    }
    
    // Update UI
    document.getElementById('base-score').textContent = baseScore;
    document.getElementById('ammo-bonus').textContent = ammoBonus;
    document.getElementById('health-bonus').textContent = healthBonus;
    this.uiElements.victoryScore.textContent = this.score;
    this.uiElements.victoryScreen.classList.remove('hidden');
    
    // Play sound
    window.soundController.playVictorySound();
  }
  
  // Handle MIDI note on event
  handleNoteOn(note, velocity) {
    // Only process if in playing state
    if (this.gameState !== 'playing' || !this.player) return;
    
    // Prevent duplicate processing (some MIDI devices send multiple note on events)
    if (this.lastProcessedNotes[note] && performance.now() - this.lastProcessedNotes[note] < 100) {
      return;
    }
    
    // Record processing time
    this.lastProcessedNotes[note] = performance.now();
    
    // Try to fire
    if (this.player.fire()) {
      // Find matching enemy
      const matchingEnemy = this.enemies.find(enemy => enemy.alive && enemy.matchesNote(note));
      
      // Calculate target position
      let targetX, targetY;
      let hit = false;
      
      if (matchingEnemy) {
        // Hit enemy
        targetX = matchingEnemy.x + matchingEnemy.width / 2;
        targetY = matchingEnemy.y + matchingEnemy.height / 2;
        hit = true;
      } else {
        // Miss - target position based on note
        targetX = utils.midiNoteToXPosition(note, this.canvas.width, this.midiRange.min, this.midiRange.max);
        targetY = 100;
      }
      
      // Move player to note position first
      this.player.moveTo(targetX);
      
      // Store the necessary data for firing after movement
      const firingData = {
        targetX,
        targetY,
        hit,
        matchingEnemy,
        timestamp: performance.now()
      };
      
      // Set a short timeout to fire after player has moved
      setTimeout(() => {
        // Only proceed if still in playing state
        if (this.gameState !== 'playing') return;
        
        // Create laser from current player position (now that it's moved)
        const laser = new Laser(
          this.player.x + this.player.width / 2,
          this.player.y,
          firingData.targetX,
          firingData.targetY
        );
        
        if (firingData.hit && firingData.matchingEnemy && firingData.matchingEnemy.alive) {
          // Mark enemy as hit
          firingData.matchingEnemy.hit();
          
          // Start death animation
          firingData.matchingEnemy.die();
          
          // Add score
          this.score += this.pointsPerEnemy;
          
          // Play sound
          window.soundController.playEnemyDestroyedSound();
          
          // Mark laser as hit
          laser.markHit();
          window.soundController.playLaserHitSound();
        } else if (!firingData.hit) {
          // Play miss sound
          window.soundController.playLaserMissSound();
        }
        
        // Add laser
        this.lasers.push(laser);
      }, 100); // 100ms delay to allow player to move first
      
      // Check if out of ammo
      if (this.player.ammo <= 0) {
        this.gameOverReason = 'You ran out of ammo!';
        this.gameOver();
      }
    }
  }
  
  // Handle MIDI note off event
  handleNoteOff(note) {
    // Clear from processed notes
    delete this.lastProcessedNotes[note];
  }
  
  // Update UI elements
  updateUI() {
    if (this.uiElements.score) this.uiElements.score.textContent = this.score;
    if (this.uiElements.wave) this.uiElements.wave.textContent = this.wave;
    
    // Update ammo bar
    if (this.player) {
      const ammoPercent = (this.player.ammo / this.player.maxAmmo) * 100;
      const ammoBar = document.getElementById('ammo-bar');
      if (ammoBar) {
        ammoBar.style.width = `${ammoPercent}%`;
      }
      
      // Update ammo value text
      const ammoValue = document.getElementById('ammo-value');
      if (ammoValue) {
        ammoValue.textContent = this.player.ammo;
      }
    }
    
    // Update health bar
    if (this.uiElements.healthBar) {
      const healthPercent = (this.health / this.initialHealth) * 100;
      this.uiElements.healthBar.style.width = `${healthPercent}%`;
      
      // Update health value text
      document.getElementById('health-value').textContent = Math.round(this.health);
      
      // Change color based on health
      if (healthPercent > 60) {
        this.uiElements.healthBar.style.backgroundColor = '#0f0';
      } else if (healthPercent > 30) {
        this.uiElements.healthBar.style.backgroundColor = '#ff0';
      } else {
        this.uiElements.healthBar.style.backgroundColor = '#f00';
      }
    }
  }
  
  // Update FPS counter
  updateFPS(deltaTime) {
    this.frameCount++;
    
    // Update FPS every 500ms
    if (performance.now() - this.lastFpsUpdate > 500) {
      this.fps = Math.round(this.frameCount / ((performance.now() - this.lastFpsUpdate) / 1000));
      this.uiElements.fpsCounter.textContent = `FPS: ${this.fps}`;
      
      this.lastFpsUpdate = performance.now();
      this.frameCount = 0;
    }
  }
  
  // Resize canvas to fill window
  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  // Update MIDI range based on the current wave
  updateMidiRangeForWave() {
    // Get the device's MIDI range
    const deviceRange = window.midiController.getMidiRange();
    
    // Calculate the available range for starting notes
    // We need at least 36 semitones (3 octaves) above the starting note
    const availableRange = deviceRange.max - deviceRange.min - 36;
    
    if (availableRange < 0) {
      // If the device range is less than 36 semitones, use the entire range
      this.midiRange = {
        min: deviceRange.min,
        max: deviceRange.max
      };
    } else {
      // Randomly select a starting note within the available range
      // Use the wave number as a seed for variety between waves
      const waveOffset = (this.wave - 1) * 5 % availableRange; // Shift by 5 semitones per wave, wrap around
      const randomOffset = utils.randomInt(0, Math.min(12, availableRange)); // Add some randomness, but not too much
      
      // Combine the wave-based offset with some randomness
      const startingOffset = (waveOffset + randomOffset) % (availableRange + 1);
      
      // Set the MIDI range
      this.midiRange = {
        min: deviceRange.min + startingOffset,
        max: deviceRange.min + startingOffset + 36 // 3 octaves above the min
      };
    }
    
    console.log(`Wave ${this.wave} MIDI range: ${this.midiRange.min} (${utils.midiNoteToName(this.midiRange.min)}) - ${this.midiRange.max} (${utils.midiNoteToName(this.midiRange.max)})`);
  }
  
  // Update the MIDI device range
  updateMidiDeviceRange() {
    // Get the range from the MIDI controller
    const deviceRange = window.midiController.getMidiRange();
    
    // Set initial MIDI range based on device capabilities
    if (deviceRange.max - deviceRange.min >= 36) {
      // If device has at least 3 octaves, use middle 3 octaves
      const center = Math.floor((deviceRange.min + deviceRange.max) / 2);
      this.midiRange = {
        min: Math.max(deviceRange.min, center - 18),
        max: Math.min(deviceRange.max, center + 18)
      };
    } else {
      // Use the entire device range if it's less than 3 octaves
      this.midiRange = {
        min: deviceRange.min,
        max: deviceRange.max
      };
    }
    
    console.log(`MIDI device range: ${deviceRange.min} (${utils.midiNoteToName(deviceRange.min)}) - ${deviceRange.max} (${utils.midiNoteToName(deviceRange.max)})`);
  }
  
  // Draw animated background
  drawBackground(deltaTime) {
    // Update background animation time
    this.backgroundTime += deltaTime * 0.0001;
    if (this.backgroundTime > 1) this.backgroundTime -= 1;
    
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Create gradient
    const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
    
    // Add color stops using the current background colors
    const top = this.backgroundColors[0];
    const middle = this.backgroundColors[1];
    const bottom = this.backgroundColors[2];
    
    gradient.addColorStop(0, `rgb(${top.r}, ${top.g}, ${top.b})`);
    gradient.addColorStop(0.5, `rgb(${middle.r}, ${middle.g}, ${middle.b})`);
    gradient.addColorStop(1, `rgb(${bottom.r}, ${bottom.g}, ${bottom.b})`);
    
    // Fill background
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);
    
    // Draw some 'stars' as simple dots
    this.ctx.fillStyle = '#fff';
    
    // Draw fixed stars (don't move)
    for (let i = 0; i < 200; i++) {
      // Use prime numbers to get better distribution
      const x = width * ((i * 13) % 97) / 97;
      const y = height * ((i * 17) % 89) / 89;
      const size = 1 + (i % 3);
      
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Draw animated stars (twinkle)
    for (let i = 0; i < 100; i++) {
      // Use prime numbers for better distribution
      const x = width * ((i * 23) % 101) / 101;
      const y = height * ((i * 29) % 103) / 103;
      
      // Calculate size with time-based twinkle effect
      const twinkle = 0.5 + 0.5 * Math.sin(this.backgroundTime * 10 + i * 0.3);
      const size = 1.5 + twinkle * 2.5;
      
      // Draw star with glow
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Add glow for all stars, stronger for larger ones
      try {
        // Choose a color based on position (to add variety)
        const colorIndex = (i % 5);
        let starColor;
        
        switch(colorIndex) {
          case 0: starColor = 'rgba(255, 255, 255, 0.9)'; break; // White
          case 1: starColor = 'rgba(200, 200, 255, 0.9)'; break; // Bluish
          case 2: starColor = 'rgba(255, 200, 200, 0.9)'; break; // Reddish
          case 3: starColor = 'rgba(200, 255, 200, 0.9)'; break; // Greenish
          case 4: starColor = 'rgba(255, 255, 200, 0.9)'; break; // Yellowish
        }
        
        const glowSize = size * (3 + (i % 3));
        const glow = this.ctx.createRadialGradient(x, y, 0, x, y, glowSize);
        glow.addColorStop(0, starColor);
        glow.addColorStop(0.5, starColor.replace('0.9', '0.5'));
        glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        this.ctx.fillStyle = glow;
        this.ctx.beginPath();
        this.ctx.arc(x, y, glowSize, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#fff';
      } catch (e) {
        console.log('Glow error:', e.message);
      }
    }
  }
}

// Export Game class
window.Game = Game;
